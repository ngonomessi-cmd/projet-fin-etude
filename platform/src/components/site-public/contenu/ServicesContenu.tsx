import { DICTIONNAIRE, type Locale } from "@/lib/i18n/dictionnaire";

export function ServicesContenu({ locale }: { locale: Locale }) {
  const t = DICTIONNAIRE[locale];

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
      <h1 className="font-serif text-3xl font-semibold text-navy-950 sm:text-4xl">{t.services.titre}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-paper-muted sm:text-base">{t.services.intro}</p>

      <ol className="mt-10 space-y-4">
        {t.services.items.map((service, index) => (
          <li key={service.titre} className="flex gap-4 rounded-lg border border-paper-200 p-5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-950 font-serif text-sm font-semibold text-gold-500">
              {index + 1}
            </span>
            <div>
              <h2 className="font-serif text-base font-semibold text-navy-950">{service.titre}</h2>
              <p className="mt-1 text-sm leading-relaxed text-paper-muted">{service.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
