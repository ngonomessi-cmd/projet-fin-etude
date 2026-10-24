// Images proposées pour illustrer une actualité (fichiers de public/images/site/).
// La contrainte SQL de la migration 0022 n'accepte que des chemins de ce dossier.
export const IMAGES_ACTUALITES = [
  { url: "/images/site/hero-missions.jpg", libelle: "Ville et drapeau", libelleEn: "City and flag" },
  { url: "/images/site/hero-accueil.jpg", libelle: "Ville au coucher du soleil", libelleEn: "City at sunset" },
  { url: "/images/site/route.jpg", libelle: "Route et volcan (infrastructures)", libelleEn: "Road and volcano (infrastructure)" },
  { url: "/images/site/paysage-confiance.jpg", libelle: "Paysage de montagne", libelleEn: "Mountain landscape" },
  { url: "/images/site/mission-2.jpg", libelle: "Littoral et ville", libelleEn: "Coastline and city" },
  { url: "/images/site/mission-3.jpg", libelle: "Dossier d'agrément", libelleEn: "Approval file" },
  { url: "/images/site/mission-4.jpg", libelle: "Réunion institutionnelle", libelleEn: "Institutional meeting" },
  { url: "/images/site/mission-5.jpg", libelle: "Suivi, tableau de bord", libelleEn: "Monitoring, dashboard" },
  { url: "/images/site/bande-partenaire.jpg", libelle: "Croissance, finance", libelleEn: "Growth, finance" },
  { url: "/images/site/actualite-1.jpg", libelle: "Forum, salle de conférence", libelleEn: "Forum, conference room" },
  { url: "/images/site/actualite-2.jpg", libelle: "Port et industrie", libelleEn: "Port and industry" },
  { url: "/images/site/actualite-3.jpg", libelle: "Plantation agricole", libelleEn: "Farm plantation" },
] as const;

const PAR_DEFAUT = ["/images/site/actualite-1.jpg", "/images/site/actualite-2.jpg", "/images/site/actualite-3.jpg"];

export function imageActualite(imageUrl: string | null, index: number): string {
  if (imageUrl && IMAGES_ACTUALITES.some((i) => i.url === imageUrl)) return imageUrl;
  return PAR_DEFAUT[index % PAR_DEFAUT.length];
}
