"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { genererFichiersDocumentsFictifsAction } from "./actions";
import { useTraduction } from "@/components/i18n/Langue";

export function GenererFichiersFictifsBouton({ nombreSansFichier }: { nombreSansFichier: number }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { t } = useTraduction();

  if (nombreSansFichier === 0) return null;

  async function generer() {
    setEnCours(true);
    setMessage(null);
    const resultat = await genererFichiersDocumentsFictifsAction();
    setEnCours(false);
    if (resultat.erreur) {
      setMessage(resultat.erreur);
      return;
    }
    setMessage(t(`${resultat.genere} fichier(s) généré(s).`, `${resultat.genere} file(s) generated.`));
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={generer}
        disabled={enCours}
        className="shrink-0 rounded-md border border-paper-200 bg-white px-4 py-2 text-sm font-medium text-paper-muted hover:bg-paper-50 disabled:opacity-50"
      >
        {enCours ? t("Génération…", "Generating…") : t(`Générer les fichiers manquants (${nombreSansFichier})`, `Generate missing files (${nombreSansFichier})`)}
      </button>
      {message && <span className="text-xs text-paper-muted">{message}</span>}
    </div>
  );
}
