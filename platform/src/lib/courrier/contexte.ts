import { cache } from "react";
import { creerClientServeur } from "@/lib/supabase/server";
import type { Profil } from "@/lib/types";

export type RoleCourrier = "agent" | "chef" | null;
export type ContexteCourrier = { userId: string; profil: Profil & { role_courrier: RoleCourrier }; role: RoleCourrier };

// Agent connecté et son rôle au service du courrier, lus une fois par requête
// (sous la RLS : jamais de clé de service).
export const contexteCourrier = cache(async (): Promise<ContexteCourrier | null> => {
  const supabase = await creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!data) return null;
  const profil = data as Profil & { role_courrier: RoleCourrier };
  return { userId: user.id, profil, role: profil.role_courrier ?? null };
});

/** Noms d'affichage d'une liste de profils (même organisation, via la RLS). */
export async function nomsDesProfils(ids: (string | null | undefined)[]): Promise<Record<string, string>> {
  const uniques = [...new Set(ids.filter((i): i is string => Boolean(i)))];
  if (uniques.length === 0) return {};
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("profiles").select("id, nom_complet").in("id", uniques);
  return Object.fromEntries((data ?? []).map((p: { id: string; nom_complet: string }) => [p.id, p.nom_complet]));
}

/** Départements de l'organisation (portés par au moins un agent), triés. */
export async function departementsOrganisation(): Promise<string[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("profiles").select("departement");
  return [...new Set((data ?? []).map((p: { departement: string }) => p.departement?.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
}
