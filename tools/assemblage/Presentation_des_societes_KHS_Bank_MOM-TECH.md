::: {custom-style="Title"}
PRÉSENTATION DES SOCIÉTÉS
:::

::: {custom-style="Subtitle"}
Client : KHS Bank — Prestataire : MOM-TECH
:::

**Titre RNCP Ingénieur Systèmes, Réseaux et Cybersécurité — Niveau 7 (EU)**

**Institut Européen F2I**

&nbsp;

**Client :** KHS Bank

**Prestataire :** MOM-TECH

**Candidats :** *[Prénom NOM 1]*, *[Prénom NOM 2]*, *[Prénom NOM 3]*, *[Prénom NOM 4]*

**Session :** 2026


```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

```{=openxml}
<w:sdt><w:sdtPr><w:docPartObj><w:docPartGallery w:val="Table of Contents"/><w:docPartUnique/></w:docPartObj></w:sdtPr><w:sdtContent><w:p><w:pPr><w:pStyle w:val="TOCHeading"/></w:pPr><w:r><w:t>Sommaire</w:t></w:r></w:p><w:p><w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/><w:instrText xml:space="preserve"> TOC \o "1-3" \h \z \u </w:instrText><w:fldChar w:fldCharType="separate"/><w:fldChar w:fldCharType="end"/></w:r></w:p></w:sdtContent></w:sdt>
```

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# Présentation de la société cliente : KHS Bank

## Identité

| | |
|---|---|
| Raison sociale | KHS Bank |
| Statut | Établissement de crédit agréé par l'ACPR |
| Siège social | Paris La Défense (92) |
| Site secondaire | Lyon (69) — back-office et centre de relation client |
| Création | 2004 |
| Effectif | ≈ 920 collaborateurs (780 au siège, 140 à Lyon) |
| Budget annuel SI | 14 000 000 € |
| Secteurs d'activité | Banque de détail, banque des professionnels, gestion de patrimoine |

## Historique et positionnement

Fondée en 2004, KHS Bank s'est développée en combinant une offre de banque de détail traditionnelle
et une activité de gestion de patrimoine à forte valeur ajoutée. Sa croissance régulière du produit net
bancaire lui a permis de consolider sa position d'établissement de taille intermédiaire, reconnu pour la
qualité de sa relation client et la confidentialité apportée à sa clientèle privée.

Comme l'ensemble du secteur bancaire, KHS Bank fait face à une double pression : la nécessité de
moderniser son expérience client (services digitaux, mobilité) et l'intensification des exigences
réglementaires et des menaces de cybersécurité pesant sur le secteur financier. C'est dans ce contexte
que la direction a décidé de confier la refonte de son système d'information à un prestataire spécialisé.

## Organisation

```
                         Direction Générale
                                 │
        ┌───────────────┬───────┼───────┬────────────────┐
        │                │               │                │
  Direction des    Direction des   Direction     Direction Conformité
  Systèmes         Risques &       Commerciale    & Sécurité (RSSI)
  d'Information     Contrôle
  (DSI)             Interne
        │
   ┌────┴─────┬─────────────┬───────────────┐
