// Analyse de sécurité des pièces jointes de la messagerie interne.
//
// Deux niveaux, comme demandé :
// 1. Contrôles intégrés (toujours actifs, sans dépendance externe) : type
//    réel du fichier comparé au type déclaré, exécutables cachés, macros
//    Office, JavaScript dans un PDF.
// 2. Cloudmersive Virus Scan API, en complément, uniquement si
//    CLOUDMERSIVE_API_KEY est renseignée (offre gratuite : 800 analyses par
//    mois). Sans cette clé, seuls les contrôles intégrés s'appliquent —
//    limitation assumée de cet environnement de démonstration, à annoncer en
//    soutenance comme les autres simplifications du projet.
//
// Ce n'est pas un moteur antivirus généraliste : les contrôles intégrés sont
// des signatures ciblées (pas une base de signatures virales complète), et
// Cloudmersive reste optionnel.

export type ResultatAnalyse = { propre: boolean; motif?: string };

const SIGNATURES_EXECUTABLES: { octets: number[]; nom: string }[] = [
  { octets: [0x4d, 0x5a], nom: "exécutable Windows (MZ)" },
  { octets: [0x7f, 0x45, 0x4c, 0x46], nom: "exécutable Linux (ELF)" },
  { octets: [0xca, 0xfe, 0xba, 0xbe], nom: "exécutable macOS (Mach-O)" },
  { octets: [0xcf, 0xfa, 0xed, 0xfe], nom: "exécutable macOS (Mach-O)" },
  { octets: [0xfe, 0xed, 0xfa, 0xcf], nom: "exécutable macOS (Mach-O)" },
  { octets: [0x23, 0x21], nom: "script avec shebang" },
];

const SIGNATURES_TYPE_REEL: Record<string, number[][]> = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],
  "application/msword": [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
  "application/vnd.ms-excel": [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
  "application/vnd.ms-powerpoint": [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [[0x50, 0x4b, 0x03, 0x04]],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [[0x50, 0x4b, 0x03, 0x04]],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [[0x50, 0x4b, 0x03, 0x04]],
  "application/vnd.oasis.opendocument.text": [[0x50, 0x4b, 0x03, 0x04]],
  "application/vnd.oasis.opendocument.spreadsheet": [[0x50, 0x4b, 0x03, 0x04]],
  "application/vnd.oasis.opendocument.presentation": [[0x50, 0x4b, 0x03, 0x04]],
};

const TYPES_ZIP_OFFICE_AVEC_MACROS = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

function commenceParOctets(buffer: Buffer, octets: number[], decalage = 0): boolean {
  if (buffer.length < decalage + octets.length) return false;
  for (let i = 0; i < octets.length; i++) {
    if (buffer[decalage + i] !== octets[i]) return false;
  }
  return true;
}

function contientChaine(buffer: Buffer, chaine: string): boolean {
  return buffer.includes(Buffer.from(chaine, "ascii"));
}

function analyserControlesIntegres(buffer: Buffer, typeMimeDeclare: string): ResultatAnalyse {
  for (const sig of SIGNATURES_EXECUTABLES) {
    if (commenceParOctets(buffer, sig.octets)) {
      return { propre: false, motif: `Fichier refusé : ${sig.nom} détecté.` };
    }
  }

  const signaturesAttendues = SIGNATURES_TYPE_REEL[typeMimeDeclare];
  if (signaturesAttendues && !signaturesAttendues.some((sig) => commenceParOctets(buffer, sig))) {
    return { propre: false, motif: "Fichier refusé : le contenu réel ne correspond pas au type déclaré." };
  }

  if (TYPES_ZIP_OFFICE_AVEC_MACROS.includes(typeMimeDeclare) && contientChaine(buffer, "vbaProject.bin")) {
    return { propre: false, motif: "Fichier refusé : macro Office détectée." };
  }

  if (typeMimeDeclare === "application/pdf" && (contientChaine(buffer, "/JavaScript") || contientChaine(buffer, "/JS"))) {
    return { propre: false, motif: "Fichier refusé : JavaScript intégré détecté dans le PDF." };
  }

  return { propre: true };
}

async function analyserCloudmersive(buffer: Buffer, nomFichier: string): Promise<ResultatAnalyse | null> {
  const cle = process.env.CLOUDMERSIVE_API_KEY;
  if (!cle) return null;

  try {
    const formData = new FormData();
    formData.append("inputFile", new Blob([new Uint8Array(buffer)]), nomFichier);

    const reponse = await fetch("https://api.cloudmersive.com/virus/scan/file", {
      method: "POST",
      headers: { Apikey: cle },
      body: formData,
    });

    if (!reponse.ok) {
      // Panne du service tiers : on ne bloque pas l'envoi pour autant, les
      // contrôles intégrés ont déjà statué — limitation assumée.
      return null;
    }

    const resultat = (await reponse.json()) as { CleanResult?: boolean };
    if (resultat.CleanResult === false) {
      return { propre: false, motif: "Fichier refusé : détecté comme infecté par Cloudmersive Virus Scan." };
    }
    return { propre: true };
  } catch {
    return null;
  }
}

export async function analyserPieceJointe(buffer: Buffer, nomFichier: string, typeMimeDeclare: string): Promise<ResultatAnalyse> {
  const resultatIntegre = analyserControlesIntegres(buffer, typeMimeDeclare);
  if (!resultatIntegre.propre) return resultatIntegre;

  const resultatCloudmersive = await analyserCloudmersive(buffer, nomFichier);
  if (resultatCloudmersive && !resultatCloudmersive.propre) return resultatCloudmersive;

  return { propre: true };
}
