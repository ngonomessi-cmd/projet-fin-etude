"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RubanOrganisation } from "@/components/RubanOrganisation";
import { LogoOrganisation } from "@/components/LogoOrganisation";
import { NOM_ORGANISATION, URL_LOGO_ORGANISATION } from "@/lib/organisation";
import { DICTIONNAIRE, prefixeLocale, type Locale } from "@/lib/i18n/dictionnaire";
import { IconeFleche } from "@/components/site-public/IconesSite";

export function PiedDePagePublic() {
  const pathname = usePathname();
  const locale: Locale = pathname.startsWith("/en") ? "en" : "fr";
  const t = DICTIONNAIRE[locale];
  const p = prefixeLocale(locale);

  const liens = [
    { href: p || "/", label: t.nav.accueil },
    { href: `${p}/missions`, label: t.nav.missions },
    { href: `${p}/services`, label: t.nav.services },
    { href: `${p}/actualites`, label: t.nav.actualites },
    { href: `${p}/contact`, label: t.nav.contact },
  ];

  return (
    <footer className="bg-encre-950 text-white">
      <RubanOrganisation className="h-1! rounded-none!" />

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <Link href={p || "/"} className="flex items-center gap-3">
          {URL_LOGO_ORGANISATION ? (
            <span className="flex h-12 shrink-0 items-center rounded-md bg-white px-2">
              <Image src={URL_LOGO_ORGANISATION} alt="" width={110} height={85} className="h-9 w-auto object-contain" />
            </span>
          ) : (
            <LogoOrganisation taille="lg" />
          )}
          <span className="max-w-[15rem] font-serif text-sm font-semibold leading-snug">{NOM_ORGANISATION}</span>
        </Link>

        <nav className="flex flex-wrap gap-x-7 gap-y-2 text-sm text-white/85">
          {liens.map((lien) => (
            <Link key={lien.href} href={lien.href} className="hover:text-gold-500">
              {lien.label}
            </Link>
          ))}
        </nav>

        <p className="max-w-[16rem] font-serif text-sm italic leading-snug text-white/90 lg:text-right">{t.footer.tagline}</p>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-white/10 px-4 py-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          © {new Date().getFullYear()} {NOM_ORGANISATION}. {t.footer.copyright}
          <span className="mx-2 text-white/25">|</span>
          {t.footer.republique}
        </p>
        <Link href="/login" className="inline-flex items-center gap-1.5 text-white/75 hover:text-gold-500">
          {t.footer.espaceGed}
          <IconeFleche className="h-3.5 w-3.5" />
        </Link>
      </div>
    </footer>
  );
}
