import ExcelJS from "exceljs";
import type { Content } from "pdfmake/interfaces";
import { normaliserTableur } from "@/lib/atelier/contenus";
import {
  Classeur,
  ErreurFormule,
  etendueUtilisee,
  formaterValeur,
  formuleVersExcel,
  reference,
  valeurSaisie,
  type Valeur,
} from "@/lib/atelier/formules";
import { genererPdf, type EnTetePdf } from "@/lib/atelier/pdf";

function nomFeuilleExcel(nom: string, deja: Set<string>): string {
  let base = nom.replace(/[\[\]:*?/\\]/g, " ").trim().slice(0, 31) || "Feuille";
  let candidat = base;
  let i = 2;
  while (deja.has(candidat.toLowerCase())) {
    const suffixe = ` (${i++})`;
    candidat = base.slice(0, 31 - suffixe.length) + suffixe;
  }
  deja.add(candidat.toLowerCase());
  return candidat;
}

function resultatExcel(v: Valeur): string | number | boolean | { error: "#DIV/0!" | "#VALUE!" | "#NAME?" | "#REF!" } {
  if (v instanceof ErreurFormule) {
    const codes = { "#DIV/0!": "#DIV/0!", "#VALEUR!": "#VALUE!", "#NOM?": "#NAME?", "#REF!": "#REF!" } as const;
    return { error: codes[v.code as keyof typeof codes] ?? "#VALUE!" };
  }
  return v ?? "";
}

export async function genererXlsx(contenu: unknown, entete: EnTetePdf): Promise<Buffer> {
  const { feuilles } = normaliserTableur(contenu);
  const classeur = new ExcelJS.Workbook();
  classeur.creator = entete.organisation;
  classeur.title = entete.titre;
  const noms = new Set<string>();

  for (const feuille of feuilles) {
    const ws = classeur.addWorksheet(nomFeuilleExcel(feuille.nom, noms));
    const calcul = new Classeur(feuille.cellules);
    const gras = new Set((feuille.gras ?? []).map((r) => r.toUpperCase()));
    const largeurs: number[] = [];

    for (const [ref, brut] of Object.entries(feuille.cellules)) {
      if (!brut || !brut.trim()) continue;
      const cellule = ws.getCell(ref);
      const estFormule = brut.trim().startsWith("=");
      const valeur = calcul.valeur(ref);
      if (estFormule) {
        cellule.value = { formula: formuleVersExcel(brut), result: resultatExcel(valeur) } as ExcelJS.CellFormulaValue;
      } else {
        const v = valeurSaisie(brut);
        cellule.value = v instanceof ErreurFormule ? brut : (v as string | number | boolean);
      }
      if (typeof valeur === "number") cellule.numFmt = Number.isInteger(valeur) ? "#,##0" : "#,##0.00";
      if (gras.has(ref.toUpperCase())) cellule.font = { bold: true };
      const col = Number(cellule.col) - 1;
      largeurs[col] = Math.max(largeurs[col] ?? 10, Math.min(50, formaterValeur(valeur).length + 3));
    }
    largeurs.forEach((l, i) => {
      if (l) ws.getColumn(i + 1).width = l;
    });
  }

  const tampon = await classeur.xlsx.writeBuffer();
  return Buffer.from(tampon as ArrayBuffer);
}

export function genererPdfTableur(contenu: unknown, entete: EnTetePdf): Promise<Buffer> {
  const { feuilles } = normaliserTableur(contenu);
  const blocs: Content[] = [];
  let maxColonnes = 0;

  feuilles.forEach((feuille, index) => {
    const { colonnes, lignes } = etendueUtilisee(feuille.cellules);
    maxColonnes = Math.max(maxColonnes, colonnes);
    if (feuilles.length > 1) blocs.push({ text: feuille.nom, style: "h2", pageBreak: index > 0 ? "before" : undefined });
    if (!colonnes) {
      blocs.push({ text: "(feuille vide)", italics: true, color: "#9ca3af" });
      return;
    }
    const calcul = new Classeur(feuille.cellules);
    const gras = new Set((feuille.gras ?? []).map((r) => r.toUpperCase()));
    const corps = Array.from({ length: lignes }, (_, l) =>
      Array.from({ length: colonnes }, (_, c) => {
        const ref = reference(c, l);
        const v = calcul.valeur(ref);
        return {
          // Espaces insécables fines du format français → espaces simples
          // (absentes de la police PDF).
          text: formaterValeur(v).replace(/[\u202f\u00a0]/g, " "),
          alignment: typeof v === "number" ? "right" : "left",
          bold: gras.has(ref) || undefined,
          fontSize: colonnes > 8 ? 8 : 9.5,
        };
      })
    );
    blocs.push({
      table: { widths: Array(colonnes).fill("auto"), body: corps as never },
      layout: {
        hLineColor: () => "#e5e7eb",
        vLineColor: () => "#e5e7eb",
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
      },
    });
  });

  return genererPdf({ ...entete, paysage: maxColonnes > 6 }, blocs);
}
