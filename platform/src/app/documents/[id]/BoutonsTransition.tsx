"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { transitionnerAction } from "./actions";
import type { RoleUtilisateur, StatutDocument } from "@/lib/types";
import { useTraduction } from "@/components/i18n/Langue";

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
  const { t } = useTraduction();
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
      label:
        statutActuel === "brouillon"
          ? t("Déposer pour vérification", "Submit for review")
          : t("Corriger et redéposer", "Correct and resubmit"),
      statut: "en_verification",
      style: "bg-blue-600 hover:bg-blue-700",
    });
  }

  if (peutValider && statutActuel === "en_verification") {
    boutons.push({ label: t("Valider", "Approve"), statut: "valide", style: "bg-teal-600 hover:bg-teal-700" });
    boutons.push({ label: t("Rejeter", "Reject"), statut: "rejete", style: "bg-red-600 hover:bg-red-700" });
  }

  if (peutValider && statutActuel === "valide") {
    boutons.push({ label: t("Publier", "Publish"), statut: "publie", style: "bg-emerald-600 hover:bg-emerald-700" });
  }

  if (boutons.length === 0) return null;

  return (
    <div className="mt-4 space-y-3 border-t border-paper-200 pt-4">
      {(statutActuel === "en_verification" && peutValider) && (
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-[#1c2029]">{t("Commentaire (facultatif)", "Comment (optional)")}</span>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm"
            placeholder={t("Motif de validation ou de rejet…", "Reason for approval or rejection…")}
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
