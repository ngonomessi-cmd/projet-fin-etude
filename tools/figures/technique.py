"""Schémas techniques : réseau existant, réseau cible, systèmes, maquette Packet Tracer."""
from commun import C, e, page

B, BF = C["bleu"], "#1B5E96"

# Pictogrammes (style des schémas réseau Cisco, simplifié), centrés sur (0, 0).
SYMBOLES = f"""
<symbol id="routeur" viewBox="-30 -24 60 48" overflow="visible">
  <ellipse cx="0" cy="8" rx="27" ry="10" fill="{BF}"/><rect x="-27" y="-8" width="54" height="16" fill="{B}"/>
  <ellipse cx="0" cy="-8" rx="27" ry="10" fill="#5B9BD5"/>
  <g stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round">
    <path d="M-15,-8 H-5 M5,-8 H15 M0,-15 V-12 M0,-4 V-1"/></g>
  <g fill="#fff"><path d="M-5,-11 L-1,-8 L-5,-5z M5,-11 L1,-8 L5,-5z M-3,-12 L0,-16 L3,-12z M-3,-4 L0,0 L3,-4z"/></g>
</symbol>
<symbol id="switch" viewBox="-34 -18 68 36" overflow="visible">
  <rect x="-32" y="-9" width="64" height="22" fill="{BF}"/><path d="M-32,-9 L-22,-17 H40 L32,-9z" fill="#5B9BD5"/><path d="M32,-9 L40,-17 V5 L32,13z" fill="#174F80"/>
  <g stroke="#fff" stroke-width="2" fill="none"><path d="M-22,-1 H10 M-10,6 H22"/></g>
  <g fill="#fff"><path d="M10,-4.5 L16,-1 L10,2.5z M-10,2.5 L-16,6 L-10,9.5z"/></g>
</symbol>
<symbol id="l3" viewBox="-26 -26 52 52" overflow="visible">
  <rect x="-22" y="-16" width="40" height="36" fill="{BF}"/><path d="M-22,-16 L-14,-24 H26 L18,-16z" fill="#5B9BD5"/><path d="M18,-16 L26,-24 V12 L18,20z" fill="#174F80"/>
  <g stroke="#fff" stroke-width="2.2" fill="none"><path d="M-14,2 H10 M-2,-9 V13"/></g>
  <g fill="#fff"><path d="M10,-1.5 L15,2 L10,5.5z M-14,-1.5 L-19,2 L-14,5.5z M-5.5,-9 L-2,-14 L1.5,-9z M-5.5,13 L-2,18 L1.5,13z"/></g>
</symbol>
<symbol id="parefeu" viewBox="-30 -22 60 44" overflow="visible">
  <rect x="-28" y="-18" width="56" height="36" rx="1" fill="{C['orange']}"/>
  <g stroke="#fff" stroke-width="1.6"><path d="M-28,-6 H28 M-28,6 H28 M-14,-18 V-6 M10,-18 V-6 M-2,-6 V6 M20,-6 V6 M-20,-6 V6 M-14,6 V18 M10,6 V18"/></g>
</symbol>
<symbol id="serveur" viewBox="-20 -28 40 56" overflow="visible">
  <rect x="-16" y="-24" width="30" height="48" rx="2" fill="#7F8C9A"/><path d="M14,-24 L19,-28 V20 L14,24z" fill="#5E6A77"/><path d="M-16,-24 L-11,-28 H19 L14,-24z" fill="#A9B4C0"/>
  <g stroke="#fff" stroke-width="1.6"><path d="M-11,-15 H9 M-11,-8 H9 M-11,-1 H9"/></g><circle cx="-6" cy="14" r="2.2" fill="#9FE09F"/>
</symbol>
<symbol id="stockage" viewBox="-26 -30 52 60" overflow="visible">
  <g fill="#7F8C9A" stroke="#fff" stroke-width="1.5">
  <path d="M-22,10 v10 a22,7 0 0 0 44,0 v-10"/><ellipse cx="0" cy="10" rx="22" ry="7"/>
  <path d="M-22,-4 v10 a22,7 0 0 0 44,0 v-10"/><ellipse cx="0" cy="-4" rx="22" ry="7"/>
  <path d="M-22,-18 v10 a22,7 0 0 0 44,0 v-10"/><ellipse cx="0" cy="-18" rx="22" ry="7" fill="#A9B4C0"/></g>
</symbol>
<symbol id="pc" viewBox="-24 -20 48 40" overflow="visible">
  <rect x="-20" y="-17" width="40" height="27" rx="2" fill="#5E6A77"/><rect x="-17" y="-14" width="34" height="21" fill="#DEEAF6"/>
  <path d="M-5,10 L-8,17 H8 L5,10z" fill="#5E6A77"/>
</symbol>
<symbol id="ap" viewBox="-22 -22 44 44" overflow="visible">
  <rect x="-16" y="4" width="32" height="12" rx="6" fill="#7F8C9A"/>
  <g fill="none" stroke="{B}" stroke-width="2.4" stroke-linecap="round"><path d="M-7,-2 a10,10 0 0 1 14,0 M-12,-8 a17,17 0 0 1 24,0 M-17,-14 a24,24 0 0 1 34,0"/></g>
</symbol>
<symbol id="telephone" viewBox="-22 -20 44 40" overflow="visible">
  <path d="M-18,-6 h36 v20 a3,3 0 0 1 -3,3 h-30 a3,3 0 0 1 -3,-3z" fill="#5E6A77"/><rect x="-20" y="-16" width="40" height="9" rx="4" fill="#7F8C9A"/>
  <g fill="#fff"><rect x="-10" y="-1" width="5" height="4"/><rect x="-2" y="-1" width="5" height="4"/><rect x="6" y="-1" width="5" height="4"/><rect x="-10" y="6" width="5" height="4"/><rect x="-2" y="6" width="5" height="4"/><rect x="6" y="6" width="5" height="4"/></g>
</symbol>
<symbol id="nuage" viewBox="-70 -36 140 72" overflow="visible">
  <path d="M-48,26 a22,22 0 0 1 -6,-43 a28,28 0 0 1 48,-14 a24,24 0 0 1 40,6 a20,20 0 0 1 22,30 a18,18 0 0 1 -12,21z" fill="#F2F2F2" stroke="#A6A6A6" stroke-width="1.6"/>
</symbol>
"""

