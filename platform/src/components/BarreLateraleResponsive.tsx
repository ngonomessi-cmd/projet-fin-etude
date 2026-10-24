"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { libelles } from "@/lib/labels";
import { ChoixLangue, useTraduction } from "@/components/i18n/Langue";
import type { Profil } from "@/lib/types";
import { SignOutButton } from "@/components/SignOutButton";
import { NavLinks, type Lien } from "@/components/NavLinks";
import { LogoOrganisation } from "@/components/LogoOrganisation";
import { RubanOrganisation } from "@/components/RubanOrganisation";
import { nomOrganisation } from "@/lib/organisation";

function initiales(nomComplet: string) {
  return nomComplet
    .split(" ")
    .filter(Boolean)
    .map((mot) => mot[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Barre latérale statique à partir de l'écran "lg" (desktop) ; en dessous,
// une barre mobile fixe en haut avec un bouton ☰ qui ouvre le même contenu
// en panneau superposé. La barre mobile et l'espace qu'elle réserve
// (globals.css, padding-top du <body>) sont indépendants de la mise en page
// de chaque page : aucune des pages existantes n'a besoin d'être modifiée.
export function BarreLateraleResponsive({ liens, profil }: { liens: Lien[]; profil: Profil | null }) {
  const [ouvert, setOuvert] = useState(false);
  const pathname = usePathname();
  const { t, langue } = useTraduction();
  const NOM_ORGANISATION = nomOrganisation(langue);

  useEffect(() => {
    setOuvert(false);
  }, [pathname]);

  const contenu = (
    <>
      <div className="mb-5 border-b border-navy-line px-1.5 pb-8">
        <div className="flex items-start gap-2.5">
          <LogoOrganisation taille="lg" />
          <div className="min-w-0">
            <div className="font-serif text-sm leading-tight font-semibold break-words">{NOM_ORGANISATION}</div>
            <div className="text-[11px] tracking-wide text-white/50 uppercase">{t("GED sécurisée", "Secure EDMS")}</div>
          </div>
          <button
            onClick={() => setOuvert(false)}
            aria-label={t("Fermer le menu", "Close menu")}
            className="ml-auto text-white/60 hover:text-white lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <RubanOrganisation className="mt-3" />
      </div>

      <NavLinks liens={liens} role={profil?.role ?? null} />

      {profil && (
        <div className="mt-auto border-t border-navy-line pt-4">
          <div className="flex items-center gap-2.5 px-1.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
              {initiales(profil.nom_complet)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold">{profil.nom_complet}</div>
              <div className="text-[11px] text-white/55">
                {libelles(langue).role[profil.role]} · {profil.departement}
              </div>
            </div>
          </div>
          <div className="mt-2.5 px-1.5">
            <SignOutButton />
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 bg-navy-950 px-4 text-white lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <LogoOrganisation taille="sm" />
          <span className="truncate font-serif text-sm font-semibold">{NOM_ORGANISATION}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ChoixLangue sombre />
          <button
            onClick={() => setOuvert(true)}
            aria-label={t("Ouvrir le menu", "Open menu")}
            className="shrink-0 p-1 text-white/90 hover:text-white"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>

      {ouvert && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOuvert(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-y-auto bg-navy-950 px-4 py-7 text-white transition-transform duration-200 lg:static lg:z-auto lg:w-60 lg:translate-x-0 ${
          ouvert ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {contenu}
      </aside>
    </>
  );
}
