"use server";

import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import type { ClassificationDocument, FormatAtelier, NatureDocument, Profil } from "@/lib/types";
import { NATURES, ROLES_PRODUCTEURS } from "@/lib/labels";
import { contenuVide } from "@/lib/atelier/contenus";

export type ResultatDepot = { erreur: string | null };

function lireNature(formData: FormData): NatureDocument | null {
  const nature = String(formData.get("nature") ?? "") as NatureDocument;
  return NATURES.includes(nature) ? nature : null;
}

export async function deposerDocumentAction(formData: FormData): Promise<ResultatDepot> {
  const supabase = await creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Session expirée, veuillez vous reconnecter." };

  const { data: profilData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profil = profilData as Profil | null;
  if (!profil || !ROLES_PRODUCTEURS.includes(profil.role)) {
    return { erreur: "Votre rôle ne permet pas de créer un document (rédacteur, validateur ou administrateur)." };
  }

  const titre = String(formData.get("titre") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const classification = String(formData.get("classification") ?? "") as ClassificationDocument;
  const fichier = formData.get("fichier") as File | null;
  const nature = lireNature(formData);

  if (!titre || !classification) return { erreur: "Titre et classification sont obligatoires." };
  if (!nature) return { erreur: "Choisissez la nature du document." };
  if (!fichier || fichier.size === 0) return { erreur: "Un fichier doit être joint au dépôt." };

  // 1. Création de la ligne "documents" à l'état brouillon (policy RLS
  //    "depot_document_par_redacteur" : owner_id doit être l'utilisateur courant).
  const { data: document, error: erreurInsertion } = await supabase
    .from("documents")
    .insert({
      titre,
      description: description || null,
      classification,
      nature,
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

// Création d'un document rédigé dans la plateforme (Word / Excel /
// PowerPoint), vierge ou à partir d'un modèle de la bibliothèque.
export async function creerDocumentAtelierAction(formData: FormData): Promise<ResultatDepot> {
  const supabase = await creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: "Session expirée, veuillez vous reconnecter." };

  const { data: profilData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profil = profilData as Profil | null;
  if (!profil || !ROLES_PRODUCTEURS.includes(profil.role)) {
    return { erreur: "Votre rôle ne permet pas de créer un document (rédacteur, validateur ou administrateur)." };
  }

  const titre = String(formData.get("titre") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const classification = String(formData.get("classification") ?? "") as ClassificationDocument;
  const format = String(formData.get("format") ?? "") as FormatAtelier;
  const modeleId = String(formData.get("modele_id") ?? "");
  const nature = lireNature(formData);

  if (!titre || !classification) return { erreur: "Titre et classification sont obligatoires." };
  if (!nature) return { erreur: "Choisissez la nature du document." };
  if (!["texte", "tableur", "presentation"].includes(format)) return { erreur: "Choisissez un type de document." };

  let contenu: unknown = contenuVide(format);
  if (modeleId) {
    // Lecture soumise à RLS : seul un modèle proposé à ce compte est utilisable.
    const { data: modele } = await supabase.from("modeles_documents").select("format, contenu").eq("id", modeleId).maybeSingle();
    if (!modele || modele.format !== format) return { erreur: "Modèle introuvable." };
    contenu = modele.contenu;
  }

  const { data: document, error } = await supabase
    .from("documents")
    .insert({
      titre,
      description: description || null,
      classification,
      nature,
      departement: profil.departement,
      owner_id: user.id,
      format_atelier: format,
      contenu,
    })
    .select("id")
    .single();

  if (error || !document) return { erreur: `Échec de la création du document : ${error?.message}` };

  await supabase.from("audit_log").insert({
    document_id: document.id,
    acteur_id: user.id,
    action: "creation_atelier",
    details: { format, modele: modeleId || null },
  });

  redirect(`/documents/${document.id}/editer`);
}
