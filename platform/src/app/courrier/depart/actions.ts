"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exporterDocument } from "@/lib/atelier/exporter";
import { UUID } from "@/lib/courrier/constantes";
import { cleErreur, empreinteSha256, problemePdf, texte } from "@/lib/courrier/serveur";
import { langueServeur } from "@/lib/i18n/serveur";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { creerClientServeur } from "@/lib/supabase/server";
import { BUCKET_SIGNATURES } from "@/lib/signature/produire";
import type { Document } from "@/lib/types";
import type { EntreePiece } from "../actions";

// La base décide (droits, état du départ, numérotation) : ici on relaie et on traduit les refus.

const uuid = (d: FormData, nom: string) => {
  const v = String(d.get(nom) ?? "");
  return UUID.test(v) ? v : null;
};
const cocher = (d: FormData, nom: string) => d.get(nom) === "oui" || d.get(nom) === "on";

function aller(id: string, type: "ok" | "erreur", cle: string): never {
  revalidatePath(`/courrier/depart/${id}`);
  revalidatePath("/courrier/depart");
  redirect(`/courrier/depart/${id}?${type}=${cle}`);
}

/** Destinataires saisis en lignes parallèles (nom, adresse, rôle) → JSON pour la base. */
function destinataires(d: FormData): { nom: string; adresse: string; role: string }[] {
  const noms = d.getAll("dest_nom").map(String);
  const adresses = d.getAll("dest_adresse").map(String);
  const roles = d.getAll("dest_role").map(String);
  return noms
    .map((nom, i) => ({ nom: nom.trim().slice(0, 300), adresse: (adresses[i] ?? "").trim().slice(0, 500), role: roles[i] === "ampliation" ? "ampliation" : "destinataire" }))
    .filter((x) => x.nom)
    .slice(0, 20);
}

function parametresCommuns(d: FormData) {
  const ar = cocher(d, "ar");
  return {
    p_objet: texte(d, "objet", 500),
    p_courrier_arrivee: uuid(d, "courrier_arrivee"),
    p_mode: texte(d, "mode", 20),
    p_nb_pieces: Math.min(999, Math.max(1, Number.parseInt(texte(d, "nb_pieces", 4), 10) || 1)),
    p_urgent: cocher(d, "urgent"),
    p_ar: ar,
    p_relance_jours: ar ? Math.min(365, Math.max(1, Number.parseInt(texte(d, "relance_jours", 4), 10) || 15)) : null,
    p_note: texte(d, "note", 1000) || null,
    p_destinataires: destinataires(d),
  };
}

// PDF de la lettre à joindre à une demande : la version SIGNÉE si elle existe (originale scannée en priorité),
// sinon le fichier PDF déposé, sinon le PDF produit à partir du document rédigé dans la plateforme.
// Les droits ont déjà été vérifiés par la base (demander_expedition) ; la lecture d'une signature passe par
// consulter_signature, qui trace la consultation.
async function lettrePdf(documentId: string): Promise<{ octets: ArrayBuffer; nom: string } | null> {
  const supabase = await creerClientServeur();
  const { data: doc } = await supabase.from("documents").select("*").eq("id", documentId).maybeSingle<Document>();
  if (!doc || doc.classification === "confidentiel") return null;

  const { data: signature } = await supabase.from("signatures").select("id, numero, chemin_pdf, chemin_original").eq("document_id", documentId).eq("statut", "valide")
    .order("signe_le", { ascending: false }).limit(1).maybeSingle<{ id: string; numero: string; chemin_pdf: string | null; chemin_original: string | null }>();
  if (signature && (signature.chemin_original || signature.chemin_pdf)) {
    const { data: chemin } = await supabase.rpc("consulter_signature", { p_signature_id: signature.id, p_quoi: signature.chemin_original ? "original" : "pdf" });
    if (typeof chemin === "string") {
      const { data: fichier } = await creerClientAdmin().storage.from(BUCKET_SIGNATURES).download(chemin);
      if (fichier) return { octets: await fichier.arrayBuffer(), nom: `${signature.numero}.pdf` };
    }
  }
  if (doc.storage_path && doc.storage_path.toLowerCase().endsWith(".pdf")) {
    const { data: fichier } = await supabase.storage.from("documents-ged").download(doc.storage_path);
    if (fichier) return { octets: await fichier.arrayBuffer(), nom: doc.storage_path.split("/").pop() ?? "lettre.pdf" };
  }
  if (doc.format_atelier) {
    const export_ = await exporterDocument(doc, "pdf", await langueServeur());
    const copie = new Uint8Array(export_.tampon).buffer;
    return { octets: copie, nom: export_.nomFichier };
  }
  return null;
}

// --- Demande d'expédition (agent) ---------------------------------------------------------------------

