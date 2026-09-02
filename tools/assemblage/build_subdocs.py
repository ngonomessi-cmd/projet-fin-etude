#!/usr/bin/env python3
"""Génère des documents Word autonomes pour des sections choisies du dossier,
en réutilisant le même modèle (khs-template.docx) et la même logique
(sauts de page, retrait des liens Markdown internes) que build.py."""
import os

from build import load, pagebreak, h1

HERE = os.path.dirname(os.path.abspath(__file__))

COVER_TEMPLATE = """::: {{custom-style="Title"}}
{title}
:::

::: {{custom-style="Subtitle"}}
{subtitle}
:::

**Titre RNCP Ingénieur Systèmes, Réseaux et Cybersécurité — Niveau 7 (EU)**

**Institut Européen F2I**

&nbsp;

**Client :** KHS Bank

**Prestataire :** MOM-TECH

**Candidats :** *[Prénom NOM 1]*, *[Prénom NOM 2]*, *[Prénom NOM 3]*, *[Prénom NOM 4]*

**Session :** 2026
"""

DOCS = [
    {
        "out": "Presentation_des_societes_KHS_Bank_MOM-TECH.md",
        "title": "PRÉSENTATION DES SOCIÉTÉS",
        "subtitle": "Client : KHS Bank — Prestataire : MOM-TECH",
        "parts": [
            "01-presentation-societes/client-khs-bank.md",
            "01-presentation-societes/prestataire-mom-tech.md",
        ],
    },
    {
        "out": "Etude_cahier_des_charges_et_evaluation_du_besoin.md",
        "title": "ÉTUDE DU CAHIER DES CHARGES  \nET ÉVALUATION DU BESOIN",
        "subtitle": "Migration et sécurisation du système d'information de KHS Bank",
        "parts": [
            "02-cahier-des-charges/etude-cahier-des-charges.md",
        ],
        "annex": {
            "title": "Annexe — Cahier des charges KHS Bank (texte intégral)",
            "file": "02-cahier-des-charges/cahier-des-charges-khs-bank.md",
        },
    },
]


def build_one(spec):
    chunks = [
        COVER_TEMPLATE.format(title=spec["title"], subtitle=spec["subtitle"]),
        pagebreak(),
        '```{=openxml}\n<w:sdt><w:sdtPr><w:docPartObj><w:docPartGallery w:val="Table of Contents"/>'
        '<w:docPartUnique/></w:docPartObj></w:sdtPr><w:sdtContent><w:p><w:pPr>'
        '<w:pStyle w:val="TOCHeading"/></w:pPr><w:r><w:t>Sommaire</w:t></w:r></w:p><w:p><w:r>'
        '<w:fldChar w:fldCharType="begin" w:dirty="true"/><w:instrText xml:space="preserve"> TOC \\o '
        '"1-3" \\h \\z \\u </w:instrText><w:fldChar w:fldCharType="separate"/>'
        '<w:fldChar w:fldCharType="end"/></w:r></w:p></w:sdtContent></w:sdt>\n```',
        pagebreak(),
    ]
    for f in spec["parts"]:
        chunks.append(load(f, shift=0))
    if "annex" in spec:
        chunks.append(pagebreak())
        chunks.append(h1(spec["annex"]["title"]))
        chunks.append(load(spec["annex"]["file"], shift=1))
    text = "\n\n".join(chunks) + "\n"
    out_path = os.path.join(HERE, spec["out"])
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(text)
    return out_path


if __name__ == "__main__":
    for spec in DOCS:
        p = build_one(spec)
        print(f"written: {p}")
