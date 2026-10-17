"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import {
  TAILLE_MAX_PIECE_JOINTE_OCTETS,
  TYPES_MIME_AUTORISES_PIECE_JOINTE,
} from "@/lib/labels";
import { analyserPieceJointe } from "@/lib/messagerie/antivirus";
import { envoyerAlertesPourMessage } from "@/lib/messagerie/alertes";

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

  let tamponFichier: Buffer | null = null;

  if (fichier && fichier.size > 0) {
    if (fichier.size > TAILLE_MAX_PIECE_JOINTE_OCTETS) {
      return { erreur: "Pièce jointe trop volumineuse (10 Mo au plus)." };
    }
    if (!TYPES_MIME_AUTORISES_PIECE_JOINTE.includes(fichier.type as (typeof TYPES_MIME_AUTORISES_PIECE_JOINTE)[number])) {
      return { erreur: "Type de fichier non autorisé pour une pièce jointe." };
    }

    // Analyse de sécurité AVANT tout envoi (cf. lib/messagerie/antivirus.ts) :
    // "la base refuse tout message dont la pièce jointe n'a pas été
    // analysée" — en pratique, on analyse donc avant même d'insérer le
    // message, pour ne jamais créer un message avec une pièce jointe non
    // scannée ou infectée.
    tamponFichier = Buffer.from(await fichier.arrayBuffer());
    const resultatAnalyse = await analyserPieceJointe(tamponFichier, fichier.name, fichier.type || "application/octet-stream");
    if (!resultatAnalyse.propre) {
      return { erreur: resultatAnalyse.motif ?? "Pièce jointe refusée par l'analyse de sécurité." };
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

  // 2. Pièce jointe éventuelle (déjà analysée ci-dessus), sous
  //    "<message_id>/<nom_du_fichier>" (même convention que "documents-ged").
  if (fichier && fichier.size > 0 && tamponFichier) {
    const cheminStockage = `${message.id}/${fichier.name}`;
    const { error: erreurUpload } = await supabase.storage
      .from("messagerie-pieces-jointes")
      .upload(cheminStockage, tamponFichier, { contentType: fichier.type || undefined });

    if (erreurUpload) {
      return { erreur: `Message envoyé, mais pièce jointe refusée : ${erreurUpload.message}` };
    }

    await supabase.from("pieces_jointes_message").insert({
      message_id: message.id,
      storage_path: cheminStockage,
      nom_fichier: fichier.name,
      taille_octets: fichier.size,
      type_mime: fichier.type || "application/octet-stream",
      statut_analyse: "propre",
    });
  }

  // 3. Alertes e-mail (destinataires hors ligne depuis plus de 2 minutes,
  //    au plus une par heure et par conversation) — toujours attendue
  //    (await), jamais laissée partir "en l'air" depuis une Server Action.
  await envoyerAlertesPourMessage(message.id).catch(() => null);

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
  // Fonction RPC unique (migration 0010) : met à jour à la fois
  // conversation_participants.dernier_lu_at (badge de non-lus) et les
  // accusés message_statuts.lu_at/recu_at (coches façon WhatsApp).
  await supabase.rpc("marquer_conversation_lue", { p_conversation_id: conversationId });
}

export async function basculerSourdineAction(conversationId: string, sourdine: boolean): Promise<ResultatMessagerie> {
  const supabase = await creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Session expirée, veuillez vous reconnecter." };

  const { error } = await supabase
    .from("conversation_participants")
    .update({ sourdine })
    .eq("conversation_id", conversationId)
    .eq("profil_id", user.id);

  if (error) return { erreur: error.message };

  revalidatePath("/messagerie");
  return { erreur: null };
}

export async function transfererMessageAction(messageId: string, conversationCibleId: string): Promise<ResultatMessagerie> {
  const supabase = await creerClientServeur();

  const { error } = await supabase.rpc("transferer_message", {
    p_message_id: messageId,
    p_conversation_cible_id: conversationCibleId,
  });

  if (error) return { erreur: error.message };

  revalidatePath(`/messagerie/${conversationCibleId}`);
  return { erreur: null };
}

export async function changerDureeConservationAction(annees: number): Promise<ResultatMessagerie> {
  const supabase = await creerClientServeur();

  const { error } = await supabase.rpc("definir_duree_conservation_messagerie", { p_annees: annees });
  if (error) return { erreur: error.message };

  revalidatePath("/messagerie");
  return { erreur: null };
}

export async function creerCanalDepartementAction(departement: string): Promise<ResultatMessagerie> {
  const supabase = await creerClientServeur();

  const nom = departement.trim();
  if (!nom) return { erreur: "Le département ne peut pas être vide." };

  const { error } = await supabase.rpc("creer_canal_departement", { p_departement: nom });
  if (error) return { erreur: error.message };

  revalidatePath("/messagerie");
  return { erreur: null };
}

export async function renommerCanalAction(conversationId: string, nouveauTitre: string): Promise<ResultatMessagerie> {
  const supabase = await creerClientServeur();

  const titre = nouveauTitre.trim();
  if (!titre) return { erreur: "Le titre ne peut pas être vide." };

  const { error } = await supabase.rpc("renommer_canal", { p_conversation_id: conversationId, p_nouveau_titre: titre });
  if (error) return { erreur: error.message };

  revalidatePath("/messagerie");
  revalidatePath(`/messagerie/${conversationId}`);
  return { erreur: null };
}

export async function supprimerCanalAction(conversationId: string): Promise<ResultatMessagerie> {
  const supabase = await creerClientServeur();

  const { error } = await supabase.rpc("supprimer_canal", { p_conversation_id: conversationId });
  if (error) return { erreur: error.message };

  revalidatePath("/messagerie");
  return { erreur: null };
}
