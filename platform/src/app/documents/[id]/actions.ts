"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import type { StatutDocument } from "@/lib/types";
import { langueServeur } from "@/lib/i18n/serveur";
import { traduireErreur } from "@/lib/i18n/erreurs";

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

  if (error) return { erreur: traduireErreur(error.message, await langueServeur()) };

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");
  revalidatePath("/audit");
  return { erreur: null };
}

function rafraichir(documentId: string) {
  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/documents");
  revalidatePath("/audit");
}

// Archivage scellé (migration 0024) : la base vérifie le rôle (validateur du
// département ou administrateur), le statut (publié) et pose l'empreinte.
export async function archiverAction(documentId: string, motif: string): Promise<ResultatTransition> {
  const supabase = await creerClientServeur();
  const { error } = await supabase.rpc("archiver_document", { p_document_id: documentId, p_motif: motif || null });
  if (error) return { erreur: traduireErreur(error.message, await langueServeur()) };
  rafraichir(documentId);
  return { erreur: null };
}

export async function nouvelleVersionAction(documentId: string): Promise<ResultatTransition & { id?: string }> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.rpc("nouvelle_version_document", { p_document_id: documentId });
  if (error || !data) return { erreur: error ? traduireErreur(error.message, await langueServeur()) : (await langueServeur()) === "en" ? "Could not create the new version." : "Création de la nouvelle version impossible." };
  rafraichir(documentId);
  return { erreur: null, id: data as string };
}

export async function classerAction(documentId: string, nature: string): Promise<ResultatTransition> {
  const supabase = await creerClientServeur();
  const { error } = await supabase.rpc("classer_document", { p_document_id: documentId, p_nature: nature });
  if (error) return { erreur: traduireErreur(error.message, await langueServeur()) };
  rafraichir(documentId);
  return { erreur: null };
}

export type ResultatIntegrite = { erreur: string | null; conforme?: boolean; actuelle?: string };

export async function verifierIntegriteAction(documentId: string): Promise<ResultatIntegrite> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.rpc("verifier_integrite_document", { p_document_id: documentId });
  if (error) return { erreur: traduireErreur(error.message, await langueServeur()) };
  const resultat = data as { conforme: boolean; empreinte_actuelle: string };
  revalidatePath(`/documents/${documentId}`);
  return { erreur: null, conforme: resultat.conforme, actuelle: resultat.empreinte_actuelle };
}
