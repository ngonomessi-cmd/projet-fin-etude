import Link from "next/link";
import { notFound } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { Badge } from "@/components/Badge";
import { COULEUR_CLASSIFICATION, ROLES_PRODUCTEURS, libelleAction, libelleNature, libelles, statutAffiche } from "@/lib/labels";
import { LABEL_FORMAT_COURT, libelleFormat } from "@/lib/atelier/contenus";
import { traducteurDepartements, traductionServeur } from "@/lib/i18n/serveur";
import type { Document, EntreeAudit, PartageDocument, Profil } from "@/lib/types";
import { BoutonsTransition } from "./BoutonsTransition";
import { PanneauPartage, type ConversationPubliable, type PersonneContactable } from "./PanneauPartage";
import { ActionsCycleVie, ChoixNature, ControleIntegrite } from "./PanneauCycleVie";

function dateLongue(iso: string | null | undefined, dl: string) {
  return iso ? new Date(iso).toLocaleString(dl, { dateStyle: "long", timeStyle: "short" }) : "—";
}

export default async function PageDetailDocument({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await creerClientServeur();
  const { langue, t, dl } = await traductionServeur();
  const dep = await traducteurDepartements();
  const L = libelles(langue);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profilData } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const profil = profilData as Profil;

  // Si le document n'est pas (ou plus) visible pour ce rôle/département, la
  // policy RLS "lecture_documents_selon_classification_et_role" renvoie tout
  // simplement aucune ligne : indistinguable, côté client, d'un id inexistant.
  const { data: documentData } = await supabase.from("documents").select("*").eq("id", id).single();
  const document = documentData as Document | null;
  if (!document) notFound();

  let urlTelechargement: string | null = null;
  if (document.storage_path) {
    const { data } = await supabase.storage.from("documents-ged").createSignedUrl(document.storage_path, 60 * 5);
    urlTelechargement = data?.signedUrl ?? null;
  }

  const [{ data: auditData }, { data: partagesData }, { data: peutEditer }, { data: coEditeur }] = await Promise.all([
    supabase.from("audit_log").select("*").eq("document_id", id).order("created_at", { ascending: false }),
    supabase.rpc("lister_partages_document", { p_document_id: id }),
    supabase.rpc("peut_editer_document", { p_document_id: id }),
    supabase.rpc("partage_avec_moi", { p_document_id: id, p_edition: true }),
  ]);
  const audit = (auditData ?? []) as EntreeAudit[];
  const partages = (partagesData ?? []) as PartageDocument[];

  const estProprietaire = document.owner_id === user!.id;
  const meDepartement = profil.departement === document.departement;
  const producteur = ROLES_PRODUCTEURS.includes(profil.role);
  const peutPartager = producteur && (estProprietaire || profil.role === "administrateur" || Boolean(coEditeur));
  const archive = Boolean(document.archive_le);
  const statut = statutAffiche(document, langue);
  const valideurDuDepartement = profil.role === "administrateur" || (profil.role === "validateur" && meDepartement);

  // Mêmes règles que les fonctions classer_document, archiver_document et
  // nouvelle_version_document (migration 0024), qui les revérifient.
  const peutClasser =
    !archive &&
    ((estProprietaire && (document.statut === "brouillon" || document.statut === "rejete")) ||
      profil.role === "administrateur" ||
      (profil.role === "validateur" && meDepartement && document.statut !== "brouillon"));
  const peutArchiver = document.statut === "publie" && !archive && valideurDuDepartement;
  const peutReviser =
    document.statut === "publie" && producteur && (estProprietaire || profil.role === "administrateur" || meDepartement);

  // Filiation des versions (seules les versions lisibles par ce compte remontent).
  const [{ data: precedenteData }, { data: suivantesData }, { data: archivisteData }] = await Promise.all([
    document.version_precedente_id
      ? supabase.from("documents").select("id, reference, version").eq("id", document.version_precedente_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("documents").select("id, reference, version, statut").eq("version_precedente_id", document.id).order("version"),
    document.archive_par
      ? supabase.from("profiles").select("nom_complet").eq("id", document.archive_par).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const precedente = precedenteData as { id: string; reference: string; version: number } | null;
  const suivantes = (suivantesData ?? []) as { id: string; reference: string; version: number }[];
  const archiviste = (archivisteData as { nom_complet: string } | null)?.nom_complet;

  // Destinataires possibles : même règle que l'ouverture d'une conversation
  // (revérifiée par la base au moment du partage).
  let personnes: PersonneContactable[] = [];
  let conversations: ConversationPubliable[] = [];
  if (peutPartager) {
    const [{ data: profils }, { data: participations }] = await Promise.all([
      supabase.from("profiles").select("id, nom_complet, departement, role").neq("id", user!.id).order("nom_complet"),
      supabase
        .from("conversation_participants")
        .select("conversations(id, type, titre, departement, canal_general)")
        .eq("profil_id", user!.id)
        .eq("peut_publier", true),
    ]);
    personnes = ((profils ?? []) as PersonneContactable[]).filter((p) => {
      if (p.role === "administrateur" && profil.role === "redacteur") return false;
      if (document.classification === "confidentiel" && p.departement !== document.departement) return false;
      return true;
    });
    type Conv = { id: string; type: string; titre: string | null; departement: string | null; canal_general: boolean };
    conversations = ((participations ?? []) as unknown as { conversations: Conv | null }[])
      .map((p) => p.conversations)
      .filter((c): c is Conv => !!c && c.type !== "privee")
      .map((c) => ({
        id: c.id,
        libelle:
          c.type === "canal"
            ? c.canal_general
              ? t("Canal : toute l'organisation", "Channel: whole organisation")
              : `${t("Canal", "Channel")} : ${dep(c.titre ?? c.departement)}`
            : `${t("Groupe", "Group")} : ${c.titre ?? t("sans titre", "untitled")}`,
      }));
  }

  const verrouActif =
    document.verrou_par && document.verrou_jusqua && new Date(document.verrou_jusqua) > new Date() && document.verrou_par !== user!.id;
  let nomVerrou: string | null = null;
  if (verrouActif) {
    const { data } = await supabase.from("profiles").select("nom_complet").eq("id", document.verrou_par!).maybeSingle();
    nomVerrou = data?.nom_complet ?? t("une autre personne", "someone else");
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <Link href="/documents" className="mb-4 inline-block text-sm text-paper-muted hover:text-gold-600 hover:underline">
            ← {t("Retour à la liste", "Back to the list")}
          </Link>

          <div className="rounded-lg border border-paper-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-1 font-mono text-xs text-paper-soft">
                  {document.reference}
                  {document.version > 1 && ` · version ${document.version}`}
                </p>
                <h1 className="font-serif text-xl font-semibold">{document.titre}</h1>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Badge texte={L.classification[document.classification]} classesCouleur={COULEUR_CLASSIFICATION[document.classification]} />
                <Badge texte={statut.texte} classesCouleur={statut.couleur} />
              </div>
            </div>

            {archive && (
              <p className="mb-4 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
                {document.archive_auto
                  ? t("Document archivé automatiquement le ", "Document automatically archived on ")
                  : t("Document archivé le ", "Document archived on ")}
                {dateLongue(document.archive_le, dl)}
                {t(
                  " : lecture seule définitive. Pour le faire évoluer, créez-en une nouvelle version.",
                  ": permanently read-only. To change it, create a new version."
                )}
              </p>
            )}
            {estProprietaire && document.statut === "brouillon" && (
              <p className="mb-4 rounded-md border border-paper-200 bg-paper-50 px-3 py-2 text-sm text-paper-muted">
                {t(
                  "Brouillon privé : vous seul le voyez, ainsi que les personnes avec qui vous le partagez. Il ne sera visible plus largement qu'après validation et publication.",
                  "Private draft: only you can see it, plus the people you share it with. It becomes more widely visible only after approval and publication."
                )}
              </p>
            )}

            {document.description && <p className="mb-4 text-sm text-paper-muted">{document.description}</p>}

            <dl className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm text-[#1c2029]">
              <dt className="text-paper-soft">{t("Nature", "Document type")}</dt>
              <dd>
                {peutClasser ? <ChoixNature documentId={document.id} nature={document.nature} /> : libelleNature(document.nature, langue)}
              </dd>
              <dt className="text-paper-soft">Format</dt>
              <dd>
                {document.format_atelier
                  ? `${libelleFormat(document.format_atelier, langue)} — ${t("rédigé dans la plateforme", "written in the platform")}`
                  : t("Fichier déposé", "Uploaded file")}
              </dd>
              <dt className="text-paper-soft">{t("Département", "Department")}</dt>
              <dd>{dep(document.departement)}</dd>
              <dt className="text-paper-soft">{t("Créé le", "Created")}</dt>
              <dd>{new Date(document.created_at).toLocaleString(dl)}</dd>
              <dt className="text-paper-soft">{t("Dernière mise à jour", "Last updated")}</dt>
              <dd>{new Date(document.updated_at).toLocaleString(dl)}</dd>
              {(precedente || suivantes.length > 0 || document.version > 1) && (
                <>
                  <dt className="text-paper-soft">Versions</dt>
                  <dd className="flex flex-wrap gap-x-3 gap-y-1">
                    {precedente && (
                      <Link href={`/documents/${precedente.id}`} className="text-gold-600 hover:underline">
                        ← v{precedente.version} ({precedente.reference})
                      </Link>
                    )}
                    <span className="font-semibold">v{document.version} ({t("celle-ci", "this one")})</span>
                    {suivantes.map((v) => (
                      <Link key={v.id} href={`/documents/${v.id}`} className="text-gold-600 hover:underline">
                        v{v.version} ({v.reference}) →
                      </Link>
                    ))}
                  </dd>
                </>
              )}
              {document.publie_le && (
                <>
                  <dt className="text-paper-soft">{t("Publié le", "Published")}</dt>
                  <dd>{dateLongue(document.publie_le, dl)}</dd>
                </>
              )}
              {archive && (
                <>
                  <dt className="text-paper-soft">{t("Archivé le", "Archived")}</dt>
                  <dd>
                    {dateLongue(document.archive_le, dl)}
                    {document.archive_auto
                      ? t(" — automatiquement", " — automatically")
                      : archiviste
                        ? ` — ${t("par", "by")} ${archiviste}`
                        : ""}
                  </dd>
                  <dt className="text-paper-soft">{t("Conservation", "Retention")}</dt>
                  <dd>
                    {document.fin_conservation
                      ? `${t("Jusqu'au", "Until")} ${new Date(document.fin_conservation).toLocaleDateString(dl, { dateStyle: "long" })}`
                      : t("Permanente", "Permanent")}
                  </dd>
                  {document.empreinte_sha256 && (
                    <>
                      <dt className="text-paper-soft">{t("Empreinte SHA-256", "SHA-256 fingerprint")}</dt>
                      <dd>
                        <ControleIntegrite documentId={document.id} empreinte={document.empreinte_sha256} />
                      </dd>
                    </>
                  )}
                </>
              )}
            </dl>

            {verrouActif && (
              <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {t("En cours de modification par", "Currently being edited by")} {nomVerrou}.
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {document.format_atelier && (
                <>
                  <Link
                    href={`/documents/${document.id}/editer`}
                    className="rounded-md bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900"
                  >
                    {peutEditer ? t("Ouvrir dans l'éditeur", "Open in the editor") : t("Consulter", "View")}
                  </Link>
                  <a
                    href={`/documents/${document.id}/export?format=natif`}
                    className="rounded-md border border-paper-200 px-4 py-2 text-sm font-medium text-[#1c2029] hover:bg-paper-50"
                  >
                    ⬇ {LABEL_FORMAT_COURT[document.format_atelier]}
                  </a>
                  <a
                    href={`/documents/${document.id}/export?format=pdf`}
                    className="rounded-md border border-paper-200 px-4 py-2 text-sm font-medium text-[#1c2029] hover:bg-paper-50"
                  >
                    ⬇ PDF
                  </a>
                </>
              )}
              {urlTelechargement && (
                <a
                  href={urlTelechargement}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-paper-200 px-4 py-2 text-sm font-medium text-[#1c2029] hover:bg-paper-50"
                >
                  {t("Télécharger le fichier (lien signé, valable 5 minutes)", "Download the file (signed link, valid 5 minutes)")}
                </a>
              )}
            </div>

            <BoutonsTransition
              documentId={document.id}
              statutActuel={document.statut}
              role={profil.role}
              estProprietaire={estProprietaire}
              meDepartement={meDepartement}
            />

            <ActionsCycleVie documentId={document.id} peutArchiver={peutArchiver} peutReviser={peutReviser} archive={archive} />
          </div>

          {(peutPartager || partages.length > 0) && (
            <PanneauPartage
              documentId={document.id}
              peutPartager={peutPartager}
              peutJoindrePdf={Boolean(document.format_atelier)}
              lectureSeule={archive || (document.statut !== "brouillon" && document.statut !== "rejete")}
              confidentiel={document.classification === "confidentiel"}
              personnes={personnes}
              conversations={conversations}
              partages={partages}
            />
          )}

          <section className="mt-6">
            <h2 className="mb-2 font-serif text-base font-semibold">{t("Historique de ce document", "Document history")}</h2>
            {audit.length === 0 ? (
              <p className="text-sm text-paper-soft">{t("Aucune entrée d'audit visible pour votre rôle.", "No audit entries visible for your role.")}</p>
            ) : (
              <ul className="space-y-1 rounded-lg border border-paper-200 bg-white p-3 text-sm shadow-sm">
                {audit.map((entree) => (
                  <li key={entree.id} className="text-paper-muted">
                    <span className="text-paper-soft">{new Date(entree.created_at).toLocaleString(dl)}</span>
                    {" — "}
                    {libelleAction(entree.action, langue)}
                    {entree.details && Object.keys(entree.details).length > 0 && (
                      <span className="text-paper-soft"> ({JSON.stringify(entree.details)})</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
