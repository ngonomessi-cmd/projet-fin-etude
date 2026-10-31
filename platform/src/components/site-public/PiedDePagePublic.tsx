"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RubanOrganisation } from "@/components/RubanOrganisation";
import { LogoOrganisation } from "@/components/LogoOrganisation";
import { CONTACT_ORGANISATION, URL_LOGO_ORGANISATION, nomOrganisation } from "@/lib/organisation";
import { DICTIONNAIRE, prefixeLocale, type Locale } from "@/lib/i18n/dictionnaire";
import { IconeFleche } from "@/components/site-public/IconesSite";

const trait = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function IconeLieu() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-gold-500" aria-hidden="true" {...trait}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

function IconeTelephone() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-gold-500" aria-hidden="true" {...trait}>
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

function IconeCourriel() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-gold-500" aria-hidden="true" {...trait}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6.5L20.5 7" />
    </svg>
  );
}

function IconeBouclier() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 text-gold-500" aria-hidden="true" {...trait}>
      <path d="M12 3 5 5.8v5.6c0 4.4 2.9 8.2 7 9.6 4.1-1.4 7-5.2 7-9.6V5.8L12 3Z" />
      <rect x="9.2" y="10.8" width="5.6" height="4.2" rx="0.8" />
      <path d="M10.4 10.8V9.6a1.6 1.6 0 0 1 3.2 0v1.2" />
    </svg>
  );
}

function EtoileDrapeau({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
      <polygon points="50,4 61.8,36.6 96.5,37.8 69,59 78.8,92.2 50,72.8 21.2,92.2 31,59 3.5,37.8 38.2,36.6" />
      <polygon points="50,20 56,38 75,38.7 60,50 65.4,68.4 50,57.6 34.6,68.4 40,50 25,38.7 44,38" opacity="0.5" />
    </svg>
  );
}

export function PiedDePagePublic() {
  const pathname = usePathname();
  const locale: Locale = pathname.startsWith("/en") ? "en" : "fr";
  const t = DICTIONNAIRE[locale];
  const p = prefixeLocale(locale);
  const contact = CONTACT_ORGANISATION;

  const colonnes = [
    {
      titre: t.footer.aProposTitre,
      liens: [
        { href: p || "/", label: t.nav.accueil },
        { href: `${p}/missions`, label: t.nav.missions },
      ],
    },
    {
      titre: t.footer.investirTitre,
      liens: [
        { href: `${p}/services`, label: t.nav.services },
        { href: `${p}/actualites`, label: t.nav.actualites },
      ],
    },
    {
      titre: t.footer.pratiqueTitre,
      liens: [
        { href: "/verifier", label: t.footer.verifier },
        { href: `${p}/contact`, label: t.footer.ecrire },
      ],
    },
  ];

  return (
    <footer className="bg-encre-950 text-white">
      <RubanOrganisation className="h-1! rounded-none!" />

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <Link href={p || "/"} className="flex items-center gap-3">
          {URL_LOGO_ORGANISATION ? (
            <span className="flex h-12 shrink-0 items-center rounded-md bg-white px-2">
              <Image src={URL_LOGO_ORGANISATION} alt="" width={110} height={85} className="h-9 w-auto object-contain" />
            </span>
          ) : (
            <LogoOrganisation taille="lg" />
          )}
          <span className="max-w-[15rem] font-serif text-sm font-semibold leading-snug">{nomOrganisation(locale)}</span>
        </Link>
        <p className="max-w-[18rem] font-serif text-sm italic leading-snug text-white/90 lg:text-right">{t.footer.tagline}</p>
      </div>

      <div className="mx-auto grid max-w-7xl gap-x-0 gap-y-9 px-4 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {colonnes.map((col) => (
          <nav key={col.titre} aria-label={col.titre} className="lg:border-r lg:border-white/10 lg:pr-8 lg:pl-8 lg:first:pl-0">
            <h2 className="font-serif text-base font-medium uppercase tracking-wide text-gold-500">{col.titre}</h2>
            <ul className="mt-5 space-y-3 text-[0.95rem] text-white/90">
              {col.liens.map((lien) => (
                <li key={lien.href + lien.label}>
                  <Link href={lien.href} className="hover:text-gold-500">
                    {lien.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="lg:pl-8">
          <h2 className="font-serif text-base font-medium uppercase tracking-wide text-gold-500">{t.footer.contactTitre}</h2>
          <ul className="mt-5 space-y-3.5 text-[0.95rem] text-white/90">
            {contact.adresse && (
              <li className="flex items-start gap-3">
                <IconeLieu />
                <span>{contact.adresse}</span>
              </li>
            )}
            {contact.telephone && (
              <li className="flex items-start gap-3">
                <IconeTelephone />
                <a href={`tel:${contact.telephone.replace(/\s/g, "")}`} className="hover:text-gold-500">
                  {contact.telephone}
                </a>
              </li>
            )}
            {contact.email && (
              <li className="flex items-start gap-3">
                <IconeCourriel />
                <a href={`mailto:${contact.email}`} className="break-all hover:text-gold-500">
                  {contact.email}
                </a>
              </li>
            )}
          </ul>
          <div className="mt-5 rounded-sm border border-white/10 bg-white/[0.04] px-5 py-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold-500">{t.footer.horairesTitre}</p>
            <p className="mt-3 text-sm text-white/70">{locale === "en" ? contact.joursEn : contact.jours}</p>
            <p className="mt-1 font-serif text-xl text-white">{contact.heures}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <Link
          href="/login"
          className="group relative block overflow-hidden rounded-lg border border-white/15 bg-gradient-to-r from-white/[0.09] via-white/[0.04] to-white/[0.02] transition hover:border-gold-500/60"
        >
          <RubanOrganisation className="h-1! rounded-none!" />
          <EtoileDrapeau className="pointer-events-none absolute right-40 top-1/2 hidden h-64 w-64 -translate-y-1/2 text-gold-500/15 transition group-hover:text-gold-500/25 sm:block" />
          <div className="relative flex flex-col gap-6 px-6 py-7 sm:px-9 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold-500/50 bg-encre-950/60">
                <IconeBouclier />
              </span>
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-gold-500">{t.footer.gedSurtitre}</p>
                <h2 className="mt-1.5 font-serif text-2xl font-medium text-white">{t.footer.espaceGed}</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">{t.footer.gedDescription}</p>
              </div>
            </div>
            <span className="relative inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-sm bg-gold-500 px-6 py-3 text-sm font-semibold text-encre-950 transition group-hover:bg-gold-600 md:self-center">
              {t.footer.gedCta}
              <IconeFleche className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/10 px-4 py-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="space-y-1">
          <p>
            © {new Date().getFullYear()} {nomOrganisation(locale)}. {t.footer.copyright}
            <span className="mx-2 text-white/25">|</span>
            {t.footer.republique}
          </p>
          <p>
            {locale === "en" ? "Design & development: RECERT" : "Conception & développement : RECERT"} (
            <a href="https://my-recert.com" target="_blank" rel="noopener noreferrer" className="text-gold-500 hover:underline">
              my-recert.com
            </a>
            )
          </p>
        </div>
      </div>
    </footer>
  );
}
