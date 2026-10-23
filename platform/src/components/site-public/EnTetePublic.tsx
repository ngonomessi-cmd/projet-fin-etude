"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoOrganisation } from "@/components/LogoOrganisation";
import { NOM_ORGANISATION } from "@/lib/organisation";
import { DICTIONNAIRE, cheminAutreLocale, prefixeLocale, type Locale } from "@/lib/i18n/dictionnaire";

const ICONES = {
  accueil: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 9.5 12 3l9 6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  missions: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M5 3v18" strokeLinecap="round" />
      <path d="M5 4h13l-2.5 4L18 12H5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  services: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" />
      <path d="M3 13h18" />
    </svg>
  ),
  actualites: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 11a1 1 0 0 1 1-1h3V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6Z" strokeLinejoin="round" />
      <path d="M8 10V4h11v13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 14h7M8 17h4" strokeLinecap="round" />
    </svg>
  ),
} as const;

export function EnTetePublic() {
  const pathname = usePathname();
  const locale: Locale = pathname.startsWith("/en") ? "en" : "fr";
  const t = DICTIONNAIRE[locale];
  const p = prefixeLocale(locale);

  const liens = [
    { href: p || "/", cible: "/", cle: "accueil", label: t.nav.accueil },
    { href: `${p}/#missions`, cible: "/#missions", cle: "missions", label: t.nav.missions },
    { href: `${p}/#services`, cible: "/#services", cle: "services", label: t.nav.services },
    { href: `${p}/actualites`, cible: "/actualites", cle: "actualites", label: t.nav.actualites },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b-2 border-gold-500 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <Link href={p || "/"} className="flex items-center gap-3">
          <LogoOrganisation taille="sm" />
          <span className="font-serif text-base font-semibold text-navy-950 sm:text-lg">{NOM_ORGANISATION}</span>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden items-stretch gap-6 md:flex">
            {liens.map((lien) => {
              const actif = lien.cle === "accueil" ? pathname === (p || "/") : pathname.startsWith(`${p}${lien.cible}`);
              return (
                <Link
                  key={lien.cle}
                  href={lien.href}
                  className={`flex items-center gap-1.5 border-b-2 py-1 text-xs font-bold uppercase tracking-wide transition-colors ${
                    actif ? "border-gold-500 text-navy-950" : "border-transparent text-[#1c2029]/65 hover:text-navy-950"
                  }`}
                >
                  {ICONES[lien.cle]}
                  {lien.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 rounded-md border border-paper-200 p-1 text-xs font-semibold">
            {(["fr", "en"] as const).map((l) => (
              <Link
                key={l}
                href={cheminAutreLocale(pathname, l)}
                className={`rounded px-2 py-1 uppercase transition-colors ${
                  locale === l ? "bg-navy-950 text-white" : "text-[#1c2029]/55 hover:text-navy-950"
                }`}
              >
                {l}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
