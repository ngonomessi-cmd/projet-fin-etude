import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { SIGLE_ORGANISATION } from "@/lib/organisation";
import { DICTIONNAIRE, prefixeLocale, type Locale } from "@/lib/i18n/dictionnaire";
import type { ActualitePublique } from "@/lib/types";

// Les photos réelles (skyline + drapeau, route de montagne) n'ont pas encore
// été reçues sous forme de fichier exploitable : bascule à true dès qu'elles
// sont déposées dans public/images/accueil/ et que le JSX ci-dessous est
// adapté pour les afficher (cf. échange avec l'utilisateur).
const PHOTOS_DISPONIBLES = false;

const ICONES_POINTS = [
  <svg key="0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M12 3c2 2.5 3 5 3 7.5A3 3 0 0 1 9 10.5C9 8 10 5.5 12 3Z" strokeLinejoin="round" />
    <path d="M12 21v-9" strokeLinecap="round" />
  </svg>,
  <svg key="1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <circle cx="9" cy="8" r="3" />
    <path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1" strokeLinecap="round" />
    <path d="M17 7.5a2.5 2.5 0 1 1 0 5" strokeLinecap="round" />
  </svg>,
  <svg key="2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M12 21s7-6.5 7-11.5a7 7 0 1 0-14 0C5 14.5 12 21 12 21Z" strokeLinejoin="round" />
    <circle cx="12" cy="9.5" r="2.3" />
  </svg>,
  <svg key="3" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M4 18 10 9l4 5 6-9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 5h4v4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
] as const;

const ICONES_MISSIONS = [
  <svg key="0" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M4 19h16M7 19v-5m5 5V9m5 10V5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
  <svg key="1" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M4 21V9l8-5 8 5v12" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 21v-7h6v7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
  <svg key="2" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
    <path d="M14 3v5h5M9 13h6M9 16h4" strokeLinecap="round" />
  </svg>,
  <svg key="3" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <circle cx="8" cy="8" r="3" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M3 20v-1a5 5 0 0 1 5-5h0a5 5 0 0 1 5 5v1" strokeLinecap="round" />
    <path d="M15 14.5a4 4 0 0 1 4 4V20" strokeLinecap="round" />
  </svg>,
  <svg key="4" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    <path d="M3 19c.6-2.3 2.6-4 6-4s5.4 1.7 6 4" strokeLinecap="round" />
    <path d="M15 8h6M15 12h6M19 16h2" strokeLinecap="round" />
  </svg>,
] as const;

export async function AccueilContenu({ locale }: { locale: Locale }) {
  const t = DICTIONNAIRE[locale];
  const p = prefixeLocale(locale);

  const supabase = await creerClientServeur();
  const { data } = await supabase
    .from("actualites_publiques")
    .select("*")
    .eq("organisation", SIGLE_ORGANISATION)
    .eq("statut", "publie")
    .order("publie_at", { ascending: false })
    .limit(3);
  const actualites = (data ?? []) as ActualitePublique[];

  return (
    <>
      {/* Hero — fond dégradé en attendant la photo réelle (skyline + drapeau) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden="true">
          <svg width="100%" height="100%">
            <pattern id="grille-hero" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grille-hero)" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
          {t.hero.surtitre && (
            <p className="text-sm font-semibold uppercase tracking-wider text-gold-500">{t.hero.surtitre}</p>
          )}
          <h1 className="mt-3 max-w-3xl font-serif text-3xl font-semibold leading-tight sm:text-5xl">{t.hero.titre}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{t.hero.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`${p}/services`}
              className="rounded-md bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-600"
            >
              {t.hero.cta1}
            </Link>
            <Link
              href={`${p}/#pourquoi-investir`}
              className="rounded-md border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              {t.hero.cta2}
            </Link>
          </div>
        </div>
      </section>

      {/* Missions — aperçu + renvoi vers la page dédiée */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-gold-600">{t.missionsTeaser.surtitre}</p>
        <div className="mt-2 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="max-w-xl font-serif text-2xl font-semibold text-navy-950 sm:text-3xl">{t.missionsTeaser.titre}</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-paper-muted">{t.missionsTeaser.description}</p>
          </div>
          <Link
            href={`${p}/missions`}
            className="shrink-0 rounded-md bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-600"
          >
            {t.missionsTeaser.cta} →
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.missions.items.map((mission, index) => (
            <Link
              key={mission.titre}
              href={`${p}/missions`}
              className="group rounded-lg border border-paper-200 p-5 transition-colors hover:border-gold-500"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gold-50 text-gold-600">
                {ICONES_MISSIONS[index]}
              </div>
              <h3 className="mt-4 font-serif text-base font-semibold text-navy-950">{mission.titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper-muted line-clamp-2">{mission.description}</p>
              <span className="mt-3 inline-block text-sm font-medium text-gold-600 group-hover:underline">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Pourquoi investir — fond dégradé en attendant la photo réelle (route/volcan) */}
      <section id="pourquoi-investir" className="relative overflow-hidden bg-navy-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gold-500">{t.pourquoiInvestir.surtitre}</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">{t.pourquoiInvestir.titre}</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">{t.pourquoiInvestir.description}</p>

            <div className="mt-8 grid grid-cols-2 gap-5">
              {t.pourquoiInvestir.points.map((point, index) => (
                <div key={point} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-gold-500">{ICONES_POINTS[index]}</span>
                  <span className="text-sm leading-snug text-white/85">{point}</span>
                </div>
              ))}
            </div>

            <Link
              href={`${p}/missions`}
              className="mt-8 inline-block rounded-md bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-600"
            >
              {t.pourquoiInvestir.cta} →
            </Link>
          </div>

          {!PHOTOS_DISPONIBLES && (
            <div className="hidden aspect-[4/3] rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 lg:block" aria-hidden="true" />
          )}
        </div>
      </section>

      {actualites.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-gold-600">{t.nav.actualites}</p>
          <div className="mt-2 flex items-center justify-between gap-4">
            <h2 className="font-serif text-2xl font-semibold text-navy-950 sm:text-3xl">{t.actualitesRecentes.titre}</h2>
            <Link href={`${p}/actualites`} className="text-sm font-medium text-gold-600 hover:underline">
              {t.actualitesRecentes.lienTout}
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {actualites.map((actualite) => {
              const titre = (locale === "en" && actualite.titre_en) || actualite.titre;
              const extrait = (locale === "en" && actualite.extrait_en) || actualite.extrait;
              return (
                <Link
                  key={actualite.id}
                  href={`${p}/actualites/${actualite.slug}`}
                  className="group rounded-lg border border-paper-200 p-5 transition-colors hover:border-gold-500"
                >
                  {actualite.publie_at && (
                    <p className="text-xs font-medium uppercase tracking-wide text-paper-soft">
                      {new Date(actualite.publie_at).toLocaleDateString(t.dateLocale, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  <h3 className="mt-2 font-serif text-base font-semibold text-navy-950">{titre}</h3>
                  {extrait && <p className="mt-2 text-sm leading-relaxed text-paper-muted line-clamp-3">{extrait}</p>}
                  <span className="mt-3 inline-block text-sm font-medium text-gold-600 group-hover:underline">
                    {t.actualitesRecentes.lireLaSuite}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
