"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { contenuVide } from "@/lib/atelier/contenus";
import type { FormatAtelier } from "@/lib/types";

export type ResultatModele = { erreur: string | null };

export async function creerModeleAction(formData: FormData): Promise<ResultatModele> {
  const supabase = await creerClientServeur();
  const titre = String(formData.get("titre") ?? "").trim();
  const format = String(formData.get("format") ?? "") as FormatAtelier;
  const depuis = String(formData.get("depuis") ?? "");

  let contenu: unknown = contenuVide(format);
  let description: string | null = null;
  if (depuis) {
    const { data: source } = await supabase.from("modeles_documents").select("*").eq("id", depuis).maybeSingle();
    if (!source) return { erreur: "Modèle d'origine introuvable." };
    contenu = source.contenu;
    description = source.description;
  }
  if (!titre) return { erreur: "Le titre est obligatoire." };
  if (!["texte", "tableur", "presentation"].includes(format)) return { erreur: "Type de modèle inconnu." };

  // L'organisation et l'auteur sont posés par la base (déclencheur), jamais par le client.
  const { data, error } = await supabase
    .from("modeles_documents")
    .insert({ titre, format, contenu, description })
    .select("id")
    .single();
  if (error || !data) return { erreur: error?.message ?? "Création impossible." };

  revalidatePath("/admin/modeles");
  redirect(`/admin/modeles/${data.id}`);
}

export async function enregistrerModeleAction(
  id: string,
  champs: { titre: string; description: string; departement: string; contenu: unknown }
): Promise<ResultatModele> {
  const supabase = await creerClientServeur();
  if (!champs.titre.trim()) return { erreur: "Le titre est obligatoire." };
  const { error } = await supabase
    .from("modeles_documents")
    .update({
      titre: champs.titre.trim(),
      description: champs.description.trim() || null,
      departement: champs.departement.trim() || null,
      contenu: champs.contenu,
    })
    .eq("id", id);
  if (error) return { erreur: error.message };
  revalidatePath("/admin/modeles");
  revalidatePath(`/admin/modeles/${id}`);
  return { erreur: null };
}

export async function basculerActifModeleAction(id: string, actif: boolean): Promise<ResultatModele> {
  const supabase = await creerClientServeur();
  const { error } = await supabase.from("modeles_documents").update({ actif }).eq("id", id);
  if (error) return { erreur: error.message };
  revalidatePath("/admin/modeles");
  return { erreur: null };
}

export async function supprimerModeleAction(id: string): Promise<ResultatModele> {
  const supabase = await creerClientServeur();
  const { error } = await supabase.from("modeles_documents").delete().eq("id", id);
  if (error) return { erreur: error.message };
  revalidatePath("/admin/modeles");
  redirect("/admin/modeles");
}
