import Image from "next/image";
import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { SIGLE_ORGANISATION } from "@/lib/organisation";
import { DICTIONNAIRE, prefixeLocale, type Locale } from "@/lib/i18n/dictionnaire";
import { imageActualite } from "@/lib/images-actualites";
import type { ActualitePublique } from "@/lib/types";
import { CarrouselActualites, type ActualiteCarrousel } from "@/components/site-public/CarrouselActualites";
import { Apparition } from "@/components/site-public/Apparition";
import { IconeFleche } from "@/components/site-public/IconesSite";

export async function ActualitesListeContenu({ locale }: { locale: Locale }) {
  const t = DICTIONNAIRE[locale];
  const p = prefixeLocale(locale);

  const supabase = await creerClientServeur();
  const { data } = await supabase
    .from("actualites_publiques")
    .select("*")
    .eq("organisation", SIGLE_ORGANISATION)
    .eq("statut", "publie")
    .order("publie_at", { ascending: false });
  const brutes = (data ?? []) as ActualitePublique[];

  const actualites: ActualiteCarrousel[] = brutes.map((a, index) => ({
    id: a.id,
    href: `${p}/actualites/${a.slug}`,
    titre: (locale === "en" && a.titre_en) || a.titre,
    extrait: (locale === "en" && a.extrait_en) || a.extrait,
    date: a.publie_at
      ? new Date(a.publie_at).toLocaleDateString(t.dateLocale, { day: "numeric", month: "long", year: "numeric" })
      : null,
    image: imageActualite(a.image_url, index),
  }));

  return (
    <>
      <section className="relative overflow-hidden bg-encre-950 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-14 sm:px-8 sm:pt-16">
          <p className="animate-apparition text-xs font-semibold uppercase tracking-[0.14em] text-gold-500 sm:text-sm">
            {t.actualitesListe.surtitre}
          </p>
          <h1 className="mt-3 animate-apparition font-serif text-4xl font-semibold [animation-delay:120ms] sm:text-5xl">
            {t.actualitesListe.titre}
          </h1>
          <p className="mt-4 max-w-xl animate-apparition text-base leading-relaxed text-white/80 [animation-delay:240ms]">
            {t.actualitesListe.description}
          </p>
          <span className="mt-6 block h-[3px] w-14 animate-apparition bg-gold-500 [animation-delay:360ms]" aria-hidden="true" />
        </div>
      </section>

      <div className="bg-brume">
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-8">
          {actualites.length === 0 ? (
            <p className="relative -mt-12 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
              {t.actualitesListe.vide}
            </p>
          ) : (
            <>
              <div className="relative -mt-14 animate-apparition [animation-delay:300ms]">
                <CarrouselActualites
                  actualites={actualites.slice(0, 5)}
                  libelles={{
                    aLaUne: t.actualitesListe.aLaUne,
                    lire: t.actualitesListe.lire,
                    precedent: t.actualitesListe.precedent,
                    suivant: t.actualitesListe.suivant,
                  }}
                />
              </div>

              <h2 className="mt-16 flex items-center gap-3 font-serif text-2xl font-semibold text-encre-900">
                <span className="h-0.5 w-8 bg-gold-500" aria-hidden="true" />
                {t.actualitesListe.toutes}
              </h2>

              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {actualites.map((a, index) => (
                  <Apparition key={a.id} delai={(index % 3) * 120}>
                    <Link
                      href={a.href}
                      className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_4px_24px_rgba(0,24,61,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(0,24,61,0.14)]"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <Image
                          src={a.image}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-encre-950/0 transition-colors duration-300 group-hover:bg-encre-950/15" />
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        {a.date && <p className="text-xs font-medium uppercase tracking-wider text-gold-600">{a.date}</p>}
                        <h3 className="mt-2 font-serif text-lg font-semibold leading-snug text-encre-900">{a.titre}</h3>
                        {a.extrait && <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">{a.extrait}</p>}
                        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-encre-900 group-hover:text-gold-600">
                          {t.actualitesListe.lireLaSuite}
                          <IconeFleche className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                      </div>
                    </Link>
                  </Apparition>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
