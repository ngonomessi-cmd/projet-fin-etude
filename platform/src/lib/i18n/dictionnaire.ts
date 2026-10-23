export type Locale = "fr" | "en";

// Préfixe d'URL du site public pour une langue donnée — "" pour le français
// (langue par défaut, URLs inchangées), "/en" pour l'anglais.
export function prefixeLocale(locale: Locale): string {
  return locale === "en" ? "/en" : "";
}

// Fait correspondre un chemin courant (pathname) à son équivalent dans une
// autre langue, en ajoutant/retirant le préfixe "/en" — utilisé par le
// sélecteur de langue de l'en-tête pour rester sur la même page.
export function cheminAutreLocale(pathname: string, cible: Locale): string {
  const sansPrefixe = pathname.startsWith("/en") ? pathname.slice(3) || "/" : pathname;
  if (cible === "fr") return sansPrefixe;
  return sansPrefixe === "/" ? "/en" : `/en${sansPrefixe}`;
}

export const DICTIONNAIRE = {
  fr: {
    nav: { accueil: "Accueil", missions: "Missions", services: "Services", actualites: "Actualités" },
    hero: {
      surtitre: "",
      titre: "Le guichet unique de la promotion des investissements",
      description:
        "Information, accompagnement des dossiers d'agrément et mise en relation avec les administrations compétentes : nous facilitons chaque étape du parcours de l'investisseur.",
      cta1: "Découvrir nos missions",
      cta2: "Voir les actualités",
    },
    missions: {
      titre: "Nos missions",
      soustitre: "Un mandat centré sur l'investisseur, de la première information jusqu'au suivi des engagements.",
      items: [
        {
          titre: "Guichet unique de l'investissement",
          description:
            "Un point d'entrée unique qui centralise l'information, les formalités et les démarches administratives liées à l'investissement, pour réduire les délais et simplifier le parcours de l'investisseur.",
        },
        {
          titre: "Promotion de l'image du pays",
          description:
            "Valoriser les opportunités d'investissement et l'attractivité du territoire auprès des investisseurs nationaux et internationaux, à travers l'information économique et la représentation lors d'évènements dédiés.",
        },
        {
          titre: "Accompagnement des dossiers d'agrément",
          description:
            "Assister les porteurs de projets dans la constitution et l'instruction de leurs demandes d'agrément aux régimes incitatifs prévus par la législation en vigueur.",
        },
        {
          titre: "Mise en relation avec les administrations",
          description:
            "Faciliter le dialogue entre les investisseurs et les administrations compétentes, afin de lever les obstacles rencontrés au cours de la réalisation des projets.",
        },
        {
          titre: "Suivi des engagements",
          description:
            "Assurer le suivi des engagements pris par les investisseurs agréés et des administrations concernées, dans une logique de partenariat durable.",
        },
      ],
    },
    services: {
      titre: "Services aux investisseurs",
      items: [
        "Information économique et réglementaire sur l'investissement",
        "Pré-diagnostic et orientation des projets d'investissement",
        "Constitution et instruction des dossiers d'agrément aux régimes incitatifs",
        "Mise en relation avec les administrations et partenaires institutionnels",
        "Suivi-accompagnement des projets agréés jusqu'à leur réalisation",
      ],
    },
    actualitesRecentes: { titre: "Actualités récentes", lienTout: "Toutes les actualités →" },
    actualitesListe: {
      titre: "Actualités",
      description: "Les dernières actualités publiées par l'agence.",
      vide: "Aucune actualité publiée pour le moment.",
    },
    actualiteDetail: { retour: "← Toutes les actualités" },
    footer: {
      description:
        "Guichet unique de la promotion des investissements : information, accompagnement des dossiers d'agrément et mise en relation avec les administrations compétentes.",
      navTitre: "Navigation",
      accesTitre: "Accès",
      accesDescription:
        "Agents et partenaires habilités : accédez à la gestion électronique de documents sécurisée de l'agence.",
      accesCta: "Accéder à la plateforme GED →",
      copyright: "Tous droits réservés.",
    },
    dateLocale: "fr-FR",
  },
  en: {
    nav: { accueil: "Home", missions: "Missions", services: "Services", actualites: "News" },
    hero: {
      surtitre: "",
      titre: "The one-stop shop for investment promotion",
      description:
        "Information, support with approval applications and liaison with the relevant authorities: we make every step of the investor's journey easier.",
      cta1: "Discover our missions",
      cta2: "View the latest news",
    },
    missions: {
      titre: "Our missions",
      soustitre: "An investor-centred mandate, from first contact through to monitoring commitments.",
      items: [
        {
          titre: "One-stop investment shop",
          description:
            "A single point of entry centralising information, formalities and administrative procedures related to investment, to reduce delays and simplify the investor's journey.",
        },
        {
          titre: "Promoting the country's image",
          description:
            "Showcasing investment opportunities and the country's attractiveness to national and international investors, through economic information and representation at dedicated events.",
        },
        {
          titre: "Support with approval applications",
          description:
            "Assisting project promoters in preparing and processing their applications for approval under the incentive schemes provided for by current legislation.",
        },
        {
          titre: "Liaison with government bodies",
          description:
            "Facilitating dialogue between investors and the relevant administrations, to help overcome obstacles encountered while carrying out projects.",
        },
        {
          titre: "Monitoring commitments",
          description:
            "Monitoring the commitments made by approved investors and the administrations concerned, as part of a lasting partnership.",
        },
      ],
    },
    services: {
      titre: "Services for investors",
      items: [
        "Economic and regulatory information on investment",
        "Pre-assessment and guidance for investment projects",
        "Preparation and processing of applications for incentive schemes",
        "Liaison with government bodies and institutional partners",
        "Follow-up support for approved projects through to completion",
      ],
    },
    actualitesRecentes: { titre: "Latest news", lienTout: "All news →" },
    actualitesListe: {
      titre: "News",
      description: "The latest news published by the agency.",
      vide: "No news published yet.",
    },
    actualiteDetail: { retour: "← All news" },
    footer: {
      description:
        "The one-stop shop for investment promotion: information, support with approval applications and liaison with the relevant authorities.",
      navTitre: "Navigation",
      accesTitre: "Access",
      accesDescription: "Authorised staff and partners: access the agency's secure document management platform.",
      accesCta: "Access the GED platform →",
      copyright: "All rights reserved.",
    },
    dateLocale: "en-US",
  },
} as const;
