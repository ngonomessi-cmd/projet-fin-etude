import type { Diapositive } from "@/lib/atelier/contenus";
import { URL_LOGO_ORGANISATION } from "@/lib/organisation";

const puces = (lignes: string[] | undefined) => (lignes ?? []).map((l) => l.trim()).filter(Boolean);

// Rendu 16:9 fidèle à l'export PowerPoint (mêmes couleurs, mêmes dispositions).
// Les tailles sont exprimées en « container query units » : la diapositive
// garde ses proportions quelle que soit la largeur disponible.
export function ApercuDiapositive({ diapositive, organisation, numero }: { diapositive: Diapositive; organisation: string; numero: number }) {
  const d = diapositive;
  if (d.disposition === "titre") {
    return (
      <div className="@container relative aspect-video w-full overflow-hidden rounded-md bg-[#1f2a5c] text-white shadow">
        <div className="absolute inset-x-[6%] top-[31%]">
          <p className="font-serif text-[5.4cqw] font-bold leading-tight">{d.titre || " "}</p>
          <span className="mt-[2cqw] block h-[0.6cqw] w-[10cqw] bg-[#c8962d]" />
          {d.sousTitre && <p className="mt-[2.4cqw] text-[2.6cqw] text-white/85">{d.sousTitre}</p>}
        </div>
        {URL_LOGO_ORGANISATION && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={URL_LOGO_ORGANISATION} alt="" className="absolute left-[6%] top-[8%] h-[13%] w-auto rounded-[0.6cqw] bg-white p-[0.8cqw]" />
        )}
        <p className="absolute bottom-[6%] left-[6%] text-[1.5cqw] text-white/60">{organisation}</p>
        <span className="absolute inset-x-0 bottom-0 h-[4%] bg-[#c8962d]" />
      </div>
    );
  }
  return (
    <div className="@container relative aspect-video w-full overflow-hidden rounded-md border border-paper-200 bg-white text-[#1c2029] shadow">
      <span className="absolute inset-x-0 top-0 h-[1.9%] bg-[#1f2a5c]" />
      {URL_LOGO_ORGANISATION && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={URL_LOGO_ORGANISATION} alt="" className="absolute right-[3.7%] top-[4%] h-[8.5%] w-auto" />
      )}
      <p className={`absolute left-[6%] top-[6%] truncate font-serif ${URL_LOGO_ORGANISATION ? "right-[16%]" : "right-[6%]"} text-[3.9cqw] font-bold text-[#1f2a5c]`}>{d.titre || " "}</p>
      <span className="absolute left-[6%] top-[17.6%] h-[0.8%] w-[8.3%] bg-[#c8962d]" />
      {d.disposition === "deux_colonnes" ? (
        <div className="absolute inset-x-[6%] top-[22%] grid grid-cols-2 gap-[4cqw]">
          {[d.colonneGauche, d.colonneDroite].map((col, i) => (
            <div key={i}>
              <p className="text-[2.6cqw] font-bold text-[#c8962d]">{col?.titre}</p>
              <ul className="mt-[1.5cqw] space-y-[1cqw] text-[2.3cqw]">
                {puces(col?.puces).map((p, j) => (
                  <li key={j} className="flex gap-[1.2cqw]">
                    <span className="mt-[0.9cqw] h-[0.9cqw] w-[0.9cqw] shrink-0 bg-[#1f2a5c]" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className="absolute inset-x-[6%] top-[23%] space-y-[1.3cqw] text-[2.6cqw]">
          {puces(d.puces).map((p, j) => (
            <li key={j} className="flex gap-[1.4cqw]">
              <span className="mt-[1cqw] h-[1cqw] w-[1cqw] shrink-0 bg-[#1f2a5c]" />
              {p}
            </li>
          ))}
        </ul>
      )}
      <p className="absolute bottom-[3.5%] left-[6%] text-[1.3cqw] text-gray-400">{organisation}</p>
      <p className="absolute bottom-[3.5%] right-[4%] text-[1.3cqw] text-gray-400">{numero}</p>
    </div>
  );
}
