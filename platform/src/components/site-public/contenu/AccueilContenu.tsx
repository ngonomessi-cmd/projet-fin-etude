import Image from "next/image";
import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { SIGLE_ORGANISATION } from "@/lib/organisation";
import { DICTIONNAIRE, prefixeLocale, type Locale } from "@/lib/i18n/dictionnaire";
import type { ActualitePublique } from "@/lib/types";
import { imageActualite } from "@/lib/images-actualites";
import { DefilementActualites } from "@/components/site-public/DefilementActualites";
import { CarteSecteur } from "@/components/site-public/CarteSecteur";
import { CarteCameroun } from "@/components/site-public/CarteCameroun";
import {
  IconeCouches,
  IconeCourbeBarres,
  IconeCroissance,
  IconeDocument,
  IconeFeuille,
  IconeFleche,
  IconeGraphique,
  IconeImage,
  IconeLecture,
  IconeMainPieces,
  IconePersonnes,
  IconePoigneeMain,
  IconeRepere,
} from "@/components/site-public/IconesSite";

const ICONES_CHIFFRES = [IconePersonnes, IconeCouches, IconeCourbeBarres, IconePoigneeMain];
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
      {/* Bannière */}
      <section className="relative isolate overflow-hidden bg-encre-950 text-white">
        <Image
          src="/images/site/hero-accueil.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 animate-zoom-lent object-cover object-[70%_center]"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-encre-950/95 via-encre-950/70 to-encre-950/10" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-encre-950/70 to-transparent" />

        <div className="mx-auto max-w-7xl px-4 pb-28 pt-16 sm:px-8 lg:pb-32 lg:pt-20">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold-500 sm:text-sm">
            <span className="h-0.5 w-8 bg-gold-500" />
            {t.hero.surtitre}
          </p>
          <h1 className="mt-5 max-w-4xl font-serif text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-[3.5rem]">
            {t.hero.titre}
            <span className="block italic text-gold-500">{t.hero.titreAccent}</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/90 sm:text-[17px]">{t.hero.description}</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href={`${p}/investir`}
              className="inline-flex items-center gap-2.5 rounded-full bg-gold-500 px-6 py-3.5 text-sm font-semibold text-encre-950 shadow-sm transition-colors hover:bg-gold-600 hover:text-white"
            >
              {t.hero.cta1}
              <IconeFleche className="h-4 w-4" />
            </Link>
            <Link
              href="#pourquoi-investir"
              className="inline-flex items-center gap-2.5 rounded-full border border-white/80 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <IconeLecture className="h-5 w-5" />
              {t.hero.cta2}
            </Link>
          </div>
        </div>
      </section>

      {/* Chiffres clés (posés à cheval sur la bannière) */}
      <section className="relative z-10 px-4 sm:px-8">
        <div className="mx-auto -mt-16 grid max-w-7xl gap-y-6 rounded-2xl bg-white px-6 py-7 shadow-[0_12px_40px_rgba(0,24,61,0.14)] sm:grid-cols-2 lg:grid-cols-4 lg:px-2">
          {t.chiffres.map((chiffre, index) => {
            const Icone = ICONES_CHIFFRES[index];
            return (
              <div
                key={chiffre.valeur}
                className={`flex items-start gap-4 lg:px-7 ${index > 0 ? "lg:border-l lg:border-slate-200" : ""}`}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold-50 text-gold-600">
                  <Icone className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-serif text-[1.7rem] font-semibold leading-none text-encre-900">{chiffre.valeur}</p>
                  <p className="mt-1.5 text-sm font-semibold text-encre-900">{chiffre.libelle}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-slate-500">{chiffre.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Secteurs prioritaires */}
      <section id="secteurs" className="scroll-mt-32 bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="flex items-center gap-3 font-serif text-2xl font-semibold text-encre-900 sm:text-[1.9rem]">
              <span className="h-7 w-1 rounded-full bg-gold-500" />
              {t.secteurs.titre}
            </h2>
            <Link
              href={`${p}/investir#secteurs`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gold-600 hover:text-encre-900"
            >
              {t.secteurs.lienTout}
              <IconeFleche className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {t.secteurs.items.map((secteur) => (
              <CarteSecteur key={secteur.cle} cle={secteur.cle} titre={secteur.titre} href={`${p}/investir#secteur-${secteur.cle}`} />
            ))}
          </div>
        </div>
      </section>

      {/* Opportunités et régions */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-20 pt-8 sm:px-8 lg:grid-cols-2">
          <div className="relative isolate flex overflow-hidden rounded-2xl bg-encre-950 text-white">
            <div className="hidden w-[38%] shrink-0 items-center justify-center bg-encre-900/60 p-5 sm:flex">
              <CarteCameroun
                variante="sombre"
                points={["maroua", "garoua", "ngaoundere", "bamenda", "douala", "yaounde", "bertoua", "kribi"]}
                className="h-48 w-auto"
              />
            </div>
            <div className="flex flex-col justify-center p-7 sm:p-8">
              <h3 className="font-serif text-2xl font-semibold">{t.opportunites.titre}</h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-white/85">{t.opportunites.description}</p>
              <Link
                href={`${p}/contact`}
                className="mt-6 inline-flex w-fit items-center gap-2.5 rounded-full bg-gold-500 px-5 py-3 text-sm font-semibold text-encre-950 transition-colors hover:bg-gold-600 hover:text-white"
              >
                {t.opportunites.cta}
                <IconeFleche className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="relative isolate flex overflow-hidden rounded-2xl border border-gold-100 bg-gold-50">
            <div className="flex flex-col justify-center p-7 sm:p-8">
              <h3 className="font-serif text-2xl font-semibold text-encre-900">{t.regionsAccueil.titre}</h3>
              <p className="mt-3 text-[14.5px] leading-relaxed text-slate-600">{t.regionsAccueil.description}</p>
              <Link
                href={`${p}/investir#regions`}
                className="mt-6 inline-flex w-fit items-center gap-2.5 rounded-full bg-encre-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-encre-900"
              >
                {t.regionsAccueil.cta}
                <IconeFleche className="h-4 w-4" />
              </Link>
            </div>
            <div className="hidden w-[38%] shrink-0 items-center justify-center p-5 sm:flex">
              <CarteCameroun variante="clair" points={["douala", "yaounde", "garoua"]} actif="yaounde" className="h-48 w-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Missions */}
      <section className="bg-brume">
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
