"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { exporterDocument, type FichierExporte } from "@/lib/atelier/exporter";
import { envoyerAlertesPourMessage } from "@/lib/messagerie/alertes";
import type { Document, Profil } from "@/lib/types";

export type ResultatPartage = { erreur: string | null; succes?: string };

const TAILLE_MAX_PJ = 4 * 1024 * 1024;

export async function partagerDocumentAction(documentId: string, formData: FormData): Promise<ResultatPartage> {
  const supabase = await creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Session expirée, veuillez vous reconnecter." };

  const profils = formData.getAll("profils").map(String).filter(Boolean);
  const conversationId = String(formData.get("conversation_id") ?? "") || null;
  const droit = formData.get("droit") === "edition" ? "edition" : "lecture";
  const mot = String(formData.get("message") ?? "").trim().slice(0, 1000);
  const joindrePdf = formData.get("joindre_pdf") === "on";

  if (profils.length === 0 && !conversationId) return { erreur: "Choisissez au moins une personne ou une conversation." };

  // 1. Les droits d'abord : toutes les règles (rôle, personnes contactables,
  //    confidentialité par département) sont vérifiées par la base.
  const { error: erreurPartage } = await supabase.rpc("partager_document", {
    p_document_id: documentId,
    p_profils: profils,
    p_conversation_id: conversationId,
    p_droit: droit,
  });
  if (erreurPartage) return { erreur: erreurPartage.message };

  const [{ data: docData }, { data: moiData }] = await Promise.all([
    supabase.from("documents").select("*").eq("id", documentId).single(),
    supabase.from("profiles").select("*").eq("id", user.id).single(),
  ]);
  const doc = docData as Document;
  const moi = moiData as Profil;

  // 2. Une copie PDF figée, si demandée (documents rédigés dans la plateforme).
  let pdf: FichierExporte | null = null;
  if (joindrePdf && doc.format_atelier) {
    pdf = await exporterDocument(doc, "pdf");
    if (pdf.tampon.length > TAILLE_MAX_PJ) pdf = null;
  }

  // 3. Un message dans la messagerie interne de chaque destinataire.
  const texte = [
    `${moi.nom_complet} a partagé le document « ${doc.titre} » (${droit === "edition" ? "lecture et modification" : "lecture"}).`,
    mot,
    `Ouvrir : /documents/${doc.id}`,
  ]
    .filter(Boolean)
    .join("\n");

  const conversations: string[] = [];
  for (const profilId of profils) {
    const { data: conv } = await supabase.rpc("ouvrir_conversation_privee", { p_autre_id: profilId });
    if (conv?.id) conversations.push(conv.id);
  }
  if (conversationId) conversations.push(conversationId);

  let messagesEnvoyes = 0;
  for (const conversation of conversations) {
    const { data: message } = await supabase
      .from("messages")
      .insert({ conversation_id: conversation, auteur_id: user.id, contenu: texte })
      .select("id")
      .single();
    if (!message) continue;
    messagesEnvoyes++;
    if (pdf) {
      const chemin = `${message.id}/${pdf.nomFichier}`;
      const { error } = await supabase.storage
        .from("messagerie-pieces-jointes")
        .upload(chemin, pdf.tampon, { contentType: pdf.typeMime });
      if (!error) {
        await supabase.from("pieces_jointes_message").insert({
          message_id: message.id,
          storage_path: chemin,
          nom_fichier: pdf.nomFichier,
          taille_octets: pdf.tampon.length,
          type_mime: pdf.typeMime,
          statut_analyse: "propre",
        });
      }
    }
    await envoyerAlertesPourMessage(message.id).catch(() => null);
  }

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/messagerie");
  const n = profils.length + (conversationId ? 1 : 0);
  return {
    erreur: null,
    succes: `Document partagé (${n} destinataire${n > 1 ? "s" : ""}${messagesEnvoyes ? ", prévenu" + (n > 1 ? "s" : "") + " par la messagerie" : ""}${pdf ? ", PDF joint" : ""}).`,
  };
}

export async function retirerPartageAction(partageId: string, documentId: string): Promise<ResultatPartage> {
  const supabase = await creerClientServeur();
  const { error } = await supabase.rpc("retirer_partage", { p_partage_id: partageId });
  if (error) return { erreur: error.message };
  revalidatePath(`/documents/${documentId}`);
  return { erreur: null };
}
