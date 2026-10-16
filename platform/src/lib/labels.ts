import type { ClassificationDocument, RoleUtilisateur, StatutDocument, TypeConversation } from "@/lib/types";

export const LABEL_ROLE: Record<RoleUtilisateur, string> = {
  lecteur: "Lecteur",
  redacteur: "Rédacteur",
  validateur: "Validateur",
  administrateur: "Administrateur",
  auditeur: "Auditeur",
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
