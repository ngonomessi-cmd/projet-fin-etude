"use server";

import { creerClientServeur } from "@/lib/supabase/server";
import { origineDuSite } from "@/lib/site";
import { SIGLE_ORGANISATION } from "@/lib/organisation";
import { traductionServeur } from "@/lib/i18n/serveur";
import type { Traduire } from "@/lib/i18n/plateforme";

export type ResultatConnexion = { erreur: string | null };

export async function connecterAction(formData: FormData): Promise<ResultatConnexion> {
  const email = String(formData.get("email") ?? "");
  const motDePasse = String(formData.get("mot_de_passe") ?? "");

  const supabase = await creerClientServeur();
  const { t } = await traductionServeur();
  const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });

  return { erreur: error ? traduireErreurSupabase(error.message, t) : null };
}

export async function inscrireAction(formData: FormData): Promise<ResultatConnexion> {
  const email = String(formData.get("email") ?? "");
  const motDePasse = String(formData.get("mot_de_passe") ?? "");
  const nomComplet = String(formData.get("nom_complet") ?? "");
  const departement = String(formData.get("departement") ?? "Direction");

  const supabase = await creerClientServeur();
  const { t } = await traductionServeur();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: motDePasse,
    // L'organisation n'est jamais choisie par la personne qui s'inscrit :
    // elle vient du déploiement utilisé (cf. src/lib/organisation.ts), reprise
    // par le déclencheur gerer_nouvel_utilisateur (migration 0018) pour
    // peupler profiles.organisation — c'est ce qui isole les données entre
    // deux organisations hébergées sur la même base Supabase.
    options: {
      data: { nom_complet: nomComplet, departement, organisation: SIGLE_ORGANISATION },
      emailRedirectTo: `${await origineDuSite()}/auth/callback`,
    },
  });

  if (error) return { erreur: traduireErreurSupabase(error.message, t) };
  // Adresse déjà inscrite et confirmée : Supabase répond « succès » sans rien
  // envoyer (pour ne pas révéler qui est inscrit) et renvoie un utilisateur
  // sans identité. Sans ce contrôle, on annoncerait un e-mail qui n'arrivera jamais.
  if (data.user && data.user.identities?.length === 0) {
    return {
      erreur: t(
        "Un compte existe déjà avec cette adresse e-mail : connectez-vous directement.",
        "An account already exists with this email address: sign in directly."
      ),
    };
  }
  return { erreur: null };
}

function traduireErreurSupabase(message: string, t: Traduire): string {
  if (message.includes("Invalid login credentials")) return t("Identifiants invalides.", "Invalid credentials.");
  if (message.includes("already registered")) return t("Un compte existe déjà avec cet e-mail.", "An account already exists with this email.");
  if (message.includes("Password should be"))
    return t("Le mot de passe doit contenir au moins 6 caractères.", "The password must be at least 6 characters long.");
  if (message.includes("Email not confirmed"))
    return t(
      "Adresse e-mail non confirmée : cliquez d'abord sur le lien reçu par e-mail.",
      "Email address not confirmed: first click the link you received by email."
    );
  if (message.toLowerCase().includes("rate limit"))
    return t("Trop d'e-mails envoyés en peu de temps. Réessayez dans quelques minutes.", "Too many emails sent recently. Try again in a few minutes.");
  if (message.includes("Error sending confirmation email"))
    return t(
      "Le compte n'a pas pu être créé : l'e-mail de confirmation n'a pas pu être envoyé. Contactez l'administrateur.",
      "The account could not be created: the confirmation email could not be sent. Contact the administrator."
    );
  return message;
}
