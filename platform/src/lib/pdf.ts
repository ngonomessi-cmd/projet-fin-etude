// Génération d'un PDF texte minimal, à la main, sans dépendance externe
// (une seule page, police Helvetica standard) — suffisant pour donner un
// contenu réellement téléchargeable/consultable aux documents fictifs
// (migration 0016), qui n'ont au départ qu'une ligne en base, sans fichier.

function echapperPdf(texte: string): string {
  return texte
    .replace(/[–—]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function decouperLignes(texte: string, maxCaracteres: number): string[] {
  const mots = texte.split(/\s+/).filter(Boolean);
  const lignes: string[] = [];
  let ligne = "";
  for (const mot of mots) {
    const essai = ligne ? `${ligne} ${mot}` : mot;
    if (essai.length > maxCaracteres && ligne) {
      lignes.push(ligne);
      ligne = mot;
    } else {
      ligne = essai;
    }
  }
  if (ligne) lignes.push(ligne);
  return lignes;
}

type LigneTexte = { texte: string; taille: number; gras: boolean; apres: number };

export function genererPdfDocument(params: { titre: string; soustitre: string; paragraphes: string[] }): Buffer {
  const { titre, soustitre, paragraphes } = params;
  const LARGEUR = 595;
  const HAUTEUR = 842;
  const MARGE = 56;

  const lignes: LigneTexte[] = [
    { texte: titre, taille: 18, gras: true, apres: 26 },
    { texte: soustitre, taille: 10, gras: false, apres: 30 },
  ];
  for (const paragraphe of paragraphes) {
    for (const ligne of decouperLignes(paragraphe, 90)) {
      lignes.push({ texte: ligne, taille: 11, gras: false, apres: 16 });
    }
    lignes.push({ texte: "", taille: 11, gras: false, apres: 10 });
  }

  let y = HAUTEUR - MARGE;
  const morceaux: string[] = ["BT"];
  for (const ligne of lignes) {
    if (y < MARGE) break; // document volontairement court : une seule page
    if (ligne.texte !== "") {
      morceaux.push(`/${ligne.gras ? "F2" : "F1"} ${ligne.taille} Tf`);
      morceaux.push(`1 0 0 1 ${MARGE} ${Math.round(y)} Tm`);
      morceaux.push(`(${echapperPdf(ligne.texte)}) Tj`);
    }
    y -= ligne.apres;
  }
  morceaux.push("ET");

  const contenuBuffer = Buffer.from(morceaux.join("\n"), "latin1");

  const objets: Buffer[] = [
    Buffer.from("<< /Type /Catalog /Pages 2 0 R >>", "latin1"),
    Buffer.from("<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "latin1"),
    Buffer.from(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${LARGEUR} ${HAUTEUR}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`,
      "latin1"
    ),
    Buffer.concat([
      Buffer.from(`<< /Length ${contenuBuffer.length} >>\nstream\n`, "latin1"),
      contenuBuffer,
      Buffer.from("\nendstream", "latin1"),
    ]),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>", "latin1"),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>", "latin1"),
  ];

  const parties: Buffer[] = [Buffer.from("%PDF-1.4\n", "latin1")];
  const decalages: number[] = [];
  let position = parties[0].length;

  objets.forEach((objet, index) => {
    decalages.push(position);
    const bloc = Buffer.concat([
      Buffer.from(`${index + 1} 0 obj\n`, "latin1"),
      objet,
      Buffer.from("\nendobj\n", "latin1"),
    ]);
    parties.push(bloc);
    position += bloc.length;
  });

  const positionXref = position;
  const nombreEntrees = objets.length + 1;
  let xref = `xref\n0 ${nombreEntrees}\n0000000000 65535 f \n`;
  for (const decalage of decalages) {
    xref += `${decalage.toString().padStart(10, "0")} 00000 n \n`;
  }
  const pied = `trailer\n<< /Size ${nombreEntrees} /Root 1 0 R >>\nstartxref\n${positionXref}\n%%EOF`;
  parties.push(Buffer.from(xref + pied, "latin1"));

  return Buffer.concat(parties);
}
