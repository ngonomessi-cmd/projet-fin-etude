#!/usr/bin/env python3
"""Génère le diaporama de soutenance KHS Bank / MOM-TECH (python-pptx).

Usage : python3 tools/soutenance/diapos.py soutenance/Soutenance_KHS_Bank_MOM-TECH.pptx

- Les notes orales sont dans tools/soutenance/notes.json (une entrée par diapositive).
- Les icônes (Lucide, licence ISC) sont des PNG mis en cache dans tools/soutenance/icones/.
  Pour en ajouter une : LUCIDE_DIR=<dossier icons de lucide-static> relance ce script (node + playwright).
- Chaque diapositive reçoit une transition ; les blocs de contenu apparaissent automatiquement, l'un après
  l'autre, à l'arrivée sur la diapositive (aucun clic supplémentaire pendant la présentation).
"""
import json
import os
import subprocess
import sys
from lxml import etree
from pptx import Presentation
from pptx.chart.data import CategoryChartData
from pptx.dml.color import RGBColor
from pptx.enum.chart import XL_CHART_TYPE, XL_LABEL_POSITION
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Inches, Pt

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(os.path.dirname(ICI))
ICONES = os.path.join(ICI, "icones")
NOTES = json.load(open(os.path.join(ICI, "notes.json"), encoding="utf-8"))

NAVY = RGBColor(0x0B, 0x12, 0x20)
NAVY2 = RGBColor(0x16, 0x1F, 0x34)
NAVY3 = RGBColor(0x1E, 0x2A, 0x44)
GOLD = RGBColor(0xB8, 0x92, 0x3F)
GOLDL = RGBColor(0xF3, 0xEA, 0xDA)
MIST = RGBColor(0xF5, 0xF3, 0xEE)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
INK = RGBColor(0x1B, 0x24, 0x38)
GREY = RGBColor(0x5B, 0x65, 0x78)
LINE = RGBColor(0xE4, 0xDE, 0xD0)
RED = RGBColor(0xB4, 0x3A, 0x3A)
REDL = RGBColor(0xF8, 0xE9, 0xE7)
GREEN = RGBColor(0x2E, 0x7D, 0x5B)
GREENL = RGBColor(0xE6, 0xF2, 0xEC)
FONT = "Calibri"

prs = Presentation()
prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
BLANK = prs.slide_layouts[6]
N = {"n": 0}
PRESENTE = "Présenté par Julien Joël NGONO MESSI"


def hexa(c):
    return "%02X%02X%02X" % (c[0], c[1], c[2])


# ---------------------------------------------------------------- icônes
def ico(nom, couleur):
    chemin = os.path.join(ICONES, f"{nom}_{hexa(couleur)}.png")
    if not os.path.exists(chemin):
        src = os.environ.get("LUCIDE_DIR")
        if not src:
            sys.exit(f"Icône manquante : {chemin} (définir LUCIDE_DIR pour la générer)")
        subprocess.run(["node", os.path.join(ICI, "icones.mjs"), src, ICONES, f"{nom}:{hexa(couleur)}"], check=True)
    return chemin


def icone(c, nom, couleur, x, y, taille):
    return c.shapes.add_picture(ico(nom, couleur), Inches(x), Inches(y), Inches(taille), Inches(taille))


# ---------------------------------------------------------------- formes de base
def ombre(forme, alpha=16):
    spPr = forme._element.spPr
    eff = etree.SubElement(spPr, qn("a:effectLst"))
    sh = etree.SubElement(eff, qn("a:outerShdw"), blurRad="88900", dist="28575", dir="5400000", algn="t", rotWithShape="0")
    clr = etree.SubElement(sh, qn("a:srgbClr"), val="0B1220")
    etree.SubElement(clr, qn("a:alpha"), val=str(alpha * 1000))


def rect(c, x, y, w, h, fill=None, line=None, shape=MSO_SHAPE.RECTANGLE, lw=0.75, rayon=None, shadow=False):
    r = c.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    if rayon is not None:
        r.adjustments[0] = rayon
    if fill is None:
        r.fill.background()
    else:
        r.fill.solid(); r.fill.fore_color.rgb = fill
    if line is None:
        r.line.fill.background()
    else:
        r.line.color.rgb = line; r.line.width = Pt(lw)
    r.shadow.inherit = False
    if shadow:
        ombre(r)
    return r


def text(c, x, y, w, h, t, size=18, bold=False, color=INK, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, italic=False, spacing=None):
    tb = c.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame; tf.word_wrap = True
    tf.margin_left = tf.margin_right = Inches(0.05); tf.margin_top = tf.margin_bottom = Inches(0.03)
    tf.vertical_anchor = anchor
    for i, l in enumerate(t if isinstance(t, list) else [t]):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        if spacing:
            p.space_after = Pt(spacing)
        r = p.add_run(); r.text = l
        r.font.size = Pt(size); r.font.bold = bold; r.font.color.rgb = color; r.font.name = FONT; r.font.italic = italic
    return tb


def groupe(s):
    return s.shapes.add_group_shape()


def pastille(c, x, y, d, nom, fond=GOLD, trait=WHITE):
    rect(c, x, y, d, d, fill=fond, shape=MSO_SHAPE.OVAL)
    m = d * 0.22
    icone(c, nom, trait, x + m, y + m, d - 2 * m)


# ---------------------------------------------------------------- animations et transitions
def transition(s, effet="fade"):
    el = etree.SubElement(s._element, qn("p:transition"), spd="med")
    if effet == "push":
        etree.SubElement(el, qn("p:push"), dir="u")
    else:
        etree.SubElement(el, qn("p:fade"))


