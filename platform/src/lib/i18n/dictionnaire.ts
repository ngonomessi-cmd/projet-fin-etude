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

// Secteurs prioritaires et régions (page d'accueil et page « Investir au Cameroun »).
// « cle » relie chaque secteur à son pictogramme et, le cas échéant, à sa photo.
const SECTEURS_FR = [
  { cle: "agriculture", titre: "Agriculture & Agro-industrie", description: "Cacao, café, coton, banane, huile de palme : des filières d'exportation établies et un fort potentiel de transformation locale." },
  { cle: "energie", titre: "Énergie", description: "Un important potentiel hydroélectrique, des ouvrages de production récents et des besoins croissants en énergies renouvelables, notamment solaires." },
  { cle: "industrie", titre: "Industrie & Transformation", description: "Agro-transformation, matériaux de construction, zones industrielles et logistiques autour des ports de Douala et de Kribi." },
  { cle: "mines", titre: "Mines & Ressources", description: "Bauxite, fer, or et autres ressources minérales à valoriser dans le cadre du code minier." },
  { cle: "numerique", titre: "Économie numérique", description: "Télécommunications, services numériques et paiement mobile, portés par une population jeune et des câbles sous-marins qui atterrissent sur le littoral." },
  { cle: "tourisme", titre: "Tourisme & Hôtellerie", description: "Du mont Cameroun aux plages de Kribi et aux parcs nationaux du Nord : une diversité de paysages qui vaut au pays le surnom d'« Afrique en miniature »." },
] as const;

const SECTEURS_EN = [
  { cle: "agriculture", titre: "Agriculture & Agribusiness", description: "Cocoa, coffee, cotton, bananas, palm oil: established export value chains and strong potential for local processing." },
  { cle: "energie", titre: "Energy", description: "Significant hydropower potential, recently commissioned generation projects and growing demand for renewables, especially solar." },
  { cle: "industrie", titre: "Industry & Processing", description: "Agro-processing, building materials, industrial and logistics zones around the ports of Douala and Kribi." },
  { cle: "mines", titre: "Mining & Resources", description: "Bauxite, iron ore, gold and other mineral resources to develop under the mining code." },
  { cle: "numerique", titre: "Digital Economy", description: "Telecommunications, digital services and mobile payments, driven by a young population and submarine cables landing on the coast." },
  { cle: "tourisme", titre: "Tourism & Hospitality", description: "From Mount Cameroon to the beaches of Kribi and the national parks of the North: a diversity of landscapes that earns the country the nickname “Africa in miniature”." },
] as const;

const REGIONS_FR = [
  { ville: "maroua", nom: "Extrême-Nord", chefLieu: "Maroua", atouts: "Agriculture, élevage, échanges avec les pays voisins" },
  { ville: "garoua", nom: "Nord", chefLieu: "Garoua", atouts: "Coton, élevage, port fluvial sur la Bénoué, barrage de Lagdo" },
  { ville: "ngaoundere", nom: "Adamaoua", chefLieu: "Ngaoundéré", atouts: "Élevage, bauxite, terminus du chemin de fer vers le Nord" },
  { ville: "bamenda", nom: "Nord-Ouest", chefLieu: "Bamenda", atouts: "Agriculture, élevage, artisanat" },
  { ville: "bafoussam", nom: "Ouest", chefLieu: "Bafoussam", atouts: "Café, cultures vivrières, commerce et PME" },
  { ville: "buea", nom: "Sud-Ouest", chefLieu: "Buéa", atouts: "Mont Cameroun, plantations agro-industrielles, port de Limbé, tourisme" },
  { ville: "douala", nom: "Littoral", chefLieu: "Douala", atouts: "Capitale économique, port de Douala, industrie et logistique" },
  { ville: "yaounde", nom: "Centre", chefLieu: "Yaoundé", atouts: "Capitale politique, administrations et services" },
  { ville: "bertoua", nom: "Est", chefLieu: "Bertoua", atouts: "Forêt et filière bois, mines, barrage de Lom Pangar" },
  { ville: "ebolowa", nom: "Sud", chefLieu: "Ebolowa", atouts: "Port en eau profonde de Kribi, forêt, tourisme balnéaire" },
] as const;

