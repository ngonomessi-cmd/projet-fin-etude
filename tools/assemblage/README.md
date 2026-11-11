# Assemblage du dossier final (Word)

Ce dossier contient les outils qui produisent les documents Word du dossier (`export/`) à partir des sources
Markdown de `docs/` et des figures de `docs/figures/`.

## Régénérer tout (figures + documents)

```bash
bash tools/assemblage/generer.sh
```

Prérequis : `python3` avec `python-docx`, `pandoc` (≥ 3), `node` avec `playwright` (navigateur Chromium) et la
police Carlito (équivalente métrique de Calibri).

## Ce que fait la chaîne

1. **Figures** (`tools/figures/`) : chaque schéma est décrit en HTML/SVG avec une charte graphique commune,
   puis rendu en PNG haute résolution par Chromium (`rendu.mjs`). Le diagramme de Gantt (`gantt.py`) est
   construit directement à partir du tableau des tâches de `docs/03-gestion-de-projet/gantt.md` ; la matrice
   des risques (`gestion.py`) à partir du registre des risques. Modifier ces tableaux puis relancer la
   génération met les figures à jour.
2. **Assemblage** (`build.py`) : concatène les fichiers de `docs/` dans l'ordre du sommaire, retire les liens
   internes, décale les niveaux de titre, insère les sauts de page, le sommaire et les annexes.
3. **Conversion** : `pandoc` avec le modèle `khs-template.docx` (Calibri 11 pt, marges 2 cm, A4).
4. **Finition** (`finition.py`) : page de garde composée, table des figures, légendes numérotées
   « Figure n » (champ SEQ), tableaux mis en forme (en-tête répété, filets, lignes alternées, largeurs de
   colonnes proportionnées), pages en paysage pour le PBS, le WBS et le Gantt, en-tête courant, corps de
   texte justifié.

## Après génération

Ouvrir le document dans Microsoft Word et **accepter la mise à jour des champs** proposée à l'ouverture : le
sommaire et la table des figures se remplissent alors (ils apparaissent vides dans un aperçu LibreOffice en
ligne de commande).
