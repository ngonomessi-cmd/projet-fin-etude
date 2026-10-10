"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { modifierProfilAction } from "./actions";

export function ChampTexteModifiable({
  utilisateurId,
  champ,
  valeurInitiale,
}: {
  utilisateurId: string;
  champ: "nom_complet" | "departement";
  valeurInitiale: string;
}) {
  const router = useRouter();
  const [valeur, setValeur] = useState(valeurInitiale);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function enregistrerSiModifie() {
    const nettoyee = valeur.trim();
    if (nettoyee === "" || nettoyee === valeurInitiale) {
      setValeur(valeurInitiale);
      return;
    }
    setEnCours(true);
    setErreur(null);
    const resultat = await modifierProfilAction(
      utilisateurId,
      champ === "nom_complet" ? nettoyee : undefined,
      champ === "departement" ? nettoyee : undefined
    );
    setEnCours(false);
    if (resultat.erreur) {
      setErreur(resultat.erreur);
      setValeur(valeurInitiale);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <input
        value={valeur}
        onChange={(e) => setValeur(e.target.value)}
        onBlur={enregistrerSiModifie}
        disabled={enCours}
        className="w-full rounded-md border border-transparent px-2 py-1 text-sm hover:border-slate-300 focus:border-slate-400 focus:bg-white focus:outline-none disabled:opacity-50"
      />
      {erreur && <p className="mt-0.5 text-xs text-red-600">{erreur}</p>}
    </div>
  );
}
