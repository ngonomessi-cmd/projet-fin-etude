// Génère une palette (gammes "navy" et "gold" utilisées dans globals.css)
// cohérente à partir de deux couleurs d'ancrage, plutôt que d'exiger une
// dizaine de nuances choisies à la main pour chaque organisation.

type HSL = { h: number; s: number; l: number };

function hexVersHsl(hex: string): HSL {
  const nettoye = hex.replace("#", "");
  const r = parseInt(nettoye.slice(0, 2), 16) / 255;
  const g = parseInt(nettoye.slice(2, 4), 16) / 255;
  const b = parseInt(nettoye.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: l * 100 };

  const delta = max - min;
  const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = (g - b) / delta + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / delta + 2;
      break;
    default:
      h = (r - g) / delta + 4;
  }
  return { h: h * 60, s: s * 100, l: l * 100 };
}

function hslVersHex({ h, s, l }: HSL): string {
  const sN = Math.min(Math.max(s, 0), 100) / 100;
  const lN = Math.min(Math.max(l, 0), 100) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sN * Math.min(lN, 1 - lN);
  const f = (n: number) => lN - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const versHex = (n: number) =>
    Math.round(f(n) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${versHex(0)}${versHex(8)}${versHex(4)}`;
}

// Gamme sombre (sidebar, boutons principaux) : la couleur fournie devient la
// plus claire des trois (800), les deux autres sont assombries à hue/
// saturation constantes.
export function genererGammeSombre(hexBase: string) {
  const { h, s, l } = hexVersHsl(hexBase);
  return {
    800: hslVersHex({ h, s, l }),
    900: hslVersHex({ h, s, l: Math.max(l - 10, 6) }),
    950: hslVersHex({ h, s, l: Math.max(l - 20, 4) }),
  };
}

// Gamme accent (badges, liens, boutons secondaires) : la couleur fournie
// reste le "500" central, les autres nuances l'entourent.
export function genererGammeAccent(hexBase: string) {
  const { h, s, l } = hexVersHsl(hexBase);
  return {
    50: hslVersHex({ h, s: Math.min(s, 45), l: 95 }),
    100: hslVersHex({ h, s: Math.min(s, 50), l: 89 }),
    500: hexBase,
    600: hslVersHex({ h, s, l: Math.max(l - 15, 20) }),
    900: hslVersHex({ h, s, l: Math.max(l - 38, 10) }),
  };
}
