"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CONTACT_ORGANISATION, NOM_ORGANISATION, NOM_ORGANISATION_EN, URL_LOGO_ORGANISATION } from "@/lib/organisation";
import { LogoOrganisation } from "@/components/LogoOrganisation";
import { DICTIONNAIRE, cheminAutreLocale, prefixeLocale, type Locale } from "@/lib/i18n/dictionnaire";
import { IconeEnveloppe, IconeFleche, IconeTelephone } from "@/components/site-public/IconesSite";

// En-tête du site public, sur deux étages : identité et coordonnées sur fond
// blanc, puis barre de navigation bleu nuit avec le bouton de contact.
export function EnTetePublic() {
  const pathname = usePathname();
  const locale: Locale = pathname.startsWith("/en") ? "en" : "fr";
  const t = DICTIONNAIRE[locale];
  const p = prefixeLocale(locale);
  const accueil = p || "/";
  const [menuOuvert, setMenuOuvert] = useState(false);

  useEffect(() => {
    setMenuOuvert(false);
  }, [pathname]);

  const nomPrincipal = locale === "en" ? NOM_ORGANISATION_EN : NOM_ORGANISATION;
  const nomSecondaire = locale === "en" ? NOM_ORGANISATION : NOM_ORGANISATION_EN;
  const { telephone, email } = CONTACT_ORGANISATION;

  const liens = [
    { href: accueil, label: t.nav.accueil, actif: pathname === accueil },
    { href: `${p}/missions`, label: t.nav.agence, actif: pathname.startsWith(`${p}/missions`) },
    { href: `${p}/investir`, label: t.nav.investir, actif: pathname.startsWith(`${p}/investir`) },
    { href: `${p}/investir#secteurs`, label: t.nav.secteurs, actif: false },
    { href: `${p}/services`, label: t.nav.accompagnement, actif: pathname.startsWith(`${p}/services`) },
    { href: `${p}/investir#regions`, label: t.nav.regions, actif: false },
    { href: `${p}/actualites`, label: t.nav.actualites, actif: pathname.startsWith(`${p}/actualites`) },
  ];
  const contactActif = pathname.startsWith(`${p}/contact`);

  return (
    <header className="sticky top-0 z-40 shadow-[0_1px_0_rgba(0,24,61,0.08)]">
      {/* Étage 1 : identité, coordonnées, langue */}
      <div className="bg-white">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-8">
          <Link href={accueil} className="flex min-w-0 items-center gap-3.5">
            {URL_LOGO_ORGANISATION ? (
              <Image
                src={URL_LOGO_ORGANISATION}
                alt=""
                width={140}
                height={100}
                priority
                className="h-12 w-auto shrink-0 object-contain"
              />
            ) : (
              <LogoOrganisation taille="lg" />
            )}
            <span className="hidden min-w-0 border-l border-slate-200 pl-3.5 sm:block">
              <span className="block truncate font-serif text-[15px] font-semibold leading-tight text-encre-900">
                {nomPrincipal}
              </span>
              {nomSecondaire !== nomPrincipal && (
                <span className="mt-0.5 block truncate text-[12.5px] italic leading-tight text-slate-500">{nomSecondaire}</span>
              )}
            </span>
          </Link>

          <div className="flex items-center gap-5">
            {telephone && (
              <a
                href={`tel:${telephone.replace(/\s+/g, "")}`}
                className="hidden items-center gap-2 text-[13px] font-medium text-encre-900 hover:text-gold-600 xl:flex"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-50 text-gold-600">
                  <IconeTelephone className="h-4 w-4" />
                </span>
                {telephone}
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="hidden items-center gap-2 text-[13px] font-medium text-encre-900 hover:text-gold-600 xl:flex"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-50 text-gold-600">
                  <IconeEnveloppe className="h-4 w-4" />
                </span>
                {email}
              </a>
            )}
            <div className="flex items-center gap-0.5 rounded-full border border-slate-200 p-0.5 text-xs font-semibold">
              {(["fr", "en"] as const).map((l) => (
                <Link
                  key={l}
                  href={cheminAutreLocale(pathname, l)}
                  className={`rounded-full px-2.5 py-1 uppercase transition-colors ${
                    locale === l ? "bg-encre-950 text-white" : "text-slate-500 hover:text-encre-900"
                  }`}
                >
                  {l}
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setMenuOuvert((v) => !v)}
              aria-expanded={menuOuvert}
              aria-label={menuOuvert ? (locale === "en" ? "Close menu" : "Fermer le menu") : locale === "en" ? "Open menu" : "Ouvrir le menu"}
              className="flex h-10 w-10 items-center justify-center rounded-md text-encre-900 hover:bg-slate-100 lg:hidden"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                {menuOuvert ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Étage 2 : navigation (grand écran) */}
      <div className="hidden bg-encre-950 lg:block">
        <div className="mx-auto flex h-[52px] max-w-7xl items-stretch justify-between gap-6 px-4 sm:px-8">
          <nav className="flex items-stretch gap-1 xl:gap-2">
            {liens.map(({ href, label, actif }) => (
              <Link
                key={href}
                href={href}
                aria-current={actif ? "page" : undefined}
                className={`relative flex items-center px-2.5 text-[13.5px] font-medium transition-colors xl:px-3 ${
                  actif ? "text-gold-500" : "text-white/90 hover:text-gold-500"
                }`}
              >
                {label}
                {actif && <span className="absolute inset-x-2.5 bottom-0 h-[3px] rounded-t bg-gold-500" />}
              </Link>
            ))}
          </nav>
          <div className="flex items-center">
            <Link
              href={`${p}/contact`}
              aria-current={contactActif ? "page" : undefined}
              className="inline-flex items-center gap-2 rounded-full bg-gold-500 px-5 py-2 text-[13px] font-semibold text-encre-950 shadow-sm transition-colors hover:bg-gold-600 hover:text-white"
            >
              {t.nav.nousContacter}
              <IconeFleche className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Menu déroulant (téléphone et tablette) */}
      <nav className={`flex-col bg-encre-950 px-4 py-2 shadow-lg sm:px-8 lg:hidden ${menuOuvert ? "flex" : "hidden"}`}>
        {[...liens, { href: `${p}/contact`, label: t.nav.contact, actif: contactActif }].map(({ href, label, actif }) => (
          <Link
            key={href}
            href={href}
            aria-current={actif ? "page" : undefined}
            className={`border-b border-white/10 py-3.5 text-[15px] font-medium last:border-b-0 ${
              actif ? "text-gold-500" : "text-white"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
