import { LABEL_NATURE, NATURES } from "@/lib/labels";
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
  return (
    <select name={nom} required defaultValue={defaut ?? ""} className={className}>
      <option value="" disabled>
        Choisir la nature du document…
      </option>
      {NATURES.map((n) => (
        <option key={n} value={n}>
          {LABEL_NATURE[n]}
        </option>
      ))}
    </select>
  );
}
