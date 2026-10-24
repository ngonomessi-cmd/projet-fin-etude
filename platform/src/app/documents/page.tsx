import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { DocumentsParDepartement } from "./DocumentsParDepartement";
import { GenererFichiersFictifsBouton } from "./GenererFichiersFictifsBouton";
import { TableauDocuments } from "./TableauDocuments";
import { BarreRecherche, type FiltresRecherche } from "./BarreRecherche";
import { Archives, grouperParDepartement, type Ligne } from "./Archives";
import type { Profil, ResultatRecherche } from "@/lib/types";
import { ROLES_PRODUCTEURS } from "@/lib/labels";
import { traductionServeur } from "@/lib/i18n/serveur";
import { traduireErreur } from "@/lib/i18n/erreurs";

// Colonnes utiles aux listes (jamais le contenu rédigé, potentiellement lourd).
const COLONNES =
  "id, reference, titre, classification, statut, departement, nature, format_atelier, version, owner_id, updated_at, publie_le, archive_le, storage_path";

type Vue = "brouillons" | "partages" | "circuit" | "vigueur" | "archives";

function Section({ titre, aide, children }: { titre: string; aide?: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-paper-200 bg-white shadow-sm">
      <div className="border-b border-paper-200 bg-paper-50 px-4 py-3">
        <h2 className="text-sm font-bold text-[#1c2029]">{titre}</h2>
        {aide && <p className="mt-0.5 text-xs text-paper-muted">{aide}</p>}
      </div>
      {children}
    </section>
  );
}