const REGIONS_EN = [
  { ville: "maroua", nom: "Far North", chefLieu: "Maroua", atouts: "Agriculture, livestock, trade with neighbouring countries" },
  { ville: "garoua", nom: "North", chefLieu: "Garoua", atouts: "Cotton, livestock, river port on the Benue, Lagdo dam" },
  { ville: "ngaoundere", nom: "Adamawa", chefLieu: "Ngaoundéré", atouts: "Livestock, bauxite, northern terminus of the railway" },
  { ville: "bamenda", nom: "North-West", chefLieu: "Bamenda", atouts: "Agriculture, livestock, crafts" },
  { ville: "bafoussam", nom: "West", chefLieu: "Bafoussam", atouts: "Coffee, food crops, trade and SMEs" },
  { ville: "buea", nom: "South-West", chefLieu: "Buea", atouts: "Mount Cameroon, agro-industrial plantations, port of Limbe, tourism" },
  { ville: "douala", nom: "Littoral", chefLieu: "Douala", atouts: "Economic capital, port of Douala, industry and logistics" },
  { ville: "yaounde", nom: "Centre", chefLieu: "Yaoundé", atouts: "Political capital, government and services" },
  { ville: "bertoua", nom: "East", chefLieu: "Bertoua", atouts: "Forestry and timber, mining, Lom Pangar dam" },
  { ville: "ebolowa", nom: "South", chefLieu: "Ebolowa", atouts: "Kribi deep-sea port, forestry, seaside tourism" },
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
      agence: "L'Agence",
      investir: "Investir au Cameroun",
      secteurs: "Secteurs porteurs",
      accompagnement: "Accompagnement",
      regions: "Régions",
    },
    hero: {
      surtitre: "Cameroun",
      titre: "Investir au Cameroun,",
      titreAccent: "un hub stratégique en Afrique",
      description:
        "Un marché en croissance, des ressources diversifiées et une position privilégiée au cœur de la CEMAC et de la CEEAC.",
      cta1: "Explorer les opportunités",
      cta2: "Découvrir le Cameroun",
      legende: "Un environnement attractif pour des investissements durables",
    },
    chiffres: [
      { valeur: "29 M+", libelle: "Habitants", detail: "Un marché national dynamique" },
      { valeur: "CEMAC", libelle: "Un marché régional intégré", detail: "Six pays, plus de 60 millions de consommateurs" },
      { valeur: "6", libelle: "Secteurs prioritaires", detail: "Des opportunités à fort potentiel" },
      { valeur: "1", libelle: "Interlocuteur unique", detail: "Un accompagnement sur mesure par l'agence" },
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
    secteurs: {
      titre: "Secteurs d'investissement prioritaires",
      lienTout: "Voir tous les secteurs",
      items: SECTEURS_FR,
    },
    opportunites: {
      titre: "Opportunités d'investissement",
      description:
        "Présentez-nous votre projet : l'agence identifie avec vous les opportunités par secteur et par région, et vous oriente vers les bons interlocuteurs.",
      cta: "Présenter mon projet",
    },
    regionsAccueil: {
      titre: "Explorer le Cameroun par région",
      description: "Dix régions aux atouts complémentaires : situez les grands pôles économiques du pays sur la carte.",
      cta: "Accéder à la carte",
    },
    investir: {
      surtitre: "Investir au Cameroun",
      titre: "Six secteurs porteurs, dix régions complémentaires",
      description:
        "Un aperçu des secteurs prioritaires et des atouts de chaque région, pour orienter votre projet. L'agence vous accompagne ensuite dans le détail.",
      secteursTitre: "Les secteurs prioritaires",
      regionsTitre: "Les dix régions du Cameroun",
      regionsIntro: "Chef-lieu et principaux atouts économiques de chaque région.",
      chefLieu: "Chef-lieu",
      projetTitre: "Un projet dans l'un de ces secteurs ?",
      projetCta: "Contacter l'agence",
      regions: REGIONS_FR,
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
      gedSurtitre: "Accès réservé",
      gedDescription: "Gestion électronique des documents de l'Agence, réservée à ses agents. Connexion avec double authentification.",
      gedCta: "Se connecter",
      aProposTitre: "L'Agence",
      investirTitre: "Investir",
      pratiqueTitre: "En pratique",
      contactTitre: "Nous contacter",
      verifier: "Vérifier un document",
      ecrire: "Nous écrire",
      horairesTitre: "Horaires d'ouverture",
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
      agence: "The Agency",
      investir: "Invest in Cameroon",
      secteurs: "Key sectors",
      accompagnement: "Support",
      regions: "Regions",
    },
    hero: {
      surtitre: "Cameroon",
      titre: "Invest in Cameroon,",
      titreAccent: "a strategic hub in Africa",
      description:
        "A growing market, diversified resources and a prime location at the heart of CEMAC and ECCAS.",
      cta1: "Explore opportunities",
      cta2: "Discover Cameroon",
      legende: "An attractive environment for sustainable investment",
    },
    chiffres: [
      { valeur: "29 M+", libelle: "Inhabitants", detail: "A dynamic domestic market" },
      { valeur: "CEMAC", libelle: "An integrated regional market", detail: "Six countries, over 60 million consumers" },
      { valeur: "6", libelle: "Priority sectors", detail: "High-potential opportunities" },
      { valeur: "1", libelle: "Single point of contact", detail: "Tailored support from the agency" },
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
    secteurs: {
      titre: "Priority investment sectors",
      lienTout: "View all sectors",
      items: SECTEURS_EN,
    },
    opportunites: {
      titre: "Investment opportunities",
      description:
        "Tell us about your project: the agency works with you to identify opportunities by sector and region, and directs you to the right contacts.",
      cta: "Submit my project",
    },
    regionsAccueil: {
      titre: "Explore Cameroon by region",
      description: "Ten regions with complementary strengths: locate the country's main economic hubs on the map.",
      cta: "Open the map",
    },
    investir: {
      surtitre: "Invest in Cameroon",
      titre: "Six key sectors, ten complementary regions",
      description:
        "An overview of the priority sectors and of each region's strengths, to help shape your project. The agency then supports you in detail.",
      secteursTitre: "Priority sectors",
      regionsTitre: "The ten regions of Cameroon",
      regionsIntro: "Regional capital and main economic strengths of each region.",
      chefLieu: "Capital",
      projetTitre: "A project in one of these sectors?",
      projetCta: "Contact the agency",
      regions: REGIONS_EN,
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
      gedSurtitre: "Restricted access",
      gedDescription: "The Agency's electronic document management, reserved for its staff. Sign-in with two-factor authentication.",
      gedCta: "Sign in",
      aProposTitre: "The Agency",
      investirTitre: "Invest",
      pratiqueTitre: "Practical information",
      contactTitre: "Contact us",
      verifier: "Verify a document",
      ecrire: "Write to us",
      horairesTitre: "Opening hours",
    },
    dateLocale: "en-GB",
  },
} as const;
