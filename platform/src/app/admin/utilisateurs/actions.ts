"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import type { RoleUtilisateur } from "@/lib/types";
import { langueServeur } from "@/lib/i18n/serveur";
import { traduireErreur } from "@/lib/i18n/erreurs";

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

  if (error) return { erreur: traduireErreur(error.message, await langueServeur()) };

  revalidatePath("/admin/utilisateurs");
  return { erreur: null };
}

export type ResultatModificationProfil = { erreur: string | null };

// Appelle modifier_profil_utilisateur (SECURITY DEFINER), qui revérifie
// elle-même que l'appelant est administrateur. Les deux champs sont
// facultatifs : seul celui réellement modifié est transmis.
export async function modifierProfilAction(
  utilisateurId: string,
  nomComplet?: string,
  departement?: string
): Promise<ResultatModificationProfil> {
  const supabase = await creerClientServeur();

  const { error } = await supabase.rpc("modifier_profil_utilisateur", {
    p_utilisateur_id: utilisateurId,
    p_nom_complet: nomComplet ?? null,
    p_departement: departement ?? null,
  });

  if (error) return { erreur: traduireErreur(error.message, await langueServeur()) };

  revalidatePath("/admin/utilisateurs");
  return { erreur: null };
}

// Noms anglais des départements (migration 0026). La table est protégée par
// RLS : seul un administrateur écrit, et seulement pour son organisation.
export async function enregistrerNomsDepartementsEnAction(formData: FormData): Promise<{ erreur: string | null }> {
  const supabase = await creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: (await langueServeur()) === "en" ? "Session expired, please sign in again." : "Session expirée, veuillez vous reconnecter." };
  const { data: profil } = await supabase.from("profiles").select("organisation").eq("id", user.id).single();
  if (!profil) return { erreur: (await langueServeur()) === "en" ? "Profile not found." : "Profil introuvable." };

  const departements = formData.getAll("departement").map(String);
  const nomsEn = formData.getAll("nom_en").map((v) => String(v).trim().slice(0, 120));
  const aEnregistrer = departements.map((d, i) => ({ organisation: profil.organisation, departement: d, nom_en: nomsEn[i] ?? "" }));

  const remplis = aEnregistrer.filter((l) => l.nom_en);
  const vides = aEnregistrer.filter((l) => !l.nom_en).map((l) => l.departement);
  if (remplis.length) {
    const { error } = await supabase.from("departements_noms_en").upsert(remplis, { onConflict: "organisation,departement" });
    if (error) return { erreur: traduireErreur(error.message, await langueServeur()) };
  }
  if (vides.length) {
    const { error } = await supabase.from("departements_noms_en").delete().in("departement", vides);
    if (error) return { erreur: traduireErreur(error.message, await langueServeur()) };
  }
  revalidatePath("/", "layout");
  return { erreur: null };
}

// Réinitialisation de la double authentification d'un agent (téléphone
// perdu) : il devra reconfigurer Google Authenticator à sa prochaine
// connexion. Contrôles et journal d'audit dans la fonction de la base.
export async function reinitialiserMfaAction(utilisateurId: string): Promise<{ erreur: string | null }> {
  const supabase = await creerClientServeur();
  const { error } = await supabase.rpc("reinitialiser_mfa_utilisateur", { p_utilisateur_id: utilisateurId });
  if (error) return { erreur: traduireErreur(error.message, await langueServeur()) };
  revalidatePath("/admin/utilisateurs");
  return { erreur: null };
}
