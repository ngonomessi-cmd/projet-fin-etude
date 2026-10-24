import PptxGenJS from "pptxgenjs";
import type { Content } from "pdfmake/interfaces";
import { normaliserPresentation, type Colonne } from "@/lib/atelier/contenus";
import { genererPdf, type EnTetePdf } from "@/lib/atelier/pdf";

const MARINE = "1F2A5C";
const OR = "C8962D";
const ENCRE = "1C2029";

const nettoyer = (puces: string[] | undefined) => (puces ?? []).map((p) => p.trim()).filter(Boolean);

export async function genererPptx(contenu: unknown, entete: EnTetePdf): Promise<Buffer> {
  const { diapositives } = normaliserPresentation(contenu);
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = entete.organisation;
  pptx.title = entete.titre;

  pptx.defineSlideMaster({
    title: "TITRE",
    background: { color: MARINE },
    objects: [
      { rect: { x: 0, y: 7.2, w: "100%", h: 0.3, fill: { color: OR } } },
      { text: { text: entete.organisation, options: { x: 0.8, y: 6.6, w: 9, h: 0.4, fontSize: 12, color: "C7CCE0" } } },
    ],
  });
  pptx.defineSlideMaster({
    title: "CONTENU",
    background: { color: "FFFFFF" },
    objects: [
      { rect: { x: 0, y: 0, w: "100%", h: 0.14, fill: { color: MARINE } } },
      { rect: { x: 0.8, y: 1.32, w: 1.1, h: 0.06, fill: { color: OR } } },
      { text: { text: entete.organisation, options: { x: 0.8, y: 6.95, w: 9, h: 0.35, fontSize: 10, color: "9CA3AF" } } },
    ],
    slideNumber: { x: 12.2, y: 6.95, w: 0.8, h: 0.35, fontSize: 10, color: "9CA3AF" },
  });

  const puces = (lignes: string[]) =>
    lignes.map((texte) => ({ text: texte, options: { bullet: { code: "25A0" }, paraSpaceAfter: 10 } }));

  for (const d of diapositives) {
    if (d.disposition === "titre") {
      const s = pptx.addSlide({ masterName: "TITRE" });
      s.addText(d.titre || " ", { x: 0.8, y: 2.3, w: 11.7, h: 1.5, fontSize: 40, bold: true, color: "FFFFFF", fontFace: "Georgia" });
      s.addShape(pptx.ShapeType.rect, { x: 0.8, y: 3.95, w: 1.4, h: 0.07, fill: { color: OR }, line: { color: OR } });
      if (d.sousTitre) s.addText(d.sousTitre, { x: 0.8, y: 4.2, w: 11.7, h: 0.8, fontSize: 20, color: "E5E7EB" });
      if (d.notes) s.addNotes(d.notes);
      continue;
    }

    const s = pptx.addSlide({ masterName: "CONTENU" });
    s.addText(d.titre || " ", { x: 0.8, y: 0.45, w: 11.7, h: 0.85, fontSize: 30, bold: true, color: MARINE, fontFace: "Georgia" });

    if (d.disposition === "deux_colonnes") {
      const colonnes: [Colonne | undefined, number][] = [
        [d.colonneGauche, 0.8],
        [d.colonneDroite, 6.9],
      ];
      for (const [col, x] of colonnes) {
        if (col?.titre) s.addText(col.titre, { x, y: 1.65, w: 5.6, h: 0.55, fontSize: 20, bold: true, color: OR });
        const lignes = nettoyer(col?.puces);
        if (lignes.length)
          s.addText(puces(lignes), { x, y: 2.3, w: 5.6, h: 4.3, fontSize: 18, color: ENCRE, valign: "top" });
      }
    } else {
      const lignes = nettoyer(d.puces);
      if (lignes.length) s.addText(puces(lignes), { x: 0.8, y: 1.7, w: 11.7, h: 4.9, fontSize: 20, color: ENCRE, valign: "top" });
    }
    if (d.notes) s.addNotes(d.notes);
  }

  return (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
}

export function genererPdfPresentation(contenu: unknown, entete: EnTetePdf): Promise<Buffer> {
  const { diapositives } = normaliserPresentation(contenu);
  const listePuces = (lignes: string[]): Content => ({
    ul: lignes.map((l) => ({ text: l, margin: [0, 0, 0, 8] })),
    fontSize: 16,
    markerColor: `#${OR}`,
  });

  const pages: Content[] = diapositives.map((d, i) => {
    const saut = i > 0 ? ("before" as const) : undefined;
    if (d.disposition === "titre") {
      return {
        pageBreak: saut,
        table: {
          widths: ["*"],
          body: [
            [
              {
                stack: [
                  { text: d.titre || " ", fontSize: 32, bold: true, color: "white" },
                  { canvas: [{ type: "rect", x: 0, y: 8, w: 70, h: 4, color: `#${OR}` }] },
                  { text: d.sousTitre || " ", fontSize: 16, color: "#e5e7eb", margin: [0, 16, 0, 0] },
                ],
                fillColor: `#${MARINE}`,
                margin: [36, 120, 36, 120],
              },
            ],
          ],
        },
        layout: "noBorders",
      };
    }
    const corps: Content[] = [
      { text: d.titre || " ", fontSize: 24, bold: true, color: `#${MARINE}` },
      { canvas: [{ type: "rect", x: 0, y: 6, w: 60, h: 3, color: `#${OR}` }], margin: [0, 0, 0, 20] },
    ];
    if (d.disposition === "deux_colonnes") {
      corps.push({
        columns: [d.colonneGauche, d.colonneDroite].map((col) => ({
          stack: [
            { text: col?.titre ?? "", fontSize: 18, bold: true, color: `#${OR}`, margin: [0, 0, 0, 10] },
            listePuces(nettoyer(col?.puces)),
          ],
        })),
        columnGap: 30,
      });
    } else {
      corps.push(listePuces(nettoyer(d.puces)));
    }
    return { pageBreak: saut, stack: corps, margin: [10, 10, 10, 0] };
  });

  return genererPdf({ ...entete, paysage: true }, pages);
}
