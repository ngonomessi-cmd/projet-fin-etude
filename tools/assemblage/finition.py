#!/usr/bin/env python3
"""Finition du dossier Word produit par pandoc.

Usage : python3 tools/assemblage/finition.py <entree.docx> <sortie.docx> ["Titre|sur deux lignes"] ["Sous-titre"]

- page de garde composée ;
- table des figures après le sommaire, mise à jour des champs à l'ouverture ;
- légendes numérotées « Figure n » (champ SEQ, reconnu par Word) ;
- tableaux mis en forme : pleine largeur, largeurs de colonnes proportionnées au contenu,
  ligne d'en-tête colorée et répétée, filets horizontaux, lignes alternées ;
- pages en paysage pour les figures larges (PBS, WBS, Gantt) ;
- en-tête courant, corps de texte justifié, style des blocs de commandes.
"""
import copy
import sys

import docx
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor

MARINE = "1F3864"
OR = "B8923F"
GRIS = "595959"
LARGEUR_TEXTE_TWIPS = 11906 - 2 * 1134       # A4 portrait, marges de 2 cm
EMU_CM = 360000
CANDIDATS = ["NGONO MESSI Julien Joël", "ADJE Tchaffa Oladé Moïse", "WAFO Franklin Junior", "ABAYOMI Obachegoun Olabissi"]
PAYSAGE = ("PBS", "WBS", "Diagramme de Gantt")


def el(tag, **attrs):
    e = OxmlElement(tag)
    for k, v in attrs.items():
        e.set(qn(k), str(v))
    return e


def p_pr(p):
    return p.get_or_add_pPr() if hasattr(p, "get_or_add_pPr") else p._p.get_or_add_pPr()


def ombrer(tc, couleur):
    tcPr = tc.get_or_add_tcPr()
    for s in tcPr.findall(qn("w:shd")):
        tcPr.remove(s)
    tcPr.append(el("w:shd", **{"w:val": "clear", "w:color": "auto", "w:fill": couleur}))


# ------------------------------------------------------------------ styles
def alignements(d):
    """Paragraphes à retours à la ligne forcés : alignés à gauche (sinon la justification étire les lignes)."""
    for p in d.paragraphs:
        brs = [b for b in p._p.iter(qn("w:br")) if b.get(qn("w:type")) in (None, "textWrapping")]
        if brs and p.style.name in ("Body Text", "First Paragraph"):
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT


def styles(d):
    for nom in ("Body Text", "First Paragraph"):
        if nom in [s.name for s in d.styles]:
            st = d.styles[nom]
            st.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            st.paragraph_format.space_after = Pt(6)
    st = d.styles["Image Caption"]
    st.font.italic = True
    st.font.size = Pt(9.5)
    st.font.color.rgb = RGBColor.from_string(GRIS)
    st.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    st.paragraph_format.space_after = Pt(14)
    st = d.styles["Captioned Figure"]
    st.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    st.paragraph_format.keep_with_next = True
    st.paragraph_format.space_before = Pt(8)
    # blocs de commandes : fond gris clair et filet à gauche
    st = d.styles["Source Code"]
    pPr = st.element.get_or_add_pPr()
    pPr.append(el("w:shd", **{"w:val": "clear", "w:color": "auto", "w:fill": "F2F2F2"}))
    bdr = el("w:pBdr")
    bdr.append(el("w:left", **{"w:val": "single", "w:sz": "18", "w:space": "6", "w:color": "A6A6A6"}))
    pPr.append(bdr)
    for nom in ("Verbatim Char",):
        if nom in [s.name for s in d.styles]:
            d.styles[nom].font.size = Pt(8.5)
            d.styles[nom].font.name = "Consolas"


# ------------------------------------------------------------------ tableaux
def texte_cellule(tc):
    return "".join(t.text or "" for t in tc.iter(qn("w:t"))).strip()


