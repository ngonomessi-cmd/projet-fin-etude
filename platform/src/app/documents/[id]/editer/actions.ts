"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { langueServeur } from "@/lib/i18n/serveur";
import { traduireErreur } from "@/lib/i18n/erreurs";

export type EtatVerrou = { ok: boolean; motif?: "lecture_seule" | "verrouille"; par?: string; jusqua?: string; erreur?: string };

export async function prendreVerrouAction(documentId: string): Promise<EtatVerrou> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.rpc("prendre_verrou_document", { p_document_id: documentId });
  if (error) return { ok: false, erreur: traduireErreur(error.message, await langueServeur()) };
  return data as EtatVerrou;
}

export async function libererVerrouAction(documentId: string): Promise<void> {
  const supabase = await creerClientServeur();
  await supabase.rpc("liberer_verrou_document", { p_document_id: documentId });
}

export async function enregistrerContenuAction(
  documentId: string,
  contenu: unknown,
  titre: string
): Promise<{ erreur: string | null; enregistreLe?: string }> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.rpc("enregistrer_contenu_document", {
    p_document_id: documentId,
    p_contenu: contenu,
    p_titre: titre,
  });
  if (error) return { erreur: traduireErreur(error.message, await langueServeur()) };
  revalidatePath(`/documents/${documentId}`);
  return { erreur: null, enregistreLe: data as string };
}
