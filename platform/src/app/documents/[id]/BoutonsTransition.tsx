"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { transitionnerAction } from "./actions";
import type { RoleUtilisateur, StatutDocument } from "@/lib/types";

export function BoutonsTransition({
  documentId,
  statutActuel,
  role,
  estProprietaire,
  meDepartement,
}: {
  documentId: string;
  statutActuel: StatutDocument;
  role: RoleUtilisateur;
  estProprietaire: boolean;
  meDepartement: boolean;
}) {
  const router = useRouter();
  const [commentaire, setCommentaire] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const peutValider = role === "administrateur" || (role === "validateur" && meDepartement);

  async function transitionner(nouveauStatut: StatutDocument) {
    setEnCours(true);
    setErreur(null);
    const resultat = await transitionnerAction(documentId, nouveauStatut, commentaire || undefined);
    setEnCours(false);
    if (resultat.erreur) {
      setErreur(resultat.erreur);
      return;
    }
    setCommentaire("");
    router.refresh();
  }

  const boutons: { label: string; statut: StatutDocument; style: string }[] = [];

  if (estProprietaire && (statutActuel === "brouillon" || statutActuel === "rejete")) {
    boutons.push({
      label: statutActuel === "brouillon" ? "Déposer pour vérification" : "Corriger et redéposer",
      statut: "en_verification",
      style: "bg-blue-600 hover:bg-blue-700",
    });
  }

  if (peutValider && statutActuel === "en_verification") {
    boutons.push({ label: "Valider", statut: "valide", style: "bg-teal-600 hover:bg-teal-700" });
    boutons.push({ label: "Rejeter", statut: "rejete", style: "bg-red-600 hover:bg-red-700" });
  }

  if (peutValider && statutActuel === "valide") {
    boutons.push({ label: "Publier", statut: "publie", style: "bg-emerald-600 hover:bg-emerald-700" });
  }

  if (boutons.length === 0) return null;

  return (
    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
      {(statutActuel === "en_verification" && peutValider) && (
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Commentaire (facultatif)</span>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Motif de validation ou de rejet…"
          />
        </label>
      )}

      <div className="flex gap-2">
        {boutons.map((bouton) => (
          <button
            key={bouton.statut}
            disabled={enCours}
            onClick={() => transitionner(bouton.statut)}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${bouton.style}`}
          >
            {bouton.label}
          </button>
        ))}
      </div>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
    </div>
  );
}
