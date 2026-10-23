import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { SIGLE_ORGANISATION } from "@/lib/organisation";
import { DICTIONNAIRE, prefixeLocale, type Locale } from "@/lib/i18n/dictionnaire";
import type { ActualitePublique } from "@/lib/types";

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
  const actualites = (data ?? []) as ActualitePublique[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
      <h1 className="font-serif text-3xl font-semibold text-navy-950">{t.actualitesListe.titre}</h1>
      <p className="mt-2 text-sm text-paper-muted">{t.actualitesListe.description}</p>

      {actualites.length === 0 ? (
        <p className="mt-10 rounded-lg border border-paper-200 bg-paper-50 p-6 text-sm text-paper-muted">
          {t.actualitesListe.vide}
        </p>
      ) : (
        <ul className="mt-10 space-y-6">
          {actualites.map((actualite) => {
            const titre = (locale === "en" && actualite.titre_en) || actualite.titre;
            const extrait = (locale === "en" && actualite.extrait_en) || actualite.extrait;
            return (
              <li key={actualite.id} className="rounded-lg border border-paper-200 p-6 hover:border-gold-500">
                <Link href={`${p}/actualites/${actualite.slug}`}>
                  {actualite.publie_at && (
                    <p className="text-xs font-medium uppercase tracking-wide text-paper-soft">
                      {new Date(actualite.publie_at).toLocaleDateString(t.dateLocale, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  )}
                  <h2 className="mt-2 font-serif text-xl font-semibold text-navy-950">{titre}</h2>
                  {extrait && <p className="mt-2 text-sm leading-relaxed text-paper-muted">{extrait}</p>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