def anime(s, formes, debut=0.15, pas=0.22, duree=0.5):
    """Apparition en fondu, automatique et successive, des formes données (sans clic)."""
    if not formes:
        return
    ids = iter(range(3, 10000))
    timing = etree.SubElement(s._element, qn("p:timing"))
    tnl = etree.SubElement(timing, qn("p:tnLst"))
    par = etree.SubElement(tnl, qn("p:par"))
    root = etree.SubElement(par, qn("p:cTn"), id="1", dur="indefinite", restart="never", nodeType="tmRoot")
    rc = etree.SubElement(root, qn("p:childTnLst"))
    seq = etree.SubElement(rc, qn("p:seq"), concurrent="1", nextAc="seek")
    main = etree.SubElement(seq, qn("p:cTn"), id="2", dur="indefinite", nodeType="mainSeq")
    mc = etree.SubElement(main, qn("p:childTnLst"))
    p1 = etree.SubElement(mc, qn("p:par"))
    c1 = etree.SubElement(p1, qn("p:cTn"), id=str(next(ids)), fill="hold")
    st = etree.SubElement(c1, qn("p:stCondLst"))
    etree.SubElement(st, qn("p:cond"), delay="indefinite")
    cd = etree.SubElement(st, qn("p:cond"), evt="onBegin", delay="0")
    etree.SubElement(cd, qn("p:tn"), val="2")
    l1 = etree.SubElement(c1, qn("p:childTnLst"))
    for k, f in enumerate(formes):
        spid = str(f.shape_id)
        p2 = etree.SubElement(l1, qn("p:par"))
        c2 = etree.SubElement(p2, qn("p:cTn"), id=str(next(ids)), fill="hold")
        s2 = etree.SubElement(c2, qn("p:stCondLst"))
        etree.SubElement(s2, qn("p:cond"), delay=str(int((debut + k * pas) * 1000)))
        l2 = etree.SubElement(c2, qn("p:childTnLst"))
        p3 = etree.SubElement(l2, qn("p:par"))
        c3 = etree.SubElement(p3, qn("p:cTn"), id=str(next(ids)), presetID="10", presetClass="entr", presetSubtype="0",
                              fill="hold", nodeType="withEffect" if k else "afterEffect")
        s3 = etree.SubElement(c3, qn("p:stCondLst"))
        etree.SubElement(s3, qn("p:cond"), delay="0")
        l3 = etree.SubElement(c3, qn("p:childTnLst"))
        st_ = etree.SubElement(l3, qn("p:set"))
        b = etree.SubElement(st_, qn("p:cBhvr"))
        cb = etree.SubElement(b, qn("p:cTn"), id=str(next(ids)), dur="1", fill="hold")
        sc = etree.SubElement(cb, qn("p:stCondLst"))
        etree.SubElement(sc, qn("p:cond"), delay="0")
        tg = etree.SubElement(b, qn("p:tgtEl"))
        etree.SubElement(tg, qn("p:spTgt"), spid=spid)
        an = etree.SubElement(b, qn("p:attrNameLst"))
        etree.SubElement(an, qn("p:attrName")).text = "style.visibility"
        to = etree.SubElement(st_, qn("p:to"))
        etree.SubElement(to, qn("p:strVal"), val="visible")
        ef = etree.SubElement(l3, qn("p:animEffect"), transition="in", filter="fade")
        b2 = etree.SubElement(ef, qn("p:cBhvr"))
        etree.SubElement(b2, qn("p:cTn"), id=str(next(ids)), dur=str(int(duree * 1000)))
        tg2 = etree.SubElement(b2, qn("p:tgtEl"))
        etree.SubElement(tg2, qn("p:spTgt"), spid=spid)
    prev = etree.SubElement(seq, qn("p:prevCondLst"))
    pc = etree.SubElement(prev, qn("p:cond"), evt="onPrev", delay="0")
    etree.SubElement(etree.SubElement(pc, qn("p:tgtEl")), qn("p:sldTgt"))
    nxt = etree.SubElement(seq, qn("p:nextCondLst"))
    nc = etree.SubElement(nxt, qn("p:cond"), evt="onNext", delay="0")
    etree.SubElement(etree.SubElement(nc, qn("p:tgtEl")), qn("p:sldTgt"))


# ---------------------------------------------------------------- gabarits de diapositives
SECTIONS = ["Les acteurs", "Le cahier des charges", "Les actions réalisées", "Focus : la GED sécurisée", "Synthèse et conclusion"]


def slide(titre, section, cle, presente=False):
    """Diapositive de contenu : fond clair, bandeau latéral indiquant la partie en cours."""
    s = prs.slides.add_slide(BLANK)
    N["n"] += 1
    rect(s, 0, 0, 13.333, 7.5, fill=WHITE)
    rect(s, 0, 0, 0.22, 7.5, fill=NAVY)
    if section:
        rect(s, 0, (section - 1) * 1.5, 0.22, 1.5, fill=GOLD)
        text(s, 0.6, 0.28, 8, 0.3, f"{section} · {SECTIONS[section - 1]}".upper(), size=12, bold=True, color=GOLD)
    else:
        text(s, 0.6, 0.28, 8, 0.3, "INTRODUCTION", size=12, bold=True, color=GOLD)
    if presente:
        text(s, 7.8, 0.28, 5.0, 0.3, PRESENTE, size=11, bold=True, color=GREY, align=PP_ALIGN.RIGHT)
    text(s, 0.6, 0.55, 12.2, 0.75, titre, size=30, bold=True, color=NAVY, anchor=MSO_ANCHOR.MIDDLE)
    rect(s, 0.65, 1.3, 1.1, 0.06, fill=GOLD)
    text(s, 0.6, 7.08, 8, 0.3, "KHS Bank — Migration et sécurisation du SI · MOM-TECH", size=10, color=GREY)
    text(s, 12.0, 7.08, 0.8, 0.3, str(N["n"]), size=10, color=GREY, align=PP_ALIGN.RIGHT)
    s.notes_slide.notes_text_frame.text = NOTES.get(cle, "")
    transition(s)
    return s


def intercalaire(num, titre, accroche, nom_icone, cle, presente=False):
    s = prs.slides.add_slide(BLANK)
    N["n"] += 1
    rect(s, 0, 0, 13.333, 7.5, fill=NAVY)
    text(s, 8.0, 0.3, 4.9, 6.6, str(num), size=330, bold=True, color=NAVY3, align=PP_ALIGN.RIGHT, anchor=MSO_ANCHOR.MIDDLE)
    pastille(s, 0.9, 1.7, 1.1, nom_icone)
    text(s, 0.9, 3.05, 8, 0.4, f"PARTIE {num}", size=16, bold=True, color=GOLD)
    text(s, 0.9, 3.45, 9, 1.0, titre, size=46, bold=True, color=WHITE)
    rect(s, 0.95, 4.55, 1.4, 0.06, fill=GOLD)
    text(s, 0.9, 4.8, 8.5, 1.2, accroche, size=20, color=GOLDL)
    if presente:
        text(s, 0.9, 6.6, 8, 0.4, PRESENTE, size=14, bold=True, color=GOLD)
    s.notes_slide.notes_text_frame.text = NOTES.get(cle, "")
    transition(s, "push")
    return s


def tuile(s, x, y, w, h, nom_icone, titre, corps, accent=GOLD, size=16, tsize=19):
    g = groupe(s)
    rect(g, x, y, w, h, fill=WHITE, line=LINE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, rayon=0.06, shadow=True)
    pastille(g, x + 0.25, y + 0.25, 0.62, nom_icone, fond=accent)
    text(g, x + 1.0, y + 0.22, w - 1.15, 0.68, titre, size=tsize, bold=True, color=NAVY, anchor=MSO_ANCHOR.MIDDLE)
    if corps:
        text(g, x + 0.25, y + 1.05, w - 0.45, h - 1.15, corps.split("\n"), size=size, color=INK, spacing=5)
    return g


def chiffre(s, x, y, w, nom_icone, valeur, libelle, couleur=NAVY, h=1.45):
    g = groupe(s)
    rect(g, x, y, w, h, fill=MIST, shape=MSO_SHAPE.ROUNDED_RECTANGLE, rayon=0.08)
    icone(g, nom_icone, GOLD, x + 0.25, y + 0.3, 0.55)
    text(g, x + 0.95, y + 0.1, w - 1.05, 0.7, valeur, size=30, bold=True, color=couleur, anchor=MSO_ANCHOR.MIDDLE)
    text(g, x + 0.95, y + 0.78, w - 1.05, h - 0.8, libelle.split("\n"), size=13, color=GREY)
    return g


def liste(s, x, y, w, items, nom_icone, couleur, size=17, pas=0.55):
    g = groupe(s)
    for i, it in enumerate(items):
        icone(g, nom_icone, couleur, x, y + i * pas + 0.04, 0.32)
        text(g, x + 0.45, y + i * pas, w - 0.45, pas, it, size=size, color=INK)
    return g


