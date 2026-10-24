import { cookies } from "next/headers";
import { COOKIE_LANGUE, localeDate, normaliserLangue, traducteur, type Langue } from "@/lib/i18n/plateforme";

export async function langueServeur(): Promise<Langue> {
  const magasin = await cookies();
  return normaliserLangue(magasin.get(COOKIE_LANGUE)?.value);
}

// Pour les pages et actions serveur : langue courante, fonction t() et
// locale des dates.
export async function traductionServeur() {
  const langue = await langueServeur();
  return { langue, t: traducteur(langue), dl: localeDate(langue) };
}
