"use client";

import { useRef, useState } from "react";
import { useTraduction } from "@/components/i18n/Langue";
import { creerCompteAction } from "./actions";

// Création d'un compte par l'administrateur, avec un mot de passe provisoire que l'agent
// devra remplacer à sa première connexion.
export function FormulaireCreationCompte() {
  const { t } = useTraduction();
  const formulaire = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(formData: FormData) {
    setEnCours(true);
    setMessage(null);
    const r = await creerCompteAction(formData);
    setEnCours(false);
    if (r.erreur) setMessage({ ok: false, texte: r.erreur });
    else {
      setMessage({ ok: true, texte: r.succes ?? "" });
      formulaire.current?.reset();
    }
  }

  const champ = "w-full rounded-md border border-paper-200 px-3 py-2 text-sm";
  return (
    <section className="mt-6 max-w-3xl rounded-lg border border-paper-200 bg-white p-4 shadow-sm">
      <h2 className="mb-1 font-serif text-base font-semibold">{t("Créer un compte", "Create an account")}</h2>
      <p className="mb-3 text-sm text-paper-muted">
        {t(
          "Le compte reçoit le rôle Lecteur et un mot de passe provisoire. À sa première connexion, l'agent configure Google Authenticator puis doit choisir son propre mot de passe. Communiquez le mot de passe provisoire hors de la plateforme.",
          "The account gets the Reader role and a temporary password. At first sign-in, the user sets up Google Authenticator and must then choose their own password. Share the temporary password outside the platform."
        )}
      </p>
      <form ref={formulaire} action={soumettre} className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t("Nom complet", "Full name")}</span>
          <input name="nom_complet" required className={champ} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t("Département", "Department")}</span>
          <input name="departement" required className={champ} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t("E-mail", "Email")}</span>
          <input name="email" type="email" required autoComplete="off" className={champ} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t("Mot de passe provisoire", "Temporary password")}</span>
          <input name="mot_de_passe" type="text" required minLength={10} autoComplete="off" className={champ} />
        </label>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={enCours} className="rounded-md bg-[#1c2029] px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {enCours ? t("Création…", "Creating…") : t("Créer le compte", "Create the account")}
          </button>
          {message && (
            <p className={`rounded-md px-3 py-2 text-sm ${message.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{message.texte}</p>
          )}
        </div>
      </form>
    </section>
  );
}
