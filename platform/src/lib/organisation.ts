// Point unique de personnalisation de la marque affichée dans l'interface.
// Même code, deux instances possibles (ex. KHS Bank pour la soutenance,
// une autre organisation en parallèle) : seules ces variables d'environnement
// changent d'un déploiement Vercel à l'autre — aucune valeur ci-dessous
// n'est en dur ailleurs dans le code. Sans ces variables (déploiement
// existant inchangé), les valeurs par défaut reproduisent exactement la
// marque KHS Bank actuelle.
export const NOM_ORGANISATION = process.env.NEXT_PUBLIC_ORG_NOM?.trim() || "KHS Bank";

// Nom affiché sur la version anglaise du site public ; à défaut, le nom
// ci-dessus est repris tel quel.
export const NOM_ORGANISATION_EN = process.env.NEXT_PUBLIC_ORG_NOM_EN?.trim() || NOM_ORGANISATION;

export function nomOrganisation(locale: "fr" | "en"): string {
  return locale === "en" ? NOM_ORGANISATION_EN : NOM_ORGANISATION;
}

export const SIGLE_ORGANISATION = process.env.NEXT_PUBLIC_ORG_SIGLE?.trim() || "KHS";

// Lettre affichée dans le logo carré de la barre latérale / page de connexion
// — utilisée seulement si aucune image de logo n'est fournie ci-dessous.
export const INITIALE_LOGO = (process.env.NEXT_PUBLIC_ORG_LOGO_LETTRE?.trim() || SIGLE_ORGANISATION.charAt(0) || "K").toUpperCase();

// Chemin (sous public/) ou URL complète d'un vrai logo image, déposé dans le
// dépôt (ex. "/logos/mon-logo.png") — prioritaire sur le badge-lettre
// ci-dessus quand il est défini. Laissé vide, chaque déploiement garde son
// badge-lettre (aucun fichier image n'est donc affiché pour les autres
// organisations qui partagent ce même code).
export const URL_LOGO_ORGANISATION = process.env.NEXT_PUBLIC_ORG_LOGO_URL?.trim() || null;

// Deux couleurs d'ancrage (format hexadécimal), à partir desquelles toute la
// gamme "navy" (fonds sombres) et "gold" (accents) est générée (cf.
// src/lib/couleurs.ts) — jamais une dizaine de nuances à choisir à la main.
// Laissées vides, les couleurs KHS Bank actuelles restent inchangées (aucun
// calcul n'est fait, au lieu de risquer de les reproduire à l'identique par
// calcul).
export const COULEUR_PRIMAIRE = process.env.NEXT_PUBLIC_ORG_COULEUR_PRIMAIRE?.trim() || null;
export const COULEUR_ACCENT = process.env.NEXT_PUBLIC_ORG_COULEUR_ACCENT?.trim() || null;

// Liseré tricolore optionnel sous le logo (ex. couleurs du drapeau national),
// une liste de 2 à 4 couleurs séparées par des virgules. Vide par défaut.
export const RUBAN_COULEURS = (process.env.NEXT_PUBLIC_ORG_COULEUR_RUBAN?.trim() || "")
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);

// Mention en bas du panneau de la page de connexion — par défaut celle de la
// démonstration académique KHS Bank ; à remplacer pour un déploiement réel.
export const MENTION_CONNEXION =
  process.env.NEXT_PUBLIC_ORG_MENTION_CONNEXION?.trim() || "Démonstration du Lot F — Audit de sécurité et GED sécurisée.";

// Version anglaise (plateforme bilingue) ; à défaut, la mention personnalisée
// est reprise telle quelle.
export const MENTION_CONNEXION_EN =
  process.env.NEXT_PUBLIC_ORG_MENTION_CONNEXION_EN?.trim() ||
  process.env.NEXT_PUBLIC_ORG_MENTION_CONNEXION?.trim() ||
  "Lot F demonstration — Security audit and secure EDMS.";

// Active le site public institutionnel (page d'accueil, pages statiques,
// actualités) à la place de la redirection directe vers /documents. Désactivé
// par défaut : la démonstration académique KHS Bank garde son comportement
// actuel (/ → /documents) sans aucun changement.
export const SITE_PUBLIC_ACTIF = process.env.NEXT_PUBLIC_ORG_SITE_PUBLIC === "true";
