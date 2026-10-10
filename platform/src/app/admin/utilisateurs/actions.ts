"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import type { RoleUtilisateur } from "@/lib/types";

export type ResultatChangementRole = { erreur: string | null };

// Appelle la fonction PostgreSQL changer_role_utilisateur (SECURITY DEFINER),
// qui revérifie elle-même que l'appelant est administrateur avant toute
// écriture — cette action serveur n'est donc qu'un relais, jamais la seule
// barrière de sécurité.
export async function changerRoleAction(
  utilisateurId: string,
  nouveauRole: RoleUtilisateur
): Promise<ResultatChangementRole> {
  const supabase = await creerClientServeur();

  const { error } = await supabase.rpc("changer_role_utilisateur", {
    p_utilisateur_id: utilisateurId,
    p_nouveau_role: nouveauRole,
  });

  if (error) return { erreur: error.message };

  revalidatePath("/admin/utilisateurs");
  return { erreur: null };
}
