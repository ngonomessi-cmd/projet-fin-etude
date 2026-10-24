import Link from "next/link";
import { notFound } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { Badge } from "@/components/Badge";
import {
  COULEUR_CLASSIFICATION,
  LABEL_CLASSIFICATION,
  ROLES_PRODUCTEURS,
  libelleNature,
  statutAffiche,
} from "@/lib/labels";
import { LABEL_FORMAT, LABEL_FORMAT_COURT } from "@/lib/atelier/contenus";
import type { Document, EntreeAudit, PartageDocument, Profil } from "@/lib/types";
import { BoutonsTransition } from "./BoutonsTransition";
import { PanneauPartage, type ConversationPubliable, type PersonneContactable } from "./PanneauPartage";
import { ActionsCycleVie, ChoixNature, ControleIntegrite } from "./PanneauCycleVie";

const LABEL_ACTION: Record<string, string> = {
  transition_statut: "Changement de statut",
  partage: "Partage",
  retrait_partage: "Retrait d'un partage",
  modification_contenu: "Modification du contenu",
  creation_atelier: "Création dans la plateforme",
  telechargement: "Téléchargement",
  archivage: "Archivage",
  archivage_automatique: "Archivage automatique",
  controle_integrite: "Contrôle d'intégrité",
  nouvelle_version: "Nouvelle version",
  classement: "Changement de nature",
};

function dateLongue(iso: string | null | undefined) {
  return iso ? new Date(iso).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" }) : "—";
}

export default async function PageDetailDocument({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await creerClientServeur();

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
  const statut = statutAffiche(document);
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
              ? "Canal : toute l'organisation"
              : `Canal : ${c.titre ?? c.departement}`
            : `Groupe : ${c.titre ?? "sans titre"}`,
      }));
  }

  const verrouActif =
    document.verrou_par && document.verrou_jusqua && new Date(document.verrou_jusqua) > new Date() && document.verrou_par !== user!.id;
  let nomVerrou: string | null = null;
  if (verrouActif) {
    const { data } = await supabase.from("profiles").select("nom_complet").eq("id", document.verrou_par!).maybeSingle();
    nomVerrou = data?.nom_complet ?? "une autre personne";
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <Link href="/documents" className="mb-4 inline-block text-sm text-paper-muted hover:text-gold-600 hover:underline">
            ← Retour à la liste
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
                <Badge texte={LABEL_CLASSIFICATION[document.classification]} classesCouleur={COULEUR_CLASSIFICATION[document.classification]} />
                <Badge texte={statut.texte} classesCouleur={statut.couleur} />
              </div>
            </div>

            {archive && (
              <p className="mb-4 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
                Document archivé{document.archive_auto ? " automatiquement" : ""} le {dateLongue(document.archive_le)} : lecture
                seule définitive. Pour le faire évoluer, créez-en une nouvelle version.
              </p>
            )}
            {estProprietaire && document.statut === "brouillon" && (
              <p className="mb-4 rounded-md border border-paper-200 bg-paper-50 px-3 py-2 text-sm text-paper-muted">
                Brouillon privé : vous seul le voyez, ainsi que les personnes avec qui vous le partagez. Il ne sera visible
                plus largement qu&apos;après validation et publication.
              </p>
            )}

            {document.description && <p className="mb-4 text-sm text-paper-muted">{document.description}</p>}

            <dl className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm text-[#1c2029]">
              <dt className="text-paper-soft">Nature</dt>
              <dd>{peutClasser ? <ChoixNature documentId={document.id} nature={document.nature} /> : libelleNature(document.nature)}</dd>
              <dt className="text-paper-soft">Type</dt>
              <dd>{document.format_atelier ? `${LABEL_FORMAT[document.format_atelier]} — rédigé dans la plateforme` : "Fichier déposé"}</dd>
              <dt className="text-paper-soft">Département</dt>
              <dd>{document.departement}</dd>
              <dt className="text-paper-soft">Créé le</dt>
              <dd>{new Date(document.created_at).toLocaleString("fr-FR")}</dd>
              <dt className="text-paper-soft">Dernière mise à jour</dt>
              <dd>{new Date(document.updated_at).toLocaleString("fr-FR")}</dd>
              {(precedente || suivantes.length > 0 || document.version > 1) && (
                <>
                  <dt className="text-paper-soft">Versions</dt>
                  <dd className="flex flex-wrap gap-x-3 gap-y-1">
                    {precedente && (
                      <Link href={`/documents/${precedente.id}`} className="text-gold-600 hover:underline">
                        ← v{precedente.version} ({precedente.reference})
                      </Link>
                    )}
                    <span className="font-semibold">v{document.version} (celle-ci)</span>
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
                  <dt className="text-paper-soft">Publié le</dt>
                  <dd>{dateLongue(document.publie_le)}</dd>
                </>
              )}
              {archive && (
                <>
                  <dt className="text-paper-soft">Archivé le</dt>
                  <dd>
                    {dateLongue(document.archive_le)}
                    {document.archive_auto ? " — automatiquement" : archiviste ? ` — par ${archiviste}` : ""}
                  </dd>
                  <dt className="text-paper-soft">Conservation</dt>
                  <dd>
                    {document.fin_conservation
                      ? `Jusqu'au ${new Date(document.fin_conservation).toLocaleDateString("fr-FR", { dateStyle: "long" })}`
                      : "Permanente"}
                  </dd>
                  {document.empreinte_sha256 && (
                    <>
                      <dt className="text-paper-soft">Empreinte SHA-256</dt>
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
                En cours de modification par {nomVerrou}.
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-2">
              {document.format_atelier && (
                <>
                  <Link
                    href={`/documents/${document.id}/editer`}
                    className="rounded-md bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900"
                  >
                    {peutEditer ? "Ouvrir dans l'éditeur" : "Consulter"}
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
                  Télécharger le fichier (lien signé, valable 5 minutes)
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
            <h2 className="mb-2 font-serif text-base font-semibold">Historique de ce document</h2>
            {audit.length === 0 ? (
              <p className="text-sm text-paper-soft">Aucune entrée d&apos;audit visible pour votre rôle.</p>
            ) : (
              <ul className="space-y-1 rounded-lg border border-paper-200 bg-white p-3 text-sm shadow-sm">
                {audit.map((entree) => (
                  <li key={entree.id} className="text-paper-muted">
                    <span className="text-paper-soft">{new Date(entree.created_at).toLocaleString("fr-FR")}</span>
                    {" — "}
                    {LABEL_ACTION[entree.action] ?? entree.action}
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
