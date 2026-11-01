"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UUID } from "@/lib/courrier/constantes";
import { cleErreur, texte } from "@/lib/courrier/serveur";
import { creerClientServeur } from "@/lib/supabase/server";

// La base décide (rôle du courrier, échéances, gel) : ces actions relaient la demande de l'agent connecté.
// Détruire = supprimer les scans ; la ligne du registre reste. Les fichiers ne sont effacés du stockage
// qu'APRÈS la validation par la base (la règle de stockage exige qu'ils ne soient plus référencés).

const TYPES = ["courrier", "depart"];

/** Retour sur la fiche de l'élément (arrivée : /courrier/<id>, départ : /courrier/depart/<id>). */
function fiche(type: string, id: string, parametre: "ok" | "erreur", cle: string): never {
  const base = type === "depart" ? `/courrier/depart/${id}` : `/courrier/${id}`;
  revalidatePath(base);
  redirect(`${base}?${parametre}=${cle}#conservation`);
}

export async function classerConservation(d: FormData) {
  const type = texte(d, "type");
  const id = texte(d, "id");
  if (!TYPES.includes(type) || !UUID.test(id)) redirect("/courrier");
  const duree = Number.parseInt(texte(d, "duree", 4), 10);
  const supabase = await creerClientServeur();
  const { error } = await supabase.rpc("classer_conservation", {
    p_type: type,
    p_id: id,
    p_categorie: texte(d, "categorie", 40),
    p_duree: Number.isFinite(duree) ? duree : null,
  });
  if (error) fiche(type, id, "erreur", cleErreur(error));
  fiche(type, id, "ok", "conservation_classee");
}

export async function gelerConservation(d: FormData) {
  const type = texte(d, "type");
  const id = texte(d, "id");
  if (!TYPES.includes(type) || !UUID.test(id)) redirect("/courrier");
  const supabase = await creerClientServeur();
  const { error } = await supabase.rpc("geler_conservation", { p_type: type, p_id: id, p_motif: texte(d, "motif") });
  if (error) fiche(type, id, "erreur", cleErreur(error));
  fiche(type, id, "ok", "conservation_gelee");
}

export async function degelerConservation(d: FormData) {
  const type = texte(d, "type");
  const id = texte(d, "id");
  if (!TYPES.includes(type) || !UUID.test(id)) redirect("/courrier");
  const supabase = await creerClientServeur();
  const { error } = await supabase.rpc("degeler_conservation", { p_type: type, p_id: id });
  if (error) fiche(type, id, "erreur", cleErreur(error));
  fiche(type, id, "ok", "conservation_degelee");
}

/** Valide le sort final des éléments cochés (destruction des scans ou versement), puis efface les fichiers détachés. */
export async function validerSortFinal(d: FormData) {
  const type = texte(d, "type");
  const sort = texte(d, "sort");
  const ids = [...new Set(d.getAll("ids").map(String))].filter((i) => UUID.test(i)).slice(0, 200);
  if (!TYPES.includes(type)) redirect("/courrier/conservation");
  if (ids.length === 0) redirect("/courrier/conservation?erreur=choix");
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.rpc("valider_sort_final", { p_type: type, p_ids: ids, p_motif: texte(d, "motif") });
  if (error) redirect(`/courrier/conservation?erreur=${cleErreur(error)}`);
  const chemins = ((data ?? []) as { chemin: string }[]).map((x) => x.chemin);
  // La base a détaché les pièces ; le fichier n'est plus référencé, le chef du courrier peut l'effacer.
  if (chemins.length > 0) await supabase.storage.from("courrier").remove(chemins);
  revalidatePath("/courrier/conservation");
  redirect(`/courrier/conservation?ok=${sort === "versement" ? "verse" : "detruit"}`);
}
