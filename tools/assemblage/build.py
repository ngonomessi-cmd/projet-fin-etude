#!/usr/bin/env python3
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
DOCS = REPO + "/docs"

LINK_RE = re.compile(r"\[([^\]]+)\]\([^)]*\.md[^)]*\)")
HEADING_RE = re.compile(r"^(#{1,6})(\s.*)?$")
FENCE_RE = re.compile(r"^\s*```")


def strip_md_links(text: str) -> str:
    # Only outside fences (a link never legitimately appears inside our fences,
    # but let's be safe and fence-aware anyway).
    out_lines = []
    in_fence = False
    for line in text.split("\n"):
        if FENCE_RE.match(line):
            in_fence = not in_fence
            out_lines.append(line)
            continue
        if in_fence:
            out_lines.append(line)
        else:
            out_lines.append(LINK_RE.sub(r"\1", line))
    return "\n".join(out_lines)


def shift_headings(text: str, shift: int) -> str:
    out_lines = []
    in_fence = False
    for line in text.split("\n"):
        if FENCE_RE.match(line):
            in_fence = not in_fence
            out_lines.append(line)
            continue
        if not in_fence:
            m = HEADING_RE.match(line)
            if m:
                hashes, rest = m.group(1), (m.group(2) or "")
                line = ("#" * (len(hashes) + shift)) + rest
        out_lines.append(line)
    return "\n".join(out_lines)


def load(relpath: str, shift: int = 1) -> str:
    with open(f"{DOCS}/{relpath}", encoding="utf-8") as f:
        text = f.read()
    text = strip_md_links(text)
    text = shift_headings(text, shift)
    return text.strip("\n")


def pagebreak() -> str:
    return '```{=openxml}\n<w:p><w:r><w:br w:type="page"/></w:r></w:p>\n```'


def h1(title: str) -> str:
    return f"# {title}"


PARTS = [
    ("1. Présentation des sociétés", [
        "01-presentation-societes/client-khs-bank.md",
        "01-presentation-societes/prestataire-mom-tech.md",
    ]),
    ("2. Étude du cahier des charges et évaluation du besoin", [
        "02-cahier-des-charges/etude-cahier-des-charges.md",
    ]),
    ("3. Gestion de projet", [
        "03-gestion-de-projet/README.md",
        "03-gestion-de-projet/pbs.md",
        "03-gestion-de-projet/wbs.md",
        "03-gestion-de-projet/obs.md",
        "03-gestion-de-projet/raci.md",
        "03-gestion-de-projet/gestion-des-risques.md",
        "03-gestion-de-projet/gantt.md",
        "03-gestion-de-projet/demarche-itil.md",
    ]),
    ("4. Audit de l'existant", [
        "04-audit-existant/README.md",
        "04-audit-existant/audit-reseau.md",
        "04-audit-existant/audit-systemes.md",
        "04-audit-existant/audit-cybersecurite.md",
        "04-audit-existant/conclusion-audit.md",
    ]),
    ("5. Propositions de solutions", [
        "05-solutions/README.md",
        "05-solutions/lot-a-architecture-reseau.md",
        "05-solutions/lot-b-postes-clients.md",
        "05-solutions/lot-c-office365-entra-id.md",
        "05-solutions/lot-d-antivirus-edr.md",
        "05-solutions/lot-e-ids-ips.md",
        "05-solutions/lot-f-audit-securite-ged.md",
        "05-solutions/lot-g-pra-pca.md",
        "05-solutions/lot-h-monitoring-ticketing.md",
        "05-solutions/lot-i-gestion-parc-maintenance.md",
        "05-solutions/lot-j-deploiements-mises-a-jour.md",
        "05-solutions/lots-complementaires.md",
        "05-solutions/cybersecurity-framework-soc.md",
    ]),
    ("6. Architecture cible", [
        "06-architecture/README.md",
        "06-architecture/architecture-reseau-cible.md",
        "06-architecture/architecture-systemes-cible.md",
        "06-architecture/architecture-securite-cible.md",
    ]),
    ("7. Plan de migration", [
        "07-migration/README.md",
        "07-migration/prerequis-installation.md",
        "07-migration/pre-migration.md",
        "07-migration/migration.md",
        "07-migration/post-migration.md",
        "07-migration/elements-a-surveiller.md",
    ]),
    ("8. Bilan financier, recette et conclusion", [
        "08-bilan-financier-recette/README.md",
        "08-bilan-financier-recette/bilan-financier.md",
        "08-bilan-financier-recette/contrat-maintenance.md",
        "08-bilan-financier-recette/recette.md",
        "08-bilan-financier-recette/conclusion.md",
    ]),
    ("9. Procédures détaillées", [
        "09-procedures/README.md",
        "09-procedures/configuration-commutateur-coeur-n3.md",
        "09-procedures/procedure-lot1-stockage-sauvegarde.md",
    ]),
]

ANNEXES = [
    ("Annexe A — Cahier des charges KHS Bank (texte intégral)", [
        "02-cahier-des-charges/cahier-des-charges-khs-bank.md",
    ]),
]

TOC_BLOCK = '''```{=openxml}
<w:sdt><w:sdtPr><w:docPartObj><w:docPartGallery w:val="Table of Contents"/><w:docPartUnique/></w:docPartObj></w:sdtPr><w:sdtContent><w:p><w:pPr><w:pStyle w:val="TOCHeading"/></w:pPr><w:r><w:t>Sommaire</w:t></w:r></w:p><w:p><w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/><w:instrText xml:space="preserve">TOC \\o "1-3" \\h \\z \\u</w:instrText><w:fldChar w:fldCharType="separate"/><w:fldChar w:fldCharType="end"/></w:r></w:p></w:sdtContent></w:sdt>
```'''

COVER = """::: {custom-style="Title"}
DOSSIER DE MISE EN SITUATION PROFESSIONNELLE
:::

::: {custom-style="Subtitle"}
Migration et sécurisation du système d'information de KHS Bank
:::

**Titre RNCP Ingénieur Systèmes, Réseaux et Cybersécurité — Niveau 7 (EU)**

**Institut Européen F2I**

&nbsp;

**Client :** KHS Bank

**Prestataire :** MOM-TECH

**Candidats :** *[Prénom NOM 1]*, *[Prénom NOM 2]*, *[Prénom NOM 3]*, *[Prénom NOM 4]*

**Session :** 2026
"""


def build():
    chunks = [COVER, pagebreak()]

    chunks.append(load("00-abstract/abstract.md", shift=0))
    chunks.append(pagebreak())

    chunks.append(TOC_BLOCK)
    chunks.append(pagebreak())

    for title, files in PARTS:
        chunks.append(h1(title))
        for f in files:
            chunks.append(load(f, shift=1))
        chunks.append(pagebreak())

    chunks.append(h1("Annexes"))
    for title, files in ANNEXES:
        chunks.append(f"## {title}")
        for f in files:
            chunks.append(load(f, shift=2))

    return "\n\n".join(chunks) + "\n"


if __name__ == "__main__":
    out = build()
    out_path = os.path.join(HERE, "dossier.md")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(out)
    print(f"{len(out)} chars written to {out_path}")
