"use client";

import { useState } from "react";
import { TableauDocuments, type LigneDocument } from "./TableauDocuments";
import { useTraduction } from "@/components/i18n/Langue";

export type GroupeDepartement = { departement: string; documents: LigneDocument[]; special?: boolean };

export function DocumentsParDepartement({
  groupes,
  colonneDate = "maj",
  toutOuvrir = false,
}: {
  groupes: GroupeDepartement[];
  colonneDate?: "maj" | "publication";
  toutOuvrir?: boolean;
}) {
  const [ouverts, setOuverts] = useState<Record<string, boolean>>({});
  const { t, dep } = useTraduction();

  function basculer(departement: string) {
    setOuverts((o) => ({ ...o, [departement]: !(o[departement] ?? toutOuvrir) }));
  }

  return (
    <div className="flex flex-col gap-3">
      {groupes.map((g) => {
        const ouvert = ouverts[g.departement] ?? (toutOuvrir || Boolean(g.special));
        return (
          <div key={g.departement} className="overflow-hidden rounded-lg border border-paper-200 bg-white shadow-sm">
            <button
              onClick={() => basculer(g.departement)}
              className="flex w-full items-center gap-2.5 bg-paper-50 px-4 py-3 text-left"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0b1220" strokeWidth="2" aria-hidden="true">
                <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
              </svg>
              <span className="flex-1 truncate text-sm font-bold text-[#1c2029]">{dep(g.departement)}</span>
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

            {ouvert && (
              <div className="border-t border-paper-200">
                <TableauDocuments
                  documents={g.documents}
                  colonneDate={colonneDate}
                  vide={t("Aucun document dans ce département pour l'instant.", "No documents in this department yet.")}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
