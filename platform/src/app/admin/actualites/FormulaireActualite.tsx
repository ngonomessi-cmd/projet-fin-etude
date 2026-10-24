"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ActualitePublique } from "@/lib/types";
import { IMAGES_ACTUALITES } from "@/lib/images-actualites";
import { creerActualiteAction, modifierActualiteAction, supprimerActualiteAction } from "./actions";

export function FormulaireActualite({ actualite }: { actualite?: ActualitePublique }) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [image, setImage] = useState<string>(actualite?.image_url ?? "");

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
    <form action={soumettre} className="space-y-6 rounded-lg border border-paper-200 bg-white p-5 shadow-sm">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-paper-soft">Français</p>

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
            rows={10}
            defaultValue={actualite?.contenu}
            className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm leading-relaxed"
          />
          <span className="mt-1 block text-xs text-paper-soft">
            Texte simple : les lignes vides séparent les paragraphes à l&apos;affichage.
          </span>
        </label>
      </div>

      <div className="space-y-4 border-t border-paper-200 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-paper-soft">
          English <span className="font-normal normal-case text-paper-soft">(optionnel — à défaut, la version française s&apos;affiche)</span>
        </p>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-[#1c2029]">Title</span>
          <input
            name="titre_en"
            defaultValue={actualite?.titre_en ?? ""}
            className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-[#1c2029]">Excerpt</span>
          <textarea
            name="extrait_en"
            rows={2}
            defaultValue={actualite?.extrait_en ?? ""}
            className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-[#1c2029]">Content</span>
          <textarea
            name="contenu_en"
            rows={10}
            defaultValue={actualite?.contenu_en ?? ""}
            className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm leading-relaxed"
          />
        </label>
      </div>

      <div className="block text-sm">
        <label htmlFor="image_url" className="mb-1 block font-medium text-[#1c2029]">
          Illustration
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            id="image_url"
            name="image_url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm sm:flex-1"
          >
            <option value="">Image par défaut</option>
            {IMAGES_ACTUALITES.map((i) => (
              <option key={i.url} value={i.url}>
                {i.libelle}
              </option>
            ))}
          </select>
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-16 w-28 shrink-0 rounded-md object-cover" />
          )}
        </div>
      </div>

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
