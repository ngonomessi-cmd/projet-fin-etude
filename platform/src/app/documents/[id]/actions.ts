"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import type { StatutDocument } from "@/lib/types";

export type ResultatTransition = { erreur: string | null };

// Appelle la fonction PostgreSQL transition_statut_document (cf. migration
// 0001_init.sql) : met à jour le statut ET écrit l'entrée d'audit de façon
// atomique. La légalité de la transition est revérifiée côté base (RLS +
// logique métier de la fonction), jamais uniquement côté client.
export async function transitionnerAction(
  documentId: string,
  nouveauStatut: StatutDocument,
  commentaire?: string
): Promise<ResultatTransition> {
  const supabase = await creerClientServeur();

  const { error } = await supabase.rpc("transition_statut_document", {
    p_document_id: documentId,
    p_nouveau_statut: nouveauStatut,
    p_commentaire: commentaire || null,
  });

  if (error) return { erreur: error.message };

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");
  revalidatePath("/audit");
  return { erreur: null };
}
