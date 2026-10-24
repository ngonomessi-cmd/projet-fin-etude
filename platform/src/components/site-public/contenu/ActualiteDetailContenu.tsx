import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { SIGLE_ORGANISATION } from "@/lib/organisation";
import { DICTIONNAIRE, prefixeLocale, type Locale } from "@/lib/i18n/dictionnaire";
import { imageActualite } from "@/lib/images-actualites";
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
  const extrait = (locale === "en" && actualite.extrait_en) || actualite.extrait;
  const contenu = (locale === "en" && actualite.contenu_en) || actualite.contenu;

  return (
    <article>
      <header className="relative isolate overflow-hidden bg-encre-950 text-white">
        <Image
          src={imageActualite(actualite.image_url, 0)}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 animate-zoom-lent object-cover opacity-45"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-encre-950 via-encre-950/70 to-encre-950/30" />
        <div className="mx-auto max-w-3xl px-4 pb-14 pt-12 sm:px-8 sm:pt-16">
          <Link href={`${p}/actualites`} className="text-sm text-white/70 transition-colors hover:text-gold-500">
            {t.actualiteDetail.retour}
          </Link>
          {actualite.publie_at && (
            <p className="mt-8 animate-apparition text-xs font-semibold uppercase tracking-[0.14em] text-gold-500">
              {new Date(actualite.publie_at).toLocaleDateString(t.dateLocale, { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
          <h1 className="mt-3 animate-apparition font-serif text-3xl font-semibold leading-tight [animation-delay:120ms] sm:text-[2.6rem]">
            {titre}
          </h1>
          {extrait && (
            <p className="mt-5 animate-apparition text-lg leading-relaxed text-white/85 [animation-delay:240ms]">{extrait}</p>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl animate-apparition px-4 py-12 [animation-delay:300ms] sm:px-8">
        <div className="space-y-5 text-[17px] leading-relaxed text-slate-700">
          {contenu.split(/\n{2,}/).map((paragraphe, index) => (
            <p key={index}>{paragraphe}</p>
          ))}
        </div>
        <span className="mt-10 block h-[3px] w-14 bg-gold-500" aria-hidden="true" />
        <Link
          href={`${p}/actualites`}
          className="mt-6 inline-flex text-sm font-semibold text-encre-900 transition-colors hover:text-gold-600"
        >
          {t.actualiteDetail.retour}
        </Link>
      </div>
    </article>
  );
}
