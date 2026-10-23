"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoOrganisation } from "@/components/LogoOrganisation";
import { NOM_ORGANISATION } from "@/lib/organisation";

const LIENS_PUBLICS = [
  {
    href: "/",
    label: "Accueil",
    icone: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M3 9.5 12 3l9 6.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/#missions",
    label: "Missions",
    icone: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M5 3v18" strokeLinecap="round" />
        <path d="M5 4h13l-2.5 4L18 12H5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/#services",
    label: "Services",
    icone: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="7" width="18" height="12" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" />
        <path d="M3 13h18" />
      </svg>
    ),
  },
  {
    href: "/actualites",
    label: "Actualités",
    icone: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M4 11a1 1 0 0 1 1-1h3V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6Z" strokeLinejoin="round" />
        <path d="M8 10V4h11v13" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 14h7M8 17h4" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function EnTetePublic() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-gold-500 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <LogoOrganisation taille="sm" />
          <span className="font-serif text-base font-semibold text-navy-950 sm:text-lg">{NOM_ORGANISATION}</span>
        </Link>

        <nav className="hidden items-stretch gap-6 md:flex">
          {LIENS_PUBLICS.map((lien) => {
            const actif = lien.href === "/" ? pathname === "/" : pathname.startsWith(lien.href);
            return (
              <Link
                key={lien.href}
                href={lien.href}
                className={`flex items-center gap-1.5 border-b-2 py-1 text-xs font-bold uppercase tracking-wide transition-colors ${
                  actif ? "border-gold-500 text-navy-950" : "border-transparent text-[#1c2029]/65 hover:text-navy-950"
                }`}
              >
                {lien.icone}
                {lien.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
