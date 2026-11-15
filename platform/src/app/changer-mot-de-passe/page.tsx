"use client";

import { useState } from "react";
import { LogoOrganisation } from "@/components/LogoOrganisation";
import { useTraduction } from "@/components/i18n/Langue";
import { changerMotDePasseAction } from "./actions";

// Première connexion d'un compte créé par un administrateur : le mot de passe provisoire
// doit être remplacé avant d'accéder à l'Espace Agents.
export default function PageChangerMotDePasse() {
  const { t } = useTraduction();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(formData: FormData) {
    setEnCours(true);
    setErreur(null);
    const resultat = await changerMotDePasseAction(formData);
    if (resultat?.erreur) {
      setErreur(resultat.erreur);
      setEnCours(false);
    }
  }

  const champ = "w-full rounded-md border border-paper-200 px-3 py-2 text-sm";
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><LogoOrganisation taille="lg" /></div>
        <h1 className="mb-1 font-serif text-2xl font-semibold">{t("Choisissez votre mot de passe", "Choose your password")}</h1>
        <p className="mb-5 text-sm text-paper-muted">
          {t(
            "Votre compte a été créé avec un mot de passe provisoire. Remplacez-le par un mot de passe personnel que vous seul connaissez.",
            "Your account was created with a temporary password. Replace it with a personal password that only you know."
          )}
        </p>
        <form action={soumettre} className="space-y-3 rounded-lg border border-paper-200 bg-white p-5 shadow-sm">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t("Nouveau mot de passe", "New password")}</span>
            <input name="nouveau" type="password" autoComplete="new-password" required minLength={10} className={champ} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t("Confirmation", "Confirm")}</span>
            <input name="confirmation" type="password" autoComplete="new-password" required minLength={10} className={champ} />
          </label>
          <p className="text-xs text-paper-muted">{t("Au moins 10 caractères, avec au moins une lettre et un chiffre.", "At least 10 characters, with at least one letter and one digit.")}</p>
          {erreur && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>}
          <button type="submit" disabled={enCours} className="w-full rounded-md bg-[#1c2029] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {enCours ? t("Enregistrement…", "Saving…") : t("Enregistrer mon mot de passe", "Save my password")}
          </button>
        </form>
      </div>
    </main>
  );
}