CSS = """svg text { font-family: Carlito, Calibri, sans-serif; } svg text.h, svg text.i { paint-order: stroke; stroke: #ffffff; stroke-width: 4px; stroke-linejoin: round; }"""


class Dessin:
    def __init__(self, l, h):
        self.l, self.h, self.fond, self.av = l, h, [], []

    def zone(self, x, y, w, h, titre, couleur=C["bleu"], fond=C["bleu_pale"], tirets=False):
        da = ' stroke-dasharray="6 4"' if tirets else ""
        self.fond.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{fond}" stroke="{couleur}" stroke-width="1.3"{da}/>')
        if titre:
            self.fond.append(f'<text x="{x + 12}" y="{y + 20}" font-size="14.5" font-weight="700" fill="{couleur}">{e(titre)}</text>')

    def icone(self, sorte, x, y, nom="", sous="", taille=1.0, dy=None, couleur=None, cote="bas"):
        w = {"routeur": 60, "switch": 68, "l3": 52, "parefeu": 60, "serveur": 40, "stockage": 52, "pc": 48, "ap": 44, "telephone": 44, "nuage": 140}[sorte] * taille
        hh = {"routeur": 48, "switch": 36, "l3": 52, "parefeu": 44, "serveur": 56, "stockage": 60, "pc": 40, "ap": 44, "telephone": 40, "nuage": 72}[sorte] * taille
        self.av.append(f'<use href="#{sorte}" x="{x - w / 2}" y="{y - hh / 2}" width="{w}" height="{hh}"/>')
        lignes = sous.split("\n") if sous else []
        if cote == "bas":
            tx, ty, anc = x, (y + hh / 2 + 15 if dy is None else y + dy), "middle"
        elif cote == "haut":
            tx, ty, anc = x, y - hh / 2 - 8 - 14 * len(lignes), "middle"
        elif cote == "droite":
            tx, ty, anc = x + w / 2 + 9, y + 4 - 7 * len(lignes), "start"
        else:
            tx, ty, anc = x - w / 2 - 9, y + 4 - 7 * len(lignes), "end"
        if nom:
            self.av.append(f'<text x="{tx}" y="{ty}" font-size="13.5" font-weight="700" fill="{couleur or C["texte"]}" text-anchor="{anc}" class="h">{e(nom)}</text>')
        for k, l in enumerate(lignes):
            self.av.append(f'<text x="{tx}" y="{ty + 15 + k * 14}" font-size="12" fill="{C["gris"]}" text-anchor="{anc}" class="h">{e(l)}</text>')

    def lien(self, pts, style="plein", texte="", tx=None, ty=None, couleur=None, ancre="middle", epais=None):
        coul = couleur or C["gris"]
        w = epais or {"plein": 1.8, "trunk": 3.2, "vpn": 2.2, "repl": 2}.get(style, 1.8)
        da = {"vpn": ' stroke-dasharray="8 5"', "repl": ' stroke-dasharray="5 4"'}.get(style, "")
        d = "M" + " L".join(f"{a},{b}" for a, b in pts)
        self.fond.append(f'<path d="{d}" fill="none" stroke="{coul}" stroke-width="{w}"{da} stroke-linejoin="round"/>')
        if texte:
            if tx is None:
                tx = (pts[0][0] + pts[-1][0]) / 2
                ty = (pts[0][1] + pts[-1][1]) / 2
            for k, l in enumerate(texte.split("\n")):
                self.av.append(f'<text x="{tx}" y="{ty + k * 14}" font-size="12" fill="{coul}" text-anchor="{ancre}" font-style="italic" class="i">{e(l)}</text>')

    def texte(self, x, y, t, taille=12.5, couleur=None, gras=False, ancre="middle", italique=False, halo=True):
        for k, l in enumerate(t.split("\n")):
            fw = ' font-weight="700"' if gras else ""
            fi = ' font-style="italic"' if italique else ""
            cl = ' class="h"' if halo else ""
            self.av.append(f'<text x="{x}" y="{y + k * (taille + 2)}" font-size="{taille}" fill="{couleur or C["texte"]}" text-anchor="{ancre}"{fw}{fi}{cl}>{e(l)}</text>')

    def pastille(self, x, y, t, fond=C["rouge"]):
        w = 8 + 7.4 * len(t)
        self.av.append(f'<rect x="{x - w / 2}" y="{y - 10}" width="{w}" height="20" rx="10" fill="{fond}"/>')
        self.av.append(f'<text x="{x}" y="{y + 4.5}" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">{e(t)}</text>')

    def svg(self):
        return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.l}" height="{self.h}"><defs>{SYMBOLES}</defs>'
                + "".join(self.fond) + "".join(self.av) + "</svg>")


