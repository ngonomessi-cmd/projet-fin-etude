import sharp from "sharp";

export type SpecimenNettoye = { png: Buffer; largeur: number; hauteur: number };

const SEUIL_FOND = 215; // luminance au-dessus de laquelle le pixel est du papier
const SEUIL_ENCRE = 170; // au-dessous : encre pleine ; entre les deux : demi-teinte adoucie
const MARGE = 8;

// L'image reçue n'est jamais conservée telle quelle : elle est décodée,
// réduite, son fond clair rendu transparent, recadrée sur le tracé et
// réencodée en PNG. Une image sans tracé est refusée (null).
export async function nettoyerSpecimen(entree: Buffer): Promise<SpecimenNettoye | null> {
  const base = sharp(entree, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: 1200, height: 500, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" });
  const { data, info } = await base.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Fond du papier estimé par un flou large (le trait, fin, y disparaît) :
  // chaque pixel est rapporté à la clarté du papier autour de lui, ce qui
  // efface ombres et dégradés d'une photo prise au téléphone.
  const fond = await base
    .clone()
    .greyscale()
    .blur(Math.max(8, Math.round(Math.min(width, height) / 12)))
    .raw()
    .toBuffer();

  let xMin = width;
  let yMin = height;
  let xMax = -1;
  let yMax = -1;
  let encre = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const i = p * channels;
      const luminance = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      const papier = Math.max(fond[p], 60);
      const relative = Math.min(255, (luminance / papier) * 245);
      const alpha =
        relative >= SEUIL_FOND ? 0 : relative <= SEUIL_ENCRE ? 255 : Math.round((255 * (SEUIL_FOND - relative)) / (SEUIL_FOND - SEUIL_ENCRE));
      data[i + 3] = alpha;
      if (alpha > 96) {
        encre++;
        if (x < xMin) xMin = x;
        if (x > xMax) xMax = x;
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }
    }
  }

  // Trop peu de tracé (image vide, ou fond seul) : refus.
  if (encre < 120 || xMax - xMin < 20 || yMax - yMin < 8) return null;

  const gauche = Math.max(0, xMin - MARGE);
  const haut = Math.max(0, yMin - MARGE);
  const largeur = Math.min(width, xMax + MARGE + 1) - gauche;
  const hauteur = Math.min(height, yMax + MARGE + 1) - haut;

  const png = await sharp(data, { raw: { width, height, channels } })
    .extract({ left: gauche, top: haut, width: largeur, height: hauteur })
    .png({ compressionLevel: 9 })
    .toBuffer();
  return { png, largeur, hauteur };
}
