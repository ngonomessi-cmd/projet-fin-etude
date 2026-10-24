import Link from "next/link";
import { NOMS_MOIS } from "@/lib/labels";
import { DocumentsParDepartement, type GroupeDepartement } from "./DocumentsParDepartement";
import type { LigneDocument } from "./TableauDocuments";

export type Ligne = LigneDocument & { owner_id: string; storage_path: string | null };

// Dossier mensuel d'un document archivé : mois de publication (date de
// référence d'un acte), à défaut mois d'archivage.
function moisDe(doc: Ligne): string {
  return (doc.publie_le ?? doc.archive_le ?? doc.updated_at).slice(0, 7);
}

function libelleMois(cle: string): string {
  const [annee, mois] = cle.split("-");
  return `${NOMS_MOIS[Number(mois) - 1]} ${annee}`;
}

export function grouperParDepartement(documents: Ligne[], departements?: string[]): GroupeDepartement[] {
  const noms = new Set(departements ?? []);
  for (const d of documents) if (d.departement?.trim()) noms.add(d.departement.trim());
  return [...noms]
    .sort((a, b) => a.localeCompare(b, "fr"))
    .map((departement) => ({ departement, documents: documents.filter((d) => d.departement === departement) }));
}

export function Archives({ archives, mois }: { archives: Ligne[]; mois: string }) {
  const bandeau = (
    <p className="mb-4 flex items-start gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0" aria-hidden="true">
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
      Les documents archivés sont en lecture seule définitive et scellés par une empreinte numérique. Ils sont classés
      par mois de publication.
    </p>
  );

  if (/^\d{4}-\d{2}$/.test(mois)) {
    const duMois = archives.filter((d) => moisDe(d) === mois);
    return (
      <>
        <div className="mb-3 flex items-center gap-2 text-sm">
          <Link href="/documents?vue=archives" className="text-paper-muted hover:text-gold-600 hover:underline">
            Archives
          </Link>
          <span className="text-paper-soft">›</span>
          <span className="font-semibold text-[#1c2029]">{libelleMois(mois)}</span>
        </div>
        {bandeau}
        {duMois.length === 0 ? (
          <p className="rounded-lg border border-paper-200 bg-white p-5 text-sm text-paper-muted">Aucun document archivé pour ce mois.</p>
        ) : (
          <DocumentsParDepartement groupes={grouperParDepartement(duMois)} colonneDate="publication" toutOuvrir />
        )}
      </>
    );
  }

  const parMois = new Map<string, number>();
  for (const d of archives) parMois.set(moisDe(d), (parMois.get(moisDe(d)) ?? 0) + 1);
  const annees = [...new Set([...parMois.keys()].map((m) => m.slice(0, 4)))].sort().reverse();

  return (
    <>
      {bandeau}
      {annees.length === 0 ? (
        <p className="rounded-lg border border-paper-200 bg-white p-5 text-sm text-paper-muted">
          Aucun document archivé pour l&apos;instant.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {annees.map((annee) => {
            const moisAnnee = [...parMois.keys()].filter((m) => m.startsWith(annee)).sort().reverse();
            const total = moisAnnee.reduce((n, m) => n + (parMois.get(m) ?? 0), 0);
            return (
              <section key={annee}>
                <h2 className="mb-2 flex items-baseline gap-2 font-serif text-lg font-semibold">
                  {annee}
                  <span className="text-xs font-normal text-paper-muted">
                    {total} document{total > 1 ? "s" : ""}
                  </span>
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {moisAnnee.map((m) => (
                    <Link
                      key={m}
                      href={`/documents?vue=archives&mois=${m}`}
                      className="group flex items-center gap-3 rounded-lg border border-paper-200 bg-white p-3 shadow-sm hover:border-gold-500"
                    >
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-600)" strokeWidth="1.6" aria-hidden="true" className="shrink-0">
                        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
                      </svg>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[#1c2029] group-hover:text-gold-600">
                          {NOMS_MOIS[Number(m.slice(5, 7)) - 1]}
                        </span>
                        <span className="block text-xs text-paper-muted">
                          {parMois.get(m)} document{(parMois.get(m) ?? 0) > 1 ? "s" : ""}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