export async function demanderExpedition(donnees: FormData) {
  const document = uuid(donnees, "document");
  const retour = (cle: string): never => redirect(`/courrier/depart/nouveau?${document ? `document=${document}&` : ""}erreur=${cle}`);
  if (!document) return retour("document");
  const parametres = parametresCommuns(donnees);
  if (!parametres.p_objet) retour("objet");
  if (parametres.p_destinataires.length === 0) retour("destinataire");

  const supabase = await creerClientServeur();
  const { data, error } = await supabase.rpc("demander_expedition", { ...parametres, p_document: document });
  if (error || typeof data !== "string") retour(cleErreur(error));
  const id = data as string;

  // On joint la lettre (PDF) pour que le service du courrier puisse l'imprimer. Jamais pour un document
  // confidentiel : le service ne verrait alors que l'enveloppe.
  let jointe = false;
  try {
    const { data: classe } = await supabase.from("documents").select("classification").eq("id", document).maybeSingle<{ classification: string }>();
    if (classe?.classification === "confidentiel") {
      jointe = true; // rien à joindre, c'est voulu
    } else {
      const lettre = await lettrePdf(document);
      if (lettre && !(await problemePdf(lettre.octets, lettre.nom))) {
        const chemin = `${id}/${crypto.randomUUID()}-lettre.pdf`;
        const depot = await supabase.storage.from("courrier").upload(chemin, new Uint8Array(lettre.octets), { contentType: "application/pdf", upsert: false });
        if (!depot.error) {
          const { error: erreurPiece } = await supabase.rpc("ajouter_piece_depart", {
            p_depart: id, p_chemin: chemin, p_nom: lettre.nom.slice(0, 200), p_taille: lettre.octets.byteLength,
            p_empreinte: await empreinteSha256(lettre.octets), p_nature: "lettre",
          });
          jointe = !erreurPiece;
        }
      }
    }
  } catch (e) {
    console.error("[depart] jonction de la lettre impossible", { depart: id, erreur: e instanceof Error ? e.message : String(e) });
  }
  revalidatePath("/courrier/depart");
  redirect(`/courrier/depart/${id}?ok=${jointe ? "demande" : "demande_sans_lettre"}`);
}

// --- Départ créé directement par le service (lettre signée sur papier) ------------------------------------

export async function enregistrerDepart(donnees: FormData) {
  const departement = texte(donnees, "departement", 100);
  const retour = (cle: string): never => redirect(`/courrier/depart/nouveau?erreur=${cle}`);
  const parametres = parametresCommuns(donnees);
  if (!parametres.p_objet) retour("objet");
  if (!departement) retour("departement");
  if (parametres.p_destinataires.length === 0) retour("destinataire");

  const supabase = await creerClientServeur();
  const { data, error } = await supabase.rpc("enregistrer_depart", {
    p_objet: parametres.p_objet, p_departement: departement, p_courrier_arrivee: parametres.p_courrier_arrivee, p_mode: parametres.p_mode,
    p_nb_pieces: parametres.p_nb_pieces, p_urgent: parametres.p_urgent, p_ar: parametres.p_ar, p_relance_jours: parametres.p_relance_jours,
    p_note: parametres.p_note, p_destinataires: parametres.p_destinataires,
  });
  if (error || typeof data !== "string") retour(cleErreur(error));
  revalidatePath("/courrier/depart");
  redirect(`/courrier/depart/${data}?ok=enregistre`);
}

// --- Traitement par le service du courrier ----------------------------------------------------------------

async function appeler(id: string, fonction: string, args: Record<string, unknown>, ok: string): Promise<never> {
  const supabase = await creerClientServeur();
  const { error } = await supabase.rpc(fonction, { p_depart: id, ...args });
  if (error) aller(id, "erreur", cleErreur(error));
  return aller(id, "ok", ok);
}

export async function accepterDemande(d: FormData) {
  const id = uuid(d, "id");
  if (!id) redirect("/courrier/depart");
  return appeler(id, "accepter_demande_depart", { p_mode: texte(d, "mode", 20) || null, p_nb_pieces: Number.parseInt(texte(d, "nb_pieces", 4), 10) || null }, "accepte");
}
export async function refuserDemande(d: FormData) {
  const id = uuid(d, "id");
  if (!id) redirect("/courrier/depart");
  return appeler(id, "refuser_demande_depart", { p_motif: texte(d, "motif", 500) }, "refuse");
}
export async function expedier(d: FormData) {
  const id = uuid(d, "id");
  if (!id) redirect("/courrier/depart");
  return appeler(id, "expedier_depart", {}, "expedie");
}
// Accusé de réception sans décharge : exception réservée au chef du courrier (la base le vérifie), motif obligatoire.
export async function accuserSansDecharge(d: FormData) {
  const id = uuid(d, "id");
  const destinataire = uuid(d, "destinataire");
  if (!id) redirect("/courrier/depart");
  if (!destinataire) aller(id, "erreur", "invalide");
  return appeler(id, "accuser_sans_decharge_depart", { p_destinataire: destinataire, p_motif: texte(d, "motif", 500) }, "accuse_sans_decharge");
}
export async function annulerDepart(d: FormData) {
  const id = uuid(d, "id");
  if (!id) redirect("/courrier/depart");
  return appeler(id, "annuler_depart", { p_motif: texte(d, "motif", 500) }, "annule");
}

