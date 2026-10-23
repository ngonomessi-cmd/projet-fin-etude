import Image from "next/image";
import Link from "next/link";
import { DICTIONNAIRE, prefixeLocale, type Locale } from "@/lib/i18n/dictionnaire";
import {
  IconeCourbeBarres,
  IconeFleche,
  IconeMegaphone,
  IconePersonnes,
  IconePoigneeMain,
  IconePresseDocuments,
} from "@/components/site-public/IconesSite";

const ICONES = [IconePersonnes, IconeMegaphone, IconePresseDocuments, IconePoigneeMain, IconeCourbeBarres];
const PHOTOS = [1, 2, 3, 4, 5].map((n) => `/images/site/mission-${n}.jpg`);

function EnTeteMission({ index, titre, grand = false }: { index: number; titre: string; grand?: boolean }) {
  const Icone = ICONES[index];
  return (
    <div className="flex items-start gap-5">
      <span
        className={`flex shrink-0 items-center justify-center rounded-full border-2 border-gold-500 text-gold-500 ${
          grand ? "h-[4.5rem] w-[4.5rem]" : "h-16 w-16"
        }`}
      >
        <Icone className={grand ? "h-9 w-9" : "h-8 w-8"} />
      </span>
      <div className="pt-1">
        <p className="font-serif text-base font-semibold text-gold-500">{String(index + 1).padStart(2, "0")}</p>
        <h2 className={`mt-1 font-serif font-semibold leading-tight text-encre-900 ${grand ? "text-2xl sm:text-[1.7rem]" : "text-xl"}`}>
          {titre}
        </h2>
        <span className="mt-4 block h-0.5 w-8 bg-gold-500" aria-hidden="true" />
      </div>
    </div>
  );
}

export function MissionsContenu({ locale }: { locale: Locale }) {
  const t = DICTIONNAIRE[locale];
  const p = prefixeLocale(locale);
  const [premiere, ...suivantes] = t.missions.items;

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-encre-950 text-white">
        <div className="absolute inset-y-0 right-0 -z-10 w-full lg:w-[68%]">
          <Image
            src="/images/site/hero-missions.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 68vw, 100vw"
            className="object-cover object-[65%_center]"
          />
          <div className="absolute inset-0 bg-encre-950/70 lg:bg-transparent lg:bg-gradient-to-r lg:from-encre-950 lg:via-encre-950/20 lg:to-transparent" />
        </div>

        <div className="mx-auto flex max-w-7xl flex-col justify-center px-4 py-16 sm:px-8 lg:min-h-[420px]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-500 sm:text-sm">{t.missionsHero.surtitre}</p>
          <h1 className="mt-4 max-w-md font-serif text-4xl font-semibold leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
            {t.missionsHero.titre}
          </h1>
          <p className="mt-5 max-w-sm text-base leading-relaxed text-white/90 sm:text-lg">{t.missionsHero.description}</p>
          <span className="mt-8 block h-[3px] w-14 bg-gold-500" aria-hidden="true" />
        </div>
      </section>

      <div className="bg-white">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-14 sm:px-8">
          {/* Mission 01 — carte pleine largeur */}
          <article className="grid overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_4px_24px_rgba(0,24,61,0.07)] lg:grid-cols-2">
            <div className="p-7 sm:p-10">
              <EnTeteMission index={0} titre={premiere.titre} grand />
              <p className="mt-6 text-[15px] leading-relaxed text-slate-600 sm:pl-[5.75rem]">{premiere.description}</p>
            </div>
            <div className="relative min-h-[240px] lg:m-2 lg:ml-0 lg:overflow-hidden lg:rounded-lg">
              <Image src={PHOTOS[0]} alt="" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            </div>
          </article>

          {/* Missions 02 à 05 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {suivantes.map((mission, i) => {
              const index = i + 1;
              return (
                <article
                  key={mission.titre}
                  className="grid overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_4px_24px_rgba(0,24,61,0.07)] sm:grid-cols-[minmax(0,1fr)_38%]"
                >
                  <div className="p-6 sm:p-7">
                    <EnTeteMission index={index} titre={mission.titre} />
                    <p className="mt-6 text-sm leading-relaxed text-slate-600">{mission.description}</p>
                  </div>
                  <div className="relative min-h-[200px] sm:m-2 sm:ml-0 sm:overflow-hidden sm:rounded-lg">
                    <Image src={PHOTOS[index]} alt="" fill sizes="(min-width: 1024px) 18vw, (min-width: 640px) 38vw, 100vw" className="object-cover" />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bande de fermeture */}
      <section className="relative isolate overflow-hidden bg-encre-950 text-white">
        <div className="absolute inset-y-0 right-0 -z-10 hidden w-[58%] lg:block">
          <Image
            src="/images/site/bande-partenaire.jpg"
            alt=""
            fill
            sizes="58vw"
            className="object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-encre-950 via-encre-950/10 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:min-h-[340px] lg:py-20">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-500">{t.missionsBande.surtitre}</p>
            <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight sm:text-[2.3rem]">{t.missionsBande.titre}</h2>
            <p className="mt-5 text-[15px] leading-relaxed text-white/90">{t.missionsBande.description}</p>
            <Link
              href={`${p}/services`}
              className="mt-8 inline-flex items-center gap-2.5 rounded-md bg-gold-500 px-6 py-3.5 text-sm font-semibold text-encre-950 transition-colors hover:bg-gold-600"
            >
              {t.missionsBande.cta}
              <IconeFleche className="h-4 w-4" />
            </Link>
          </div>

          <div className="absolute bottom-8 right-8 hidden max-w-[19rem] rounded-md bg-encre-950/85 px-6 py-5 backdrop-blur-sm lg:block">
            <p className="font-serif text-lg font-semibold italic leading-snug">{t.missionsBande.tagline}</p>
            <span className="mt-4 block h-0.5 w-12 bg-gold-500" aria-hidden="true" />
          </div>
        </div>
      </section>
    </>
  );
}
