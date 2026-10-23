import Link from "next/link";
import { notFound } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { SIGLE_ORGANISATION } from "@/lib/organisation";
import { DICTIONNAIRE, prefixeLocale, type Locale } from "@/lib/i18n/dictionnaire";
import type { ActualitePublique } from "@/lib/types";

export async function ActualiteDetailContenu({ slug, locale }: { slug: string; locale: Locale }) {
  const t = DICTIONNAIRE[locale];
  const p = prefixeLocale(locale);

  const supabase = await creerClientServeur();
  const { data } = await supabase
    .from("actualites_publiques")
    .select("*")
    .eq("organisation", SIGLE_ORGANISATION)
    .eq("statut", "publie")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) notFound();
  const actualite = data as ActualitePublique;

  const titre = (locale === "en" && actualite.titre_en) || actualite.titre;
  const contenu = (locale === "en" && actualite.contenu_en) || actualite.contenu;

  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
      <Link href={`${p}/actualites`} className="text-sm text-paper-muted hover:text-gold-600 hover:underline">
        {t.actualiteDetail.retour}
      </Link>

      {actualite.publie_at && (
        <p className="mt-6 text-xs font-medium uppercase tracking-wide text-paper-soft">
          {new Date(actualite.publie_at).toLocaleDateString(t.dateLocale, { day: "numeric", month: "long", year: "numeric" })}
        </p>
      )}
      <h1 className="mt-2 font-serif text-3xl font-semibold text-navy-950">{titre}</h1>

      <div className="mt-8 space-y-4 text-base leading-relaxed text-[#1c2029]">
        {contenu.split(/\n{2,}/).map((paragraphe, index) => (
          <p key={index}>{paragraphe}</p>
        ))}
      </div>
    </article>
  );
}
