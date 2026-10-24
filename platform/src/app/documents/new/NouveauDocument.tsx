"use client";

import { useState } from "react";
import type { FormatAtelier, ModeleDocument } from "@/lib/types";
import { LABEL_FORMAT } from "@/lib/atelier/contenus";
import { creerDocumentAtelierAction } from "./actions";
import { FormulaireDepot } from "./FormulaireDepot";

const FORMATS: { format: FormatAtelier; icone: string; teinte: string; detail: string }[] = [
  { format: "texte", icone: "W", teinte: "bg-[#2b579a]", detail: "Notes, courriers, rapports, procédures" },
  { format: "tableur", icone: "X", teinte: "bg-[#217346]", detail: "Budgets, suivis, tableaux avec formules" },
  { format: "presentation", icone: "P", teinte: "bg-[#c43e1c]", detail: "Diapositives pour réunions et comités" },
];

const CHAMP = "w-full rounded-md border border-paper-200 px-3 py-2 text-sm";

export function NouveauDocument({ modeles }: { modeles: ModeleDocument[] }) {
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
            ["rediger", "Rédiger dans la plateforme"],
            ["deposer", "Déposer un fichier existant"],
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
            <legend className="mb-2 text-sm font-medium text-[#1c2029]">Type de document</legend>
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
                    <span className="block text-sm font-semibold text-[#1c2029]">{LABEL_FORMAT[f.format]}</span>
                    <span className="mt-0.5 block text-xs text-paper-muted">{f.detail}</span>
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-[#1c2029]">Point de départ</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm ${modeleId === "" ? "border-navy-950 bg-paper-50" : "border-paper-200"}`}
              >
                <input type="radio" name="depart" checked={modeleId === ""} onChange={() => setModeleId("")} className="mt-0.5" />
                <span>
                  <span className="block font-medium">Page vierge</span>
                  <span className="block text-xs text-paper-muted">Partir de zéro.</span>
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
            <span className="mb-1 block font-medium text-[#1c2029]">Titre</span>
            <input name="titre" required value={titre} onChange={(e) => setTitre(e.target.value)} className={CHAMP} />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[#1c2029]">Classification</span>
            <select name="classification" required defaultValue="" className={CHAMP}>
              <option value="" disabled>
                Choisir un niveau de confidentialité…
              </option>
              <option value="public_interne">Public interne</option>
              <option value="restreint">Restreint (mon département)</option>
              <option value="confidentiel">Confidentiel</option>
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-[#1c2029]">
              Description <span className="font-normal text-paper-soft">(facultatif)</span>
            </span>
            <textarea name="description" rows={2} className={CHAMP} />
          </label>

          {erreur && <p className="text-sm text-red-600">{erreur}</p>}

          <button
            type="submit"
            disabled={enCours}
            className="w-full rounded-md bg-navy-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50"
          >
            {enCours ? "Création…" : "Créer et ouvrir l'éditeur"}
          </button>
        </form>
      )}
    </div>
  );
}
