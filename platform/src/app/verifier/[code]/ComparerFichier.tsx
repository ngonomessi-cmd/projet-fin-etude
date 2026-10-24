"use client";

import { useState } from "react";
import { useTraduction } from "@/components/i18n/Langue";

// L'empreinte du fichier est calculée dans le navigateur : rien n'est envoyé.
export function ComparerFichier({ empreintes }: { empreintes: string[] }) {
  const { t } = useTraduction();
  const [resultat, setResultat] = useState<"identique" | "different" | null>(null);
  const [empreinte, setEmpreinte] = useState<string | null>(null);

  async function comparer(fichier: File | undefined) {
    if (!fichier) return;
    const condensat = await crypto.subtle.digest("SHA-256", await fichier.arrayBuffer());
    const hex = Array.from(new Uint8Array(condensat), (o) => o.toString(16).padStart(2, "0")).join("");
    setEmpreinte(hex);
    setResultat(empreintes.includes(hex) ? "identique" : "different");
  }

  return (
    <div className="mt-5 border-t border-paper-200 pt-4">
      <p className="text-sm font-semibold text-[#1c2029]">{t("Comparer un fichier PDF", "Compare a PDF file")}</p>
      <p className="mt-1 text-xs text-paper-muted">
        {t(
          "Choisissez le fichier reçu : son empreinte est calculée sur votre appareil, rien n'est envoyé.",
          "Choose the file you received: its fingerprint is computed on your device, nothing is uploaded."
        )}
      </p>
      <input
        type="file"
        accept="application/pdf,.pdf"
        onChange={(e) => comparer(e.target.files?.[0])}
        className="mt-2 w-full text-sm file:mr-3 file:rounded-md file:border file:border-paper-200 file:bg-white file:px-3 file:py-1.5 file:text-sm"
      />
      {resultat === "identique" && (
        <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          ✓ {t("Fichier identique au document signé enregistré.", "File identical to the recorded signed document.")}
        </p>
      )}
      {resultat === "different" && (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {t(
            "Ce fichier ne correspond pas au fichier enregistré. Une copie imprimée puis rescannée, filigranée ou retouchée ne correspond jamais : seul le fichier signé d'origine correspond. Pour une copie papier, fiez-vous au numéro et au code ci-dessus.",
            "This file does not match the recorded file. A printed and rescanned, watermarked or edited copy never matches: only the original signed file does. For a paper copy, rely on the number and code above."
          )}
        </p>
      )}
      {empreinte && <p className="mt-2 break-all font-mono text-[10px] text-paper-soft">SHA-256 : {empreinte}</p>}
    </div>
  );
}
