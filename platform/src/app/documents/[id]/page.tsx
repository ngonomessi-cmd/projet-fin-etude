import Link from "next/link";
import { notFound } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { Badge } from "@/components/Badge";
import { COULEUR_CLASSIFICATION, COULEUR_STATUT, LABEL_CLASSIFICATION, LABEL_STATUT } from "@/lib/labels";
import type { Document, EntreeAudit, Profil } from "@/lib/types";
import { BoutonsTransition } from "./BoutonsTransition";

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
    const { data } = await supabase.storage
      .from("documents-ged")
      .createSignedUrl(document.storage_path, 60 * 5);
    urlTelechargement = data?.signedUrl ?? null;
  }

  const { data: auditData } = await supabase
    .from("audit_log")
    .select("*")
    .eq("document_id", id)
    .order("created_at", { ascending: false });
  const audit = (auditData ?? []) as EntreeAudit[];

  const estProprietaire = document.owner_id === user!.id;
  const meDepartement = profil.departement === document.departement;

  return (
    <div className="flex min-h-screen">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto max-w-3xl">
          <Link href="/documents" className="mb-4 inline-block text-sm text-paper-muted hover:text-gold-600 hover:underline">
            ← Retour à la liste
          </Link>

          <div className="rounded-lg border border-paper-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-4">
              <h1 className="font-serif text-xl font-semibold">{document.titre}</h1>
              <div className="flex shrink-0 gap-2">
                <Badge texte={LABEL_CLASSIFICATION[document.classification]} classesCouleur={COULEUR_CLASSIFICATION[document.classification]} />
                <Badge texte={LABEL_STATUT[document.statut]} classesCouleur={COULEUR_STATUT[document.statut]} />
              </div>
            </div>

            {document.description && <p className="mb-4 text-sm text-paper-muted">{document.description}</p>}

            <dl className="grid grid-cols-2 gap-2 text-sm text-[#1c2029]">
              <dt className="text-paper-soft">Département</dt>
              <dd>{document.departement}</dd>
              <dt className="text-paper-soft">Déposé le</dt>
              <dd>{new Date(document.created_at).toLocaleString("fr-FR")}</dd>
              <dt className="text-paper-soft">Dernière mise à jour</dt>
              <dd>{new Date(document.updated_at).toLocaleString("fr-FR")}</dd>
            </dl>

            {urlTelechargement && (
              <a
                href={urlTelechargement}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block rounded-md border border-paper-200 px-4 py-2 text-sm font-medium text-[#1c2029] hover:bg-paper-50"
              >
                Télécharger le fichier (lien signé, valable 5 minutes)
              </a>
            )}

            <BoutonsTransition
              documentId={document.id}
              statutActuel={document.statut}
              role={profil.role}
              estProprietaire={estProprietaire}
              meDepartement={meDepartement}
            />
          </div>

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
                    {entree.action}
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
