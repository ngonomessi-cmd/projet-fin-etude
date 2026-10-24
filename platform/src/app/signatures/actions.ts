"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { traductionServeur } from "@/lib/i18n/serveur";
import { traduireErreur } from "@/lib/i18n/erreurs";
import { verifierCodeSignature } from "@/lib/signature/mfa";
import { nettoyerSpecimen } from "@/lib/signature/specimen";
import { BUCKET_SIGNATURES } from "@/lib/signature/produire";

export type ResultatAction = { erreur: string | null; succes?: string };

const TAILLE_MAX_IMAGE = 2 * 1024 * 1024;

// Image de la signature : tracée à l'écran ou photo/scan d'une signature sur
// papier. Code Google Authenticator exigé ; l'image est nettoyée et
// réencodée par le serveur avant d'être rangée dans le bucket privé.
export async function definirSpecimenAction(formData: FormData): Promise<ResultatAction> {
  const supabase = await creerClientServeur();
  const { t, langue } = await traductionServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: t("Session expirée, veuillez vous reconnecter.", "Session expired, please sign in again.") };

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) return { erreur: t("Aucune image reçue.", "No image received.") };
  if (image.size > TAILLE_MAX_IMAGE) return { erreur: t("Image trop volumineuse (2 Mo au plus).", "Image too large (2 MB at most).") };

  const erreurCode = await verifierCodeSignature(supabase, String(formData.get("code") ?? "").trim(), t);
  if (erreurCode) return { erreur: erreurCode };

  let specimen;
  try {
    specimen = await nettoyerSpecimen(Buffer.from(await image.arrayBuffer()));
  } catch {
    return { erreur: t("Image illisible : envoyez une photo ou un scan (PNG, JPEG).", "Unreadable image: send a photo or scan (PNG, JPEG).") };
  }
  if (!specimen) {
    return {
      erreur: t(
        "Aucun tracé de signature n'a été trouvé sur l'image (fond trop sombre ou image vide).",
        "No signature stroke was found in the image (background too dark or empty image)."
      ),
    };
  }

  const admin = creerClientAdmin();
  const chemin = `specimens/${user.id}/${randomUUID()}.png`;
  const { error: erreurDepot } = await admin.storage
    .from(BUCKET_SIGNATURES)
    .upload(chemin, specimen.png, { contentType: "image/png", upsert: false });
  if (erreurDepot) return { erreur: t("Enregistrement de l'image impossible.", "Could not save the image.") };

  const { data: ancien, error } = await supabase.rpc("specimen_definir", {
    p_chemin: chemin,
    p_largeur: specimen.largeur,
    p_hauteur: specimen.hauteur,
  });
  if (error) {
    await admin.storage.from(BUCKET_SIGNATURES).remove([chemin]);
    return { erreur: traduireErreur(error.message, langue) };
  }
  if (typeof ancien === "string" && ancien) await admin.storage.from(BUCKET_SIGNATURES).remove([ancien]);

  revalidatePath("/signatures");
  return { erreur: null, succes: t("Signature enregistrée.", "Signature saved.") };
}

export async function designerTitulaireAction(qualite: string, profilId: string | null): Promise<ResultatAction> {
  const supabase = await creerClientServeur();
  const { t, langue } = await traductionServeur();
  const { error } = await supabase.rpc("designer_titulaire_signature", { p_qualite: qualite, p_profil_id: profilId || null });
  if (error) return { erreur: traduireErreur(error.message, langue) };
  revalidatePath("/signatures");
  return { erreur: null, succes: profilId ? t("Titulaire désigné.", "Holder appointed.") : t("Qualité laissée vacante.", "Capacity left vacant.") };
}

export async function deleguerSignatureAction(formData: FormData): Promise<ResultatAction> {
  const supabase = await creerClientServeur();
  const { t, langue } = await traductionServeur();
  const date = (nom: string, finDeJournee = false) => {
    const v = String(formData.get(nom) ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    // Dates saisies en heure de Douala (UTC+1).
    return new Date(`${v}T${finDeJournee ? "23:59:59" : "00:00:00"}+01:00`).toISOString();
  };
  const debut = date("debut");
  const fin = date("fin", true);
  if (!debut || !fin) return { erreur: t("Indiquez les dates de début et de fin.", "Enter the start and end dates.") };
  const maintenant = new Date().toISOString();

  const { error } = await supabase.rpc("deleguer_signature", {
    p_qualite: String(formData.get("qualite") ?? ""),
    p_delegataire_id: String(formData.get("delegataire") ?? ""),
    p_titre_delegataire: String(formData.get("titre") ?? ""),
    p_debut: debut < maintenant ? maintenant : debut,
    p_fin: fin,
    p_objet: String(formData.get("objet") ?? ""),
    p_reference_acte: String(formData.get("reference_acte") ?? ""),
  });
  if (error) return { erreur: traduireErreur(error.message, langue) };
  revalidatePath("/signatures");
  return { erreur: null, succes: t("Délégation enregistrée.", "Delegation recorded.") };
}

export async function revoquerDelegationAction(delegationId: string, motif: string): Promise<ResultatAction> {
  const supabase = await creerClientServeur();
  const { t, langue } = await traductionServeur();
  const { error } = await supabase.rpc("revoquer_delegation_signature", { p_delegation_id: delegationId, p_motif: motif });
  if (error) return { erreur: traduireErreur(error.message, langue) };
  revalidatePath("/signatures");
  return { erreur: null, succes: t("Délégation révoquée.", "Delegation revoked.") };
}
