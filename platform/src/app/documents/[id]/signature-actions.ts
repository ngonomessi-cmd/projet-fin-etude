"use server";

import { revalidatePath } from "next/cache";
import { creerClientServeur } from "@/lib/supabase/server";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { traductionServeur } from "@/lib/i18n/serveur";
import { traduireErreur } from "@/lib/i18n/erreurs";
import { origineDuSite } from "@/lib/site";
import { analyserPieceJointe } from "@/lib/messagerie/antivirus";
import { urlVerification } from "@/lib/signature/commun";
import { verifierCodeSignature } from "@/lib/signature/mfa";
import { BUCKET_SIGNATURES, TAILLE_MAX_ORIGINAL, empreinteSha256, produirePdfSigne } from "@/lib/signature/produire";
import type { SignaturePdf } from "@/lib/signature/bloc";
import type { Langue } from "@/lib/i18n/plateforme";

export type ResultatSignature = { erreur: string | null; succes?: string };

type Preparation = {
  id: string;
  numero: string;
  code: string;
  intitule: string;
  intitule_en: string;
  titre_delegataire: string | null;
  signataire_nom: string | null;
};

// Production du PDF, dépôt dans le bucket privé et scellement au registre,
// avec la clé de service. Toute erreur abandonne le numéro (jamais effacé).
async function produireEtSceller(
  documentId: string,
  prep: Preparation,
  nature: "electronique" | "manuscrite",
  langue: Langue,
  signataireId: string | null
): Promise<boolean> {
  const admin = creerClientAdmin();
  try {
    let specimen: SignaturePdf["specimen"] = null;
    if (nature === "electronique" && signataireId) {
      const { data: ligne } = await admin.from("specimens_signature").select("chemin, largeur, hauteur").eq("profil_id", signataireId).single();
      if (!ligne) throw new Error("Spécimen introuvable.");
      const { data: image, error } = await admin.storage.from(BUCKET_SIGNATURES).download(ligne.chemin);
      if (error || !image) throw new Error("Spécimen illisible.");
      specimen = { png: Buffer.from(await image.arrayBuffer()), largeur: ligne.largeur, hauteur: ligne.hauteur };
    }

    const pdf = await produirePdfSigne(admin, documentId, {
      nature,
      numero: prep.numero,
      code: prep.code,
      url: urlVerification(await origineDuSite(), prep.code),
      langue,
      intitule: prep.intitule,
      intitule_en: prep.intitule_en,
      titre_delegataire: prep.titre_delegataire,
      signataireNom: prep.signataire_nom,
      specimen,
      signeLe: new Date(),
    });

    const chemin = `${nature === "electronique" ? "electroniques" : "bat"}/${prep.id}.pdf`;
    const { error: erreurDepot } = await admin.storage
      .from(BUCKET_SIGNATURES)
      .upload(chemin, pdf, { contentType: "application/pdf", upsert: false });
    if (erreurDepot) throw new Error(erreurDepot.message);

    const { error: erreurScellement } = await admin.rpc("signature_sceller", {
      p_signature_id: prep.id,
      p_chemin: chemin,
      p_empreinte: empreinteSha256(pdf),
    });
    if (erreurScellement) throw new Error(erreurScellement.message);
    return true;
  } catch (e) {
    console.error("Signature : production impossible", prep.numero, e);
    await admin.rpc("signature_abandonner", { p_signature_id: prep.id });
    return false;
  }
}

export async function signerElectroniquementAction(documentId: string, qualite: string, code: string): Promise<ResultatSignature> {
  const supabase = await creerClientServeur();
  const { t, langue } = await traductionServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: t("Session expirée, veuillez vous reconnecter.", "Session expired, please sign in again.") };

  const erreurCode = await verifierCodeSignature(supabase, code.trim(), t);
  if (erreurCode) return { erreur: erreurCode };

  const { data, error } = await supabase.rpc("signer_preparer", { p_document_id: documentId, p_qualite: qualite, p_langue: langue });
  if (error || !data) return { erreur: traduireErreur(error?.message ?? "", langue) };
  const prep = data as Preparation;

  if (!(await produireEtSceller(documentId, prep, "electronique", langue, user.id))) {
    return {
      erreur: t(
        `La production du document signé a échoué : rien n'a été signé (le numéro ${prep.numero} est marqué abandonné). Réessayez.`,
        `Producing the signed document failed: nothing was signed (number ${prep.numero} is marked abandoned). Try again.`
      ),
    };
  }
  revalidatePath(`/documents/${documentId}`);
  return { erreur: null, succes: t(`Document signé : n° ${prep.numero}.`, `Document signed: No. ${prep.numero}.`) };
}

