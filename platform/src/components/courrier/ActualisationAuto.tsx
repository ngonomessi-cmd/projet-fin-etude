"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Recharge les données de la page à intervalle régulier, onglet visible seulement.
export function ActualisationAuto({ secondes = 30 }: { secondes?: number }) {
  const routeur = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") routeur.refresh();
    }, secondes * 1000);
    return () => clearInterval(id);
  }, [routeur, secondes]);
  return null;
}