def tableaux(d):
    for t in d.tables:
        tbl = t._tbl
        lignes = tbl.findall(qn("w:tr"))
        if not lignes:
            continue
        # en-tête vide (tableaux « clé / valeur ») : supprimé
        look = tbl.tblPr.find(qn("w:tblLook"))
        a_entete = look is None or look.get(qn("w:firstRow")) != "0"
        if a_entete and all(texte_cellule(tc) == "" for tc in lignes[0].findall(qn("w:tc"))):
            tbl.remove(lignes[0])
            lignes = lignes[1:]
            a_entete = False
        entete_vide = not a_entete
        ncol = max(len(r.findall(qn("w:tc"))) for r in lignes)
        # largeurs proportionnées au contenu
        longueurs = [[] for _ in range(ncol)]
        for r in lignes:
            for k, tc in enumerate(r.findall(qn("w:tc"))):
                longueurs[k].append(len(texte_cellule(tc)))
        poids = []
        for col in longueurs:
            if not col:
                poids.append(4)
                continue
            moy = sum(col) / len(col)
            poids.append(max(3.5, min(0.55 * moy + 0.45 * max(col), 42)))
        if a_entete:
            for k, tc in enumerate(lignes[0].findall(qn("w:tc"))):
                mots = texte_cellule(tc).replace("/", " ").split()
                if mots:
                    poids[k] = max(poids[k], max(len(m) for m in mots) * 1.45 + 2.5)
        if ncol == 2 and entete_vide:
            poids = [1, 2]
        total = sum(poids)
        largeurs = [int(LARGEUR_TEXTE_TWIPS * w / total) for w in poids]

        tblPr = tbl.tblPr
        for tag in ("w:tblW", "w:tblLayout", "w:tblBorders", "w:tblCellMar", "w:jc"):
            for x in tblPr.findall(qn(tag)):
                tblPr.remove(x)
        tblPr.append(el("w:tblW", **{"w:w": "5000", "w:type": "pct"}))
        tblPr.append(el("w:jc", **{"w:val": "center"}))
        bords = el("w:tblBorders")
        bords.append(el("w:top", **{"w:val": "single", "w:sz": "8", "w:space": "0", "w:color": MARINE}))
        bords.append(el("w:left", **{"w:val": "nil"}))
        bords.append(el("w:bottom", **{"w:val": "single", "w:sz": "8", "w:space": "0", "w:color": MARINE}))
        bords.append(el("w:right", **{"w:val": "nil"}))
        bords.append(el("w:insideH", **{"w:val": "single", "w:sz": "4", "w:space": "0", "w:color": "D9D9D9"}))
        bords.append(el("w:insideV", **{"w:val": "nil"}))
        tblPr.append(bords)
        tblPr.append(el("w:tblLayout", **{"w:type": "fixed"}))
        mar = el("w:tblCellMar")
        for cote, v in (("top", 45), ("left", 85), ("bottom", 45), ("right", 85)):
            mar.append(el(f"w:{cote}", **{"w:w": str(v), "w:type": "dxa"}))
        tblPr.append(mar)
        grid = tbl.find(qn("w:tblGrid"))
        if grid is not None:
            for gc, w in zip(grid.findall(qn("w:gridCol")), largeurs):
                gc.set(qn("w:w"), str(w))

        for i, r in enumerate(lignes):
            entete = i == 0 and not entete_vide
            cellules = r.findall(qn("w:tc"))
            regroupement = (not entete and len(cellules) > 2 and texte_cellule(cellules[0])
                            and all(texte_cellule(c) == "" for c in cellules[1:]))
            trPr = r.get_or_add_trPr()
            if entete:
                trPr.append(el("w:tblHeader"))
            trPr.append(el("w:cantSplit"))
            for k, tc in enumerate(r.findall(qn("w:tc"))):
                tcPr = tc.get_or_add_tcPr()
                for x in tcPr.findall(qn("w:tcW")):
                    tcPr.remove(x)
                tcPr.insert(0, el("w:tcW", **{"w:w": str(largeurs[min(k, ncol - 1)]), "w:type": "dxa"}))
                tcPr.append(el("w:vAlign", **{"w:val": "center"}))
                if entete:
                    ombrer(tc, MARINE)
                elif regroupement:
                    ombrer(tc, "D9E2F3")
                elif i % 2 == 0:
                    ombrer(tc, "F3F6FA")
                if entete_vide and k == 0:
                    ombrer(tc, "F3F6FA")
                for p in tc.findall(qn("w:p")):
                    pPr = p.get_or_add_pPr()
                    sp = el("w:spacing", **{"w:before": "20", "w:after": "20"})
                    for x in pPr.findall(qn("w:spacing")):
                        pPr.remove(x)
                    pPr.append(sp)
                    for rr in p.iter(qn("w:r")):
                        rPr = rr.get_or_add_rPr()
                        rPr.append(el("w:sz", **{"w:val": "19"}))
                        rPr.append(el("w:szCs", **{"w:val": "19"}))
                        if entete:
                            rPr.append(el("w:b"))
                            rPr.append(el("w:color", **{"w:val": "FFFFFF"}))
                        elif entete_vide and k == 0:
                            rPr.append(el("w:b"))
                            rPr.append(el("w:color", **{"w:val": MARINE}))


