#!/usr/bin/env python3
# Génère le diaporama de soutenance KHS Bank / MOM-TECH (python-pptx).
import sys, os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

NAVY = RGBColor(0x0B, 0x12, 0x20)
NAVY2 = RGBColor(0x16, 0x1F, 0x34)
GOLD = RGBColor(0xB8, 0x92, 0x3F)
GOLDL = RGBColor(0xF3, 0xEA, 0xDA)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
INK = RGBColor(0x1B, 0x24, 0x38)
GREY = RGBColor(0x5B, 0x65, 0x78)
LINE = RGBColor(0xDD, 0xD6, 0xC6)
RED = RGBColor(0xB4, 0x3A, 0x3A)
GREEN = RGBColor(0x2E, 0x7D, 0x5B)
FONT = "Calibri"

prs = Presentation()
prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
BLANK = prs.slide_layouts[6]
N = {"n": 0}


def rect(s, x, y, w, h, fill=None, line=None, shape=MSO_SHAPE.RECTANGLE, lw=0.75):
    r = s.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    if fill is None:
        r.fill.background()
    else:
        r.fill.solid(); r.fill.fore_color.rgb = fill
    if line is None:
        r.line.fill.background()
    else:
        r.line.color.rgb = line; r.line.width = Pt(lw)
    r.shadow.inherit = False
    return r


def text(s, x, y, w, h, t, size=18, bold=False, color=INK, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, font=FONT, italic=False, spacing=None):
    tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame; tf.word_wrap = True
    tf.margin_left = tf.margin_right = Inches(0.05); tf.margin_top = tf.margin_bottom = Inches(0.03)
    tf.vertical_anchor = anchor
    lines = t if isinstance(t, list) else [t]
    for i, l in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        if spacing: p.space_after = Pt(spacing)
        r = p.add_run(); r.text = l
        r.font.size = Pt(size); r.font.bold = bold; r.font.color.rgb = color; r.font.name = font; r.font.italic = italic
    return tb


def bullets(s, x, y, w, h, items, size=18, color=INK, gap=8):
    tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame; tf.word_wrap = True
    tf.margin_left = Inches(0.05)
    for i, it in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(gap)
        sub = isinstance(it, tuple)
        label, detail = (it if sub else (it, None))
        r0 = p.add_run(); r0.text = "▪ "; r0.font.size = Pt(size); r0.font.color.rgb = GOLD; r0.font.name = FONT; r0.font.bold = True
        r = p.add_run(); r.text = label; r.font.size = Pt(size); r.font.color.rgb = color; r.font.name = FONT; r.font.bold = sub
        if detail:
            r2 = p.add_run(); r2.text = " — " + detail; r2.font.size = Pt(size); r2.font.color.rgb = GREY; r2.font.name = FONT
    return tb


def slide(titre, kicker=None, notes="", fond=WHITE):
    s = prs.slides.add_slide(BLANK)
    N["n"] += 1
    rect(s, 0, 0, 13.333, 7.5, fill=fond)
    rect(s, 0, 0, 13.333, 1.05, fill=NAVY)
    rect(s, 0, 1.05, 13.333, 0.05, fill=GOLD)
    if kicker:
        text(s, 0.6, 0.12, 9, 0.3, kicker.upper(), size=11, bold=True, color=GOLD)
    # Les diapositives de la maquette réseau et du Lot F sont présentées par leur réalisateur.
    if kicker == "4 · Focus GED" or titre.startswith("Maquette"):
        text(s, 8.0, 0.12, 4.8, 0.3, "Présenté par Julien Joël NGONO MESSI", size=11, bold=True, color=GOLDL, align=PP_ALIGN.RIGHT)
    text(s, 0.6, 0.38, 12, 0.6, titre, size=28, bold=True, color=WHITE, anchor=MSO_ANCHOR.MIDDLE)
    text(s, 0.6, 7.08, 8, 0.3, "KHS Bank — Migration et sécurisation du SI · MOM-TECH", size=10, color=GREY)
    text(s, 12.0, 7.08, 0.8, 0.3, str(N["n"]), size=10, color=GREY, align=PP_ALIGN.RIGHT)
    if notes:
        s.notes_slide.notes_text_frame.text = notes
    return s


def card(s, x, y, w, h, titre, corps, accent=GOLD, size=18, tsize=20):
    rect(s, x, y, w, h, fill=WHITE, line=LINE)
    rect(s, x, y, 0.08, h, fill=accent)
    text(s, x + 0.2, y + 0.1, w - 0.3, 0.45, titre, size=tsize, bold=True, color=NAVY)
    text(s, x + 0.2, y + 0.6, w - 0.3, h - 0.65, corps.split("\n"), size=size, color=INK, spacing=7)


def kpi(s, x, y, w, valeur, libelle, couleur=NAVY):
    rect(s, x, y, w, 1.35, fill=GOLDL)
    text(s, x, y + 0.1, w, 0.7, valeur, size=32, bold=True, color=couleur, align=PP_ALIGN.CENTER)
    text(s, x + 0.1, y + 0.8, w - 0.2, 0.5, libelle.split("\n"), size=14, color=GREY, align=PP_ALIGN.CENTER)


def flow(s, x, y, w, h, etapes, size=13, couleurs=None):
    n = len(etapes); gap = 0.08; cw = (w - gap * (n - 1)) / n
    for i, e in enumerate(etapes):
        c = (couleurs or [NAVY] * n)[i]
        sh = rect(s, x + i * (cw + gap), y, cw, h, fill=c, shape=MSO_SHAPE.PENTAGON)
        tf = sh.text_frame; tf.word_wrap = True; tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf.margin_left = Inches(0.1); tf.margin_right = Inches(0.25)
        p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
        r = p.add_run(); r.text = e; r.font.size = Pt(size); r.font.bold = True; r.font.color.rgb = WHITE; r.font.name = FONT


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
            c = t.cell(j, i); c.fill.solid(); c.fill.fore_color.rgb = WHITE if j % 2 else GOLDL
            c.text_frame.text = v
            c.text_frame.word_wrap = True
            r = c.text_frame.paragraphs[0].runs[0]; r.font.size = Pt(size); r.font.color.rgb = INK; r.font.name = FONT
            r.font.bold = (i == 0)
    return t