def legende(items):
    return ('<div style="display:flex;gap:20px;justify-content:center;font-size:13px;color:#595959;margin-top:6px">'
            + "".join(f'<span style="display:inline-flex;align-items:center;gap:6px">{sw}{e(t)}</span>' for sw, t in items) + "</div>")


def trait(couleur, style=""):
    return f'<svg width="34" height="10"><line x1="0" y1="5" x2="34" y2="5" stroke="{couleur}" stroke-width="2.4" {style}/></svg>'




# ---------------------------------------------------------------- réseau existant (audit)
def reseau_existant():
    d = Dessin(1100, 650)
    d.zone(20, 20, 740, 610, "Siège — Paris La Défense")
    d.zone(800, 340, 280, 290, "Site de Lyon", couleur=C["gris"], fond=C["gris_pale"])
    d.icone("nuage", 390, 80, "", taille=0.75)
    d.texte(390, 85, "Internet", 14.5, gras=True)
    d.texte(450, 80, "FAI unique,\nsans lien de secours", 12, C["gris"], ancre="start")
    d.lien([(390, 106), (390, 172)])
    d.icone("parefeu", 390, 192, "Pare-feu", "unique, absent à Lyon", cote="droite")
    d.lien([(390, 214), (390, 280)])
    d.icone("l3", 390, 305, "Commutateur cœur N3", "point de défaillance unique", cote="gauche")
    for x in (140, 390, 640):
        d.lien([(390, 331), (390, 375), (x, 375), (x, 420)])
        d.icone("switch", x, 434, "Distribution", cote="droite" if x != 640 else "gauche")
        d.lien([(x, 450), (x, 495), (x - 55, 495), (x - 55, 510)])
        d.lien([(x, 495), (x + 55, 495), (x + 55, 510)])
        d.icone("switch", x - 55, 522, "", taille=0.75)
        d.icone("switch", x + 55, 522, "", taille=0.75)
        d.texte(x, 562, "Accès : postes, Wi-Fi", 12, C["gris"])
    d.icone("switch", 940, 470, "Commutateur d'accès", "postes du back-office")
    d.lien([(417, 305), (940, 305), (940, 452)], "vpn", "VPN IPsec unique, non redondant", 600, 296, C["rouge"])
    d.pastille(335, 192, "R2")
    d.pastille(445, 275, "R1")
    d.pastille(330, 80, "R4")
    d.pastille(770, 296, "R3")
    d.pastille(390, 600, "R5 : aucune segmentation (pas de DMZ, VLAN non documentés)")
    leg = legende([(trait(C["gris"]), "Liaison"), (trait(C["rouge"], 'stroke-dasharray="8 5"'), "VPN inter-sites"),
                   ('<span style="background:#C00000;color:#fff;border-radius:9px;padding:0 7px;font-weight:700;font-size:12px">R1</span>', "Constat d'audit")])
    page("reseau-existant", d.svg() + leg, CSS)


