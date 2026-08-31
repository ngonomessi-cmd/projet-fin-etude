# Assemblage du dossier final (Word)

Ce dossier contient les outils pour regénérer le document Word final
(`export/Dossier_de_mise_en_situation_KHS_Bank_MOM-TECH.docx`) à partir des sources Markdown du dossier
`docs/`.

## Prérequis

- `pandoc` (≥ 2.x)
- `libreoffice-writer` (uniquement pour prévisualiser le rendu en PDF, optionnel)

## Régénérer le document

Depuis la racine du dépôt :

```bash
python3 tools/assemblage/build.py
pandoc tools/assemblage/dossier.md \
  -o export/Dossier_de_mise_en_situation_KHS_Bank_MOM-TECH.docx \
  --reference-doc=tools/assemblage/khs-template.docx \
  --toc-depth=3
```

`build.py` concatène tous les fichiers de `docs/` dans l'ordre du sommaire, retire les liens Markdown
internes (inutiles une fois le document fusionné), décale les niveaux de titre pour qu'ils s'imbriquent
sous chaque grande partie, insère les sauts de page et le sommaire (champ TOC natif Word), et ajoute une
page de garde et l'abstract en anglais.

`khs-template.docx` est un modèle de référence pandoc personnalisé : police Calibri 11 pt pour le corps de
texte (conforme à l'exigence Arial/Calibri 10-11), pied de page avec numérotation « Page X sur Y », marges
2 cm, format A4, et une police réduite (Consolas 7 pt) pour les blocs de schémas ASCII afin qu'ils tiennent
dans la largeur de page sans retour à la ligne intempestif.

## Après génération

Ouvrir le document dans Microsoft Word et **mettre à jour le sommaire** (clic droit sur le sommaire →
« Mettre à jour les champs », ou Ctrl+A puis F9) : le champ est généré à l'ouverture par Word et apparaît
vide si le document est prévisualisé uniquement via LibreOffice en ligne de commande.
