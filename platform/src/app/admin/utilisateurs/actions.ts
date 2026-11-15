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

// Service du courrier (migration 0029) : « agent », « chef » ou aucun rôle. La fonction
// definir_role_courrier revérifie que l'appelant est administrateur de la même organisation
// et qu'il ne se désigne pas lui-même.
export async function definirRoleCourrierAction(utilisateurId: string, role: "agent" | "chef" | null): Promise<{ erreur: string | null }> {
  const supabase = await creerClientServeur();
  const { error } = await supabase.rpc("definir_role_courrier", { p_profil: utilisateurId, p_role: role });
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

export type ResultatCreationCompte = { erreur: string | null; succes?: string };

// Création d'un compte par l'administrateur, avec un mot de passe provisoire à changer à la
// première connexion (indicateur app_metadata.doit_changer_mdp, imposé par le middleware).
// La création passe par la clé de service : elle n'est faite qu'après avoir vérifié, avec la
// session de l'appelant (RLS, niveau aal2), qu'il est bien administrateur. Le compte est
// rattaché à l'organisation de l'administrateur et reçoit le rôle « lecteur ».
export async function creerCompteAction(formData: FormData): Promise<ResultatCreationCompte> {
  const langue = await langueServeur();
  const t = (fr: string, en: string) => (langue === "en" ? en : fr);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const nomComplet = String(formData.get("nom_complet") ?? "").trim();
  const departement = String(formData.get("departement") ?? "").trim();
  const motDePasse = String(formData.get("mot_de_passe") ?? "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { erreur: t("Adresse e-mail invalide.", "Invalid email address.") };
  if (!nomComplet || !departement) return { erreur: t("Le nom et le département sont obligatoires.", "Name and department are required.") };
  if (motDePasse.length < 10) return { erreur: t("Le mot de passe provisoire doit contenir au moins 10 caractères.", "The temporary password must be at least 10 characters long.") };

  const supabase = await creerClientServeur();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erreur: t("Session expirée.", "Session expired.") };
  const { data: moi } = await supabase.from("profiles").select("role, organisation").eq("id", user.id).single();
  if (!moi || moi.role !== "administrateur") return { erreur: t("Action réservée à l'administrateur.", "Administrators only.") };

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    return { erreur: t("La clé de service Supabase n'est pas configurée sur ce déploiement (variable SUPABASE_SERVICE_ROLE_KEY).", "The Supabase service key is not configured on this deployment (SUPABASE_SERVICE_ROLE_KEY).") };

  const { creerClientAdmin } = await import("@/lib/supabase/admin");
  const admin = creerClientAdmin();
  const { error } = await admin.auth.admin.createUser({
    email,
    password: motDePasse,
    email_confirm: true,
    user_metadata: { nom_complet: nomComplet, departement, organisation: moi.organisation },
    app_metadata: { doit_changer_mdp: true },
  });
  if (error) {
    if (/already (been )?registered|already exists/i.test(error.message))
      return { erreur: t("Un compte existe déjà avec cette adresse.", "An account already exists with this address.") };
    if (/weak|pwned|leaked/i.test(error.message))
      return { erreur: t("Mot de passe provisoire refusé : trop faible ou compromis.", "Temporary password refused: too weak or compromised.") };
    return { erreur: t("Le compte n'a pas pu être créé.", "The account could not be created.") };
  }

  await supabase.from("audit_log").insert({ acteur_id: user.id, action: "creation_compte", details: { email, nom_complet: nomComplet, departement } });
  revalidatePath("/admin/utilisateurs");
  return {
    erreur: null,
    succes: t(
      `Compte créé pour ${nomComplet}. À sa première connexion, il configurera Google Authenticator puis choisira son propre mot de passe.`,
      `Account created for ${nomComplet}. At first sign-in, they will set up Google Authenticator and then choose their own password.`
    ),
  };
}
