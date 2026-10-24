"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/Badge";
import { COULEUR_CLASSIFICATION, COULEUR_STATUT, LABEL_CLASSIFICATION, LABEL_STATUT } from "@/lib/labels";
import type { Document } from "@/lib/types";

export type GroupeDepartement = { departement: string; documents: Document[]; special?: boolean };

const PASTILLE_FORMAT = {
  texte: { lettre: "W", teinte: "bg-[#2b579a]", titre: "Document texte (Word)" },
  tableur: { lettre: "X", teinte: "bg-[#217346]", titre: "Classeur (Excel)" },
  presentation: { lettre: "P", teinte: "bg-[#c43e1c]", titre: "Présentation (PowerPoint)" },
} as const;

export function DocumentsParDepartement({ groupes }: { groupes: GroupeDepartement[] }) {
  const [ouverts, setOuverts] = useState<Record<string, boolean>>({});

  function basculer(departement: string) {
    setOuverts((o) => ({ ...o, [departement]: !o[departement] }));
  }

  return (
    <div className="flex flex-col gap-3">
      {groupes.map((g) => {
        const ouvert = ouverts[g.departement] ?? Boolean(g.special);
        return (
          <div key={g.departement} className="overflow-hidden rounded-lg border border-paper-200 bg-white shadow-sm">
            <button
              onClick={() => basculer(g.departement)}
              className="flex w-full items-center gap-2.5 bg-paper-50 px-4 py-3 text-left"
            >
              {g.special ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-600)" strokeWidth="2" aria-hidden="true">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0b1220" strokeWidth="2" aria-hidden="true">
                  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
                </svg>
              )}
              <span className="flex-1 truncate text-sm font-bold text-[#1c2029]">{g.departement}</span>
              <span className="shrink-0 rounded-full bg-paper-200 px-2 py-0.5 text-[11px] font-bold text-paper-muted">
                {g.documents.length}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-paper-muted)"
                strokeWidth="2.3"
                aria-hidden="true"
                className="shrink-0"
                style={{ transform: ouvert ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 160ms ease" }}
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>

            {ouvert &&
              (g.documents.length === 0 ? (
                <p className="border-t border-paper-200 px-4 py-4 text-sm text-paper-muted">
                  Aucun document dans ce département pour l&apos;instant.
                </p>
              ) : (
                <div className="overflow-x-auto border-t border-paper-200">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead className="bg-paper-50 text-left text-paper-muted">
                      <tr>
                        <th className="px-4 py-2 font-medium">Titre</th>
                        <th className="px-4 py-2 font-medium">Classification</th>
                        <th className="px-4 py-2 font-medium">Statut</th>
                        <th className="px-4 py-2 font-medium">Mis à jour</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.documents.map((doc) => (
                        <tr key={doc.id} className="border-t border-paper-200 hover:bg-paper-50">
                          <td className="px-4 py-2.5">
                            <Link
                              href={`/documents/${doc.id}`}
                              className="inline-flex items-center gap-2 font-medium text-[#1c2029] hover:text-gold-600 hover:underline"
                            >
                              {doc.format_atelier && (
                                <span
                                  title={PASTILLE_FORMAT[doc.format_atelier].titre}
                                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white ${PASTILLE_FORMAT[doc.format_atelier].teinte}`}
                                >
                                  {PASTILLE_FORMAT[doc.format_atelier].lettre}
                                </span>
                              )}
                              {doc.titre}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge texte={LABEL_CLASSIFICATION[doc.classification]} classesCouleur={COULEUR_CLASSIFICATION[doc.classification]} />
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge texte={LABEL_STATUT[doc.statut]} classesCouleur={COULEUR_STATUT[doc.statut]} />
                          </td>
                          <td className="px-4 py-2.5 text-paper-soft">{new Date(doc.updated_at).toLocaleString("fr-FR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}
