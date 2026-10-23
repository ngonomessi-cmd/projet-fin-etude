"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RubanOrganisation } from "@/components/RubanOrganisation";
import { NOM_ORGANISATION } from "@/lib/organisation";
import { DICTIONNAIRE, prefixeLocale, type Locale } from "@/lib/i18n/dictionnaire";

export function PiedDePagePublic() {
  const pathname = usePathname();
  const locale: Locale = pathname.startsWith("/en") ? "en" : "fr";
  const t = DICTIONNAIRE[locale];
  const p = prefixeLocale(locale);

  return (
    <footer className="border-t border-navy-line bg-navy-950 text-white/70">
      <RubanOrganisation />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-8">
        <div>
          <p className="font-serif text-lg font-semibold text-white">{NOM_ORGANISATION}</p>
          <p className="mt-2 text-sm leading-relaxed">{t.footer.description}</p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white/50">{t.footer.navTitre}</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href={`${p}/missions`} className="hover:text-gold-500 hover:underline">
                {t.nav.missions}
              </Link>
            </li>
            <li>
              <Link href={`${p}/services`} className="hover:text-gold-500 hover:underline">
                {t.nav.services}
              </Link>
            </li>
            <li>
              <Link href={`${p}/actualites`} className="hover:text-gold-500 hover:underline">
                {t.nav.actualites}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white/50">{t.footer.accesTitre}</p>
          <p className="mt-3 text-sm leading-relaxed">{t.footer.accesDescription}</p>
          <Link
            href="/login"
            className="mt-3 inline-block rounded-md bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-600"
          >
            {t.footer.accesCta}
          </Link>
        </div>
      </div>

      <div className="border-t border-navy-line px-4 py-4 text-center text-xs text-white/40 sm:px-8">
        © {new Date().getFullYear()} {NOM_ORGANISATION}. {t.footer.copyright}
      </div>
    </footer>
  );
}
