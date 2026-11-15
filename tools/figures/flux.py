"""Schémas de flux : accès zero trust, SOC, architecture de la GED."""
from commun import C, e, page
from technique import CSS, Dessin

FL = '<marker id="fl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#595959"/></marker>'


class Flux(Dessin):
    def boite(self, x, y, w, h, titre, sous="", fond="#fff", bord=C["bleu"], couleur=C["marine"], titre_taille=14.5, sous_couleur=None):
        self.fond.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="5" fill="{fond}" stroke="{bord}" stroke-width="1.4"/>')
        lignes = sous.split("\n") if sous else []
        h_txt = 18 + 15 * len(lignes)
        y0 = y + (h - h_txt) / 2 + 13
        self.av.append(f'<text x="{x + w / 2}" y="{y0}" font-size="{titre_taille}" font-weight="700" fill="{couleur}" text-anchor="middle">{e(titre)}</text>')
        for k, l in enumerate(lignes):
            self.av.append(f'<text x="{x + w / 2}" y="{y0 + 18 + k * 15}" font-size="12.5" fill="{sous_couleur or C["gris"]}" text-anchor="middle">{e(l)}</text>')

    def fleche(self, pts, couleur=C["gris"], texte="", tx=None, ty=None, ancre="middle", tirets=False):
        d = "M" + " L".join(f"{a},{b}" for a, b in pts)
        da = ' stroke-dasharray="6 4"' if tirets else ""
        self.fond.append(f'<path d="{d}" fill="none" stroke="{couleur}" stroke-width="1.6" marker-end="url(#fl)"{da}/>')
        if texte:
            self.texte(tx, ty, texte, 12, couleur, ancre=ancre, italique=True)

    def losange(self, cx, cy, w, h, texte):
        self.fond.append(f'<path d="M{cx},{cy - h / 2} L{cx + w / 2},{cy} L{cx},{cy + h / 2} L{cx - w / 2},{cy} z" fill="{C["or_clair"]}" stroke="{C["or"]}" stroke-width="1.4"/>')
        self.texte(cx, cy - 2, texte, 13, C["marine"], gras=True)

    def svg(self):
        return super().svg().replace("<defs>", "<defs>" + FL, 1)


def zero_trust():
    d = Flux(980, 625)
    W = 420
    x = 280
    d.boite(x, 20, W, 54, "Utilisateur", "poste client léger ou lourd (Lot B)", fond=C["gris_pale"], bord=C["gris"])
    d.fleche([(x + W / 2, 74), (x + W / 2, 100)])
    d.boite(x, 100, W, 58, "Authentification Microsoft Entra ID + MFA", "accès conditionnel (Lot C)", fond=C["bleu_clair"])
    d.fleche([(x + W / 2, 158), (x + W / 2, 186)])
    d.losange(x + W / 2, 228, 300, 84, "Poste conforme et\nMFA validée ?")
    d.fleche([(x + W / 2 + 150, 228), (800, 228)], texte="Non", tx=730, ty=220)
    d.boite(800, 200, 160, 56, "Accès refusé", "événement journalisé", fond=C["rouge_clair"], bord=C["rouge"], couleur=C["rouge"])
    d.fleche([(x + W / 2, 270), (x + W / 2, 302)], texte="Oui", tx=x + W / 2 + 22, ty=292, ancre="start")
    d.boite(x - 40, 302, W + 80, 46, "Accès limité au périmètre autorisé", "segmentation VLAN et filtrage du pare-feu", fond=C["bleu_pale"])
    cols = [(30, "Application bancaire KHS-Core", "VLAN 20 : filtrage applicatif\ndu pare-feu, journalisation"),
            (350, "GED sécurisée (Lot F)", "classification, journal d'audit\nimmuable, signature"),
            (670, "Administration et ressources internes", "VPN + MFA, bastion PAM\n(Entra PIM)")]
    for cx0, t, s in cols:
        d.fleche([(x + W / 2, 348), (x + W / 2, 372), (cx0 + 140, 372), (cx0 + 140, 398)])
        d.boite(cx0, 398, 280, 74, t, s)
        d.fleche([(cx0 + 140, 472), (cx0 + 140, 520), (x + W / 2, 520), (x + W / 2, 548)])
    d.boite(x - 40, 548, W + 80, 58, "Journalisation centralisée — Microsoft Sentinel (SOC)", "corrélation, détection, réponse", fond=C["marine"], bord=C["marine"], couleur="#fff", sous_couleur="#D9E2F3")
    page("zero-trust", d.svg(), CSS)


