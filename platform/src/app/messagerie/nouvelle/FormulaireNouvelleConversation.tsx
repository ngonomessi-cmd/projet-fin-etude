"use client";

import { useState } from "react";
import { ouvrirConversationPriveeAction, creerGroupeAction } from "../actions";
import { LABEL_ROLE } from "@/lib/labels";
import type { Profil } from "@/lib/types";

type ProfilAllege = Pick<Profil, "id" | "nom_complet" | "departement" | "role">;

export function FormulaireNouvelleConversation({ profils }: { profils: ProfilAllege[] }) {
  const [mode, setMode] = useState<"privee" | "groupe">("privee");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function demarrerPrivee(formData: FormData) {
    setEnCours(true);
    setErreur(null);
    const autreId = String(formData.get("destinataire") ?? "");
    if (!autreId) {
      setErreur("Choisissez un destinataire.");
      setEnCours(false);
      return;
    }
    const resultat = await ouvrirConversationPriveeAction(autreId);
    setEnCours(false);
    if (resultat?.erreur) setErreur(resultat.erreur);
  }

  async function demarrerGroupe(formData: FormData) {
    setEnCours(true);
    setErreur(null);
    const resultat = await creerGroupeAction(formData);
    setEnCours(false);
    if (resultat?.erreur) setErreur(resultat.erreur);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setMode("privee")}
          className={`rounded-md px-3 py-1.5 font-medium ${mode === "privee" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
        >
          Conversation privée
        </button>
        <button
          type="button"
          onClick={() => setMode("groupe")}
          className={`rounded-md px-3 py-1.5 font-medium ${mode === "groupe" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
        >
          Groupe de travail
        </button>
      </div>

      {mode === "privee" ? (
        <form action={demarrerPrivee} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Destinataire</span>
            <select name="destinataire" required defaultValue="" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="" disabled>
                Choisir un agent…
              </option>
              {profils.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom_complet} — {LABEL_ROLE[p.role]} · {p.departement}
                </option>
              ))}
            </select>
          </label>
          {erreur && <p className="text-sm text-red-600">{erreur}</p>}
          <button
            type="submit"
            disabled={enCours}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {enCours ? "Ouverture…" : "Ouvrir la conversation"}
          </button>
        </form>
      ) : (
        <form action={demarrerGroupe} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Objet du groupe</span>
            <input name="titre" required placeholder="Ex. Préparation de l'audit annuel" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </label>
          <fieldset className="max-h-64 overflow-y-auto rounded-md border border-slate-200 p-2">
            <legend className="px-1 text-sm font-medium text-slate-700">Participants (60 au plus)</legend>
            {profils.map((p) => (
              <label key={p.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50">
                <input type="checkbox" name="participants" value={p.id} className="rounded border-slate-300" />
                {p.nom_complet} — {LABEL_ROLE[p.role]} · {p.departement}
              </label>
            ))}
          </fieldset>
          {erreur && <p className="text-sm text-red-600">{erreur}</p>}
          <button
            type="submit"
            disabled={enCours}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {enCours ? "Création…" : "Créer le groupe"}
          </button>
        </form>
      )}
    </div>
  );
}
