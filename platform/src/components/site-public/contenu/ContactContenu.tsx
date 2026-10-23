import Image from "next/image";
import { DICTIONNAIRE, type Locale } from "@/lib/i18n/dictionnaire";
import { FormulaireContact } from "@/components/site-public/FormulaireContact";
import { IconeEngrenage, IconeFeuille, IconePersonne, IconePersonnes } from "@/components/site-public/IconesSite";

const ICONES_ATOUTS = [IconePersonne, IconePersonnes, IconeEngrenage, IconeFeuille];

export function ContactContenu({ locale, service }: { locale: Locale; service?: string }) {
  const t = DICTIONNAIRE[locale];
  const numero = Number(service);
  const sujetInitial =
    Number.isInteger(numero) && numero >= 1 && numero <= t.services.items.length
      ? t.services.items[numero - 1].titre
      : t.services.items[0].titre;

  return (
    <>
      <section className="relative isolate overflow-hidden bg-encre-950 text-white">
        <div className="absolute inset-y-0 right-0 -z-10 w-full lg:w-[62%]">
          <Image
            src="/images/site/hero-missions.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 62vw, 100vw"
            className="object-cover object-right"
          />
          <div className="absolute inset-0 bg-encre-950/70 lg:bg-transparent lg:bg-gradient-to-r lg:from-encre-950 lg:via-encre-950/25 lg:to-transparent" />
        </div>
        <div className="mx-auto flex max-w-7xl flex-col justify-center px-4 py-16 sm:px-8 lg:min-h-[360px]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-500 sm:text-sm">{t.contact.surtitre}</p>
          <h1 className="mt-4 max-w-xl font-serif text-4xl font-semibold leading-[1.1] sm:text-5xl">{t.contact.titre}</h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/90">{t.contact.description}</p>
          <span className="mt-8 block h-[3px] w-14 bg-gold-500" aria-hidden="true" />
        </div>
      </section>

      <section className="bg-brume">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-[0_4px_24px_rgba(0,24,61,0.07)] sm:p-9">
            <h2 className="font-serif text-2xl font-semibold text-encre-900">{t.contact.formTitre}</h2>
            <span className="mt-3 mb-7 block h-0.5 w-8 bg-gold-500" aria-hidden="true" />
            <FormulaireContact locale={locale} sujetInitial={sujetInitial} />
          </div>

          <aside className="overflow-hidden rounded-xl bg-encre-950 text-white">
            <div className="relative h-40">
              <Image src="/images/site/projet-contact.jpg" alt="" fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover" />
            </div>
            <div className="p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-500">{t.confiance.surtitre}</p>
              <h2 className="mt-2 font-serif text-xl font-semibold leading-snug">{t.contact.atoutsTitre}</h2>
              <ul className="mt-6 space-y-5">
                {t.confiance.points.map((point, index) => {
                  const Icone = ICONES_ATOUTS[index];
                  return (
                    <li key={point} className="flex items-center gap-4">
                      <Icone className="h-8 w-8 shrink-0 text-gold-500" />
                      <span className="text-sm font-medium leading-snug text-white/90">{point}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
