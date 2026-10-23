"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ActualitePublique } from "@/lib/types";
import { creerActualiteAction, modifierActualiteAction, supprimerActualiteAction } from "./actions";

export function FormulaireActualite({ actualite }: { actualite?: ActualitePublique }) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(formData: FormData) {
    setEnCours(true);
    setErreur(null);
    const resultat = actualite
      ? await modifierActualiteAction(actualite.id, formData)
      : await creerActualiteAction(formData);
    setEnCours(false);
    if (resultat?.erreur) {
      setErreur(resultat.erreur);
      return;
    }
    if (actualite) router.refresh();
  }

  async function supprimer() {
    if (!actualite) return;
    if (!window.confirm(`Supprimer définitivement « ${actualite.titre} » ? Cette action est irréversible.`)) return;
    setEnCours(true);
    const resultat = await supprimerActualiteAction(actualite.id);
    if (resultat?.erreur) {
      setEnCours(false);
      setErreur(resultat.erreur);
    }
  }

  return (
    <form action={soumettre} className="space-y-4 rounded-lg border border-paper-200 bg-white p-5 shadow-sm">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#1c2029]">Titre</span>
        <input
          name="titre"
          required
          defaultValue={actualite?.titre}
          className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#1c2029]">Extrait (résumé affiché dans la liste)</span>
        <textarea
          name="extrait"
          rows={2}
          defaultValue={actualite?.extrait ?? ""}
          className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#1c2029]">Contenu</span>
        <textarea
          name="contenu"
          required
          rows={12}
          defaultValue={actualite?.contenu}
          className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm leading-relaxed"
        />
        <span className="mt-1 block text-xs text-paper-soft">
          Texte simple : les lignes vides séparent les paragraphes à l&apos;affichage.
        </span>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-[#1c2029]">Statut</span>
        <select
          name="statut"
          defaultValue={actualite?.statut ?? "brouillon"}
          className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm"
        >
          <option value="brouillon">Brouillon (non visible sur le site public)</option>
          <option value="publie">Publié (visible sur le site public)</option>
        </select>
      </label>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={enCours}
          className="rounded-md bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50"
        >
          {enCours ? "Enregistrement…" : actualite ? "Enregistrer" : "Créer"}
        </button>
        {actualite && (
          <button
            type="button"
            onClick={supprimer}
            disabled={enCours}
            className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Supprimer
          </button>
        )}
      </div>
    </form>
  );
}
