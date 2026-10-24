"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { langueServeur } from "@/lib/i18n/serveur";
import { traduireErreur } from "@/lib/i18n/erreurs";

// Erreurs de la base dans la langue de la personne connectée.
const E = async (message: string) => traduireErreur(message, await langueServeur());

export async function basculerTraiteAction(id: string, traite: boolean): Promise<{ erreur: string | null }> {
  const supabase = await creerClientServeur();
  const { error } = await supabase.from("messages_contact").update({ traite }).eq("id", id);
  if (error) return { erreur: await E(error.message) };
  revalidatePath("/admin/messages-contact");
  return { erreur: null };
}

export async function supprimerMessageContactAction(id: string): Promise<{ erreur: string | null }> {
  const supabase = await creerClientServeur();
  const { error } = await supabase.from("messages_contact").delete().eq("id", id);
  if (error) return { erreur: await E(error.message) };
  revalidatePath("/admin/messages-contact");
  return { erreur: null };
}
