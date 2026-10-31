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
        { href: `${p}/actualites`, label: t.nav.actualites },
      ],
    },
    {
      titre: t.footer.investirTitre,
      liens: [
        { href: `${p}/services`, label: t.nav.services },
        { href: `${p}/contact`, label: t.footer.ecrire },
      ],
    },
    {
      titre: t.footer.pratiqueTitre,
      liens: [
        { href: "/verifier", label: t.footer.verifier },
        { href: "/login", label: t.footer.espaceGed },
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

      <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-white/10 px-4 py-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-8">
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
        <Link href="/login" className="inline-flex items-center gap-1.5 text-white/75 hover:text-gold-500">
          {t.footer.espaceGed}
          <IconeFleche className="h-3.5 w-3.5" />
        </Link>
      </div>
    </footer>
  );
}