# ------------------------------------------------------------------ légendes et paysage
def legendes(d):
    n = 0
    for p in d.paragraphs:
        if p.style.name != "Image Caption":
            continue
        n += 1
        champ = el("w:fldSimple", **{"w:instr": r" SEQ Figure \* ARABIC "})
        r = el("w:r")
        rpr = el("w:rPr"); rpr.append(el("w:b")); rpr.append(el("w:i", **{"w:val": "0"})); r.append(rpr)
        tt = el("w:t"); tt.text = str(n); r.append(tt); champ.append(r)
        r1 = el("w:r"); rpr1 = el("w:rPr"); rpr1.append(el("w:b")); rpr1.append(el("w:i", **{"w:val": "0"})); r1.append(rpr1)
        t1 = el("w:t", **{"xml:space": "preserve"}); t1.text = "Figure "; r1.append(t1)
        r2 = el("w:r"); rpr2 = el("w:rPr"); rpr2.append(el("w:b")); rpr2.append(el("w:i", **{"w:val": "0"})); r2.append(rpr2)
        t2 = el("w:t", **{"xml:space": "preserve"}); t2.text = " : "; r2.append(t2)
        pPr = p._p.get_or_add_pPr()
        pPr.addnext(r1)
        r1.addnext(champ)
        champ.addnext(r2)
    return n


def sectpr_modele(d):
    return d.element.body.find(qn("w:sectPr"))


def sect(modele, paysage):
    s = copy.deepcopy(modele)
    pg = s.find(qn("w:pgSz"))
    if paysage:
        pg.set(qn("w:w"), "16838"); pg.set(qn("w:h"), "11906"); pg.set(qn("w:orient"), "landscape")
    else:
        pg.set(qn("w:w"), "11906"); pg.set(qn("w:h"), "16838")
        if pg.get(qn("w:orient")) is not None:
            del pg.attrib[qn("w:orient")]
    return s


def figures_paysage(d):
    modele = sectpr_modele(d)
    paras = d.paragraphs
    for i, p in enumerate(paras):
        if p.style.name != "Image Caption" or not any(x in p.text for x in PAYSAGE):
            continue
        fig = paras[i - 1]._p
        prec = fig.getprevious()
        if prec is None or prec.tag != qn("w:p"):
            vide = el("w:p")
            fig.addprevious(vide)
            prec = vide
        prec.get_or_add_pPr().append(sect(modele, False))
        p._p.get_or_add_pPr().append(sect(modele, True))
        # image agrandie à la largeur utile du paysage (25,7 x 15,5 cm au plus)
        for ext in fig.iter(qn("wp:extent")):
            cx, cy = int(ext.get("cx")), int(ext.get("cy"))
            k = min(25.7 * EMU_CM / cx, 15.3 * EMU_CM / cy)
            ext.set("cx", str(int(cx * k))); ext.set("cy", str(int(cy * k)))
            for a in fig.iter(qn("a:ext")):
                a.set("cx", str(int(cx * k))); a.set("cy", str(int(cy * k)))


# ------------------------------------------------------------------ page de garde
def para(texte="", taille=11, gras=False, couleur=None, align="center", avant=0, apres=0, espace=0, filet=None, italique=False):
    p = el("w:p")
    pPr = el("w:pPr")
    pPr.append(el("w:jc", **{"w:val": align}))
    pPr.append(el("w:spacing", **{"w:before": str(avant), "w:after": str(apres)}))
    if filet:
        b = el("w:pBdr"); b.append(el("w:bottom", **{"w:val": "single", "w:sz": "12", "w:space": "8", "w:color": filet})); pPr.append(b)
    p.append(pPr)
    if texte:
        r = el("w:r"); rPr = el("w:rPr")
        if gras:
            rPr.append(el("w:b"))
        if italique:
            rPr.append(el("w:i"))
        if couleur:
            rPr.append(el("w:color", **{"w:val": couleur}))
        if espace:
            rPr.append(el("w:spacing", **{"w:val": str(espace)}))
        rPr.append(el("w:sz", **{"w:val": str(int(taille * 2))}))
        r.append(rPr)
        t = el("w:t", **{"xml:space": "preserve"}); t.text = texte; r.append(t)
        p.append(r)
    return p


