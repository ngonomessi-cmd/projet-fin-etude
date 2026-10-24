"use client";

import { NATURES, libelles } from "@/lib/labels";
import { useTraduction } from "@/components/i18n/Langue";
import type { NatureDocument } from "@/lib/types";

// Liste des natures documentaires (plan de classement) : la nature fixe la
// durée de conservation du document une fois archivé.
export function ChampNature({
  className,
  defaut,
  nom = "nature",
}: {
  className: string;
  defaut?: NatureDocument | null;
  nom?: string;
}) {
  const { t, langue } = useTraduction();
  return (
    <select name={nom} required defaultValue={defaut ?? ""} className={className}>
      <option value="" disabled>
        {t("Choisir la nature du document…", "Choose the document type…")}
      </option>
      {NATURES.map((n) => (
        <option key={n} value={n}>
          {libelles(langue).nature[n]}
        </option>
      ))}
    </select>
  );
}