# ---------------------------------------------------------------- réseau cible
def reseau_cible():
    d = Dessin(1260, 790)
    sites = ((20, "Siège — Paris La Défense", False), (660, "Site de Lyon", True))
    for (x0, site, lyon) in sites:
        d.zone(x0, 160, 580, 610, site)
        cx = x0 + 290
        d.icone("parefeu", cx - 55, 225, "", taille=0.9)
        d.icone("parefeu", cx + 55, 225, "", taille=0.9)
        d.lien([(cx - 28, 225), (cx + 28, 225)], "repl", couleur=C["orange"])
        d.texte(cx, 216, "HA", 11.5, C["orange"], gras=True)
        d.texte(cx - 95, 221, "Cluster FortiGate 200F", 13.5, gras=True, ancre="end")
        d.texte(cx - 95, 237, "haute disponibilité actif / passif", 12, C["gris"], ancre="end")
        if not lyon:
            d.lien([(cx + 72, 243), (cx + 72, 268), (cx + 200, 268), (cx + 200, 300)])
            d.icone("serveur", cx + 200, 328, "DMZ", "portail intranet / extranet", taille=0.85)
        d.lien([(cx - 55, 243), (cx - 55, 290), (cx - 34, 290), (cx - 34, 318)], "trunk")
        d.lien([(cx + 55, 243), (cx + 55, 290), (cx + 34, 290), (cx + 34, 318)], "trunk")
        d.icone("l3", cx - 34, 340, "", taille=0.9)
        d.icone("l3", cx + 34, 340, "", taille=0.9)
        d.lien([(cx - 10, 340), (cx + 10, 340)], "trunk", couleur=C["bleu"])
        d.texte(cx, 384, "Cœur N3 — stack Catalyst 9300 (StackWise)", 13.5, gras=True)
        d.lien([(cx, 392), (cx, 430)], "trunk")
        d.icone("switch", cx, 446, "", taille=0.95)
        d.texte(cx, 482, "Distribution — Catalyst 9200", 13.5, gras=True)
        acces = [("Postes", "VLAN 10 / 20", "pc"), ("Wi-Fi", "VLAN 40", "ap"), ("VOIP", "VLAN 50", "telephone")]
        for k, (nom, vl, ic) in enumerate(acces):
            ax = cx - 150 + k * 150
            d.lien([(cx, 492), (cx, 512), (ax, 512), (ax, 536)])
            d.icone("switch", ax, 550, "", taille=0.75)
            d.lien([(ax, 563), (ax, 596)])
            d.icone(ic, ax, 618, nom, vl, taille=0.9)
        d.lien([(cx - 60, 340), (x0 + 45, 340), (x0 + 45, 672)])
        d.icone("serveur", x0 + 45, 700, "", taille=0.7)
        d.texte(x0 + 72, 700, "VLAN 30 — serveurs : cluster VMware, stockage", 12.5, ancre="start")
        d.texte(x0 + 72, 722, "VLAN 99 — management : accès des administrateurs par le bastion PAM", 12.5, ancre="start")
    d.icone("nuage", 330, 58, "", taille=0.8)
    d.texte(330, 55, "FAI principal", 14, gras=True)
    d.texte(330, 71, "Orange Business", 12, C["gris"])
    d.icone("nuage", 930, 58, "", taille=0.8)
    d.texte(930, 55, "FAI de secours", 14, gras=True)
    d.texte(930, 71, "SFR Pro", 12, C["gris"])
    for (x0, _, _) in sites:
        cx = x0 + 290
        d.lien([(330, 87), (330, 112), (cx - 55, 112), (cx - 55, 205)], couleur="#8C8C8C", epais=1.4)
        d.lien([(930, 87), (930, 128), (cx + 55, 128), (cx + 55, 205)], couleur="#8C8C8C", epais=1.4)
    d.lien([(310 + 55 + 28, 225), (950 - 55 - 28, 225)], "vpn", "2 tunnels IPsec redondants", 630, 216, C["bleu"])
    leg = legende([(trait(C["gris"], 'stroke-width="4"'), "Trunk / agrégation"), (trait(C["gris"]), "Liaison"),
                   (trait(C["bleu"], 'stroke-dasharray="8 5"'), "VPN IPsec inter-sites"), (trait(C["orange"], 'stroke-dasharray="5 4"'), "Lien de haute disponibilité")])
    page("reseau-cible", d.svg() + leg, CSS)


