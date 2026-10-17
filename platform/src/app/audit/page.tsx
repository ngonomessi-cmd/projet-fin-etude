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
    <div className="flex min-h-screen flex-col lg:flex-row">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-1 font-serif text-2xl font-semibold">Journal d&apos;audit</h1>
          <p className="mb-6 text-sm text-paper-muted">
            Journal immuable (aucune entrée ne peut être modifiée ni supprimée, même par un administrateur
            — garanti par un déclencheur PostgreSQL indépendant des policies RLS).
          </p>

          {entrees.length === 0 ? (
            <p className="rounded-lg border border-paper-200 bg-white p-6 text-sm text-paper-muted">
              Aucune entrée visible pour votre rôle.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-paper-200 bg-white shadow-sm">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-paper-50 text-left text-paper-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Date</th>
                    <th className="px-4 py-2.5 font-medium">Action</th>
                    <th className="px-4 py-2.5 font-medium">Document</th>
                    <th className="px-4 py-2.5 font-medium">Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {entrees.map((entree) => (
                    <tr key={entree.id} className="border-t border-paper-200">
                      <td className="px-4 py-2.5 whitespace-nowrap text-paper-muted">
                        {new Date(entree.created_at).toLocaleString("fr-FR")}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-[#1c2029]">{entree.action}</td>
                      <td className="px-4 py-2.5">
                        {entree.document_id ? (
                          <Link href={`/documents/${entree.document_id}`} className="text-gold-600 hover:underline">
                            Voir le document
                          </Link>
                        ) : (
                          <span className="text-paper-soft">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-paper-muted">{JSON.stringify(entree.details)}</td>
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
