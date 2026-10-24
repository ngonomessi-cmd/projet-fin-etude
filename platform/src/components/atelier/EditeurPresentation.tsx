"use client";

import { useRef, useState } from "react";
import type { ContenuPresentation, Diapositive, DispositionDiapositive } from "@/lib/atelier/contenus";
import { ApercuDiapositive } from "@/components/atelier/ApercuDiapositive";

const DISPOSITIONS: { valeur: DispositionDiapositive; libelle: string }[] = [
  { valeur: "titre", libelle: "Titre" },
  { valeur: "contenu", libelle: "Titre et contenu" },
  { valeur: "deux_colonnes", libelle: "Deux colonnes" },
];

const lignes = (texte: string) => texte.split("\n");
const texte = (puces: string[] | undefined) => (puces ?? []).join("\n");

const CHAMP = "w-full rounded-md border border-paper-200 bg-white px-3 py-2 text-sm";

export function EditeurPresentation({
  contenu,
  organisation,
  lectureSeule = false,
  onChange,
}: {
  contenu: ContenuPresentation;
  organisation: string;
  lectureSeule?: boolean;
  onChange?: (contenu: ContenuPresentation) => void;
}) {
  const [diapos, setDiapos] = useState<Diapositive[]>(contenu.diapositives);
  const diaposRef = useRef(contenu.diapositives);
  const [active, setActive] = useState(0);
  const courante = diapos[Math.min(active, diapos.length - 1)];

  function publier(nouvelles: Diapositive[]) {
    diaposRef.current = nouvelles;
    setDiapos(nouvelles);
    onChange?.({ diapositives: nouvelles });
  }

  function maj(modif: Partial<Diapositive>) {
    publier(diaposRef.current.map((d, i) => (i === active ? { ...d, ...modif } : d)));
  }

  function ajouter() {
    const nouvelle: Diapositive = { disposition: "contenu", titre: "Nouvelle diapositive", puces: ["Premier point"] };
    const liste = [...diaposRef.current];
    liste.splice(active + 1, 0, nouvelle);
    publier(liste);
    setActive(active + 1);
  }

  function dupliquer() {
    const liste = [...diaposRef.current];
    liste.splice(active + 1, 0, JSON.parse(JSON.stringify(courante)));
    publier(liste);
    setActive(active + 1);
  }

  function supprimer() {
    if (diaposRef.current.length <= 1) return;
    publier(diaposRef.current.filter((_, i) => i !== active));
    setActive(Math.max(0, active - 1));
  }

  function deplacer(sens: -1 | 1) {
    const cible = active + sens;
    if (cible < 0 || cible >= diaposRef.current.length) return;
    const liste = [...diaposRef.current];
    [liste[active], liste[cible]] = [liste[cible], liste[active]];
    publier(liste);
    setActive(cible);
  }

  if (lectureSeule) {
    return (
      <div className="space-y-6">
        {diapos.map((d, i) => (
          <div key={i} className="mx-auto max-w-4xl">
            <ApercuDiapositive diapositive={d} organisation={organisation} numero={i + 1} />
            {d.notes && <p className="mt-2 text-xs italic text-paper-muted">Notes : {d.notes}</p>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
      {/* Liste des diapositives */}
      <div className="flex gap-3 overflow-x-auto pb-2 lg:max-h-[75vh] lg:flex-col lg:overflow-y-auto lg:pb-0 lg:pr-1">
        {diapos.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`w-44 shrink-0 rounded-lg p-1.5 text-left transition-colors lg:w-full ${
              i === active ? "bg-gold-100 ring-2 ring-gold-500" : "hover:bg-paper-100"
            }`}
          >
            <ApercuDiapositive diapositive={d} organisation={organisation} numero={i + 1} />
            <span className="mt-1 block truncate text-[11px] text-paper-muted">
              {i + 1}. {d.titre || "Sans titre"}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={ajouter}
          className="w-44 shrink-0 rounded-lg border-2 border-dashed border-paper-200 py-6 text-sm text-paper-muted hover:border-gold-500 hover:text-navy-950 lg:w-full"
        >
          + Diapositive
        </button>
      </div>

      {/* Édition de la diapositive active */}
      <div className="min-w-0 space-y-4">
        <ApercuDiapositive diapositive={courante} organisation={organisation} numero={active + 1} />

        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-paper-200 bg-white p-2 text-xs">
          <label className="flex items-center gap-2">
            <span className="text-paper-muted">Disposition</span>
            <select
              value={courante.disposition}
              onChange={(e) => {
                const disposition = e.target.value as DispositionDiapositive;
                maj({
                  disposition,
                  colonneGauche: courante.colonneGauche ?? { titre: "Colonne 1", puces: courante.puces ?? [] },
                  colonneDroite: courante.colonneDroite ?? { titre: "Colonne 2", puces: [] },
                });
              }}
              className="rounded border border-paper-200 px-2 py-1"
            >
              {DISPOSITIONS.map((d) => (
                <option key={d.valeur} value={d.valeur}>
                  {d.libelle}
                </option>
              ))}
            </select>
          </label>
          <span className="mx-1 h-5 w-px bg-paper-200" />
          <button type="button" onClick={() => deplacer(-1)} disabled={active === 0} className="rounded px-2 py-1 hover:bg-paper-100 disabled:opacity-30">
            ↑ Monter
          </button>
          <button type="button" onClick={() => deplacer(1)} disabled={active === diapos.length - 1} className="rounded px-2 py-1 hover:bg-paper-100 disabled:opacity-30">
            ↓ Descendre
          </button>
          <button type="button" onClick={dupliquer} className="rounded px-2 py-1 hover:bg-paper-100">
            Dupliquer
          </button>
          <button
            type="button"
            onClick={supprimer}
            disabled={diapos.length <= 1}
            className="ml-auto rounded px-2 py-1 text-red-700 hover:bg-red-50 disabled:opacity-30"
          >
            Supprimer
          </button>
        </div>

        <div className="space-y-3 rounded-lg border border-paper-200 bg-white p-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Titre</span>
            <input value={courante.titre} onChange={(e) => maj({ titre: e.target.value })} className={CHAMP} />
          </label>

          {courante.disposition === "titre" && (
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Sous-titre</span>
              <input value={courante.sousTitre ?? ""} onChange={(e) => maj({ sousTitre: e.target.value })} className={CHAMP} />
            </label>
          )}

          {courante.disposition === "contenu" && (
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Points (un par ligne)</span>
              <textarea
                rows={7}
                value={texte(courante.puces)}
                onChange={(e) => maj({ puces: lignes(e.target.value) })}
                className={`${CHAMP} leading-relaxed`}
              />
            </label>
          )}

          {courante.disposition === "deux_colonnes" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {(["colonneGauche", "colonneDroite"] as const).map((cote) => {
                const col = courante[cote] ?? { titre: "", puces: [] };
                return (
                  <div key={cote} className="space-y-2">
                    <input
                      value={col.titre}
                      placeholder="Titre de la colonne"
                      onChange={(e) => maj({ [cote]: { ...col, titre: e.target.value } })}
                      className={CHAMP}
                    />
                    <textarea
                      rows={6}
                      value={texte(col.puces)}
                      placeholder="Points (un par ligne)"
                      onChange={(e) => maj({ [cote]: { ...col, puces: lignes(e.target.value) } })}
                      className={`${CHAMP} leading-relaxed`}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <label className="block text-sm">
            <span className="mb-1 block font-medium">
              Notes de l&apos;orateur <span className="font-normal text-paper-soft">(non affichées sur la diapositive)</span>
            </span>
            <textarea rows={2} value={courante.notes ?? ""} onChange={(e) => maj({ notes: e.target.value })} className={CHAMP} />
          </label>
        </div>
      </div>
    </div>
  );
}