def fleche(s, x, y, w, h, etapes, size=14, couleurs=None):
    """Chevrons enchaînés ; le texte est posé dans une zone de texte (pas de coupure de mots)."""
    g = groupe(s)
    n = len(etapes); gap = 0.08; cw = (w - gap * (n - 1)) / n
    for i, e in enumerate(etapes):
        c = (couleurs or [NAVY, NAVY2] * n)[i]
        x0 = x + i * (cw + gap)
        rect(g, x0, y, cw, h, fill=c, shape=MSO_SHAPE.CHEVRON if i else MSO_SHAPE.PENTAGON)
        lignes = e.split("\n")
        num = lignes[0].isdigit()
        tb = g.shapes.add_textbox(Inches(x0 + (0.22 if i else 0.05)), Inches(y), Inches(cw - 0.35), Inches(h))
        tf = tb.text_frame; tf.word_wrap = False; tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf.margin_left = tf.margin_right = Inches(0)
        for k, l in enumerate(lignes):
            p = tf.paragraphs[0] if k == 0 else tf.add_paragraph()
            p.alignment = PP_ALIGN.CENTER
            r = p.add_run(); r.text = l
            r.font.size = Pt(size if (k == 0 or num) else size - 2)
            r.font.bold = (k == 1) if num else (k == 0)
            r.font.color.rgb = WHITE; r.font.name = FONT
    return g


def bandeau(s, y, texte, fond=NAVY, couleur=GOLD, nom_icone=None, size=19, h=0.7):
    g = groupe(s)
    rect(g, 0.6, y, 12.2, h, fill=fond, shape=MSO_SHAPE.ROUNDED_RECTANGLE, rayon=0.15)
    if nom_icone:
        icone(g, nom_icone, couleur, 0.85, y + (h - 0.4) / 2, 0.4)
    text(g, 1.35 if nom_icone else 0.8, y, 11.2, h, texte, size=size, bold=True, color=couleur, anchor=MSO_ANCHOR.MIDDLE,
         align=PP_ALIGN.LEFT if nom_icone else PP_ALIGN.CENTER)
    return g


def image(s, chemin, x, y, w, legende=None):
    pic = s.shapes.add_picture(chemin, Inches(x), Inches(y), width=Inches(w))
    h = pic.height / 914400
    cadre = rect(s, x, y, w, h, line=LINE)
    if legende:
        text(s, x, y + h + 0.05, w, 0.3, legende, size=12, color=GREY, italic=True, align=PP_ALIGN.CENTER)
    return pic


def table(s, x, y, w, cols, rows, size=13, hsize=13, rowh=0.42):
    t = s.shapes.add_table(len(rows) + 1, len(cols), Inches(x), Inches(y), Inches(w), Inches(rowh * (len(rows) + 1))).table
    tw = sum(c[1] for c in cols)
    for i, (nom, lw) in enumerate(cols):
        t.columns[i].width = Inches(w * lw / tw)
        c = t.cell(0, i); c.fill.solid(); c.fill.fore_color.rgb = NAVY
        c.text_frame.text = nom
        r = c.text_frame.paragraphs[0].runs[0]; r.font.size = Pt(hsize); r.font.bold = True; r.font.color.rgb = WHITE; r.font.name = FONT
    for j, row in enumerate(rows, 1):
        for i, v in enumerate(row):
            c = t.cell(j, i); c.fill.solid(); c.fill.fore_color.rgb = WHITE if j % 2 else MIST
            c.text_frame.text = v; c.text_frame.word_wrap = True
            r = c.text_frame.paragraphs[0].runs[0]; r.font.size = Pt(size); r.font.color.rgb = INK; r.font.name = FONT
            r.font.bold = (i == 0)
    return t


FIG = lambda nom: os.path.join(RACINE, "docs", "figures", nom + ".png")

# ================================================================ 1. Titre
s = prs.slides.add_slide(BLANK); N["n"] += 1
rect(s, 0, 0, 13.333, 7.5, fill=NAVY)
icone(s, "shield-check", NAVY3, 8.4, 0.9, 5.2)
text(s, 0.8, 1.3, 11.5, 0.4, "SOUTENANCE · TITRE ISRC — INGÉNIEUR SYSTÈMES, RÉSEAUX ET CYBERSÉCURITÉ", size=14, bold=True, color=GOLD)
text(s, 0.8, 1.85, 11.0, 1.7, ["Migration et sécurisation", "du système d'information de KHS Bank"], size=42, bold=True, color=WHITE)
rect(s, 0.85, 3.65, 1.6, 0.07, fill=GOLD)
text(s, 0.8, 3.9, 10, 0.6, "Projet mené par MOM-TECH — de l'audit à la GED sécurisée", size=22, color=GOLDL)
g = groupe(s)
for i, (nom, ic) in enumerate([("Audit", "scan-eye"), ("Réseau", "network"), ("Systèmes", "server"), ("Sécurité", "shield"), ("GED", "file-lock")]):
    pastille(g, 0.85 + i * 1.25, 4.75, 0.6, ic, fond=NAVY3, trait=GOLD)
    text(g, 0.6 + i * 1.25, 5.4, 1.1, 0.3, nom, size=12, color=GOLDL, align=PP_ALIGN.CENTER)
text(s, 0.8, 6.0, 11.8, 0.7, ["NGONO MESSI Julien Joël · ADJE Tchaffa Oladé Moïse · WAFO Franklin Junior · ABAYOMI Obachegoun Olabissi Majesté"], size=15, bold=True, color=WHITE)
text(s, 0.8, 6.6, 8, 0.4, "IEF2I · Institut Européen F2I", size=14, color=GOLDL)
text(s, 9.0, 6.6, 3.5, 0.4, "16 décembre 2026", size=14, bold=True, color=GOLD, align=PP_ALIGN.RIGHT)
s.notes_slide.notes_text_frame.text = NOTES["titre"]
transition(s)
anime(s, [g], debut=0.4)

# ================================================================ 2. Plan
s = slide("Plan de la présentation", 0, "plan")
items = [("network", "Les acteurs", "KHS Bank, client\nMOM-TECH, prestataire"),
         ("target", "Le cahier des charges", "objectifs, contraintes,\nrésultats attendus, délais"),
         ("rocket", "Les actions réalisées", "projet, audit, solutions,\nmaquette, migration"),
         ("file-lock", "Focus : la GED sécurisée", "ateliers, sécurité,\ndémonstration"),
         ("flag", "Synthèse et conclusion", "bilan financier, recette,\nperspectives")]
blocs = []
for i, (ic, t1, t2) in enumerate(items):
    x = 0.6 + i * 2.47
    g = groupe(s)
    rect(g, x, 1.75, 2.3, 4.9, fill=MIST, shape=MSO_SHAPE.ROUNDED_RECTANGLE, rayon=0.06)
    rect(g, x, 1.75, 2.3, 0.1, fill=GOLD)
    text(g, x, 2.0, 2.3, 1.0, str(i + 1), size=54, bold=True, color=GOLD, align=PP_ALIGN.CENTER)
    pastille(g, x + 0.75, 3.15, 0.8, ic, fond=NAVY)
    text(g, x + 0.1, 4.15, 2.1, 0.9, t1, size=19, bold=True, color=NAVY, align=PP_ALIGN.CENTER)
    text(g, x + 0.1, 5.1, 2.1, 1.2, t2.split("\n"), size=14, color=GREY, align=PP_ALIGN.CENTER)
    blocs.append(g)
