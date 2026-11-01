"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTraduction } from "@/components/i18n/Langue";

export function OngletsCourrier({ service, chef }: { service: boolean; chef: boolean }) {
  const chemin = usePathname();
  const { t } = useTraduction();
  const surConservation = chemin === "/courrier/conservation";
  const surDepart = chemin === "/courrier/depart" || chemin.startsWith("/courrier/depart/");
  // Pour le service du courrier, la fiche d'un courrier arrivé fait partie du registre (on y arrive depuis lui).
  const surFiche = /^\/courrier\/[0-9a-f-]{36}(\/|$)/i.test(chemin);
  const surRegistre =
    !surDepart && !surConservation && (chemin === "/courrier/registre" || chemin.startsWith("/courrier/registre/") || chemin === "/courrier/nouveau" || (service && surFiche));
  const onglets = [
    { href: "/courrier", libelle: t("Mon courrier", "My mail"), actif: !surRegistre && !surDepart && !surConservation },
    ...(service ? [{ href: "/courrier/registre", libelle: t("Registre des arrivées", "Incoming register"), actif: surRegistre }] : []),
    { href: "/courrier/depart", libelle: service ? t("Registre des départs", "Outgoing register") : t("Mes envois", "My dispatches"), actif: surDepart },
    ...(chef ? [{ href: "/courrier/conservation", libelle: t("Conservation", "Retention"), actif: surConservation }] : []),
  ];
  return (
    <nav aria-label={t("Courrier", "Mail")} className="flex flex-wrap gap-2 text-sm">
      {onglets.map((o) => (
        <Link
          key={o.href}
          href={o.href}
          aria-current={o.actif ? "page" : undefined}
          className={`rounded-full border px-4 py-1.5 ${o.actif ? "border-navy-950 bg-navy-950 text-white" : "border-paper-200 bg-white text-[#1c2029] hover:border-navy-950"}`}
        >
          {o.libelle}
        </Link>
      ))}
    </nav>
  );
}
