"use server";

import { creerClientServeur } from "@/lib/supabase/server";

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
    options: { data: { nom_complet: nomComplet, departement } },
  });

  return { erreur: error ? traduireErreurSupabase(error.message) : null };
}

function traduireErreurSupabase(message: string): string {
  if (message.includes("Invalid login credentials")) return "Identifiants invalides.";
  if (message.includes("already registered")) return "Un compte existe déjà avec cet e-mail.";
  if (message.includes("Password should be")) return "Le mot de passe doit contenir au moins 6 caractères.";
  return message;
}
