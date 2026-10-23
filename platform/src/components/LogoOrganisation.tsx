import Image from "next/image";
import { INITIALE_LOGO, NOM_ORGANISATION, URL_LOGO_ORGANISATION } from "@/lib/organisation";

const TAILLES = {
  lg: { boite: "h-9 w-9 rounded-[9px]", police: "text-lg", policeLongue: "text-xs", image: 36 },
  sm: { boite: "h-8 w-8 rounded-[8px]", police: "text-sm", policeLongue: "text-[9px]", image: 32 },
} as const;

// Affiche le vrai logo de l'organisation (NEXT_PUBLIC_ORG_LOGO_URL) quand il
// est fourni ; sinon, le badge-lettre habituel (fond doré). Les deux partagent
// exactement le même gabarit (taille, coins arrondis) pour que la mise en
// page autour ne change jamais, quel que soit le déploiement.
export function LogoOrganisation({ taille }: { taille: "lg" | "sm" }) {
  const t = TAILLES[taille];

  if (URL_LOGO_ORGANISATION) {
    return (
      <div className={`flex shrink-0 items-center justify-center overflow-hidden bg-white p-0.5 ${t.boite}`}>
        <Image
          src={URL_LOGO_ORGANISATION}
          alt={NOM_ORGANISATION}
          width={t.image}
          height={t.image}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className={`flex shrink-0 items-center justify-center bg-gold-500 ${t.boite}`}>
      <span className={`font-serif font-bold text-navy-950 ${INITIALE_LOGO.length > 1 ? t.policeLongue : t.police}`}>
        {INITIALE_LOGO}
      </span>
    </div>
  );
}
