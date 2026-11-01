import type { Langue } from "@/lib/i18n/plateforme";
import { FUSEAU } from "./constantes";

const locale = (l: Langue) => (l === "en" ? "en-GB" : "fr-FR");

export const formaterDate = (iso: string | null | undefined, l: Langue): string =>
  iso ? new Intl.DateTimeFormat(locale(l), { timeZone: FUSEAU }).format(new Date(iso)) : "";

export const formaterDateHeure = (iso: string | null | undefined, l: Langue): string =>
  iso ? new Intl.DateTimeFormat(locale(l), { dateStyle: "long", timeStyle: "short", timeZone: FUSEAU }).format(new Date(iso)) : "";

export function formaterTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / 1024 / 1024).toFixed(1)} Mo`;
}

/** Nom de fichier sûr pour le stockage (sans accents ni caractères problématiques). */
export function nomSur(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120);
}
