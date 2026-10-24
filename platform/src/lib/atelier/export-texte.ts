import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type IParagraphOptions,
} from "docx";
import type { Content, ContentText } from "pdfmake/interfaces";
import { normaliserTexte, type NoeudTexte } from "@/lib/atelier/contenus";
import { genererPdf, type EnTetePdf } from "@/lib/atelier/pdf";
import { ajuster } from "@/lib/atelier/logo";

const MARINE = "1F2A5C";

const ALIGNEMENTS = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
} as const;

const TITRES = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3];

type Marques = NonNullable<NoeudTexte["marks"]>;
const aMarque = (m: Marques | undefined, t: string) => !!m?.some((x) => x.type === t);

// ---------------------------------------------------------------------------
// Word (.docx)
// ---------------------------------------------------------------------------

function runs(noeuds: NoeudTexte[] | undefined, force: { bold?: boolean; color?: string } = {}): TextRun[] {
  const sortie: TextRun[] = [];
  for (const n of noeuds ?? []) {
    if (n.type === "hardBreak") sortie.push(new TextRun({ text: "", break: 1 }));
    else if (n.type === "text")
      sortie.push(
        new TextRun({
          text: n.text ?? "",
          bold: force.bold || aMarque(n.marks, "bold"),
          italics: aMarque(n.marks, "italic"),
          underline: aMarque(n.marks, "underline") ? {} : undefined,
          strike: aMarque(n.marks, "strike"),
          font: aMarque(n.marks, "code") ? "Consolas" : undefined,
          color: force.color,
        })
      );
  }
  return sortie;
}

function alignement(n: NoeudTexte) {
  const a = n.attrs?.textAlign as keyof typeof ALIGNEMENTS | undefined;
  return a ? ALIGNEMENTS[a] : undefined;
}

type Contexte = { niveauListe: number; liste?: { reference: string; instance: number }; compteurListes: { n: number } };

function blocsWord(noeuds: NoeudTexte[] | undefined, ctx: Contexte, options: Partial<IParagraphOptions> = {}): (Paragraph | Table)[] {
  const sortie: (Paragraph | Table)[] = [];
  for (const n of noeuds ?? []) {
    switch (n.type) {
      case "paragraph":
        sortie.push(
          new Paragraph({
            ...options,
            alignment: alignement(n),
            children: runs(n.content),
            numbering: ctx.liste ? { reference: ctx.liste.reference, level: ctx.niveauListe, instance: ctx.liste.instance } : undefined,
          })
        );
        break;
      case "heading": {
        const niveau = Math.min(Math.max(Number(n.attrs?.level ?? 1), 1), 3) - 1;
        sortie.push(new Paragraph({ heading: TITRES[niveau], alignment: alignement(n), children: runs(n.content, { bold: true, color: MARINE }) }));
        break;
      }
      case "bulletList":
      case "orderedList": {
        const ref = n.type === "bulletList" ? "puces" : "numeros";
        const liste = ctx.liste && ctx.liste.reference === ref ? ctx.liste : { reference: ref, instance: ++ctx.compteurListes.n };
        for (const item of n.content ?? []) {
          let premier = true;
          for (const enfant of item.content ?? []) {
            if (enfant.type === "bulletList" || enfant.type === "orderedList") {
              sortie.push(...blocsWord([enfant], { ...ctx, niveauListe: ctx.niveauListe + 1, liste: undefined }));
            } else if (premier) {
              sortie.push(...blocsWord([enfant], { ...ctx, liste }));
              premier = false;
            } else {
              sortie.push(...blocsWord([enfant], { ...ctx, liste: undefined }, { indent: { left: 720 * (ctx.niveauListe + 1) } }));
            }
          }
        }
        break;
      }
      case "blockquote":
        sortie.push(
          ...blocsWord(n.content, ctx, {
            indent: { left: 567 },
            border: { left: { style: BorderStyle.SINGLE, size: 12, color: "C8962D", space: 8 } },
          })
        );
        break;
      case "codeBlock":
        sortie.push(new Paragraph({ children: [new TextRun({ text: (n.content ?? []).map((c) => c.text).join(""), font: "Consolas" })] }));
        break;
      case "horizontalRule":
        sortie.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "D1D5DB", space: 1 } }, children: [] }));
        break;
      case "table": {
        const lignes = (n.content ?? []).map(
          (ligne) =>
            new TableRow({
              children: (ligne.content ?? []).map((cellule) => {
                const entete = cellule.type === "tableHeader";
                return new TableCell({
                  columnSpan: Number(cellule.attrs?.colspan ?? 1),
                  rowSpan: Number(cellule.attrs?.rowspan ?? 1),
                  shading: entete ? { type: ShadingType.CLEAR, color: "auto", fill: MARINE } : undefined,
                  margins: { top: 60, bottom: 60, left: 100, right: 100 },
                  children: (cellule.content ?? []).map(
                    (p) =>
                      new Paragraph({
                        alignment: alignement(p),
                        children: runs(p.content, entete ? { bold: true, color: "FFFFFF" } : {}),
                      })
                  ),
                });
              }),
            })
        );
        if (lignes.length) sortie.push(new Table({ rows: lignes, width: { size: 100, type: WidthType.PERCENTAGE } }));
        sortie.push(new Paragraph({ children: [] }));
        break;
      }
      default:
        if (n.content) sortie.push(...blocsWord(n.content, ctx, options));
    }
  }
  return sortie;
}

