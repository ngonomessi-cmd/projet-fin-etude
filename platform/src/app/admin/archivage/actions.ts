"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { NATURES } from "@/lib/labels";

export type ResultatParametres = { erreur: string | null; ok?: boolean };

// Les contrôles (administrateur, bornes, natures connues) sont refaits par
// la fonction definir_parametres_archivage (migration 0024).
export async function enregistrerParametresArchivageAction(formData: FormData): Promise<ResultatParametres> {
  const supabase = await creerClientServeur();
  const delai = Number(formData.get("delai"));
  const durees: Record<string, number> = {};
  for (const nature of NATURES) {
    const valeur = Number(formData.get(`duree_${nature}`));
    if (!Number.isInteger(valeur) || valeur < 0 || valeur > 100) {
      return { erreur: "Chaque durée doit être un nombre entier d'années entre 0 et 100." };
    }
    durees[nature] = valeur;
  }
  if (!Number.isInteger(delai) || delai < 0 || delai > 120) {
    return { erreur: "Le délai doit être un nombre entier de mois entre 0 et 120." };
  }

  const { error } = await supabase.rpc("definir_parametres_archivage", { p_delai_mois: delai, p_durees: durees });
  if (error) return { erreur: error.message };
  revalidatePath("/admin/archivage");
  return { erreur: null, ok: true };
}
