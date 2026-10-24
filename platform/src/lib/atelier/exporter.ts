import type { Document } from "@/lib/types";
import { LABEL_CLASSIFICATION } from "@/lib/labels";
import { NOM_ORGANISATION } from "@/lib/organisation";
import { EXTENSION_FORMAT } from "@/lib/atelier/contenus";
import type { EnTetePdf } from "@/lib/atelier/pdf";

export type FichierExporte = { tampon: Buffer; nomFichier: string; typeMime: string };

const MIME = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  pdf: "application/pdf",
} as const;

export function nomDeFichier(titre: string, extension: string): string {
  const base =
    titre
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9 _-]+/g, " ")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80) || "document";
  return `${base}.${extension}`;
}

// Fichier Office natif (.docx / .xlsx / .pptx) ou PDF, généré à la volée
// depuis le contenu édité dans la plateforme : il n'existe jamais de copie
// stockée qui pourrait diverger du document ou échapper à ses droits d'accès.
export async function exporterDocument(doc: Document, cible: "natif" | "pdf"): Promise<FichierExporte> {
  if (!doc.format_atelier) throw new Error("Ce document n'a pas été rédigé dans la plateforme.");
  const entete: EnTetePdf = {
    titre: doc.titre,
    organisation: NOM_ORGANISATION,
    classification: LABEL_CLASSIFICATION[doc.classification],
  };

  if (cible === "pdf") {
    const tampon =
      doc.format_atelier === "texte"
        ? await (await import("@/lib/atelier/export-texte")).genererPdfTexte(doc.contenu, entete)
        : doc.format_atelier === "tableur"
          ? await (await import("@/lib/atelier/export-tableur")).genererPdfTableur(doc.contenu, entete)
          : await (await import("@/lib/atelier/export-presentation")).genererPdfPresentation(doc.contenu, entete);
    return { tampon, nomFichier: nomDeFichier(doc.titre, "pdf"), typeMime: MIME.pdf };
  }

  const extension = EXTENSION_FORMAT[doc.format_atelier];
  const tampon =
    doc.format_atelier === "texte"
      ? await (await import("@/lib/atelier/export-texte")).genererDocx(doc.contenu, entete)
      : doc.format_atelier === "tableur"
        ? await (await import("@/lib/atelier/export-tableur")).genererXlsx(doc.contenu, entete)
        : await (await import("@/lib/atelier/export-presentation")).genererPptx(doc.contenu, entete);
  return { tampon, nomFichier: nomDeFichier(doc.titre, extension), typeMime: MIME[extension] };
}
