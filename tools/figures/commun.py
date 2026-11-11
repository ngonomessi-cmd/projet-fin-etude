"""Charte graphique commune des figures du dossier (HTML/SVG rendus en PNG par Chromium)."""
import html
import os

ICI = os.path.dirname(os.path.abspath(__file__))
SORTIE_HTML = os.path.join(ICI, "build")
SORTIE_PNG = os.path.join(os.path.dirname(os.path.dirname(ICI)), "docs", "figures")

# Palette sobre, cohérente avec le modèle Word (titres bleu marine, accent or).
C = {
    "marine": "#1F3864",
    "bleu": "#2E75B6",
    "bleu_clair": "#DEEAF6",
    "bleu_pale": "#F3F8FC",
    "or": "#B8923F",
    "or_clair": "#F6EEDC",
    "texte": "#262626",
    "gris": "#595959",
    "gris_clair": "#D9D9D9",
    "gris_pale": "#F2F2F2",
    "rouge": "#C00000",
    "rouge_clair": "#FBE5E5",
    "vert": "#548235",
    "vert_clair": "#E2EFDA",
    "orange": "#C55A11",
    "orange_clair": "#FBE4D5",
    "sarcelle": "#1F7A7A",
}

CSS_BASE = f"""
@font-face {{ font-family: 'Corps'; src: local('Carlito'), local('Calibri'); }}
* {{ box-sizing: border-box; }}
html, body {{ margin: 0; padding: 0; background: #fff; }}
body {{ font-family: 'Carlito', 'Calibri', 'Liberation Sans', sans-serif; color: {C['texte']}; }}
#fig {{ display: inline-block; padding: 18px 22px; background: #fff; }}
"""


def e(t):
    return html.escape(str(t), quote=True)


def page(nom, corps, css=""):
    os.makedirs(SORTIE_HTML, exist_ok=True)
    doc = f"""<!doctype html><html lang="fr"><head><meta charset="utf-8">
<style>{CSS_BASE}{css}</style></head><body><div id="fig">{corps}</div></body></html>"""
    with open(os.path.join(SORTIE_HTML, nom + ".html"), "w", encoding="utf-8") as f:
        f.write(doc)


# ---------------------------------------------------------------------------
# Arbre hiérarchique (organigrammes, PBS, OBS, WBS) en CSS : connecteurs
# orthogonaux tracés par des pseudo-éléments, comme dans un outil de dessin.
# ---------------------------------------------------------------------------
CSS_ARBRE = f"""
.arbre ul {{ padding-top: 22px; position: relative; display: flex; justify-content: center; margin: 0; padding-left: 0; }}
.arbre li {{ list-style: none; text-align: center; position: relative; padding: 22px 7px 0 7px; }}
.arbre li::before, .arbre li::after {{ content: ''; position: absolute; top: 0; right: 50%; width: 50%; height: 22px;
  border-top: 1.6px solid {C['gris']}; }}
.arbre li::after {{ right: auto; left: 50%; border-left: 1.6px solid {C['gris']}; }}
.arbre li:only-child::after, .arbre li:only-child::before {{ display: none; }}
.arbre li:only-child {{ padding-top: 0; }}
.arbre li:first-child::before, .arbre li:last-child::after {{ border: 0 none; }}
.arbre li:last-child::before {{ border-right: 1.6px solid {C['gris']}; }}
.arbre ul ul::before {{ content: ''; position: absolute; top: 0; left: 50%; border-left: 1.6px solid {C['gris']}; width: 0; height: 22px; }}
.arbre > ul {{ padding-top: 0; }}
.noeud {{ display: inline-block; border: 1.4px solid {C['bleu']}; border-radius: 4px; background: #fff;
  padding: 8px 12px; min-width: 120px; font-size: 15px; line-height: 1.25; }}
.noeud b {{ display: block; font-size: 15.5px; color: {C['marine']}; }}
.noeud small {{ display: block; color: {C['gris']}; font-size: 13px; margin-top: 2px; }}
.n0 {{ background: {C['marine']}; border-color: {C['marine']}; color: #fff; padding: 10px 18px; }}
.n0 b {{ color: #fff; font-size: 17px; }}
.n0 small {{ color: #E6E6E6; }}
.n1 {{ background: {C['bleu_clair']}; }}
.nor {{ background: {C['or_clair']}; border-color: {C['or']}; }}
.ngris {{ background: {C['gris_pale']}; border-color: {C['gris']}; }}
.arbre li.col {{ padding-left: 6px; padding-right: 6px; }}
.pile {{ margin: 10px auto 0 22px; text-align: left; position: relative; }}
.pile::before {{ content: ''; position: absolute; left: -12px; top: -10px; bottom: 0; border-left: 1.4px solid {C['gris']}; }}
.item {{ position: relative; border: 1.2px solid {C['bleu']}; background: #fff; border-radius: 3px;
  padding: 6px 10px; margin-top: 8px; font-size: 14px; line-height: 1.22; min-width: 190px; }}
.item b {{ display: block; color: {C['marine']}; font-size: 15px; }}
.item small {{ display: block; color: {C['gris']}; font-size: 13px; }}
.item::before {{ content: ''; position: absolute; left: -12px; top: 50%; width: 12px; border-top: 1.4px solid {C['gris']}; }}
.item:last-child::after {{ content: ''; position: absolute; left: -14px; top: calc(50% + 1px); bottom: -2px; width: 5px; background: #fff; }}
"""


def arbre_html(n):
    """n = dict(titre, sous, classe, enfants)"""
    t = f'<b>{e(n["titre"])}</b>' if n.get("titre") else ""
    s = "".join(f"<small>{e(x)}</small>" for x in n.get("sous", []))
    h = f'<li><div class="noeud {n.get("classe", "")}">{t}{s}</div>'
    if n.get("enfants") and n.get("pile"):
        items = "".join(f'<div class="item"><b>{e(c["titre"])}</b>{"".join(f"<small>{e(x)}</small>" for x in c.get("sous", []))}</div>'
                        for c in n["enfants"])
        return h.replace("<li>", '<li class="col">', 1) + f'<div class="pile">{items}</div></li>'
    if n.get("enfants"):
        h += "<ul>" + "".join(arbre_html(c) for c in n["enfants"]) + "</ul>"
    return h + "</li>"


def arbre(racine):
    return f'<div class="arbre"><ul>{arbre_html(racine)}</ul></div>'
