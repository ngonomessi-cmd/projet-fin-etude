import Image from "next/image";
import Link from "next/link";
import { DICTIONNAIRE, prefixeLocale, type Locale } from "@/lib/i18n/dictionnaire";
import {
  IconeBoussole,
  IconeColonnes,
  IconeDocument,
  IconeEngrenage,
  IconeFeuille,
  IconeFleche,
  IconeInstitution,
  IconeLivre,
  IconePersonne,
  IconePersonnes,
} from "@/components/site-public/IconesSite";

// Photos découpées en diagonale (le triangle haut-gauche est blanc dans le
// fichier même) : largeur/hauteur réelles pour un rendu sans recadrage.
const CARTES = [
  { Icone: IconeLivre, photo: "/images/site/service-1.jpg", l: 586, h: 292 },
  { Icone: IconeBoussole, photo: "/images/site/service-2.jpg", l: 580, h: 276 },
  { Icone: IconeDocument, photo: "/images/site/service-3.jpg", l: 584, h: 290 },
  { Icone: IconeInstitution, photo: "/images/site/service-4.jpg", l: 882, h: 336 },
  { Icone: IconeColonnes, photo: "/images/site/service-5.jpg", l: 906, h: 312 },
];
const ICONES_CONFIANCE = [IconePersonne, IconePersonnes, IconeEngrenage, IconeFeuille];

export function ServicesContenu({ locale }: { locale: Locale }) {
  const t = DICTIONNAIRE[locale];
  const p = prefixeLocale(locale);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-encre-950 text-white">
        <div className="absolute inset-y-0 right-0 -z-10 w-full lg:w-[62%]">
          <Image
            src="/images/site/hero-accueil.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 62vw, 100vw"
            className="object-cover object-right"
          />
          <div className="absolute inset-0 bg-encre-950/70 lg:bg-transparent lg:bg-gradient-to-r lg:from-encre-950 lg:via-encre-950/25 lg:to-transparent" />
        </div>

        <div className="mx-auto flex max-w-7xl flex-col justify-center px-4 py-16 sm:px-8 lg:min-h-[440px]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-500 sm:text-sm">{t.servicesHero.surtitre}</p>
          <h1 className="mt-4 max-w-2xl font-serif text-4xl font-semibold leading-[1.1] sm:text-5xl lg:text-[3.3rem]">
            {t.servicesHero.titre}
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/90">{t.servicesHero.description}</p>
        </div>
      </section>

      {/* Les cinq services */}
      <section className="bg-brume">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-gold-600">
              <span className="h-0.5 w-6 bg-gold-500" aria-hidden="true" />
              {t.servicesIntro.surtitre}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-encre-900 sm:text-[2.2rem]">
              {t.servicesIntro.titre}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-600">{t.servicesIntro.description}</p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-6">
            {t.services.items.map((service, index) => {
              const { Icone, photo, l, h } = CARTES[index];
              const large = index >= 3;
              return (
                <article
                  key={service.titre}
                  className={`group flex flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_4px_24px_rgba(0,24,61,0.07)] ${
                    large ? "lg:col-span-3" : "lg:col-span-2"
                  }`}
                >
                  <div className="p-6 pb-0 sm:p-7 sm:pb-0">
                    <div className="flex items-start gap-4">
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gold-100 text-encre-900">
                        <Icone className="h-8 w-8" />
                      </span>
                      <div className="pt-1.5">
                        <p className="font-serif text-base font-semibold text-gold-500">{String(index + 1).padStart(2, "0")}</p>
                        <h3 className="mt-1 font-serif text-lg font-semibold leading-snug text-encre-900">{service.titre}</h3>
                      </div>
                    </div>
                    <span className="mt-5 block h-0.5 w-8 bg-gold-500" aria-hidden="true" />
                    <p className={`mt-4 text-sm leading-relaxed text-slate-600 ${large ? "max-w-md" : ""}`}>{service.description}</p>
                  </div>
                  {/* Le lien se loge dans le triangle blanc de la photo, comme sur la maquette */}
                  <div className="relative mt-auto pt-2">
                    <Image
                      src={photo}
                      alt=""
                      width={l}
                      height={h}
                      sizes={large ? "(min-width: 1024px) 45vw, 100vw" : "(min-width: 1024px) 30vw, 100vw"}
                      className="h-auto w-full"
                    />
                    <Link
                      href={`${p}/contact?service=${index + 1}`}
                      className="absolute left-6 top-[14%] inline-flex items-center gap-2 text-sm font-semibold text-encre-900 hover:text-gold-600 sm:left-7"
                    >
                      {t.servicesIntro.decouvrir}
                      <IconeFleche className="h-4 w-4 text-gold-500 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pourquoi choisir l'agence */}
      <section className="relative isolate overflow-hidden bg-encre-950 text-white">
        <div className="absolute inset-y-0 right-0 -z-10 w-full lg:w-[62%]">
          <Image src="/images/site/paysage-confiance.jpg" alt="" fill sizes="(min-width: 1024px) 62vw, 100vw" className="object-cover object-top" />
          <div className="absolute inset-0 bg-encre-950/75 lg:bg-transparent lg:bg-gradient-to-r lg:from-encre-950 lg:via-encre-950/45 lg:to-encre-950/10" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-500">{t.confiance.surtitre}</p>
          <h2 className="mt-3 max-w-xl font-serif text-3xl font-semibold leading-tight sm:text-[2.2rem]">{t.confiance.titre}</h2>

          <div className="mt-10 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
              {t.confiance.points.map((point, index) => {
                const Icone = ICONES_CONFIANCE[index];
                return (
                  <li
                    key={point}
                    className={`flex items-center gap-4 lg:px-6 ${index === 0 ? "lg:pl-0" : "lg:border-l lg:border-white/15"}`}
                  >
                    <Icone className="h-9 w-9 shrink-0 text-gold-500" />
                    <span className="max-w-[11rem] text-sm font-semibold leading-snug">{point}</span>
                  </li>
                );
              })}
            </ul>
            <Link
              href={`${p}/missions`}
              className="inline-flex shrink-0 items-center gap-2.5 self-start rounded-md bg-gold-500 px-6 py-3.5 text-sm font-semibold text-encre-950 transition-colors hover:bg-gold-600 xl:self-auto"
            >
              {t.confiance.cta}
              <IconeFleche className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Vous avez un projet ? */}
      <section className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-8 md:flex-row md:items-center md:gap-10">
          <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-lg md:w-72">
            <Image src="/images/site/projet-contact.jpg" alt="" fill sizes="288px" className="object-cover" />
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-2xl font-semibold text-encre-900">{t.projet.titre}</h2>
            <p className="mt-1.5 text-[15px] text-slate-500">{t.projet.description}</p>
          </div>
          <Link
            href={`${p}/contact`}
            className="inline-flex shrink-0 items-center gap-2.5 self-start rounded-md border border-encre-900 px-8 py-3.5 text-sm font-semibold text-encre-900 transition-colors hover:bg-encre-900 hover:text-white md:self-auto"
          >
            {t.projet.cta}
            <IconeFleche className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
