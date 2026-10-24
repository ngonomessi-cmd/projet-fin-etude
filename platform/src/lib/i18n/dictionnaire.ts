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

const MISSIONS_FR = [
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
] as const;

const MISSIONS_EN = [
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
] as const;

const SERVICES_FR = [
  {
    titre: "Information économique et réglementaire sur l'investissement",
    description:
      "Accédez à une information fiable, actualisée et complète sur le cadre économique, juridique et fiscal du Cameroun.",
  },
  {
    titre: "Pré-diagnostic et orientation des projets d'investissement",
    description:
      "Bénéficiez d'un premier diagnostic personnalisé et d'une orientation adaptée à la nature de votre projet et aux opportunités du territoire.",
  },
  {
    titre: "Constitution et instruction des dossiers d'agrément aux régimes incitatifs",
    description:
      "Nous vous assistons dans la préparation et le suivi de vos dossiers d'agrément auprès des administrations compétentes.",
  },
  {
    titre: "Mise en relation avec les administrations et partenaires institutionnels",
    description:
      "Facilitez le dialogue avec les administrations et les partenaires nationaux et internationaux pour faire avancer vos projets.",
  },
  {
    titre: "Suivi-accompagnement des projets agréés jusqu'à leur réalisation",
    description:
      "Nous restons à vos côtés tout au long de la mise en œuvre de vos projets, pour assurer le respect des engagements et la réussite de vos investissements.",
  },
] as const;

const SERVICES_EN = [
  {
    titre: "Economic and regulatory information on investment",
    description:
      "Access reliable, up-to-date and comprehensive information on Cameroon's economic, legal and tax framework.",
  },
  {
    titre: "Pre-assessment and guidance for investment projects",
    description:
      "Benefit from an initial personalised assessment and guidance suited to the nature of your project and the country's opportunities.",
  },
  {
    titre: "Preparation and processing of applications for incentive schemes",
    description: "We assist you in preparing and following up your approval applications with the relevant authorities.",
  },
  {
    titre: "Liaison with government bodies and institutional partners",
    description:
      "Facilitate dialogue with government bodies and national and international partners to move your projects forward.",
  },
  {
    titre: "Follow-up support for approved projects through to completion",
    description:
      "We stay by your side throughout the implementation of your projects, to ensure commitments are met and your investments succeed.",
  },
] as const;

