"""Diagramme de Gantt détaillé, construit à partir du tableau des tâches de docs/03-gestion-de-projet/gantt.md."""
import datetime as dt
import os
import re

from commun import C, e, page, ICI

DOCS = os.path.join(os.path.dirname(os.path.dirname(ICI)), "docs")
D0 = dt.date(2026, 1, 5)          # lundi de la semaine 2
SEMAINES = 25                      # jusqu'au 28/06/2026
MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin"]


def date(s):
    j, m, a = map(int, s.split("/"))
    return dt.date(a, m, j)


def lire_taches():
    t = open(os.path.join(DOCS, "03-gestion-de-projet", "gantt.md"), encoding="utf-8").read()
    bloc = t.split("## Détail des tâches", 1)[1].split("## Gestion", 1)[0]
    taches = []
    for l in bloc.splitlines():
        c = [x.strip() for x in l.strip().strip("|").split("|")]
        if len(c) == 6 and re.match(r"\d+ j", c[2]):
            taches.append(dict(phase=c[0], nom=c[1], duree=int(c[2].split()[0]), debut=date(c[3]), fin=date(c[4]), res=c[5]))
    phases = []
    for l in t.split("## Détail", 1)[0].splitlines():
        c = [x.strip() for x in l.strip().strip("|").split("|")]
        if len(c) == 4 and re.match(r"\d\. ", c[0]):
            phases.append(dict(nom=c[0], duree=int(c[1].split()[0]), debut=date(c[2]), fin=date(c[3])))
    return phases, taches


def couleur(res):
    r = res.lower()
    if "équipe" in r or ("," in r and "chef" not in r):
        return C["gris"]
    if "chef" in r:
        return C["or"]
    if "réseau" in r:
        return C["bleu"]
    if "systèmes" in r:
        return C["sarcelle"]
    if "cyber" in r:
        return C["marine"]
    return C["gris"]


# Liens fin → début entre tâches (noms abrégés : début du libellé).
LIENS = [
    ("Cadrage", "Étude cahier"), ("Étude cahier", "PBS, WBS"),
    ("PBS, WBS", "Audit réseau"), ("PBS, WBS", "Audit systèmes"), ("PBS, WBS", "Audit cybersécurité"),
    ("Audit cybersécurité", "Rapport d'audit"),
    ("Rapport d'audit", "Architecture réseau"), ("Rapport d'audit", "Architecture systèmes"), ("Rapport d'audit", "Conception cybersécurité"),
    ("Conception cybersécurité", "Validation architecture"),
    ("Validation architecture", "Consultation"), ("Consultation", "Plan de migration"), ("Plan de migration", "Commande"),
    ("Commande", "Réseau ("), ("Commande", "Systèmes ("),
    ("Réseau (", "Cybersécurité ("), ("Cybersécurité (", "Migration de KHS"),
    ("Migration de KHS", "Tests de déploiement"), ("Tests de déploiement", "Cahier de tests"),
    ("Cahier de tests", "Validation client"), ("Validation client", "Formation"), ("Formation", "Documentation"),
]

JALONS = {  # phase -> (libellé, date, position : 'debut' ou 'fin')
    "1. Pilotage": [("Lancement du projet (réunion de démarrage)", dt.date(2026, 1, 5), "debut")],
    "3. Conception": [("Architecture cible validée en COPIL", dt.date(2026, 3, 6), "fin")],
    "6. Tests, Recette et Finalisation": [("PV de recette signé", dt.date(2026, 6, 18), "avant:Formation"),
                                           ("Clôture du projet", dt.date(2026, 6, 26), "fin")],
}


