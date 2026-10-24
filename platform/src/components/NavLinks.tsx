"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RoleUtilisateur } from "@/lib/types";

type Lien = {
  href: string;
  label: string;
  roles?: RoleUtilisateur[];
  icone: "documents" | "messagerie" | "audit" | "utilisateurs" | "actualites" | "contact" | "modeles" | "archives" | "signatures";
  badge?: number;
};

const ICONES: Record<Lien["icone"], React.ReactNode> = {
  signatures: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M3 17c2.5-4 4.5-9 6-9s-1 8 1 8 3-5 4.5-5S15 15 17 15s2-2 4-2" />
      <path d="M3 21h18" />
    </svg>
  ),
  documents: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v5h5" />
    </svg>
  ),
  messagerie: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </svg>
  ),
  audit: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M9 5H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
      <path d="M9 12h6M9 16h3" />
      <path d="M13 3h6v6" />
      <path d="M11 13 19 5" />
    </svg>
  ),
  utilisateurs: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  actualites: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 11a1 1 0 0 1 1-1h3V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6Z" />
      <path d="M8 10V4h11v13" />
      <path d="M8 14h7M8 17h4" />
    </svg>
  ),
  modeles: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  archives: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="4" width="18" height="5" rx="1" />
      <path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" />
      <path d="M10 13h4" />
    </svg>
  ),
  contact: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
};

export function NavLinks({ liens, role }: { liens: Lien[]; role: RoleUtilisateur | null }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {liens
        .filter((lien) => !lien.roles || (role && lien.roles.includes(role)))
        .map((lien) => {
          const actif = lien.href === "/documents" ? pathname === "/documents" : pathname.startsWith(lien.href);
          return (
            <Link
              key={lien.href}
              href={lien.href}
              aria-current={actif ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-sm transition-colors ${
                actif
                  ? "border-gold-500 bg-navy-800 font-semibold text-white"
                  : "border-transparent font-medium text-white/65 hover:bg-navy-800/60 hover:text-white"
              }`}
            >
              {ICONES[lien.icone]}
              <span className="flex-1">{lien.label}</span>
              {!!lien.badge && lien.badge > 0 && (
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gold-500 px-1.5 text-[11px] font-bold text-navy-950">
                  {lien.badge}
                </span>
              )}
            </Link>
          );
        })}
    </nav>
  );
}

export type { Lien };