anime(s, blocs)

# ================================================================ Partie 1
intercalaire(1, "Les acteurs", "Une banque réglementée au SI vieillissant,\nun cabinet d'ingénierie de quatre ingénieurs.", "users", "div1")

# ---------------------------------------------------------------- 3. KHS Bank
s = slide("Le client : KHS Bank", 1, "khs")
k = [chiffre(s, 0.6, 1.65, 2.9, "users", "≈ 920", "collaborateurs\n780 Paris · 140 Lyon"),
     chiffre(s, 3.7, 1.65, 2.9, "landmark", "2004", "création, établissement\nagréé ACPR"),
     chiffre(s, 6.8, 1.65, 2.9, "coins", "14 M€", "budget annuel\ndu SI"),
     chiffre(s, 9.9, 1.65, 2.9, "building-2", "2 sites", "Paris La Défense\net Lyon")]
g1 = groupe(s)
rect(g1, 0.6, 3.4, 5.95, 3.45, fill=REDL, shape=MSO_SHAPE.ROUNDED_RECTANGLE, rayon=0.05)
text(g1, 0.9, 3.55, 5.5, 0.45, "Un SI vieillissant et hétérogène", size=19, bold=True, color=RED)
liste(g1, 0.9, 4.15, 5.5, ["Postes sous Windows 8", "Messagerie Exchange 2013", "SQL Server 2012 (application KHS-Core)", "Liaison VPN unique entre les sites", "Ni SOC, ni PRA/PCA formalisé"], "triangle-alert", RED, size=17, pas=0.52)
g2 = groupe(s)
rect(g2, 6.85, 3.4, 5.95, 3.45, fill=GOLDL, shape=MSO_SHAPE.ROUNDED_RECTANGLE, rayon=0.05)
text(g2, 7.15, 3.55, 5.5, 0.45, "Sous forte pression réglementaire", size=19, bold=True, color=NAVY)
liste(g2, 7.15, 4.15, 5.5, ["ACPR · DSP2 · PCI-DSS · RGPD", "Secret bancaire", "Aucune interruption tolérée sur les paiements", "Pilotage : DSI + Conformité & Sécurité"], "scale", GOLD, size=17, pas=0.52)
anime(s, k + [g1, g2])

# ---------------------------------------------------------------- 4. MOM-TECH
s = slide("Le prestataire : MOM-TECH", 1, "momtech")
t = [tuile(s, 0.6, 1.65, 3.95, 2.6, "shield-check", "Cybersécurité", "Audit, SOC/SIEM, PRA/PCA, identités et accès, conformité, GED sécurisée", size=16),
     tuile(s, 4.72, 1.65, 3.95, 2.6, "cloud", "Cloud & infrastructure", "Architecture réseau, virtualisation, haute disponibilité, cloud hybride ou souverain", size=16),
     tuile(s, 8.84, 1.65, 3.95, 2.6, "brain-circuit", "IA & données", "Détection d'anomalies et de fraude, analyse comportementale couplée au SOC", size=16)]
g = groupe(s)
for i, (ic, v, l) in enumerate([("users", "4", "ingénieurs dédiés"), ("split", "2", "sous-équipes : Architecture Système · Réseau & Sécurité"), ("refresh-cw", "ITIL v4", "démarche de gestion des services")]):
    x = 0.6 + i * 4.12
    rect(g, x, 4.6, 3.95, 2.2, fill=NAVY, shape=MSO_SHAPE.ROUNDED_RECTANGLE, rayon=0.06)
    icone(g, ic, GOLD, x + 0.3, 4.85, 0.6)
    text(g, x + 1.1, 4.75, 2.7, 0.8, v, size=36, bold=True, color=WHITE, anchor=MSO_ANCHOR.MIDDLE)
    text(g, x + 0.3, 5.65, 3.4, 1.0, l, size=15, color=GOLDL)
anime(s, t + [g])

# ---------------------------------------------------------------- 5. Équipe
s = slide("L'équipe projet MOM-TECH", 1, "equipe")
membres = [("NGONO MESSI", "Julien Joël", "Chef de projet\nIngénieur Architecture Système", "layers"),
           ("ADJE", "Tchaffa Oladé Moïse", "Ingénieur\nRéseaux & Sécurité", "network"),
           ("ABAYOMI", "Obachegoun Olabissi Majesté", "Ingénieur\nCybersécurité / SOC", "scan-eye"),
           ("WAFO", "Franklin Junior", "Ingénieur\nSystèmes & Déploiement", "server")]
