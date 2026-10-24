"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { basculerTraiteAction, supprimerMessageContactAction } from "./actions";
import { useTraduction } from "@/components/i18n/Langue";

export function ActionsMessage({ id, traite }: { id: string; traite: boolean }) {
  const router = useRouter();
  const { t } = useTraduction();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function executer(action: () => Promise<{ erreur: string | null }>) {
    setEnCours(true);
    setErreur(null);
    const resultat = await action();
    setEnCours(false);
    if (resultat.erreur) setErreur(resultat.erreur);
    else router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={enCours}
        onClick={() => executer(() => basculerTraiteAction(id, !traite))}
        className="rounded-md border border-paper-200 px-3 py-1.5 text-xs font-medium text-[#1c2029] hover:bg-paper-50 disabled:opacity-50"
      >
        {traite ? t("Marquer non traité", "Mark as unhandled") : t("Marquer comme traité", "Mark as handled")}
      </button>
      <button
        type="button"
        disabled={enCours}
        onClick={() => {
          if (window.confirm(t("Supprimer définitivement ce message ?", "Permanently delete this message?"))) executer(() => supprimerMessageContactAction(id));
        }}
        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {t("Supprimer", "Delete")}
      </button>
      {erreur && <span className="text-xs text-red-600">{erreur}</span>}
    </div>
  );
}
