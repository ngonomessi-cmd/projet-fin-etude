import Image from "next/image";
import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { SIGLE_ORGANISATION } from "@/lib/organisation";
import { DICTIONNAIRE, prefixeLocale, type Locale } from "@/lib/i18n/dictionnaire";
import type { ActualitePublique } from "@/lib/types";
import { imageActualite } from "@/lib/images-actualites";
import { DefilementActualites } from "@/components/site-public/DefilementActualites";
import {
  IconeCarteCameroun,
  IconeChrono,
  IconeCroissance,
  IconeDocument,
  IconeFeuille,
  IconeFleche,
  IconeGraphique,
  IconeImage,
  IconeMainPieces,
  IconePersonnes,
  IconePieces,
  IconePoigneeMain,
  IconeRepere,
} from "@/components/site-public/IconesSite";

const ICONES_CHIFFRES = [IconePoigneeMain, IconePieces, IconeCarteCameroun, IconeChrono];
const ICONES_MISSIONS = [IconeGraphique, IconeImage, IconeDocument, IconePersonnes, IconeMainPieces];
const ICONES_POURQUOI = [IconeFeuille, IconePersonnes, IconeRepere, IconeCroissance];

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
    .limit(9);
  const actualites = (data ?? []) as ActualitePublique[];

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-encre-950 text-white">
        <div className="absolute inset-y-0 right-0 -z-10 w-full lg:w-[64%]">
          <Image
            src="/images/site/hero-accueil.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 64vw, 100vw"
            className="object-cover object-right"
          />
          <div className="absolute inset-0 bg-encre-950/70 lg:bg-transparent lg:bg-gradient-to-r lg:from-encre-950 lg:via-encre-950/25 lg:to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-encre-950/80 to-transparent" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col justify-center px-4 py-16 sm:px-8 lg:min-h-[500px] lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-500 sm:text-sm">{t.hero.surtitre}</p>
          <h1 className="mt-4 max-w-xl font-serif text-4xl font-semibold leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
            {t.hero.titre}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/90">{t.hero.description}</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href={`${p}/services`}
              className="inline-flex items-center gap-2.5 rounded-md bg-gold-500 px-6 py-3.5 text-sm font-semibold text-encre-950 shadow-sm transition-colors hover:bg-gold-600"
            >
              {t.hero.cta1}
              <IconeFleche className="h-4 w-4" />
            </Link>
            <Link
              href="#pourquoi-investir"
              className="inline-flex items-center rounded-md border border-white/80 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {t.hero.cta2}
            </Link>
          </div>

          <div className="pointer-events-none absolute bottom-9 right-8 hidden max-w-[17rem] lg:block">
            <span className="block h-0.5 w-12 bg-gold-500" />
            <p className="mt-3 font-serif text-lg font-semibold italic leading-snug text-white">{t.hero.legende}</p>
          </div>
        </div>
      </section>

      {/* Chiffres clés */}
      <section className="border-b border-slate-100 bg-brume">
        <div className="mx-auto grid max-w-7xl gap-y-8 px-4 py-10 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          {t.chiffres.map((chiffre, index) => {
            const Icone = ICONES_CHIFFRES[index];
            return (
              <div key={chiffre.valeur} className={`px-1 lg:px-8 ${index > 0 ? "lg:border-l lg:border-slate-200" : "lg:pl-0"}`}>
                <Icone className="h-9 w-9 text-gold-500" />
                <p className="mt-4 font-serif text-2xl font-semibold text-encre-900">{chiffre.valeur}</p>
                {chiffre.libelle && <p className="mt-1 text-sm font-semibold text-encre-900">{chiffre.libelle}</p>}
                <p className="mt-1 text-sm text-slate-500">{chiffre.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Missions */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-600">{t.missionsTeaser.surtitre}</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-encre-900 sm:text-[2.1rem]">
              {t.missionsTeaser.titre}
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-slate-600">{t.missionsTeaser.description}</p>
            <Link
              href={`${p}/missions`}
              className="mt-8 inline-flex items-center gap-2.5 rounded-md bg-gold-500 px-6 py-3 text-sm font-semibold text-encre-950 transition-colors hover:bg-gold-600"
            >
              {t.missionsTeaser.cta}
              <IconeFleche className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-6">
            {t.missionsTeaser.cartes.map((carte, index) => {
              const Icone = ICONES_MISSIONS[index];
              return (
                <Link
                  key={carte.titre}
                  href={`${p}/missions`}
                  className={`group flex flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-[0_2px_12px_rgba(0,24,61,0.05)] transition-all hover:-translate-y-0.5 hover:border-gold-500 hover:shadow-[0_8px_24px_rgba(0,24,61,0.10)] ${
                    index < 3 ? "sm:col-span-2" : "sm:col-span-3"
                  }`}
                >
                  <Icone className="h-8 w-8 text-gold-500" />
                  <h3 className="mt-4 font-serif text-base font-semibold leading-snug text-encre-900">{carte.titre}</h3>
                  <p className="mt-2 flex-1 text-[13px] leading-relaxed text-slate-500">{carte.description}</p>
                  <IconeFleche className="mt-5 h-4 w-4 text-gold-500 transition-transform group-hover:translate-x-1" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pourquoi investir */}
      <section id="pourquoi-investir" className="relative isolate overflow-hidden bg-encre-950 text-white">
        <div className="relative aspect-[16/10] w-full lg:absolute lg:aspect-auto lg:inset-y-0 lg:left-0 lg:h-auto lg:w-[42%] lg:[clip-path:polygon(0_0,100%_0,67%_100%,0_100%)]">
          {/* La photo d'origine porte une bande bleu marine sur sa droite (masquée
              par la découpe en biais sur grand écran) : version recadrée sans
              cette bande sur téléphone et tablette. */}
          <Image
            src="/images/site/pourquoi-investir-mobile.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover lg:hidden"
          />
          <Image
            src="/images/site/pourquoi-investir.jpg"
            alt=""
            fill
            sizes="42vw"
            className="hidden object-cover object-left lg:block"
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8 lg:py-20">
          <div className="lg:ml-[44%]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-500">{t.pourquoiInvestir.surtitre}</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight sm:text-[2.1rem]">{t.pourquoiInvestir.titre}</h2>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-white/85">{t.pourquoiInvestir.description}</p>

            <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
              {t.pourquoiInvestir.points.map((point, index) => {
                const Icone = ICONES_POURQUOI[index];
                return (
                  <div key={point}>
                    <Icone className="h-8 w-8 text-gold-500" />
                    <p className="mt-3 text-[13px] font-medium leading-snug text-white">{point}</p>
                  </div>
                );
              })}
            </div>

            <Link
              href={`${p}/services`}
              className="mt-10 inline-flex items-center gap-2.5 rounded-md bg-gold-500 px-6 py-3 text-sm font-semibold text-encre-950 transition-colors hover:bg-gold-600"
            >
              {t.pourquoiInvestir.cta}
              <IconeFleche className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Actualités */}
      <section className="bg-brume">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,2fr)] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-600">{t.actualitesAccueil.surtitre}</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-encre-900">{t.actualitesAccueil.titre}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-600">{t.actualitesAccueil.description}</p>
            <Link
              href={`${p}/actualites`}
              className="mt-8 inline-flex items-center gap-2.5 rounded-md border border-encre-900 px-5 py-3 text-sm font-semibold text-encre-900 transition-colors hover:bg-encre-900 hover:text-white"
            >
              {t.actualitesAccueil.cta}
              <IconeFleche className="h-4 w-4" />
            </Link>
          </div>

          {actualites.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
              {t.actualitesAccueil.vide}
            </p>
          ) : (
            <DefilementActualites
              actualites={actualites.map((actualite, index) => ({
                id: actualite.id,
                href: `${p}/actualites/${actualite.slug}`,
                titre: (locale === "en" && actualite.titre_en) || actualite.titre,
                date: actualite.publie_at
                  ? new Date(actualite.publie_at).toLocaleDateString(t.dateLocale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : null,
                image: imageActualite(actualite.image_url, index),
              }))}
              libelles={{
                lire: t.actualitesAccueil.lireLaSuite,
                precedent: t.actualitesListe.precedent,
                suivant: t.actualitesListe.suivant,
              }}
            />
          )}
        </div>
      </section>
    </>
  );
}
