import { cookies } from "next/headers";
import { creerClientServeur } from "@/lib/supabase/server";
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

// Noms anglais des départements de l'organisation (migration 0026). Vide si
// la table n'existe pas encore ou en cas d'erreur : le nom français s'affiche.
export async function chargerNomsDepartementsEn(): Promise<Record<string, string>> {
  try {
    const supabase = await creerClientServeur();
    const { data, error } = await supabase.from("departements_noms_en").select("departement, nom_en");
    if (error || !data) return {};
    return Object.fromEntries((data as { departement: string; nom_en: string }[]).map((d) => [d.departement, d.nom_en]));
  } catch {
    return {};
  }
}

// Côté serveur : dep(nom) donne le nom d'un département dans la langue courante.
export async function traducteurDepartements(): Promise<(nom: string | null | undefined) => string> {
  const langue = await langueServeur();
  const carte = langue === "en" ? await chargerNomsDepartementsEn() : {};
  return (nom) => (nom ? (carte[nom] ?? nom) : "");
}
