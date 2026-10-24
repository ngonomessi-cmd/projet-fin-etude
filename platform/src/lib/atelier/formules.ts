// Moteur de formules du tableur : syntaxe Excel, noms de fonctions en
// français ou en anglais, arguments séparés par « ; » ou « , ».
// Utilisé à la fois par l'éditeur (navigateur) et par les exports (serveur).

export type Valeur = number | string | boolean | null | ErreurFormule;
export class ErreurFormule {
  constructor(public code: "#DIV/0!" | "#VALEUR!" | "#NOM?" | "#REF!" | "#CYCLE!" | "#ERREUR!") {}
  toString() {
    return this.code;
  }
}

// --- Références de cellules -------------------------------------------------

export function indexEnColonne(index: number): string {
  let s = "";
  let n = index + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function colonneEnIndex(col: string): number {
  let n = 0;
  for (const c of col.toUpperCase()) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

export function lireReference(ref: string): { col: number; ligne: number } | null {
  const m = /^\$?([A-Za-z]{1,3})\$?(\d+)$/.exec(ref.trim());
  if (!m) return null;
  return { col: colonneEnIndex(m[1]), ligne: Number(m[2]) - 1 };
}

export function reference(col: number, ligne: number): string {
  return `${indexEnColonne(col)}${ligne + 1}`;
}

// --- Analyse lexicale -------------------------------------------------------

type Jeton =
  | { t: "nombre"; v: number }
  | { t: "texte"; v: string }
  | { t: "ref"; v: string }
  | { t: "nom"; v: string }
  | { t: "op"; v: string }
  | { t: "("; v: "(" }
  | { t: ")"; v: ")" }
  | { t: "sep"; v: string }
  | { t: ":"; v: ":" };

function decouper(source: string): Jeton[] {
  const jetons: Jeton[] = [];
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === '"') {
      let j = i + 1;
      let v = "";
      while (j < source.length) {
        if (source[j] === '"' && source[j + 1] === '"') {
          v += '"';
          j += 2;
        } else if (source[j] === '"') break;
        else v += source[j++];
      }
      jetons.push({ t: "texte", v });
      i = j + 1;
      continue;
    }
    const nombre = /^\d+(\.\d+)?/.exec(source.slice(i));
    if (nombre) {
      jetons.push({ t: "nombre", v: Number(nombre[0]) });
      i += nombre[0].length;
      continue;
    }
    const mot = /^\$?[A-Za-z][A-Za-z0-9_.]*\$?\d*/.exec(source.slice(i));
    if (mot) {
      const brut = mot[0];
      if (/^\$?[A-Za-z]{1,3}\$?\d+$/.test(brut)) jetons.push({ t: "ref", v: brut.replace(/\$/g, "").toUpperCase() });
      else jetons.push({ t: "nom", v: brut.toUpperCase() });
      i += brut.length;
      continue;
    }
    const deux = source.slice(i, i + 2);
    if (deux === "<>" || deux === "<=" || deux === ">=") {
      jetons.push({ t: "op", v: deux });
      i += 2;
      continue;
    }
    if ("+-*/^&=<>".includes(c)) jetons.push({ t: "op", v: c });
    else if (c === "(") jetons.push({ t: "(", v: "(" });
    else if (c === ")") jetons.push({ t: ")", v: ")" });
    else if (c === ";" || c === ",") jetons.push({ t: "sep", v: c });
    else if (c === ":") jetons.push({ t: ":", v: ":" });
    else throw new ErreurFormule("#ERREUR!");
    i++;
  }
  return jetons;
}

// --- Analyse syntaxique -----------------------------------------------------

type Noeud =
  | { n: "nombre"; v: number }
  | { n: "texte"; v: string }
  | { n: "booleen"; v: boolean }
  | { n: "ref"; v: string }
  | { n: "plage"; de: string; a: string }
  | { n: "fonction"; nom: string; args: Noeud[] }
  | { n: "binaire"; op: string; g: Noeud; d: Noeud }
  | { n: "unaire"; op: string; x: Noeud };

