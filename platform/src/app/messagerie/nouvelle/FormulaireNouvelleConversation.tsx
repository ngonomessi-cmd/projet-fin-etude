"use client";

import { useState } from "react";
import { ouvrirConversationPriveeAction, creerGroupeAction } from "../actions";
import { libelles } from "@/lib/labels";
import type { Profil } from "@/lib/types";
import { useTraduction } from "@/components/i18n/Langue";

type ProfilAllege = Pick<Profil, "id" | "nom_complet" | "departement" | "role">;

export function FormulaireNouvelleConversation({ profils }: { profils: ProfilAllege[] }) {
  const { t, langue } = useTraduction();
  const roles = libelles(langue).role;
  const [mode, setMode] = useState<"privee" | "groupe">("privee");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function demarrerPrivee(formData: FormData) {
    setEnCours(true);
    setErreur(null);
    const autreId = String(formData.get("destinataire") ?? "");
    if (!autreId) {
      setErreur(t("Choisissez un destinataire.", "Choose a recipient."));
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
    <div className="rounded-xl border border-paper-200 bg-white p-6 shadow-sm">
      <div className="mb-5 inline-flex rounded-full border border-paper-200 bg-paper-50 p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("privee")}
          className={`rounded-full px-4 py-2 font-semibold transition-colors ${mode === "privee" ? "bg-navy-950 text-white" : "text-paper-muted"}`}
        >
          {t("Conversation privée", "Private conversation")}
        </button>
        <button
          type="button"
          onClick={() => setMode("groupe")}
          className={`rounded-full px-4 py-2 font-semibold transition-colors ${mode === "groupe" ? "bg-navy-950 text-white" : "text-paper-muted"}`}
        >
          {t("Groupe de travail", "Working group")}
        </button>
      </div>

      {mode === "privee" ? (
        <form action={demarrerPrivee} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-2 block font-semibold text-paper-muted">{t("Destinataire", "Recipient")}</span>
            <select name="destinataire" required defaultValue="" className="w-full rounded-md border border-paper-200 bg-paper-50 px-3 py-2.5 text-sm">
              <option value="" disabled>
                {t("Choisir un agent…", "Choose a person…")}
              </option>
              {profils.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom_complet} — {roles[p.role]} · {p.departement}
                </option>
              ))}
            </select>
          </label>
          {erreur && <p className="text-sm text-red-600">{erreur}</p>}
          <button
            type="submit"
            disabled={enCours}
            className="w-full rounded-md bg-navy-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-900 disabled:opacity-50"
          >
            {enCours ? t("Ouverture…", "Opening…") : t("Ouvrir la conversation", "Open the conversation")}
          </button>
        </form>
      ) : (
        <form action={demarrerGroupe} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-2 block font-semibold text-paper-muted">{t("Objet du groupe", "Group subject")}</span>
            <input name="titre" required placeholder={t("Ex. Préparation de l'audit annuel", "E.g. Annual audit preparation")} className="w-full rounded-md border border-paper-200 px-3 py-2.5 text-sm" />
          </label>
          <fieldset className="max-h-64 overflow-y-auto rounded-md border border-paper-200">
            <legend className="sr-only">{t("Participants (60 au plus)", "Participants (60 at most)")}</legend>
            <div className="flex items-center justify-between border-b border-paper-200 bg-paper-50 px-3 py-1.5 text-xs font-semibold text-paper-muted">
              <span>Participants</span>
              <span>{t("60 au plus", "60 at most")}</span>
            </div>
            {profils.map((p) => (
              <label key={p.id} className="flex items-center gap-2.5 border-b border-paper-200 px-3 py-2 text-sm last:border-b-0 hover:bg-paper-50">
                <input type="checkbox" name="participants" value={p.id} className="rounded border-paper-200 accent-navy-950" />
                <span className="text-[#1c2029]">{p.nom_complet}</span>
                <span className="text-paper-soft">— {roles[p.role]} · {p.departement}</span>
              </label>
            ))}
          </fieldset>
          {erreur && <p className="text-sm text-red-600">{erreur}</p>}
          <button
            type="submit"
            disabled={enCours}
            className="w-full rounded-md bg-navy-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-900 disabled:opacity-50"
          >
            {enCours ? t("Création…", "Creating…") : t("Créer le groupe", "Create the group")}
          </button>
        </form>
      )}
    </div>
  );
}
