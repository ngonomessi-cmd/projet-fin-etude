import { SITE_PUBLIC_ACTIF } from "@/lib/organisation";

// Langue de l'espace connecté (GED). Le site public, lui, porte sa langue
// dans l'adresse (/en/...) : cf. lib/i18n/dictionnaire.ts.
export type Langue = "fr" | "en";

export const COOKIE_LANGUE = "ged_langue";

// Bilingue seulement sur le déploiement qui a aussi le site public bilingue :
// la démonstration KHS Bank reste entièrement en français, sans sélecteur.
export const PLATEFORME_BILINGUE = SITE_PUBLIC_ACTIF;

export function normaliserLangue(valeur: string | null | undefined): Langue {
  return PLATEFORME_BILINGUE && valeur === "en" ? "en" : "fr";
}

// t("Texte français", "English text") : les deux versions restent côte à
// côte dans le code, impossible d'en oublier une.
export type Traduire = (fr: string, en: string) => string;

export function traducteur(langue: Langue): Traduire {
  return (fr, en) => (langue === "en" ? en : fr);
}

export function localeDate(langue: Langue): string {
  return langue === "en" ? "en-GB" : "fr-FR";
}
