import Image from "next/image";
import Link from "next/link";
import { DICTIONNAIRE, prefixeLocale, type Locale } from "@/lib/i18n/dictionnaire";
import { STYLE_SECTEURS } from "@/components/site-public/CarteSecteur";
import { CarteCameroun } from "@/components/site-public/CarteCameroun";
import { IconeEpingle, IconeFleche } from "@/components/site-public/IconesSite";

// Page « Investir au Cameroun » : les six secteurs prioritaires (ancres
// #secteur-<cle>, liées depuis les cartes de l'accueil) et la carte des dix
// régions avec leur chef-lieu (ancre #regions).
export function InvestirContenu({ locale }: { locale: Locale }) {
  const t = DICTIONNAIRE[locale];
  const p = prefixeLocale(locale);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-encre-950 text-white">
        <Image src="/images/site/hero-accueil.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover object-[70%_center]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-encre-950/95 via-encre-950/75 to-encre-950/20" />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:py-20">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold-500 sm:text-sm">
            <span className="h-0.5 w-8 bg-gold-500" />
            {t.investir.surtitre}
          </p>
          <h1 className="mt-5 max-w-2xl font-serif text-4xl font-semibold leading-[1.1] sm:text-5xl">{t.investir.titre}</h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/90">{t.investir.description}</p>
        </div>
      </section>

      {/* Secteurs */}
      <section id="secteurs" className="scroll-mt-32 bg-brume">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
          <h2 className="flex items-center gap-3 font-serif text-2xl font-semibold text-encre-900 sm:text-[1.9rem]">
            <span className="h-7 w-1 rounded-full bg-gold-500" />
            {t.investir.secteursTitre}
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.secteurs.items.map((secteur) => {
              const { Icone, teinte } = STYLE_SECTEURS[secteur.cle];
              return (
                <article
                  key={secteur.cle}
                  id={`secteur-${secteur.cle}`}
                  className="scroll-mt-36 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(0,24,61,0.05)] target:ring-2 target:ring-gold-500"
                >
                  <div
                    className="relative flex h-24 items-end overflow-hidden px-6 pb-4"
                    style={{ background: `linear-gradient(160deg, ${teinte} 0%, #00183d 90%)` }}
                  >
                    <span className="absolute -right-4 -top-6 text-white/10">
                      <Icone className="h-32 w-32" />
                    </span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-500 text-encre-950">
                      <Icone className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="font-serif text-lg font-semibold text-encre-900">{secteur.titre}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{secteur.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Régions */}
      <section id="regions" className="scroll-mt-32 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:items-start">
          <div className="lg:sticky lg:top-36">
            <h2 className="flex items-center gap-3 font-serif text-2xl font-semibold text-encre-900 sm:text-[1.9rem]">
              <span className="h-7 w-1 rounded-full bg-gold-500" />
              {t.investir.regionsTitre}
            </h2>
            <p className="mt-3 text-[15px] text-slate-600">{t.investir.regionsIntro}</p>
            <div className="mt-6 rounded-2xl bg-gold-50 p-6">
              <CarteCameroun
                variante="clair"
                points={t.investir.regions.map((r) => r.ville)}
                etiquettes
                actif="yaounde"
                className="mx-auto h-[26rem] w-auto max-w-full"
              />
            </div>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {t.investir.regions.map((region) => (
              <li key={region.ville} className="rounded-xl border border-slate-200 p-5 transition-colors hover:border-gold-500">
                <p className="font-serif text-lg font-semibold text-encre-900">{region.nom}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-gold-600">
                  <IconeEpingle className="h-4 w-4" />
                  {t.investir.chefLieu} : {region.chefLieu}
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{region.atouts}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-encre-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 py-12 sm:px-8">
          <p className="font-serif text-2xl font-semibold">{t.investir.projetTitre}</p>
          <Link
            href={`${p}/contact`}
            className="inline-flex items-center gap-2.5 rounded-full bg-gold-500 px-6 py-3.5 text-sm font-semibold text-encre-950 transition-colors hover:bg-gold-600 hover:text-white"
          >
            {t.investir.projetCta}
            <IconeFleche className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