function analyser(source: string): Noeud {
  const jetons = decouper(source);
  let pos = 0;
  const voir = () => jetons[pos];
  const prendre = () => jetons[pos++];

  function comparaison(): Noeud {
    let g = concatenation();
    while (voir()?.t === "op" && ["=", "<>", "<", ">", "<=", ">="].includes(voir()!.v as string)) {
      const op = prendre().v as string;
      g = { n: "binaire", op, g, d: concatenation() };
    }
    return g;
  }
  function concatenation(): Noeud {
    let g = addition();
    while (voir()?.t === "op" && voir()!.v === "&") {
      prendre();
      g = { n: "binaire", op: "&", g, d: addition() };
    }
    return g;
  }
  function addition(): Noeud {
    let g = multiplication();
    while (voir()?.t === "op" && (voir()!.v === "+" || voir()!.v === "-")) {
      const op = prendre().v as string;
      g = { n: "binaire", op, g, d: multiplication() };
    }
    return g;
  }
  function multiplication(): Noeud {
    let g = puissance();
    while (voir()?.t === "op" && (voir()!.v === "*" || voir()!.v === "/")) {
      const op = prendre().v as string;
      g = { n: "binaire", op, g, d: puissance() };
    }
    return g;
  }
  function puissance(): Noeud {
    const g = unaire();
    if (voir()?.t === "op" && voir()!.v === "^") {
      prendre();
      return { n: "binaire", op: "^", g, d: puissance() };
    }
    return g;
  }
  function unaire(): Noeud {
    if (voir()?.t === "op" && (voir()!.v === "-" || voir()!.v === "+")) {
      const op = prendre().v as string;
      return { n: "unaire", op, x: unaire() };
    }
    return primaire();
  }
  function primaire(): Noeud {
    const j = prendre();
    if (!j) throw new ErreurFormule("#ERREUR!");
    if (j.t === "nombre") return { n: "nombre", v: j.v };
    if (j.t === "texte") return { n: "texte", v: j.v };
    if (j.t === "ref") {
      if (voir()?.t === ":") {
        prendre();
        const fin = prendre();
        if (!fin || fin.t !== "ref") throw new ErreurFormule("#REF!");
        return { n: "plage", de: j.v, a: fin.v };
      }
      return { n: "ref", v: j.v };
    }
    if (j.t === "nom") {
      if (voir()?.t === "(") {
        prendre();
        const args: Noeud[] = [];
        if (voir()?.t !== ")") {
          args.push(comparaison());
          while (voir()?.t === "sep") {
            prendre();
            args.push(comparaison());
          }
        }
        if (prendre()?.t !== ")") throw new ErreurFormule("#ERREUR!");
        return { n: "fonction", nom: j.v, args };
      }
      if (j.v === "VRAI" || j.v === "TRUE") return { n: "booleen", v: true };
      if (j.v === "FAUX" || j.v === "FALSE") return { n: "booleen", v: false };
      throw new ErreurFormule("#NOM?");
    }
    if (j.t === "(") {
      const x = comparaison();
      if (prendre()?.t !== ")") throw new ErreurFormule("#ERREUR!");
      return x;
    }
    throw new ErreurFormule("#ERREUR!");
  }

  const arbre = comparaison();
  if (pos < jetons.length) throw new ErreurFormule("#ERREUR!");
  return arbre;
}

// --- Évaluation ---------------------------------------------------------------

const ALIAS: Record<string, string> = {
  SUM: "SOMME",
  AVERAGE: "MOYENNE",
  COUNT: "NB",
  COUNTA: "NBVAL",
  IF: "SI",
  ROUND: "ARRONDI",
  AND: "ET",
  OR: "OU",
  NOT: "NON",
  CONCATENATE: "CONCATENER",
  CONCAT: "CONCATENER",
  PRODUCT: "PRODUIT",
  INT: "ENT",
};

const VERS_EXCEL: Record<string, string> = {
  SOMME: "SUM",
  MOYENNE: "AVERAGE",
  NB: "COUNT",
  NBVAL: "COUNTA",
  SI: "IF",
  ARRONDI: "ROUND",
  ET: "AND",
  OU: "OR",
  NON: "NOT",
  CONCATENER: "CONCATENATE",
  PRODUIT: "PRODUCT",
  ENT: "INT",
  VRAI: "TRUE",
  FAUX: "FALSE",
};

export const FONCTIONS_DISPONIBLES = [
  "SOMME",
  "MOYENNE",
  "MIN",
  "MAX",
  "NB",
  "NBVAL",
  "SI",
  "ARRONDI",
  "ABS",
  "ET",
  "OU",
  "NON",
  "PRODUIT",
  "ENT",
  "MOD",
  "CONCATENER",
];

export function valeurSaisie(brut: string | undefined): Valeur {
  if (brut === undefined) return null;
  const t = brut.trim();
  if (t === "") return null;
  if (/^-?[\d\s  ]+([.,]\d+)?$/.test(t) && /\d/.test(t)) {
    return Number(t.replace(/[\s  ]/g, "").replace(",", "."));
  }
  if (/^(vrai|true)$/i.test(t)) return true;
  if (/^(faux|false)$/i.test(t)) return false;
  return brut;
}

function versNombre(v: Valeur): number | ErreurFormule {
  if (v instanceof ErreurFormule) return v;
  if (v === null || v === "") return 0;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  const n = valeurSaisie(v);
  return typeof n === "number" ? n : new ErreurFormule("#VALEUR!");
}

