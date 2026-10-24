"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import type { StatutActualite } from "@/lib/types";
import { IMAGES_ACTUALITES } from "@/lib/images-actualites";
import { langueServeur } from "@/lib/i18n/serveur";
import { traducteur } from "@/lib/i18n/plateforme";
import { traduireErreur } from "@/lib/i18n/erreurs";

// Messages renvoyés à l'interface dans la langue de la personne connectée.
const T = async (fr: string, en: string) => traducteur(await langueServeur())(fr, en);
const E = async (message: string) => traduireErreur(message, await langueServeur());

function lireImage(formData: FormData): string | null {
  const url = String(formData.get("image_url") ?? "");
  return IMAGES_ACTUALITES.some((i) => i.url === url) ? url : null;
}

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
  const titreEn = String(formData.get("titre_en") ?? "").trim();
  const extrait = String(formData.get("extrait") ?? "").trim();
  const extraitEn = String(formData.get("extrait_en") ?? "").trim();
  const contenu = String(formData.get("contenu") ?? "").trim();
  const contenuEn = String(formData.get("contenu_en") ?? "").trim();
  const statut = String(formData.get("statut") ?? "brouillon") as StatutActualite;

  if (!titre) return { erreur: await T("Le titre est obligatoire.", "The title is required.") };
  if (!contenu) return { erreur: await T("Le contenu est obligatoire.", "The content is required.") };

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
      .insert({
        titre,
        titre_en: titreEn || null,
        slug,
        extrait: extrait || null,
        extrait_en: extraitEn || null,
        contenu,
        contenu_en: contenuEn || null,
        image_url: lireImage(formData),
        statut,
      })
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
    return { erreur: error ? await E(error.message) : await T("Échec de la création.", "Creation failed.") };
  }

  if (!idCree) return { erreur: await T("Impossible de générer une adresse unique pour cet article.", "Could not generate a unique address for this article.") };

  revalidatePath("/admin/actualites");
  revalidatePath("/actualites");
  redirect(`/admin/actualites/${idCree}`);
}

export async function modifierActualiteAction(id: string, formData: FormData): Promise<ResultatActualite> {
  const supabase = await creerClientServeur();

  const titre = String(formData.get("titre") ?? "").trim();
  const titreEn = String(formData.get("titre_en") ?? "").trim();
  const extrait = String(formData.get("extrait") ?? "").trim();
  const extraitEn = String(formData.get("extrait_en") ?? "").trim();
  const contenu = String(formData.get("contenu") ?? "").trim();
  const contenuEn = String(formData.get("contenu_en") ?? "").trim();
  const statut = String(formData.get("statut") ?? "brouillon") as StatutActualite;

  if (!titre) return { erreur: await T("Le titre est obligatoire.", "The title is required.") };
  if (!contenu) return { erreur: await T("Le contenu est obligatoire.", "The content is required.") };

  const { error } = await supabase
    .from("actualites_publiques")
    .update({
      titre,
      titre_en: titreEn || null,
      extrait: extrait || null,
      extrait_en: extraitEn || null,
      contenu,
      contenu_en: contenuEn || null,
        image_url: lireImage(formData),
      statut,
    })
    .eq("id", id);

  if (error) return { erreur: await E(error.message) };

  revalidatePath("/admin/actualites");
  revalidatePath(`/admin/actualites/${id}`);
  revalidatePath("/actualites");
  return { erreur: null };
}

export async function supprimerActualiteAction(id: string): Promise<ResultatActualite> {
  const supabase = await creerClientServeur();

  const { error } = await supabase.from("actualites_publiques").delete().eq("id", id);
  if (error) return { erreur: await E(error.message) };

  revalidatePath("/admin/actualites");
  revalidatePath("/actualites");
  redirect("/admin/actualites");
}
