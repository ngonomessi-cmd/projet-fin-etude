"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { UUID } from "@/lib/courrier/constantes";
import { cleErreur, dateOuNull, empreinteSha256, problemePdf, texte } from "@/lib/courrier/serveur";

const uuid = (d: FormData, nom: string) => {
  const v = String(d.get(nom) ?? "");
  return UUID.test(v) ? v : null;
};

function aller(id: string, type: "ok" | "erreur", cle: string): never {
  revalidatePath(`/courrier/${id}`);
  revalidatePath("/courrier");
  redirect(`/courrier/${id}?${type}=${cle}`);
}

// --- Enregistrement ---------------------------------------------------------------------------

export async function enregistrerCourrier(donnees: FormData) {
  const departement = texte(donnees, "departement", 100);
  const destinataire = uuid(donnees, "destinataire");
  const caractere = texte(donnees, "caractere", 20) || "ordinaire";
  const retour = (cle: string): never => redirect(`/courrier/nouveau?erreur=${cle}`);
  if (!texte(donnees, "expediteur", 300)) retour("expediteur");
  if (!departement) retour("departement");
  if (caractere === "personnel" && !destinataire) retour("personnel");

  const supabase = await creerClientServeur();
  const { data, error } = await supabase.rpc("enregistrer_courrier", {
    p_expediteur: texte(donnees, "expediteur", 300),
    p_reference: texte(donnees, "reference", 200) || null,
    p_date_lettre: dateOuNull(texte(donnees, "date_lettre", 10)),
    p_mode: texte(donnees, "mode", 20),
    p_nature: texte(donnees, "nature", 20),
    p_nb_pieces: Math.min(999, Math.max(1, Number.parseInt(texte(donnees, "nb_pieces", 4), 10) || 1)),
    p_objet: texte(donnees, "objet", 500) || null,
    p_caractere: caractere,
    p_departement: departement,
    p_destinataire: destinataire,
    p_echeance: dateOuNull(texte(donnees, "echeance", 10)),
  });
  if (error || typeof data !== "string") retour(cleErreur(error));
  revalidatePath("/courrier");
  redirect(`/courrier/${data}?ok=enregistre`);
}

// --- Numérisation -------------------------------------------------------------------------------
// Le navigateur dépose le PDF directement dans l'archive privée (avec la session de l'agent) ;
// le serveur relit le fichier, le contrôle, calcule son empreinte réelle puis l'enregistre.

export type EntreePiece = { id: string; chemin: string; nom: string; nature: string };

export async function enregistrerPiece(entree: EntreePiece): Promise<{ erreur?: string }> {
  const { id, chemin } = entree;
  if (!UUID.test(id) || typeof chemin !== "string") return { erreur: "generique" };
  if (!chemin.startsWith(`${id}/`) || chemin.length > 300 || chemin.includes("..") || !chemin.toLowerCase().endsWith(".pdf")) return { erreur: "refus" };
  const nature = entree.nature === "decharge" ? "decharge" : "scan";
  const nom = String(entree.nom ?? "").split(/[\\/]/).pop()!.trim().slice(0, 200) || "scan.pdf";

  const supabase = await creerClientServeur();
  const { data: fichier, error: erreurLecture } = await supabase.storage.from("courrier").download(chemin);
  if (erreurLecture || !fichier) return { erreur: "depot" };
  const octets = await fichier.arrayBuffer();
  const probleme = await problemePdf(octets, nom);
  if (probleme) return { erreur: probleme };

  const { error } = await supabase.rpc("ajouter_piece_courrier", {
    p_courrier: id,
    p_chemin: chemin,
    p_nom: nom,
    p_taille: fichier.size,
    p_empreinte: await empreinteSha256(octets),
    p_nature: nature,
  });
  if (error) return { erreur: cleErreur(error) === "generique" ? "depot" : "refus" };
  revalidatePath(`/courrier/${id}`);
  return {};
}

// --- Remise, décharge, suites ---------------------------------------------------------------------

async function appeler(id: string, fonction: string, args: Record<string, unknown>, ok: string): Promise<never> {
  const supabase = await creerClientServeur();
  const { error } = await supabase.rpc(fonction, { p_courrier: id, ...args });
  if (error) aller(id, "erreur", cleErreur(error));
  return aller(id, "ok", ok);
}

export async function declarerRemise(d: FormData) {
  const id = uuid(d, "id");
  if (!id) redirect("/courrier");
  return appeler(id, "declarer_remise_courrier", {}, "remise");
}
export async function dechargePapier(d: FormData) {
  const id = uuid(d, "id");
  if (!id) redirect("/courrier");
  return appeler(id, "decharge_papier_courrier", {}, "decharge");
}
export async function accuserReception(d: FormData) {
  const id = uuid(d, "id");
  if (!id) redirect("/courrier");
  return appeler(id, "accuser_reception_courrier", {}, "decharge");
}
export async function imputer(d: FormData) {
  const id = uuid(d, "id");
  const agent = uuid(d, "agent");
  if (!id) redirect("/courrier");
  if (!agent) aller(id, "erreur", "invalide");
  return appeler(id, "imputer_courrier", { p_agent: agent, p_instruction: texte(d, "instruction", 1000) || null }, "impute");
}
export async function changerStatut(d: FormData) {
  const id = uuid(d, "id");
  const statut = texte(d, "statut", 10);
  if (!id) redirect("/courrier");
  if (!["traite", "classe"].includes(statut)) aller(id, "erreur", "invalide");
  return appeler(id, "changer_statut_courrier", { p_statut: statut }, statut);
}
export async function annuler(d: FormData) {
  const id = uuid(d, "id");
  if (!id) redirect("/courrier");
  return appeler(id, "annuler_courrier", { p_motif: texte(d, "motif", 500) }, "annule");
}
export async function corriger(d: FormData) {
  const id = uuid(d, "id");
  const departement = texte(d, "departement", 100);
  if (!id) redirect("/courrier");
  if (!departement) aller(id, "erreur", "departement");
  return appeler(id, "corriger_courrier", {
    p_expediteur: texte(d, "expediteur", 300),
    p_reference: texte(d, "reference", 200) || null,
    p_objet: texte(d, "objet", 500) || null,
    p_departement: departement,
    p_destinataire: uuid(d, "destinataire"),
    p_motif: texte(d, "motif", 500),
  }, "corrige");
}
