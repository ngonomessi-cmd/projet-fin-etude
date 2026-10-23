import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { SIGLE_ORGANISATION } from "@/lib/organisation";
import { DICTIONNAIRE, prefixeLocale, type Locale } from "@/lib/i18n/dictionnaire";
import type { ActualitePublique } from "@/lib/types";

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
      <section className="bg-navy-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
          <h1 className="max-w-3xl font-serif text-3xl font-semibold leading-tight sm:text-5xl">{t.hero.titre}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">{t.hero.description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`${p}/#missions`}
              className="rounded-md bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-600"
            >
              {t.hero.cta1}
            </Link>
            <Link
              href={`${p}/actualites`}
              className="rounded-md border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              {t.hero.cta2}
            </Link>
          </div>
        </div>
      </section>

      <section id="missions" className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
        <h2 className="font-serif text-2xl font-semibold text-navy-950 sm:text-3xl">{t.missions.titre}</h2>
        <p className="mt-2 max-w-2xl text-sm text-paper-muted">{t.missions.soustitre}</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {t.missions.items.map((mission) => (
            <div key={mission.titre} className="rounded-lg border border-paper-200 p-5">
              <h3 className="font-serif text-lg font-semibold text-navy-950">{mission.titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper-muted">{mission.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="bg-paper-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
          <h2 className="font-serif text-2xl font-semibold text-navy-950 sm:text-3xl">{t.services.titre}</h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {t.services.items.map((service) => (
              <li key={service} className="flex items-start gap-3 rounded-lg border border-paper-200 bg-white p-4 text-sm">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" aria-hidden="true" />
                {service}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {actualites.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
          <div className="flex items-center justify-between gap-4">
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
                  className="rounded-lg border border-paper-200 p-5 hover:border-gold-500"
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
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
