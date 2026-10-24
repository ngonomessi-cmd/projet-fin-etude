import type {
  ClassificationDocument,
  Document,
  NatureDocument,
  RoleUtilisateur,
  StatutActualite,
  StatutDocument,
  TypeConversation,
} from "@/lib/types";
import type { Langue } from "@/lib/i18n/plateforme";

export const LABEL_ROLE: Record<RoleUtilisateur, string> = {
  lecteur: "Lecteur",
  redacteur: "Rédacteur",
  validateur: "Validateur",
  administrateur: "Administrateur",
  auditeur: "Auditeur",
};

// Rôles qui produisent des documents (créer, éditer, partager). Le lecteur
// consulte ; l'auditeur contrôle sans produire (séparation des pouvoirs).
export const ROLES_PRODUCTEURS: RoleUtilisateur[] = ["redacteur", "validateur", "administrateur"];

export const DESCRIPTION_ROLE: Record<RoleUtilisateur, string> = {
  lecteur: "Consulte les documents qui lui sont accessibles.",
  redacteur: "Crée, rédige et partage des documents, puis les soumet à validation.",
  validateur: "Comme le rédacteur, et valide ou publie les documents de son département.",
  administrateur: "Gère les comptes, les modèles et le site ; valide et publie partout.",
  auditeur: "Consulte tous les documents et le journal d'audit, sans en produire.",
};

export const LABEL_CLASSIFICATION: Record<ClassificationDocument, string> = {
  public_interne: "Public interne",
  restreint: "Restreint",
  confidentiel: "Confidentiel",
};

export const LABEL_STATUT: Record<StatutDocument, string> = {
  brouillon: "Brouillon",
  en_verification: "En vérification",
  valide: "Validé",
  rejete: "Rejeté",
  publie: "Publié",
};

export const COULEUR_CLASSIFICATION: Record<ClassificationDocument, string> = {
  public_interne: "bg-emerald-100 text-emerald-800 border-emerald-300",
  restreint: "bg-amber-100 text-amber-800 border-amber-300",
  confidentiel: "bg-red-100 text-red-800 border-red-300",
};

