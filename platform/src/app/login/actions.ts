"use server";

import { creerClientServeur } from "@/lib/supabase/server";
import { SIGLE_ORGANISATION } from "@/lib/organisation";

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
  const { error } = await supabase.auth.signUp({
    email,
    password: motDePasse,
    // L'organisation n'est jamais choisie par la personne qui s'inscrit :
    // elle vient du déploiement utilisé (cf. src/lib/organisation.ts), reprise
    // par le déclencheur gerer_nouvel_utilisateur (migration 0018) pour
    // peupler profiles.organisation — c'est ce qui isole les données entre
    // deux organisations hébergées sur la même base Supabase.
    options: { data: { nom_complet: nomComplet, departement, organisation: SIGLE_ORGANISATION } },
  });

  return { erreur: error ? traduireErreurSupabase(error.message) : null };
}

function traduireErreurSupabase(message: string): string {
  if (message.includes("Invalid login credentials")) return "Identifiants invalides.";
  if (message.includes("already registered")) return "Un compte existe déjà avec cet e-mail.";
  if (message.includes("Password should be")) return "Le mot de passe doit contenir au moins 6 caractères.";
  return message;
}
