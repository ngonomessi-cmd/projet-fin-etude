"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { genererPdfDocument } from "@/lib/pdf";
import { LABEL_CLASSIFICATION } from "@/lib/labels";
import { NOM_ORGANISATION } from "@/lib/organisation";
import type { Document, Profil } from "@/lib/types";

export type ResultatGenerationFichiers = { erreur: string | null; genere: number };

// Dépose un fichier PDF généré localement (cf. lib/pdf.ts) pour chaque
// document qui n'en a encore aucun — en pratique les documents fictifs de
// la migration 0016, qui n'existaient qu'en base, sans passer par le
// formulaire de dépôt habituel. Réservé à l'administrateur : seul rôle
// autorisé, par la policy RLS "depot_fichier_par_administrateur_si_absent"
// (migration 0017), à déposer un fichier pour un document dont il n'est pas
// l'auteur.
export async function genererFichiersDocumentsFictifsAction(): Promise<ResultatGenerationFichiers> {
  const supabase = await creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Session expirée, veuillez vous reconnecter.", genere: 0 };

  const { data: profilData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profil = profilData as Profil | null;
  if (!profil || profil.role !== "administrateur") {
    return { erreur: "Réservé à l'administrateur.", genere: 0 };
  }

  const { data: documentsData, error: erreurLecture } = await supabase
    .from("documents")
    .select("*")
    .is("storage_path", null);
  if (erreurLecture) return { erreur: erreurLecture.message, genere: 0 };

  const documents = (documentsData ?? []) as Document[];
  let genere = 0;

  for (const document of documents) {
    const pdf = genererPdfDocument({
      titre: document.titre,
      soustitre: `${LABEL_CLASSIFICATION[document.classification]} - ${document.departement} - ${NOM_ORGANISATION}`,
      paragraphes: [document.description ?? "Document sans description."],
    });

    const cheminStockage = `${document.id}/document.pdf`;
    const { error: erreurUpload } = await supabase.storage
      .from("documents-ged")
      .upload(cheminStockage, pdf, { contentType: "application/pdf" });
    if (erreurUpload) continue;

    const { error: erreurMaj } = await supabase
      .from("documents")
      .update({ storage_path: cheminStockage })
      .eq("id", document.id);
    if (!erreurMaj) genere += 1;
  }

  revalidatePath("/documents");
  return { erreur: null, genere };
}
