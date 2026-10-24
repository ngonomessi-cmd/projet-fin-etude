import type { Content } from "pdfmake/interfaces";
import type { Langue } from "@/lib/i18n/plateforme";
import { formaterCode, lignesQualite, mentionSignatureElectronique, type NatureSignature } from "@/lib/signature/commun";

// Ce qu'il faut pour imprimer le bloc de signature au bas d'un PDF.
export type SignaturePdf = {
  nature: NatureSignature;
  numero: string;
  code: string;
  url: string;
  langue: Langue;
  intitule: string;
  intitule_en: string;
  titre_delegataire: string | null;
  // Signature électronique seulement :
  signataireNom?: string | null;
  specimen?: { png: Buffer; largeur: number; hauteur: number } | null;
  signeLe?: Date;
};

const MARINE = "#1f2a5c";
const GRIS = "#6b7280";

// ┌──────────────────────┐            Le Directeur Général
// │  [QR code]           │        [image de la signature]
// │  N° 0001/API/DG/2026 │               Prénom NOM
// │  Vérifier : …        │   Signé électroniquement le … à …
// │  Code : ABCD-EFGH-…  │
// └──────────────────────┘
// Bon à signer : même colonne de gauche, cadre vide « Signature et cachet ».
// Bloc insécable : jamais coupé entre deux pages.
export function blocSignaturePdf(s: SignaturePdf, sautAvant = false): Content {
  const en = s.langue === "en";
  // Adresse de la page de vérification sans le code (imprimé juste dessous).
  const urlCourte = s.url.replace(/^https?:\/\//, "").replace(/\/[^/]*$/, "");

  const gauche = {
    width: 178,
    table: {
      widths: ["*"],
      body: [
        [
          {
            stack: [
              { qr: s.url, fit: 92, foreground: MARINE, margin: [0, 0, 0, 6] },
              { text: `${en ? "No." : "N°"} ${s.numero}`, bold: true, fontSize: 8.5, color: MARINE },
              { text: en ? "Check authenticity:" : "Vérifier l'authenticité :", fontSize: 7, color: GRIS, margin: [0, 3, 0, 0] },
              { text: urlCourte, fontSize: 6.5, color: MARINE, link: s.url },
              { text: `Code : ${formaterCode(s.code)}`, fontSize: 7.5, bold: true, margin: [0, 2, 0, 0] },
            ],
            margin: [6, 6, 6, 6],
          },
        ],
      ],
    },
    layout: {
      hLineColor: () => "#c8962d",
      vLineColor: () => "#c8962d",
      hLineWidth: () => 0.6,
      vLineWidth: () => 0.6,
    },
  } as unknown as Content;

  const formule: Content[] = lignesQualite(s, s.langue).map((ligne, i, toutes) => ({
    text: ligne,
    bold: i === 0 || i === toutes.length - 1,
    fontSize: 10.5,
    alignment: "center" as const,
  }));

  let droite: Content[];
  if (s.nature === "electronique") {
    const specimen = s.specimen;
    const echelle = specimen ? Math.min(170 / specimen.largeur, 62 / specimen.hauteur, 1) : 1;
    droite = [
      ...formule,
      specimen
        ? {
            image: `data:image/png;base64,${specimen.png.toString("base64")}`,
            width: Math.round(specimen.largeur * echelle),
            height: Math.round(specimen.hauteur * echelle),
            alignment: "center" as const,
            margin: [0, 6, 0, 4] as [number, number, number, number],
          }
        : { text: " ", margin: [0, 30, 0, 0] as [number, number, number, number] },
      { text: s.signataireNom ?? "", bold: true, fontSize: 10.5, alignment: "center" as const },
      {
        text: mentionSignatureElectronique(s.signeLe ?? new Date(), s.langue),
        italics: true,
        fontSize: 7.5,
        color: GRIS,
        alignment: "center" as const,
        margin: [0, 3, 0, 0] as [number, number, number, number],
      },
    ];
  } else {
    droite = [
      ...formule,
      {
        table: {
          widths: ["*"],
          heights: [96],
          body: [
            [
              {
                text: en ? "Signature and stamp" : "Signature et cachet",
                fontSize: 7,
                color: "#9ca3af",
                alignment: "center" as const,
                margin: [0, 84, 0, 0] as [number, number, number, number],
              },
            ],
          ],
        },
        layout: {
          hLineColor: () => "#9ca3af",
          vLineColor: () => "#9ca3af",
          hLineWidth: () => 0.6,
          vLineWidth: () => 0.6,
          hLineStyle: () => ({ dash: { length: 3, space: 2 } }),
          vLineStyle: () => ({ dash: { length: 3, space: 2 } }),
        },
        margin: [24, 8, 24, 0] as [number, number, number, number],
      },
    ];
  }

  return {
    unbreakable: true,
    pageBreak: sautAvant ? "before" : undefined,
    margin: [0, 28, 0, 0],
    columns: [gauche, { width: "*", stack: droite, margin: [16, 4, 0, 0] }],
    columnGap: 8,
  } as Content;
}
