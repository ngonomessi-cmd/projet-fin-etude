import Image from "next/image";
import Link from "next/link";
import {
  IconeEclair,
  IconeFleche,
  IconeOrdinateur,
  IconePalmier,
  IconePioche,
  IconePousse,
  IconeUsine,
} from "@/components/site-public/IconesSite";

export type CleSecteur = "agriculture" | "energie" | "industrie" | "mines" | "numerique" | "tourisme";

// Pictogramme et teinte de chaque secteur.
export const STYLE_SECTEURS: Record<CleSecteur, { Icone: (p: { className?: string }) => React.ReactNode; teinte: string }> = {
  agriculture: { Icone: IconePousse, teinte: "#1f6b43" },
  energie: { Icone: IconeEclair, teinte: "#8a5a10" },
  industrie: { Icone: IconeUsine, teinte: "#2a4f82" },
  mines: { Icone: IconePioche, teinte: "#7a4325" },
  numerique: { Icone: IconeOrdinateur, teinte: "#3a3d94" },
  tourisme: { Icone: IconePalmier, teinte: "#0f6670" },
};

// Photos des secteurs : déposer l'image dans public/images/site/secteurs/ puis
// l'inscrire ici (ex. agriculture: "/images/site/secteurs/agriculture.jpg").
// Sans photo, la carte affiche une illustration à la teinte du secteur.
export const PHOTOS_SECTEURS: Partial<Record<CleSecteur, string>> = {};

export function CarteSecteur({ cle, titre, href }: { cle: CleSecteur; titre: string; href: string }) {
  const { Icone, teinte } = STYLE_SECTEURS[cle];
  const photo = PHOTOS_SECTEURS[cle];

  return (
    <Link
      href={href}
      className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-xl shadow-[0_6px_20px_rgba(0,24,61,0.12)] transition-transform duration-300 hover:-translate-y-1"
      style={photo ? undefined : { background: `linear-gradient(160deg, ${teinte} 0%, #00183d 85%)` }}
    >
      {photo ? (
        <Image
          src={photo}
          alt=""
          fill
          sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
          className="-z-10 object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <>
          <span className="absolute -right-6 -top-4 -z-10 text-white/[0.09] transition-transform duration-500 group-hover:scale-110">
            <Icone className="h-40 w-40" />
          </span>
          <span className="absolute -left-10 top-1/3 -z-10 h-40 w-40 rounded-full bg-gold-500/10 blur-2xl" />
        </>
      )}
      <span className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-encre-950/90 via-encre-950/40 to-transparent" />

      <div className="flex items-end justify-between gap-2 p-3.5">
        <div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500 text-encre-950">
            <Icone className="h-5 w-5" />
          </span>
          <p className="mt-2.5 text-[13.5px] font-semibold leading-snug text-white">{titre}</p>
        </div>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/50 text-white transition-colors group-hover:border-gold-500 group-hover:bg-gold-500 group-hover:text-encre-950">
          <IconeFleche className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
