// Point unique de personnalisation de la marque affichée dans l'interface.
// Même code, deux instances possibles (ex. KHS Bank pour la soutenance,
// une autre organisation en parallèle) : seules ces variables d'environnement
// changent d'un déploiement Vercel à l'autre — aucune valeur ci-dessous
// n'est en dur ailleurs dans le code. Sans ces variables (déploiement
// existant inchangé), les valeurs par défaut reproduisent exactement la
// marque KHS Bank actuelle.
export const NOM_ORGANISATION = process.env.NEXT_PUBLIC_ORG_NOM?.trim() || "KHS Bank";

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

// Mention en bas du panneau de la page de connexion — par défaut celle de la
// démonstration académique KHS Bank ; à remplacer pour un déploiement réel.
export const MENTION_CONNEXION =
  process.env.NEXT_PUBLIC_ORG_MENTION_CONNEXION?.trim() || "Démonstration du Lot F — Audit de sécurité et GED sécurisée.";
