import type { Langue } from "@/lib/i18n/plateforme";

// Règles d'affichage des signatures, communes au navigateur, au serveur et
// au PDF : numéro, code de vérification, formule de qualité, date.

export type NatureSignature = "electronique" | "manuscrite";
export type StatutSignature = "en_preparation" | "attente_original" | "valide" | "revoquee" | "abandonnee";

export type Signature = {
  id: string;
  organisation: string;
  document_id: string | null;
  reference_document: string | null;
  titre_document: string;
  nature: NatureSignature;
  qualite: string;
  intitule: string;
  intitule_en: string;
  numero: string;
  code: string;
  langue: Langue;
  signataire_id: string | null;
  signataire_nom: string | null;
  delegation_id: string | null;
  titre_delegataire: string | null;
  statut: StatutSignature;
  cree_par: string | null;
  cree_par_nom: string | null;
  cree_le: string;
  signe_le: string | null;
  chemin_pdf: string | null;
  empreinte_pdf: string | null;
  chemin_original: string | null;
  empreinte_original: string | null;
  original_depose_le: string | null;
  revoquee_le: string | null;
  motif_revocation: string | null;
};

export type QualiteDisponible = {
  qualite: string;
  intitule: string;
  intitule_en: string;
  delegation_id: string | null;
  titre_delegataire: string | null;
  delegant_nom: string | null;
  fin: string | null;
};

// Fuseau des dates imprimées sur les documents signés.
export const FUSEAU_SIGNATURE = process.env.NEXT_PUBLIC_ORG_FUSEAU?.trim() || "Africa/Douala";

const ALPHABET_CODE = /^[A-HJ-NP-Z2-9]{12}$/;

// « ABCDEFGHJKLM » → « ABCD-EFGH-JKLM »
export function formaterCode(code: string): string {
  return code.replace(/(.{4})(?=.)/g, "$1-");
}

// Saisie libre (tirets, espaces, minuscules) → code, ou null s'il est mal formé.
export function normaliserCode(saisie: string | null | undefined): string | null {
  const code = (saisie ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return ALPHABET_CODE.test(code) ? code : null;
}

// « Le Directeur Général » → « le Directeur Général » ; « L'Administrateur » → « l'Administrateur ».
function enMinuscule(intitule: string): string {
  return intitule.charAt(0).toLowerCase() + intitule.slice(1);
}

export function intituleQualite(s: { intitule: string; intitule_en: string }, langue: Langue): string {
  return langue === "en" ? s.intitule_en : s.intitule;
}

// Formule imprimée au-dessus de la signature :
//   « Le Directeur Général »
//   ou « Pour le Directeur Général / et par délégation, / Le Directeur Général Adjoint ».
export function lignesQualite(
  s: { intitule: string; intitule_en: string; titre_delegataire: string | null },
  langue: Langue
): string[] {
  const intitule = intituleQualite(s, langue);
  if (!s.titre_delegataire) return [intitule];
  return langue === "en"
    ? [`For ${enMinuscule(intitule)},`, "by delegation,", s.titre_delegataire]
    : [`Pour ${enMinuscule(intitule)}`, "et par délégation,", s.titre_delegataire];
}

function villeDuFuseau(): string {
  return (FUSEAU_SIGNATURE.split("/").pop() ?? FUSEAU_SIGNATURE).replace(/_/g, " ");
}

export function dateHeureSignature(date: Date | string, langue: Langue): { date: string; heure: string; ville: string } {
  const d = typeof date === "string" ? new Date(date) : date;
  return {
    date: d.toLocaleDateString(langue === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: FUSEAU_SIGNATURE }),
    heure: d.toLocaleTimeString(langue === "en" ? "en-GB" : "fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: FUSEAU_SIGNATURE }),
    ville: villeDuFuseau(),
  };
}

export function mentionSignatureElectronique(date: Date | string, langue: Langue): string {
  const { date: jour, heure, ville } = dateHeureSignature(date, langue);
  return langue === "en"
    ? `Electronically signed on ${jour} at ${heure} (${ville} time)`
    : `Signé électroniquement le ${jour} à ${heure.replace(":", " h ")} (heure de ${ville})`;
}

export function libelleStatutSignature(statut: StatutSignature, langue: Langue): string {
  const libelles: Record<StatutSignature, [string, string]> = {
    en_preparation: ["En préparation", "Being prepared"],
    attente_original: ["En attente de l'original signé", "Awaiting the signed original"],
    valide: ["Valide", "Valid"],
    revoquee: ["Révoquée", "Revoked"],
    abandonnee: ["Abandonnée", "Abandoned"],
  };
  return libelles[statut][langue === "en" ? 1 : 0];
}

export const COULEUR_STATUT_SIGNATURE: Record<StatutSignature, string> = {
  en_preparation: "bg-paper-100 text-paper-muted",
  attente_original: "bg-amber-50 text-amber-800 border border-amber-200",
  valide: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  revoquee: "bg-red-50 text-red-700 border border-red-200",
  abandonnee: "bg-paper-100 text-paper-soft",
};

export function libelleNatureSignature(nature: NatureSignature, langue: Langue): string {
  return nature === "electronique"
    ? langue === "en"
      ? "Electronic signature"
      : "Signature électronique"
    : langue === "en"
      ? "Handwritten signature and stamp"
      : "Signature manuscrite et cachet";
}

export function urlVerification(origine: string, code: string): string {
  return `${origine.replace(/\/+$/, "")}/verifier/${code}`;
}
