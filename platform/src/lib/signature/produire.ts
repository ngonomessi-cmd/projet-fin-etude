import { createHash } from "node:crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Content } from "pdfmake/interfaces";
import type { Document } from "@/lib/types";
import { libelles } from "@/lib/labels";
import { nomOrganisation } from "@/lib/organisation";
import { exporterDocument } from "@/lib/atelier/exporter";
import { genererPdf } from "@/lib/atelier/pdf";
import { chargerLogo } from "@/lib/atelier/logo";
import type { SignaturePdf } from "@/lib/signature/bloc";

export const BUCKET_SIGNATURES = "signatures";
export const TAILLE_MAX_ORIGINAL = 15 * 1024 * 1024;

export function empreinteSha256(donnees: Buffer | Uint8Array): string {
  return createHash("sha256").update(donnees).digest("hex");
}

// PDF signé (ou bon à signer) d'un document, produit par le serveur avec la
// clé de service une fois les droits vérifiés par signer_preparer /
// bon_a_signer :
//   - document rédigé dans la plateforme : PDF habituel + bloc de signature ;
//   - PDF déposé : le fichier d'origine, numéro en pied de chaque page, suivi
//     d'une page de signature qui rappelle son empreinte.
export async function produirePdfSigne(admin: SupabaseClient, documentId: string, signature: SignaturePdf): Promise<Buffer> {
  const { data, error } = await admin.from("documents").select("*").eq("id", documentId).single();
  const doc = data as Document | null;
  if (error || !doc) throw new Error("Document introuvable.");

  if (doc.format_atelier) {
    return (await exporterDocument(doc, "pdf", signature.langue, signature)).tampon;
  }
  if (!doc.storage_path) throw new Error("Document sans fichier.");
  const { data: fichier, error: erreurLecture } = await admin.storage.from("documents-ged").download(doc.storage_path);
  if (erreurLecture || !fichier) throw new Error("Fichier du document illisible.");
  return signerPdfDepose(doc, Buffer.from(await fichier.arrayBuffer()), signature);
}

export async function signerPdfDepose(doc: Document, original: Buffer, signature: SignaturePdf): Promise<Buffer> {
  const en = signature.langue === "en";
  // Refuse un fichier chiffré ou qui n'est pas un PDF.
  const pdf = await PDFDocument.load(original, { updateMetadata: false });
  const nbPages = pdf.getPageCount();

  const ligne = (libelle: string, valeur: string): Content[] => [
    { text: libelle, color: "#6b7280", fontSize: 9 },
    { text: valeur, fontSize: 9 },
  ];
  const pageSignature = await genererPdf(
    {
      titre: doc.titre,
      organisation: nomOrganisation(signature.langue),
      classification: libelles(signature.langue).classification[doc.classification],
      logo: await chargerLogo(),
      signature,
    },
    [
      { text: en ? "Signature page" : "Page de signature", style: "h2" },
      {
        text: en
          ? "This page is an integral part of the document described below. It certifies its signature."
          : "Cette page fait partie intégrante du document décrit ci-dessous et en atteste la signature.",
        margin: [0, 0, 0, 10],
      },
      {
        table: {
          widths: [150, "*"],
          body: [
            ligne(en ? "Document" : "Document", doc.titre),
            ligne(en ? "Reference" : "Référence", doc.reference ?? "—"),
            ligne(en ? "Pages signed" : "Pages signées", `${nbPages} + 1`),
            ligne(en ? "SHA-256 fingerprint of the original file" : "Empreinte SHA-256 du fichier d'origine", empreinteSha256(original)),
          ],
        },
        layout: "noBorders",
      },
    ]
  );

  const police = await pdf.embedFont(StandardFonts.Helvetica);
  const mention = `${en ? "No." : "N°"} ${signature.numero} - ${en ? "Verify" : "Vérifier"} : ${signature.url.replace(/^https?:\/\//, "")}`;
  for (const page of pdf.getPages()) {
    const cadre = page.getCropBox();
    page.drawText(mention, { x: cadre.x + 24, y: cadre.y + 10, size: 6.5, font: police, color: rgb(0.42, 0.45, 0.5) });
  }

  const source = await PDFDocument.load(pageSignature);
  const copies = await pdf.copyPages(source, source.getPageIndices());
  copies.forEach((p) => pdf.addPage(p));
  return Buffer.from(await pdf.save());
}
