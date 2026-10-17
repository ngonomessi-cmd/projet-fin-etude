"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { renommerCanalAction, supprimerCanalAction } from "../actions";

export function GererCanalBouton({ conversationId, titreActuel }: { conversationId: string; titreActuel: string }) {
  const router = useRouter();
  const [enRenommage, setEnRenommage] = useState(false);
  const [nouveauTitre, setNouveauTitre] = useState(titreActuel);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function enregistrerRenommage() {
    setEnCours(true);
    setErreur(null);
    const resultat = await renommerCanalAction(conversationId, nouveauTitre);
    setEnCours(false);
    if (resultat.erreur) {
      setErreur(resultat.erreur);
      return;
    }
    setEnRenommage(false);
    router.refresh();
  }

  async function supprimer() {
    if (!window.confirm(`Supprimer définitivement le canal "${titreActuel}" ? Les messages et pièces jointes qu'il contient seront aussi supprimés. Cette action est irréversible.`)) {
      return;
    }
    setEnCours(true);
    const resultat = await supprimerCanalAction(conversationId);
    if (resultat.erreur) {
      setEnCours(false);
      setErreur(resultat.erreur);
      return;
    }
    router.push("/messagerie");
    router.refresh();
  }

  if (enRenommage) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={nouveauTitre}
          onChange={(e) => setNouveauTitre(e.target.value)}
          disabled={enCours}
          autoFocus
          className="w-40 rounded-md border border-paper-200 px-2 py-1 text-sm outline-none focus:border-navy-950"
        />
        <button
          onClick={enregistrerRenommage}
          disabled={enCours}
          className="rounded-md bg-navy-950 px-2.5 py-1 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50"
        >
          OK
        </button>
        <button
          onClick={() => {
            setEnRenommage(false);
            setNouveauTitre(titreActuel);
            setErreur(null);
          }}
          disabled={enCours}
          className="rounded-md border border-paper-200 px-2.5 py-1 text-sm text-paper-muted hover:bg-paper-50"
        >
          Annuler
        </button>
        {erreur && <span className="text-xs text-red-700">{erreur}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setEnRenommage(true)}
        disabled={enCours}
        className="rounded-md border border-paper-200 px-3 py-1.5 text-sm font-medium text-paper-muted hover:bg-paper-50 disabled:opacity-50"
      >
        Renommer
      </button>
      <button
        onClick={supprimer}
        disabled={enCours}
        className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        Supprimer
      </button>
      {erreur && <span className="text-xs text-red-700">{erreur}</span>}
    </div>
  );
}
