"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { creerCanalDepartementAction } from "./actions";
import { useTraduction } from "@/components/i18n/Langue";

export function CreerCanalDepartement() {
  const router = useRouter();
  const { t } = useTraduction();
  const [departement, setDepartement] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  async function creer(formData: FormData) {
    setEnCours(true);
    setErreur(null);
    setSucces(null);
    const nom = String(formData.get("departement") ?? "");
    const resultat = await creerCanalDepartementAction(nom);
    setEnCours(false);
    if (resultat?.erreur) {
      setErreur(resultat.erreur);
      return;
    }
    setSucces(t(`Canal « ${nom.trim()} » créé.`, `Channel "${nom.trim()}" created.`));
    setDepartement("");
    router.refresh();
  }

  return (
    <form action={creer} className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-paper-200 bg-paper-50 px-3 py-2 text-sm">
      <span className="text-paper-muted">{t("Créer d'avance le canal d'un département :", "Create a department channel in advance:")}</span>
      <input
        name="departement"
        value={departement}
        onChange={(e) => setDepartement(e.target.value)}
        placeholder={t("ex. Direction, Conformité, Crédit…", "e.g. Management, Compliance, Credit…")}
        disabled={enCours}
        className="rounded-md border border-paper-200 bg-white px-2 py-1 text-sm"
      />
      <button type="submit" disabled={enCours} className="rounded-md bg-navy-950 px-3 py-1 text-xs font-medium text-white hover:bg-navy-900 disabled:opacity-50">
        {enCours ? "…" : t("Créer", "Create")}
      </button>
      {erreur && <span className="text-xs text-red-600">{erreur}</span>}
      {succes && <span className="text-xs text-emerald-700">{succes}</span>}
    </form>
  );
}
