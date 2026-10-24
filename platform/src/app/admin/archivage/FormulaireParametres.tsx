"use client";

import { useState } from "react";
import { DUREE_CONSERVATION_DEFAUT, NATURES, libelles } from "@/lib/labels";
import type { NatureDocument } from "@/lib/types";
import { enregistrerParametresArchivageAction } from "./actions";
import { useTraduction } from "@/components/i18n/Langue";

const CHAMP = "w-24 rounded-md border border-paper-200 px-2 py-1.5 text-right text-sm";

export function FormulaireParametres({ delai, durees }: { delai: number; durees: Record<NatureDocument, number> }) {
  const { t, langue } = useTraduction();
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function enregistrer(formData: FormData) {
    setEnCours(true);
    setMessage(null);
    const resultat = await enregistrerParametresArchivageAction(formData);
    setEnCours(false);
    setMessage(resultat.erreur ? { ok: false, texte: resultat.erreur } : { ok: true, texte: t("Règles enregistrées.", "Rules saved.") });
  }

  return (
    <form action={enregistrer} className="rounded-lg border border-paper-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 font-serif text-base font-semibold">{t("Règles d'archivage", "Archiving rules")}</h2>
      <p className="mb-4 text-sm text-paper-muted">
        {t(
          "Ces règles s'appliquent aux documents archivés à partir de maintenant ; un document déjà archivé garde la durée de conservation calculée le jour de son archivage.",
          "These rules apply to documents archived from now on; an already archived document keeps the retention period computed on the day it was archived."
        )}
      </p>

      <label className="mb-5 flex flex-wrap items-center gap-3 text-sm">
        <span className="font-medium text-[#1c2029]">{t("Archivage automatique des documents publiés depuis plus de", "Automatically archive documents published more than")}</span>
        <span className="flex items-center gap-2">
          <input name="delai" type="number" min={0} max={120} step={1} defaultValue={delai} className={CHAMP} />
          {t("mois", "months ago")}
        </span>
        <span className="w-full text-xs text-paper-soft">
          {t("0 = pas d'archivage automatique (archivage manuel uniquement).", "0 = no automatic archiving (manual archiving only).")}
        </span>
      </label>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[460px] text-sm">
          <thead className="bg-paper-50 text-left text-paper-muted">
            <tr>
              <th className="px-3 py-2 font-medium">{t("Nature du document", "Document type")}</th>
              <th className="px-3 py-2 font-medium">{t("Conservation (années)", "Retention (years)")}</th>
              <th className="px-3 py-2 font-medium">{t("Par défaut", "Default")}</th>
            </tr>
          </thead>
          <tbody>
            {NATURES.map((n) => (
              <tr key={n} className="border-t border-paper-200">
                <td className="px-3 py-2">{libelles(langue).nature[n]}</td>
                <td className="px-3 py-2">
                  <input name={`duree_${n}`} type="number" min={0} max={100} step={1} defaultValue={durees[n]} className={CHAMP} />
                </td>
                <td className="px-3 py-2 text-paper-soft">
                  {DUREE_CONSERVATION_DEFAUT[n] === 0 ? t("permanente", "permanent") : `${DUREE_CONSERVATION_DEFAUT[n]} ${t("ans", "years")}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-paper-soft">{t("0 année = conservation permanente.", "0 years = permanent retention.")}</p>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={enCours}
          className="rounded-md bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50"
        >
          {enCours ? t("Enregistrement…", "Saving…") : t("Enregistrer les règles", "Save the rules")}
        </button>
        {message && <span className={`text-sm ${message.ok ? "text-emerald-700" : "text-red-600"}`}>{message.texte}</span>}
      </div>
    </form>
  );
}