# ---------------------------------------------------------------- 1. Titre
s = prs.slides.add_slide(BLANK); N["n"] += 1
rect(s, 0, 0, 13.333, 7.5, fill=NAVY)
rect(s, 0.8, 3.55, 1.6, 0.06, fill=GOLD)
text(s, 0.8, 1.5, 11.5, 0.4, "SOUTENANCE · TITRE ISRC — INGÉNIEUR SYSTÈMES, RÉSEAUX ET CYBERSÉCURITÉ", size=14, bold=True, color=GOLD)
text(s, 0.8, 2.0, 11.8, 1.5, ["Migration et sécurisation", "du système d'information de KHS Bank"], size=40, bold=True, color=WHITE)
text(s, 0.8, 3.8, 11, 0.6, "Projet mené par MOM-TECH — de l'audit à la GED sécurisée", size=22, color=GOLDL)
text(s, 0.8, 5.75, 11.8, 0.9, ["NGONO MESSI Julien Joël · ADJE Tchaffa Oladé Moïse", "WAFO Franklin Junior · ABAYOMI Obachegoun Olabissi"], size=18, bold=True, color=WHITE, spacing=2)
text(s, 0.8, 6.65, 8, 0.4, "IEF2I · Institut Européen F2I", size=14, color=GOLDL)
text(s, 9.0, 6.65, 3.5, 0.4, "16 décembre 2026", size=14, color=GOLDL, align=PP_ALIGN.RIGHT)
s.notes_slide.notes_text_frame.text = ("Bonjour. Je vais vous présenter le projet de migration et de sécurisation du système d'information de KHS Bank, "
    "réalisé pour le compte de MOM-TECH. Je suivrai le plan attendu : les acteurs, le cahier des charges, les actions réalisées, puis la conclusion. "
    "Je terminerai par une démonstration en direct de la GED sécurisée que MOM-TECH a réalisée, et dans laquelle les agents créent eux-mêmes leurs documents Word, Excel et PowerPoint.")

# ---------------------------------------------------------------- 2. Plan
s = slide("Plan de la présentation", "Introduction",
          "Quatre temps, conformément au plan de soutenance : les acteurs, le cahier des charges, les actions réalisées, la synthèse. "
          "Durée visée : environ 25 minutes de présentation, 10 minutes de démonstration, puis les questions du jury.")
items = [("1", "Les acteurs", "KHS Bank, client · MOM-TECH, prestataire"),
         ("2", "Le cahier des charges", "objectifs, contraintes, résultats attendus, délais"),
         ("3", "Les actions réalisées", "gestion de projet, audit, solutions, maquette Packet Tracer, migration"),
         ("4", "Focus : la GED sécurisée", "ateliers Word/Excel/PowerPoint, sécurité, démonstration"),
         ("5", "Synthèse et conclusion", "bilan financier, recette, perspectives")]