def generer():
    phases, taches = lire_taches()
    W_COLS = [("N°", 30, "c"), ("Nom de la tâche", 372, "g"), ("Durée", 50, "c"), ("Début", 74, "c"), ("Fin", 74, "c"), ("Ressources", 196, "g")]
    XG = sum(w for _, w, _ in W_COLS)
    SEM = 36
    LARG = XG + SEMAINES * SEM
    H_MOIS, H_SEM, H = 24, 22, 24
    HAUT = H_MOIS + H_SEM

    def xd(d):
        return XG + (d - D0).days * SEM / 7

    # Lignes : phase (récapitulative), tâches, jalons
    lignes = []
    for ph in phases:
        cle = ph["nom"].split(". ", 1)[1].split(",")[0].split(" ")[0]
        lignes.append(dict(type="phase", **ph))
        js = JALONS.get(ph["nom"], [])
        for j in [j for j in js if j[2] == "debut"]:
            lignes.append(dict(type="jalon", nom=j[0], debut=j[1], fin=j[1], duree=0, res=""))
        for t in taches:
            if ph["nom"].split(". ", 1)[1].startswith(t["phase"].split("/")[0]):
                for j in [j for j in js if j[2] == "avant:" + t["nom"].split(" ")[0]]:
                    lignes.append(dict(type="jalon", nom=j[0], debut=j[1], fin=j[1], duree=0, res=""))
                lignes.append(dict(type="tache", **t))
        for j in [j for j in js if j[2] == "fin"]:
            lignes.append(dict(type="jalon", nom=j[0], debut=j[1], fin=j[1], duree=0, res=""))

    n = len(lignes)
    HT = HAUT + n * H
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{LARG + 1}" height="{HT + 1}" font-family="Carlito, Calibri, sans-serif">']
    s.append(f'<defs><marker id="fl" viewBox="0 0 8 8" refX="7.5" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="{C["gris"]}"/></marker></defs>')
    # fonds des lignes de phase
    for i, l in enumerate(lignes):
        y = HAUT + i * H
        if l["type"] == "phase":
            s.append(f'<rect x="0" y="{y}" width="{LARG}" height="{H}" fill="{C["bleu_pale"]}"/>')
    # en-tête
    s.append(f'<rect x="0" y="0" width="{LARG}" height="{HAUT}" fill="{C["marine"]}"/>')
    x = 0
    for nom, w, al in W_COLS:
        tx = x + w / 2 if al == "c" else x + 7
        anc = "middle" if al == "c" else "start"
        s.append(f'<text x="{tx}" y="{HAUT / 2 + 5}" fill="#fff" font-size="13.5" font-weight="700" text-anchor="{anc}">{e(nom)}</text>')
        x += w
        s.append(f'<line x1="{x}" y1="0" x2="{x}" y2="{HT}" stroke="{C["gris_clair"]}" stroke-width="1"/>')
    # mois
    for m in range(1, 7):
        d1 = dt.date(2026, m, 1)
        d2 = dt.date(2026, m + 1, 1) if m < 12 else dt.date(2027, 1, 1)
        a, b = max(xd(d1), XG), min(xd(d2), LARG)
        s.append(f'<text x="{(a + b) / 2}" y="{H_MOIS - 7}" fill="#fff" font-size="13.5" font-weight="700" text-anchor="middle">{MOIS[m - 1]} 2026</text>')
        if m > 1:
            s.append(f'<line x1="{a}" y1="0" x2="{a}" y2="{HT}" stroke="{C["gris"]}" stroke-width="1" opacity=".55"/>')
    s.append(f'<line x1="{XG}" y1="{H_MOIS}" x2="{LARG}" y2="{H_MOIS}" stroke="#ffffff55"/>')
    # semaines
    for k in range(SEMAINES):
        xs = XG + k * SEM
        num = (D0 + dt.timedelta(days=7 * k)).isocalendar()[1]
        s.append(f'<text x="{xs + SEM / 2}" y="{H_MOIS + 15.5}" fill="#E8EEF6" font-size="11" text-anchor="middle">S{num}</text>')
        if k:
            s.append(f'<line x1="{xs}" y1="{H_MOIS}" x2="{xs}" y2="{HT}" stroke="{C["gris_clair"]}" stroke-width=".7"/>')
    # lignes horizontales
    for i in range(n + 1):
        y = HAUT + i * H
        s.append(f'<line x1="0" y1="{y}" x2="{LARG}" y2="{y}" stroke="{C["gris_clair"]}" stroke-width=".7"/>')

    pos = {}
    for i, l in enumerate(lignes):
        y = HAUT + i * H
        ym = y + H / 2
        gras = l["type"] == "phase"
        coul_txt = C["marine"] if gras else C["texte"]
        fw = "700" if gras else "400"
        fs = 13.5 if gras else 13
        nom = l["nom"] if l["type"] != "phase" else l["nom"].split(". ", 1)[1]
        indent = 7 if gras else 20
        if l["type"] == "jalon":
            nom = "◆  " + nom
        cols = [str(i + 1), nom, f'{l["duree"]} j', l["debut"].strftime("%d/%m/%y"), l["fin"].strftime("%d/%m/%y"), l.get("res", "")]
        x = 0
        for (cn, w, al), v in zip(W_COLS, cols):
            if cn == "Nom de la tâche":
                tx, anc = x + indent, "start"
            elif al == "c":
                tx, anc = x + w / 2, "middle"
            else:
                tx, anc = x + 7, "start"
            fsz = 11.5 if cn == "Ressources" else fs
            s.append(f'<text x="{tx}" y="{ym + 4.5}" fill="{coul_txt if cn != "Ressources" else C["gris"]}" font-size="{fsz}" font-weight="{fw}" text-anchor="{anc}">{e(v)}</text>')
            x += w
        a = xd(l["debut"])
        b = xd(l["fin"] + dt.timedelta(days=1))
        if l["type"] == "phase":
            s.append(f'<rect x="{a}" y="{ym - 4}" width="{b - a}" height="7" fill="{C["texte"]}"/>')
            for xx in (a, b):
                s.append(f'<path d="M{xx - 4},{ym + 3} L{xx + 4},{ym + 3} L{xx},{ym + 9} z" fill="{C["texte"]}"/>')
        elif l["type"] == "tache":
            col = couleur(l["res"])
            s.append(f'<rect x="{a}" y="{ym - 7}" width="{b - a}" height="14" rx="2" fill="{col}"/>')
            pos[l["nom"]] = (a, b, ym)
        else:
            xm = xd(l["debut"] + dt.timedelta(days=1)) if l["type"] == "jalon" and "Lancement" not in l["nom"] else a
            s.append(f'<path d="M{xm},{ym - 8} L{xm + 8},{ym} L{xm},{ym + 8} L{xm - 8},{ym} z" fill="{C["texte"]}"/>')
            dx, anc = (-12, "end") if xm > LARG - 60 else (12, "start")
            s.append(f'<text x="{xm + dx}" y="{ym + 4.5}" font-size="12" fill="{C["texte"]}" text-anchor="{anc}">{l["debut"].strftime("%d/%m")}</text>')

    def trouve(prefixe):
        for k in pos:
            if k.startswith(prefixe):
                return pos[k]
        raise KeyError(prefixe)

    for p, q in LIENS:
        a1, b1, y1 = trouve(p)
        a2, b2, y2 = trouve(q)
        if a2 >= b1 + 9:
            d = f"M{b1},{y1} H{b1 + 5} V{y2} H{a2 - 1}"
        else:
            yv = y2 - 11 if y2 > y1 else y2 + 11
            d = f"M{b1},{y1} H{b1 + 5} V{yv} H{a2 - 7} V{y2} H{a2 - 1}"
        s.append(f'<path d="{d}" fill="none" stroke="{C["gris"]}" stroke-width="1" marker-end="url(#fl)"/>')
    s.append(f'<rect x=".5" y=".5" width="{LARG}" height="{HT}" fill="none" stroke="{C["gris"]}" stroke-width="1"/>')
    s.append("</svg>")

    legende = [(C["or"], "Chef de projet"), (C["bleu"], "Ing. Réseaux & Sécurité"), (C["sarcelle"], "Ing. Systèmes"),
               (C["marine"], "Ing. Cybersécurité / SOC"), (C["gris"], "Plusieurs ressources")]
    lg = "".join(f'<span class="lg"><i style="background:{c}"></i>{e(t)}</span>' for c, t in legende)
    lg += '<span class="lg"><i class="ph"></i>Phase (tâche récapitulative)</span><span class="lg"><b class="jal">◆</b>Jalon</span><span class="lg">→ Lien fin-début</span>'
    css = f""".lgd {{ margin-top: 10px; font-size: 13px; color: {C['gris']}; display: flex; flex-wrap: wrap; gap: 6px 18px; }}
.lg {{ display: inline-flex; align-items: center; gap: 6px; }} .lg i {{ display:inline-block; width: 22px; height: 11px; border-radius: 2px; }}
.lg i.ph {{ background: {C['texte']}; height: 6px; }} .jal {{ color: {C['texte']}; font-size: 14px; }}"""
    page("gantt", "".join(s) + f'<div class="lgd">{lg}</div>', css)


if __name__ == "__main__":
    generer()
