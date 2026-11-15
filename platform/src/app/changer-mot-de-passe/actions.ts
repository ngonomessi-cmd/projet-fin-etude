"use server";

import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { traductionServeur } from "@/lib/i18n/serveur";

export type ResultatMotDePasse = { erreur: string | null };

// Première connexion d'un compte créé par un administrateur : l'agent remplace son mot de
// passe provisoire. Le mot de passe est changé avec la session de l'agent (niveau aal2,
// imposé par le middleware), puis l'indicateur app_metadata.doit_changer_mdp est levé avec la
// clé de service : l'agent ne peut pas le lever lui-même sans avoir changé son mot de passe.
export async function changerMotDePasseAction(formData: FormData): Promise<ResultatMotDePasse> {
  const { t } = await traductionServeur();
  const nouveau = String(formData.get("nouveau") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (nouveau.length < 10) return { erreur: t("Le mot de passe doit contenir au moins 10 caractères.", "The password must be at least 10 characters long.") };
  if (!/[A-Za-z]/.test(nouveau) || !/\d/.test(nouveau))
    return { erreur: t("Le mot de passe doit contenir au moins une lettre et un chiffre.", "The password must contain at least one letter and one digit.") };
  if (nouveau !== confirmation) return { erreur: t("Les deux saisies ne sont pas identiques.", "The two entries do not match.") };

  const supabase = await creerClientServeur();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erreur: t("Session expirée : reconnectez-vous.", "Session expired: please sign in again.") };
  if (user.app_metadata?.doit_changer_mdp !== true) redirect("/documents");

  const { error } = await supabase.auth.updateUser({ password: nouveau });
  if (error) {
    if (/different from the old password/i.test(error.message))
      return { erreur: t("Choisissez un mot de passe différent du mot de passe provisoire.", "Choose a password different from the temporary one.") };
    if (/weak|pwned|leaked/i.test(error.message))
      return { erreur: t("Ce mot de passe est trop faible ou figure dans une liste de mots de passe compromis.", "This password is too weak or appears in a list of compromised passwords.") };
    return { erreur: t("Le mot de passe n'a pas pu être changé. Réessayez.", "The password could not be changed. Please try again.") };
  }

  const admin = creerClientAdmin();
  const { error: erreurMeta } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, doit_changer_mdp: false },
  });
  if (erreurMeta) return { erreur: t("Mot de passe changé, mais la configuration du compte a échoué. Contactez l'administrateur.", "Password changed, but the account could not be updated. Contact the administrator.") };

  await supabase.from("audit_log").insert({ acteur_id: user.id, action: "changement_mot_de_passe", details: {} });
  await supabase.auth.refreshSession();
  redirect("/documents");
}
