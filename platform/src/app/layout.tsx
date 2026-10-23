import type { Metadata } from "next";
import "./globals.css";
import { COULEUR_ACCENT, COULEUR_PRIMAIRE, NOM_ORGANISATION } from "@/lib/organisation";
import { genererGammeAccent, genererGammeSombre } from "@/lib/couleurs";

export const metadata: Metadata = {
  title: `GED sécurisée — ${NOM_ORGANISATION}`,
  description:
    "Gestion Électronique de Documents sécurisée (démonstration du Lot F) — classification, RBAC, workflow de validation et journal d'audit immuable, via Supabase RLS.",
};

// Variables CSS personnalisées (Tailwind v4 les expose comme de vraies
// custom properties, cf. globals.css) : posées en style inline sur <html>,
// donc prioritaires sur les valeurs par défaut de globals.css sans y
// toucher — aucune couleur ne change pour un déploiement qui ne définit
// pas NEXT_PUBLIC_ORG_COULEUR_*.
function stylePaletteOrganisation(): React.CSSProperties | undefined {
  const variables: Record<string, string> = {};

  if (COULEUR_PRIMAIRE) {
    const gamme = genererGammeSombre(COULEUR_PRIMAIRE);
    variables["--color-navy-950"] = gamme[950];
    variables["--color-navy-900"] = gamme[900];
    variables["--color-navy-800"] = gamme[800];
  }

  if (COULEUR_ACCENT) {
    const gamme = genererGammeAccent(COULEUR_ACCENT);
    variables["--color-gold-50"] = gamme[50];
    variables["--color-gold-100"] = gamme[100];
    variables["--color-gold-500"] = gamme[500];
    variables["--color-gold-600"] = gamme[600];
    variables["--color-gold-900"] = gamme[900];
  }

  return Object.keys(variables).length > 0 ? (variables as React.CSSProperties) : undefined;
}

export default function LayoutRacine({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" style={stylePaletteOrganisation()}>
      <body>{children}</body>
    </html>
  );
}