function niveauxListe(format: (typeof LevelFormat)[keyof typeof LevelFormat], textes: string[]) {
  return textes.map((text, level) => ({
    level,
    format,
    text,
    alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } },
  }));
}

export async function genererDocx(contenu: unknown, entete: EnTetePdf): Promise<Buffer> {
  const doc = normaliserTexte(contenu);
  const document = new Document({
    creator: entete.organisation,
    title: entete.titre,
    styles: {
      default: { document: { run: { font: "Calibri", size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", run: { size: 36, bold: true, color: MARINE }, paragraph: { spacing: { before: 240, after: 160 } } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", run: { size: 28, bold: true, color: MARINE }, paragraph: { spacing: { before: 200, after: 120 } } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", run: { size: 24, bold: true, color: MARINE }, paragraph: { spacing: { before: 160, after: 80 } } },
      ],
    },
    numbering: {
      config: [
        { reference: "puces", levels: niveauxListe(LevelFormat.BULLET, ["•", "◦", "▪", "•", "◦"]) },
        { reference: "numeros", levels: niveauxListe(LevelFormat.DECIMAL, ["%1.", "%2.", "%3.", "%4.", "%5."]) },
      ],
    },
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  ...(entete.logo
                    ? [
                        new ImageRun({
                          type: entete.logo.type,
                          data: entete.logo.donnees,
                          transformation: (({ largeur, hauteur }) => ({ width: largeur, height: hauteur }))(ajuster(entete.logo, 96, 56)),
                        }),
                        new TextRun({ text: "  " }),
                      ]
                    : []),
                  new TextRun({ text: entete.organisation, size: entete.logo ? 18 : 16, bold: Boolean(entete.logo), color: entete.logo ? MARINE : "6B7280" }),
                  new TextRun({ text: `\t${entete.classification.toUpperCase()}`, size: 16, bold: true, color: "C8962D" }),
                ],
                tabStops: [{ type: "right", position: 9026 }],
                border: entete.logo ? { bottom: { style: BorderStyle.SINGLE, size: 6, color: "C8962D", space: 4 } } : undefined,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                tabStops: [{ type: "right", position: 9026 }],
                children: [
                  new TextRun({ text: entete.titre, size: 16, color: "9CA3AF" }),
                  new TextRun({ children: ["\t", PageNumber.CURRENT, " / ", PageNumber.TOTAL_PAGES], size: 16, color: "9CA3AF" }),
                ],
              }),
            ],
          }),
        },
        children: blocsWord(doc.content, { niveauListe: 0, compteurListes: { n: 0 } }),
      },
    ],
  });
  return Packer.toBuffer(document);
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

