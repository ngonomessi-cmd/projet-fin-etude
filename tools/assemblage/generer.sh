#!/usr/bin/env bash
# Régénère les figures puis les documents Word du dossier (dossier complet et documents séparés).
# Prérequis : python3 + python-docx, pandoc, node + playwright (Chromium), police Carlito.
set -euo pipefail
cd "$(dirname "$0")/../.."
TMP=$(mktemp -d)

# 1. Figures (HTML/SVG -> PNG haute résolution dans docs/figures)
(cd tools/figures && python3 gantt.py && python3 gestion.py && python3 technique.py && python3 flux.py && node rendu.mjs)

# 2. Dossier complet
python3 tools/assemblage/build.py
pandoc tools/assemblage/dossier.md -o "$TMP/dossier.docx" --reference-doc=tools/assemblage/khs-template.docx --toc-depth=3
python3 tools/assemblage/finition.py "$TMP/dossier.docx" export/Dossier_de_mise_en_situation_KHS_Bank_MOM-TECH.docx

# 3. Documents séparés
python3 tools/assemblage/build_subdocs.py
pandoc tools/assemblage/Presentation_des_societes_KHS_Bank_MOM-TECH.md -o "$TMP/pres.docx" --reference-doc=tools/assemblage/khs-template.docx --toc-depth=3
python3 tools/assemblage/finition.py "$TMP/pres.docx" export/Presentation_des_societes_KHS_Bank_MOM-TECH.docx \
  "Présentation des sociétés" "Client : KHS Bank — Prestataire : MOM-TECH"
pandoc tools/assemblage/Etude_cahier_des_charges_et_evaluation_du_besoin.md -o "$TMP/etude.docx" --reference-doc=tools/assemblage/khs-template.docx --toc-depth=3
python3 tools/assemblage/finition.py "$TMP/etude.docx" export/Etude_cahier_des_charges_et_evaluation_du_besoin.docx \
  "Étude du cahier des charges|et évaluation du besoin" "Migration et sécurisation du système d'information de KHS Bank"
rm -rf "$TMP"
echo "Documents régénérés dans export/ (ouvrir dans Word et accepter la mise à jour des champs)."
