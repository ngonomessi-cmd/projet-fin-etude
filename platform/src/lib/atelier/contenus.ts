import type { FormatAtelier } from "@/lib/types";

// Contenus éditables dans la plateforme, stockés en JSON (documents.contenu).

// Texte (Word) : document TipTap / ProseMirror.
export type NoeudTexte = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: NoeudTexte[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};
export type ContenuTexte = NoeudTexte & { type: "doc" };

// Tableur (Excel) : cellules saisies telles quelles ("12", "texte", "=SOMME(A1:A3)").
export type Feuille = {
  nom: string;
  cellules: Record<string, string>;
  gras?: string[];
  largeurs?: Record<string, number>;
};
export type ContenuTableur = { feuilles: Feuille[] };

// Présentation (PowerPoint)
export type DispositionDiapositive = "titre" | "contenu" | "deux_colonnes";
export type Colonne = { titre: string; puces: string[] };
export type Diapositive = {
  disposition: DispositionDiapositive;
  titre: string;
  sousTitre?: string;
  puces?: string[];
  colonneGauche?: Colonne;
  colonneDroite?: Colonne;
  notes?: string;
};
export type ContenuPresentation = { diapositives: Diapositive[] };

export const LABEL_FORMAT: Record<FormatAtelier, string> = {
  texte: "Document texte (Word)",
  tableur: "Classeur (Excel)",
  presentation: "Présentation (PowerPoint)",
};

export const LABEL_FORMAT_COURT: Record<FormatAtelier, string> = {
  texte: "Word",
  tableur: "Excel",
  presentation: "PowerPoint",
};

export const EXTENSION_FORMAT: Record<FormatAtelier, "docx" | "xlsx" | "pptx"> = {
  texte: "docx",
  tableur: "xlsx",
  presentation: "pptx",
};

export function contenuVide(format: FormatAtelier): ContenuTexte | ContenuTableur | ContenuPresentation {
  if (format === "texte") return { type: "doc", content: [{ type: "paragraph" }] };
  if (format === "tableur") return { feuilles: [{ nom: "Feuille 1", cellules: {} }] };
  return { diapositives: [{ disposition: "titre", titre: "Titre de la présentation", sousTitre: "Sous-titre" }] };
}

export function normaliserTableur(c: unknown): ContenuTableur {
  const brut = c as Partial<ContenuTableur> | null;
  const feuilles = Array.isArray(brut?.feuilles) && brut!.feuilles.length > 0 ? brut!.feuilles : [{ nom: "Feuille 1", cellules: {} }];
  return {
    feuilles: feuilles.map((f, i) => ({
      nom: typeof f?.nom === "string" && f.nom ? f.nom : `Feuille ${i + 1}`,
      cellules: f?.cellules && typeof f.cellules === "object" ? f.cellules : {},
      gras: Array.isArray(f?.gras) ? f.gras : [],
      largeurs: f?.largeurs ?? {},
    })),
  };
}

export function normaliserPresentation(c: unknown): ContenuPresentation {
  const brut = c as Partial<ContenuPresentation> | null;
  const diapositives = Array.isArray(brut?.diapositives) && brut!.diapositives.length > 0 ? brut!.diapositives : [];
  return {
    diapositives: diapositives.length
      ? diapositives
      : (contenuVide("presentation") as ContenuPresentation).diapositives,
  };
}

export function normaliserTexte(c: unknown): ContenuTexte {
  const brut = c as ContenuTexte | null;
  return brut && brut.type === "doc" ? brut : (contenuVide("texte") as ContenuTexte);
}
