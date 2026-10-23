"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import type { StatutActualite } from "@/lib/types";

export type ResultatActualite = { erreur: string | null };

function genererSlug(titre: string): string {
  return titre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function creerActualiteAction(formData: FormData): Promise<ResultatActualite> {
  const supabase = await creerClientServeur();

  const titre = String(formData.get("titre") ?? "").trim();
  const extrait = String(formData.get("extrait") ?? "").trim();
  const contenu = String(formData.get("contenu") ?? "").trim();
  const statut = String(formData.get("statut") ?? "brouillon") as StatutActualite;

  if (!titre) return { erreur: "Le titre est obligatoire." };
  if (!contenu) return { erreur: "Le contenu est obligatoire." };

  const slugBase = genererSlug(titre) || "actualite";
  let slug = slugBase;
  let tentative = 1;
  let idCree: string | null = null;

  // Un même titre peut déjà exister (brouillon précédent, essai renommé...) :
  // on ajoute un suffixe numérique jusqu'à trouver un slug libre dans cette
  // organisation (contrainte unique (organisation, slug), migration 0019).
  while (tentative <= 20) {
    const { data, error } = await supabase
      .from("actualites_publiques")
      .insert({ titre, slug, extrait: extrait || null, contenu, statut })
      .select("id")
      .single();

    if (!error && data) {
      idCree = data.id;
      break;
    }
    if (error && error.code === "23505") {
      tentative += 1;
      slug = `${slugBase}-${tentative}`;
      continue;
    }
    return { erreur: error?.message ?? "Échec de la création." };
  }

  if (!idCree) return { erreur: "Impossible de générer une adresse unique pour cet article." };

  revalidatePath("/admin/actualites");
  revalidatePath("/actualites");
  redirect(`/admin/actualites/${idCree}`);
}

export async function modifierActualiteAction(id: string, formData: FormData): Promise<ResultatActualite> {
  const supabase = await creerClientServeur();

  const titre = String(formData.get("titre") ?? "").trim();
  const extrait = String(formData.get("extrait") ?? "").trim();
  const contenu = String(formData.get("contenu") ?? "").trim();
  const statut = String(formData.get("statut") ?? "brouillon") as StatutActualite;

  if (!titre) return { erreur: "Le titre est obligatoire." };
  if (!contenu) return { erreur: "Le contenu est obligatoire." };

  const { error } = await supabase
    .from("actualites_publiques")
    .update({ titre, extrait: extrait || null, contenu, statut })
    .eq("id", id);

  if (error) return { erreur: error.message };

  revalidatePath("/admin/actualites");
  revalidatePath(`/admin/actualites/${id}`);
  revalidatePath("/actualites");
  return { erreur: null };
}

export async function supprimerActualiteAction(id: string): Promise<ResultatActualite> {
  const supabase = await creerClientServeur();

  const { error } = await supabase.from("actualites_publiques").delete().eq("id", id);
  if (error) return { erreur: error.message };

  revalidatePath("/admin/actualites");
  revalidatePath("/actualites");
  redirect("/admin/actualites");
}
