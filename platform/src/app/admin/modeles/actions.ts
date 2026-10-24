"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { contenuVide } from "@/lib/atelier/contenus";
import type { FormatAtelier } from "@/lib/types";
import { langueServeur } from "@/lib/i18n/serveur";
import { traducteur } from "@/lib/i18n/plateforme";
import { traduireErreur } from "@/lib/i18n/erreurs";

// Messages renvoyés à l'interface dans la langue de la personne connectée.
const T = async (fr: string, en: string) => traducteur(await langueServeur())(fr, en);
const E = async (message: string) => traduireErreur(message, await langueServeur());

export type ResultatModele = { erreur: string | null };

export async function creerModeleAction(formData: FormData): Promise<ResultatModele> {
  const supabase = await creerClientServeur();
  const titre = String(formData.get("titre") ?? "").trim();
  const format = String(formData.get("format") ?? "") as FormatAtelier;
  const depuis = String(formData.get("depuis") ?? "");
  let langue: "fr" | "en" = formData.get("langue") === "en" ? "en" : formData.get("langue") === "fr" ? "fr" : await langueServeur();

  let contenu: unknown = contenuVide(format);
  let description: string | null = null;
  if (depuis) {
    const { data: source } = await supabase.from("modeles_documents").select("*").eq("id", depuis).maybeSingle();
    if (!source) return { erreur: await T("Modèle d'origine introuvable.", "Source template not found.") };
    contenu = source.contenu;
    description = source.description;
    langue = source.langue === "en" ? "en" : "fr";
  }
  if (!titre) return { erreur: await T("Le titre est obligatoire.", "The title is required.") };
  if (!["texte", "tableur", "presentation"].includes(format)) return { erreur: await T("Type de modèle inconnu.", "Unknown template format.") };

  // L'organisation et l'auteur sont posés par la base (déclencheur), jamais par le client.
  const { data, error } = await supabase
    .from("modeles_documents")
    .insert({ titre, format, contenu, description, langue })
    .select("id")
    .single();
  if (error || !data) return { erreur: error ? await E(error.message) : await T("Création impossible.", "Could not create it.") };

  revalidatePath("/admin/modeles");
  redirect(`/admin/modeles/${data.id}`);
}

export async function enregistrerModeleAction(
  id: string,
  champs: { titre: string; description: string; departement: string; langue: "fr" | "en"; contenu: unknown }
): Promise<ResultatModele> {
  const supabase = await creerClientServeur();
  if (!champs.titre.trim()) return { erreur: await T("Le titre est obligatoire.", "The title is required.") };
  const { error } = await supabase
    .from("modeles_documents")
    .update({
      titre: champs.titre.trim(),
      description: champs.description.trim() || null,
      departement: champs.departement.trim() || null,
      langue: champs.langue === "en" ? "en" : "fr",
      contenu: champs.contenu,
    })
    .eq("id", id);
  if (error) return { erreur: await E(error.message) };
  revalidatePath("/admin/modeles");
  revalidatePath(`/admin/modeles/${id}`);
  return { erreur: null };
}

export async function basculerActifModeleAction(id: string, actif: boolean): Promise<ResultatModele> {
  const supabase = await creerClientServeur();
  const { error } = await supabase.from("modeles_documents").update({ actif }).eq("id", id);
  if (error) return { erreur: await E(error.message) };
  revalidatePath("/admin/modeles");
  return { erreur: null };
}

export async function supprimerModeleAction(id: string): Promise<ResultatModele> {
  const supabase = await creerClientServeur();
  const { error } = await supabase.from("modeles_documents").delete().eq("id", id);
  if (error) return { erreur: await E(error.message) };
  revalidatePath("/admin/modeles");
  redirect("/admin/modeles");
}
