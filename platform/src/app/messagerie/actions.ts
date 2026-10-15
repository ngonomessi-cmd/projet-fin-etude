"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import {
  TAILLE_MAX_PIECE_JOINTE_OCTETS,
  TYPES_MIME_AUTORISES_PIECE_JOINTE,
} from "@/lib/labels";

export type ResultatMessagerie = { erreur: string | null };

// Reprend la conversation privée existante avec cette personne, ou en crée
// une (logique entièrement portée par la fonction SQL ouvrir_conversation_privee,
// qui applique la règle "un auditeur ne peut pas ouvrir de conversation").
export async function ouvrirConversationPriveeAction(autreId: string): Promise<ResultatMessagerie> {
  const supabase = await creerClientServeur();

  const { data, error } = await supabase.rpc("ouvrir_conversation_privee", { p_autre_id: autreId });
  if (error || !data) {
    return { erreur: error?.message ?? "Impossible d'ouvrir cette conversation." };
  }

  redirect(`/messagerie/${data.id}`);
}

export async function creerGroupeAction(formData: FormData): Promise<ResultatMessagerie> {
  const supabase = await creerClientServeur();

  const titre = String(formData.get("titre") ?? "").trim();
  const participants = formData.getAll("participants").map(String);

  if (!titre) return { erreur: "Le groupe doit avoir un objet." };
  if (participants.length === 0) return { erreur: "Sélectionnez au moins un agent." };

  const { data, error } = await supabase.rpc("creer_groupe_messagerie", {
    p_titre: titre,
    p_participants: participants,
  });
  if (error || !data) {
    return { erreur: error?.message ?? "Impossible de créer le groupe." };
  }

  redirect(`/messagerie/${data.id}`);
}

export async function envoyerMessageAction(conversationId: string, formData: FormData): Promise<ResultatMessagerie> {
  const supabase = await creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Session expirée, veuillez vous reconnecter." };

  const contenu = String(formData.get("contenu") ?? "").trim();
  const urgent = formData.get("urgent") === "on";
  const fichier = formData.get("fichier") as File | null;

  if (!contenu) return { erreur: "Le message ne peut pas être vide." };
  if (contenu.length > 10000) return { erreur: "Message trop long (10 000 caractères au plus)." };

  if (fichier && fichier.size > 0) {
    if (fichier.size > TAILLE_MAX_PIECE_JOINTE_OCTETS) {
      return { erreur: "Pièce jointe trop volumineuse (4 Mo au plus)." };
    }
    if (!TYPES_MIME_AUTORISES_PIECE_JOINTE.includes(fichier.type as (typeof TYPES_MIME_AUTORISES_PIECE_JOINTE)[number])) {
      return { erreur: "Type de fichier non autorisé pour une pièce jointe." };
    }
  }

  // 1. Le message d'abord (policy RLS "messages_envoi_participant_autorise" :
  //    il faut déjà être participant, et avoir le droit de publier sur un canal).
  const { data: message, error: erreurMessage } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, auteur_id: user.id, contenu, urgent })
    .select()
    .single();

  if (erreurMessage || !message) {
    return { erreur: `Message non envoyé : ${erreurMessage?.message}` };
  }

  // 2. Pièce jointe éventuelle, sous "<message_id>/<nom_du_fichier>" (même
  //    convention que le bucket "documents-ged").
  if (fichier && fichier.size > 0) {
    const cheminStockage = `${message.id}/${fichier.name}`;
    const { error: erreurUpload } = await supabase.storage
      .from("messagerie-pieces-jointes")
      .upload(cheminStockage, fichier, { contentType: fichier.type || undefined });

    if (erreurUpload) {
      return { erreur: `Message envoyé, mais pièce jointe refusée : ${erreurUpload.message}` };
    }

    await supabase.from("pieces_jointes_message").insert({
      message_id: message.id,
      storage_path: cheminStockage,
      nom_fichier: fichier.name,
      taille_octets: fichier.size,
      type_mime: fichier.type || "application/octet-stream",
    });
  }

  revalidatePath(`/messagerie/${conversationId}`);
  return { erreur: null };
}

export async function modifierMessageAction(messageId: string, contenu: string): Promise<ResultatMessagerie> {
  const supabase = await creerClientServeur();

  const texte = contenu.trim();
  if (!texte) return { erreur: "Le message ne peut pas être vide." };
  if (texte.length > 10000) return { erreur: "Message trop long (10 000 caractères au plus)." };

  // La policy RLS "messages_correction_auteur_15_minutes" refuse la mise à
  // jour au-delà de 15 minutes après l'envoi : en cas de refus, Supabase ne
  // renvoie pas d'erreur explicite, juste aucune ligne mise à jour.
  const { data, error } = await supabase
    .from("messages")
    .update({ contenu: texte, modifie_at: new Date().toISOString() })
    .eq("id", messageId)
    .select()
    .maybeSingle();

  if (error) return { erreur: error.message };
  if (!data) return { erreur: "Ce message ne peut plus être modifié (délai de 15 minutes dépassé)." };

  revalidatePath(`/messagerie/${data.conversation_id}`);
  return { erreur: null };
}

export async function supprimerMessageAction(messageId: string): Promise<ResultatMessagerie> {
  const supabase = await creerClientServeur();

  const { data, error } = await supabase
    .from("messages")
    .update({ supprime_at: new Date().toISOString() })
    .eq("id", messageId)
    .select()
    .maybeSingle();

  if (error) return { erreur: error.message };
  if (!data) return { erreur: "Ce message ne peut plus être supprimé (délai de 15 minutes dépassé)." };

  revalidatePath(`/messagerie/${data.conversation_id}`);
  return { erreur: null };
}

export async function archiverConversationAction(conversationId: string, archivee: boolean): Promise<ResultatMessagerie> {
  const supabase = await creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Session expirée, veuillez vous reconnecter." };

  const { error } = await supabase
    .from("conversation_participants")
    .update({ archivee })
    .eq("conversation_id", conversationId)
    .eq("profil_id", user.id);

  if (error) return { erreur: error.message };

  revalidatePath("/messagerie");
  return { erreur: null };
}

export async function marquerConversationLueAction(conversationId: string): Promise<void> {
  const supabase = await creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("conversation_participants")
    .update({ dernier_lu_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("profil_id", user.id);
}

export async function changerDureeConservationAction(annees: number): Promise<ResultatMessagerie> {
  const supabase = await creerClientServeur();

  const { error } = await supabase.rpc("definir_duree_conservation_messagerie", { p_annees: annees });
  if (error) return { erreur: error.message };

  revalidatePath("/messagerie");
  return { erreur: null };
}