function textesPdf(noeuds: NoeudTexte[] | undefined, force: Partial<ContentText> = {}): ContentText[] {
  return (noeuds ?? []).map((n) => {
    if (n.type === "hardBreak") return { text: "\n" };
    const decorations = [aMarque(n.marks, "underline") && "underline", aMarque(n.marks, "strike") && "lineThrough"].filter(Boolean);
    return {
      text: n.text ?? "",
      bold: aMarque(n.marks, "bold") || undefined,
      italics: aMarque(n.marks, "italic") || undefined,
      decoration: (decorations[0] || undefined) as ContentText["decoration"],
      ...force,
    };
  });
}

function blocsPdf(noeuds: NoeudTexte[] | undefined): Content[] {
  const sortie: Content[] = [];
  for (const n of noeuds ?? []) {
    const align = n.attrs?.textAlign as ContentText["alignment"];
    switch (n.type) {
      case "paragraph":
        sortie.push({ text: n.content?.length ? textesPdf(n.content) : " ", alignment: align, margin: [0, 0, 0, 6] });
        break;
      case "heading":
        sortie.push({ text: textesPdf(n.content), style: `h${Math.min(Math.max(Number(n.attrs?.level ?? 1), 1), 3)}`, alignment: align });
        break;
      case "bulletList":
        sortie.push({ ul: (n.content ?? []).map((item) => ({ stack: blocsPdf(item.content) })), margin: [0, 0, 0, 6] });
        break;
      case "orderedList":
        sortie.push({
          ol: (n.content ?? []).map((item) => ({ stack: blocsPdf(item.content) })),
          start: Number(n.attrs?.start ?? 1),
          margin: [0, 0, 0, 6],
        });
        break;
      case "blockquote":
        sortie.push({ stack: blocsPdf(n.content), style: "citation" });
        break;
      case "codeBlock":
        sortie.push({ text: (n.content ?? []).map((c) => c.text).join(""), fontSize: 9.5, margin: [0, 0, 0, 6] });
        break;
      case "horizontalRule":
        sortie.push({ canvas: [{ type: "line", x1: 0, y1: 0, x2: 499, y2: 0, lineWidth: 0.6, lineColor: "#d1d5db" }], margin: [0, 6, 0, 10] });
        break;
      case "table": {
        const lignes = (n.content ?? []).map((ligne) =>
          (ligne.content ?? []).map((cellule) => {
            const entete = cellule.type === "tableHeader";
            return {
              stack: (cellule.content ?? []).map((p) => ({
                text: p.content?.length ? textesPdf(p.content, entete ? { bold: true, color: "white" } : {}) : " ",
                alignment: p.attrs?.textAlign as ContentText["alignment"],
              })),
              fillColor: entete ? "#1f2a5c" : undefined,
              colSpan: Number(cellule.attrs?.colspan ?? 1),
            };
          })
        );
        const colonnes = Math.max(1, ...lignes.map((l) => l.reduce((s, c) => s + c.colSpan, 0)));
        const corps = lignes.map((l) => {
          const ligne: unknown[] = [];
          for (const c of l) {
            ligne.push(c);
            for (let i = 1; i < c.colSpan; i++) ligne.push({});
          }
          while (ligne.length < colonnes) ligne.push({ text: "" });
          return ligne;
        });
        if (corps.length)
          sortie.push({
            table: { widths: Array(colonnes).fill("*"), body: corps as never, headerRows: lignes[0]?.every((c) => c.fillColor) ? 1 : 0 },
            layout: {
              hLineColor: () => "#d1d5db",
              vLineColor: () => "#d1d5db",
              hLineWidth: () => 0.6,
              vLineWidth: () => 0.6,
              paddingTop: () => 4,
              paddingBottom: () => 4,
            },
            margin: [0, 2, 0, 10],
          });
        break;
      }
      default:
        if (n.content) sortie.push(...blocsPdf(n.content));
    }
  }
  return sortie;
}

export function genererPdfTexte(contenu: unknown, entete: EnTetePdf): Promise<Buffer> {
  return genererPdf(entete, blocsPdf(normaliserTexte(contenu).content));
}