export const DICTIONNAIRE = {
  fr: {
    nav: {
      accueil: "Accueil",
      missions: "Missions",
      services: "Services",
      actualites: "Actualités",
      contact: "Contact",
      nousContacter: "Nous contacter",
    },
    hero: {
      surtitre: "Investir au Cameroun, c'est bâtir l'avenir",
      titre: "L'Agence de Promotion des Investissements du Cameroun",
      description:
        "Nous accompagnons les investisseurs, nationaux et étrangers, dans la réalisation de leurs projets au Cameroun, en leur offrant un guichet unique, des services adaptés et un cadre sécurisé.",
      cta1: "Découvrir nos services",
      cta2: "Pourquoi investir au Cameroun ?",
      legende: "Un environnement attractif pour des investissements durables",
    },
    chiffres: [
      { valeur: "+ 1 000", libelle: "projets accompagnés", detail: "depuis la création de l'agence" },
      { valeur: "+ 3 500", libelle: "investisseurs", detail: "nationaux et étrangers" },
      { valeur: "10 secteurs clés", libelle: "", detail: "pour un développement économique durable" },
      { valeur: "Un guichet unique", libelle: "", detail: "pour toutes vos démarches d'investissement" },
    ],
    missionsTeaser: {
      surtitre: "Nos missions",
      titre: "Accompagner aujourd'hui les investissements de demain",
      description:
        "L'agence œuvre pour un environnement propice aux investissements au Cameroun, en simplifiant les démarches, en facilitant les échanges et en valorisant les opportunités du pays.",
      cta: "En savoir plus",
      cartes: [
        { titre: "Guichet unique de l'investissement", description: "Un point d'entrée unique pour centraliser les informations, formalités et démarches." },
        { titre: "Promotion de l'image du pays", description: "Valoriser les opportunités d'investissement et l'attractivité du territoire." },
        { titre: "Accompagnement des investisseurs", description: "Assister et sécuriser les projets dans toutes leurs étapes." },
        { titre: "Mise en relation", description: "Faciliter le dialogue entre investisseurs, administrations et partenaires institutionnels." },
        { titre: "Suivi des engagements", description: "Assurer le suivi des engagements pris par les investisseurs et les administrations concernées." },
      ],
    },
    missions: { titre: "Nos missions", intro: "Un mandat centré sur l'investisseur, de la première information jusqu'au suivi des engagements.", items: MISSIONS_FR },
    missionsHero: {
      surtitre: "Nos missions",
      titre: "Un mandat centré sur l'investisseur",
      description: "De la première information jusqu'au suivi des engagements.",
    },
    missionsBande: {
      surtitre: "L'agence, votre partenaire pour investir au Cameroun",
      titre: "Ensemble, construisons un avenir d'opportunités",
      description:
        "L'Agence de Promotion des Investissements du Cameroun vous accompagne à chaque étape de votre projet d'investissement.",
      cta: "Découvrir nos services",
      tagline: "Investir au Cameroun, c'est construire durablement",
    },
    services: { titre: "Services aux investisseurs", intro: "Un accompagnement concret, à chaque étape du parcours de l'investisseur.", items: SERVICES_FR },
    servicesHero: {
      surtitre: "Nos services",
      titre: "Des services sur mesure pour vos investissements au Cameroun",
      description:
        "L'agence vous accompagne à chaque étape de votre projet d'investissement, avec des services personnalisés, efficaces et orientés résultats.",
    },
    servicesIntro: {
      surtitre: "Nos services",
      titre: "Un accompagnement complet pour la réussite de vos projets",
      description:
        "De l'information au suivi, l'agence met à votre disposition une gamme de services pour faciliter et sécuriser vos investissements au Cameroun.",
      decouvrir: "Découvrir",
    },
    confiance: {
      surtitre: "Pourquoi choisir l'agence ?",
      titre: "Votre partenaire de confiance pour investir au Cameroun",
      points: [
        "Un guichet unique de l'investissement",
        "Une équipe d'experts à votre écoute",
        "Des procédures simplifiées et digitalisées",
        "Un engagement pour un développement durable",
      ],
      cta: "Découvrir nos missions",
    },
    projet: {
      titre: "Vous avez un projet d'investissement ?",
      description: "Contactez notre équipe pour un accompagnement personnalisé.",
      cta: "Nous contacter",
    },
    contact: {
      surtitre: "Contact",
      titre: "Parlons de votre projet d'investissement",
      description:
        "Une question, un projet, une demande d'accompagnement ? Écrivez-nous : notre équipe vous répond dans les meilleurs délais.",
      formTitre: "Envoyer un message",
      nom: "Nom complet",
      email: "Adresse e-mail",
      telephone: "Téléphone",
      entreprise: "Entreprise / organisation",
      sujet: "Objet de votre demande",
      sujetAutre: "Autre demande",
      message: "Votre message",
      optionnel: "facultatif",
      envoyer: "Envoyer le message",
      envoi: "Envoi…",
      succesTitre: "Message bien reçu",
      succes: "Merci pour votre message. Notre équipe vous recontactera à l'adresse indiquée.",
      nouveau: "Envoyer un autre message",
      confidentialite:
        "Vos informations servent uniquement à traiter votre demande et ne sont jamais transmises à des tiers.",
      atoutsTitre: "Ce que nous vous apportons",
    },
    erreursContact: {
      champs: "Merci de renseigner votre nom, une adresse e-mail valide, l'objet et un message d'au moins 10 caractères.",
      envoi: "L'envoi a échoué. Merci de réessayer dans quelques instants.",
    },
    pourquoiInvestir: {
      surtitre: "Pourquoi investir au Cameroun ?",
      titre: "Une destination de choix en Afrique",
      description:
        "Le Cameroun offre un environnement économique stable, une main-d'œuvre qualifiée, des infrastructures en développement et un accès privilégié aux marchés régionaux et internationaux.",
      points: [
        "Ressources naturelles riches et diversifiées",
        "Jeunesse et talents qualifiés",
        "Position stratégique en Afrique centrale",
        "Un marché dynamique et en croissance",
      ],
      cta: "Découvrir les opportunités",
    },
    actualitesAccueil: {
      surtitre: "Actualités",
      titre: "Restez informé",
      description: "Suivez les dernières actualités de l'agence, les opportunités d'investissement et les événements à venir.",
      cta: "Voir toutes les actualités",
      lireLaSuite: "Lire la suite",
      vide: "Les prochaines actualités de l'agence seront publiées ici.",
    },
    actualitesRecentes: { titre: "Actualités récentes", lienTout: "Toutes les actualités →", lireLaSuite: "Lire la suite →" },
    actualitesListe: {
      surtitre: "Actualités",
      titre: "Restez informé",
      description: "Les dernières actualités de l'agence, les opportunités d'investissement et les événements à venir.",
      vide: "Aucune actualité publiée pour le moment.",
      toutes: "Toutes les actualités",
      aLaUne: "À la une",
      lire: "Lire l'article",
      lireLaSuite: "Lire la suite",
      precedent: "Actualité précédente",
      suivant: "Actualité suivante",
    },
    actualiteDetail: { retour: "← Toutes les actualités" },
    footer: {
      description:
        "Guichet unique de la promotion des investissements : information, accompagnement des dossiers d'agrément et mise en relation avec les administrations compétentes.",
      navTitre: "Navigation",
      accesTitre: "Accès",
      accesDescription:
        "Agents et partenaires habilités : accédez à la gestion électronique de documents sécurisée de l'agence.",
      accesCta: "Accéder à la plateforme GED →",
      copyright: "Tous droits réservés.",
      tagline: "Investir au Cameroun, c'est construire ensemble",
      republique: "République du Cameroun",
      espaceGed: "Espace GED sécurisé",
    },
    dateLocale: "fr-FR",
  },
  en: {
    nav: {
      accueil: "Home",
      missions: "Missions",
      services: "Services",
      actualites: "News",
      contact: "Contact",
      nousContacter: "Contact us",
    },
    hero: {
      surtitre: "Investing in Cameroon means building the future",
      titre: "The Investment Promotion Agency of Cameroon",
      description:
        "We support national and foreign investors in carrying out their projects in Cameroon, offering a one-stop shop, tailored services and a secure framework.",
      cta1: "Discover our services",
      cta2: "Why invest in Cameroon?",
      legende: "An attractive environment for sustainable investment",
    },
    chiffres: [
      { valeur: "1,000+", libelle: "projects supported", detail: "since the agency was founded" },
      { valeur: "3,500+", libelle: "investors", detail: "national and foreign" },
      { valeur: "10 key sectors", libelle: "", detail: "for sustainable economic development" },
      { valeur: "A one-stop shop", libelle: "", detail: "for all your investment procedures" },
    ],
    missionsTeaser: {
      surtitre: "Our missions",
      titre: "Supporting today the investments of tomorrow",
      description:
        "The agency works to create an environment conducive to investment in Cameroon, by simplifying procedures, facilitating dialogue and showcasing the country's opportunities.",
      cta: "Learn more",
      cartes: [
        { titre: "One-stop investment shop", description: "A single point of entry for information, formalities and procedures." },
        { titre: "Promoting the country's image", description: "Showcasing investment opportunities and the country's attractiveness." },
        { titre: "Investor support", description: "Assisting and securing projects at every stage." },
        { titre: "Liaison", description: "Facilitating dialogue between investors, government bodies and institutional partners." },
        { titre: "Monitoring commitments", description: "Monitoring the commitments made by investors and the administrations concerned." },
      ],
    },
    missions: { titre: "Our missions", intro: "An investor-centred mandate, from first contact through to monitoring commitments.", items: MISSIONS_EN },
    missionsHero: {
      surtitre: "Our missions",
      titre: "An investor-centred mandate",
      description: "From the very first information through to monitoring commitments.",
    },
    missionsBande: {
      surtitre: "The agency, your partner for investing in Cameroon",
      titre: "Together, let's build a future of opportunities",
      description: "The Investment Promotion Agency of Cameroon supports you at every stage of your investment project.",
      cta: "Discover our services",
      tagline: "Investing in Cameroon means building sustainably",
    },
    services: { titre: "Services for investors", intro: "Concrete support at every stage of the investor's journey.", items: SERVICES_EN },
    servicesHero: {
      surtitre: "Our services",
      titre: "Tailored services for your investments in Cameroon",
      description:
        "The agency supports you at every stage of your investment project, with personalised, efficient and results-oriented services.",
    },
    servicesIntro: {
      surtitre: "Our services",
      titre: "Comprehensive support for the success of your projects",
      description:
        "From information to follow-up, the agency offers a range of services to facilitate and secure your investments in Cameroon.",
      decouvrir: "Discover",
    },
    confiance: {
      surtitre: "Why choose the agency?",
      titre: "Your trusted partner for investing in Cameroon",
      points: [
        "A one-stop investment shop",
        "A team of experts ready to listen",
        "Simplified, digitalised procedures",
        "A commitment to sustainable development",
      ],
      cta: "Discover our missions",
    },
    projet: {
      titre: "Do you have an investment project?",
      description: "Contact our team for personalised support.",
      cta: "Contact us",
    },
    contact: {
      surtitre: "Contact",
      titre: "Let's talk about your investment project",
      description:
        "A question, a project, a request for support? Write to us: our team will get back to you as soon as possible.",
      formTitre: "Send a message",
      nom: "Full name",
      email: "Email address",
      telephone: "Phone",
      entreprise: "Company / organisation",
      sujet: "Subject of your request",
      sujetAutre: "Other request",
      message: "Your message",
      optionnel: "optional",
      envoyer: "Send message",
      envoi: "Sending…",
      succesTitre: "Message received",
      succes: "Thank you for your message. Our team will get back to you at the address provided.",
      nouveau: "Send another message",
      confidentialite: "Your information is used solely to handle your request and is never shared with third parties.",
      atoutsTitre: "What we offer you",
    },
    erreursContact: {
      champs: "Please enter your name, a valid email address, a subject and a message of at least 10 characters.",
      envoi: "Sending failed. Please try again in a few moments.",
    },
    pourquoiInvestir: {
      surtitre: "Why invest in Cameroon?",
      titre: "A destination of choice in Africa",
      description:
        "Cameroon offers a stable economic environment, a skilled workforce, developing infrastructure and privileged access to regional and international markets.",
      points: ["Rich and diverse natural resources", "Young, skilled talent", "Strategic location in Central Africa", "A dynamic, growing market"],
      cta: "Discover the opportunities",
    },
    actualitesAccueil: {
      surtitre: "News",
      titre: "Stay informed",
      description: "Follow the agency's latest news, investment opportunities and upcoming events.",
      cta: "View all news",
      lireLaSuite: "Read more",
      vide: "The agency's upcoming news will be published here.",
    },
    actualitesRecentes: { titre: "Latest news", lienTout: "All news →", lireLaSuite: "Read more →" },
    actualitesListe: {
      surtitre: "News",
      titre: "Stay informed",
      description: "The agency's latest news, investment opportunities and upcoming events.",
      vide: "No news published yet.",
      toutes: "All news",
      aLaUne: "Featured",
      lire: "Read the article",
      lireLaSuite: "Read more",
      precedent: "Previous article",
      suivant: "Next article",
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
      tagline: "Investing in Cameroon means building together",
      republique: "Republic of Cameroon",
      espaceGed: "Secure GED area",
    },
    dateLocale: "en-GB",
  },
} as const;
