"use server";

import { headers } from "next/headers";
import { creerClientServeur } from "@/lib/supabase/server";
import { SIGLE_ORGANISATION } from "@/lib/organisation";

// Adresse publique du déploiement qui reçoit la demande. Les deux
// organisations partagent un seul projet Supabase (donc une seule « Site
// URL ») : sans adresse de retour explicite, le lien de confirmation
// renverrait toujours vers le même site, quel que soit celui d'inscription.
async function origineDuSite(): Promise<string> {
  const configuree = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configuree) return configuree;

  const h = await headers();
  const origine = h.get("origin");
  if (origine) return origine;
  const hote = h.get("x-forwarded-host") ?? h.get("host");
  const protocole = h.get("x-forwarded-proto") ?? "https";
  return `${protocole}://${hote}`;
}

export type ResultatConnexion = { erreur: string | null };

export async function connecterAction(formData: FormData): Promise<ResultatConnexion> {
  const email = String(formData.get("email") ?? "");
  const motDePasse = String(formData.get("mot_de_passe") ?? "");

  const supabase = await creerClientServeur();
  const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });

  return { erreur: error ? traduireErreurSupabase(error.message) : null };
}

export async function inscrireAction(formData: FormData): Promise<ResultatConnexion> {
  const email = String(formData.get("email") ?? "");
  const motDePasse = String(formData.get("mot_de_passe") ?? "");
  const nomComplet = String(formData.get("nom_complet") ?? "");
  const departement = String(formData.get("departement") ?? "Direction");

  const supabase = await creerClientServeur();
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

  if (error) return { erreur: traduireErreurSupabase(error.message) };
  // Adresse déjà inscrite et confirmée : Supabase répond « succès » sans rien
  // envoyer (pour ne pas révéler qui est inscrit) et renvoie un utilisateur
  // sans identité. Sans ce contrôle, on annoncerait un e-mail qui n'arrivera jamais.
  if (data.user && data.user.identities?.length === 0) {
    return { erreur: "Un compte existe déjà avec cette adresse e-mail : connectez-vous directement." };
  }
  return { erreur: null };
}

function traduireErreurSupabase(message: string): string {
  if (message.includes("Invalid login credentials")) return "Identifiants invalides.";
  if (message.includes("already registered")) return "Un compte existe déjà avec cet e-mail.";
  if (message.includes("Password should be")) return "Le mot de passe doit contenir au moins 6 caractères.";
  if (message.includes("Email not confirmed"))
    return "Adresse e-mail non confirmée : cliquez d'abord sur le lien reçu par e-mail.";
  if (message.toLowerCase().includes("rate limit"))
    return "Trop d'e-mails envoyés en peu de temps. Réessayez dans quelques minutes.";
  if (message.includes("Error sending confirmation email"))
    return "Le compte n'a pas pu être créé : l'e-mail de confirmation n'a pas pu être envoyé. Contactez l'administrateur.";
  return message;
}
