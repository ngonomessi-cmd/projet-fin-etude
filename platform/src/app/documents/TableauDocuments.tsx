"use client";

import Link from "next/link";
import { Badge } from "@/components/Badge";
import { COULEUR_CLASSIFICATION, libelleNature, libelles, statutAffiche } from "@/lib/labels";
import { useTraduction } from "@/components/i18n/Langue";
import type { Langue } from "@/lib/i18n/plateforme";
import type { Document } from "@/lib/types";

export type LigneDocument = Pick<
  Document,
  | "id"
  | "reference"
  | "titre"
  | "classification"
  | "statut"
  | "departement"
  | "nature"
  | "format_atelier"
  | "version"
  | "updated_at"
  | "publie_le"
  | "archive_le"
> & { auteur?: string | null; extrait?: string | null; note?: string | null };

export const PASTILLE_FORMAT = {
  texte: { lettre: "W", teinte: "bg-[#2b579a]", titre: "Document texte (Word)", titreEn: "Text document (Word)" },
  tableur: { lettre: "X", teinte: "bg-[#217346]", titre: "Classeur (Excel)", titreEn: "Spreadsheet (Excel)" },
  presentation: { lettre: "P", teinte: "bg-[#c43e1c]", titre: "Présentation (PowerPoint)", titreEn: "Presentation (PowerPoint)" },
} as const;

// Surlignage des mots trouvés : la recherche entoure chaque occurrence de
// ⟦ … ⟧ (cf. rechercher_documents, migration 0024).
function Extrait({ texte }: { texte: string }) {
  const morceaux = texte.trim().split(/(⟦[^⟧]*⟧)/g);
  return (
    <p className="mt-1 line-clamp-2 text-xs text-paper-muted">
      …
      {morceaux.map((m, i) =>
        m.startsWith("⟦") ? (
          <mark key={i} className="rounded bg-gold-100 px-0.5 text-[#1c2029]">
            {m.slice(1, -1)}
          </mark>
        ) : (
          <span key={i}>{m}</span>
        )
      )}
      …
    </p>
  );
}

function dateCourte(iso: string | null | undefined, langue: Langue) {
  return iso
    ? new Date(iso).toLocaleDateString(langue === "en" ? "en-GB" : "fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
}

export function TableauDocuments({
  documents,
  afficherDepartement = false,
  colonneDate = "maj",
  vide,
}: {
  documents: LigneDocument[];
  afficherDepartement?: boolean;
  colonneDate?: "maj" | "publication";
  vide?: string;
}) {
  const { t, langue, dep } = useTraduction();
  const L = libelles(langue);
  if (documents.length === 0) {
    return <p className="px-4 py-4 text-sm text-paper-muted">{vide ?? t("Aucun document.", "No documents.")}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-paper-50 text-left text-paper-muted">
          <tr>
            <th className="px-4 py-2 font-medium">Document</th>
            <th className="px-4 py-2 font-medium">{t("Nature", "Type")}</th>
            {afficherDepartement && <th className="px-4 py-2 font-medium">{t("Département", "Department")}</th>}
            <th className="px-4 py-2 font-medium">{t("Statut", "Status")}</th>
            <th className="px-4 py-2 font-medium">
              {colonneDate === "publication" ? t("Publié le", "Published") : t("Mis à jour", "Updated")}
            </th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => {
            const statut = statutAffiche(doc, langue);
            return (
              <tr key={doc.id} className="border-t border-paper-200 align-top hover:bg-paper-50">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/documents/${doc.id}`}
                    className="inline-flex items-center gap-2 font-medium text-[#1c2029] hover:text-gold-600 hover:underline"
                  >
                    {doc.format_atelier && (
                      <span
                        title={langue === "en" ? PASTILLE_FORMAT[doc.format_atelier].titreEn : PASTILLE_FORMAT[doc.format_atelier].titre}
                        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white ${PASTILLE_FORMAT[doc.format_atelier].teinte}`}
                      >
                        {PASTILLE_FORMAT[doc.format_atelier].lettre}
                      </span>
                    )}
                    {doc.titre}
                    {doc.version > 1 && (
                      <span className="rounded border border-paper-200 px-1 text-[10px] font-semibold text-paper-muted">
                        v{doc.version}
                      </span>
                    )}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-paper-soft">
                    <span className="font-mono">{doc.reference}</span>
                    {doc.auteur && <span>· {doc.auteur}</span>}
                    <Badge texte={L.classification[doc.classification]} classesCouleur={COULEUR_CLASSIFICATION[doc.classification]} />
                  </div>
                  {doc.note && <p className="mt-1 text-xs text-red-700">{doc.note}</p>}
                  {doc.extrait && <Extrait texte={doc.extrait} />}
                </td>
                <td className="px-4 py-2.5 text-paper-muted">{libelleNature(doc.nature, langue)}</td>
                {afficherDepartement && <td className="px-4 py-2.5 text-paper-muted">{dep(doc.departement)}</td>}
                <td className="px-4 py-2.5">
                  <Badge texte={statut.texte} classesCouleur={statut.couleur} />
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-paper-soft">
                  {dateCourte(colonneDate === "publication" ? doc.publie_le : doc.updated_at, langue)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
