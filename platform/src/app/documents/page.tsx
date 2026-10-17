import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { Badge } from "@/components/Badge";
import { COULEUR_CLASSIFICATION, COULEUR_STATUT, LABEL_CLASSIFICATION, LABEL_STATUT } from "@/lib/labels";
import type { Document, Profil } from "@/lib/types";

export default async function PageDocuments() {
  const supabase = await creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profilData } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const profil = profilData as Profil;

  // Aucun filtre ici : la liste visible est entièrement déterminée par la
  // policy RLS "lecture_documents_selon_classification_et_role" côté base —
  // la même requête renvoie un résultat différent selon le rôle connecté.
  const { data: documentsData } = await supabase
    .from("documents")
    .select("*")
    .order("updated_at", { ascending: false });
  const documents = (documentsData ?? []) as Document[];

  const peutDeposer = profil.role === "redacteur" || profil.role === "administrateur";

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-serif text-2xl font-semibold">Documents</h1>
              <p className="text-sm text-paper-muted">
                Liste filtrée automatiquement par les policies RLS (Row Level Security) de Supabase — ce
                que vous voyez dépend uniquement de votre rôle et de votre département.
              </p>
            </div>
            {peutDeposer && (
              <Link
                href="/documents/new"
                className="shrink-0 rounded-md bg-navy-950 px-4 py-2 text-center text-sm font-medium text-white hover:bg-navy-900"
              >
                Déposer un document
              </Link>
            )}
          </div>

          {documents.length === 0 ? (
            <p className="rounded-lg border border-paper-200 bg-white p-6 text-sm text-paper-muted">
              Aucun document visible pour votre compte.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-paper-200 bg-white shadow-sm">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-paper-50 text-left text-paper-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Titre</th>
                    <th className="px-4 py-2.5 font-medium">Classification</th>
                    <th className="px-4 py-2.5 font-medium">Statut</th>
                    <th className="px-4 py-2.5 font-medium">Département</th>
                    <th className="px-4 py-2.5 font-medium">Mis à jour</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-t border-paper-200 hover:bg-paper-50">
                      <td className="px-4 py-2.5">
                        <Link href={`/documents/${doc.id}`} className="font-medium text-[#1c2029] hover:text-gold-600 hover:underline">
                          {doc.titre}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge texte={LABEL_CLASSIFICATION[doc.classification]} classesCouleur={COULEUR_CLASSIFICATION[doc.classification]} />
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge texte={LABEL_STATUT[doc.statut]} classesCouleur={COULEUR_STATUT[doc.statut]} />
                      </td>
                      <td className="px-4 py-2.5 text-paper-muted">{doc.departement}</td>
                      <td className="px-4 py-2.5 text-paper-soft">
                        {new Date(doc.updated_at).toLocaleString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