function versTexte(v: Valeur): string {
  if (v === null) return "";
  if (typeof v === "boolean") return v ? "VRAI" : "FAUX";
  return String(v);
}

function versBooleen(v: Valeur): boolean | ErreurFormule {
  if (v instanceof ErreurFormule) return v;
  if (typeof v === "boolean") return v;
  const n = versNombre(v);
  return n instanceof ErreurFormule ? n : n !== 0;
}

export class Classeur {
  private cache = new Map<string, Valeur>();
  private enCours = new Set<string>();

  constructor(private cellules: Record<string, string>) {}

  valeur(ref: string): Valeur {
    const cle = ref.toUpperCase();
    if (this.cache.has(cle)) return this.cache.get(cle)!;
    if (this.enCours.has(cle)) return new ErreurFormule("#CYCLE!");
    const brut = this.cellules[cle];
    let resultat: Valeur;
    if (brut !== undefined && brut.trim().startsWith("=")) {
      this.enCours.add(cle);
      try {
        const brutCalcule = this.evaluer(analyser(brut.trim().slice(1)));
        resultat = Array.isArray(brutCalcule) ? new ErreurFormule("#VALEUR!") : brutCalcule;
      } catch (e) {
        resultat = e instanceof ErreurFormule ? e : new ErreurFormule("#ERREUR!");
      }
      this.enCours.delete(cle);
    } else {
      resultat = valeurSaisie(brut);
    }
    this.cache.set(cle, resultat);
    return resultat;
  }

  private plage(de: string, a: string): Valeur[] {
    const d = lireReference(de);
    const f = lireReference(a);
    if (!d || !f) throw new ErreurFormule("#REF!");
    const valeurs: Valeur[] = [];
    for (let l = Math.min(d.ligne, f.ligne); l <= Math.max(d.ligne, f.ligne); l++)
      for (let c = Math.min(d.col, f.col); c <= Math.max(d.col, f.col); c++) valeurs.push(this.valeur(reference(c, l)));
    return valeurs;
  }

  private aplatir(args: Noeud[]): Valeur[] {
    const sortie: Valeur[] = [];
    for (const a of args) {
      if (a.n === "plage") sortie.push(...this.plage(a.de, a.a));
      else sortie.push(this.evaluer(a) as Valeur);
    }
    return sortie;
  }

  private evaluer(x: Noeud): Valeur | Valeur[] {
    switch (x.n) {
      case "nombre":
        return x.v;
      case "texte":
        return x.v;
      case "booleen":
        return x.v;
      case "ref":
        if (!lireReference(x.v)) throw new ErreurFormule("#REF!");
        return this.valeur(x.v);
      case "plage":
        return this.plage(x.de, x.a);
      case "unaire": {
        const n = versNombre(this.evaluer(x.x) as Valeur);
        if (n instanceof ErreurFormule) return n;
        return x.op === "-" ? -n : n;
      }
      case "binaire":
        return this.binaire(x.op, this.evaluer(x.g) as Valeur, this.evaluer(x.d) as Valeur);
      case "fonction":
        return this.fonction(ALIAS[x.nom] ?? x.nom, x.args);
    }
  }