# ---------------------------------------------------------------- systèmes cible
def systemes_cible():
    d = Dessin(1200, 690)
    d.zone(20, 20, 580, 650, "Siège — Paris (production)")
    d.zone(680, 20, 500, 650, "Site de Lyon (secours actif)", couleur=C["sarcelle"], fond="#EEF6F6")
    d.zone(40, 50, 540, 160, "Cluster VMware vSphere HA / DRS", couleur=C["bleu"], fond="#fff")
    d.icone("serveur", 110, 130, "Hôte ESXi 1")
    d.icone("serveur", 210, 130, "Hôte ESXi 2")
    d.texte(290, 112, "Machines virtuelles :\nAD, DNS/DHCP, fichiers,\nGLPI, PRTG, collecteur Sentinel", 12.5, C["gris"], ancre="start")
    d.zone(700, 50, 460, 160, "Cluster VMware vSphere HA", couleur=C["sarcelle"], fond="#fff")
    d.icone("serveur", 770, 130, "Hôte ESXi 1")
    d.texte(850, 112, "Machines virtuelles :\nAD (secours), DNS/DHCP,\nfichiers (répliqués)", 12.5, C["gris"], ancre="start")
    d.lien([(580, 130), (700, 130)], "repl", couleur=C["sarcelle"])
    d.texte(640, 150, "vMotion /\nréplication\nVeeam", 11.5, C["sarcelle"], italique=True)
    d.icone("stockage", 160, 320, "Baie SAN principale", "production")
    d.icone("stockage", 820, 320, "Baie SAN secondaire", "réplique asynchrone (15 min)")
    d.icone("serveur", 1060, 320, "Copie immuable", "cloud (règle 3-2-1-1)", taille=0.9)
    d.lien([(186, 320), (794, 320)], "repl", "réplication asynchrone des volumes", 470, 310, C["sarcelle"])
    d.lien([(846, 320), (1040, 320)], "repl", couleur=C["gris"])
    d.lien([(160, 210), (160, 290)])
    d.lien([(820, 210), (820, 290)])
    d.icone("serveur", 160, 470, "SQL Server 2022", "Always On — nœud Paris\nbase KHS-Core")
    d.icone("serveur", 820, 470, "SQL Server 2022", "Always On — nœud Lyon\n(secours)")
    d.lien([(182, 470), (798, 470)], "repl", "groupe de disponibilité Always On", 470, 460, C["bleu"])
    d.icone("serveur", 160, 600, "Oracle 19c", "Oracle Linux 8 — gestion\nadministrative et paye", taille=0.85, cote="droite")
    d.icone("serveur", 420, 600, "Veeam Backup & Replication", "sauvegardes, réplication,\ntests SureBackup", taille=0.85, cote="droite")
    leg = legende([(trait(C["sarcelle"], 'stroke-dasharray="5 4"'), "Réplication inter-sites"), (trait(C["bleu"], 'stroke-dasharray="5 4"'), "Haute disponibilité de la base de données")])
    page("systemes-cible", d.svg() + leg, CSS)


