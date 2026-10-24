import { readFile } from "node:fs/promises";
import path from "node:path";
import { URL_LOGO_ORGANISATION } from "@/lib/organisation";

export type LogoExport = { donnees: Buffer; type: "png" | "jpg"; largeur: number; hauteur: number };

// Dimensions lues directement dans l'en-tête du fichier (PNG : bloc IHDR ;
// JPEG : premier segment SOF), sans dépendance de traitement d'image.
function dimensions(donnees: Buffer): { type: "png" | "jpg"; largeur: number; hauteur: number } | null {
  if (donnees.length > 24 && donnees.readUInt32BE(0) === 0x89504e47) {
    return { type: "png", largeur: donnees.readUInt32BE(16), hauteur: donnees.readUInt32BE(20) };
  }
  if (donnees[0] === 0xff && donnees[1] === 0xd8) {
    let i = 2;
    while (i + 9 < donnees.length) {
      if (donnees[i] !== 0xff) return null;
      const marqueur = donnees[i + 1];
      if (marqueur >= 0xc0 && marqueur <= 0xc3) {
        return { type: "jpg", hauteur: donnees.readUInt16BE(i + 5), largeur: donnees.readUInt16BE(i + 7) };
      }
      i += 2 + donnees.readUInt16BE(i + 2);
    }
  }
  return null;
}

async function lire(): Promise<LogoExport | null> {
  const url = URL_LOGO_ORGANISATION;
  if (!url) return null;
  try {
    const donnees = /^https?:\/\//.test(url)
      ? Buffer.from(await (await fetch(url)).arrayBuffer())
      : await readFile(path.join(process.cwd(), "public", url.replace(/^\/+/, "")));
    const d = dimensions(donnees);
    return d ? { donnees, ...d } : null;
  } catch {
    // Sans logo lisible, les exports gardent leur en-tête texte habituel.
    return null;
  }
}

let enCache: Promise<LogoExport | null> | null = null;

// Logo de l'organisation (NEXT_PUBLIC_ORG_LOGO_URL) pour l'en-tête des
// fichiers Word / PowerPoint / PDF générés ; null sur un déploiement sans
// logo image (badge-lettre seulement, ex. KHS Bank).
export function chargerLogo(): Promise<LogoExport | null> {
  enCache ??= lire();
  return enCache;
}

// Taille d'affichage qui tient dans une boîte, proportions conservées.
export function ajuster(logo: LogoExport, largeurMax: number, hauteurMax: number): { largeur: number; hauteur: number } {
  const echelle = Math.min(largeurMax / logo.largeur, hauteurMax / logo.hauteur);
  return { largeur: Math.round(logo.largeur * echelle), hauteur: Math.round(logo.hauteur * echelle) };
}
