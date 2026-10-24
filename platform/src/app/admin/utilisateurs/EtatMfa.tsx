"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTraduction } from "@/components/i18n/Langue";
import { reinitialiserMfaAction } from "./actions";

export function EtatMfa({ utilisateurId, nom, actif, estMoi }: { utilisateurId: string; nom: string; actif: boolean; estMoi: boolean }) {
  const router = useRouter();
  const { t } = useTraduction();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function reinitialiser() {
    if (
      !window.confirm(
        t(
          `Réinitialiser la double authentification de ${nom} ? Il ou elle devra reconfigurer Google Authenticator à sa prochaine connexion.`,
          `Reset ${nom}'s two-factor authentication? They will have to set up Google Authenticator again at their next sign-in.`
        )
      )
    )
      return;
    setEnCours(true);
    setErreur(null);
    const r = await reinitialiserMfaAction(utilisateurId);
    setEnCours(false);
    if (r.erreur) setErreur(r.erreur);
    else router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <span
        className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
          actif ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-800"
        }`}
      >
        {actif ? t("Activée", "Enabled") : t("À configurer", "Not set up")}
      </span>
      {actif && !estMoi && (
        <button type="button" onClick={reinitialiser} disabled={enCours} className="text-xs text-red-700 hover:underline disabled:opacity-50">
          {t("Réinitialiser", "Reset")}
        </button>
      )}
      {erreur && <span className="text-xs text-red-600">{erreur}</span>}
    </div>
  );
}
