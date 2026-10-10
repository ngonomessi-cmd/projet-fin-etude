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
    <>
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Documents</h1>
            <p className="text-sm text-slate-500">
              Liste filtrée automatiquement par les policies RLS (Row Level Security) de Supabase — ce
              que vous voyez dépend uniquement de votre rôle et de votre département.
            </p>
          </div>
          {peutDeposer && (
            <Link
              href="/documents/new"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Déposer un document
            </Link>
          )}
        </div>

        {documents.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Aucun document visible pour votre compte.
          </p>
        ) : (
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">Titre</th>
                  <th className="px-4 py-2">Classification</th>
                  <th className="px-4 py-2">Statut</th>
                  <th className="px-4 py-2">Département</th>
                  <th className="px-4 py-2">Mis à jour</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <Link href={`/documents/${doc.id}`} className="font-medium text-slate-900 hover:underline">
                        {doc.titre}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <Badge texte={LABEL_CLASSIFICATION[doc.classification]} classesCouleur={COULEUR_CLASSIFICATION[doc.classification]} />
                    </td>
                    <td className="px-4 py-2">
                      <Badge texte={LABEL_STATUT[doc.statut]} classesCouleur={COULEUR_STATUT[doc.statut]} />
                    </td>
                    <td className="px-4 py-2 text-slate-600">{doc.departement}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {new Date(doc.updated_at).toLocaleString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
