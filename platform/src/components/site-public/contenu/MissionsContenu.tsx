import { DICTIONNAIRE, type Locale } from "@/lib/i18n/dictionnaire";

const ICONES = [
  <svg key="0" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M4 19h16M7 19v-5m5 5V9m5 10V5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
  <svg key="1" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M4 21V9l8-5 8 5v12" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 21v-7h6v7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
  <svg key="2" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
    <path d="M14 3v5h5M9 13h6M9 16h4" strokeLinecap="round" />
  </svg>,
  <svg key="3" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <circle cx="8" cy="8" r="3" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M3 20v-1a5 5 0 0 1 5-5h0a5 5 0 0 1 5 5v1" strokeLinecap="round" />
    <path d="M15 14.5a4 4 0 0 1 4 4V20" strokeLinecap="round" />
  </svg>,
  <svg key="4" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M9 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    <path d="M3 19c.6-2.3 2.6-4 6-4s5.4 1.7 6 4" strokeLinecap="round" />
    <path d="M15 8h6M15 12h6M19 16h2" strokeLinecap="round" />
  </svg>,
] as const;

export function MissionsContenu({ locale }: { locale: Locale }) {
  const t = DICTIONNAIRE[locale];

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-8">
      <h1 className="font-serif text-3xl font-semibold text-navy-950 sm:text-4xl">{t.missions.titre}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-paper-muted sm:text-base">{t.missions.intro}</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {t.missions.items.map((mission, index) => (
          <div key={mission.titre} className="rounded-lg border border-paper-200 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gold-50 text-gold-600">{ICONES[index]}</div>
            <h2 className="mt-4 font-serif text-lg font-semibold text-navy-950">{mission.titre}</h2>
            <p className="mt-2 text-sm leading-relaxed text-paper-muted">{mission.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
