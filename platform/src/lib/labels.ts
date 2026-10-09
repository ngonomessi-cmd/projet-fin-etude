import type { ClassificationDocument, RoleUtilisateur, StatutDocument } from "@/lib/types";

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
