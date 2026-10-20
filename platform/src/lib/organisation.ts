// Point unique de personnalisation de la marque affichée dans l'interface.
// Même code, deux instances possibles (ex. KHS Bank pour la soutenance,
// une autre organisation en parallèle) : seules ces variables d'environnement
// changent d'un déploiement Vercel à l'autre — aucune valeur ci-dessous
// n'est en dur ailleurs dans le code. Sans ces variables (déploiement
// existant inchangé), les valeurs par défaut reproduisent exactement la
// marque KHS Bank actuelle.
export const NOM_ORGANISATION = process.env.NEXT_PUBLIC_ORG_NOM?.trim() || "KHS Bank";

export const SIGLE_ORGANISATION = process.env.NEXT_PUBLIC_ORG_SIGLE?.trim() || "KHS";

// Lettre affichée dans le logo carré de la barre latérale / page de connexion.
export const INITIALE_LOGO = (process.env.NEXT_PUBLIC_ORG_LOGO_LETTRE?.trim() || SIGLE_ORGANISATION.charAt(0) || "K").toUpperCase();

// Mention en bas du panneau de la page de connexion — par défaut celle de la
// démonstration académique KHS Bank ; à remplacer pour un déploiement réel.
export const MENTION_CONNEXION =
  process.env.NEXT_PUBLIC_ORG_MENTION_CONNEXION?.trim() || "Démonstration du Lot F — Audit de sécurité et GED sécurisée.";
