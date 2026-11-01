import ExcelJS from "exceljs";

/** Un texte commençant par « = + - @ » serait lu comme une formule par le tableur : on le neutralise. */
export const sur = (v: string | null | undefined): string => (v && /^[=+\-@]/.test(v) ? `'${v}` : (v ?? ""));

// Classeur d'une seule feuille : en-têtes en gras sur fond marine, colonnes à largeur fixe, première ligne figée.
export async function genererXlsxFeuille(opts: { organisation: string; titre: string; feuille: string; entetes: string[]; largeurs: number[]; lignes: string[][] }): Promise<Buffer> {
  const classeur = new ExcelJS.Workbook();
  classeur.creator = opts.organisation;
  classeur.title = opts.titre;
  const feuille = classeur.addWorksheet(opts.feuille.slice(0, 31));
  feuille.columns = opts.entetes.map((e, i) => ({ header: e, key: `c${i}`, width: opts.largeurs[i] ?? 16 }));
  feuille.getRow(1).eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2A5C" } };
  });
  for (const l of opts.lignes) feuille.addRow(l);
  feuille.views = [{ state: "frozen", ySplit: 1 }];
  return Buffer.from(await classeur.xlsx.writeBuffer());
}