export default async function PageDocuments({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parametres = await searchParams;
  const lire = (cle: string) => (typeof parametres[cle] === "string" ? (parametres[cle] as string).trim() : "");

  const supabase = await creerClientServeur();
  const { langue, t } = await traductionServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profilData } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const profil = profilData as Profil;
  const producteur = ROLES_PRODUCTEURS.includes(profil.role);

  const filtres: FiltresRecherche = {
    q: lire("q"),
    departement: lire("departement"),
    nature: lire("nature"),
    statut: lire("statut"),
    auteur: lire("auteur"),
    format: lire("format"),
    du: lire("du"),
    au: lire("au"),
  };
  const enRecherche = Object.values(filtres).some(Boolean);

  // Aucun filtre de droits ici : tout passe par les policies RLS de la base —
  // la même requête renvoie un résultat différent selon le compte connecté.
  const [{ data: documentsData }, { data: profilsData }, { data: partagesData }] = await Promise.all([
    supabase.from("documents").select(COLONNES).order("updated_at", { ascending: false }),
    supabase.from("profiles").select("id, nom_complet, departement").order("nom_complet"),
    supabase.from("document_partages").select("document_id, partage_par").neq("partage_par", user!.id),
  ]);
  const documents = (documentsData ?? []) as unknown as Ligne[];
  const profils = (profilsData ?? []) as Pick<Profil, "id" | "nom_complet" | "departement">[];
  const departements = [...new Set(profils.map((p) => p.departement?.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, langue)
  );

  const peutValider = (d: Ligne) =>
    profil.role === "administrateur" || (profil.role === "validateur" && profil.departement === d.departement);

  const idsPartages = new Set(((partagesData ?? []) as { document_id: string }[]).map((p) => p.document_id));
  const mesBrouillons = documents.filter((d) => d.owner_id === user!.id && d.statut === "brouillon");
  const mesRejetes = documents.filter((d) => d.owner_id === user!.id && d.statut === "rejete");
  const partagesAvecMoi = documents.filter((d) => idsPartages.has(d.id) && d.owner_id !== user!.id);
  const enCircuit = documents.filter((d) => d.statut === "en_verification" || d.statut === "valide");
  const aTraiter = enCircuit.filter((d) => peutValider(d));
  const mesEnCours = enCircuit.filter((d) => d.owner_id === user!.id && !peutValider(d));
  const autresEnCours = enCircuit.filter((d) => d.owner_id !== user!.id && !peutValider(d));
  const enVigueur = documents.filter((d) => d.statut === "publie" && !d.archive_le);
  const archives = documents.filter((d) => d.archive_le);

  const onglets: { cle: Vue; libelle: string; nombre: number; visible: boolean }[] = [
    { cle: "brouillons", libelle: t("Mes brouillons", "My drafts"), nombre: mesBrouillons.length + mesRejetes.length, visible: producteur || mesBrouillons.length + mesRejetes.length > 0 },
    { cle: "partages", libelle: t("Partagés avec moi", "Shared with me"), nombre: partagesAvecMoi.length, visible: true },
    { cle: "circuit", libelle: t("Circuit de validation", "Approval workflow"), nombre: enCircuit.length, visible: producteur || enCircuit.length > 0 },
    { cle: "vigueur", libelle: t("En vigueur", "In force"), nombre: enVigueur.length, visible: true },
    { cle: "archives", libelle: t("Archives", "Archives"), nombre: archives.length, visible: true },
  ];
  const ongletsVisibles = onglets.filter((o) => o.visible);
  const vueDemandee = lire("vue") as Vue;
  const vue: Vue = ongletsVisibles.some((o) => o.cle === vueDemandee) ? vueDemandee : "vigueur";

  let resultats: ResultatRecherche[] = [];
  let erreurRecherche: string | null = null;
  if (enRecherche) {
    const { data, error } = await supabase.rpc("rechercher_documents", {
      p_texte: filtres.q || null,
      p_departement: filtres.departement || null,
      p_nature: filtres.nature || null,
      p_statut: filtres.statut || null,
      p_auteur: filtres.auteur || null,
      p_du: filtres.du || null,
      p_au: filtres.au || null,
      p_format: filtres.format || null,
      p_limite: 200,
    });
    resultats = (data ?? []) as ResultatRecherche[];
    erreurRecherche = error ? traduireErreur(error.message, langue) : null;
  }

  const moisArchive = lire("mois");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-serif text-2xl font-semibold">Documents</h1>
              <p className="text-sm text-paper-muted">
                {t(
                  "Vous ne voyez que les documents que votre rôle, votre département et les partages vous autorisent à lire.",
                  "You only see the documents your role, your department and shares allow you to read."
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {profil.role === "administrateur" && (
                <GenererFichiersFictifsBouton
                  nombreSansFichier={documents.filter((d) => !d.storage_path && !d.format_atelier && !d.archive_le).length}
                />
              )}
              {producteur && (
                <Link
                  href="/documents/new"
                  className="shrink-0 rounded-md bg-navy-950 px-4 py-2 text-center text-sm font-medium text-white hover:bg-navy-900"
                >
                  {t("Nouveau document", "New document")}
                </Link>
              )}
            </div>
          </div>

          <BarreRecherche
            filtres={filtres}
            vue={vue}
            langue={langue}
            departements={departements}
            auteurs={profils.map((p) => ({ id: p.id, nom: p.nom_complet }))}
          />

          {enRecherche ? (
            <Section
              titre={`${resultats.length} ${t("résultat", "result")}${resultats.length > 1 ? "s" : ""}${resultats.length === 200 ? t(" (les 200 plus pertinents)", " (the 200 most relevant)") : ""}`}
              aide={t(
                "Recherche dans la référence, le titre, la description et le texte des documents rédigés dans la plateforme.",
                "Searches the reference, title, description and text of documents written in the platform."
              )}
            >
              {erreurRecherche ? (
                <p className="px-4 py-4 text-sm text-red-600">{erreurRecherche}</p>
              ) : (
                <TableauDocuments
                  documents={resultats.map((r) => ({ ...r, auteur: r.auteur, extrait: r.extrait }))}
                  afficherDepartement
                  vide={t("Aucun document ne correspond à cette recherche parmi ceux que vous pouvez lire.", "No document you can read matches this search.")}
                />
              )}
            </Section>
          ) : (
            <>
              <nav className="mb-5 flex gap-1 overflow-x-auto border-b border-paper-200" aria-label={t("Espaces documentaires", "Document spaces")}>
                {ongletsVisibles.map((o) => {
                  const actif = o.cle === vue;
                  return (
                    <Link
                      key={o.cle}
                      href={`/documents?vue=${o.cle}`}
                      aria-current={actif ? "page" : undefined}
                      className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm ${
                        actif
                          ? "border-gold-500 font-semibold text-[#1c2029]"
                          : "border-transparent text-paper-muted hover:text-[#1c2029]"
                      }`}
                    >
                      {o.libelle}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                          actif ? "bg-gold-100 text-gold-900" : "bg-paper-200 text-paper-muted"
                        }`}
                      >
                        {o.nombre}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              {vue === "brouillons" && (
                <div className="flex flex-col gap-4">
                  <Section
                    titre={t("Brouillons", "Drafts")}
                    aide={t(
                      "Documents créés et pas encore soumis. Ils sont privés : personne d'autre ne les voit, sauf les personnes avec qui vous choisissez de les partager.",
                      "Documents created but not yet submitted. They are private: nobody else sees them, except the people you choose to share them with."
                    )}
                  >
                    <TableauDocuments documents={mesBrouillons} vide={t("Aucun brouillon en cours.", "No drafts in progress.")} />
                  </Section>
                  {mesRejetes.length > 0 && (
                    <Section
                      titre={t("Rejetés — à corriger", "Rejected — to be corrected")}
                      aide={t("Ouvrez le document pour lire le motif du rejet, corrigez-le puis redéposez-le.", "Open the document to read why it was rejected, correct it, then resubmit it.")}
                    >
                      <TableauDocuments documents={mesRejetes} />
                    </Section>
                  )}
                </div>
              )}

              {vue === "partages" && (
                <Section
                  titre={t("Partagés avec moi", "Shared with me")}
                  aide={t("Documents qu'un collègue vous a partagés, en lecture ou en co-édition.", "Documents a colleague shared with you, read-only or for co-editing.")}
                >
                  <TableauDocuments documents={partagesAvecMoi} afficherDepartement vide={t("Aucun document ne vous a été partagé.", "No document has been shared with you.")} />
                </Section>
              )}

              {vue === "circuit" && (
                <div className="flex flex-col gap-4">
                  {(profil.role === "administrateur" || profil.role === "validateur") && (
                    <Section titre={t("À traiter par vous", "Awaiting your action")} aide={t("Documents à vérifier, valider ou publier.", "Documents to review, approve or publish.")}>
                      <TableauDocuments documents={aTraiter} afficherDepartement vide={t("Rien à traiter pour le moment.", "Nothing to process for now.")} />
                    </Section>
                  )}
                  {producteur && (
                    <Section titre={t("Vos documents en cours de validation", "Your documents awaiting approval")}>
                      <TableauDocuments documents={mesEnCours} vide={t("Aucun de vos documents n'est en cours de validation.", "None of your documents is awaiting approval.")} />
                    </Section>
                  )}
                  {autresEnCours.length > 0 && (
                    <Section titre={t("Autres documents en cours", "Other documents in progress")}>
                      <TableauDocuments documents={autresEnCours} afficherDepartement />
                    </Section>
                  )}
                </div>
              )}

              {vue === "vigueur" && (
                <>
                  <p className="mb-3 text-sm text-paper-muted">
                    {t(
                      "Documents validés et publiés, classés par département. Ils passent aux archives sur décision du validateur ou automatiquement après le délai fixé par l'administrateur.",
                      "Approved and published documents, by department. They move to the archives when the approver decides, or automatically after the period set by the administrator."
                    )}
                  </p>
                  <DocumentsParDepartement groupes={grouperParDepartement(enVigueur, departements, langue)} colonneDate="publication" />
                </>
              )}

              {vue === "archives" && <Archives archives={archives} mois={moisArchive} langue={langue} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
