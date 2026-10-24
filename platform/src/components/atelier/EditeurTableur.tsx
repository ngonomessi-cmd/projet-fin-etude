"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ContenuTableur, Feuille } from "@/lib/atelier/contenus";
import {
  Classeur,
  ErreurFormule,
  FONCTIONS_DISPONIBLES,
  etendueUtilisee,
  formaterValeur,
  indexEnColonne,
  reference,
} from "@/lib/atelier/formules";

type Position = { col: number; ligne: number };

const COLONNES_MAX = 26;

export function EditeurTableur({
  contenu,
  lectureSeule = false,
  onChange,
}: {
  contenu: ContenuTableur;
  lectureSeule?: boolean;
  onChange?: (contenu: ContenuTableur) => void;
}) {
  const [feuilles, setFeuilles] = useState<Feuille[]>(contenu.feuilles);
  const feuillesRef = useRef<Feuille[]>(contenu.feuilles);
  const [active, setActive] = useState(0);
  const [selection, setSelection] = useState<Position>({ col: 0, ligne: 0 });
  const [edition, setEdition] = useState<string | null>(null);
  const [lignesAffichees, setLignesAffichees] = useState(0);
  const grille = useRef<HTMLDivElement>(null);
  const champCellule = useRef<HTMLInputElement>(null);

  const feuille = feuilles[Math.min(active, feuilles.length - 1)];
  const calcul = useMemo(() => new Classeur(feuille.cellules), [feuille.cellules]);
  const gras = useMemo(() => new Set((feuille.gras ?? []).map((r) => r.toUpperCase())), [feuille.gras]);
  const etendue = etendueUtilisee(feuille.cellules);
  const nbColonnes = Math.min(COLONNES_MAX, Math.max(10, etendue.colonnes + 2));
  const nbLignes = Math.max(30, etendue.lignes + 10, lignesAffichees);
  const refSelection = reference(selection.col, selection.ligne);
  const brutSelection = feuille.cellules[refSelection] ?? "";

  useEffect(() => {
    if (edition !== null) champCellule.current?.focus();
  }, [edition]);

  // Toujours repartir du dernier état publié (et non de celui capturé au
  // rendu) : deux saisies rapprochées ne s'écrasent jamais.
  function publier(nouvelles: Feuille[]) {
    feuillesRef.current = nouvelles;
    setFeuilles(nouvelles);
    onChange?.({ feuilles: nouvelles });
  }

  function majFeuille(modif: (f: Feuille) => Feuille) {
    publier(feuillesRef.current.map((f, i) => (i === active ? modif(f) : f)));
  }

  function ecrire(ref: string, valeur: string) {
    majFeuille((f) => {
      const cellules = { ...f.cellules };
      if (valeur.trim() === "") delete cellules[ref];
      else cellules[ref] = valeur;
      return { ...f, cellules };
    });
  }

  function deplacer(dc: number, dl: number) {
    setSelection((s) => ({
      col: Math.min(nbColonnes - 1, Math.max(0, s.col + dc)),
      ligne: Math.max(0, s.ligne + dl),
    }));
  }

  function valider(dc = 0, dl = 1) {
    if (edition !== null) ecrire(refSelection, edition);
    setEdition(null);
    deplacer(dc, dl);
    grille.current?.focus();
  }

  function basculerGras() {
    majFeuille((f) => {
      const ensemble = new Set(f.gras ?? []);
      if (ensemble.has(refSelection)) ensemble.delete(refSelection);
      else ensemble.add(refSelection);
      return { ...f, gras: [...ensemble] };
    });
  }

  function surToucheGrille(e: React.KeyboardEvent) {
    if (lectureSeule || edition !== null) {
      if (edition === null) {
        const fleches: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
        if (fleches[e.key]) {
          e.preventDefault();
          deplacer(...fleches[e.key]);
        }
      }
      return;
    }
    const fleches: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    if (fleches[e.key]) {
      e.preventDefault();
      deplacer(...fleches[e.key]);
    } else if (e.key === "Enter" || e.key === "F2") {
      e.preventDefault();
      setEdition(brutSelection);
    } else if (e.key === "Tab") {
      e.preventDefault();
      deplacer(e.shiftKey ? -1 : 1, 0);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      ecrire(refSelection, "");
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      basculerGras();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      setEdition(e.key);
    }
  }

  function ajouterFeuille() {
    const nom = `Feuille ${feuilles.length + 1}`;
    publier([...feuillesRef.current, { nom, cellules: {}, gras: [] }]);
    setActive(feuilles.length);
    setSelection({ col: 0, ligne: 0 });
  }

  function renommerFeuille(index: number) {
    const nom = window.prompt("Nom de la feuille :", feuilles[index].nom)?.trim();
    if (nom) publier(feuillesRef.current.map((f, i) => (i === index ? { ...f, nom } : f)));
  }

  function supprimerFeuille(index: number) {
    if (feuilles.length <= 1) return;
    if (!window.confirm(`Supprimer la feuille « ${feuilles[index].nom} » et son contenu ?`)) return;
    publier(feuillesRef.current.filter((_, i) => i !== index));
    setActive(Math.max(0, index - 1));
  }

  const largeur = (col: number) => feuille.largeurs?.[indexEnColonne(col)] ?? (col === 0 ? 180 : 120);

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-paper-200 bg-white shadow-sm">
      {/* Barre de formule */}
      <div className="flex flex-wrap items-center gap-2 border-b border-paper-200 bg-paper-50 px-2 py-1.5">
        <span className="w-14 shrink-0 rounded border border-paper-200 bg-white px-2 py-1 text-center font-mono text-xs font-semibold">
          {refSelection}
        </span>
        <span className="font-serif text-sm italic text-paper-muted">fx</span>
        <input
          value={edition ?? brutSelection}
          readOnly={lectureSeule}
          onFocus={() => !lectureSeule && edition === null && setEdition(brutSelection)}
          onChange={(e) => setEdition(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              valider();
            } else if (e.key === "Escape") {
              setEdition(null);
              grille.current?.focus();
            }
          }}
          placeholder={lectureSeule ? "" : "Valeur ou formule, ex. =SOMME(B2:B10)"}
          className="min-w-0 flex-1 rounded border border-paper-200 bg-white px-2 py-1 font-mono text-xs"
        />
        {!lectureSeule && (
          <>
            <button
              type="button"
              onClick={basculerGras}
              title="Gras (Ctrl+B)"
              className={`rounded px-2.5 py-1 text-xs font-bold ${gras.has(refSelection) ? "bg-navy-950 text-white" : "hover:bg-paper-100"}`}
            >
              G
            </button>
            <details className="relative text-xs">
              <summary className="cursor-pointer rounded px-2 py-1 text-paper-muted hover:bg-paper-100">Fonctions</summary>
              <div className="absolute right-0 z-20 mt-1 w-72 rounded-md border border-paper-200 bg-white p-3 text-[11px] leading-relaxed text-paper-muted shadow-lg">
                <p className="mb-1 font-semibold text-[#1c2029]">Formules (commencer par « = »)</p>
                <p>{FONCTIONS_DISPONIBLES.join(", ")}</p>
                <p className="mt-2">Exemples : =SOMME(B2:B10) · =MOYENNE(C2:C5) · =SI(D2&gt;0;&quot;OK&quot;;&quot;À revoir&quot;) · =ARRONDI(B2*1,1925;0)</p>
                <p className="mt-2">Opérateurs : + − * / ^ &amp; = &lt;&gt; &lt; &gt;. Noms anglais acceptés (SUM, IF…).</p>
              </div>
            </details>
          </>
        )}
      </div>

      {/* Grille */}
      <div
        ref={grille}
        tabIndex={0}
        onKeyDown={surToucheGrille}
        className="max-h-[65vh] overflow-auto outline-none"
      >
        <table className="border-collapse text-[13px]" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 44 }} />
            {Array.from({ length: nbColonnes }, (_, c) => (
              <col key={c} style={{ width: largeur(c) }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="border border-paper-200 bg-paper-100" />
              {Array.from({ length: nbColonnes }, (_, c) => (
                <th
                  key={c}
                  className={`border border-paper-200 py-1 text-center text-[11px] font-semibold ${
                    c === selection.col ? "bg-gold-100 text-navy-950" : "bg-paper-100 text-paper-muted"
                  }`}
                >
                  {indexEnColonne(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: nbLignes }, (_, l) => (
              <tr key={l}>
                <th
                  className={`sticky left-0 border border-paper-200 px-1 text-center text-[11px] font-semibold ${
                    l === selection.ligne ? "bg-gold-100 text-navy-950" : "bg-paper-100 text-paper-muted"
                  }`}
                >
                  {l + 1}
                </th>
                {Array.from({ length: nbColonnes }, (_, c) => {
                  const ref = reference(c, l);
                  const choisie = c === selection.col && l === selection.ligne;
                  if (choisie && edition !== null && !lectureSeule)
                    return (
                      <td key={c} className="border-2 border-navy-950 p-0">
                        <input
                          ref={champCellule}
                          value={edition}
                          onChange={(e) => setEdition(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              valider(0, 1);
                            } else if (e.key === "Tab") {
                              e.preventDefault();
                              valider(e.shiftKey ? -1 : 1, 0);
                            } else if (e.key === "Escape") {
                              setEdition(null);
                              grille.current?.focus();
                            }
                          }}
                          onBlur={() => edition !== null && valider(0, 0)}
                          className="h-full w-full px-1.5 py-1 font-mono text-[12px] outline-none"
                        />
                      </td>
                    );
                  const valeur = calcul.valeur(ref);
                  const nombre = typeof valeur === "number";
                  const erreur = valeur instanceof ErreurFormule;
                  return (
                    <td
                      key={c}
                      onMouseDown={() => {
                        if (edition !== null) valider(0, 0);
                        setSelection({ col: c, ligne: l });
                      }}
                      onDoubleClick={() => !lectureSeule && setEdition(feuille.cellules[ref] ?? "")}
                      className={`h-7 truncate border px-1.5 ${choisie ? "border-2 border-navy-950 bg-gold-50" : "border-paper-200"} ${
                        nombre ? "text-right tabular-nums" : ""
                      } ${erreur ? "text-red-600" : ""} ${gras.has(ref) ? "font-bold" : ""}`}
                    >
                      {formaterValeur(valeur)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Onglets */}
      <div className="flex items-center gap-1 overflow-x-auto border-t border-paper-200 bg-paper-50 px-2 py-1">
        {feuilles.map((f, i) => (
          <div key={i} className={`flex items-center rounded-t ${i === active ? "bg-white shadow-sm" : ""}`}>
            <button
              type="button"
              onClick={() => {
                setActive(i);
                setSelection({ col: 0, ligne: 0 });
                setEdition(null);
              }}
              onDoubleClick={() => !lectureSeule && renommerFeuille(i)}
              title={lectureSeule ? f.nom : "Double-clic pour renommer"}
              className={`px-3 py-1 text-xs ${i === active ? "font-semibold text-navy-950" : "text-paper-muted hover:text-[#1c2029]"}`}
            >
              {f.nom}
            </button>
            {!lectureSeule && i === active && feuilles.length > 1 && (
              <button type="button" onClick={() => supprimerFeuille(i)} title="Supprimer la feuille" className="pr-2 text-xs text-paper-soft hover:text-red-600">
                ×
              </button>
            )}
          </div>
        ))}
        {!lectureSeule && (
          <button type="button" onClick={ajouterFeuille} className="px-2 py-1 text-xs text-paper-muted hover:text-navy-950" title="Ajouter une feuille">
            + Feuille
          </button>
        )}
        <button
          type="button"
          onClick={() => setLignesAffichees(nbLignes + 20)}
          className="ml-auto shrink-0 px-2 py-1 text-xs text-paper-muted hover:text-navy-950"
        >
          + 20 lignes
        </button>
      </div>
    </div>
  );
}