Responsable  Responsable   Responsable      Chef de Projet
Infrastructure Support     Sécurité SI      (référent MOM-TECH)
& Réseau      Utilisateurs  (interne)
```

Le pilotage du projet côté client est assuré conjointement par la **DSI** (maîtrise d'ouvrage) et la
**Direction Conformité & Sécurité**, qui doit valider toute solution impactant la protection des données
clients et le respect des exigences ACPR/RGPD.

## Infrastructure et contexte technique (synthèse)

KHS Bank exploite un système d'information vieillissant, hérité de choix technologiques successifs non
harmonisés entre le siège et le site de Lyon (cf. cahier des charges
pour le détail complet) : postes sous Windows 8, annuaire Active Directory 2016, messagerie
Exchange 2013, base SQL Server 2012, liaison VPN unique entre sites sans redondance. Cette dette
technique, conjuguée à l'absence de SOC et de PCA formalisé, constitue le principal facteur de risque
identifié par la direction.

## Enjeux du projet pour KHS Bank

1. **Conformité réglementaire** : ACPR, DSP2, PCI-DSS, RGPD, secret bancaire.
2. **Continuité d'activité** : les interruptions de service sur les moyens de paiement ont un impact direct
   sur la confiance client et sont surveillées par le régulateur.
3. **Cybersécurité** : le secteur bancaire est une cible privilégiée (fraude, rançongiciels, hameçonnage
   ciblant les collaborateurs et les clients).
4. **Performance et modernisation** : réduction de la latence, harmonisation du parc, migration vers des
   outils collaboratifs modernes (Office 365).

# Présentation de la société prestataire : MOM-TECH

## Identité

| | |
|---|---|
| Raison sociale | MOM-TECH |
| Forme juridique | SASU / SAS (cabinet d'ingénierie IT) |
| Siège social | Paris |
| Domaines d'expertise | Intelligence Artificielle, Cloud, Cybersécurité |
| Positionnement | Cabinet d'ingénierie systèmes, réseaux et cybersécurité, spécialisé dans
  l'intégration de solutions cloud et d'IA appliquée à la sécurité |
| Effectif projet | 4 ingénieurs (équipe dédiée au projet KHS Bank) |

## Positionnement et offre de services

MOM-TECH accompagne des organisations à fort enjeu de conformité (banque, assurance, santé, secteur
public) dans la modernisation de leur système d'information, avec une conviction : la sécurité et
l'intelligence artificielle ne sont pas des couches ajoutées après coup, mais des éléments qui doivent
structurer l'architecture dès la conception — un principe qui rejoint directement les attentes exprimées
par KHS Bank dans son cahier des charges.

L'offre de MOM-TECH s'organise autour de trois pôles complémentaires :

- **Pôle Cybersécurité** : audit de sécurité, mise en place de SOC/SIEM, PRA/PCA, gestion des identités
  et des accès, conformité RGPD/ACPR/PCI-DSS, gestion électronique de documents (GED) sécurisée.
- **Pôle Cloud & Infrastructure** : architecture réseau, virtualisation, migration vers le cloud (hybride ou
  souverain selon les contraintes réglementaires du client), haute disponibilité.
- **Pôle Intelligence Artificielle & Data** : détection d'anomalies et de fraude, analyse comportementale
  appliquée à la sécurité (couplée au SOC), automatisation de la supervision.

Cette organisation en trois pôles permet à MOM-TECH de répondre à l'exigence du cahier des charges de
KHS Bank de structurer l'équipe projet en deux sous-équipes (**Architecture Système** et **Réseau &
Sécurité**), tout en apportant une valeur ajoutée différenciante sur l'IA appliquée à la lutte anti-fraude et
à la détection d'incidents — un axe stratégique pour un établissement bancaire.

## Organisation de l'équipe projet

```
                        Direction de projet MOM-TECH
                                    │
                 ┌──────────────────┴──────────────────┐
                 │                                       │
     Équipe Architecture Système                Équipe Réseau & Sécurité
                 │                                       │
   ┌─────────────┴─────────────┐          ┌──────────────┴──────────────┐
Ingénieur Systèmes         Ingénieur      Ingénieur Réseaux &      Ingénieur
& Virtualisation            IA / Data      Cybersécurité            Cybersécurité / SOC
```

| Rôle | Candidat | Périmètre principal |
|---|---|---|
| Chef de projet / Ingénieur Architecture Système | *[Prénom NOM 1]* | Pilotage global, PBS/WBS/OBS/RACI, serveurs, virtualisation, PRA/PCA |
| Ingénieur Réseaux & Sécurité | *[Prénom NOM 2]* | Lot A (architecture réseau), Lot E (IDS/IPS), Lot G (PRA/PCA réseau) |
| Ingénieur Cybersécurité / SOC | *[Prénom NOM 3]* | Lot D, F (audit sécurité), SOC/SIEM, GED sécurisée, conformité RGPD/ACPR |
| Ingénieur Systèmes & Déploiement | *[Prénom NOM 4]* | Lot B, C, J (postes clients, Office 365, déploiements), Lot H (monitoring) |

*(Noms des 4 candidats à compléter — la répartition ci-dessus respecte l'obligation du cahier des charges
de structurer l'équipe en deux sous-équipes Architecture Système / Réseau & Sécurité, tout en couvrant
l'ensemble des lots principaux et complémentaires.)*

## Méthodologie

MOM-TECH s'appuie sur le référentiel **ITIL v4** pour l'ensemble de sa démarche projet (gestion des
niveaux de service, gestion des incidents et des changements), conformément à l'exigence du cahier des
charges de KHS Bank, ainsi que sur les recommandations de l'**ANSSI** pour la sécurisation des
infrastructures et sur les bonnes pratiques **ISO 27001 / ISO 9001** pour la qualité et la sécurité de
l'information.

## Pourquoi MOM-TECH pour KHS Bank

1. Une double compétence rare — infrastructure/réseau **et** cybersécurité/IA — directement alignée
   avec les enjeux d'un établissement bancaire soumis à une réglementation stricte et à des menaces
   ciblées (fraude, rançongiciel).
2. Une méthodologie de gestion de projet formalisée (ITIL v4, RACI, gestion des risques) répondant point
   par point au formalisme exigé par le cahier des charges.
3. Une approche de la sécurité « by design », intégrée dès la phase d'architecture plutôt qu'ajoutée en fin
   de projet — illustrée notamment par la proposition de GED sécurisée du lot cybersécurité.
