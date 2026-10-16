"use client";

import { useState } from "react";
import { deposerDocumentAction } from "./actions";

export function FormulaireDepot() {
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
        <span className="mb-1 block font-medium text-[#1c2029]">Titre</span>
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
            Choisir un niveau de confidentialité…
          </option>
          <option value="public_interne">Public interne</option>
          <option value="restreint">Restreint</option>
          <option value="confidentiel">Confidentiel</option>
        </select>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#1c2029]">Fichier</span>
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
        {enCours ? "Dépôt en cours…" : "Créer le brouillon"}
      </button>
    </form>
  );
}