def page_de_garde(d, titre_lignes, sous_titre):
    body = d.element.body
    titres = [p for p in d.paragraphs if p.style.name == "Title"]
    if not titres:
        return
    titre = titres[0]._p
    # supprime l'ancienne page de garde jusqu'au saut de page
    x = titre
    while x is not None:
        suivant = x.getnext()
        if x.tag == qn("w:p") and x.find(".//" + qn("w:br")) is not None and x.find(".//" + qn("w:br")).get(qn("w:type")) == "page":
            break
        body.remove(x)
        x = suivant
    saut = x
    blocs = [
        para("INSTITUT EUROPÉEN F2I", 11, True, GRIS, espace=40, avant=600),
        para("Titre RNCP de niveau 7 — Ingénieur Systèmes, Réseaux et Cybersécurité", 10.5, couleur=GRIS, avant=60),
        para("", avant=2600, filet=OR),
        para("DOSSIER DE MISE EN SITUATION PROFESSIONNELLE", 12.5, True, OR, espace=30, avant=240),
    ] + [para(l, 27, True, MARINE, avant=200 if k == 0 else 0) for k, l in enumerate(titre_lignes)] + [
        para(sous_titre, 13, couleur=GRIS, avant=200, apres=240, filet=OR),
        para("Client", 10, True, GRIS, avant=1500, espace=20),
        para("KHS Bank — établissement de crédit, Paris La Défense et Lyon", 12, couleur=MARINE, apres=200),
        para("Prestataire", 10, True, GRIS, espace=20),
        para("MOM-TECH — ingénierie systèmes, réseaux et cybersécurité", 12, couleur=MARINE, apres=200),
        para("Candidats", 10, True, GRIS, espace=20),
    ] + [para(c, 12, couleur=MARINE) for c in CANDIDATS] + [
        para("Session 2026 — soutenance du 16 décembre 2026", 10.5, couleur=GRIS, avant=900, italique=True),
    ]
    for b in blocs:
        saut.addprevious(b)


# ------------------------------------------------------------------ table des figures, en-tête, champs
def champ_paragraphe(instr, texte_attente):
    p = el("w:p")
    r1 = el("w:r"); r1.append(el("w:fldChar", **{"w:fldCharType": "begin", "w:dirty": "true"})); p.append(r1)
    r2 = el("w:r"); it = el("w:instrText", **{"xml:space": "preserve"}); it.text = instr; r2.append(it); p.append(r2)
    r3 = el("w:r"); r3.append(el("w:fldChar", **{"w:fldCharType": "separate"})); p.append(r3)
    r4 = el("w:r"); t = el("w:t"); t.text = texte_attente; r4.append(t); p.append(r4)
    r5 = el("w:r"); r5.append(el("w:fldChar", **{"w:fldCharType": "end"})); p.append(r5)
    return p


def table_des_figures(d):
    sdt = d.element.body.find(qn("w:sdt"))
    if sdt is None:
        return
    saut = el("w:p"); r = el("w:r"); r.append(el("w:br", **{"w:type": "page"})); saut.append(r)
    tete = el("w:p"); pPr = el("w:pPr"); pPr.append(el("w:pStyle", **{"w:val": "TOCHeading"})); tete.append(pPr)
    rr = el("w:r"); t = el("w:t"); t.text = "Table des figures"; rr.append(t); tete.append(rr)
    champ = champ_paragraphe(r' TOC \h \z \c "Figure" ', "Mettre à jour les champs (F9) pour afficher la table des figures.")
    sdt.addnext(saut); saut.addnext(tete); tete.addnext(champ)
    reglages = d.settings.element
    reglages.append(el("w:updateFields", **{"w:val": "true"}))


def en_tete(d):
    premiere = d.sections[0]
    premiere.different_first_page_header_footer = True
    h = premiere.header
    h.is_linked_to_previous = False
    p = h.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r = p.add_run("Dossier de mise en situation professionnelle — KHS Bank / MOM-TECH")
    r.font.size = Pt(8.5)
    r.font.color.rgb = RGBColor.from_string(GRIS)
    pPr = p._p.get_or_add_pPr()
    b = el("w:pBdr"); b.append(el("w:bottom", **{"w:val": "single", "w:sz": "4", "w:space": "4", "w:color": "BFBFBF"})); pPr.append(b)


TITRE = ["Migration et sécurisation du système", "d'information de KHS Bank"]
SOUS_TITRE = "Audit, architecture cible, plan de migration et GED sécurisée"


def main(entree, sortie, titre=None, sous_titre=None):
    d = docx.Document(entree)
    styles(d)
    alignements(d)
    tableaux(d)
    n = legendes(d)
    figures_paysage(d)
    page_de_garde(d, titre.split("|") if titre else TITRE, sous_titre or SOUS_TITRE)
    table_des_figures(d)
    en_tete(d)
    d.save(sortie)
    print(f"{sortie} : {n} figures, {len(d.tables)} tableaux, {len(d.sections)} sections")


if __name__ == "__main__":
    main(*sys.argv[1:5])