export async function preparerBonASignerAction(documentId: string, qualite: string): Promise<ResultatSignature> {
  const supabase = await creerClientServeur();
  const { t, langue } = await traductionServeur();
  const { data, error } = await supabase.rpc("bon_a_signer", { p_document_id: documentId, p_qualite: qualite, p_langue: langue });
  if (error || !data) return { erreur: traduireErreur(error?.message ?? "", langue) };
  const prep = data as Preparation;

  if (!(await produireEtSceller(documentId, prep, "manuscrite", langue, null))) {
    return {
      erreur: t(
        `La production du bon à signer a échoué (le numéro ${prep.numero} est marqué abandonné). Réessayez.`,
        `Producing the print-for-signature copy failed (number ${prep.numero} is marked abandoned). Try again.`
      ),
    };
  }
  revalidatePath(`/documents/${documentId}`);
  return {
    erreur: null,
    succes: t(
      `Bon à signer n° ${prep.numero} prêt : imprimez-le, faites-le signer et cacheter, puis déposez le scan.`,
      `Print-for-signature copy No. ${prep.numero} ready: print it, have it signed and stamped, then upload the scan.`
    ),
  };
}

// Le navigateur a déposé le scan dans signatures/originaux/<signature>/ (règle
// de stockage original_peut_deposer) ; le serveur le contrôle avant de
// l'enregistrer comme original. Un fichier refusé est retiré du stockage.
export async function enregistrerOriginalAction(
  documentId: string,
  signatureId: string,
  chemin: string,
  motif: string
): Promise<ResultatSignature> {
  const supabase = await creerClientServeur();
  const { t, langue } = await traductionServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erreur: t("Session expirée, veuillez vous reconnecter.", "Session expired, please sign in again.") };

  const { data: autorise } = await supabase.rpc("original_peut_deposer", { p_signature_id: signatureId });
  if (autorise !== true || !chemin.startsWith(`originaux/${signatureId}/`)) {
    return { erreur: t("Dépôt non autorisé.", "Upload not allowed.") };
  }

  const admin = creerClientAdmin();
  const retirer = () => admin.storage.from(BUCKET_SIGNATURES).remove([chemin]);
  const { data: fichier, error } = await admin.storage.from(BUCKET_SIGNATURES).download(chemin);
  if (error || !fichier) return { erreur: t("Fichier déposé introuvable.", "Uploaded file not found.") };
  const contenu = Buffer.from(await fichier.arrayBuffer());

  if (contenu.length > TAILLE_MAX_ORIGINAL) {
    await retirer();
    return { erreur: t("Fichier trop volumineux (15 Mo au plus).", "File too large (15 MB at most).") };
  }
  if (contenu.subarray(0, 5).toString("latin1") !== "%PDF-") {
    await retirer();
    return { erreur: t("Le scan doit être un fichier PDF.", "The scan must be a PDF file.") };
  }
  const analyse = await analyserPieceJointe(contenu, "original.pdf", "application/pdf");
  if (!analyse.propre) {
    await retirer();
    return { erreur: traduireErreur(analyse.motif ?? "Fichier refusé.", langue) };
  }

  const { error: erreurEnregistrement } = await admin.rpc("original_enregistrer", {
    p_signature_id: signatureId,
    p_chemin: chemin,
    p_empreinte: empreinteSha256(contenu),
    p_agent: user.id,
    p_motif: motif.trim() || null,
  });
  if (erreurEnregistrement) {
    await retirer();
    return { erreur: traduireErreur(erreurEnregistrement.message, langue) };
  }
  revalidatePath(`/documents/${documentId}`);
  return { erreur: null, succes: t("Original signé enregistré : la signature est valide.", "Signed original recorded: the signature is valid.") };
}

export async function revoquerSignatureAction(documentId: string, signatureId: string, motif: string): Promise<ResultatSignature> {
  const supabase = await creerClientServeur();
  const { t, langue } = await traductionServeur();
  const { error } = await supabase.rpc("signature_revoquer", { p_signature_id: signatureId, p_motif: motif });
  if (error) return { erreur: traduireErreur(error.message, langue) };
  revalidatePath(`/documents/${documentId}`);
  return { erreur: null, succes: t("Signature révoquée.", "Signature revoked.") };
}