for i, (n, t1, t2) in enumerate(items):
    y = 1.6 + i * 1.05
    rect(s, 1.2, y, 0.8, 0.8, fill=NAVY, shape=MSO_SHAPE.OVAL)
    text(s, 1.2, y, 0.8, 0.8, n, size=26, bold=True, color=GOLD, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    text(s, 2.3, y + 0.02, 9, 0.4, t1, size=22, bold=True, color=NAVY)
    text(s, 2.3, y + 0.42, 9.5, 0.4, t2, size=15, color=GREY)

# ---------------------------------------------------------------- 3. KHS Bank
s = slide("Le client : KHS Bank", "1 · Les acteurs",
          "KHS Bank est un établissement de crédit agréé par l'ACPR, créé en 2004, siège à Paris La Défense et site secondaire à Lyon. "
          "Environ 920 collaborateurs. Son système d'information est vieillissant et hétérogène : Windows 8, Exchange 2013, SQL Server 2012, "
          "un seul lien VPN entre les sites. À cela s'ajoute la pression réglementaire : ACPR, DSP2, PCI-DSS, RGPD. "
          "Le pilotage côté client est conjoint entre la DSI et la direction Conformité et Sécurité.")
kpi(s, 0.7, 1.5, 2.8, "≈ 920", "collaborateurs\n(780 Paris · 140 Lyon)")
kpi(s, 3.7, 1.5, 2.8, "2004", "création\nétablissement agréé ACPR")
kpi(s, 6.7, 1.5, 2.8, "14 M€", "budget annuel SI")
kpi(s, 9.7, 1.5, 2.9, "2 sites", "Paris La Défense · Lyon")
text(s, 0.7, 3.1, 6, 0.4, "Un SI vieillissant et hétérogène", size=18, bold=True, color=NAVY)
bullets(s, 0.7, 3.6, 5.9, 3.3, ["Postes sous Windows 8", "Messagerie Exchange 2013", "Base SQL Server 2012 (application KHS-Core)", "Liaison VPN unique entre les sites", "Ni SOC, ni PRA/PCA formalisé"], size=19, gap=8)
text(s, 7.0, 3.1, 6, 0.4, "Sous forte pression réglementaire", size=18, bold=True, color=NAVY)
bullets(s, 7.0, 3.6, 5.8, 3.3, ["ACPR · DSP2 · PCI-DSS · RGPD", "Secret bancaire", "Aucune interruption tolérée sur les moyens de paiement", "Pilotage : DSI + Direction Conformité & Sécurité"], size=19, gap=8)

# ---------------------------------------------------------------- 4. MOM-TECH
s = slide("Le prestataire : MOM-TECH", "1 · Les acteurs",
          "MOM-TECH est un cabinet d'ingénierie spécialisé en cybersécurité, cloud et intelligence artificielle. Quatre ingénieurs sont dédiés au projet, "
          "organisés en deux sous-équipes. Notre conviction : la sécurité et l'IA se pensent dès la conception. La démarche suit ITIL v4.")
card(s, 0.7, 1.5, 3.9, 2.2, "Cybersécurité", "Audit, SOC/SIEM, PRA/PCA, identités et accès, conformité, GED sécurisée", size=18)
card(s, 4.8, 1.5, 3.9, 2.2, "Cloud & infrastructure", "Architecture réseau, virtualisation, haute disponibilité, cloud hybride ou souverain", size=18)
card(s, 8.9, 1.5, 3.8, 2.2, "IA & données", "Détection d'anomalies et de fraude, analyse comportementale couplée au SOC", size=18)
text(s, 0.7, 4.0, 12, 0.4, "Équipe projet : 4 ingénieurs · 2 sous-équipes · démarche ITIL v4", size=18, bold=True, color=NAVY)
bullets(s, 0.7, 4.6, 12, 2.2, [("Sous-équipe Réseau & Sécurité", "audit réseau, architecture, pare-feu, SOC"), ("Sous-équipe Systèmes & Cloud", "virtualisation, stockage, Microsoft 365, migration"), ("Chef de projet", "référent MOM-TECH au sein de la DSI de KHS Bank")], size=19)

# ---------------------------------------------------------------- 4b. Équipe
s = slide("L'équipe projet MOM-TECH", "1 · Les acteurs",
          "Voici l'équipe : quatre ingénieurs. J'ai réalisé la GED sécurisée du Lot F et la maquette Packet Tracer de l'architecture réseau, et je présente ces deux parties. "
          "[Chaque membre présente ensuite sa partie : à compléter avec la répartition du groupe.]")
membres = [("NGONO MESSI", "Julien Joël", "GED sécurisée (Lot F)\nMaquette réseau Packet Tracer\nPrésente le Lot F", True),
           ("ADJE", "Tchaffa Oladé Moïse", "Ingénieur MOM-TECH", False),
           ("WAFO", "Franklin Junior", "Ingénieur MOM-TECH", False),
           ("ABAYOMI", "Obachegoun Olabissi", "Ingénieur MOM-TECH", False)]
for i, (nom, prenom, role, vedette) in enumerate(membres):
    x = 0.7 + i * 3.05
    rect(s, x, 1.6, 2.9, 4.4, fill=NAVY if vedette else WHITE, line=None if vedette else LINE)
    rect(s, x, 1.6, 2.9, 0.08, fill=GOLD)
    rect(s, x + 0.95, 2.0, 1.0, 1.0, fill=GOLD if vedette else GOLDL, shape=MSO_SHAPE.OVAL)
    text(s, x + 0.95, 2.0, 1.0, 1.0, nom[0] + prenom[0], size=28, bold=True, color=NAVY, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    text(s, x + 0.1, 3.2, 2.7, 0.5, nom, size=20, bold=True, color=WHITE if vedette else NAVY, align=PP_ALIGN.CENTER)
    text(s, x + 0.1, 3.7, 2.7, 0.7, prenom, size=17, color=GOLDL if vedette else GREY, align=PP_ALIGN.CENTER)
    text(s, x + 0.1, 4.5, 2.7, 1.4, role.split("\n"), size=15, bold=vedette, color=GOLD if vedette else GREY, align=PP_ALIGN.CENTER, spacing=3)
text(s, 0.7, 6.3, 12, 0.5, "Équipe de 4 ingénieurs · 2 sous-équipes : Architecture Système et Réseau & Sécurité", size=15, color=GREY, italic=True, align=PP_ALIGN.CENTER)

# ---------------------------------------------------------------- 5. CDC
s = slide("Le cahier des charges", "2 · Cahier des charges",
          "Le cahier des charges exprime cinq objectifs : fiabiliser, sécuriser, moderniser, maîtriser les coûts, accompagner le changement. "
          "Les contraintes sont fortes : réglementaires, deux sites, aucune interruption de service tolérée, budget plafonné. "
          "L'application KHS-Core est hors périmètre applicatif, mais son infrastructure est dans le périmètre.")
table(s, 0.7, 1.5, 6.1, [("Objectif", 1.3), ("Traduction", 2.6)], [
    ["Fiabiliser", "Redondance, PRA/PCA, haute disponibilité"],
    ["Sécuriser", "RGPD / ACPR / DSP2 / PCI-DSS, SOC, IAM, GED"],
    ["Moderniser", "Microsoft 365, parc harmonisé, sites unifiés"],
    ["Maîtriser les coûts", "Parc et licences rationalisés"],
    ["Accompagner", "Formation, communication, risques humains"]], size=15, hsize=15, rowh=0.62)
text(s, 7.2, 1.5, 5.5, 0.4, "Contraintes", size=18, bold=True, color=NAVY)
bullets(s, 7.2, 2.0, 5.6, 2.6, [("Réglementaire", "RGPD, ACPR, DSP2, PCI-DSS"), ("Continuité", "aucune interruption totale"), ("Organisation", "2 sites, 920 utilisateurs"), ("Méthode", "ITIL v4 obligatoire"), ("Budget", "14 M€ / an")], size=18, gap=7)
rect(s, 7.2, 5.0, 5.5, 1.7, fill=GOLDL)
text(s, 7.4, 5.1, 5.1, 0.4, "Délai et évaluation", size=16, bold=True, color=NAVY)
text(s, 7.4, 5.55, 5.1, 1.1, ["26 semaines : du 5 janvier au 26 juin 2026", "Évaluation par recette lot par lot, avec procès-verbal"], size=14, color=GREY)

# ---------------------------------------------------------------- 6. Gestion de projet
s = slide("Gestion de projet et démarche ITIL v4", "3 · Actions réalisées",
          "Le projet est planifié sur 26 semaines en six phases. Les outils de gestion de projet livrés sont le PBS, le WBS, l'OBS, la matrice RACI, le registre des risques et le diagramme de Gantt. "
          "La démarche ITIL v4 structure l'ensemble : quatre dimensions, chaîne de valeur, pratiques clés et principes directeurs.")
flow(s, 0.7, 1.5, 11.9, 0.9, ["Pilotage\n10 j", "Audit\n15 j", "Conception\n20 j", "Planification\n15 j", "Déploiement\n45 j", "Recette\n20 j"], size=15,
     couleurs=[NAVY, NAVY2, NAVY, NAVY2, GOLD, NAVY])
text(s, 0.7, 2.5, 12, 0.3, "5 janvier 2026 → 26 juin 2026 · 26 semaines", size=13, color=GREY, italic=True)
card(s, 0.7, 3.1, 3.8, 3.5, "Outils de pilotage", "PBS (livrables)\nWBS (tâches)\nOBS (organisation)\nMatrice RACI\nDiagramme de Gantt", size=18)
card(s, 4.7, 3.1, 3.8, 3.5, "Maîtrise des risques", "Registre des risques évalué (probabilité × impact)\nMarge de 10 % pour aléas\nPriorisation des constats élevés en début de déploiement", size=18)
card(s, 8.7, 3.1, 4.0, 3.5, "ITIL v4", "4 dimensions appliquées\nChaîne de valeur du service\nPratiques clés : changement, incidents, amélioration continue\nPrincipes directeurs", size=18)

# ---------------------------------------------------------------- 7. Audit
s = slide("L'audit de l'existant : 14 constats critiques", "3 · Actions réalisées",
          "L'audit couvre le réseau, les systèmes et la cybersécurité. Il met en évidence 14 constats de criticité élevée. "
          "Ils se regroupent en trois axes : l'absence de redondance, l'absence de détection et de continuité, et une protection insuffisante des données sensibles. "
          "Cette priorisation guide l'ordre des lots et le Gantt. Les constats C2, C5, C6 et C8 sont ceux que traite le Lot F, sur lequel je reviendrai.")
card(s, 0.7, 1.5, 3.9, 4.0, "Réseau (R1–R5)", "Switch cœur unique\nPare-feu unique, absent à Lyon\nVPN inter-sites unique\nFAI unique par site\nAucune segmentation / DMZ", accent=RED, size=18)
card(s, 4.8, 1.5, 3.9, 4.0, "Systèmes (S1–S8)", "Baie de stockage unique\nSauvegardes sans copie externe\nSQL Server 2012, Exchange 2013 en fin de support\nWindows 8 sur les postes\nAucun RPO/RTO formalisé", accent=RED, size=18)
card(s, 8.9, 1.5, 3.8, 4.0, "Cybersécurité (C1–C8)", "Pas de SOC/SIEM\nPas de MFA (DSP2)\nPas de PRA/PCA\nPas d'EDR\nDocuments sensibles non classifiés, sans GED\nComptes à privilèges non gérés", accent=RED, size=18)
rect(s, 0.7, 5.8, 12.0, 0.9, fill=NAVY)
text(s, 0.9, 5.85, 11.6, 0.8, "3 axes : redondance · détection et continuité · protection des données sensibles", size=20, bold=True, color=GOLD, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER)

# ---------------------------------------------------------------- 8. Solutions
s = slide("Les solutions : trois piliers technologiques", "3 · Actions réalisées",
          "Pour limiter la fragmentation des éditeurs, nous retenons trois piliers : Cisco et Fortinet pour le réseau, VMware et Veeam pour la virtualisation et le PRA/PCA, "
          "Microsoft 365 E5 avec Entra ID pour l'identité, la bureautique et une large part de la sécurité. Microsoft Sentinel forme le SOC. "
          "Chaque lot, de A à J et les lots complémentaires, répond à des constats précis.")
card(s, 0.7, 1.5, 3.9, 2.5, "Réseau", "Cisco Catalyst 9000\nFortinet FortiGate en HA\nVLAN, DMZ, double lien FAI\n(Lots A, E)", size=18)
card(s, 4.8, 1.5, 3.9, 2.5, "Virtualisation & PRA/PCA", "VMware vSphere HA/DRS\nVeeam, règle 3-2-1-1\nRPO / RTO définis\n(Lots G, 1, 3)", size=18)
card(s, 8.9, 1.5, 3.8, 2.5, "Identité & sécurité", "Microsoft 365 E5, Entra ID\nMFA, Defender, Purview\nSentinel : SIEM / SOAR\n(Lots C, D, F)", size=18)
table(s, 0.7, 4.3, 12.0, [("Lot", 0.6), ("Objet", 3), ("Constats traités", 1.5)], [
    ["A", "Architecture réseau, DHCP/DNS", "R1 – R7"],
    ["C", "Microsoft 365 + Entra ID, MFA conditionnel", "S5, C2"],
    ["F", "Audit de sécurité + GED sécurisée + comptes à privilèges", "C2, C5, C6, C8"],
    ["G", "PRA / PCA", "S1, S2, S8, C3"]], size=15, hsize=15, rowh=0.46)

# ---------------------------------------------------------------- 9. Architecture et migration
s = slide("Architecture cible et plan de migration", "3 · Actions réalisées",
          "L'architecture cible repose sur trois principes : aucun point de défaillance unique, isolation stricte des flux bancaires par segmentation, "
          "et sécurité intégrée dès la conception. La migration suit sept étapes en coexistence progressive, ce qui a permis d'atteindre l'objectif central : "
          "aucune interruption des services bancaires pendant le projet.")
for i, (t1, t2) in enumerate([("1", "Aucun point de défaillance unique"), ("2", "Isolation stricte des flux bancaires (VLAN, DMZ, filtrage applicatif)"), ("3", "Security by design : identité, chiffrement, journalisation, détection")]):
    y = 1.5 + i * 0.95
    rect(s, 0.7, y, 0.7, 0.7, fill=GOLD, shape=MSO_SHAPE.OVAL)
    text(s, 0.7, y, 0.7, 0.7, t1, size=22, bold=True, color=WHITE, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    text(s, 1.6, y + 0.1, 11, 0.6, t2, size=18, color=INK, anchor=MSO_ANCHOR.MIDDLE)
text(s, 0.7, 4.5, 12, 0.4, "Migration en coexistence progressive — 7 étapes", size=18, bold=True, color=NAVY)
flow(s, 0.7, 5.05, 12.0, 1.0, ["1 Réseau", "2 Systèmes", "3 Identité", "4 Messagerie", "5 Sécurité", "6 KHS-Core", "7 Postes"], size=14)
text(s, 0.7, 6.25, 12, 0.5, "Résultat : aucune interruption des services bancaires pendant toute la durée du projet", size=16, bold=True, color=GREEN)

# ---------------------------------------------------------------- 9b. Maquette Packet Tracer
IMG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "docs", "10-packet-tracer", "maquette-packet-tracer.png")
s = slide("Maquette Cisco Packet Tracer : la preuve par la pratique", "3 · Actions réalisées",
          "Pour valider l'architecture réseau du Lot A, j'ai construit une maquette dans Cisco Packet Tracer : deux sites, Paris et Lyon, reliés par un FAI simulé. "
          "Paris : un routeur de bordure, un pare-feu ASA 5505, deux switchs de cœur multicouches en HSRP, un switch d'accès, un serveur, un poste bureautique, un poste bancaire, "
          "une borne Wi-Fi, un téléphone IP et un portable invité. Lyon : routeur, pare-feu, un cœur, un accès, deux postes et un serveur. "
          "Le plan d'adressage VLSM est identique à celui du dossier : c'est la cohérence entre la conception papier et la maquette. "
          "Les liaisons inter-sites passent par un tunnel GRE qui représente le VPN IPsec du dossier. "
          "Les équipements du dossier réel, Catalyst 9300 et FortiGate, n'existent pas dans Packet Tracer : j'ai pris les équivalents pédagogiques, sans changer la logique. "
          "Cette maquette est la preuve des compétences C07 et C08 : routage, VLAN, haute disponibilité du cœur.")
s.shapes.add_picture(IMG, Inches(0.5), Inches(1.4), width=Inches(7.6))
rect(s, 0.5, 1.4, 7.6, 4.26, line=LINE)
text(s, 0.5, 5.75, 7.6, 0.4, "Paris (siège) à gauche · Lyon à droite · FAI simulé au centre", size=12, color=GREY, italic=True, align=PP_ALIGN.CENTER)
bullets(s, 8.4, 1.4, 4.5, 5.2, [("20 équipements", "2 sites, Cisco"), ("6 VLAN", "bureautique, bancaire, serveurs, invités, VOIP, management"), ("Plan VLSM", "identique au dossier"), ("HSRP", "2 cœurs L3 à Paris, passerelle virtuelle"), ("ASA 5505 + NAT + ACL", "invités isolés du LAN"), ("Tunnel GRE", "inter-site, équivalent du VPN du dossier")], size=16, gap=9)
rect(s, 0.5, 6.25, 12.3, 0.65, fill=NAVY)
text(s, 0.7, 6.28, 11.9, 0.6, "Compétences C07 · C08 : routage, VLAN, routage inter-VLAN, redondance du cœur", size=17, bold=True, color=GOLD, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER)

# ---------------------------------------------------------------- 9c. Tests de la maquette
s = slide("Maquette : tests de résilience et de sécurité", "3 · Actions réalisées",
          "Le plan de test de la maquette comporte treize tests. Voici les plus parlants. "
          "Le test de bascule HSRP : je lance un ping continu, j'éteins le cœur actif, quelques paquets sont perdus puis le second cœur reprend : c'est la suppression du point de défaillance unique R1. "
          "Le second test : le trafic vers Internet continue grâce au raccordement indépendant du second cœur au pare-feu. "
          "Côté sécurité : le VLAN invités est isolé du réseau interne mais garde l'accès à Internet, le NAT n'est pas appliqué au trafic inter-site, et le pare-feu bloque les connexions entrantes depuis l'extérieur. "
          "Je précise les simplifications assumées : un seul pare-feu par site, pas de cluster ; un seul FAI simulé par site ; GRE à la place d'IPsec ; échelle réduite à un poste par VLAN. "
          "La redondance complète est décrite dans le Lot A. [À dérouler en direct si le temps le permet, ou montrer les captures.]")
table(s, 0.7, 1.45, 12.0, [("Test", 1.0), ("Action", 3.2), ("Résultat attendu", 3.2)], [
    ["PT11", "Éteindre le cœur actif pendant un ping continu", "Quelques paquets perdus, le second cœur prend le relais (HSRP)"],
    ["PT12", "Cœur 1 éteint : ping vers Internet", "Le trafic passe par le cœur 2, relié au pare-feu"],
    ["PT04", "Ping du VLAN invités vers le LAN interne", "Échec : bloqué par l'ACL des invités"],
    ["PT05", "Ping du VLAN invités vers Internet", "Réponse : l'ACL ne bloque que le LAN"],
    ["PT07", "Ping Paris → Lyon", "Réponse via le tunnel GRE, sans NAT"],
    ["PT10", "Ping depuis Internet vers l'adresse du pare-feu", "Échec : aucune règle n'autorise l'entrant"]], size=14, hsize=14, rowh=0.6)
rect(s, 0.7, 5.75, 12.0, 1.15, fill=GOLDL)
text(s, 0.9, 5.8, 11.6, 1.1, ["Simplifications assumées : un pare-feu par site (pas de cluster HA) · un FAI simulé par site · GRE à la place d'IPsec ·",
                              "un poste par VLAN · équivalents Packet Tracer des Catalyst 9300 et FortiGate (absents du catalogue)"], size=14, color=INK, anchor=MSO_ANCHOR.MIDDLE, spacing=3)

# ---------------------------------------------------------------- 10. Focus GED
s = slide("Focus : la GED sécurisée (Lot F)", "4 · Focus GED",
          "Le constat C5 : les documents sensibles, dossiers de crédit, pièces KYC, rapports de conformité, sont sur un serveur de fichiers sans classification ni traçabilité. "
          "La réponse du Lot F est une GED sécurisée réalisée par MOM-TECH avec des outils libres. Ce n'est pas un simple espace de stockage : les agents y créent leurs documents "
          "directement, dans des ateliers Word, Excel et PowerPoint intégrés, avec des modèles bilingues et un export au format natif ou en PDF. "
          "Chaque document naît classé, référencé et tracé. Les règles de sécurité sont appliquées par la base de données. "
          "Le socle Microsoft 365 reste en place pour les postes, la messagerie et l'identité, et apporte le DLP de Purview sur les flux sortants et Entra PIM pour les comptes à privilèges.")
table(s, 0.7, 1.45, 12.0, [("Exigence du Lot F", 2.6), ("Constat", 0.8), ("Mécanisme de la GED", 3.4)], [
    ["Création de documents sans poste ni partage de fichiers", "C5", "Ateliers Word, Excel, PowerPoint ; export .docx .xlsx .pptx et PDF"],
    ["Classification (public interne / restreint / confidentiel)", "C5", "Appliquée par la base de données (RLS)"],
    ["Accès par rôle (rédacteur, validateur, admin, auditeur)", "C5, C8", "Règles RLS par rôle et par département"],
    ["Authentification forte", "C2", "Double authentification TOTP obligatoire"],
    ["Workflow dépôt → vérification → validation → publication", "C5", "Fonction transactionnelle côté base"],
    ["Journal d'audit immuable", "C5", "Déclencheur PostgreSQL : aucune modification possible"],
    ["Archivage réglementé", "C17", "Scellé SHA-256, lecture seule définitive"]], size=14, hsize=14, rowh=0.58)
text(s, 0.7, 6.15, 12, 0.8, ["GED : Next.js + PostgreSQL, réalisée par MOM-TECH", "Compléments Microsoft 365 E5 : Purview DLP (flux sortants) · Entra PIM (comptes à privilèges)"], size=14, bold=True, color=GOLD, align=PP_ALIGN.CENTER, spacing=2)

# ---------------------------------------------------------------- 11. Architecture démonstrateur
s = slide("Principe : la sécurité est dans la base de données", "4 · Focus GED",
          "Le principe central est que la sécurité n'est pas dans le code de l'application mais dans PostgreSQL. "
          "Chaque requête, venant de l'interface ou d'un accès direct à l'API, est filtrée par la base selon l'identité, le rôle, le département et l'organisation. "
          "Même si l'application avait un défaut, la base refuserait l'accès.")
rect(s, 0.7, 1.6, 3.2, 2.4, fill=GOLDL, line=LINE)
text(s, 0.8, 1.7, 3.0, 0.4, "Navigateur", size=18, bold=True, color=NAVY, align=PP_ALIGN.CENTER)
text(s, 0.8, 2.2, 3.0, 1.7, ["Agent connecté", "ou tiers sans compte", "(page /verifier)"], size=16, color=GREY, align=PP_ALIGN.CENTER)
rect(s, 5.0, 1.6, 3.3, 2.4, fill=NAVY2)
text(s, 5.1, 1.7, 3.1, 0.4, "Application Next.js", size=16, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
text(s, 5.1, 2.2, 3.1, 1.7, ["Aucune règle d'autorisation", "dans le code", "En-têtes HTTP de sécurité"], size=16, color=GOLDL, align=PP_ALIGN.CENTER)
rect(s, 9.4, 1.6, 3.3, 2.4, fill=NAVY)
text(s, 9.5, 1.7, 3.1, 0.4, "Supabase", size=18, bold=True, color=GOLD, align=PP_ALIGN.CENTER)
text(s, 9.5, 2.2, 3.1, 1.7, ["Auth (TOTP)", "PostgreSQL : RLS, fonctions, audit", "Storage : URL signées 5 min"], size=15, color=WHITE, align=PP_ALIGN.CENTER)
for x in (3.95, 8.35):
    a = rect(s, x, 2.6, 1.0, 0.5, fill=GOLD, shape=MSO_SHAPE.RIGHT_ARROW)
text(s, 3.7, 3.15, 1.5, 0.3, "HTTPS", size=11, color=GREY, align=PP_ALIGN.CENTER)
text(s, 8.1, 3.15, 1.5, 0.3, "jeton aal2", size=11, color=GREY, align=PP_ALIGN.CENTER)
card(s, 0.7, 4.4, 3.9, 2.3, "RLS : qui voit quoi", "Rôle + département + classification + organisation, évalués par PostgreSQL à chaque requête", size=17)
card(s, 4.75, 4.4, 3.9, 2.3, "MFA imposée par la base", "Sans code TOTP (niveau aal2), aucune table n'est lisible, même par appel direct à l'API", size=17)
card(s, 8.8, 4.4, 3.9, 2.3, "Audit immuable", "Un déclencheur refuse tout UPDATE ou DELETE, même avec la clé de service", size=17)

# ---------------------------------------------------------------- 11b. Preuve : accès refusé
CAPTURE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "docs", "05-solutions", "capture-acces-refuse-redacteur.png")
s = slide("Preuve en situation : un rédacteur refusé", "4 · Focus GED",
          "Voici une capture réalisée sur le site déployé. Je suis connecté avec un compte Rédacteur, Joël MESSI, du département Conformité. "
          "Je force l'adresse de la page d'administration des utilisateurs. L'accès est refusé. "
          "Trois niveaux de contrôle : l'interface ne propose pas l'entrée d'administration dans le menu ; la page affiche un message d'accès réservé à l'administrateur ; "
          "et surtout la base de données vérifie le rôle de l'appelant dans la fonction de changement de rôle, ce qui protège même si l'interface était contournée. "
          "C'est le principe du moindre privilège : tout nouveau compte est Lecteur, et seul un administrateur change un rôle.")
s.shapes.add_picture(CAPTURE, Inches(0.5), Inches(1.4), width=Inches(7.6))
rect(s, 0.5, 1.4, 7.6, 4.14, line=LINE)
text(s, 0.5, 5.6, 7.6, 0.4, "Site déployé · compte Rédacteur · adresse /admin/utilisateurs", size=12, color=GREY, italic=True, align=PP_ALIGN.CENTER)
for i, (t1, t2) in enumerate([("1", "Interface : aucune entrée d'administration dans le menu"), ("2", "Page : accès réservé au rôle Administrateur"), ("3", "Base de données : la fonction changer_role_utilisateur vérifie le rôle et refuse")]):
    y = 1.4 + i * 1.35
    rect(s, 8.4, y, 0.6, 0.6, fill=GOLD, shape=MSO_SHAPE.OVAL)
    text(s, 8.4, y, 0.6, 0.6, t1, size=20, bold=True, color=WHITE, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    text(s, 9.15, y - 0.05, 3.7, 1.2, t2, size=16, color=INK)
rect(s, 0.5, 6.25, 12.3, 0.65, fill=NAVY)
text(s, 0.7, 6.28, 11.9, 0.6, "Moindre privilège : tout nouveau compte est Lecteur · seul un administrateur change un rôle", size=17, bold=True, color=GOLD, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER)

# ---------------------------------------------------------------- 12. Démo
s = slide("Démonstration en direct : le parcours d'un document", "4 · Focus GED",
          "Voici le scénario de démonstration. Cinq personnages : une rédactrice, un validateur, un directeur général, un agent du courrier et une auditrice. "
          "Je montre qu'un document confidentiel suit son circuit, qu'il est signé et vérifiable publiquement, qu'il est archivé en lecture seule, "
          "qu'un courrier arrivé est tracé, et que chaque action est inscrite dans un journal que personne ne peut effacer.")
flow(s, 0.7, 1.5, 12.0, 1.0, ["1 Dépôt\n(rédactrice)", "2 Validation et\npublication", "3 Signature DG\n+ QR code", "4 Archivage\nscellé", "5 Courrier", "6 Journal\nd'audit"], size=14,
     couleurs=[NAVY, NAVY2, NAVY, NAVY2, NAVY, GOLD])
card(s, 0.7, 2.9, 3.9, 3.7, "Ce qu'on prouve", "Un lecteur ne voit pas un document confidentiel d'un autre département\nSans code TOTP, aucune donnée\nL'archivé ne peut plus être modifié", size=18)
card(s, 4.75, 2.9, 3.9, 3.7, "Authenticité", "Le PDF signé porte un QR code\nPage publique /verifier : le fichier est reconnu ou refusé\nLe contenu n'est pas divulgué", size=18)
card(s, 8.8, 2.9, 3.9, 3.7, "Traçabilité", "Courrier arrivé numéroté, scanné, remis\nDécharge de réception au départ\nJournal consultable par l'auditeur, non modifiable", size=18)

# ---------------------------------------------------------------- 13. Courrier & multi-org
s = slide("Courrier physique et multi-organisation", "4 · Focus GED",
          "La GED est étendue au courrier physique, très présent dans une banque : mises en demeure, courriers de l'autorité de supervision. "
          "Les courriers arrivés sont enregistrés sans ouvrir le pli, numérisés, remis avec accusé. Au départ, l'accusé se prouve par une décharge. "
          "Aucune destruction n'est automatique. Par ailleurs, la même plateforme sert deux organisations, KHS Bank et l'Agence de Promotion des Investissements du Cameroun, "
          "cloisonnées par la base de données elle-même.")
card(s, 0.7, 1.5, 3.9, 4.0, "Courrier arrivée", "Enregistrement sans ouvrir le pli\nNuméro ARR-2026-000123\nRécépissé PDF, numérisation, remise avec accusé\nPlis personnels jamais décrits ni scannés", size=18)
card(s, 4.75, 1.5, 3.9, 4.0, "Courrier départ", "Demande d'expédition depuis un document validé\nNuméro DEP-…, bordereau, relances\nAccusé prouvé par une décharge\nConservation : aucune destruction automatique", size=18)
card(s, 8.8, 1.5, 3.9, 4.0, "Multi-organisation", "Un code, plusieurs organisations\nColonne organisation posée par la base\nBranding par variables d'environnement\nKHS Bank · Agence API", size=18)
text(s, 0.7, 5.9, 12, 0.5, "Validation : 33 migrations rejouées sans erreur · 169 + 15 tests SQL du courrier · parcours automatisé de 42 contrôles", size=14, bold=True, color=GOLD, align=PP_ALIGN.CENTER)

# ---------------------------------------------------------------- 14. Bilan financier
s = slide("Bilan financier", "5 · Synthèse",
          "L'investissement initial est d'environ 4,8 millions d'euros, marge pour aléas de 10 % comprise. Le coût récurrent est d'environ 1,5 million d'euros par an, "
          "soit environ 11 % du budget annuel de 14 millions d'euros, ce qui laisse de la marge pour les autres dépenses informatiques. "
          "Les gains viennent de la mutualisation des éditeurs autour d'un socle Microsoft unique et de la fin des coûts cachés relevés à l'audit.")
kpi(s, 0.7, 1.5, 3.8, "≈ 4,8 M€", "investissement initial (CAPEX)\nmarge de 10 % pour aléas incluse")
kpi(s, 4.8, 1.5, 3.8, "≈ 1,5 M€/an", "fonctionnement récurrent (OPEX)")
kpi(s, 8.9, 1.5, 3.8, "≈ 11 %", "du budget annuel de 14 M€")
table(s, 0.7, 3.3, 12.0, [("Poste", 3), ("Coût", 1)], [
    ["Virtualisation et stockage (4 hôtes ESXi, 2 baies SAN, Veeam)", "900 000 €"],
    ["Réseau (Cisco Catalyst, FortiGate HA, câblage)", "780 000 €"],
    ["Postes clients (920) et infrastructure VDI", "650 000 €"],
    ["Licences Microsoft 365 E5 — 1ʳᵉ année", "629 280 €"],
    ["Prestations d'ingénierie MOM-TECH (4 ingénieurs × 6 mois)", "480 000 €"]], size=15, hsize=15, rowh=0.5)
text(s, 0.7, 6.55, 12, 0.4, "Astreinte SOC 24/7 : 420 000 € par an, premier poste de fonctionnement après les licences", size=13, color=GREY, italic=True)

# ---------------------------------------------------------------- 15. Recette
s = slide("Recette : conformité vérifiée lot par lot", "5 · Synthèse",
          "La recette repose sur un cahier de tests : bascule du cœur de réseau, du VPN, du cluster VMware, restauration Veeam, bascule Always On, "
          "connexion sans second facteur refusée, détection EDR, alerte Sentinel, blocage DLP, isolement du VLAN invités. Tous les tests de l'extrait sont conformes. "
          "Un procès-verbal de recette est signé par le client.")
table(s, 0.7, 1.5, 12.0, [("Test", 4), ("Résultat attendu", 3.2), ("Statut", 1)], [
    ["Bascule automatique du cœur de réseau", "Aucune coupure perceptible", "✔ Conforme"],
    ["Bascule du lien VPN principal vers le secours", "Reprise < 30 s", "✔ Conforme"],
    ["Arrêt d'un hôte du cluster VMware", "RTO ≤ 30 min", "✔ Conforme"],
    ["Bascule Always On de KHS-Core", "RTO ≤ 1 h · RPO ≤ 15 min", "✔ Conforme"],
    ["Connexion sans second facteur", "Accès refusé (MFA obligatoire)", "✔ Conforme"],
    ["Injection d'un événement d'authentification suspecte", "Alerte Sentinel en moins de 5 min", "✔ Conforme"],
    ["Envoi externe d'un document confidentiel", "Blocage par la politique DLP", "✔ Conforme"]], size=15, hsize=15, rowh=0.55)
text(s, 0.7, 5.95, 12, 0.8, "12 tests en extrait, tous conformes · procès-verbal de recette signé · aucune interruption des services bancaires", size=16, bold=True, color=GREEN, align=PP_ALIGN.CENTER)

# ---------------------------------------------------------------- 16. Conclusion
s = slide("Conclusion et perspectives", "5 · Synthèse",
          "En synthèse : le projet a répondu aux 14 constats critiques, sans interruption de service, dans le budget. "
          "La GED montre que les principes de sécurité du Lot F sont appliqués par la base de données elle-même, et que les agents peuvent créer leurs documents directement dans l'outil. "
          "Perspectives : étendre la détection par IA du SOC à la lutte anti-fraude, évaluer un cloud souverain, "
          "et pour la GED, l'authentification unique avec Entra ID, un DLP sur les flux sortants et un hébergement maîtrisé. "
          "Merci de votre attention, je suis à votre disposition pour vos questions.")
table(s, 0.7, 1.5, 7.2, [("Objectif", 1.4), ("Résultat", 3.2)], [
    ["Fiabiliser", "Plus aucun point de défaillance unique"],
    ["Sécuriser", "MFA, SOC, GED sécurisée, conformité démontrée"],
    ["Moderniser", "Microsoft 365, Windows 11, VOIP unifié"],
    ["Maîtriser les coûts", "≈ 11 % du budget annuel"],
    ["Accompagner", "Formation exécutée, référents désignés"]], size=15, hsize=15, rowh=0.62)
text(s, 8.3, 1.5, 4.5, 0.4, "Perspectives", size=20, bold=True, color=NAVY)
bullets(s, 8.3, 2.1, 4.5, 4.4, ["IA du SOC étendue à la lutte anti-fraude", "Évaluation d'un cloud souverain", "GED : authentification unique (Entra ID), DLP, hébergement maîtrisé", "Veille technologique continue (contrat de maintenance)"], size=15, gap=10)
rect(s, 0.7, 5.6, 7.2, 1.1, fill=NAVY)
text(s, 0.9, 5.65, 6.8, 1.0, "14 constats critiques traités · 0 interruption de service", size=20, bold=True, color=GOLD, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.CENTER)

# ---------------------------------------------------------------- 17. Merci
s = prs.slides.add_slide(BLANK); N["n"] += 1
rect(s, 0, 0, 13.333, 7.5, fill=NAVY)
rect(s, 5.8, 3.9, 1.6, 0.06, fill=GOLD)
text(s, 0.8, 2.3, 11.7, 1.2, "Merci de votre attention", size=44, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
text(s, 0.8, 4.2, 11.7, 0.6, "Questions du jury", size=24, color=GOLDL, align=PP_ALIGN.CENTER)
s.notes_slide.notes_text_frame.text = "Merci de votre attention. Je suis à votre disposition pour vos questions."

out = sys.argv[1]
prs.save(out)
print("OK", N["n"], "diapositives ->", out)
