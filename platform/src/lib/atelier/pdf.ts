import PdfPrinter from "pdfmake";
import * as polices from "pdfmake/build/vfs_fonts";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";

const vfs = (polices as unknown as { vfs?: Record<string, string>; default?: Record<string, string> }).vfs ??
  (polices as unknown as { default: Record<string, string> }).default ??
  (polices as unknown as Record<string, string>);

const imprimante = new PdfPrinter({
  Roboto: {
    normal: Buffer.from(vfs["Roboto-Regular.ttf"], "base64"),
    bold: Buffer.from(vfs["Roboto-Medium.ttf"], "base64"),
    italics: Buffer.from(vfs["Roboto-Italic.ttf"], "base64"),
    bolditalics: Buffer.from(vfs["Roboto-MediumItalic.ttf"], "base64"),
  },
});

export const COULEUR_MARINE = "#1f2a5c";
export const COULEUR_OR = "#c8962d";

export type EnTetePdf = {
  titre: string;
  organisation: string;
  classification: string;
  paysage?: boolean;
};

// Gabarit commun : bandeau organisation + classification en en-tête,
// pagination en pied de page — comme tout document sortant de la GED.
export function genererPdf(entete: EnTetePdf, contenu: Content[]): Promise<Buffer> {
  const definition: TDocumentDefinitions = {
    pageSize: "A4",
    pageOrientation: entete.paysage ? "landscape" : "portrait",
    pageMargins: [48, 64, 48, 56],
    info: { title: entete.titre, creator: entete.organisation },
    defaultStyle: { font: "Roboto", fontSize: 10.5, lineHeight: 1.25, color: "#1c2029" },
    header: (page) => ({
      margin: [48, 22, 48, 0],
      columns: [
        { text: entete.organisation, fontSize: 8, color: "#6b7280" },
        {
          text: `${entete.classification.toUpperCase()}`,
          alignment: "right",
          fontSize: 8,
          bold: true,
          color: page === 1 ? COULEUR_OR : "#9ca3af",
        },
      ],
    }),
    footer: (page, total) => ({
      margin: [48, 16, 48, 0],
      columns: [
        { text: entete.titre, fontSize: 8, color: "#9ca3af" },
        { text: `${page} / ${total}`, alignment: "right", fontSize: 8, color: "#9ca3af" },
      ],
    }),
    styles: {
      h1: { fontSize: 20, bold: true, color: COULEUR_MARINE, margin: [0, 6, 0, 8] },
      h2: { fontSize: 15, bold: true, color: COULEUR_MARINE, margin: [0, 10, 0, 6] },
      h3: { fontSize: 12.5, bold: true, color: COULEUR_MARINE, margin: [0, 8, 0, 4] },
      citation: { italics: true, color: "#4b5563", margin: [14, 2, 0, 6] },
      enteteTableau: { bold: true, color: "white", fillColor: COULEUR_MARINE },
    },
    content: contenu,
  };

  return new Promise((resoudre, rejeter) => {
    const doc = imprimante.createPdfKitDocument(definition);
    const morceaux: Buffer[] = [];
    doc.on("data", (m: Buffer) => morceaux.push(m));
    doc.on("end", () => resoudre(Buffer.concat(morceaux)));
    doc.on("error", rejeter);
    doc.end();
  });
}
