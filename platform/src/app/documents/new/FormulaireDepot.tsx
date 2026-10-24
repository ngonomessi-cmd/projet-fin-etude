"use client";

import { useState } from "react";
import { deposerDocumentAction } from "./actions";
import { ChampNature } from "@/components/ChampNature";
import { useTraduction } from "@/components/i18n/Langue";

export function FormulaireDepot() {
  const { t } = useTraduction();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(formData: FormData) {
    setEnCours(true);
    setErreur(null);
    const resultat = await deposerDocumentAction(formData);
    setEnCours(false);
    if (resultat?.erreur) setErreur(resultat.erreur);
  }

  return (
    <form action={soumettre} className="space-y-4 rounded-lg border border-paper-200 bg-white p-5 shadow-sm">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#1c2029]">{t("Titre", "Title")}</span>
        <input name="titre" required className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm" />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#1c2029]">Description</span>
        <textarea name="description" rows={3} className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm" />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#1c2029]">Classification</span>
        <select name="classification" required defaultValue="" className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm">
          <option value="" disabled>
            {t("Choisir un niveau de confidentialité…", "Choose a confidentiality level…")}
          </option>
          <option value="public_interne">{t("Public interne", "Internal public")}</option>
          <option value="restreint">{t("Restreint", "Restricted")}</option>
          <option value="confidentiel">{t("Confidentiel", "Confidential")}</option>
        </select>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#1c2029]">{t("Nature", "Document type")}</span>
        <ChampNature className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm" />
        <span className="mt-1 block text-xs text-paper-soft">
          {t("Détermine la durée de conservation une fois le document archivé.", "Sets how long the document is kept once archived.")}
        </span>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#1c2029]">{t("Fichier", "File")}</span>
        <input
          name="fichier"
          type="file"
          required
          className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-paper-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#1c2029] hover:file:bg-paper-200"
        />
      </label>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <button
        type="submit"
        disabled={enCours}
        className="w-full rounded-md bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50"
      >
        {enCours ? t("Dépôt en cours…", "Uploading…") : t("Créer le brouillon", "Create the draft")}
      </button>
    </form>
  );
}
