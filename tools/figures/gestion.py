"""Organigrammes, PBS, WBS, OBS et matrice des risques."""
import os
import re

from commun import C, CSS_ARBRE, arbre, e, page, ICI

DOCS = os.path.join(os.path.dirname(os.path.dirname(ICI)), "docs")


def N(titre, *sous, classe="", enfants=None, pile=False):
    return dict(titre=titre, sous=list(sous), classe=classe, enfants=enfants or [], pile=pile)


# ---------------------------------------------------------------- organigrammes
def organigramme_khs():
    r = N("Direction Générale", classe="n0", enfants=[
        N("Direction des Systèmes d'Information", "DSI — maîtrise d'ouvrage", classe="n1", pile=True, enfants=[
            N("Responsable", "Infrastructure & Réseau"),
            N("Responsable", "Support utilisateurs"),
            N("Responsable", "Sécurité SI (interne)"),
            N("Chef de projet interne", "référent de MOM-TECH"),
        ]),
        N("Direction des Risques", "& Contrôle interne", classe="n1"),
        N("Direction Commerciale", classe="n1"),
        N("Direction Conformité", "& Sécurité (RSSI)", classe="n1"),
    ])
    page("organigramme-khs", arbre(r), CSS_ARBRE)


def organigramme_momtech():
    r = N("Chef de projet", "Ingénieur Architecture Système", classe="n0", enfants=[
        N("Sous-équipe Architecture Système", classe="n1", enfants=[
            N("Ingénieur Systèmes", "& Déploiement"),
            N("Chef de projet", "serveurs, virtualisation, PRA/PCA", classe="ngris"),
        ]),
        N("Sous-équipe Réseau & Sécurité", classe="n1", enfants=[
            N("Ingénieur Réseaux", "& Sécurité"),
            N("Ingénieur Cybersécurité", "/ SOC"),
        ]),
    ])
    page("organigramme-momtech", arbre(r), CSS_ARBRE)


def obs():
    r = N("Comité de pilotage (COPIL)", "Projet Migration & Sécurisation SI", classe="n0", enfants=[
        N("KHS Bank — maîtrise d'ouvrage", classe="nor", enfants=[
            N("Direction des Systèmes d'Information", "sponsor du projet", enfants=[
                N("Responsable", "Infrastructure & Réseau")]),
            N("Direction Conformité & Sécurité", "RSSI", enfants=[
                N("Référent", "RGPD / conformité")]),
        ]),
        N("MOM-TECH — maîtrise d'œuvre", classe="n1", enfants=[
            N("Chef de projet", "Ingénieur Architecture Système", enfants=[
                N("Sous-équipe", "Architecture Système", enfants=[N("Ingénieur Systèmes", "& Déploiement")]),
                N("Sous-équipe", "Réseau & Sécurité", enfants=[N("Ingénieur Réseaux", "& Sécurité"), N("Ingénieur", "Cybersécurité / SOC")]),
            ]),
        ]),
    ])
    page("obs", arbre(r), CSS_ARBRE)


# ---------------------------------------------------------------- PBS / WBS (branches en colonnes)
CSS_PILE = CSS_ARBRE + f"""
.arbre li.col {{ padding-left: 5px; padding-right: 5px; }}
.pile {{ margin: 10px auto 0 22px; text-align: left; position: relative; }}
.pile::before {{ content: ''; position: absolute; left: -12px; top: -10px; bottom: 0; border-left: 1.4px solid {C['gris']}; }}
.item:last-child::after {{ content: ''; position: absolute; left: -14px; top: calc(50% + 1px); bottom: -2px; width: 5px; background: #fff; }}
.item {{ position: relative; border: 1.2px solid {C['gris_clair']}; background: #fff; border-radius: 3px;
  padding: 5px 8px; margin-top: 7px; font-size: 13.2px; line-height: 1.22; width: 168px; }}
.item::before {{ content: ''; position: absolute; left: -12px; top: 50%; width: 12px; border-top: 1.4px solid {C['gris']}; }}
.item .num {{ color: {C['bleu']}; font-weight: 700; margin-right: 4px; }}
.col > .noeud {{ width: 184px; min-height: 58px; display: inline-flex; flex-direction: column; justify-content: center; }}
"""


def branches(racine, colonnes, numeroter):
    li = []
    for i, (titre, elements) in enumerate(colonnes, 1):
        items = "".join(
            f'<div class="item">{f"<span class=num>{i}.{k}</span>" if numeroter else ""}{e(x)}</div>'
            for k, x in enumerate(elements, 1))
        tete = f"<b>{i}. {e(titre)}</b>" if numeroter else f"<b>{e(titre)}</b>"
        li.append(f'<li class="col"><div class="noeud n1">{tete}</div><div class="pile">{items}</div></li>')
    return (f'<div class="arbre"><ul><li><div class="noeud n0"><b>{e(racine)}</b></div>'
            f'<ul>{"".join(li)}</ul></li></ul></div>')