  private binaire(op: string, g: Valeur, d: Valeur): Valeur {
    if (g instanceof ErreurFormule) return g;
    if (d instanceof ErreurFormule) return d;
    if (op === "&") return versTexte(g) + versTexte(d);
    if (["=", "<>", "<", ">", "<=", ">="].includes(op)) {
      const a = typeof g === "number" || typeof d === "number" ? versNombre(g) : versTexte(g).toLowerCase();
      const b = typeof g === "number" || typeof d === "number" ? versNombre(d) : versTexte(d).toLowerCase();
      if (a instanceof ErreurFormule || b instanceof ErreurFormule) return false;
      switch (op) {
        case "=":
          return a === b;
        case "<>":
          return a !== b;
        case "<":
          return a < b;
        case ">":
          return a > b;
        case "<=":
          return a <= b;
        default:
          return a >= b;
      }
    }
    const a = versNombre(g);
    const b = versNombre(d);
    if (a instanceof ErreurFormule) return a;
    if (b instanceof ErreurFormule) return b;
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b === 0 ? new ErreurFormule("#DIV/0!") : a / b;
      default:
        return Math.pow(a, b);
    }
  }

  private fonction(nom: string, args: Noeud[]): Valeur {
    const nombres = () => {
      const vals = this.aplatir(args);
      const err = vals.find((v) => v instanceof ErreurFormule);
      if (err) return err as ErreurFormule;
      return vals.filter((v): v is number => typeof v === "number");
    };
    switch (nom) {
      case "SOMME": {
        const n = nombres();
        return n instanceof ErreurFormule ? n : n.reduce((s, v) => s + v, 0);
      }
      case "PRODUIT": {
        const n = nombres();
        return n instanceof ErreurFormule ? n : n.reduce((s, v) => s * v, 1);
      }
      case "MOYENNE": {
        const n = nombres();
        if (n instanceof ErreurFormule) return n;
        return n.length ? n.reduce((s, v) => s + v, 0) / n.length : new ErreurFormule("#DIV/0!");
      }
      case "MIN":
      case "MAX": {
        const n = nombres();
        if (n instanceof ErreurFormule) return n;
        if (!n.length) return 0;
        return nom === "MIN" ? Math.min(...n) : Math.max(...n);
      }
      case "NB": {
        const n = nombres();
        return n instanceof ErreurFormule ? n : n.length;
      }
      case "NBVAL":
        return this.aplatir(args).filter((v) => v !== null && v !== "").length;
      case "SI": {
        if (args.length < 2) throw new ErreurFormule("#VALEUR!");
        const cond = versBooleen(this.evaluer(args[0]) as Valeur);
        if (cond instanceof ErreurFormule) return cond;
        if (cond) return this.evaluer(args[1]) as Valeur;
        return args[2] ? (this.evaluer(args[2]) as Valeur) : false;
      }
      case "ARRONDI": {
        const n = versNombre(this.evaluer(args[0]) as Valeur);
        const p = args[1] ? versNombre(this.evaluer(args[1]) as Valeur) : 0;
        if (n instanceof ErreurFormule) return n;
        if (p instanceof ErreurFormule) return p;
        const f = Math.pow(10, p);
        return Math.round(n * f) / f;
      }
      case "ABS": {
        const n = versNombre(this.evaluer(args[0]) as Valeur);
        return n instanceof ErreurFormule ? n : Math.abs(n);
      }
      case "ENT": {
        const n = versNombre(this.evaluer(args[0]) as Valeur);
        return n instanceof ErreurFormule ? n : Math.floor(n);
      }
      case "MOD": {
        const a = versNombre(this.evaluer(args[0]) as Valeur);
        const b = versNombre(this.evaluer(args[1]) as Valeur);
        if (a instanceof ErreurFormule) return a;
        if (b instanceof ErreurFormule) return b;
        return b === 0 ? new ErreurFormule("#DIV/0!") : a - b * Math.floor(a / b);
      }
      case "ET":
      case "OU": {
        const vals = this.aplatir(args).map(versBooleen);
        const err = vals.find((v) => v instanceof ErreurFormule);
        if (err) return err as ErreurFormule;
        return nom === "ET" ? vals.every(Boolean) : vals.some(Boolean);
      }
      case "NON": {
        const b = versBooleen(this.evaluer(args[0]) as Valeur);
        return b instanceof ErreurFormule ? b : !b;
      }
      case "CONCATENER":
        return this.aplatir(args).map(versTexte).join("");
      default:
        return new ErreurFormule("#NOM?");
    }
  }
}

// Formule saisie (français, « ; ») → formule Excel (anglais, « , »), pour
// l'export .xlsx : les jetons sont réécrits un à un, textes compris.
export function formuleVersExcel(formule: string): string {
  const source = formule.trim().replace(/^=/, "");
  try {
    return decouper(source)
      .map((j) => {
        switch (j.t) {
          case "texte":
            return `"${j.v.replace(/"/g, '""')}"`;
          case "nom":
            return VERS_EXCEL[j.v] ?? j.v;
          case "sep":
            return ",";
          case "nombre":
            return String(j.v);
          default:
            return j.v;
        }
      })
      .join("");
  } catch {
    return source;
  }
}

export function formaterValeur(v: Valeur): string {
  if (v === null) return "";
  if (v instanceof ErreurFormule) return v.code;
  if (typeof v === "boolean") return v ? "VRAI" : "FAUX";
  if (typeof v === "number") {
    if (!Number.isFinite(v)) return "#VALEUR!";
    return v.toLocaleString("fr-FR", { maximumFractionDigits: 6 });
  }
  return v;
}

// Plus petite zone contenant toutes les cellules renseignées.
export function etendueUtilisee(cellules: Record<string, string>): { colonnes: number; lignes: number } {
  let colonnes = 0;
  let lignes = 0;
  for (const [ref, brut] of Object.entries(cellules)) {
    if (!brut || !brut.trim()) continue;
    const r = lireReference(ref);
    if (!r) continue;
    colonnes = Math.max(colonnes, r.col + 1);
    lignes = Math.max(lignes, r.ligne + 1);
  }
  return { colonnes, lignes };
}