def soc():
    d = Flux(1100, 520)
    sources = [("Fortinet FortiGate", "Lots A et E"), ("Defender for Endpoint", "Lot D"), ("Entra ID, accès conditionnel", "Lot C"),
               ("Purview DLP", "Lot F"), ("GED sécurisée — journal d'audit", "Lot F"), ("Exchange Online, Defender for Office 365", "Lot 4"),
               ("Journaux des serveurs, GLPI", "Lots 3 et H")]
    d.texte(170, 26, "Sources d'événements", 14.5, C["marine"], gras=True)
    for k, (t, l) in enumerate(sources):
        y = 42 + k * 64
        d.boite(20, y, 300, 52, t, l, titre_taille=13.5)
        d.fleche([(320, y + 26), (420, y + 26)])
    d.fond.append(f'<rect x="420" y="40" width="330" height="440" rx="8" fill="{C["marine"]}"/>')
    d.texte(585, 76, "Microsoft Sentinel", 18, "#fff", gras=True, halo=False)
    d.texte(585, 96, "SIEM / SOAR", 13, "#D9E2F3", halo=False)
    for k, (t, s) in enumerate([("Corrélation des événements", "règles et analyses planifiées"),
                                ("Détection assistée par IA", "UEBA : comportements anormaux\ndes utilisateurs et des comptes"),
                                ("Réponse automatisée (SOAR)", "playbooks : isolement d'un poste,\nblocage d'un compte, ticket")]):
        d.boite(445, 120 + k * 118, 280, 100, t, s, fond="#fff", bord="#9DC3E6")
    d.fleche([(750, 260), (820, 260)])
    d.boite(820, 200, 260, 120, "Analystes SOC MOM-TECH", "qualification des alertes,\nastreinte 24/7 sur les\nincidents critiques", fond=C["or_clair"], bord=C["or"])
    d.fleche([(950, 320), (950, 380)])
    d.boite(820, 380, 260, 80, "Rapport et amélioration", "retour d'expérience,\nmise à jour des règles", fond=C["gris_pale"], bord=C["gris"])
    page("soc", d.svg(), CSS)


def ged():
    d = Flux(1120, 430)
    d.boite(20, 70, 230, 70, "Agent de l'organisation", "navigateur, session aal2\n(mot de passe + TOTP)", fond=C["gris_pale"], bord=C["gris"])
    d.boite(20, 250, 230, 70, "Tiers sans compte", "page publique /verifier\n(QR code d'un PDF signé)", fond=C["gris_pale"], bord=C["gris"])
    d.fond.append(f'<rect x="340" y="40" width="300" height="320" rx="8" fill="{C["bleu_pale"]}" stroke="{C["bleu"]}" stroke-width="1.4"/>')
    d.texte(490, 66, "Application Next.js", 16, C["marine"], gras=True)
    d.texte(490, 84, "hébergée sur Vercel", 12.5, C["gris"])
    for k, (t, s) in enumerate([("Ateliers documentaires", "Word, Excel, PowerPoint ;\nexport natif et PDF"),
                                ("Pages et actions serveur", "aucune règle d'autorisation\ndans le code"),
                                ("En-têtes de sécurité HTTP", "HSTS, nosniff, anti-framing")]):
        d.boite(360, 100 + k * 84, 260, 72, t, s, titre_taille=13.5)
    d.fleche([(250, 105), (340, 105)], texte="HTTPS", tx=295, ty=97)
    d.fleche([(250, 285), (340, 285)], texte="HTTPS", tx=295, ty=277)
    d.fond.append(f'<rect x="740" y="40" width="360" height="320" rx="8" fill="{C["marine"]}"/>')
    d.texte(920, 66, "Supabase", 16, "#fff", gras=True, halo=False)
    d.texte(920, 84, "la sécurité est appliquée ici", 12.5, "#D9E2F3", halo=False)
    for k, (t, s) in enumerate([("Auth — double authentification TOTP", "jeton de session de niveau aal2"),
                                ("PostgreSQL — RLS et fonctions", "rôles, départements, organisation ;\njournal d'audit immuable"),
                                ("Storage — fichiers", "adresses signées valables 5 minutes")]):
        d.boite(760, 100 + k * 84, 320, 72, t, s, fond="#fff", bord="#9DC3E6", titre_taille=13.5)
    d.fleche([(640, 200), (740, 200)], texte="jeton aal2", tx=690, ty=192)
    d.texte(560, 400, "Chaque requête, de l'interface ou d'un appel direct à l'API, est filtrée par PostgreSQL selon l'identité, le rôle, le département et l'organisation.", 13, C["gris"], italique=True)
    page("ged-architecture", d.svg(), CSS)


if __name__ == "__main__":
    zero_trust(); soc(); ged()
