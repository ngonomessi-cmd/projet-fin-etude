"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { NATURES } from "@/lib/labels";
import { traductionServeur } from "@/lib/i18n/serveur";
import { langueServeur } from "@/lib/i18n/serveur";
import { traduireErreur } from "@/lib/i18n/erreurs";

export type ResultatParametres = { erreur: string | null; ok?: boolean };

// Les contrôles (administrateur, bornes, natures connues) sont refaits par
// la fonction definir_parametres_archivage (migration 0024).
export async function enregistrerParametresArchivageAction(formData: FormData): Promise<ResultatParametres> {
  const supabase = await creerClientServeur();
  const { t } = await traductionServeur();
  const delai = Number(formData.get("delai"));
  const durees: Record<string, number> = {};
  for (const nature of NATURES) {
    const valeur = Number(formData.get(`duree_${nature}`));
    if (!Number.isInteger(valeur) || valeur < 0 || valeur > 100) {
      return { erreur: t("Chaque durée doit être un nombre entier d'années entre 0 et 100.", "Each period must be a whole number of years between 0 and 100.") };
    }
    durees[nature] = valeur;
  }
  if (!Number.isInteger(delai) || delai < 0 || delai > 120) {
    return { erreur: t("Le délai doit être un nombre entier de mois entre 0 et 120.", "The delay must be a whole number of months between 0 and 120.") };
  }

  const { error } = await supabase.rpc("definir_parametres_archivage", { p_delai_mois: delai, p_durees: durees });
  if (error) return { erreur: traduireErreur(error.message, await langueServeur()) };
  revalidatePath("/admin/archivage");
  return { erreur: null, ok: true };
}
