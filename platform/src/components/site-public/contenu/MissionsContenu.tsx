import Link from "next/link";
import { DICTIONNAIRE, prefixeLocale, type Locale } from "@/lib/i18n/dictionnaire";
import { BlocPhotoProvisoire } from "@/components/site-public/BlocPhotoProvisoire";

const ICONES = [
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
    <path d="M8 13 3 18l1.5 1.5L10 14" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 11 19 6l1.5 1.5L15 13" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 13l3 3M14 11l-3-3" strokeLinecap="round" />
  </svg>,
  <svg key="4" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M4 18 10 9l4 5 6-9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 5h4v4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
] as const;

export function MissionsContenu({ locale }: { locale: Locale }) {
  const t = DICTIONNAIRE[locale];
  const p = prefixeLocale(locale);
  const [premiere, ...reste] = t.missions.items;

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden="true">
          <svg width="100%" height="100%">
            <pattern id="grille-missions" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grille-missions)" />
          </svg>
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-8 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-gold-500">{t.missions.titre}</p>
          <h1 className="mt-3 max-w-2xl font-serif text-3xl font-semibold leading-tight sm:text-4xl">{t.missionsTeaser.titre}</h1>
          <span className="mt-4 block h-1 w-14 bg-gold-500" aria-hidden="true" />
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">{t.missions.intro}</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-8">
        {/* Mission vedette */}
        <div className="grid items-center gap-8 rounded-lg border border-paper-200 p-6 sm:p-8 lg:grid-cols-2">
          <div>
            <span className="font-serif text-sm font-semibold text-gold-600">01</span>
            <h2 className="mt-1 font-serif text-xl font-semibold text-navy-950 sm:text-2xl">{premiere.titre}</h2>
            <span className="mt-3 block h-1 w-10 bg-gold-500" aria-hidden="true" />
            <p className="mt-4 text-sm leading-relaxed text-paper-muted sm:text-base">{premiere.description}</p>
          </div>
          <BlocPhotoProvisoire className="hidden aspect-video rounded-lg lg:block" />
        </div>

        {/* Missions suivantes */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {reste.map((mission, index) => (
            <div key={mission.titre} className="flex gap-5 rounded-lg border border-paper-200 p-6">
              <div className="min-w-0 flex-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-500 text-gold-600">
                  {ICONES[index + 1]}
                </div>
                <h3 className="mt-3 font-serif text-base font-semibold text-navy-950">{mission.titre}</h3>
                <span className="mt-2 block h-1 w-8 bg-gold-500" aria-hidden="true" />
                <p className="mt-3 text-sm leading-relaxed text-paper-muted">{mission.description}</p>
              </div>
              <BlocPhotoProvisoire className="hidden aspect-square w-28 shrink-0 self-start rounded-lg sm:block" />
            </div>
          ))}
        </div>
      </div>

      {/* Bande CTA de fermeture */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-8 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gold-500">{t.missionsBande.surtitre}</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">{t.missionsBande.titre}</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">{t.missionsBande.description}</p>
            <Link
              href={`${p}/services`}
              className="mt-7 inline-block rounded-md bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-600"
            >
              {t.missionsBande.cta} →
            </Link>
          </div>

          <div className="relative hidden lg:block">
            <BlocPhotoProvisoire className="aspect-[4/3] rounded-xl" />
            <p className="absolute bottom-4 right-4 max-w-[14rem] text-right font-serif text-sm italic text-white/85">
              {t.missionsBande.tagline}
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
