"use client";

import { useState } from "react";
import { DICTIONNAIRE, type Locale } from "@/lib/i18n/dictionnaire";
import { envoyerMessageContactAction } from "@/app/(public)/contact/actions";
import { IconeFleche, IconeValide } from "@/components/site-public/IconesSite";

const CHAMP =
  "w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-encre-900 outline-none transition-colors placeholder:text-slate-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25";

export function FormulaireContact({ locale, sujetInitial }: { locale: Locale; sujetInitial: string }) {
  const t = DICTIONNAIRE[locale].contact;
  const services = DICTIONNAIRE[locale].services.items;
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);

  async function soumettre(formData: FormData) {
    setEnCours(true);
    setErreur(null);
    const resultat = await envoyerMessageContactAction(locale, formData);
    setEnCours(false);
    if (resultat.ok) setEnvoye(true);
    else setErreur(resultat.erreur);
  }

  if (envoye) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <IconeValide className="h-14 w-14 text-emerald-600" />
        <h3 className="mt-4 font-serif text-2xl font-semibold text-encre-900">{t.succesTitre}</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">{t.succes}</p>
        <button
          type="button"
          onClick={() => setEnvoye(false)}
          className="mt-6 text-sm font-semibold text-encre-900 underline-offset-4 hover:text-gold-600 hover:underline"
        >
          {t.nouveau}
        </button>
      </div>
    );
  }

  const libelle = (texte: string, optionnel = false) => (
    <span className="mb-1.5 block text-sm font-medium text-encre-900">
      {texte}
      {optionnel ? <span className="font-normal text-slate-400"> ({t.optionnel})</span> : <span className="text-gold-600"> *</span>}
    </span>
  );

  return (
    <form action={soumettre} className="space-y-5">
      <div className="hidden" aria-hidden="true">
        <label>
          Site web
          <input name="site_web" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          {libelle(t.nom)}
          <input name="nom" required minLength={2} maxLength={120} autoComplete="name" className={CHAMP} />
        </label>
        <label className="block">
          {libelle(t.email)}
          <input name="email" type="email" required maxLength={200} autoComplete="email" className={CHAMP} />
        </label>
        <label className="block">
          {libelle(t.telephone, true)}
          <input name="telephone" type="tel" maxLength={40} autoComplete="tel" className={CHAMP} />
        </label>
        <label className="block">
          {libelle(t.entreprise, true)}
          <input name="entreprise" maxLength={160} autoComplete="organization" className={CHAMP} />
        </label>
      </div>

      <label className="block">
        {libelle(t.sujet)}
        <select name="sujet" required defaultValue={sujetInitial} className={CHAMP}>
          {services.map((service) => (
            <option key={service.titre} value={service.titre}>
              {service.titre}
            </option>
          ))}
          <option value={t.sujetAutre}>{t.sujetAutre}</option>
        </select>
      </label>

      <label className="block">
        {libelle(t.message)}
        <textarea name="message" required minLength={10} maxLength={5000} rows={6} className={`${CHAMP} resize-y leading-relaxed`} />
      </label>

      {erreur && <p className="rounded-md bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{erreur}</p>}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-sm text-xs leading-relaxed text-slate-500">{t.confidentialite}</p>
        <button
          type="submit"
          disabled={enCours}
          className="inline-flex shrink-0 items-center justify-center gap-2.5 rounded-md bg-gold-500 px-6 py-3.5 text-sm font-semibold text-encre-950 transition-colors hover:bg-gold-600 disabled:opacity-60"
        >
          {enCours ? t.envoi : t.envoyer}
          {!enCours && <IconeFleche className="h-4 w-4" />}
        </button>
      </div>
    </form>
  );
}
