"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { basculerTraiteAction, supprimerMessageContactAction } from "./actions";

export function ActionsMessage({ id, traite }: { id: string; traite: boolean }) {
  const router = useRouter();
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
        {traite ? "Marquer non traité" : "Marquer comme traité"}
      </button>
      <button
        type="button"
        disabled={enCours}
        onClick={() => {
          if (window.confirm("Supprimer définitivement ce message ?")) executer(() => supprimerMessageContactAction(id));
        }}
        className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        Supprimer
      </button>
      {erreur && <span className="text-xs text-red-600">{erreur}</span>}
    </div>
  );
}