blocs = []
for i, (nom, prenom, role, ic) in enumerate(membres):
    x = 0.6 + i * 3.08
    g = groupe(s)
    rect(g, x, 1.7, 2.9, 4.75, fill=WHITE, line=LINE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, rayon=0.05, shadow=True)
    rect(g, x + 0.85, 2.0, 1.2, 1.2, fill=NAVY, shape=MSO_SHAPE.OVAL)
    text(g, x + 0.85, 2.0, 1.2, 1.2, nom[0] + prenom[0], size=30, bold=True, color=GOLD, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    pastille(g, x + 1.75, 2.85, 0.5, ic, fond=GOLD)
    text(g, x + 0.1, 3.45, 2.7, 0.45, nom, size=20, bold=True, color=NAVY, align=PP_ALIGN.CENTER)
    text(g, x + 0.1, 3.9, 2.7, 0.7, prenom, size=15, color=GREY, align=PP_ALIGN.CENTER)
    rect(g, x + 1.1, 4.75, 0.7, 0.04, fill=GOLD)
    text(g, x + 0.1, 4.95, 2.7, 1.2, role.split("\n"), size=15, bold=True, color=INK, align=PP_ALIGN.CENTER)
    blocs.append(g)
text(s, 0.6, 6.6, 12.2, 0.4, "2 sous-équipes : Architecture Système · Réseau & Sécurité", size=15, color=GREY, italic=True, align=PP_ALIGN.CENTER)
anime(s, blocs)

# ================================================================ Partie 2
intercalaire(2, "Le cahier des charges", "Cinq objectifs, des contraintes fortes,\net une exigence : aucune interruption de service.", "target", "div2")

# ---------------------------------------------------------------- 6. Cahier des charges
s = slide("Le cahier des charges : cinq objectifs", 2, "cdc")
objectifs = [("activity", "Fiabiliser", "Redondance, PRA/PCA, haute disponibilité"),
             ("shield", "Sécuriser", "RGPD, ACPR, DSP2, PCI-DSS, SOC, IAM, GED"),
             ("sparkles", "Moderniser", "Microsoft 365, parc harmonisé, sites unifiés"),
             ("trending-down", "Maîtriser les coûts", "Parc et licences rationalisés"),
             ("graduation-cap", "Accompagner", "Formation, communication, risques humains")]
blocs = []
for i, (ic, t1, t2) in enumerate(objectifs):
    x = 0.6 + i * 2.47
    g = groupe(s)
    rect(g, x, 1.65, 2.3, 2.85, fill=WHITE, line=LINE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, rayon=0.06, shadow=True)
    pastille(g, x + 0.75, 1.85, 0.8, ic, fond=NAVY)
    text(g, x + 0.1, 2.75, 2.1, 0.5, t1, size=18, bold=True, color=NAVY, align=PP_ALIGN.CENTER)
    text(g, x + 0.15, 3.3, 2.0, 1.15, t2, size=14, color=GREY, align=PP_ALIGN.CENTER)
    blocs.append(g)
g = groupe(s)
text(g, 0.6, 4.75, 4, 0.4, "Contraintes", size=18, bold=True, color=NAVY)
for i, (ic, t1, t2) in enumerate([("scale", "Réglementaire", "RGPD, ACPR, DSP2"), ("refresh-cw", "Continuité", "aucune interruption"),
                                  ("building-2", "Organisation", "2 sites, 920 postes"), ("workflow", "Méthode", "ITIL v4"), ("coins", "Budget", "14 M€ / an")]):
    x = 0.6 + i * 2.47
    rect(g, x, 5.2, 2.3, 0.85, fill=GOLDL, shape=MSO_SHAPE.ROUNDED_RECTANGLE, rayon=0.15)
    icone(g, ic, GOLD, x + 0.15, 5.4, 0.45)
    text(g, x + 0.7, 5.22, 1.6, 0.45, t1, size=14, bold=True, color=NAVY)
    text(g, x + 0.7, 5.58, 1.6, 0.4, t2, size=12, color=GREY)
blocs.append(g)
blocs.append(bandeau(s, 6.25, "26 semaines : du 5 janvier au 26 juin 2026 · évaluation par recette lot par lot, avec procès-verbal", nom_icone="calendar-range", size=16, h=0.6))
anime(s, blocs)

# ================================================================ Partie 3
intercalaire(3, "Les actions réalisées", "Pilotage, audit, solutions, architecture\net maquette réseau.", "rocket", "div3")

# ---------------------------------------------------------------- 7. Gestion de projet
s = slide("Gestion de projet et démarche ITIL v4", 3, "gestion")
f = fleche(s, 0.6, 1.6, 12.2, 0.8, ["Pilotage\n10 j", "Audit\n15 j", "Conception\n20 j", "Planification\n15 j", "Déploiement\n45 j", "Recette\n20 j"], size=14,
           couleurs=[NAVY, NAVY2, NAVY, NAVY2, GOLD, NAVY])
pic = image(s, FIG("gantt"), 0.6, 2.6, 7.7, "Diagramme de Gantt : 5 janvier → 26 juin 2026")
t = [tuile(s, 8.6, 2.6, 4.2, 1.35, "list-checks", "Outils de pilotage", None),
     tuile(s, 8.6, 4.07, 4.2, 1.35, "triangle-alert", "Maîtrise des risques", None),
     tuile(s, 8.6, 5.54, 4.2, 1.35, "refresh-cw", "ITIL v4", None)]
for (y, l) in [(2.6, "PBS · WBS · OBS · RACI · Gantt"), (4.07, "Registre évalué, marge de 10 %"), (5.54, "4 dimensions, chaîne de valeur")]:
    text(s, 9.6, y + 0.82, 3.1, 0.45, l, size=13, color=GREY)
anime(s, [f, pic] + t)

# ---------------------------------------------------------------- 8. Audit
s = slide("L'audit de l'existant : 17 constats critiques", 3, "audit")
t = [tuile(s, 0.6, 1.55, 3.95, 3.2, "network", "Réseau · 5", "R1 Switch cœur unique\nR2 Pare-feu unique, absent à Lyon\nR3 VPN inter-sites unique\nR4 FAI unique par site\nR5 Aucune segmentation / DMZ", accent=RED, size=14),
     tuile(s, 4.72, 1.55, 3.95, 3.2, "server-crash", "Systèmes · 6", "S1 Baie de stockage unique\nS2 Sauvegardes sans copie externe\nS3 SQL Server 2012 en fin de support\nS4 Exchange 2013 obsolète\nS5 Windows 8 sur les postes\nS8 Aucun RPO/RTO formalisé", accent=RED, size=14),
     tuile(s, 8.84, 1.55, 3.95, 3.2, "shield-alert", "Cybersécurité · 6", "C1 Pas de SOC/SIEM\nC2 Pas de MFA (DSP2)\nC3 Pas de PRA/PCA\nC4 Pas d'EDR centralisé\nC5 Documents non classifiés, sans GED\nC8 Comptes à privilèges non gérés", accent=RED, size=14)]
g = groupe(s)
text(g, 0.6, 4.88, 12.2, 0.35, "+ 6 constats de criticité moyenne, traités dans les mêmes lots (23 constats au total)", size=14, bold=True, color=GREY)
moyens = [("R6", "Équipements hors garantie", "Lots A, I"), ("R7", "Câblage vieillissant", "Lot A"), ("S6", "Pas d'outil de correctifs", "Lot J"),
          ("S7", "Pas de gestion de parc", "Lot I"), ("C6", "Pas de PSSI formalisée", "Lot F"), ("C7", "Sensibilisation insuffisante", "Formation")]
for k, (code, lib, lot) in enumerate(moyens):
    x = 0.6 + k * 2.05
    rect(g, x, 5.28, 1.95, 0.78, fill=MIST, line=LINE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, rayon=0.15)
    text(g, x + 0.1, 5.3, 1.8, 0.4, [code + " · " + lot], size=11, bold=True, color=GOLD)
    text(g, x + 0.1, 5.6, 1.8, 0.45, lib, size=12, color=INK)
t.append(g)
b = bandeau(s, 6.25, "3 axes : redondance · détection et continuité · protection des données sensibles", nom_icone="target", size=18, h=0.62)
anime(s, t + [b])

# ---------------------------------------------------------------- 9. Solutions
s = slide("Les solutions : trois piliers technologiques", 3, "solutions")
t = [tuile(s, 0.6, 1.65, 3.95, 2.75, "network", "Réseau", "Cisco Catalyst 9000\nFortinet FortiGate en HA\nVLAN, DMZ, double lien FAI", size=16),
     tuile(s, 4.72, 1.65, 3.95, 2.75, "server", "Virtualisation & PRA", "VMware vSphere HA/DRS\nVeeam, règle 3-2-1-1\nRPO / RTO définis", size=16),
     tuile(s, 8.84, 1.65, 3.95, 2.75, "fingerprint", "Identité & sécurité", "Microsoft 365 E5, Entra ID\nMFA, Defender, Purview\nSentinel : SIEM / SOAR", size=16)]
g = groupe(s)
text(g, 0.6, 4.6, 6, 0.4, "Chaque lot répond à des constats précis", size=18, bold=True, color=NAVY)
for i, (lot, obj, cst) in enumerate([("A", "Architecture réseau", "R1 – R7"), ("C", "Microsoft 365, MFA", "S5, C2"),
                                     ("F", "Audit sécurité + GED", "C2, C5, C6, C8"), ("G", "PRA / PCA", "S1, S2, S8, C3")]):
    x = 0.6 + i * 3.08
    rect(g, x, 5.1, 2.9, 1.6, fill=MIST, shape=MSO_SHAPE.ROUNDED_RECTANGLE, rayon=0.08)
    rect(g, x + 0.2, 5.3, 0.75, 0.75, fill=GOLD if lot == "F" else NAVY, shape=MSO_SHAPE.ROUNDED_RECTANGLE, rayon=0.2)
    text(g, x + 0.2, 5.3, 0.75, 0.75, lot, size=26, bold=True, color=WHITE, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    text(g, x + 1.1, 5.25, 1.75, 0.8, obj, size=14, bold=True, color=NAVY, anchor=MSO_ANCHOR.MIDDLE)
    text(g, x + 0.2, 6.15, 2.6, 0.4, "Constats " + cst, size=13, color=GREY)
anime(s, t + [g])

# ---------------------------------------------------------------- 10. Architecture et migration
s = slide("Architecture cible et plan de migration", 3, "architecture")
pic = image(s, FIG("reseau-cible"), 0.6, 1.6, 6.5)
g = groupe(s)
for i, (ic, t1, t2) in enumerate([("split", "Aucun point de défaillance unique", "cœurs, pare-feu, liens et stockage doublés"),
                                  ("layers", "Isolation stricte des flux bancaires", "VLAN, DMZ, filtrage applicatif"),
                                  ("shield-check", "Sécurité dès la conception", "identité, chiffrement, journalisation, détection")]):
    y = 1.65 + i * 1.3
    pastille(g, 7.45, y, 0.75, ic)
    text(g, 8.4, y - 0.05, 4.4, 0.45, t1, size=18, bold=True, color=NAVY)
    text(g, 8.4, y + 0.4, 4.4, 0.6, t2, size=14, color=GREY)
f = fleche(s, 0.6, 6.0, 12.2, 0.8, ["1\nRéseau", "2\nSystèmes", "3\nIdentité", "4\nMessagerie", "5\nSécurité", "6\nKHS-Core", "7\nPostes"], size=13)
r = text(s, 7.4, 5.4, 5.4, 0.5, "Coexistence progressive : 0 interruption de service", size=15, bold=True, color=GREEN)
anime(s, [pic, g, f, r])

# ---------------------------------------------------------------- 11. Maquette Packet Tracer
s = slide("Maquette Cisco Packet Tracer : la preuve par la pratique", 3, "maquette", presente=True)
pic = image(s, os.path.join(RACINE, "docs", "10-packet-tracer", "maquette-packet-tracer.png"), 0.6, 1.6, 7.7, "Paris (siège) à gauche · Lyon à droite · FAI simulé au centre")
g = groupe(s)
for i, (ic, t1, t2) in enumerate([("router", "20 équipements Cisco", "2 sites reliés par un FAI simulé"),
                                  ("layers", "7 VLAN, plan VLSM", "identique au dossier"),
                                  ("split", "HSRP", "2 cœurs, une passerelle virtuelle"),
                                  ("shield", "ASA 5505, NAT, ACL", "invités isolés du LAN"),
                                  ("git-branch", "Tunnel GRE", "liaison entre les sites")]):
    y = 1.6 + i * 0.86
    pastille(g, 8.6, y, 0.6, ic)
    text(g, 9.35, y - 0.06, 3.5, 0.4, t1, size=16, bold=True, color=NAVY)
    text(g, 9.35, y + 0.3, 3.5, 0.4, t2, size=13, color=GREY)
b = bandeau(s, 6.25, "Compétences C07 · C08 : routage, VLAN, routage inter-VLAN, redondance du cœur", nom_icone="graduation-cap", size=17, h=0.62)
anime(s, [pic, g, b])

# ---------------------------------------------------------------- 12. Recette de la maquette
s = slide("Maquette : la recette réalisée", 3, "recette_maquette", presente=True)
k = [chiffre(s, 0.6, 1.6, 3.95, "circle-check", "13 / 13", "tests exécutés et conformes", couleur=GREEN),
     chiffre(s, 4.72, 1.6, 3.95, "timer", "6 s", "de coupure à la panne du cœur\n(au lieu d'un arrêt complet)", couleur=GREEN),
     chiffre(s, 8.84, 1.6, 3.95, "scan-eye", "11", "anomalies détectées par la recette\net corrigées")]
tb = table(s, 0.6, 3.3, 12.2, [("Test", 0.9), ("Action", 3.3), ("Résultat obtenu", 4.4)], [
    ["PT11", "Cœur actif hors service pendant un ping continu", "6 paquets perdus, puis reprise automatique : le cœur 2 devient actif sur les 7 VLAN"],
    ["PT12", "Cœur 1 hors service, puis remis en service", "Internet joignable via le cœur 2 ; au retour, le cœur 1 reprend la main"],
    ["PT04", "Portable invité → réseau interne", "0/4, « destination injoignable » renvoyé par le cœur : l'ACL bloque"],
    ["PT05", "Portable invité → Internet", "3/4 réponses : seul le LAN est interdit"],
    ["PT07", "Paris → Lyon", "10/10, TTL 122 : passage par le tunnel GRE prouvé par le traceroute"],
    ["PT10", "Extérieur → réseau interne et pare-feu", "0/5 : le pare-feu bloque et reste muet"]], size=13, hsize=14, rowh=0.5)
anime(s, k + [s.shapes[-1]])

# ================================================================ Partie 4
intercalaire(4, "Focus : la GED sécurisée", "Une GED réalisée par MOM-TECH, où la sécurité\nest appliquée par la base de données.", "file-lock", "div4", presente=True)

# ---------------------------------------------------------------- 13. Focus GED
s = slide("La GED sécurisée du Lot F", 4, "ged", presente=True)
tuiles = [("file-text", "Ateliers intégrés", "Word, Excel, PowerPoint ; export natif et PDF"),
          ("file-lock", "Classification", "Interne, restreint, confidentiel : appliquée par la base"),
          ("users", "Accès par rôle", "6 rôles, filtrés par département"),
          ("fingerprint", "Double authentification", "Code TOTP obligatoire"),
          ("workflow", "Circuit de validation", "Dépôt → vérification → validation → publication"),
          ("history", "Journal d'audit immuable", "Aucune modification possible"),
          ("archive", "Archivage scellé", "Empreinte SHA-256, lecture seule"),
          ("pen-tool", "Signature et QR code", "Authenticité vérifiable publiquement")]
blocs = []
for i, (ic, t1, t2) in enumerate(tuiles):
    x = 0.6 + (i % 4) * 3.08; y = 1.6 + (i // 4) * 2.4
    blocs.append(tuile(s, x, y, 2.9, 2.2, ic, t1, t2, size=14, tsize=16))
blocs.append(text(s, 0.6, 6.45, 12.2, 0.5, "Constats traités : C2, C5, C6, C8, C17 · Next.js + PostgreSQL · compléments Microsoft 365 : Purview DLP, Entra PIM", size=14, bold=True, color=GOLD, align=PP_ALIGN.CENTER))
anime(s, blocs, pas=0.15)

# ---------------------------------------------------------------- 14. Principe
s = slide("Principe : la sécurité est dans la base de données", 4, "principe", presente=True)
g = groupe(s)
for (x, fond, ic, coul, t1, lignes, ct) in [(0.6, GOLDL, "monitor", NAVY, "Navigateur", ["Agent connecté", "ou tiers sans compte"], NAVY),
                                            (4.95, NAVY2, "layers", GOLD, "Application Next.js", ["Aucune règle d'autorisation", "dans le code"], WHITE),
                                            (9.3, NAVY, "database", GOLD, "PostgreSQL (Supabase)", ["RLS, MFA, audit", "URL signées 5 min"], WHITE)]:
    rect(g, x, 1.6, 3.5, 2.5, fill=fond, shape=MSO_SHAPE.ROUNDED_RECTANGLE, rayon=0.06)
    icone(g, ic, coul, x + 1.4, 1.75, 0.7)
    text(g, x + 0.1, 2.5, 3.3, 0.45, t1, size=18, bold=True, color=ct, align=PP_ALIGN.CENTER)
    text(g, x + 0.1, 3.0, 3.3, 1.0, lignes, size=15, color=GREY if fond == GOLDL else GOLDL, align=PP_ALIGN.CENTER)
for x, lab in ((4.15, "HTTPS"), (8.5, "jeton aal2")):
    rect(g, x, 2.6, 0.75, 0.45, fill=GOLD, shape=MSO_SHAPE.RIGHT_ARROW)
    text(g, x - 0.3, 3.1, 1.35, 0.3, lab, size=11, color=GREY, align=PP_ALIGN.CENTER)
t = [tuile(s, 0.6, 4.4, 3.95, 2.4, "eye-off", "RLS : qui voit quoi", "Rôle, département, classification et organisation évalués à chaque requête", size=15, tsize=17),
     tuile(s, 4.72, 4.4, 3.95, 2.4, "key-round", "MFA imposée", "Sans code TOTP, aucune table n'est lisible, même par appel direct", size=15, tsize=17),
     tuile(s, 8.84, 4.4, 3.95, 2.4, "history", "Audit immuable", "Un déclencheur refuse toute modification, même avec la clé de service", size=15, tsize=17)]
anime(s, [g] + t)

# ---------------------------------------------------------------- 15. Preuve
s = slide("Preuve en situation : un rédacteur refusé", 4, "preuve", presente=True)
pic = image(s, os.path.join(RACINE, "docs", "05-solutions", "capture-acces-refuse-redacteur.png"), 0.6, 1.6, 7.7, "Site déployé · compte Rédacteur · adresse /admin/utilisateurs")
blocs = []
for i, (ic, t1, t2) in enumerate([("monitor", "Interface", "aucune entrée d'administration dans le menu"),
                                  ("user-x", "Page", "accès réservé au rôle Administrateur"),
                                  ("database", "Base de données", "la fonction de changement de rôle vérifie l'appelant et refuse")]):
    y = 1.6 + i * 1.45
    g = groupe(s)
    rect(g, 8.6, y, 4.2, 1.3, fill=MIST, shape=MSO_SHAPE.ROUNDED_RECTANGLE, rayon=0.08)
    pastille(g, 8.8, y + 0.32, 0.65, ic, fond=RED if i == 2 else NAVY)
    text(g, 9.6, y + 0.1, 3.1, 0.4, f"{i + 1}. {t1}", size=17, bold=True, color=NAVY)
    text(g, 9.6, y + 0.5, 3.1, 0.8, t2, size=13, color=GREY)
    blocs.append(g)
b = bandeau(s, 6.25, "Moindre privilège : tout nouveau compte est Lecteur · seul un administrateur change un rôle", nom_icone="lock", size=17, h=0.62)
anime(s, [pic] + blocs + [b])

# ---------------------------------------------------------------- 16. Démonstration
s = slide("Démonstration en direct : le parcours d'un document", 4, "demo", presente=True)
g = groupe(s)
etapes = [("file-text", "Dépôt"), ("circle-check", "Validation"), ("pen-tool", "Signature DG"), ("archive", "Archivage"), ("mail", "Courrier"), ("history", "Journal")]
for i, (ic, l) in enumerate(etapes):
    x = 0.75 + i * 2.05
    pastille(g, x + 0.35, 1.65, 1.0, ic, fond=GOLD if i == 5 else NAVY)
    text(g, x - 0.1, 2.75, 1.9, 0.4, f"{i + 1}. {l}", size=15, bold=True, color=NAVY, align=PP_ALIGN.CENTER)
    if i < 5:
        rect(g, x + 1.55, 2.0, 0.4, 0.3, fill=GOLD, shape=MSO_SHAPE.RIGHT_ARROW)
t = [tuile(s, 0.6, 3.45, 3.95, 3.35, "eye-off", "Ce qu'on prouve", "Un lecteur ne voit pas un document confidentiel d'un autre département\nSans code TOTP, aucune donnée\nL'archivé n'est plus modifiable", size=15),
     tuile(s, 4.72, 3.45, 3.95, 3.35, "qr-code", "Authenticité", "Le PDF signé porte un QR code\nPage publique /verifier : fichier reconnu ou refusé\nContenu jamais divulgué", size=15),
     tuile(s, 8.84, 3.45, 3.95, 3.35, "history", "Traçabilité", "Courrier arrivé numéroté, scanné, remis\nDécharge de réception au départ\nJournal consultable, non modifiable", size=15)]
anime(s, [g] + t)

# ---------------------------------------------------------------- 17. Courrier et multi-organisation
s = slide("Courrier physique et multi-organisation", 4, "courrier", presente=True)
t = [tuile(s, 0.6, 1.65, 3.95, 4.15, "mail", "Courrier arrivée", "Enregistré sans ouvrir le pli\nNuméro ARR-2026-000123\nRécépissé PDF, numérisation, remise avec accusé\nPlis personnels jamais scannés", size=15),
     tuile(s, 4.72, 1.65, 3.95, 4.15, "send", "Courrier départ", "Demande depuis un document validé\nNuméro DEP-…, bordereau, relances\nAccusé prouvé par une décharge\nAucune destruction automatique", size=15),
     tuile(s, 8.84, 1.65, 3.95, 4.15, "building-2", "Multi-organisation", "Un code, deux organisations\nKHS Bank · Agence API\nCloisonnement posé par la base\nIdentité visuelle par configuration", size=15)]
b = bandeau(s, 6.1, "Validé : 33 migrations rejouées sans erreur · 169 + 15 tests SQL · parcours automatisé de 42 contrôles", fond=GREENL, couleur=GREEN, nom_icone="circle-check", size=16, h=0.7)
anime(s, t + [b])

# ================================================================ Partie 5
intercalaire(5, "Synthèse et conclusion", "Ce que le projet coûte, ce qui a été vérifié,\net ce qu'il reste à faire.", "flag", "div5")

# ---------------------------------------------------------------- 18. Bilan financier
s = slide("Bilan financier", 5, "bilan")
k = [chiffre(s, 0.6, 1.6, 3.95, "coins", "≈ 4,8 M€", "investissement initial (CAPEX)\nmarge de 10 % pour aléas incluse"),
     chiffre(s, 4.72, 1.6, 3.95, "refresh-cw", "≈ 1,5 M€/an", "fonctionnement récurrent (OPEX)"),
     chiffre(s, 8.84, 1.6, 3.95, "gauge", "≈ 11 %", "du budget annuel de 14 M€", couleur=GREEN)]
cd = CategoryChartData()
cd.categories = ["Prestations MOM-TECH (4 ingénieurs × 6 mois)", "Licences Microsoft 365 E5 (1ʳᵉ année)", "Postes clients (920) et VDI", "Réseau (Catalyst, FortiGate HA, câblage)", "Virtualisation et stockage (ESXi, SAN, Veeam)"]
cd.add_series("Coût (k€)", (480, 629.28, 650, 780, 900))
gf = s.shapes.add_chart(XL_CHART_TYPE.BAR_CLUSTERED, Inches(0.6), Inches(3.25), Inches(12.2), Inches(3.3), cd)
ch = gf.chart
ch.has_legend = False
ch.has_title = False
pl = ch.plots[0]; pl.gap_width = 45
pl.series[0].format.fill.solid(); pl.series[0].format.fill.fore_color.rgb = NAVY
pt = pl.series[0].points[4]; pt.format.fill.solid(); pt.format.fill.fore_color.rgb = GOLD
pl.has_data_labels = True
dl = pl.data_labels; dl.number_format = '# ##0" k€"'; dl.number_format_is_linked = False
dl.position = XL_LABEL_POSITION.OUTSIDE_END; dl.font.size = Pt(13); dl.font.bold = True; dl.font.color.rgb = INK
ch.value_axis.visible = False; ch.value_axis.has_major_gridlines = False
ch.category_axis.tick_labels.font.size = Pt(13); ch.category_axis.tick_labels.font.color.rgb = INK
ch.category_axis.format.line.fill.background()
n = text(s, 0.6, 6.6, 12.2, 0.4, "Principaux postes d'investissement · astreinte SOC 24/7 : 420 000 € par an, premier poste récurrent après les licences", size=13, color=GREY, italic=True)
anime(s, k + [gf, n])

# ---------------------------------------------------------------- 19. Recette
s = slide("Recette : conformité vérifiée lot par lot", 5, "recette")
blocs = []
tests = [("Bascule automatique du cœur de réseau", "Aucune coupure perceptible"),
         ("Bascule du lien VPN principal vers le secours", "Reprise < 30 s"),
         ("Arrêt d'un hôte du cluster VMware", "RTO ≤ 30 min"),
         ("Bascule Always On de KHS-Core", "RTO ≤ 1 h · RPO ≤ 15 min"),
         ("Connexion sans second facteur", "Accès refusé (MFA obligatoire)"),
         ("Événement d'authentification suspecte injecté", "Alerte Sentinel en moins de 5 min"),
         ("Envoi externe d'un document confidentiel", "Blocage par la politique DLP")]
for i, (t1, t2) in enumerate(tests):
    y = 1.6 + i * 0.64
    g = groupe(s)
    rect(g, 0.6, y, 12.2, 0.56, fill=MIST if i % 2 == 0 else WHITE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, rayon=0.2)
    pastille(g, 0.75, y + 0.07, 0.42, "check", fond=GREEN)
    text(g, 1.35, y, 6.4, 0.56, t1, size=16, bold=True, color=NAVY, anchor=MSO_ANCHOR.MIDDLE)
    text(g, 7.8, y, 3.6, 0.56, t2, size=15, color=GREY, anchor=MSO_ANCHOR.MIDDLE)
    text(g, 11.3, y, 1.4, 0.56, "Conforme", size=14, bold=True, color=GREEN, anchor=MSO_ANCHOR.MIDDLE)
    blocs.append(g)
blocs.append(bandeau(s, 6.2, "Tous les tests de l'extrait conformes · procès-verbal signé · aucune interruption des services bancaires", fond=GREENL, couleur=GREEN, nom_icone="circle-check", size=16, h=0.65))
anime(s, blocs, pas=0.18)

# ---------------------------------------------------------------- 20. Conclusion
s = slide("Conclusion : avant, après", 5, "conclusion")
text(s, 2.95, 1.55, 4.6, 0.4, "AVANT", size=14, bold=True, color=RED)
text(s, 8.15, 1.55, 4.6, 0.4, "APRÈS", size=14, bold=True, color=GREEN)
blocs = []
lignes = [("activity", "Fiabiliser", "Cœur, pare-feu, VPN, stockage uniques", "Plus aucun point de défaillance unique"),
          ("shield", "Sécuriser", "Ni MFA, ni SOC, documents non classifiés", "MFA, SOC, GED sécurisée, conformité démontrée"),
          ("sparkles", "Moderniser", "Windows 8, Exchange 2013, SQL 2012", "Microsoft 365, Windows 11, VOIP unifié"),
          ("trending-down", "Coûts", "Éditeurs dispersés, coûts cachés", "≈ 11 % du budget annuel"),
          ("graduation-cap", "Accompagner", "920 utilisateurs à embarquer", "Formation exécutée, référents désignés")]
for i, (ic, obj, av, ap) in enumerate(lignes):
    y = 1.95 + i * 0.72
    g = groupe(s)
    pastille(g, 0.6, y + 0.04, 0.52, ic, fond=NAVY)
    text(g, 1.2, y, 1.7, 0.6, obj, size=16, bold=True, color=NAVY, anchor=MSO_ANCHOR.MIDDLE)
    rect(g, 2.95, y, 4.7, 0.6, fill=REDL, shape=MSO_SHAPE.ROUNDED_RECTANGLE, rayon=0.2)
    text(g, 3.1, y, 4.5, 0.6, av, size=14, color=RED, anchor=MSO_ANCHOR.MIDDLE)
    rect(g, 7.7, y + 0.15, 0.35, 0.3, fill=GOLD, shape=MSO_SHAPE.RIGHT_ARROW)
    rect(g, 8.15, y, 4.65, 0.6, fill=GREENL, shape=MSO_SHAPE.ROUNDED_RECTANGLE, rayon=0.2)
    text(g, 8.3, y, 4.45, 0.6, ap, size=14, bold=True, color=GREEN, anchor=MSO_ANCHOR.MIDDLE)
    blocs.append(g)
g = groupe(s)
text(g, 0.6, 5.65, 2.5, 0.4, "Perspectives", size=16, bold=True, color=NAVY)
for i, (ic, l) in enumerate([("brain-circuit", "IA du SOC contre la fraude"), ("cloud", "Cloud souverain"), ("key-round", "GED : authentification unique"), ("refresh-cw", "Veille et maintenance")]):
    x = 0.6 + i * 3.08
    rect(g, x, 6.05, 2.9, 0.75, fill=GOLDL, shape=MSO_SHAPE.ROUNDED_RECTANGLE, rayon=0.2)
    icone(g, ic, GOLD, x + 0.15, 6.2, 0.45)
    text(g, x + 0.7, 6.05, 2.15, 0.75, l, size=13, bold=True, color=NAVY, anchor=MSO_ANCHOR.MIDDLE)
blocs.append(g)
anime(s, blocs)

# ---------------------------------------------------------------- 21. Merci
s = prs.slides.add_slide(BLANK); N["n"] += 1
rect(s, 0, 0, 13.333, 7.5, fill=NAVY)
icone(s, "message-circle-question", NAVY3, 9.2, 0.5, 3.6)
text(s, 0.8, 2.6, 11.7, 1.2, "Merci de votre attention", size=48, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
rect(s, 5.85, 3.95, 1.6, 0.07, fill=GOLD)
text(s, 0.8, 4.25, 11.7, 0.6, "Questions du jury", size=26, color=GOLDL, align=PP_ALIGN.CENTER)
text(s, 0.8, 6.4, 11.7, 0.5, "17 constats critiques traités · 0 interruption de service · une GED sécurisée en production", size=16, bold=True, color=GOLD, align=PP_ALIGN.CENTER)
s.notes_slide.notes_text_frame.text = NOTES["merci"]
transition(s)

out = sys.argv[1]
prs.save(out)
print("OK", N["n"], "diapositives ->", out)
