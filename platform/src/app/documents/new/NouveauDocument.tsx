"use client";

import { useState } from "react";
import type { FormatAtelier, ModeleDocument } from "@/lib/types";
import { libelleFormat } from "@/lib/atelier/contenus";
import { creerDocumentAtelierAction } from "./actions";
import { FormulaireDepot } from "./FormulaireDepot";
import { ChampNature } from "@/components/ChampNature";
import { useTraduction } from "@/components/i18n/Langue";

const FORMATS: { format: FormatAtelier; icone: string; teinte: string; detail: [string, string] }[] = [
  { format: "texte", icone: "W", teinte: "bg-[#2b579a]", detail: ["Notes, courriers, rapports, procédures", "Memos, letters, reports, procedures"] },
  { format: "tableur", icone: "X", teinte: "bg-[#217346]", detail: ["Budgets, suivis, tableaux avec formules", "Budgets, trackers, tables with formulas"] },
  { format: "presentation", icone: "P", teinte: "bg-[#c43e1c]", detail: ["Diapositives pour réunions et comités", "Slides for meetings and committees"] },
];

const CHAMP = "w-full rounded-md border border-paper-200 px-3 py-2 text-sm";

export function NouveauDocument({ modeles }: { modeles: ModeleDocument[] }) {
  const { t, langue } = useTraduction();
  const [onglet, setOnglet] = useState<"rediger" | "deposer">("rediger");
  const [format, setFormat] = useState<FormatAtelier>("texte");
  const [modeleId, setModeleId] = useState("");
  const [titre, setTitre] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const modelesDuFormat = modeles.filter((m) => m.format === format);

  async function soumettre(formData: FormData) {
    setEnCours(true);
    setErreur(null);
    const r = await creerDocumentAtelierAction(formData);
    setEnCours(false);
    if (r?.erreur) setErreur(r.erreur);
  }

  return (
    <div>
      <div className="mb-5 inline-flex rounded-lg border border-paper-200 bg-white p-1 text-sm">
        {(
          [
            ["rediger", t("Rédiger dans la plateforme", "Write in the platform")],
            ["deposer", t("Déposer un fichier existant", "Upload an existing file")],
          ] as const
        ).map(([valeur, libelle]) => (
          <button
            key={valeur}
            type="button"
            onClick={() => setOnglet(valeur)}
            className={`rounded-md px-4 py-1.5 font-medium transition-colors ${onglet === valeur ? "bg-navy-950 text-white" : "text-paper-muted hover:text-[#1c2029]"}`}
          >
            {libelle}
          </button>
        ))}
      </div>

      {onglet === "deposer" ? (
        <FormulaireDepot />
      ) : (
        <form action={soumettre} className="space-y-5 rounded-lg border border-paper-200 bg-white p-5 shadow-sm">
          <input type="hidden" name="format" value={format} />
          <input type="hidden" name="modele_id" value={modeleId} />

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-[#1c2029]">{t("Type de document", "Document format")}</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {FORMATS.map((f) => (
                <button
                  key={f.format}
                  type="button"
                  onClick={() => {
                    setFormat(f.format);
                    setModeleId("");
                  }}
                  aria-pressed={format === f.format}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                    format === f.format ? "border-gold-500 bg-gold-50 ring-1 ring-gold-500" : "border-paper-200 hover:border-paper-soft"
                  }`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-bold text-white ${f.teinte}`}>
                    {f.icone}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[#1c2029]">{libelleFormat(f.format, langue)}</span>
                    <span className="mt-0.5 block text-xs text-paper-muted">{f.detail[langue === "en" ? 1 : 0]}</span>
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-[#1c2029]">{t("Point de départ", "Starting point")}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm ${modeleId === "" ? "border-navy-950 bg-paper-50" : "border-paper-200"}`}
              >
                <input type="radio" name="depart" checked={modeleId === ""} onChange={() => setModeleId("")} className="mt-0.5" />
                <span>
                  <span className="block font-medium">{t("Page vierge", "Blank page")}</span>
                  <span className="block text-xs text-paper-muted">{t("Partir de zéro.", "Start from scratch.")}</span>
                </span>
              </label>
              {modelesDuFormat.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm ${modeleId === m.id ? "border-navy-950 bg-paper-50" : "border-paper-200"}`}
                >
                  <input
                    type="radio"
                    name="depart"
                    checked={modeleId === m.id}
                    onChange={() => {
                      setModeleId(m.id);
                      if (!titre) setTitre(m.titre);
                    }}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block font-medium">{m.titre}</span>
                    {m.description && <span className="block text-xs text-paper-muted">{m.description}</span>}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[#1c2029]">{t("Titre", "Title")}</span>
            <input name="titre" required value={titre} onChange={(e) => setTitre(e.target.value)} className={CHAMP} />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[#1c2029]">Classification</span>
            <select name="classification" required defaultValue="" className={CHAMP}>
              <option value="" disabled>
                {t("Choisir un niveau de confidentialité…", "Choose a confidentiality level…")}
              </option>
              <option value="public_interne">{t("Public interne", "Internal public")}</option>
              <option value="restreint">{t("Restreint (mon département)", "Restricted (my department)")}</option>
              <option value="confidentiel">{t("Confidentiel", "Confidential")}</option>
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[#1c2029]">{t("Nature", "Document type")}</span>
            <ChampNature className={CHAMP} />
            <span className="mt-1 block text-xs text-paper-soft">
              {t("Détermine la durée de conservation une fois le document archivé.", "Sets how long the document is kept once archived.")}
            </span>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[#1c2029]">
              Description <span className="font-normal text-paper-soft">({t("facultatif", "optional")})</span>
            </span>
            <textarea name="description" rows={2} className={CHAMP} />
          </label>

          {erreur && <p className="text-sm text-red-600">{erreur}</p>}

          <button
            type="submit"
            disabled={enCours}
            className="w-full rounded-md bg-navy-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50"
          >
            {enCours ? t("Création…", "Creating…") : t("Créer et ouvrir l'éditeur", "Create and open the editor")}
          </button>
        </form>
      )}
    </div>
  );
}