WBS = [
    ("Pilotage", ["Cadrage du projet", "Rédaction du cahier des charges (étude) et évaluation du besoin",
                  "PBS / WBS / OBS / RACI / Gantt", "Gestion des risques", "Suivi de projet (COPIL)"]),
    ("Audit", ["Audit réseau (architecture, équipements, liens VPN)", "Audit systèmes (serveurs, stockage, services, postes)",
               "Audit cybersécurité (organisationnel, physique, technique)", "Rapport d'audit consolidé"]),
    ("Conception", ["Étude technique et architecture cible réseau", "Étude technique et architecture cible systèmes/virtualisation",
                    "Conception du dispositif cybersécurité (SOC/SIEM, IAM, GED)", "Validation de l'architecture (COPIL)"]),
    ("Planification", ["Consultation fournisseurs / appels d'offres matériel", "Choix des prestataires (FAI de secours, éditeurs)",
                       "Plan de migration (pré-migration / migration / post-migration)", "Commandes et livraison du matériel"]),
    ("Déploiement", ["Réseau : câblage, équipements, VPN, segmentation",
                     "Systèmes : virtualisation, stockage, sauvegarde, AD/DNS/DHCP, messagerie, postes clients",
                     "Cybersécurité : SOC/SIEM, EDR, IAM/MFA, PRA/PCA, GED sécurisée", "Migration de l'application métier KHS-Core"]),
    ("Tests, Recette et Finalisation", ["Tests de déploiement (par lot)", "Cahier de tests et recette", "Validation client (PV de recette)",
                                        "Formation des utilisateurs et des équipes techniques", "Documentation d'installation et d'exploitation",
                                        "Contrat de maintenance", "Bilan financier et facturation"]),
]


def wbs():
    page("wbs", branches("Projet Migration & Sécurisation du SI de KHS Bank", WBS, True), CSS_PILE)


def pbs():
    t = open(os.path.join(DOCS, "03-gestion-de-projet", "pbs.md"), encoding="utf-8").read()
    cols = []
    for l in t.split("## Détail des livrables", 1)[1].splitlines():
        c = [x.strip() for x in l.strip().strip("|").split("|")]
        if len(c) == 2 and c[0] not in ("Branche", "---") and not c[0].startswith("-"):
            cols.append((c[0], [x.strip()[0].upper() + x.strip()[1:] for x in c[1].split(",")]))
    page("pbs", branches("Projet Migration & Sécurisation du SI de KHS Bank", cols, False), CSS_PILE)


# ---------------------------------------------------------------- matrice des risques
def matrice_risques():
    t = open(os.path.join(DOCS, "03-gestion-de-projet", "gestion-des-risques.md"), encoding="utf-8").read()
    risques = []
    for l in t.splitlines():
        c = [x.strip() for x in l.strip().strip("|").split("|")]
        if len(c) >= 9 and re.match(r"P\d+$", c[0]):
            risques.append(dict(code=c[0], nom=c[1], i=int(c[3]), p=int(c[4]), crit=int(c[5]), res=int(c[8])))

    def teinte(v):
        if v >= 15:
            return C["rouge"], "#fff"
        if v >= 10:
            return "#E46C0A", "#fff"
        if v >= 5:
            return "#F2C744", C["texte"]
        return "#A9D18E", C["texte"]

    T = 92
    s = ['<div class="mat">']
    s.append('<div class="axe-y">Probabilité</div><div class="grille">')
    for p in range(5, 0, -1):
        s.append(f'<div class="lab-y">{p}</div>')
        for i in range(1, 6):
            fond, txt = teinte(i * p)
            codes = " ".join(r["code"] for r in risques if r["i"] == i and r["p"] == p)
            s.append(f'<div class="case" style="background:{fond};color:{txt}"><span class="v">{i * p}</span><span class="c">{e(codes)}</span></div>')
    s.append('<div></div>' + "".join(f'<div class="lab-x">{i}</div>' for i in range(1, 6)))
    s.append('</div><div class="axe-x">Impact</div></div>')
    leg = [(C["rouge"], "Critique (≥ 15)"), ("#E46C0A", "Élevée (10 à 14)"), ("#F2C744", "Modérée (5 à 9)"), ("#A9D18E", "Faible (≤ 4)")]
    s.append('<div class="leg">' + "".join(f'<span><i style="background:{c}"></i>{e(x)}</span>' for c, x in leg) + "</div>")
    css = f"""
.mat {{ display: grid; grid-template-columns: 26px auto; grid-template-rows: auto auto; align-items: center; }}
.axe-y {{ writing-mode: vertical-rl; transform: rotate(180deg); font-weight: 700; color: {C['marine']}; font-size: 15px; text-align: center; }}
.grille {{ display: grid; grid-template-columns: 26px repeat(5, {T}px); grid-template-rows: repeat(5, {T * 0.72}px) 26px; gap: 3px; }}
.lab-y, .lab-x {{ display: flex; align-items: center; justify-content: center; font-weight: 700; color: {C['gris']}; font-size: 14px; }}
.case {{ position: relative; border-radius: 3px; display: flex; align-items: center; justify-content: center; }}
.case .v {{ position: absolute; top: 4px; right: 6px; font-size: 11px; opacity: .75; }}
.case .c {{ font-weight: 700; font-size: 15px; text-align: center; padding: 0 4px; }}
.axe-x {{ grid-column: 2; text-align: center; font-weight: 700; color: {C['marine']}; font-size: 15px; padding-left: 26px; margin-top: 2px; }}
.leg {{ margin-top: 10px; display: flex; gap: 16px; font-size: 13px; color: {C['gris']}; justify-content: center; padding-left: 26px; }}
.leg i {{ display: inline-block; width: 14px; height: 14px; border-radius: 2px; vertical-align: -2px; margin-right: 5px; }}
"""
    page("matrice-risques", "".join(s), css)


if __name__ == "__main__":
    organigramme_khs(); organigramme_momtech(); obs(); wbs(); pbs(); matrice_risques()