export const COULEUR_STATUT: Record<StatutDocument, string> = {
  brouillon: "bg-slate-100 text-slate-700 border-slate-300",
  en_verification: "bg-blue-100 text-blue-800 border-blue-300",
  valide: "bg-teal-100 text-teal-800 border-teal-300",
  rejete: "bg-red-100 text-red-800 border-red-300",
  publie: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

// Nature du document : détermine sa durée de conservation une fois archivé
// (valeurs par défaut de la migration 0024, ajustables dans Admin › Archivage).
export const LABEL_NATURE: Record<NatureDocument, string> = {
  note_service: "Note de service / circulaire",
  courrier: "Courrier",
  compte_rendu: "Compte rendu / procès-verbal",
  rapport: "Rapport / étude",
  decision: "Décision / arrêté / délibération",
  contrat: "Contrat / convention",
  piece_comptable: "Pièce comptable / facture",
  procedure: "Procédure / politique / règlement",
  ressources_humaines: "Dossier ressources humaines",
  presentation: "Présentation / support",
  autre: "Autre document",
};

export const NATURES = Object.keys(LABEL_NATURE) as NatureDocument[];

export const DUREE_CONSERVATION_DEFAUT: Record<NatureDocument, number> = {
  note_service: 5,
  courrier: 5,
  compte_rendu: 10,
  rapport: 10,
  decision: 0,
  contrat: 10,
  piece_comptable: 10,
  procedure: 10,
  ressources_humaines: 30,
  presentation: 3,
  autre: 5,
};

export function libelleNature(nature: NatureDocument | null | undefined, langue: Langue = "fr"): string {
  const L = libelles(langue);
  return nature ? L.nature[nature] : L.nonClasse;
}

// Statut tel qu'affiché : un document archivé reste "publié" en base, mais
// se présente comme "Archivé".
export function statutAffiche(doc: Pick<Document, "statut" | "archive_le">, langue: Langue = "fr"): { texte: string; couleur: string } {
  const L = libelles(langue);
  if (doc.archive_le) return { texte: L.archive, couleur: "bg-indigo-100 text-indigo-800 border-indigo-300" };
  return { texte: L.statut[doc.statut], couleur: COULEUR_STATUT[doc.statut] };
}

export const NOMS_MOIS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export const LABEL_ACTUALITE: Record<StatutActualite, string> = {
  brouillon: "Brouillon",
  publie: "Publié",
};

export const COULEUR_ACTUALITE: Record<StatutActualite, string> = {
  brouillon: "bg-slate-100 text-slate-700 border-slate-300",
  publie: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

export const LABEL_TYPE_CONVERSATION: Record<TypeConversation, string> = {
  privee: "Conversation privée",
  groupe: "Groupe de travail",
  canal: "Canal officiel",
};

export const TAILLE_MAX_PIECE_JOINTE_OCTETS = 10 * 1024 * 1024;

export const TYPES_MIME_AUTORISES_PIECE_JOINTE = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
] as const;

// ---------------------------------------------------------------------------
// Versions anglaises (plateforme bilingue, cf. lib/i18n/plateforme.ts)
// ---------------------------------------------------------------------------

const LABEL_ROLE_EN: Record<RoleUtilisateur, string> = {
  lecteur: "Reader",
  redacteur: "Author",
  validateur: "Approver",
  administrateur: "Administrator",
  auditeur: "Auditor",
};

const DESCRIPTION_ROLE_EN: Record<RoleUtilisateur, string> = {
  lecteur: "Reads the documents available to them.",
  redacteur: "Creates, writes and shares documents, then submits them for approval.",
  validateur: "Same as an author, and approves or publishes their department's documents.",
  administrateur: "Manages accounts, templates and the website; approves and publishes everywhere.",
  auditeur: "Reads every document and the audit log, without producing any.",
};

const LABEL_CLASSIFICATION_EN: Record<ClassificationDocument, string> = {
  public_interne: "Internal public",
  restreint: "Restricted",
  confidentiel: "Confidential",
};

const LABEL_STATUT_EN: Record<StatutDocument, string> = {
  brouillon: "Draft",
  en_verification: "Under review",
  valide: "Approved",
  rejete: "Rejected",
  publie: "Published",
};

const LABEL_NATURE_EN: Record<NatureDocument, string> = {
  note_service: "Internal memo / circular",
  courrier: "Letter",
  compte_rendu: "Minutes / official record",
  rapport: "Report / study",
  decision: "Decision / order / resolution",
  contrat: "Contract / agreement",
  piece_comptable: "Accounting record / invoice",
  procedure: "Procedure / policy / regulation",
  ressources_humaines: "Human resources file",
  presentation: "Presentation / slides",
  autre: "Other document",
};

const NOMS_MOIS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const LABEL_ACTUALITE_EN: Record<StatutActualite, string> = {
  brouillon: "Draft",
  publie: "Published",
};

const LABEL_TYPE_CONVERSATION_EN: Record<TypeConversation, string> = {
  privee: "Private conversation",
  groupe: "Working group",
  canal: "Official channel",
};

// Tous les libellés d'une langue : const L = libelles(langue); L.role[...]
export function libelles(langue: Langue) {
  const en = langue === "en";
  return {
    role: en ? LABEL_ROLE_EN : LABEL_ROLE,
    descriptionRole: en ? DESCRIPTION_ROLE_EN : DESCRIPTION_ROLE,
    classification: en ? LABEL_CLASSIFICATION_EN : LABEL_CLASSIFICATION,
    statut: en ? LABEL_STATUT_EN : LABEL_STATUT,
    nature: en ? LABEL_NATURE_EN : LABEL_NATURE,
    mois: en ? NOMS_MOIS_EN : NOMS_MOIS,
    actualite: en ? LABEL_ACTUALITE_EN : LABEL_ACTUALITE,
    typeConversation: en ? LABEL_TYPE_CONVERSATION_EN : LABEL_TYPE_CONVERSATION,
    archive: en ? "Archived" : "Archivé",
    nonClasse: en ? "Unclassified" : "Non classé",
  };
}

// Actions du journal d'audit (document ou plateforme).
const LABEL_ACTION: Record<string, [string, string]> = {
  transition_statut: ["Changement de statut", "Status change"],
  partage: ["Partage", "Share"],
  retrait_partage: ["Retrait d'un partage", "Share removed"],
  modification_contenu: ["Modification du contenu", "Content edited"],
  creation_atelier: ["Création dans la plateforme", "Created in the platform"],
  telechargement: ["Téléchargement", "Download"],
  archivage: ["Archivage", "Archiving"],
  archivage_automatique: ["Archivage automatique", "Automatic archiving"],
  controle_integrite: ["Contrôle d'intégrité", "Integrity check"],
  nouvelle_version: ["Nouvelle version", "New version"],
  classement: ["Changement de nature", "Document type changed"],
  parametres_archivage: ["Réglage de l'archivage", "Archiving settings"],
  changement_role: ["Changement de rôle", "Role change"],
  reinitialisation_mfa: ["Réinitialisation de la double authentification", "Two-factor authentication reset"],
};

export function libelleAction(action: string, langue: Langue = "fr"): string {
  const paire = LABEL_ACTION[action];
  return paire ? paire[langue === "en" ? 1 : 0] : action;
}
