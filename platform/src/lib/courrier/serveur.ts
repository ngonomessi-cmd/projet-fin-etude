import { analyserPieceJointe } from "@/lib/messagerie/antivirus";
import { TAILLE_MAX_SCAN } from "./constantes";

// Outils des actions serveur du courrier. La base décide (droits, état, numérotation) :
// le serveur relaie et traduit ses refus en clés de message.

export type ErreurBase = { code?: string; message?: string } | null;

export function cleErreur(erreur: ErreurBase): string {
  const m = erreur?.message ?? "";
  if (m.includes("expéditeur")) return "expediteur";
  if (m.includes("pli personnel")) return "personnel";
  if (m.includes("motif")) return "motif";
  if (/Département (destinataire|émetteur) inconnu/.test(m)) return "departement";
  if (/Indiquez de 1 à 20 destinataires|au moins un destinataire|doit avoir un nom/.test(m)) return "destinataire";
  if (/Indiquez l'objet/.test(m)) return "objet";
  if (/document validé/.test(m)) return "document";
  if (/durée de conservation/.test(m)) return "duree";
  if (/décision/.test(m)) return "motif";
  if (/échéance|gelé/.test(m)) return "echeance";
  if (erreur?.code === "22023" || erreur?.code === "23514") return "invalide";
  if (erreur?.code === "42501" || /row-level security|permission denied/i.test(m)) return "refus";
  return "generique";
}

export const texte = (d: FormData, nom: string, max = 500) =>
  String(d.get(nom) ?? "").replace(/\r\n?/g, "\n").trim().slice(0, max);

export const dateOuNull = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

export async function empreinteSha256(donnees: ArrayBuffer): Promise<string> {
  const condense = await crypto.subtle.digest("SHA-256", donnees);
  return [...new Uint8Array(condense)].map((o) => o.toString(16).padStart(2, "0")).join("");
}

/**
 * Contrôle d'un PDF déposé dans l'archive : taille, signature « %PDF- », puis éléments
 * actifs (JavaScript, lancement de programme, fichier embarqué) — contrôles internes de la
 * plateforme, sans envoi du fichier à un tiers. Renvoie une clé d'erreur ou null.
 */
export async function problemePdf(octets: ArrayBuffer, nom: string): Promise<string | null> {
  if (octets.byteLength <= 0) return "fichier_vide";
  if (octets.byteLength > TAILLE_MAX_SCAN) return "fichier_gros";
  const tampon = Buffer.from(octets);
  if (tampon.subarray(0, 5).toString("latin1") !== "%PDF-") return "fichier_type";
  if (/\/(JavaScript|JS|Launch|EmbeddedFile)\b/.test(tampon.toString("latin1"))) return "fichier_suspect";
  const analyse = await analyserPieceJointe(tampon, nom, "application/pdf");
  return analyse.propre ? null : "fichier_suspect";
}
