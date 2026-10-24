"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { IconeFleche } from "@/components/site-public/IconesSite";

export type ActualiteCarrousel = {
  id: string;
  href: string;
  titre: string;
  extrait: string | null;
  date: string | null;
  image: string;
};

const DUREE_MS = 7000;

export function CarrouselActualites({
  actualites,
  libelles,
}: {
  actualites: ActualiteCarrousel[];
  libelles: { aLaUne: string; lire: string; precedent: string; suivant: string };
}) {
  const [index, setIndex] = useState(0);
  const [enPause, setEnPause] = useState(false);
  const total = actualites.length;

  const aller = useCallback((n: number) => setIndex(((n % total) + total) % total), [total]);

  useEffect(() => {
    if (enPause || total < 2) return;
    const minuteur = setTimeout(() => aller(index + 1), DUREE_MS);
    return () => clearTimeout(minuteur);
  }, [index, enPause, total, aller]);

  const courante = actualites[index];

  return (
    <section
      aria-roledescription="carrousel"
      aria-label={libelles.aLaUne}
      className="overflow-hidden rounded-2xl bg-encre-950 text-white shadow-[0_20px_50px_rgba(0,24,61,0.25)]"
      onMouseEnter={() => setEnPause(true)}
      onMouseLeave={() => setEnPause(false)}
      onFocus={() => setEnPause(true)}
      onBlur={() => setEnPause(false)}
    >
      <div className="grid lg:grid-cols-[1.35fr_1fr]">
        <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[420px]">
          {actualites.map((a, i) => (
            <div
              key={a.id}
              aria-hidden={i !== index}
              className={`absolute inset-0 transition-opacity duration-1000 ${i === index ? "opacity-100" : "opacity-0"}`}
            >
              <Image
                src={a.image}
                alt=""
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 58vw, 100vw"
                className={`object-cover ${i === index ? "animate-zoom-lent" : ""}`}
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-encre-950/70 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-encre-950/60" />
          <span className="absolute left-5 top-5 rounded-full bg-gold-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-encre-950">
            {libelles.aLaUne}
          </span>
        </div>

        <div className="flex flex-col p-7 sm:p-10">
          <div key={courante.id} className="flex flex-1 flex-col animate-apparition" aria-live="polite">
            {courante.date && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-500">{courante.date}</p>}
            <h2 className="mt-3 font-serif text-2xl font-semibold leading-snug sm:text-[1.75rem]">{courante.titre}</h2>
            {courante.extrait && <p className="mt-4 text-[15px] leading-relaxed text-white/80">{courante.extrait}</p>}
            <Link
              href={courante.href}
              className="mt-7 inline-flex items-center gap-2.5 self-start rounded-md bg-gold-500 px-5 py-3 text-sm font-semibold text-encre-950 transition-colors hover:bg-gold-600"
            >
              {libelles.lire}
              <IconeFleche className="h-4 w-4" />
            </Link>
          </div>

          {total > 1 && (
            <div className="mt-8 flex items-center gap-4">
              <div className="flex flex-1 gap-2">
                {actualites.map((a, i) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => aller(i)}
                    aria-label={`${i + 1} / ${total}`}
                    aria-current={i === index}
                    className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/20"
                  >
                    {i < index && <span className="absolute inset-0 bg-gold-500" />}
                    {i === index && (
                      <span
                        key={`${index}-${enPause}`}
                        className={`absolute inset-0 origin-left bg-gold-500 ${enPause ? "" : "animate-progression"}`}
                        style={{ animationDuration: `${DUREE_MS}ms` }}
                      />
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => aller(index - 1)}
                  aria-label={libelles.precedent}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 transition-colors hover:border-gold-500 hover:text-gold-500"
                >
                  <IconeFleche className="h-4 w-4 rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => aller(index + 1)}
                  aria-label={libelles.suivant}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 transition-colors hover:border-gold-500 hover:text-gold-500"
                >
                  <IconeFleche className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