// --- Pièces (lettre signée scannée, accusés de réception) ---------------------------------------------------
// Même principe que pour l'arrivée : le navigateur dépose le PDF dans l'archive privée, le serveur le relit,
// le contrôle et calcule l'empreinte réelle avant de l'enregistrer.

export async function enregistrerPieceDepart(entree: EntreePiece): Promise<{ erreur?: string }> {
  const { id, chemin } = entree;
  if (!UUID.test(id) || typeof chemin !== "string") return { erreur: "generique" };
  if (!chemin.startsWith(`${id}/`) || chemin.length > 300 || chemin.includes("..") || !chemin.toLowerCase().endsWith(".pdf")) return { erreur: "refus" };
  // « accuse » n'est plus déposable ici : un accusé ne se prouve que par la décharge d'un destinataire (enregistrerDecharge).
  const nature = ["lettre", "lettre_signee", "annexe"].includes(entree.nature) ? entree.nature : "annexe";
  const nom = String(entree.nom ?? "").split(/[\\/]/).pop()!.trim().slice(0, 200) || "scan.pdf";

  const supabase = await creerClientServeur();
  const { data: fichier, error: erreurLecture } = await supabase.storage.from("courrier").download(chemin);
  if (erreurLecture || !fichier) return { erreur: "depot" };
  const octets = await fichier.arrayBuffer();
  const probleme = await problemePdf(octets, nom);
  if (probleme) return { erreur: probleme };

  const { error } = await supabase.rpc("ajouter_piece_depart", {
    p_depart: id, p_chemin: chemin, p_nom: nom, p_taille: fichier.size, p_empreinte: await empreinteSha256(octets), p_nature: nature,
  });
  if (error) return { erreur: cleErreur(error) === "generique" ? "depot" : "refus" };
  revalidatePath(`/courrier/depart/${id}`);
  return {};
}

// --- Décharge d'un destinataire --------------------------------------------------------------------------------
// Le navigateur dépose le PDF (scanner, ou photos assemblées) dans l'archive privée ; ici le serveur le relit, le
// contrôle et calcule l'empreinte réelle, puis la base enregistre en une seule opération le fichier, l'accusé du
// destinataire, la date de remise, le signataire et le mode de remise.

const MODES_REMISE = ["main", "coursier", "huissier", "poste", "autre"];

/** « 2026-11-03T14:05 » (heure de Douala, UTC+1 toute l'année) → instant ISO ; null si la valeur n'a pas cette forme. */
function remiseEnInstant(valeur: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valeur)) return null;
  const instant = new Date(`${valeur}:00+01:00`);
  return Number.isNaN(instant.getTime()) ? null : instant.toISOString();
}

export async function enregistrerDecharge(entree: EntreePiece): Promise<{ erreur?: string }> {
  const { id, chemin } = entree;
  if (!UUID.test(id) || typeof chemin !== "string") return { erreur: "generique" };
  if (!chemin.startsWith(`${id}/`) || chemin.length > 300 || chemin.includes("..") || !chemin.toLowerCase().endsWith(".pdf")) return { erreur: "refus" };
  const extra = entree.extra ?? {};
  const destinataire = String(extra.destinataire ?? "");
  const remisLe = remiseEnInstant(String(extra.remis_le ?? ""));
  const recuPar = String(extra.recu_par ?? "").trim().slice(0, 200);
  const qualite = String(extra.recu_qualite ?? "").trim().slice(0, 200);
  const mode = String(extra.mode ?? "");
  if (!UUID.test(destinataire)) return { erreur: "invalide" };
  if (!remisLe) return { erreur: "decharge_date" };
  if (!recuPar) return { erreur: "decharge_nom" };
  if (!MODES_REMISE.includes(mode)) return { erreur: "decharge_mode" };
  const nom = String(entree.nom ?? "").split(/[\\/]/).pop()!.trim().slice(0, 200) || "decharge.pdf";

  const supabase = await creerClientServeur();
  const { data: fichier, error: erreurLecture } = await supabase.storage.from("courrier").download(chemin);
  if (erreurLecture || !fichier) return { erreur: "depot" };
  const octets = await fichier.arrayBuffer();
  const probleme = await problemePdf(octets, nom);
  if (probleme) return { erreur: probleme };

  const { error } = await supabase.rpc("enregistrer_decharge_depart", {
    p_depart: id, p_destinataire: destinataire, p_chemin: chemin, p_nom: nom, p_taille: fichier.size, p_empreinte: await empreinteSha256(octets),
    p_remis_le: remisLe, p_recu_par: recuPar, p_qualite: qualite || null, p_mode: mode,
  });
  if (error) {
    // Dépôt refusé : on tente de ne pas laisser d'orphelin dans l'archive (la règle de suppression du stockage peut s'y opposer).
    await supabase.storage.from("courrier").remove([chemin]);
    const cle = cleErreur(error);
    return { erreur: cle === "generique" ? "depot" : cle };
  }
  revalidatePath(`/courrier/depart/${id}`);
  revalidatePath("/courrier/depart");
  return {};
}
