"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changerDureeConservationAction } from "./actions";

export function ParametresRetention({ dureeActuelle }: { dureeActuelle: number }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function changer(formData: FormData) {
    setEnCours(true);
    setErreur(null);
    const annees = Number(formData.get("annees"));
    const resultat = await changerDureeConservationAction(annees);
    setEnCours(false);
    if (resultat?.erreur) {
      setErreur(resultat.erreur);
      return;
    }
    router.refresh();
  }

  return (
    <form action={changer} className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-paper-200 bg-paper-50 px-3 py-2 text-sm">
      <span className="text-paper-muted">Durée de conservation des messages :</span>
      <select name="annees" defaultValue={dureeActuelle} disabled={enCours} className="rounded-md border border-paper-200 bg-white px-2 py-1 text-sm">
        {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n} an{n > 1 ? "s" : ""}
          </option>
        ))}
      </select>
      <button type="submit" disabled={enCours} className="rounded-md bg-navy-950 px-3 py-1 text-xs font-medium text-white hover:bg-navy-900 disabled:opacity-50">
        {enCours ? "…" : "Appliquer"}
      </button>
      {erreur && <span className="text-xs text-red-600">{erreur}</span>}
    </form>
  );
}
