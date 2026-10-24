"use client";

import { useState } from "react";
import { DUREE_CONSERVATION_DEFAUT, LABEL_NATURE, NATURES } from "@/lib/labels";
import type { NatureDocument } from "@/lib/types";
import { enregistrerParametresArchivageAction } from "./actions";

const CHAMP = "w-24 rounded-md border border-paper-200 px-2 py-1.5 text-right text-sm";

export function FormulaireParametres({ delai, durees }: { delai: number; durees: Record<NatureDocument, number> }) {
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function enregistrer(formData: FormData) {
    setEnCours(true);
    setMessage(null);
    const resultat = await enregistrerParametresArchivageAction(formData);
    setEnCours(false);
    setMessage(resultat.erreur ? { ok: false, texte: resultat.erreur } : { ok: true, texte: "Règles enregistrées." });
  }

  return (
    <form action={enregistrer} className="rounded-lg border border-paper-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 font-serif text-base font-semibold">Règles d&apos;archivage</h2>
      <p className="mb-4 text-sm text-paper-muted">
        Ces règles s&apos;appliquent aux documents archivés à partir de maintenant ; un document déjà archivé garde la
        durée de conservation calculée le jour de son archivage.
      </p>

      <label className="mb-5 flex flex-wrap items-center gap-3 text-sm">
        <span className="font-medium text-[#1c2029]">Archivage automatique des documents publiés depuis plus de</span>
        <span className="flex items-center gap-2">
          <input name="delai" type="number" min={0} max={120} step={1} defaultValue={delai} className={CHAMP} />
          mois
        </span>
        <span className="w-full text-xs text-paper-soft">0 = pas d&apos;archivage automatique (archivage manuel uniquement).</span>
      </label>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[460px] text-sm">
          <thead className="bg-paper-50 text-left text-paper-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Nature du document</th>
              <th className="px-3 py-2 font-medium">Conservation (années)</th>
              <th className="px-3 py-2 font-medium">Par défaut</th>
            </tr>
          </thead>
          <tbody>
            {NATURES.map((n) => (
              <tr key={n} className="border-t border-paper-200">
                <td className="px-3 py-2">{LABEL_NATURE[n]}</td>
                <td className="px-3 py-2">
                  <input name={`duree_${n}`} type="number" min={0} max={100} step={1} defaultValue={durees[n]} className={CHAMP} />
                </td>
                <td className="px-3 py-2 text-paper-soft">
                  {DUREE_CONSERVATION_DEFAUT[n] === 0 ? "permanente" : `${DUREE_CONSERVATION_DEFAUT[n]} ans`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-paper-soft">0 année = conservation permanente.</p>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={enCours}
          className="rounded-md bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : "Enregistrer les règles"}
        </button>
        {message && <span className={`text-sm ${message.ok ? "text-emerald-700" : "text-red-600"}`}>{message.texte}</span>}
      </div>
    </form>
  );
}
