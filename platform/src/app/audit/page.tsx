import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import type { EntreeAudit } from "@/lib/types";

export default async function PageAudit() {
  const supabase = await creerClientServeur();

  // Aucun filtre applicatif : la visibilité (administrateur/auditeur voient
  // tout, les autres ne voient que leurs propres actions ou leurs propres
  // documents) vient uniquement de la policy RLS "lecture_audit_selon_role_ou_propriete".
  const { data } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const entrees = (data ?? []) as EntreeAudit[];

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="mb-1 text-xl font-semibold text-slate-900">Journal d&apos;audit</h1>
        <p className="mb-6 text-sm text-slate-500">
          Journal immuable (aucune entrée ne peut être modifiée ni supprimée, même par un administrateur
          — garanti par un déclencheur PostgreSQL indépendant des policies RLS).
        </p>

        {entrees.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Aucune entrée visible pour votre rôle.
          </p>
        ) : (
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2">Document</th>
                  <th className="px-4 py-2">Détails</th>
                </tr>
              </thead>
              <tbody>
                {entrees.map((entree) => (
                  <tr key={entree.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 whitespace-nowrap text-slate-500">
                      {new Date(entree.created_at).toLocaleString("fr-FR")}
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-900">{entree.action}</td>
                    <td className="px-4 py-2">
                      {entree.document_id ? (
                        <Link href={`/documents/${entree.document_id}`} className="text-blue-600 hover:underline">
                          Voir le document
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-500">{JSON.stringify(entree.details)}</td>
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
