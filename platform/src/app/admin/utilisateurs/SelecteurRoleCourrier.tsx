"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTraduction } from "@/components/i18n/Langue";
import { definirRoleCourrierAction } from "./actions";

type Role = "agent" | "chef" | null;

// Désignation au service du courrier : agent (enregistre, numérise, remet) ou chef (en plus, corrige,
// annule et gère la conservation). Un administrateur ne peut pas se désigner lui-même.
export function SelecteurRoleCourrier({ utilisateurId, roleActuel, estMoi }: { utilisateurId: string; roleActuel: Role; estMoi: boolean }) {
  const router = useRouter();
  const { t } = useTraduction();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function changer(valeur: string) {
    const role: Role = valeur === "agent" || valeur === "chef" ? valeur : null;
    if (role === roleActuel) return;
    setEnCours(true);
    setErreur(null);
    const resultat = await definirRoleCourrierAction(utilisateurId, role);
    setEnCours(false);
    if (resultat.erreur) {
      setErreur(resultat.erreur);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <select
        defaultValue={roleActuel ?? "aucun"}
        disabled={enCours || estMoi}
        title={estMoi ? t("Vous ne pouvez pas vous désigner vous-même.", "You cannot assign yourself.") : undefined}
        onChange={(e) => changer(e.target.value)}
        className="rounded-md border border-slate-300 px-2 py-1 text-sm disabled:opacity-50"
      >
        <option value="aucun">{t("Aucun", "None")}</option>
        <option value="agent">{t("Agent du courrier", "Mail agent")}</option>
        <option value="chef">{t("Chef du courrier", "Head of mail")}</option>
      </select>
      {erreur && <p className="mt-1 text-xs text-red-600">{erreur}</p>}
    </div>
  );
}
