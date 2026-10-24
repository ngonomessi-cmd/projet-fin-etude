import Image from "next/image";
import { INITIALE_LOGO, NOM_ORGANISATION, URL_LOGO_ORGANISATION } from "@/lib/organisation";

// Papier à en-tête affiché au-dessus du texte, identique à l'en-tête des
// fichiers Word / PDF générés (cf. lib/atelier/export-texte.ts) : il n'est pas
// modifiable, chaque document de l'organisation le porte automatiquement.
export function EnTeteDocument({ classification }: { classification?: string }) {
  return (
    <div className="mb-8 flex items-center gap-3 border-b-2 border-[#c8962d] pb-3 select-none" contentEditable={false}>
      {URL_LOGO_ORGANISATION ? (
        <Image src={URL_LOGO_ORGANISATION} alt="" width={78} height={60} className="h-12 w-auto object-contain" />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-gold-500 font-serif text-lg font-bold text-navy-950">
          {INITIALE_LOGO}
        </span>
      )}
      <span className="flex-1 text-sm font-semibold leading-tight text-[#1f2a5c]">{NOM_ORGANISATION}</span>
      {classification && <span className="text-[11px] font-bold uppercase tracking-wide text-[#c8962d]">{classification}</span>}
    </div>
  );
}
