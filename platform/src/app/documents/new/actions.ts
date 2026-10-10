"use server";

import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import type { ClassificationDocument, Profil } from "@/lib/types";

export type ResultatDepot = { erreur: string | null };

export async function deposerDocumentAction(formData: FormData): Promise<ResultatDepot> {
  const supabase = await creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Session expirée, veuillez vous reconnecter." };

  const { data: profilData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profil = profilData as Profil | null;
  if (!profil || (profil.role !== "redacteur" && profil.role !== "administrateur")) {
    return { erreur: "Seul un rédacteur peut déposer un document." };
  }

  const titre = String(formData.get("titre") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const classification = String(formData.get("classification") ?? "") as ClassificationDocument;
  const fichier = formData.get("fichier") as File | null;

  if (!titre || !classification) return { erreur: "Titre et classification sont obligatoires." };
  if (!fichier || fichier.size === 0) return { erreur: "Un fichier doit être joint au dépôt." };

  // 1. Création de la ligne "documents" à l'état brouillon (policy RLS
  //    "depot_document_par_redacteur" : owner_id doit être l'utilisateur courant).
  const { data: document, error: erreurInsertion } = await supabase
    .from("documents")
    .insert({
      titre,
      description: description || null,
      classification,
      departement: profil.departement,
      owner_id: user.id,
    })
    .select()
    .single();

  if (erreurInsertion || !document) {
    return { erreur: `Échec de la création du document : ${erreurInsertion?.message}` };
  }

  // 2. Dépôt du fichier dans le stockage Supabase, sous "<document_id>/<nom>"
  //    (convention utilisée par les policies RLS sur storage.objects).
  const cheminStockage = `${document.id}/${fichier.name}`;
  const { error: erreurUpload } = await supabase.storage
    .from("documents-ged")
    .upload(cheminStockage, fichier, { contentType: fichier.type || undefined });

  if (erreurUpload) {
    return { erreur: `Fichier non déposé : ${erreurUpload.message}` };
  }

  await supabase.from("documents").update({ storage_path: cheminStockage }).eq("id", document.id);

  redirect(`/documents/${document.id}`);
}