# ---------------------------------------------------------------- maquette Packet Tracer (vue logique)
def maquette_logique():
    d = Dessin(1220, 800)
    d.zone(20, 200, 700, 580, "Site Paris — 10.10.0.0/16")
    d.zone(760, 200, 440, 580, "Site Lyon — 10.20.0.0/16", couleur=C["sarcelle"], fond="#EEF6F6")
    d.icone("routeur", 610, 100, "ISP-RTR", "Internet simulé")
    d.icone("serveur", 860, 62, "SRV-INTERNET-TEST", "203.0.113.10", taille=0.85, cote="droite")
    d.lien([(640, 95), (843, 66)])
    d.lien([(580, 104), (360, 104), (360, 248)], texte="203.0.113.0/30", tx=470, ty=96)
    d.lien([(640, 104), (980, 104), (980, 248)], texte="203.0.113.4/30", tx=900, ty=124)
    d.icone("routeur", 360, 270, "RTR-PARIS", "NAT, tunnel GRE", cote="gauche")
    d.icone("routeur", 980, 270, "RTR-LYON", "NAT, tunnel GRE", cote="droite")
    d.lien([(390, 270), (950, 270)], "vpn", "Tunnel GRE 172.16.0.0/30", 670, 262, C["bleu"])
    d.lien([(360, 292), (360, 340)])
    d.lien([(980, 292), (980, 340)])
    d.icone("parefeu", 360, 360, "FW-PARIS", "ASA 5505", taille=0.9, cote="droite")
    d.icone("parefeu", 980, 360, "FW-LYON", "ASA 5505", taille=0.9, cote="droite")
    # Paris : deux cœurs en HSRP
    d.lien([(345, 380), (345, 410), (215, 410), (215, 455)])
    d.lien([(375, 380), (375, 410), (505, 410), (505, 455)])
    d.texte(360, 432, "VLAN 100 — transit 10.10.254.4/29", 12, C["gris"], italique=True)
    d.icone("l3", 215, 480, "CORE-PARIS-SW1", "HSRP actif")
    d.icone("l3", 505, 480, "CORE-PARIS-SW2", "HSRP secours")
    d.lien([(243, 470), (477, 470)], "trunk", couleur=C["bleu"])
    d.texte(360, 461, "HSRP + trunk", 12, C["bleu"], gras=True)
    d.lien([(243, 492), (345, 492), (345, 600)], "trunk")
    d.lien([(477, 492), (375, 492), (375, 600)], "trunk")
    d.icone("switch", 360, 615, "ACC-PARIS-SW", cote="droite")
    d.icone("serveur", 80, 480, "SRV-PARIS", "DHCP, DNS, fichiers", taille=0.85)
    d.lien([(98, 480), (187, 480)])
    eq = [("pc", "Bureautique", "VLAN 10"), ("pc", "Bancaire", "VLAN 20"), ("ap", "Wi-Fi invités", "VLAN 40"), ("telephone", "Téléphone IP", "VLAN 50")]
    for k, (ic, nom, vl) in enumerate(eq):
        x = 140 + k * 147
        d.lien([(360, 631), (360, 655), (x, 655), (x, 680)])
        d.icone(ic, x, 700, nom, vl, taille=0.85)
    # Lyon
    d.lien([(980, 380), (980, 455)])
    d.icone("l3", 980, 480, "CORE-LYON-SW", "passerelles des VLAN", cote="gauche")
    d.icone("serveur", 1130, 480, "SRV-LYON", "DHCP, DNS", taille=0.85)
    d.lien([(1008, 480), (1112, 480)])
    d.lien([(980, 506), (980, 600)], "trunk")
    d.icone("switch", 980, 615, "ACC-LYON-SW", cote="droite")
    for k, (nom, vl) in enumerate([("Bureautique", "VLAN 10"), ("Bancaire", "VLAN 20")]):
        x = 900 + k * 160
        d.lien([(980, 631), (980, 655), (x, 655), (x, 680)])
        d.icone("pc", x, 700, nom, vl, taille=0.85)
    leg = legende([(trait(C["gris"], 'stroke-width="4"'), "Trunk 802.1Q"), (trait(C["gris"]), "Liaison"),
                   (trait(C["bleu"], 'stroke-dasharray="8 5"'), "Tunnel GRE inter-sites")])
    page("maquette-logique", d.svg() + leg, CSS)


if __name__ == "__main__":
    reseau_existant(); reseau_cible(); systemes_cible(); maquette_logique()
