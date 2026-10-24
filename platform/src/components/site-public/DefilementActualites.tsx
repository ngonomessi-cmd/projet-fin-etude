"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconeFleche } from "@/components/site-public/IconesSite";

export type CarteActualite = {
  id: string;
  href: string;
  titre: string;
  date: string | null;
  image: string;
};

const INTERVALLE_MS = 2500;
// Nombre maximal de cartes visibles à la fois (grand écran) : autant de
// copies sont ajoutées en fin de piste pour boucler sans saut visible.
const VISIBLES_MAX = 3;

export function DefilementActualites({
  actualites,
  libelles,
}: {
  actualites: CarteActualite[];
  libelles: { lire: string; precedent: string; suivant: string };
}) {
  const total = actualites.length;
  const boucle = total > 1;
  const cartes = boucle ? [...actualites, ...actualites.slice(0, VISIBLES_MAX)] : actualites;

  const pisteRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [animer, setAnimer] = useState(true);
  const [pause, setPause] = useState(false);
  const [pas, setPas] = useState(0);
  const [mouvementReduit, setMouvementReduit] = useState(false);

  // Largeur d'une carte + espacement, remesurée à chaque redimensionnement.
  useEffect(() => {
    const piste = pisteRef.current;
    if (!piste) return;
    const mesurer = () => {
      const carte = piste.children[0] as HTMLElement | undefined;
      if (!carte) return;
      const ecart = parseFloat(getComputedStyle(piste).columnGap) || 0;
      setPas(carte.offsetWidth + ecart);
    };
    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(piste);
    return () => observateur.disconnect();
  }, []);

  useEffect(() => {
    const requete = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMouvementReduit(requete.matches);
    const changer = (e: MediaQueryListEvent) => setMouvementReduit(e.matches);
    requete.addEventListener("change", changer);
    return () => requete.removeEventListener("change", changer);
  }, []);

  const suivant = useCallback(() => {
    setAnimer(true);
    setIndex((i) => (i >= total ? i : i + 1));
  }, [total]);

  function precedent() {
    if (index === 0) {
      // Saut invisible vers la copie de la première carte, puis recul animé.
      setAnimer(false);
      setIndex(total);
      setTimeout(() => {
        setAnimer(true);
        setIndex(total - 1);
      }, 30);
    } else {
      setAnimer(true);
      setIndex(index - 1);
    }
  }

  // Défilement automatique, suspendu au survol / focus.
  useEffect(() => {
    if (!boucle || pause || mouvementReduit) return;
    const minuteur = setTimeout(suivant, INTERVALLE_MS);
    return () => clearTimeout(minuteur);
  }, [index, boucle, pause, mouvementReduit, suivant]);

  // Arrivé sur les copies de fin : retour instantané au début.
  function finTransition() {
    if (index >= total) {
      setAnimer(false);
      setIndex(index - total);
    }
  }

  useEffect(() => {
    if (animer) return;
    const image = requestAnimationFrame(() => requestAnimationFrame(() => setAnimer(true)));
    return () => cancelAnimationFrame(image);
  }, [animer]);

  return (
    <div
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
      onFocus={() => setPause(true)}
      onBlur={() => setPause(false)}
      aria-roledescription="carrousel"
    >
      <div className="-my-3 overflow-hidden py-3">
        <div
          ref={pisteRef}
          onTransitionEnd={finTransition}
          className="flex gap-5"
          style={{
            transform: `translateX(-${index * pas}px)`,
            transition: animer ? "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
          }}
        >
          {cartes.map((actualite, i) => (
            <Link
              key={`${actualite.id}-${i}`}
              href={actualite.href}
              aria-hidden={i >= total || undefined}
              tabIndex={i >= total ? -1 : undefined}
              className="group flex w-full shrink-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_2px_12px_rgba(0,24,61,0.05)] transition-shadow hover:shadow-[0_8px_24px_rgba(0,24,61,0.10)] sm:w-[calc((100%-2.5rem)/3)]"
            >
              <div className="relative aspect-[16/7] overflow-hidden">
                <Image
                  src={actualite.image}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 22vw, 100vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                {actualite.date && <p className="text-xs text-slate-400">{actualite.date}</p>}
                <h3 className="mt-2 flex-1 text-sm font-medium leading-snug text-encre-900">{actualite.titre}</h3>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-encre-900 group-hover:text-gold-600">
                  {libelles.lire}
                  <IconeFleche className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {boucle && (
        <div className="mt-5 flex items-center justify-end gap-4">
          <div className="flex gap-1.5" aria-hidden="true">
            {actualites.map((a, i) => (
              <span
                key={a.id}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === index % total ? "w-5 bg-gold-500" : "w-1.5 bg-slate-300"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={precedent}
              aria-label={libelles.precedent}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-encre-900 transition-colors hover:border-gold-500 hover:text-gold-600"
            >
              <IconeFleche className="h-4 w-4 rotate-180" />
            </button>
            <button
              type="button"
              onClick={suivant}
              aria-label={libelles.suivant}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-encre-900 transition-colors hover:border-gold-500 hover:text-gold-600"
            >
              <IconeFleche className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
