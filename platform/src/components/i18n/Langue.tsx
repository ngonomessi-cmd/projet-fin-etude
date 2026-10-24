"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { COOKIE_LANGUE, PLATEFORME_BILINGUE, localeDate, traducteur, type Langue } from "@/lib/i18n/plateforme";

type ValeurLangue = { langue: Langue; departements: Record<string, string> };

const ContexteLangue = createContext<ValeurLangue>({ langue: "fr", departements: {} });

// departements : nom anglais de chaque département (table departements_noms_en),
// fourni seulement quand l'interface est en anglais.
export function FournisseurLangue({
  langue,
  departements = {},
  children,
}: {
  langue: Langue;
  departements?: Record<string, string>;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.documentElement.lang = langue;
  }, [langue]);
  const valeur = useMemo(() => ({ langue, departements }), [langue, departements]);
  return <ContexteLangue.Provider value={valeur}>{children}</ContexteLangue.Provider>;
}

export function useLangue(): Langue {
  return useContext(ContexteLangue).langue;
}

// Pour les composants client : { langue, t, dl, dep } comme côté serveur ;
// dep(nom) donne le nom d'un département dans la langue de l'interface.
export function useTraduction() {
  const { langue, departements } = useContext(ContexteLangue);
  return useMemo(
    () => ({
      langue,
      t: traducteur(langue),
      dl: localeDate(langue),
      dep: (nom: string | null | undefined) => (nom ? (departements[nom] ?? nom) : ""),
    }),
    [langue, departements]
  );
}

// Sélecteur FR | EN : mémorise le choix (cookie d'un an) puis recharge les
// données serveur de la page dans la nouvelle langue.
export function ChoixLangue({ className = "", sombre = false }: { className?: string; sombre?: boolean }) {
  const langue = useLangue();
  const router = useRouter();
  if (!PLATEFORME_BILINGUE) return null;

  function choisir(nouvelle: Langue) {
    if (nouvelle === langue) return;
    document.cookie = `${COOKIE_LANGUE}=${nouvelle}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div
      role="group"
      aria-label={langue === "en" ? "Language" : "Langue"}
      className={`inline-flex rounded-md border p-0.5 text-xs font-semibold ${
        sombre ? "border-white/25 bg-white/5" : "border-paper-200 bg-white shadow-sm"
      } ${className}`}
    >
      {(["fr", "en"] as const).map((l) => {
        const actif = l === langue;
        return (
          <button
            key={l}
            type="button"
            onClick={() => choisir(l)}
            aria-pressed={actif}
            lang={l}
            className={`rounded px-2 py-1 uppercase transition-colors ${
              actif
                ? sombre
                  ? "bg-white text-navy-950"
                  : "bg-navy-950 text-white"
                : sombre
                  ? "text-white/70 hover:text-white"
                  : "text-paper-muted hover:text-[#1c2029]"
            }`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
