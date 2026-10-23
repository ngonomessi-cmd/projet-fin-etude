"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NOM_ORGANISATION, URL_LOGO_ORGANISATION } from "@/lib/organisation";
import { LogoOrganisation } from "@/components/LogoOrganisation";
import { DICTIONNAIRE, cheminAutreLocale, prefixeLocale, type Locale } from "@/lib/i18n/dictionnaire";
import {
  IconeBatiment,
  IconeEnveloppe,
  IconeFleche,
  IconeJournal,
  IconeMaison,
  IconeMallette,
} from "@/components/site-public/IconesSite";

export function EnTetePublic() {
  const pathname = usePathname();
  const locale: Locale = pathname.startsWith("/en") ? "en" : "fr";
  const t = DICTIONNAIRE[locale];
  const p = prefixeLocale(locale);
  const accueil = p || "/";

  const liens = [
    { href: accueil, label: t.nav.accueil, Icone: IconeMaison, actif: pathname === accueil },
    { href: `${p}/missions`, label: t.nav.missions, Icone: IconeBatiment, actif: pathname.startsWith(`${p}/missions`) },
    { href: `${p}/services`, label: t.nav.services, Icone: IconeMallette, actif: pathname.startsWith(`${p}/services`) },
    { href: `${p}/actualites`, label: t.nav.actualites, Icone: IconeJournal, actif: pathname.startsWith(`${p}/actualites`) },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-stretch justify-between gap-6 px-4 sm:px-8">
        <Link href={accueil} className="flex min-w-0 items-center gap-3">
          {URL_LOGO_ORGANISATION ? (
            <Image
              src={URL_LOGO_ORGANISATION}
              alt=""
              width={130}
              height={100}
              priority
              className="h-11 w-auto shrink-0 object-contain"
            />
          ) : (
            <LogoOrganisation taille="lg" />
          )}
          <span className="hidden font-serif text-[15px] font-semibold leading-tight text-encre-900 sm:block">
            {NOM_ORGANISATION}
          </span>
        </Link>

        <div className="flex items-stretch gap-6">
          <nav className="hidden items-stretch gap-7 lg:flex">
            {liens.map(({ href, label, Icone, actif }) => (
              <Link
                key={href}
                href={href}
                aria-current={actif ? "page" : undefined}
                className={`flex items-center gap-2 border-b-2 pt-0.5 text-sm font-medium transition-colors ${
                  actif ? "border-gold-500 text-gold-600" : "border-transparent text-encre-900 hover:text-gold-600"
                }`}
              >
                <Icone className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href={`${p}/contact`}
              className={`hidden items-center gap-2 rounded-md border px-4 py-2 text-[13px] font-semibold transition-colors md:inline-flex ${
                pathname.startsWith(`${p}/contact`)
                  ? "border-gold-500 bg-gold-500 text-encre-950"
                  : "border-gold-500 text-gold-600 hover:bg-gold-500 hover:text-encre-950"
              }`}
            >
              {t.nav.nousContacter}
              <IconeFleche className="h-3.5 w-3.5" />
            </Link>
            <div className="flex items-center gap-0.5 rounded-md border border-slate-200 p-0.5 text-xs font-semibold">
              {(["fr", "en"] as const).map((l) => (
                <Link
                  key={l}
                  href={cheminAutreLocale(pathname, l)}
                  className={`rounded px-2 py-1 uppercase transition-colors ${
                    locale === l ? "bg-encre-950 text-white" : "text-slate-500 hover:text-encre-900"
                  }`}
                >
                  {l}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <nav className="flex gap-5 overflow-x-auto border-t border-slate-100 px-4 py-2 sm:px-8 lg:hidden">
        {[
          ...liens,
          { href: `${p}/contact`, label: t.nav.contact, Icone: IconeEnveloppe, actif: pathname.startsWith(`${p}/contact`) },
        ].map(({ href, label, Icone, actif }) => (
          <Link
            key={href}
            href={href}
            className={`flex shrink-0 items-center gap-1.5 text-sm font-medium ${actif ? "text-gold-600" : "text-encre-900"}`}
          >
            <Icone className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
