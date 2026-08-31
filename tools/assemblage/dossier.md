::: {custom-style="Title"}
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


```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# Abstract

KHS Bank, a mid-size French banking group with a head office in Paris and a secondary site in Lyon,  
operates a system of information built on fragmented, ageing technology across network, systems and security.  
Windows 8 workstations, an unsupported Exchange 2013 mail server, a single core switch and a lone  
VPN link leave the bank exposed to service outages and to the compliance risks that weigh on the  
financial sector under ACPR, DSP2, PCI-DSS and GDPR requirements.  
MOM-TECH, a consultancy specialised in artificial intelligence, cloud and cybersecurity, was engaged  
to audit the existing infrastructure, design a resilient target architecture and lead its deployment  
without any interruption of banking services, in strict accordance with the ITIL v4 framework.  
The audit exposed fourteen high-severity findings, concentrated on the absence of redundancy, of a  
security operations centre, and of adequate protection for sensitive banking documents.  
The proposed architecture removes every single point of failure identified in the network and  
virtualisation layers, introduces multi-factor authentication and a unified Microsoft 365 identity  
platform, and deploys Microsoft Sentinel as an AI-driven security operations centre.  
A dedicated secure document management solution protects sensitive files through classification,  
encryption and an immutable audit trail, addressing both regulatory and confidentiality requirements.  
Backups now follow a 3-2-1-1 policy with an immutable cloud copy, closing the gap left by the  
previous single storage array and untested tape backups kept on the same site as production.  
Migration proceeds through progressive coexistence across seven stages, validated by a full test and  
acceptance campaign, keeping the bank's payment services continuously available throughout the project.  
The resulting infrastructure meets every objective of the initial specification within the allocated budget,  
while a continuous improvement plan keeps KHS Bank ahead of emerging cybersecurity and AI-driven threats.

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

```{=openxml}
<w:sdt><w:sdtPr><w:docPartObj><w:docPartGallery w:val="Table of Contents"/><w:docPartUnique/></w:docPartObj></w:sdtPr><w:sdtContent><w:p><w:pPr><w:pStyle w:val="TOCHeading"/></w:pPr><w:r><w:t>Sommaire</w:t></w:r></w:p><w:p><w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/><w:instrText xml:space="preserve">TOC \o "1-3" \h \z \u</w:instrText><w:fldChar w:fldCharType="separate"/><w:fldChar w:fldCharType="end"/></w:r></w:p></w:sdtContent></w:sdt>
```

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# 1. Présentation des sociétés

## Présentation de la société cliente : KHS Bank

### Identité

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

### Historique et positionnement

Fondée en 2004, KHS Bank s'est développée en combinant une offre de banque de détail traditionnelle
et une activité de gestion de patrimoine à forte valeur ajoutée. Sa croissance régulière du produit net
bancaire lui a permis de consolider sa position d'établissement de taille intermédiaire, reconnu pour la
qualité de sa relation client et la confidentialité apportée à sa clientèle privée.

Comme l'ensemble du secteur bancaire, KHS Bank fait face à une double pression : la nécessité de
moderniser son expérience client (services digitaux, mobilité) et l'intensification des exigences
réglementaires et des menaces de cybersécurité pesant sur le secteur financier. C'est dans ce contexte
que la direction a décidé de confier la refonte de son système d'information à un prestataire spécialisé.

### Organisation

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

### Infrastructure et contexte technique (synthèse)

KHS Bank exploite un système d'information vieillissant, hérité de choix technologiques successifs non
harmonisés entre le siège et le site de Lyon (cf. cahier des charges
pour le détail complet) : postes sous Windows 8, annuaire Active Directory 2016, messagerie
Exchange 2013, base SQL Server 2012, liaison VPN unique entre sites sans redondance. Cette dette
technique, conjuguée à l'absence de SOC et de PCA formalisé, constitue le principal facteur de risque
identifié par la direction.

### Enjeux du projet pour KHS Bank

1. **Conformité réglementaire** : ACPR, DSP2, PCI-DSS, RGPD, secret bancaire.
2. **Continuité d'activité** : les interruptions de service sur les moyens de paiement ont un impact direct
   sur la confiance client et sont surveillées par le régulateur.
3. **Cybersécurité** : le secteur bancaire est une cible privilégiée (fraude, rançongiciels, hameçonnage
   ciblant les collaborateurs et les clients).
4. **Performance et modernisation** : réduction de la latence, harmonisation du parc, migration vers des
   outils collaboratifs modernes (Office 365).

## Présentation de la société prestataire : MOM-TECH

### Identité

| | |
|---|---|
| Raison sociale | MOM-TECH |
| Forme juridique | SASU / SAS (cabinet d'ingénierie IT) |
| Siège social | Paris |
| Domaines d'expertise | Intelligence Artificielle, Cloud, Cybersécurité |
| Positionnement | Cabinet d'ingénierie systèmes, réseaux et cybersécurité, spécialisé dans
  l'intégration de solutions cloud et d'IA appliquée à la sécurité |
| Effectif projet | 4 ingénieurs (équipe dédiée au projet KHS Bank) |

### Positionnement et offre de services

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

### Organisation de l'équipe projet

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

### Méthodologie

MOM-TECH s'appuie sur le référentiel **ITIL v4** pour l'ensemble de sa démarche projet (gestion des
niveaux de service, gestion des incidents et des changements), conformément à l'exigence du cahier des
charges de KHS Bank, ainsi que sur les recommandations de l'**ANSSI** pour la sécurisation des
infrastructures et sur les bonnes pratiques **ISO 27001 / ISO 9001** pour la qualité et la sécurité de
l'information.

### Pourquoi MOM-TECH pour KHS Bank

1. Une double compétence rare — infrastructure/réseau **et** cybersécurité/IA — directement alignée
   avec les enjeux d'un établissement bancaire soumis à une réglementation stricte et à des menaces
   ciblées (fraude, rançongiciel).
2. Une méthodologie de gestion de projet formalisée (ITIL v4, RACI, gestion des risques) répondant point
   par point au formalisme exigé par le cahier des charges.
3. Une approche de la sécurité « by design », intégrée dès la phase d'architecture plutôt qu'ajoutée en fin
   de projet — illustrée notamment par la proposition de GED sécurisée du lot cybersécurité.

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# 2. Étude du cahier des charges et évaluation du besoin

## Étude du cahier des charges et évaluation du besoin

> Analyse du cahier des charges KHS Bank par MOM-TECH, préalable à
> toute proposition de solution. Cette étude structure les besoins exprimés par domaine, formalise les
> contraintes à respecter et fixe la méthode d'audit qui sera mise en œuvre (cf. [audit de l'existant](../04-audit-existant/)).

### 1. Synthèse des objectifs du projet

| Objectif | Traduction opérationnelle |
|---|---|
| Fiabiliser le SI | Redondance réseau, PRA/PCA formalisé, haute disponibilité des services bancaires |
| Sécuriser le SI | Mise en conformité RGPD/ACPR/DSP2/PCI-DSS, SOC/SIEM, IAM, GED sécurisée |
| Moderniser les usages | Migration Office 365, harmonisation du parc, unification des sites |
| Maîtriser les coûts | Rationalisation du parc et des licences, budget encadré à 14 M€/an |
| Accompagner le changement | Plan de formation, communication, gestion des risques humains |

### 2. Synthèse des besoins par domaine

#### 2.1 Besoins réseaux

- Fiabiliser la liaison inter-sites (siège Paris ↔ site Lyon), actuellement assurée par un lien VPN unique
  sans secours.
- Segmenter le réseau (DMZ, séparation des flux bancaires/bureautiques/invités) pour réduire la surface
  d'attaque.
- Mettre à niveau des équipements réseau vieillissants (switches, routeurs) et homogénéiser le parc.
- Garantir la disponibilité des moyens de paiement (contrainte réglementaire ACPR).

#### 2.2 Besoins en cybersécurité

- Combler l'absence de SOC/SIEM et de politique de détection d'intrusion.
- Sécuriser les accès (IAM, authentification forte conforme DSP2) et les échanges de documents
  sensibles (GED sécurisée, DLP).
- Mettre en place un PRA/PCA formalisé avec RPO/RTO définis, adaptés aux exigences de continuité d'un
  établissement bancaire.
- Assurer la conformité RGPD (cartographie des traitements, protection des données clients) et la
  résistance aux menaces ciblant spécifiquement le secteur (fraude, hameçonnage, rançongiciel).

#### 2.3 Besoins système

- Remplacer les systèmes obsolètes (Windows 8, Office 2007/2010/2011, Exchange 2013, AD 2016,
  SQL Server 2012) par des versions supportées et sécurisées.
- Fiabiliser le stockage et la sauvegarde (actuellement une baie unique et des bandes conservées sur
  site, sans copie externalisée).
- Uniformiser le déploiement des postes de travail et des applicatifs (actuellement hétérogènes).
- Garantir la compatibilité et la continuité de fonctionnement de l'application métier **KHS-Core**.

### 3. Contraintes identifiées

| Type | Contrainte |
|---|---|
| Réglementaire | RGPD, ACPR, DSP2, PCI-DSS, secret bancaire |
| Méthodologique | Démarche ITIL v4 obligatoire ; équipe projet structurée en 2 sous-équipes |
| Organisationnelle | Deux sites (Paris/Lyon), 920 utilisateurs, réticence des équipes IT internes |
| Financière | Budget annuel plafonné à 14 M€ pour la maintenance et l'évolution du SI |
| Opérationnelle | Aucune interruption totale de service tolérée, en particulier sur les moyens de paiement |
| Applicative | KHS-Core (progiciel bancaire) hors périmètre de maintenance applicative, mais son
  infrastructure d'hébergement est dans le périmètre |

### 4. Méthode et mise en place de l'audit

Conformément à la démarche ITIL v4 (phase *Strategize* puis *Design & Transition*), MOM-TECH engage un
audit structuré en trois volets, mené en parallèle par les deux sous-équipes projet :

1. **Audit réseau** (Équipe Réseau & Sécurité) : relevé de l'architecture existante, des équipements, de la
   segmentation, des liens VPN et de leur redondance.
2. **Audit systèmes** (Équipe Architecture Système) : inventaire des serveurs, des services (AD, DNS,
   DHCP, messagerie, fichiers), des postes de travail et des politiques de sauvegarde.
3. **Audit cybersécurité** (transverse aux deux équipes) : évaluation des politiques de sécurité, des accès,
   de la surface d'exposition et de la conformité réglementaire.

Chaque volet suit la même méthode en quatre étapes : **inventaire exhaustif** → **entretiens avec les
parties prenantes** (DSI, RSSI, utilisateurs représentatifs) → **analyse des écarts** par rapport aux
exigences du cahier des charges → **restitution structurée** (constats, risques, recommandations),
formalisée dans un rapport d'audit par domaine.

Les résultats de cet audit sont détaillés dans la section [Audit de l'existant](../04-audit-existant/).

### 5. Résultats attendus, délais et évaluation

- **Résultats attendus** : diagnostic complet du SI, architecture cible justifiée, plan de migration sans
  interruption de service, conformité réglementaire démontrée.
- **Délais** : planning détaillé dans le diagramme de Gantt (cf. [gestion de projet](../03-gestion-de-projet/)).
- **Évaluation** : recette contractuelle en fin de projet (cf. [Recette](../08-bilan-financier-recette/)),
  validée conjointement par la DSI et la Direction Conformité & Sécurité de KHS Bank.

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# 3. Gestion de projet

## Gestion de projet — Migration et sécurisation du SI de KHS Bank

Cette section formalise la gestion de projet exigée par le cahier des charges :
structuration en deux sous-équipes, instance de pilotage, gestion des risques, indicateurs de suivi,
démarche ITIL v4.

- PBS — Product Breakdown Structure
- WBS — Work Breakdown Structure
- OBS — Organizational Breakdown Structure
- Matrice RACI
- Gestion des risques projet
- Diagramme de Gantt et gestion des ressources humaines
- Démarche ITIL v4

### Instance de pilotage

Un **Comité de Pilotage (COPIL)** est institué, réunissant mensuellement :

- côté KHS Bank : le Directeur des Systèmes d'Information (sponsor), le RSSI, un représentant de la
  Direction Conformité & Sécurité ;
- côté MOM-TECH : le Chef de projet et les deux responsables de sous-équipe (Architecture Système /
  Réseau & Sécurité).

Le COPIL valide les livrables de chaque phase, arbitre les risques remontés et autorise le passage à la
phase suivante (jalons de type *Go/No-Go*).

### Indicateurs de suivi du projet

| Indicateur | Cible | Fréquence de suivi |
|---|---|---|
| Avancement du planning (% tâches terminées / prévues) | ≥ 95 % à chaque jalon | Hebdomadaire |
| Taux de constats d'audit traités | 100 % des constats de criticité élevée avant recette | À chaque COPIL |
| Disponibilité des services pendant la migration | Aucune interruption des moyens de paiement | Continu |
| Respect du budget | Écart ≤ 5 % du budget alloué au projet | Mensuel |
| Incidents de sécurité pendant le déploiement | 0 incident majeur | Continu |

## PBS — Product Breakdown Structure

Le PBS décompose le projet en livrables (produits attendus), indépendamment de l'ordre dans lequel ils
sont réalisés.

```
                              Projet Migration & Sécurisation SI KHS Bank
                                                │
        ┌───────────┬────────────┬─────────────┼─────────────┬────────────┬────────────┐
        │           │            │              │             │            │            │
   Cadrage &    Rapports      Architecture   Infrastructure  Dispositif   Dossiers de  Bilan
   Documents    d'audit       cible &        déployée        de sécurité  recette &    financier &
   de gestion   (réseau,      schémas        (réseau,        (SOC/SIEM,   PV de        contrat de
   de projet    systèmes,     techniques     systèmes,       PRA/PCA,     livraison    maintenance
   (PBS/WBS/    cybersécu)                   postes)         GED,
   OBS/RACI/                                                 IAM/MFA)
   Gantt)
```

### Détail des livrables par branche

| Branche | Livrables |
|---|---|
| Cadrage & documents de gestion de projet | Cahier des charges étudié, PBS, WBS, OBS, RACI, Gantt, registre des risques |
| Rapports d'audit | Rapport d'audit réseau, rapport d'audit systèmes, rapport d'audit cybersécurité, synthèse consolidée |
| Architecture cible & schémas techniques | Schéma réseau cible, schéma de la salle serveurs, architecture du SOC |
| Infrastructure déployée | Équipements réseau configurés, serveurs et virtualisation, postes clients déployés, messagerie migrée |
| Dispositif de sécurité | SOC/SIEM opérationnel, PRA/PCA testé, GED sécurisée, IAM/MFA déployé |
| Dossiers de recette & PV de livraison | Cahier de tests, PV de recette, PV de mise en production |
| Bilan financier & contrat de maintenance | Devis détaillé, facturation, contrat de maintenance signé |

## WBS — Work Breakdown Structure

Le WBS décompose le projet en six phases séquencées, chacune subdivisée par thème (Réseau, Systèmes,
Cybersécurité) lorsque pertinent.

```
Projet Migration & Sécurisation SI KHS Bank
│
├── 1. Pilotage
│   ├── Cadrage du projet
│   ├── Rédaction cahier des charges (étude) et évaluation du besoin
│   ├── PBS / WBS / OBS / RACI / Gantt
│   ├── Gestion des risques
│   └── Suivi de projet (COPIL)
│
├── 2. Audit
│   ├── Audit réseau (architecture, équipements, liens VPN)
│   ├── Audit systèmes (serveurs, stockage, services, postes)
│   ├── Audit cybersécurité (organisationnel, physique, technique)
│   └── Rapport d'audit consolidé
│
├── 3. Conception
│   ├── Étude technique et architecture cible réseau
│   ├── Étude technique et architecture cible systèmes/virtualisation
│   ├── Conception du dispositif cybersécurité (SOC/SIEM, IAM, GED)
│   └── Validation de l'architecture (COPIL)
│
├── 4. Planification
│   ├── Consultation fournisseurs / appels d'offres matériel
│   ├── Choix des prestataires (FAI de secours, éditeurs)
│   ├── Plan de migration (pré-migration / migration / post-migration)
│   └── Commandes et livraison du matériel
│
├── 5. Déploiement
│   ├── Réseau : câblage, équipements, VPN, segmentation
│   ├── Systèmes : virtualisation, stockage, sauvegarde, AD/DNS/DHCP, messagerie, postes clients
│   ├── Cybersécurité : SOC/SIEM, EDR, IAM/MFA, PRA/PCA, GED sécurisée
│   └── Migration de l'application métier KHS-Core
│
└── 6. Tests, Recette et Finalisation
    ├── Tests de déploiement (par lot)
    ├── Cahier de tests et recette
    ├── Validation client (PV de recette)
    ├── Formation des utilisateurs et des équipes techniques
    ├── Documentation d'installation et d'exploitation
    ├── Contrat de maintenance
    └── Bilan financier et facturation
```

## OBS — Organizational Breakdown Structure

L'OBS identifie qui, côté KHS Bank et côté MOM-TECH, porte la responsabilité de chaque grande famille
de tâches du WBS.

```
                          Projet Migration & Sécurisation SI KHS Bank
                                            │
              ┌─────────────────────────────┴─────────────────────────────┐
              │                                                             │
        KHS Bank (MOA)                                              MOM-TECH (MOE)
              │                                                             │
     ┌────────┴────────┐                                     ┌─────────────┴─────────────┐
Direction des        Direction                          Direction de projet          Direction de projet
Systèmes             Conformité                          MOM-TECH                     (Chef de projet)
d'Information         & Sécurité (RSSI)                        │
     │                    │                     ┌───────────────┴───────────────┐
Responsable          Référent RGPD /       Équipe Architecture Système    Équipe Réseau & Sécurité
Infrastructure        conformité                    │                              │
& Réseau                                  Ingénieur Systèmes &            Ingénieur Réseaux &
                                           Virtualisation, Ingénieur IA    Cybersécurité, Ingénieur
                                                                            Cybersécurité / SOC
```

### Répartition des responsabilités par domaine

| Domaine | Porteur principal (KHS Bank) | Porteur principal (MOM-TECH) |
|---|---|---|
| Pilotage global / COPIL | DSI (sponsor) | Chef de projet |
| Conformité réglementaire (RGPD, ACPR, DSP2) | Direction Conformité & Sécurité / RSSI | Ingénieur Cybersécurité |
| Réseau et infrastructure | Responsable Infrastructure & Réseau | Ingénieur Réseaux & Sécurité |
| Systèmes et virtualisation | Responsable Infrastructure & Réseau | Ingénieur Systèmes & Virtualisation |
| Cybersécurité (SOC, PRA/PCA, GED) | RSSI | Ingénieur Cybersécurité / SOC |
| Formation et accompagnement des utilisateurs | Direction des Ressources Humaines | Ingénieur Systèmes & Déploiement |
| Recette et validation | DSI + Direction Conformité & Sécurité | Chef de projet |

## Matrice RACI

**R** = Réalisateur (un seul par tâche) · **A** = Approbateur (un seul par tâche) · **C** = Consulté ·
**I** = Informé

| Livrable / Tâche | DSI (KHS) | RSSI (KHS) | Chef de projet (MOM-TECH) | Ing. Réseaux & Sécurité | Ing. Systèmes & Virtualisation | Ing. Cybersécurité / SOC | Fournisseurs |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Pilotage** | | | | | | | |
| Cadrage du projet | A | C | R | I | I | I | |
| Étude du cahier des charges / évaluation du besoin | A | C | R | C | C | C | |
| PBS / WBS / OBS / RACI / Gantt | A | I | R | C | C | C | |
| Gestion des risques projet | A | C | R | C | C | C | |
| Suivi de projet (COPIL) | A | C | R | I | I | I | |
| **Audit** | | | | | | | |
| Audit réseau | C | I | A | R | I | I | |
| Audit systèmes | C | I | A | I | R | I | |
| Audit cybersécurité | I | C | A | I | I | R | |
| Rapport d'audit consolidé | A | C | R | C | C | C | |
| **Conception** | | | | | | | |
| Architecture réseau cible | C | I | A | R | C | C | |
| Architecture systèmes cible | C | I | A | C | R | C | |
| Conception cybersécurité (SOC/SIEM, IAM, GED) | I | C | A | C | C | R | |
| Validation de l'architecture (COPIL) | A | C | R | I | I | I | |
| **Planification** | | | | | | | |
| Consultation fournisseurs / appel d'offres | I | I | R | C | C | I | C |
| Choix des prestataires (FAI secours, éditeurs) | C | I | A | C | C | I | C |
| Plan de migration (pré/migration/post) | C | I | R | C | C | C | |
| Commande et livraison du matériel | I | I | R | I | I | I | R |
| **Déploiement** | | | | | | | |
| Déploiement réseau (câblage, équipements, VPN) | I | I | A | R | I | I | |
| Déploiement systèmes (virtualisation, stockage, AD, messagerie, postes) | I | I | A | I | R | I | |
| Déploiement cybersécurité (SOC/SIEM, EDR, IAM/MFA, PRA/PCA, GED) | I | C | A | I | I | R | |
| Migration de l'application métier KHS-Core | C | I | A | I | R | C | |
| **Tests, Recette et Finalisation** | | | | | | | |
| Tests de déploiement par lot | I | I | A | R | R | R | |
| Cahier de tests et recette | A | C | R | C | C | C | |
| Validation client (PV de recette) | A | C | R | I | I | I | |
| Formation des utilisateurs | C | I | R | I | R | I | |
| Documentation d'installation et d'exploitation | I | I | R | C | C | C | |
| Contrat de maintenance | A | C | R | I | I | I | |
| Bilan financier et facturation | A | I | R | I | I | I | |

## Gestion des risques projet

> À ne pas confondre avec les constats de l'audit de l'existant,
> qui portent sur l'état du SI de KHS Bank. Cette section couvre les **risques liés à la conduite du
> projet** lui-même (délais, ressources, budget, conduite du changement, réglementation).

### Échelle d'évaluation

| Valeur | Impact | Probabilité | Détection |
|:---:|---|---|---|
| 1 | Mineur, sans conséquence sur le planning | Improbable | Détecté très en amont |
| 2 | Faible, absorbable sans replanification | Peu probable | Signe avant-coureur identifiable |
| 3 | Notable, replanification d'une tâche | Probable | Signe avant-coureur difficilement décelable |
| 4 | Important, impact sur un jalon | Très probable | Aucun signe avant-coureur |
| 5 | Critique, remet en cause un livrable majeur ou la conformité réglementaire | Quasi certain | Détection impossible avant survenue |

Criticité = Impact × Probabilité (sur 25).

### Registre des risques

| # | Risque | Catégorie | Impact | Proba. | Criticité | Action de mitigation | Porteur | Criticité résiduelle |
|---|---|---|:---:|:---:|:---:|---|---|:---:|
| P1 | Retard de livraison du matériel réseau/serveurs | Logistique | 4 | 3 | 12 | Anticiper les commandes dès la fin de la conception, prévoir un stock tampon d'équipements critiques | Chef de projet | 4 |
| P2 | Indisponibilité d'un membre clé de l'équipe projet | Humain | 4 | 2 | 8 | Documentation continue, doublon de compétences entre les deux sous-équipes, plan de montée en charge | Chef de projet | 4 |
| P3 | Dépassement du budget alloué | Financier | 5 | 2 | 10 | Chiffrage détaillé par lot validé en COPIL, marge de 10 % provisionnée, suivi mensuel des dépenses | Chef de projet / DSI | 5 |
| P4 | Résistance au changement des équipes informatiques internes de KHS Bank | Organisationnel | 3 | 4 | 12 | Communication dès le lancement, association des équipes internes à l'audit et aux tests, plan de formation | DSI / Chef de projet | 3 |
| P5 | Incompatibilité de l'application métier KHS-Core avec la nouvelle infrastructure | Technique | 5 | 3 | 15 | Environnement de test dédié, tests de compatibilité avant migration en production, éditeur KHS-Core associé | Ing. Systèmes | 6 |
| P6 | Interruption d'un service bancaire pendant la migration (moyens de paiement) | Opérationnel / Réglementaire | 5 | 2 | 10 | Migrations planifiées hors heures ouvrées, bascule progressive, plan de retour arrière testé | Chef de projet | 5 |
| P7 | Non-conformité réglementaire découverte tardivement (ACPR/DSP2/PCI-DSS) | Réglementaire | 5 | 2 | 10 | Revue de conformité à chaque jalon avec la Direction Conformité & Sécurité, veille réglementaire continue | Ing. Cybersécurité | 5 |
| P8 | Fuite ou perte de données pendant la phase de migration | Sécurité | 5 | 2 | 10 | Chiffrement des flux et supports de migration, contrôle d'intégrité post-migration, sauvegarde préalable systématique | Ing. Cybersécurité | 5 |
| P9 | Sous-estimation du périmètre lors de l'audit initial | Méthodologique | 3 | 2 | 6 | Grille d'audit exhaustive validée en amont, entretiens croisés avec plusieurs interlocuteurs par domaine | Chef de projet | 4 |
| P10 | Difficulté d'approvisionnement (pénurie composants) | Logistique | 3 | 3 | 9 | Identification de fournisseurs alternatifs, commande anticipée des équipements à délai long | Chef de projet | 6 |
| P11 | Perte de données lors de la migration de la base SQL Server 2012 | Technique | 5 | 2 | 10 | Sauvegarde complète avant migration, migration à blanc en environnement de test, contrôle de cohérence post-migration | Ing. Systèmes | 5 |
| P12 | Manque de compétences internes KHS Bank pour la reprise en MCO après le projet | Organisationnel | 3 | 3 | 9 | Plan de formation des équipes techniques internes, documentation d'exploitation détaillée, période de transfert de compétences | Chef de projet | 6 |

### Priorisation

Trois risques dépassent le seuil de criticité 12 avant mitigation (**P4**, **P5**, **P1**) et concentrent
l'attention du COPIL en début de projet. Le risque **P5** (incompatibilité de KHS-Core), le plus critique du
registre, justifie la mise en place systématique d'un environnement de test isolé avant toute migration en
production — cohérent avec les étapes de pré-migration détaillées
plus loin dans le dossier.

## Diagramme de Gantt et gestion des ressources humaines

### Planning macro

Le projet est planifié sur **26 semaines** (≈ 6 mois), du **5 janvier 2026** au **26 juin 2026**, réparties en
six phases séquencées avec chevauchement limité entre la fin de l'audit et le début de la conception.

| Phase | Durée | Début | Fin |
|---|:---:|---|---|
| 1. Pilotage | 10 j | 05/01/2026 | 16/01/2026 |
| 2. Audit | 15 j | 19/01/2026 | 06/02/2026 |
| 3. Conception | 20 j | 09/02/2026 | 06/03/2026 |
| 4. Planification | 15 j | 09/03/2026 | 27/03/2026 |
| 5. Déploiement | 45 j | 30/03/2026 | 29/05/2026 |
| 6. Tests, Recette et Finalisation | 20 j | 01/06/2026 | 26/06/2026 |

```
                 Jan   Fév   Mar   Avr   Mai   Juin
Pilotage         ████
Audit                  ████
Conception              ████████
Planification                    ████
Déploiement                           ████████████████
Tests/Recette                                          ████████
```

### Détail des tâches et ressources assignées

| Phase | Tâche | Durée | Début | Fin | Ressource(s) |
|---|---|:---:|---|---|---|
| Pilotage | Cadrage du projet | 3 j | 05/01/2026 | 07/01/2026 | Chef de projet |
| Pilotage | Étude cahier des charges / besoin | 3 j | 08/01/2026 | 12/01/2026 | Chef de projet, équipe complète |
| Pilotage | PBS, WBS, OBS, RACI, Gantt, risques | 4 j | 13/01/2026 | 16/01/2026 | Chef de projet |
| Audit | Audit réseau | 8 j | 19/01/2026 | 28/01/2026 | Ing. Réseaux & Sécurité |
| Audit | Audit systèmes | 8 j | 19/01/2026 | 28/01/2026 | Ing. Systèmes & Virtualisation |
| Audit | Audit cybersécurité | 10 j | 19/01/2026 | 30/01/2026 | Ing. Cybersécurité / SOC |
| Audit | Rapport d'audit consolidé | 4 j | 03/02/2026 | 06/02/2026 | Chef de projet |
| Conception | Architecture réseau cible | 8 j | 09/02/2026 | 18/02/2026 | Ing. Réseaux & Sécurité |
| Conception | Architecture systèmes cible | 8 j | 09/02/2026 | 18/02/2026 | Ing. Systèmes & Virtualisation |
| Conception | Conception cybersécurité (SOC/SIEM, IAM, GED) | 10 j | 09/02/2026 | 20/02/2026 | Ing. Cybersécurité / SOC |
| Conception | Validation architecture (COPIL) | 3 j | 04/03/2026 | 06/03/2026 | Chef de projet, DSI, RSSI |
| Planification | Consultation fournisseurs / appel d'offres | 8 j | 09/03/2026 | 18/03/2026 | Chef de projet |
| Planification | Plan de migration | 5 j | 19/03/2026 | 25/03/2026 | Ing. Réseaux, Ing. Systèmes |
| Planification | Commande et livraison du matériel | 2 j | 26/03/2026 | 27/03/2026 | Chef de projet |
| Déploiement | Réseau (câblage, équipements, VPN, segmentation) | 15 j | 30/03/2026 | 17/04/2026 | Ing. Réseaux & Sécurité |
| Déploiement | Systèmes (virtualisation, stockage, AD, messagerie, postes) | 20 j | 30/03/2026 | 24/04/2026 | Ing. Systèmes & Virtualisation |
| Déploiement | Cybersécurité (SOC/SIEM, EDR, IAM/MFA, PRA/PCA, GED) | 20 j | 20/04/2026 | 15/05/2026 | Ing. Cybersécurité / SOC |
| Déploiement | Migration de KHS-Core | 10 j | 18/05/2026 | 29/05/2026 | Ing. Systèmes, Chef de projet |
| Tests/Recette | Tests de déploiement par lot | 8 j | 01/06/2026 | 10/06/2026 | Équipe complète |
| Tests/Recette | Cahier de tests et recette | 4 j | 11/06/2026 | 16/06/2026 | Chef de projet |
| Tests/Recette | Validation client (PV de recette) | 2 j | 17/06/2026 | 18/06/2026 | Chef de projet, DSI, RSSI |
| Tests/Recette | Formation des utilisateurs | 4 j | 19/06/2026 | 24/06/2026 | Ing. Systèmes & Déploiement |
| Tests/Recette | Documentation, contrat de maintenance, bilan financier | 2 j | 25/06/2026 | 26/06/2026 | Chef de projet |

### Gestion des ressources humaines

| Ressource | Rôle | Charge estimée sur le projet |
|---|---|:---:|
| Chef de projet / Ing. Architecture Système | Pilotage, cadrage, conception systèmes, recette | 100 % |
| Ing. Réseaux & Sécurité | Audit et déploiement réseau, PRA/PCA réseau | 90 % |
| Ing. Cybersécurité / SOC | Audit et déploiement cybersécurité, SOC/SIEM, GED | 95 % |
| Ing. Systèmes & Déploiement | Audit et déploiement systèmes, postes clients, formation | 90 % |

Le déploiement (phase 5, 45 jours) concentre la charge la plus forte et le plus grand nombre de tâches en
parallèle : les quatre ressources y sont mobilisées simultanément, avec un chevauchement volontaire
entre le déploiement réseau/systèmes (dès le 30/03) et le déploiement cybersécurité (à partir du 20/04),
ce dernier nécessitant que l'infrastructure cible soit en place. Cette charge concentrée constitue un point
de vigilance identifié dans le registre des risques (risque **P2** — indisponibilité
d'un membre clé de l'équipe).

## Démarche ITIL v4

Le cahier des charges impose que la démarche
projet s'appuie sur le référentiel **ITIL v4**. MOM-TECH structure donc le projet autour du **Système de
Valeur des Services (SVS)** et de sa **chaîne de valeur des services (Service Value Chain)**, plutôt que
sur les seuls processus séquentiels historiques d'ITIL v3.

### Les quatre dimensions ITIL v4 appliquées au projet

| Dimension ITIL v4 | Application au projet KHS Bank |
|---|---|
| Organisations et personnes | OBS/RACI du projet, plan de formation, gestion du changement auprès des équipes internes (risque P4) |
| Information et technologie | Architecture réseau/systèmes cible, SOC/SIEM, GED sécurisée, outil de ticketing/monitoring (Lot H) |
| Partenaires et fournisseurs | Fournisseurs matériel/logiciel, FAI de secours, éditeur de KHS-Core |
| Flux de valeur et processus | WBS du projet, procédures de migration, procédures de gestion des incidents et des changements |

### Correspondance entre les phases du projet et la chaîne de valeur des services

| Phase du projet (WBS) | Activité de la chaîne de valeur ITIL v4 | Pratiques ITIL mobilisées |
|---|---|---|
| Pilotage | **Plan** | Gestion de portefeuille, gestion des risques |
| Audit | **Engage** | Gestion des niveaux de service, gestion des relations |
| Conception | **Design & Transition** | Gestion de la sécurité de l'information, gestion de la continuité de service |
| Planification | **Obtain/Build** | Gestion des fournisseurs, gestion des déploiements |
| Déploiement | **Obtain/Build** puis **Deliver & Support** | Gestion des déploiements, gestion des changements (*Change Enablement*), gestion des mises en production |
| Tests, Recette et Finalisation | **Deliver & Support** | Gestion des incidents, gestion des problèmes, centre de services (*Service Desk*), amélioration continue |

### Pratiques ITIL v4 clés pour ce projet

- **Gestion des changements (Change Enablement)** : chaque intervention en production (migration
  réseau, bascule KHS-Core) est soumise à une procédure de changement documentée, validée en COPIL,
  avec un plan de retour arrière — directement lié à l'exigence contractuelle de non-interruption des
  moyens de paiement.
- **Gestion de la sécurité de l'information** : intégrée dès la phase de conception (SOC/SIEM, IAM/MFA,
  GED sécurisée), conformément au principe *security by design* porté par MOM-TECH.
- **Gestion de la continuité des services** : formalisation du PRA/PCA avec RPO/RTO définis par service
  (cf. Lot G), répondant au constat d'audit **S8/C3**.
- **Gestion des niveaux de service (SLM)** : indicateurs de suivi définis dans la gestion de projet
  et futurs SLA du [contrat de maintenance](../08-bilan-financier-recette/).
- **Amélioration continue** : revue de fin de projet et recommandations de veille technologique
  (cf. cahier des charges §3.1), transmises à KHS Bank pour le maintien en conditions opérationnelles.

### Principes directeurs ITIL v4 retenus

1. **Se concentrer sur la valeur** : chaque lot est priorisé selon son impact sur la conformité et la
   continuité de service (cf. priorisation de l'audit).
2. **Partir de l'existant** : l'audit exhaustif précède toute proposition de solution.
3. **Progresser de manière itérative avec retour d'expérience** : déploiement par lot, avec tests
   intermédiaires avant la recette finale.
4. **Collaborer et favoriser la visibilité** : COPIL mensuel, RACI partagé entre KHS Bank et MOM-TECH.
5. **Penser et travailler de façon globale** : coordination systématique entre les deux sous-équipes
   (Architecture Système / Réseau & Sécurité) sur les sujets transverses (PRA/PCA, GED).
6. **Rester simple et pratique** : solutions dimensionnées au besoin réel de KHS Bank, sans
   sur-ingénierie (cf. arbitrages du [bilan financier](../08-bilan-financier-recette/)).
7. **Optimiser et automatiser** : supervision centralisée (Lot H), gestion automatisée des correctifs et du
   parc (Lot I/J).

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# 4. Audit de l'existant

## Audit de l'existant — KHS Bank

Cette section détaille l'audit mené par MOM-TECH conformément à la méthode décrite dans
l'étude du cahier des charges : inventaire
exhaustif, entretiens avec les parties prenantes, analyse des écarts, restitution structurée.

L'audit couvre les trois domaines du périmètre (lots principaux, lots complémentaires, cybersécurité) sur
les deux sites de KHS Bank :

- Audit réseau
- Audit systèmes
- Audit cybersécurité
- Conclusion de l'audit — synthèse des constats et matrice de criticité, base des
  [propositions de solutions](../05-solutions/)

### Périmètre et méthode de réalisation

| Site | Rôle | Population | Éléments audités |
|---|---|---|---|
| Paris (siège) | Direction, DSI, back-office central, salle serveurs principale | 780 utilisateurs | Réseau cœur, serveurs, sécurité, postes |
| Lyon (site secondaire) | Back-office régional, centre de relation client | 140 utilisateurs | Réseau local, poste clients, liaison au siège |

L'audit a été mené par les deux sous-équipes projet, en s'appuyant sur : la documentation existante
fournie par la DSI de KHS Bank, des relevés techniques sur site (câblage, baies, configurations
d'équipements), des entretiens avec le Responsable Infrastructure & Réseau, le RSSI et un panel
d'utilisateurs représentatif de chaque service.

## Audit réseau

### 1. Architecture réseau actuelle

L'infrastructure réseau de KHS Bank repose sur une architecture à trois niveaux (cœur, distribution,
accès), présente uniquement au siège de Paris ; le site de Lyon ne dispose que d'un niveau d'accès
raccordé au siège par un lien VPN unique.

```
                         Internet (FAI unique, sans lien de secours)
                                        │
                                 ┌──────┴──────┐
                                 │  Firewall    │  (unique, siège uniquement)
                                 └──────┬──────┘
                                        │
                              ┌─────────┴─────────┐
                              │  Switch Cœur (N3)  │  ← point de défaillance unique
                              └─────────┬─────────┘
                     ┌──────────────────┼──────────────────┐
             ┌───────┴───────┐  ┌───────┴───────┐  ┌───────┴───────┐
             │  Distribution │  │  Distribution │  │  Distribution │
             └───────┬───────┘  └───────┬───────┘  └───────┬───────┘
                     │                  │                  │
              Switches d'accès   Switches d'accès   Switches d'accès
              (postes, Wi-Fi)    (postes, Wi-Fi)    (postes, Wi-Fi)

                                        │
                                 Lien VPN IPsec
                                 (unique, non redondant)
                                        │
                              ┌─────────┴─────────┐
                              │  Site de Lyon      │
                              │  Switch d'accès    │
                              └───────────────────┘
```

### 2. Segmentation réseau actuelle

La segmentation est quasi inexistante : quelques VLAN ont été créés au fil du temps (postes utilisateurs,
serveurs, invités) sans plan d'adressage documenté ni cohérence entre les deux sites. Aucune DMZ
formalisée n'isole les services exposés (portail intranet/extranet) du réseau interne. Les flux liés à
l'application bancaire **KHS-Core** transitent sur le même réseau que la bureautique, sans cloisonnement
dédié — un écart majeur au regard des exigences de sécurité bancaire.

### 3. Inventaire des équipements réseau

| Équipement | État matériel | Marque | Modèle | Quantité | État de la garantie |
|---|---|---|---|---|---|
| Switch cœur (N3) | Souhait de remplacement | Cisco | Catalyst 3560-X | 1 (siège uniquement) | Expirée |
| Switch distribution | Utilisable | Cisco | Catalyst 2960-X | 6 (siège) | Expire bientôt |
| Switch accès — siège | Utilisable | Cisco | Catalyst 2960-S (24 ports) | 34 | Expire bientôt |
| Switch accès — Lyon | Utilisable | Cisco | Catalyst 2960-S (24 ports) | 9 | Expire bientôt |
| Routeurs | Souhait de remplacement | Cisco | ISR 2911 | 2 (1 par site) | Expirée |
| Pare-feu | Souhait de remplacement | Fortinet | FortiGate 100E | 1 (siège uniquement) | Expirée |
| Points d'accès Wi-Fi | Performant | Cisco | Aironet 2802 | 22 (18 siège / 4 Lyon) | Active |
| Câblage | Souhait de remplacement | — | Catégorie 5e | — | N/A |
| Ligne Internet — siège | Utilisable, sans secours | Orange Business | Fibre 1 Gbps symétrique | 1 lien | N/A |
| Ligne Internet — Lyon | Utilisable, sans secours | Orange Business | Fibre 200 Mbps symétrique | 1 lien | N/A |
| Lien VPN inter-sites | Utilisable, non redondant | — | IPsec site-to-site | 1 tunnel | N/A |

*Légende : État de la garantie — Expirée / Expire bientôt / Active.*

### 4. Les liens VPN

Le lien VPN IPsec entre le siège et Lyon est l'unique voie d'accès du site secondaire à l'annuaire Active
Directory, à la messagerie, au serveur de fichiers et à l'application **KHS-Core**. Aucune redondance
n'est en place (pas de second tunnel, pas de FAI de secours) : une rupture de ce lien isole intégralement
le site de Lyon, y compris pour la consultation des comptes et le traitement des opérations bancaires —
un risque majeur au regard des exigences de continuité de service du régulateur.

### 5. Constats de l'audit réseau

| # | Constat | Risque associé | Criticité |
|---|---|---|---|
| R1 | Switch cœur unique, sans redondance (pas de stack ni de VSS) | Panne totale du réseau siège | Élevée |
| R2 | Pare-feu unique, présent uniquement au siège | Site de Lyon non protégé en direct, dépendance totale au VPN | Élevée |
| R3 | Lien VPN inter-sites unique, sans secours | Isolement du site de Lyon en cas de rupture | Élevée |
| R4 | FAI unique par site, sans lien de secours | Perte d'accès Internet = perte de service pour les deux sites | Élevée |
| R5 | Absence de segmentation/DMZ formalisée | Flux bancaires non isolés, surface d'attaque élargie | Élevée |
| R6 | Équipements cœur/routeurs/pare-feu hors garantie | Absence de support constructeur en cas de panne | Moyenne |
| R7 | Câblage catégorie 5e vieillissant | Limitation de débit, fiabilité réduite | Moyenne |

Ces constats alimentent directement la conclusion de l'audit et la proposition de
solutions du lot A — Architecture réseau.

## Audit systèmes

### 1. Audit serveurs

#### 1.1 Salle serveurs — siège de Paris

| Rôle | Système | Quantité | Constat |
|---|---|---|---|
| Applications de gestion administrative/financière, paye | Linux (bases Oracle) | 2 serveurs | Fonctionnels mais non documentés, montée de version Oracle non planifiée |
| Serveur de fichiers | Windows Server 2016 | 1 serveur | Point de défaillance unique, pas de cluster |
| Messagerie, applications web, base métier | Windows Server (rack) | ≈ 10 serveurs | Mutualisation excessive de rôles sur des serveurs physiques vieillissants |
| Base applicative **KHS-Core** | SQL Server 2012 | 1 instance | Version en fin de support étendu, faille de sécurité potentielle |
| Contrôleur de domaine (AD) | Windows Server 2016 | 1 (siège), 1 (Lyon) | Réplication AD fonctionnelle mais aucun test de bascule documenté |
| Messagerie | Exchange 2013 | 1 serveur | Version obsolète, fin de support Microsoft dépassée |

#### 1.2 Stockage et sauvegarde

- L'ensemble des données est stocké sur **une seule baie de stockage** (SAN), sans réplication vers un
  second équipement : point de défaillance unique critique pour un établissement bancaire.
- Les sauvegardes sont réalisées par **deux robots de sauvegarde** (bandes), mais les bandes sont
  **conservées dans les sous-sols du siège** — aucune copie externalisée (« règle 3-2-1 » non respectée).
- Aucun **RPO/RTO** formalisé n'existe à ce jour ; aucun test de restauration documenté n'a été retrouvé.

#### 1.3 Salle serveurs — équipements généraux

| Équipement | État constaté |
|---|---|
| Climatisation | Présente, redondance non vérifiée |
| Onduleurs | Présents, autonomie non documentée, pas de test de coupure récent |
| Baies | Occupation proche de la saturation, pas de marge d'évolution |

### 2. Audit des services

| Service | Constat |
|---|---|
| Active Directory / DNS / DHCP | Fonctionnels, mais schéma AD non révisé depuis plusieurs années ; pas de politique de mots de passe renforcée ; pas de MFA |
| Messagerie (Exchange 2013) | Version obsolète, absence de filtrage anti-phishing avancé, cible privilégiée d'attaques par ingénierie sociale |
| Serveur de fichiers | Pas de quotas ni de classification des données, arborescence de partages non documentée |
| Sauvegarde | Cf. §1.2 — absence de copie externalisée et de PRA formalisé |
| Déploiement et mises à jour | Pas d'outil centralisé de gestion des correctifs (WSUS/SCCM absent ou non exploité) |

### 3. Audit postes clients

| Élément | Constat |
|---|---|
| Système d'exploitation | Windows 8 (fin de support Microsoft dépassée), ≈ 920 postes |
| Suite bureautique | Hétérogène : Office 2016 (Wintel), Office 2011 (Mac), Open Office selon les services |
| Navigateurs | Internet Explorer 7 et 9 — versions obsolètes et non sécurisées |
| Ancienneté du matériel | Achats étalés entre 2007 et 2017 ; ≈ 30 % du parc a plus de 8 ans |
| Antivirus | Présent mais géré poste par poste, sans console centrale ni visibilité SOC |
| Gestion du parc | Pas d'inventaire centralisé (pas d'outil de type GLPI en place) |

### 4. Constats de l'audit systèmes

| # | Constat | Risque associé | Criticité |
|---|---|---|---|
| S1 | Baie de stockage unique, sans réplication | Perte de données en cas de sinistre matériel | Élevée |
| S2 | Sauvegardes sur bandes conservées sur site, sans copie externalisée | Perte de données en cas de sinistre du siège (incendie, dégât des eaux) | Élevée |
| S3 | SQL Server 2012 (hébergeant KHS-Core) en fin de support | Vulnérabilités non corrigées sur un système critique | Élevée |
| S4 | Exchange 2013 obsolète | Exposition accrue au phishing et compromission de comptes | Élevée |
| S5 | Windows 8 et IE7/IE9 sur les postes clients | Absence de correctifs de sécurité récents | Élevée |
| S6 | Absence d'outil centralisé de gestion des correctifs | Délai de correction des vulnérabilités non maîtrisé | Moyenne |
| S7 | Absence d'outil de gestion de parc (inventaire) | Difficulté de pilotage du cycle de vie matériel/logiciel | Moyenne |
| S8 | Aucun RPO/RTO formalisé, pas de test de restauration | Incapacité à garantir une reprise d'activité maîtrisée | Élevée |

Ces constats alimentent la conclusion de l'audit et les propositions des lots
B (postes clients),
C (Office 365),
Lot 1 (stockage/sauvegarde),
Lot 4 (messagerie) et
Lot G (PRA/PCA).

## Audit cybersécurité

### 1. Contexte de l'audit

Le secteur bancaire figure parmi les cibles privilégiées des cyberattaques (fraude aux moyens de
paiement, hameçonnage ciblé — *spear phishing*, rançongiciel). L'audit cybersécurité vise à évaluer le
niveau de maturité de KHS Bank au regard de ces menaces et des exigences réglementaires (ACPR,
RGPD, DSP2, PCI-DSS), en s'appuyant sur les recommandations de l'**ANSSI**.

### 2. Audit organisationnel et physique

#### 2.1 Organisation de la sécurité

Un RSSI est en poste au sein de la Direction Conformité & Sécurité, mais ne dispose ni d'équipe dédiée,
ni d'outillage de supervision (pas de SOC/SIEM). Aucune politique de sécurité des systèmes
d'information (PSSI) formalisée et diffusée n'a été retrouvée ; les pratiques de sécurité reposent
largement sur des habitudes non documentées.

#### 2.2 Audit physique

| Élément | Constat |
|---|---|
| Accès à la salle serveurs | Contrôle par badge, sans registre de traçabilité horodaté exploité |
| Vidéosurveillance | Présente aux entrées du bâtiment, absente en salle serveurs |
| Gestion des visiteurs | Pas de procédure formalisée d'accompagnement des prestataires externes |

### 3. Audit technique

| Thème | Constat |
|---|---|
| Moyens d'accès à Internet | Ligne unique par site, sans proxy de filtrage web centralisé |
| Contrôle des accès | Authentification AD simple, **absence de MFA**, pas de gestion des comptes à privilèges (PAM) |
| Périmètre DMZ | Non formalisé (cf. audit réseau) |
| Sécurité et cloisonnement du LAN | Segmentation faible, flux bancaires non isolés |
| Gestion du parc informatique et mise à jour | Pas de supervision centralisée des correctifs (cf. audit systèmes) |
| Sécurité des postes de travail | Antivirus non centralisé, absence d'EDR/XDR |
| Sauvegarde / PRA / PCA | Absence de PRA/PCA formalisé (cf. audit systèmes §1.2) |
| Gestion des identifiants et mots de passe | Politique de mots de passe basique, pas de coffre-fort de mots de passe, pas de SSO |
| Réaction aux incidents | Aucune procédure de gestion de crise cyber documentée, pas de SOC |
| Sécurité du personnel & sensibilisation | Sensibilisation ponctuelle, pas de programme régulier ni d'exercices de phishing simulé |
| Gestion documentaire sensible | Documents internes sensibles (dossiers de crédit, KYC, rapports de conformité) stockés sur le
  serveur de fichiers classique, sans classification ni traçabilité des accès (pas de GED sécurisée) |

### 4. Analyse de l'audit — niveau de maturité

Le niveau de maturité cybersécurité de KHS Bank est jugé **insuffisant** au regard des exigences propres
au secteur bancaire : absence de détection (pas de SOC/SIEM), absence de plan de continuité formalisé,
authentification faible (pas de MFA malgré l'exigence DSP2), absence de gestion sécurisée des documents
sensibles. Ces écarts exposent KHS Bank à un risque de sanction réglementaire (ACPR, CNIL) et à un
risque opérationnel et réputationnel en cas d'incident.

### 5. Constats de l'audit cybersécurité

| # | Constat | Risque associé | Criticité |
|---|---|---|---|
| C1 | Absence de SOC/SIEM | Détection tardive ou absente des incidents de sécurité | Élevée |
| C2 | Absence de MFA (non-conformité DSP2) | Compromission de comptes facilitée, non-conformité réglementaire | Élevée |
| C3 | Absence de PRA/PCA formalisé | Incapacité à garantir la continuité d'activité en cas de sinistre | Élevée |
| C4 | Pas d'EDR/XDR centralisé sur les postes | Détection et réponse limitées face aux malwares avancés | Élevée |
| C5 | Documents sensibles non classifiés, sans GED sécurisée | Fuite de données, non-conformité RGPD/secret bancaire | Élevée |
| C6 | Absence de PSSI formalisée et diffusée | Pratiques de sécurité non homogènes, absence de référentiel opposable | Moyenne |
| C7 | Sensibilisation des utilisateurs insuffisante | Vulnérabilité accrue au phishing/ingénierie sociale | Moyenne |
| C8 | Absence de gestion des comptes à privilèges (PAM) | Risque d'abus ou de compromission de comptes administrateurs | Élevée |

Ces constats sont consolidés dans la conclusion de l'audit et traités par les lots
[D (antivirus/EDR)](../05-solutions/), [E (IDS/IPS)](../05-solutions/), [F (audit de sécurité)](../05-solutions/),
[G (PRA/PCA)](../05-solutions/), ainsi que par la [préparation de la cybersecurity framework et la mise en
place du SOC](../05-solutions/).

## Conclusion de l'audit — synthèse et priorisation

### Synthèse consolidée des constats

| # | Domaine | Constat | Criticité | Lot(s) associé(s) |
|---|---|---|---|---|
| R1 | Réseau | Switch cœur unique, sans redondance | Élevée | Lot A |
| R2 | Réseau | Pare-feu unique, absent à Lyon | Élevée | Lot A |
| R3 | Réseau | Lien VPN inter-sites unique, non redondant | Élevée | Lot A, Lot G |
| R4 | Réseau | FAI unique par site, sans secours | Élevée | Lot A |
| R5 | Réseau | Absence de segmentation/DMZ | Élevée | Lot A |
| S1 | Systèmes | Baie de stockage unique | Élevée | Lot 1 |
| S2 | Systèmes | Sauvegardes sans copie externalisée | Élevée | Lot 1, Lot G |
| S3 | Systèmes | SQL Server 2012 en fin de support (KHS-Core) | Élevée | Lot 5 |
| S4 | Systèmes | Exchange 2013 obsolète | Élevée | Lot 4 |
| S5 | Systèmes | Windows 8 / IE7-9 sur les postes | Élevée | Lot B, Lot J |
| S8 | Systèmes | Aucun RPO/RTO formalisé | Élevée | Lot G |
| C1 | Cybersécurité | Absence de SOC/SIEM | Élevée | SOC (§7 cahier des charges) |
| C2 | Cybersécurité | Absence de MFA (non-conformité DSP2) | Élevée | Lot F |
| C3 | Cybersécurité | Absence de PRA/PCA formalisé | Élevée | Lot G |
| C4 | Cybersécurité | Absence d'EDR/XDR centralisé | Élevée | Lot D |
| C5 | Cybersécurité | Documents sensibles non classifiés, sans GED | Élevée | Lot F / GED sécurisée |
| C8 | Cybersécurité | Absence de gestion des comptes à privilèges | Élevée | Lot F |
| R6 | Réseau | Équipements hors garantie | Moyenne | Lot A, Lot I |
| R7 | Réseau | Câblage vieillissant | Moyenne | Lot A |
| S6 | Systèmes | Absence d'outil centralisé de correctifs | Moyenne | Lot J |
| S7 | Systèmes | Absence d'outil de gestion de parc | Moyenne | Lot I |
| C6 | Cybersécurité | Absence de PSSI formalisée | Moyenne | Lot F |
| C7 | Cybersécurité | Sensibilisation insuffisante | Moyenne | Formation utilisateurs |

### Priorisation

Quatorze constats sont classés en criticité **élevée** : ils concernent en priorité la résilience du réseau
inter-sites, la continuité d'activité (PRA/PCA, sauvegarde), la détection des incidents (SOC/SIEM), le
contrôle des accès (MFA, PAM) et la protection des documents sensibles (GED sécurisée) — autant de
points directement liés aux exigences réglementaires (ACPR, DSP2, RGPD) du cahier des charges.

Cette priorisation guide l'ordre de traitement retenu dans les [propositions de solutions](../05-solutions/)
et sera reprise dans le diagramme de Gantt de la [gestion de projet](../03-gestion-de-projet/) pour
séquencer les lots à plus fort enjeu de conformité et de continuité en début de déploiement.

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# 5. Propositions de solutions

## Propositions de solutions

Chaque lot du cahier des charges est traité
individuellement, avec un fil conducteur cohérent :

- **Réseau** : Cisco (cœur/distribution/accès) + Fortinet (pare-feu/IPS), en cohérence avec le parc
  existant et les compétences de l'équipe Réseau & Sécurité.
- **Virtualisation & stockage** : VMware vSphere + Veeam Backup & Replication, pour un cluster haute
  disponibilité répliqué entre les deux sites (socle du PRA/PCA).
- **Identité, bureautique & sécurité applicative** : socle **Microsoft 365 E5 / Microsoft Entra ID**
  (ex-Azure AD) — bureautique, messagerie, IAM/MFA, EDR (Defender for Endpoint), protection des
  données (Purview DLP) et GED sécurisée s'appuient sur la **même plateforme**, ce qui simplifie
  l'administration, réduit le nombre d'éditeurs et permet une intégration native avec le SOC.
- **Supervision & SOC** : **Microsoft Sentinel** (SIEM/SOAR avec détection assistée par IA — UEBA), au
  cœur de l'expertise IA de MOM-TECH, complété par PRTG/Zabbix pour la supervision infrastructure et
  GLPI pour la gestion de parc et le ticketing.

Ce choix limite la fragmentation technologique (un nombre d'éditeurs réduit = moins de failles
d'intégration, conformément au constat d'audit sur l'hétérogénéité du SI existant) tout en couvrant
l'ensemble des exigences réglementaires (RGPD, ACPR, DSP2, PCI-DSS) identifiées dans l'audit.

### Lots principaux

| Lot | Objet | Solution retenue | Constats traités |
|---|---|---|---|
| A | Architecture réseau, DHCP/DNS | Cisco Catalyst 9000 + Fortinet FortiGate HA, VLAN/DMZ, double lien FAI | R1-R7 |
| B | Postes clients (léger/lourd) | Windows 11 + VDI (VMware Horizon) pour le back-office | S5 |
| C | Bureautique Office 365 + identité | Microsoft 365 E5, Entra ID hybride, Conditional Access MFA | S5, C2 |
| D | Antivirus/EDR centralisé | Microsoft Defender for Endpoint (XDR) | C4 |
| E | Système de prévention d'intrusion | Fortinet IPS (FortiGate) + Defender complémentaire | R5, C1 |
| F | Audit de sécurité + GED sécurisée | Méthodologie d'audit continue + Microsoft Purview (GED, DLP, PAM/PIM) | C2, C5, C6, C8 |
| G | PRA / PCA | Cluster VMware répliqué + Veeam, RPO/RTO définis | S1, S2, S8, C3 |
| H | Monitoring et ticketing | PRTG/Zabbix + GLPI | S6, S7 |
| I | Gestion de parc et contrat de maintenance | GLPI + contrat de maintenance MOM-TECH | S7, R6 |
| J | Déploiements et mises à jour | Microsoft Intune + WSUS | S6 |

### Lots complémentaires

| Lot | Objet | Solution retenue | Traitement |
|---|---|---|---|
| 1 | Stockage et sauvegarde | Baies répliquées + Veeam (règle 3-2-1-1), copie immuable cloud | **Approfondi** (constats S1/S2) |
| 2 | Annuaire LDAP | Active Directory modernisé + Entra ID Connect | Synthétique |
| 3 | Virtualisation | Cluster VMware vSphere HA/DRS | Synthétique |
| 4 | Messagerie | Exchange Online + Defender for Office 365 | Synthétique |
| 5 | Bases de données | SQL Server 2022 Always On (KHS-Core), Oracle 19c | Synthétique |
| 6 | VOIP | Microsoft Teams Phone + SBC | Synthétique |

> Conformément au cahier des charges (§4.4), **le lot 1 (Stockage et sauvegarde)** est le lot
> complémentaire approfondi : il répond aux constats d'audit les plus critiques (baie unique, sauvegarde
> sans copie externalisée) et conditionne directement le PRA/PCA. Sa [procédure de mise en œuvre
> détaillée](../09-procedures/) est fournie dans la section Procédures.

### Cybersécurité (hors lots A-J)

- Préparation de la cybersecurity framework et mise en place du SOC
  (cahier des charges §5, §6, §7)

## Lot A — Architecture réseau (switches, routeurs, DMZ, accès distants) et services DHCP/DNS

### Constats traités

R1 (switch cœur unique), R2 (pare-feu unique), R3 (VPN non redondant), R4 (FAI unique), R5 (absence de
segmentation/DMZ), R6 (équipements hors garantie), R7 (câblage vieillissant) — cf.
audit réseau.

### Solution proposée

#### Cœur et distribution

- **Cœur de réseau (N3)** : 2 × Cisco Catalyst 9300 en **stack (StackWise Virtual)** par site → élimine le
  point de défaillance unique R1.
- **Distribution** : Cisco Catalyst 9200, redondance des uplinks vers le cœur.
- **Accès** : Cisco Catalyst 9200L PoE+ (alimentation des bornes Wi-Fi et futurs postes Teams Phone,
  cf. Lot 6).

#### Sécurité périmétrique

- **Pare-feu** : cluster **Fortinet FortiGate 200F en haute disponibilité (HA actif/passif)** sur chaque
  site (siège **et** Lyon, corrigeant R2) intégrant le module IPS (cf. Lot E).
- **DMZ** dédiée pour les services exposés (portail intranet/extranet), isolée du réseau interne et des
  flux bancaires — corrige R5.

#### Segmentation

Plan d'adressage VLAN unifié entre les deux sites :

| VLAN | Usage | Isolation |
|---|---|---|
| VLAN 10 | Postes bureautique | ACL inter-VLAN restrictives |
| VLAN 20 | Application bancaire KHS-Core | Isolé, accès filtré par pare-feu applicatif |
| VLAN 30 | Serveurs | Isolé, accès administrateurs uniquement |
| VLAN 40 | Wi-Fi invités | Accès Internet uniquement, aucun accès au LAN interne |
| VLAN 50 | Téléphonie (VOIP) | QoS dédiée |
| VLAN 99 | Management des équipements | Accès restreint (bastion/PAM, cf. Lot F) |

#### Connectivité et redondance

- **Liaison inter-sites** : 2 tunnels IPsec redondants entre Paris et Lyon, sur deux fournisseurs d'accès
  distincts (corrige R3 et R4), avec bascule automatique par routage à métrique.
- **Accès Internet** : double lien FAI par site (opérateur principal + opérateur de secours).
- **DHCP/DNS** : services Windows en **DHCP failover** (un serveur par site, réplication de la base de
  baux) et DNS répliqué sur les deux contrôleurs de domaine (cf. Lot 2).
- **Câblage** : remplacement du câblage catégorie 5e par du **catégorie 6A**, corrigeant R7.

### Justification du choix

Le maintien de la marque **Cisco** pour le réseau capitalise sur les compétences déjà en place chez KHS
Bank et limite la courbe d'apprentissage pour l'équipe interne qui reprendra l'exploitation en fin de
projet (cf. risque **P12**). Le choix **Fortinet** pour la sécurité périmétrique s'appuie sur sa forte
intégration avec Fortinet FortiAnalyzer, dont les journaux alimenteront directement le SIEM
(cf. Microsoft Sentinel).

### Bénéfices attendus

- Suppression de tous les points de défaillance unique identifiés lors de l'audit.
- Réduction de la surface d'attaque par segmentation stricte des flux bancaires.
- Conformité à l'exigence contractuelle de non-interruption des services de paiement.

## Lot B — Déploiement des postes clients : client léger / client lourd

### Constat traité

S5 (Windows 8 obsolète, navigateurs non sécurisés, parc hétérogène) — cf.
audit systèmes.

### Solution proposée

Une approche **mixte client léger / client lourd**, selon le profil d'usage :

| Profil | Population | Solution |
|---|---|---|
| Métiers sensibles (conseillers clientèle, back-office, gestion de patrimoine) | ≈ 600 postes | **Client léger / VDI** (VMware Horizon), aucune donnée bancaire stockée localement |
| Fonctions support et nomades (commerciaux, direction, IT) | ≈ 320 postes | **Client lourd** Windows 11 Entreprise LTSC, chiffrement BitLocker |

- Image système standardisée, déployée via **Microsoft Intune / MDT** (cf. Lot J).
- Suite bureautique unifiée : **Microsoft 365 Apps** (cf. Lot C).
- Navigateur unique et à jour (Microsoft Edge, mises à jour automatiques).
- Postes clients légers administrés depuis le datacenter (cluster VMware, cf. Lot 3) :
  aucune information client persistée sur le poste physique, ce qui réduit fortement le risque en cas de
  vol ou perte de matériel — un point fort en environnement bancaire.

### Justification

Le client léger pour les métiers manipulant des données clients sensibles répond directement à
l'exigence de confidentialité du secret bancaire et facilite la conformité RGPD/PCI-DSS (les données ne
transitent jamais au-delà de l'environnement contrôlé du datacenter). Le client lourd reste réservé aux
usages nécessitant de la mobilité ou une puissance de calcul locale, où le VDI apporterait plus de
contraintes que de bénéfices.

### Bénéfices attendus

- Fin de l'hétérogénéité du parc et de l'exposition liée à Windows 8/IE7-9.
- Réduction du risque de fuite de données sur les postes exposés (vol, perte).
- Simplification du support (image standard, déploiement centralisé).

## Lot C — Migration des logiciels de bureautique vers Office 365

### Constats traités

S5 (suites bureautiques hétérogènes et obsolètes), C2 (absence de MFA, non-conformité DSP2) — cf.
audit systèmes et audit cybersécurité.

### Solution proposée

#### Bureautique

Migration de l'ensemble des postes vers **Microsoft 365 E5**, incluant les applications bureautiques
(Word, Excel, PowerPoint, Outlook), Teams (collaboration et visioconférence) et SharePoint/OneDrive
(stockage collaboratif, socle de la GED sécurisée du lot F).

Le choix de la licence **E5** (plutôt que E3) est justifié par l'inclusion native des briques de sécurité
utilisées dans les lots suivants (Defender for Endpoint, Defender for Office 365, Purview) : un seul
contrat, une seule console d'administration, une intégration native — cohérent avec le constat d'audit
sur la dispersion des outils de sécurité.

#### Identité (IAM)

Mise en place d'une **identité hybride** :

- **Active Directory** on-premise conservé comme source de vérité (cf. Lot 2) ;
- synchronisation vers **Microsoft Entra ID** (ex-Azure AD) via Entra Connect ;
- **Conditional Access** imposant une **authentification multifacteur (MFA)** pour tous les accès aux
  ressources Microsoft 365 et, via Entra ID Application Proxy, pour les accès distants aux applications
  internes — corrige directement le constat **C2** (non-conformité DSP2 sur l'authentification forte).

#### Migration

- Déploiement pilote sur un service représentatif (20 utilisateurs), puis généralisation par vagues de
  150 utilisateurs afin de limiter l'impact sur l'activité (cf. [plan de migration](../07-migration/)).
- Conversion des documents Excel hérités (modèles de simulation financière en échec, cf. cahier des
  charges §2.3) via un contrôle de compatibilité avant bascule.

### Justification

Une plateforme unique pour la bureautique **et** l'identité réduit le nombre d'annuaires et de points
d'authentification à sécuriser, simplifie l'audit des accès (exigence ACPR) et permet un déploiement du
MFA sans solution tierce supplémentaire.

### Bénéfices attendus

- Fin des incompatibilités entre versions de suites bureautiques.
- Mise en conformité DSP2 (authentification forte) dès ce lot.
- Base d'identité unifiée pour l'ensemble des lots de sécurité qui suivent.

## Lot D — Solution antivirus centralisée (EDR/XDR)

### Constat traité

C4 (absence d'EDR/XDR centralisé, antivirus géré poste par poste) — cf.
audit cybersécurité.

### Solution proposée

Déploiement de **Microsoft Defender for Endpoint (Plan 2)**, inclus dans les licences Microsoft 365 E5
attribuées au Lot C, sur l'ensemble des postes clients (légers et lourds) et
des serveurs Windows :

- détection comportementale et analyse des menaces avancées (au-delà de la signature antivirus
  classique) ;
- **remédiation automatique** des menaces détectées (isolation du poste, arrêt de processus) ;
- **console unique** centralisée, intégrée nativement au SIEM (cf. Microsoft Sentinel)
  pour la corrélation d'alertes ;
- couverture des serveurs Linux (agent Defender for Linux) pour les deux serveurs hébergeant les
  applications de gestion administrative.

### Justification

L'intégration native avec l'identité Entra ID et le SIEM Sentinel permet de corréler automatiquement une
alerte EDR avec un événement d'authentification suspect — une capacité de détection croisée qui
s'inscrit dans l'approche IA de MOM-TECH (détection d'anomalies comportementales) et répond
directement au constat **C1** (absence de SOC) traité par ailleurs.

### Bénéfices attendus

- Détection et réponse centralisées sur l'ensemble du parc (920 postes, ~15 serveurs).
- Réduction du délai moyen de détection d'un incident (MTTD) par la corrélation SIEM.
- Conformité renforcée avec les exigences ACPR de sécurisation des postes de travail.

## Lot E — Système de prévention d'intrusion (IDS/IPS)

### Constats traités

R5 (absence de segmentation/DMZ), C1 (absence de détection) — cf. audits
réseau et cybersécurité.

### Solution proposée

- Activation du module **IPS natif des pare-feu Fortinet FortiGate** (cf. Lot A)
  en coupure sur l'ensemble des flux inter-VLAN et sur les flux entrants/sortants Internet, sur les deux
  sites.
- Signatures mises à jour automatiquement (FortiGuard), avec profils de protection renforcés sur le
  **VLAN 20 (application bancaire KHS-Core)** et la DMZ.
- Journaux IPS envoyés vers **Microsoft Sentinel** (cf. SOC) pour
  corrélation avec les événements EDR et identité.
- Positionnement complémentaire d'une sonde de détection réseau (NDR) sur le cœur de réseau du siège
  pour la détection de mouvements latéraux, alimentant également le SIEM.

### Justification

Intégrer l'IPS directement dans les pare-feu déjà retenus au Lot A évite d'ajouter un boîtier
supplémentaire (réduction des coûts et de la complexité d'exploitation), tout en conservant une
détection en coupure sur tous les flux sensibles. La centralisation des journaux vers le SIEM permet de
traiter ce lot non comme un silo technique isolé, mais comme une source d'alerte parmi d'autres dans la
stratégie de détection globale du SOC.

### Bénéfices attendus

- Blocage en temps réel des tentatives d'intrusion sur les flux bancaires.
- Visibilité consolidée des tentatives d'intrusion au sein du SOC.

## Lot F — Audit de sécurité (et gestion électronique de documents sécurisée)

### Constats traités

C2 (absence de MFA), C5 (documents sensibles non classifiés, absence de GED), C6 (absence de PSSI
formalisée), C8 (absence de gestion des comptes à privilèges) — cf.
audit cybersécurité.

### 1. Méthodologie d'audit de sécurité continue

Au-delà de l'audit initial (cf. [Audit de l'existant](../04-audit-existant/)), MOM-TECH met en place un
cycle d'audit récurrent, conforme à la démarche d'amélioration continue ITIL v4 :

- audit annuel des règles de pare-feu / ACL / NAT ;
- tests d'intrusion (pentest) externes annuels, réalisés par un prestataire indépendant, conformément
  aux recommandations ANSSI ;
- revue trimestrielle des droits d'accès (comptes dormants, privilèges excessifs) ;
- rédaction/mise à jour de la **Politique de Sécurité du Système d'Information (PSSI)**, diffusée et
  signée par l'ensemble des collaborateurs — corrige **C6**.

### 2. Gestion électronique de documents (GED) sécurisée

#### Contexte

L'audit a révélé que les documents internes sensibles de KHS Bank (dossiers de crédit, pièces KYC,
rapports de conformité) sont stockés sur un serveur de fichiers classique, sans classification ni
traçabilité des accès (constat **C5**). Cette lacune expose l'établissement à un risque de fuite de
données et à une non-conformité RGPD/secret bancaire.

#### Solution proposée

Mise en place d'une GED sécurisée s'appuyant sur **SharePoint Online / OneDrive Entreprise**
(inclus dans le socle Microsoft 365 E5 du Lot C), enrichie par
**Microsoft Purview** :

- **Classification des documents** par niveau de confidentialité (public interne / restreint / confidentiel)
  via des étiquettes de sensibilité (*sensitivity labels*) appliquées automatiquement selon le contenu
  détecté (ex. numéro de compte, IBAN, pièce d'identité) ;
- **Contrôle d'accès basé sur les rôles (RBAC)**, aligné sur le modèle vu dans les projets de
  dématérialisation documentaire comparables (rédacteur, validateur, administrateur, auditeur) ;
- **Chiffrement au repos et en transit**, natif à la plateforme ;
- **Data Loss Prevention (DLP)** : blocage ou alerte automatique en cas de tentative d'envoi externe
  d'un document classé confidentiel ;
- **Journal d'audit immuable** (Microsoft Purview Audit), consultable par les auditeurs internes et
  externalisable vers le SIEM pour investigation en cas d'incident ;
- **Workflow de validation** pour les documents sensibles (dépôt → vérification → validation →
  publication), sur le même principe que les circuits de double validation documentaire.

#### Gestion des comptes à privilèges (PAM)

Mise en place de **Microsoft Entra Privileged Identity Management (PIM)** : élévation de privilèges
temporaire et justifiée pour les comptes administrateurs (réseau, systèmes, sécurité), avec approbation
et journalisation systématiques — corrige **C8**.

### Justification

Ce choix évite de déployer une GED spécifique supplémentaire (coût, intégration, formation) en
s'appuyant sur la plateforme Microsoft 365 déjà retenue pour la bureautique et l'identité : la
classification, le DLP et l'audit documentaire héritent directement de l'IAM (Entra ID) et du SIEM
(Sentinel) déjà en place, pour une cohérence d'ensemble et une charge d'exploitation réduite.

### Bénéfices attendus

- Protection renforcée des documents bancaires sensibles, conforme RGPD et secret bancaire.
- Traçabilité complète des accès et des modifications, exploitable en cas de contrôle ACPR.
- Réduction du risque d'abus de privilèges administrateur.

## Lot G — PRA / PCA

### Constats traités

S1 (baie de stockage unique), S2 (sauvegardes sans copie externalisée), S8 (aucun RPO/RTO formalisé),
C3 (absence de PRA/PCA) — cf. audits systèmes et
cybersécurité.

### Solution proposée

#### Plan de Continuité d'Activité (PCA) — RTO = RPO = 0

- **Cluster VMware vSphere HA/DRS** réparti entre le siège et un second équipement à Lyon : bascule
  automatique des machines virtuelles en cas de panne d'un hôte, sans interruption perceptible.
- **Pare-feu et routeurs en haute disponibilité** (cf. Lot A) : bascule
  automatique en cas de défaillance d'un équipement.
- **Onduleurs** redimensionnés avec test de coupure trimestriel documenté.
- **Double lien FAI et double tunnel VPN** (cf. Lot A) : continuité de
  l'accès réseau en cas de rupture d'un lien.

#### Plan de Reprise d'Activité (PRA) — RTO > 0, RPO ≥ 0

- **Réplication du stockage** entre la baie principale (siège) et une baie secondaire (Lyon) via **Veeam
  Backup & Replication**, en réplication asynchrone toutes les 15 minutes pour les VM critiques
  (KHS-Core, Active Directory, messagerie).
- **Sauvegardes** selon la règle **3-2-1-1** (cf. détail dans le
  Lot 1 — Stockage et sauvegarde) :
  3 copies, sur 2 supports différents, 1 copie hors site, 1 copie immuable (protection anti-rançongiciel).

#### RPO / RTO définis par service

| Service | RPO | RTO |
|---|---|---|
| Application bancaire KHS-Core | 15 min | 1 h |
| Active Directory / DNS / DHCP | 15 min | 30 min |
| Messagerie (Exchange Online) | Géré par Microsoft (SLA 99,9 %) | Géré par Microsoft |
| Serveur de fichiers / GED | 1 h | 2 h |
| Réseau (cœur, pare-feu, VPN) | 0 | 0 (bascule automatique) |

### Justification

Le choix d'un cluster VMware réparti entre les deux sites transforme le site de Lyon, jusqu'ici simple
site secondaire dépendant du siège, en un véritable site de secours actif — condition nécessaire pour
répondre aux exigences de continuité formulées par l'ACPR pour un établissement bancaire.

### Bénéfices attendus

- Continuité de service garantie sur les composants réseau et virtualisation (RTO=0).
- Reprise d'activité rapide et maîtrisée sur les services applicatifs critiques.
- Conformité aux exigences de résilience du secteur bancaire.

## Lot H — Monitoring et ticketing

### Constat traité

S6 (absence d'outil centralisé de gestion des correctifs et de supervision) — cf.
audit systèmes.

### Solution proposée

- **Supervision infrastructure** : **PRTG Network Monitor**, supervision des équipements réseau
  (cf. Lot A), des serveurs et du cluster de virtualisation
  (cf. Lot 3), avec seuils d'alerte et tableaux de bord
  partagés avec la DSI de KHS Bank.
- **Ticketing / gestion des incidents** : **GLPI**, aligné sur les pratiques ITIL v4 *Incident Management*
  et *Problem Management* : catégorisation des tickets par lot, SLA par criticité, base de connaissance
  partagée avec le Lot I.
- Remontée automatique des alertes critiques (rupture de lien, panne matérielle) vers le SOC
  (cf. cybersecurity framework et SOC) pour distinguer un incident
  d'exploitation d'un incident de sécurité.

### Justification

GLPI, déjà retenu pour l'inventaire du parc au Lot I, sert
également de plateforme de ticketing : un seul outil pour la gestion du parc et des incidents simplifie
l'exploitation par l'équipe interne de KHS Bank après transfert de compétences (cf. risque **P12**).

### Bénéfices attendus

- Détection proactive des anomalies avant impact utilisateur.
- Traçabilité complète du traitement des incidents, exploitable pour le reporting ACPR.

## Lot I — Gestion de parc informatique et contrat de maintenance

### Constats traités

S7 (absence d'outil de gestion de parc), R6 (équipements hors garantie) — cf.
[audits systèmes et réseau](../04-audit-existant/).

### Solution proposée

- **GLPI** comme outil unique de gestion de parc (matériel et logiciel), couplé au module ticketing du
  Lot H : inventaire automatique (agent FusionInventory), suivi des
  garanties, des licences et des contrats fournisseurs.
- **Contrat de maintenance MOM-TECH** couvrant :
  - maintenance préventive (supervision, application des correctifs, contrôle des sauvegardes) ;
  - maintenance corrective (intervention sur incident, SLA par criticité) ;
  - astreinte pour les composants critiques identifiés au PRA/PCA ;
  - reporting mensuel des indicateurs de service (disponibilité, incidents, tickets traités).

Le détail contractuel (niveaux de service, pénalités, durée) est présenté dans le
[bilan financier et la recette](../08-bilan-financier-recette/).

### Justification

Un inventaire centralisé et à jour est la condition préalable à toute politique de renouvellement matériel
maîtrisée : il permet d'anticiper les fins de garantie (constat **R6**) avant qu'elles ne deviennent un
risque opérationnel.

### Bénéfices attendus

- Visibilité complète et permanente sur l'état du parc.
- Anticipation du renouvellement matériel, réduction des ruptures de garantie.

## Lot J — Déploiements et mises à jour (OS et applications)

### Constat traité

S6 (absence d'outil centralisé de gestion des correctifs) — cf.
audit systèmes.

### Solution proposée

- **Microsoft Intune** pour la gestion des postes clients (cf. Lot B) :
  déploiement d'image, politiques de conformité, mise à jour automatique de Windows 11 et des
  applications Microsoft 365.
- **WSUS** relié à Intune pour la maîtrise du séquencement des correctifs sur les serveurs Windows
  (validation en environnement de test avant déploiement en production).
- Fenêtres de maintenance planifiées hors heures d'ouverture pour les mises à jour serveurs, avec
  procédure de retour arrière (cf. gestion des changements ITIL).

### Justification

L'intégration Intune/Entra ID (cf. Lot C) permet un déploiement conditionné
à la conformité du poste (chiffrement actif, antivirus à jour) avant tout accès aux ressources sensibles —
un principe de sécurité *zero trust* cohérent avec les exigences bancaires.

### Bénéfices attendus

- Réduction du délai moyen de correction des vulnérabilités.
- Conformité systématique des postes avant accès aux données sensibles.

## Lots complémentaires

Conformément au cahier des charges (§4.4), le **lot 1 (Stockage et sauvegarde)** est le lot complémentaire
retenu pour un traitement approfondi ; les lots 2 à 6 sont traités de façon synthétique mais justifiée.

### Lot 1 - Stockage et sauvegarde (lot approfondi)

#### Constats traités

S1 (baie de stockage unique), S2 (sauvegardes sans copie externalisée) — cf.
audit systèmes. Ce lot conditionne directement le
PRA/PCA (Lot G).

#### Architecture cible

- **Baie de stockage principale** (siège) : baie SAN hybride (SSD + HDD), dimensionnée avec 40 % de
  marge d'évolution sur 5 ans.
- **Baie de stockage secondaire** (Lyon) : réplication asynchrone en continu des volumes critiques via
  **Veeam Backup & Replication**, dans le cadre du cluster VMware réparti (cf.
  [Lot 3](#lot-3---virtualisation) et Lot G).
- **Règle de sauvegarde 3-2-1-1** :
  - **3** copies des données (production + 2 sauvegardes) ;
  - sur **2** supports différents (disque sur baie secondaire + stockage objet immuable) ;
  - **1** copie hors site (réplication vers le site de Lyon, physiquement distinct du siège) ;
  - **1** copie **immuable** (verrouillée en écriture pendant une durée définie, sur un stockage objet type
    Azure Blob avec *immutability policy*) — protection déterminante contre les rançongiciels, qui ciblent
    en priorité les sauvegardes accessibles en écriture.
- Suppression des robots de sauvegarde sur bandes conservées en sous-sol (constat S2) au profit de ce
  schéma disque + cloud.
- **Tests de restauration trimestriels documentés**, avec procès-verbal archivé — condition nécessaire
  pour qu'un PRA soit considéré comme opérationnel (« une sauvegarde non testée n'est pas une
  sauvegarde »).

#### Fréquences et rétention

| Type de donnée | Fréquence de sauvegarde | Rétention |
|---|---|---|
| VM critiques (KHS-Core, AD, GED) | Réplication continue (15 min) + snapshot quotidien | 30 jours (quotidien), 12 mois (mensuel) |
| Serveur de fichiers / autres VM | Sauvegarde quotidienne incrémentale | 90 jours |
| Archives réglementaires (relevés, contrats) | Sauvegarde hebdomadaire | Conforme aux durées légales de conservation bancaire |

> La procédure complète et détaillée de mise en œuvre de ce lot (configuration Veeam, politique de
> réplication, test de restauration) est fournie dans la section [Procédures](../09-procedures/).

### Lot 2 - Annuaire LDAP

Modernisation de l'**Active Directory** existant (niveau fonctionnel de forêt mis à jour), avec un
contrôleur de domaine par site en haute disponibilité et synchronisation vers **Microsoft Entra ID**
(cf. Lot C) pour l'identité hybride. Politique de mots de passe renforcée
(longueur, complexité, verrouillage après échecs) et désactivation automatisée des comptes inactifs.

### Lot 3 - Virtualisation

**Cluster VMware vSphere (HA/DRS)** réparti entre le siège et Lyon, socle du PRA/PCA (Lot G).
Bascule automatique des machines virtuelles en cas de panne d'un hôte physique ; répartition de charge
dynamique (DRS) pour absorber les pics d'activité (ex. clôtures comptables mensuelles).

### Lot 4 - Messagerie

Migration d'**Exchange 2013** vers **Exchange Online** (Microsoft 365 E5, cf. Lot C),
avec **Microsoft Defender for Office 365** pour le filtrage anti-phishing et anti-malware — un point
d'entrée majeur des attaques ciblant le secteur bancaire. Archivage légal des messages conforme aux
durées de conservation réglementaires (ACPR).

### Lot 5 - Bases de données

- Migration de **SQL Server 2012** (base de l'application métier KHS-Core) vers **SQL Server 2022** en
  configuration **Always On Availability Group** entre le siège et Lyon, pour la haute disponibilité de
  l'application bancaire.
- Montée de version des bases **Oracle** hébergées sur les deux serveurs Linux (gestion administrative,
  financière, paye).
- Outils collaboratifs : **SharePoint Online / Microsoft Teams** (cf. Lot C
  et GED sécurisée du Lot F).

### Lot 6 - VOIP

Bascule de la téléphonie vers **Microsoft Teams Phone**, cohérente avec l'investissement Microsoft 365
déjà retenu, complétée par un **SBC (Session Border Controller)** pour l'interconnexion avec le réseau
téléphonique commuté (RTC). VLAN dédié et QoS assurés par les équipements réseau du
Lot A.

## Préparation de la cybersecurity framework et mise en place du SOC

*Répond aux sections 5, 6 et 7 du cahier des charges KHS Bank.*

### 1. Cybersecurity framework

#### Politique et procédures de cybersécurité

MOM-TECH élabore, en collaboration avec le RSSI de KHS Bank, l'ensemble des documents de gouvernance
attendus :

- **Politique de Sécurité du Système d'Information (PSSI)**, structurée selon les grands domaines de la
  norme **ISO 27001** (contrôle d'accès, cryptographie, sécurité physique, continuité, conformité) ;
- **Procédure de gestion des incidents de sécurité**, alignée sur la pratique ITIL v4 *Incident
  Management* ;
- **Procédure de révocation des accès** (départ, changement de poste), intégrée au workflow RH-DSI ;
- **Registre des traitements** (RGPD) et **cartographie des données** sensibles, en cohérence avec la
  GED sécurisée du Lot F.

#### Plan de gestion de la cyber-crise

Un plan de gestion de crise cyber est formalisé, couvrant :

- la **cellule de crise** (RSSI, DSI, Direction Générale, MOM-TECH, communication) et son mode
  d'activation ;
- les **scénarios de crise** prioritaires pour un établissement bancaire : rançongiciel, fuite de données
  clients, indisponibilité des moyens de paiement, fraude massive ;
- la **procédure de notification** réglementaire (CNIL sous 72h en cas de violation de données, ACPR
  pour tout incident majeur affectant les services bancaires) ;
- des **exercices de crise** semestriels (simulation d'incident) pour tester la procédure en conditions
  réelles.

### 2. Mise en place du SOC (Security Operations Center)

#### Architecture du SOC

Le SOC repose sur **Microsoft Sentinel**, SIEM/SOAR cloud natif, alimenté par l'ensemble des sources de
journalisation mises en place dans les lots précédents :

```
        Sources d'événements                         SOC (Microsoft Sentinel)
   ┌─────────────────────────────┐             ┌─────────────────────────────┐
   │ Fortinet FortiGate (Lot A/E) │────────────▶│                             │
   │ Defender for Endpoint (Lot D)│────────────▶│   Corrélation d'événements  │
   │ Entra ID / Conditional Access│────────────▶│   Détection assistée par IA │
   │ (Lot C)                      │             │   (UEBA — analyse compor-   │
   │ Microsoft Purview (Lot F)    │────────────▶│   tementale utilisateurs)   │
   │ Exchange Online / Defender   │────────────▶│                             │
   │ for Office 365 (Lot 4)       │             │   Playbooks de réponse      │
   │ Journaux serveurs / GLPI     │────────────▶│   automatisée (SOAR)        │
   └─────────────────────────────┘             └──────────────┬──────────────┘
                                                                │
                                                      Analystes SOC MOM-TECH
                                                      (astreinte 24/7 sur
                                                       incidents critiques)
```

L'exploitation de l'**intelligence artificielle** (analyse comportementale — UEBA) permet de détecter des
scénarios spécifiques au secteur bancaire : connexions atypiques à des heures inhabituelles,
enchaînement de transactions suspectes dans KHS-Core, exfiltration massive de documents depuis la GED
— un axe différenciant porté par le pôle IA & Data de MOM-TECH.

#### Planning préliminaire de réalisation

| Étape | Contenu | Phase du projet |
|---|---|---|
| Instrumentation | Connexion des sources (pare-feu, EDR, identité, messagerie) à Sentinel | Déploiement |
| Corrélation | Activation des règles de détection et des playbooks SOAR | Déploiement |
| Astreinte | Mise en place du support 24/7 sur incidents critiques | Tests/Recette |
| Amélioration continue | Ajustement des règles selon les faux positifs constatés | Post-migration |

#### Plan de test global

Tests de bout en bout par scénario (ex. simulation de compromission d'un compte, exfiltration de
document confidentiel) afin de valider la remontée d'alerte, le délai de détection et l'efficacité des
playbooks de réponse automatisée.

#### Plan de formation et contrat de support

- Formation des équipes internes KHS Bank à la lecture des tableaux de bord SOC et à la procédure
  d'escalade (cf. formation utilisateurs) ;
- Contrat de support MOM-TECH incluant l'astreinte SOC, détaillé dans le
  [bilan financier](../08-bilan-financier-recette/).

#### Démonstration sur plateforme de test

Une démonstration du SOC est réalisée en environnement de recette avant mise en production, avec
injection d'événements de test (simulation d'attaque) pour valider la chaîne complète de détection et de
réponse.

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# 6. Architecture cible

## Architecture cible

Cette section consolide, sous forme de schémas, l'ensemble des choix justifiés dans les
[propositions de solutions](../05-solutions/) :

- Architecture réseau cible — schéma des deux sites, segmentation VLAN,
  plan d'adressage (VLSM).
- Architecture systèmes cible — salle serveurs, cluster de
  virtualisation, stockage et réplication.
- Architecture sécurité cible — identité, EDR, SOC/SIEM, GED sécurisée,
  logique d'accès *zero trust*.

### Principe directeur de l'architecture

L'architecture cible répond à trois principes, directement issus des constats d'audit et des contraintes
du cahier des charges :

1. **Aucun point de défaillance unique** sur les composants critiques (réseau, accès Internet, pare-feu,
   virtualisation, stockage) — traite l'ensemble des constats R1 à R5 et S1.
2. **Isolation stricte des flux bancaires** par segmentation VLAN et filtrage applicatif, du poste client
   jusqu'à la base de données KHS-Core.
3. **Sécurité intégrée dès la conception** (*security by design*) : identité, chiffrement, journalisation et
   détection sont pensés comme un ensemble cohérent (socle Microsoft 365 E5/Entra ID + Sentinel), non
   comme des briques ajoutées après coup.

## Architecture réseau cible

### 1. Schéma d'ensemble

```
                         FAI Principal          FAI Secours
                        (Orange Business)        (SFR Pro)
                              │                       │
                    ┌─────────┴───────────┬───────────┴─────────┐
                    │                                             │
            ┌───────┴────────┐                            ┌───────┴────────┐
            │  Cluster HA     │                            │  Cluster HA     │
            │  FortiGate 200F │◀──── 2 tunnels IPsec ─────▶│  FortiGate 200F │
            │  (siège Paris)  │      redondants (VPN)       │  (site Lyon)    │
            └───────┬────────┘                            └───────┬────────┘
                    │                                             │
              ┌─────┴─────┐                                 ┌─────┴─────┐
              │    DMZ     │                                 │  (pas de   │
              │ (portail   │                                 │   DMZ,     │
              │ intranet/  │                                 │  back-     │
              │ extranet)  │                                 │  office)   │
              └─────┬─────┘                                 └─────┬─────┘
                    │                                             │
        ┌───────────┴───────────┐                       ┌─────────┴─────────┐
        │  Stack Cisco Catalyst  │                       │  Stack Cisco       │
        │  9300 (cœur N3, HA)    │                       │  Catalyst 9300     │
        └───────────┬───────────┘                       │  (cœur N3, HA)     │
                    │                                    └─────────┬─────────┘
        ┌───────────┴───────────┐                                 │
        │ Catalyst 9200 (distri) │                       Catalyst 9200 (distri)
        └───────────┬───────────┘                                 │
       ┌─────────────┼─────────────┐                    ┌──────────┴──────────┐
   Accès (postes) Accès (Wi-Fi) Accès (VOIP)         Accès (postes)      Accès (Wi-Fi/VOIP)
   VLAN 10/20      VLAN 40       VLAN 50              VLAN 10/20 Lyon     VLAN 40/50 Lyon
        │
   VLAN 30 (serveurs) ── Cluster VMware / stockage (cf. architecture systèmes)
   VLAN 99 (management) ── accès administrateurs via bastion PAM
```

Chaque site dispose désormais de son propre cluster de pare-feu en haute disponibilité, de son propre
double lien Internet et de son propre cœur de réseau redondant — supprimant la dépendance totale du
site de Lyon envers le siège constatée lors de l'audit (constats R2, R3, R4).

### 2. Segmentation VLAN

| VLAN | Usage | Isolation appliquée |
|---|---|---|
| 10 | Postes bureautique | ACL inter-VLAN, accès Internet filtré (proxy Fortinet) |
| 20 | Application bancaire KHS-Core | Isolé, accès filtré par règles pare-feu applicatives strictes |
| 30 | Serveurs / cluster de virtualisation | Accès restreint aux seuls flux applicatifs et à l'administration |
| 40 | Wi-Fi invités | Accès Internet uniquement, aucune route vers le LAN interne |
| 50 | Téléphonie (VOIP / Teams Phone) | QoS dédiée, VLAN voix séparé du VLAN données |
| 99 | Management des équipements | Accès via bastion PAM (Entra PIM), authentification forte obligatoire |

### 3. Plan d'adressage (VLSM)

KHS Bank dispose d'un plan d'adressage privé en **10.0.0.0/8**, décliné par site puis par VLAN selon la
méthode VLSM (*Variable Length Subnet Masking*), afin d'allouer à chaque segment une taille de
sous-réseau adaptée à son nombre réel d'hôtes, sans gaspillage d'adresses.

#### Site Paris (siège) — bloc 10.10.0.0/16

| VLAN | Besoin (hôtes) | Sous-réseau alloué | Masque | Hôtes utilisables | Plage utile |
|---|---:|---|---|---:|---|
| 10 — Bureautique | 780 (+ marge) | 10.10.0.0/22 | 255.255.252.0 | 1022 | 10.10.0.1 – 10.10.3.254 |
| 20 — Bancaire (KHS-Core) | ≤ 50 | 10.10.4.0/26 | 255.255.255.192 | 62 | 10.10.4.1 – 10.10.4.62 |
| 30 — Serveurs | ≤ 30 | 10.10.4.64/27 | 255.255.255.224 | 30 | 10.10.4.65 – 10.10.4.94 |
| 40 — Wi-Fi invités | ≤ 200 | 10.10.8.0/24 | 255.255.255.0 | 254 | 10.10.8.1 – 10.10.8.254 |
| 50 — VOIP | ≤ 300 | 10.10.9.0/23 | 255.255.254.0 | 510 | 10.10.9.1 – 10.10.10.254 |
| 99 — Management | ≤ 50 | 10.10.12.0/26 | 255.255.255.192 | 62 | 10.10.12.1 – 10.10.12.62 |

#### Site Lyon (secondaire) — bloc 10.20.0.0/16

| VLAN | Besoin (hôtes) | Sous-réseau alloué | Masque | Hôtes utilisables | Plage utile |
|---|---:|---|---|---:|---|
| 10 — Bureautique | 140 (+ marge) | 10.20.0.0/24 | 255.255.255.0 | 254 | 10.20.0.1 – 10.20.0.254 |
| 20 — Bancaire (KHS-Core) | ≤ 30 | 10.20.1.0/27 | 255.255.255.224 | 30 | 10.20.1.1 – 10.20.1.30 |
| 30 — Serveurs (DC secours) | ≤ 15 | 10.20.1.32/28 | 255.255.255.240 | 14 | 10.20.1.33 – 10.20.1.46 |
| 40 — Wi-Fi invités | ≤ 100 | 10.20.2.0/25 | 255.255.255.128 | 126 | 10.20.2.1 – 10.20.2.126 |
| 50 — VOIP | ≤ 100 | 10.20.2.128/25 | 255.255.255.128 | 126 | 10.20.2.129 – 10.20.2.254 |
| 99 — Management | ≤ 20 | 10.20.3.0/27 | 255.255.255.224 | 30 | 10.20.3.1 – 10.20.3.30 |

#### Interconnexion inter-sites et DMZ

| Liaison | Sous-réseau | Masque |
|---|---|---|
| Tunnel VPN IPsec principal (Paris ↔ Lyon) | 10.0.0.0/30 | 255.255.255.252 |
| Tunnel VPN IPsec secours (Paris ↔ Lyon) | 10.0.0.4/30 | 255.255.255.252 |
| DMZ (siège) | 10.0.1.0/28 | 255.255.255.240 |

**Exemple de calcul (VLAN 10 — Bureautique Paris) :** pour héberger 780 utilisateurs avec une marge de
croissance, il faut au minimum 2⁹ = 512 adresses (insuffisant), donc 2¹⁰ = 1024 adresses, soit un masque
en **/22** (32 − 10 = 22), offrant 1024 − 2 = **1022 adresses utilisables** — largement suffisant et cohérent
avec la volumétrie cible sans sur-allocation excessive du bloc /16 disponible.

### 4. Justification

Le dimensionnement par VLSM, plutôt qu'un découpage uniforme en /24, évite le gaspillage d'adresses sur
les VLAN à faible population (management, serveurs) tout en réservant la capacité nécessaire aux VLAN à
forte population (bureautique). Cette rigueur de plan d'adressage facilite également la lecture des
règles de pare-feu (cf. Lot A) et la
[procédure de configuration détaillée](../09-procedures/) fournie plus loin dans le dossier.

## Architecture systèmes cible

### 1. Schéma de la salle serveurs et du cluster de virtualisation

```
                         Site Paris (siège)                         Site Lyon (secours actif)
                 ┌─────────────────────────────────┐        ┌─────────────────────────────────┐
                 │   Cluster VMware vSphere HA/DRS   │        │   Cluster VMware vSphere HA/DRS   │
                 │  ┌───────────┐  ┌───────────┐    │        │  ┌───────────┐                    │
                 │  │  Hôte 1   │  │  Hôte 2   │    │◀──────▶│  │  Hôte 1   │                    │
                 │  └───────────┘  └───────────┘    │  vMotion/│  └───────────┘                    │
                 │  VM : AD, DNS/DHCP, Fichiers,     │  réplic. │  VM : AD (secours), DNS/DHCP,     │
                 │  GLPI, PRTG, Sentinel (collecteur)│  Veeam   │  Fichiers (répliqué)               │
                 └───────────────┬───────────────────┘        └───────────────┬───────────────────┘
                                 │                                             │
                 ┌───────────────┴───────────────────┐        ┌───────────────┴───────────────────┐
                 │  Baie de stockage SAN principale   │──────▶│  Baie de stockage SAN secondaire   │
                 │  (production)                       │ répl. │  (réplique asynchrone 15 min)      │
                 └─────────────────────────────────────┘        └─────────────────────────────────────┘

                 ┌─────────────────────────────────┐
                 │  Cluster SQL Server 2022          │
                 │  Always On Availability Group     │
                 │  (KHS-Core) — nœud Paris          │◀────────────────────▶ nœud Lyon (secours)
                 └─────────────────────────────────┘

                 ┌─────────────────────────────────┐
                 │  Serveurs Linux (Oracle 19c)       │
                 │  gestion administrative/paye       │
                 └─────────────────────────────────┘
```

### 2. Répartition des rôles serveurs

| Rôle | Localisation | Redondance |
|---|---|---|
| Contrôleur de domaine (AD/DNS/DHCP) | 1 par site | Réplication multi-maître AD native |
| Cluster de virtualisation (VMware vSphere HA/DRS) | Paris + Lyon | Bascule automatique inter-hôtes, réplication inter-sites via Veeam |
| Base applicative KHS-Core (SQL Server 2022) | Paris (primaire) + Lyon (secondaire) | Always On Availability Group, bascule automatique |
| Bases Oracle (gestion administrative/paye) | Paris | Sauvegarde + réplication vers Lyon (cf. Lot 1) |
| Serveur de fichiers / GED | Paris (primaire) | Réplication asynchrone vers Lyon |
| Messagerie | Cloud (Exchange Online) | SLA Microsoft 99,9 % |
| Supervision (PRTG/GLPI), collecteur SIEM (Sentinel) | Paris, redondé en VM sur Lyon | Reprise manuelle en cas de sinistre du siège |

### 3. Dimensionnement indicatif

| Composant | Paris | Lyon |
|---|---|---|
| Hôtes de virtualisation | 2 (cluster HA) | 1 (secours actif, extensible à 2) |
| Capacité stockage SAN | 40 To utiles (marge 40 %) | 40 To utiles (miroir) |
| VM actives | ≈ 35 | ≈ 10 (+ bascule des VM critiques en cas de sinistre) |

### 4. Justification

La réplication du cluster de virtualisation et du stockage entre Paris et Lyon transforme le site
secondaire en véritable **site de secours actif**, condition nécessaire pour respecter les RPO/RTO définis
au Lot G — PRA/PCA et l'exigence de continuité de service du
régulateur bancaire sur l'application KHS-Core.

## Architecture sécurité cible

### 1. Logique d'accès *zero trust*

```
 Utilisateur (poste client léger/lourd, cf. Lot B)
        │
        ▼
 Authentification Entra ID + MFA (Conditional Access, cf. Lot C)
        │
        ├── Non conforme (poste non chiffré, MFA absent) ──▶ Accès refusé
        │
        ▼ Conforme
 Accès conditionné au périmètre (VLAN, cf. architecture réseau)
        │
        ├── VLAN 20 (KHS-Core) ──▶ Filtrage applicatif pare-feu + journalisation
        ├── GED sécurisée (SharePoint/Purview) ──▶ Classification + DLP + audit immuable
        └── Ressources internes via VPN ──▶ MFA obligatoire + bastion PAM (comptes à privilèges)
        │
        ▼
 Journalisation de tous les accès ──▶ Microsoft Sentinel (SOC)
```

Chaque accès, qu'il concerne l'application bancaire, la GED ou l'administration des équipements, est
conditionné à une authentification forte et journalisé — principe de sécurité *zero trust* : aucune
confiance implicite n'est accordée du seul fait d'être connecté au réseau interne.

### 2. Intégration du dispositif de détection (SOC)

Le schéma détaillé des flux de journalisation vers le SOC est présenté dans
Préparation de la cybersecurity framework et mise en place du SOC.
Il est rappelé ici que l'ensemble des composants de l'architecture cible (pare-feu, EDR, identité, GED,
messagerie) alimentent un point de corrélation unique, condition de la détection croisée mise en avant
par MOM-TECH.

### 3. Synthèse des mécanismes de protection par couche

| Couche | Mécanisme | Lot associé |
|---|---|---|
| Identité | Entra ID, MFA, Conditional Access, PIM (comptes à privilèges) | Lot C, Lot F |
| Poste de travail | Defender for Endpoint (EDR/XDR), chiffrement BitLocker | Lot D, Lot B |
| Réseau | Segmentation VLAN, pare-feu HA, IPS | Lot A, Lot E |
| Application | Filtrage applicatif dédié KHS-Core, Always On (intégrité/dispo) | Lot 5 |
| Données | Classification, DLP, chiffrement, GED sécurisée | Lot F |
| Continuité | Réplication, sauvegarde 3-2-1-1, PRA/PCA | Lot G, Lot 1 |
| Détection & réponse | SOC / SIEM / SOAR, IA comportementale | SOC |

Cette lecture en couches (« defense in depth ») garantit qu'une défaillance ou un contournement d'un
mécanisme unique n'expose jamais directement les données bancaires ou personnelles des clients de
KHS Bank.

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# 7. Plan de migration

## Plan de migration

Cette section détaille la mise en œuvre opérationnelle de l'[architecture cible](../06-architecture/), en
respectant la contrainte contractuelle de non-interruption des services bancaires.

- Prérequis techniques d'installation — VM, RAM, disque, OS, frameworks.
- Étapes de pré-migration
- Étapes de migration
- Étapes post-migration (tests et vérification)
- Éléments à surveiller

### Principe de bascule

La migration suit une logique de **coexistence temporaire** : chaque nouveau composant est déployé en
parallèle de l'existant, testé, puis bascule progressivement (par site, par VLAN ou par vague
d'utilisateurs), avant décommissionnement de l'ancien composant. Cette approche, plus longue qu'une
bascule « à chaud » globale, élimine le risque d'interruption totale de service (risque **P6** du
registre des risques).

## Prérequis techniques d'installation

### Composants virtualisés (cluster VMware vSphere)

| Composant | vCPU | RAM | Disque | OS / Version | Prérequis particuliers |
|---|:---:|:---:|:---:|---|---|
| Contrôleur de domaine (AD/DNS/DHCP) — 1 par site | 4 | 8 Go | 80 Go (OS + data) | Windows Server 2022 | Niveau fonctionnel de forêt 2016 minimum |
| Cluster SQL Server 2022 Always On (KHS-Core) — 2 nœuds | 8 | 32 Go | 500 Go SSD (tempdb séparé) | Windows Server 2022 + SQL Server 2022 Enterprise | Windows Server Failover Cluster (WSFC), témoin de quorum, .NET Framework 4.8 |
| Serveur de fichiers / GED transitoire | 4 | 16 Go | 2 To | Windows Server 2022 | Rôle File Server, DFS-R le temps de la bascule vers SharePoint Online |
| Serveurs applicatifs Oracle 19c (gestion admin./paye) — 2 | 8 | 32 Go | 1 To | Oracle Linux 8 | Oracle Database 19c Enterprise, swap ≥ 16 Go |
| Entra Connect (synchronisation AD ↔ Entra ID) | 2 | 4 Go | 100 Go | Windows Server 2022 | Compte de service dédié, SQL Server Express (embarqué) |
| Collecteur Microsoft Sentinel (Azure Monitor Agent) | 2 | 8 Go | 100 Go (logs) | Windows Server 2022 | Connectivité sortante HTTPS 443 vers Azure |
| GLPI (gestion de parc / ticketing) | 2 | 4 Go | 50 Go | Ubuntu Server 22.04 LTS | PHP 8.1+, MariaDB 10.6+, Apache 2.4 |
| PRTG Network Monitor | 4 | 8 Go | 100 Go | Windows Server 2022 | .NET Framework 4.8, accès SNMP/WMI aux équipements supervisés |
| Veeam Backup & Replication | 8 | 32 Go | Selon volumétrie (cf. Lot 1) | Windows Server 2022 | Compatibilité VMware vSphere 8.0, accès réseau aux baies |

### Infrastructure physique

| Composant | Version / modèle | Prérequis particuliers |
|---|---|---|
| Hôtes de virtualisation (2 par site) | VMware ESXi 8.0 | 384 Go RAM/hôte, vCenter Server 8.0, licences vSphere Enterprise Plus (HA/DRS) |
| Switch cœur/distribution/accès | Cisco IOS-XE 17.x | Licences DNA Advantage (StackWise Virtual, sécurité) |
| Pare-feu | FortiOS 7.4 | Abonnements FortiGuard (IPS, antivirus, filtrage web), licence HA |
| Baies de stockage | Firmware constructeur à jour | Support de la réplication asynchrone compatible Veeam |

### Services cloud (aucune VM on-premise requise)

| Service | Prérequis |
|---|---|
| Microsoft 365 E5 (bureautique, Entra ID, Defender, Purview) | Tenant Microsoft dédié KHS Bank, domaine vérifié, connectivité Internet stable |
| Exchange Online | Migration hybride (coexistence temporaire avec Exchange 2013 le temps du basculement des boîtes) |
| SharePoint Online / OneDrive (GED) | Politiques de rétention et de classification pré-configurées avant ouverture aux utilisateurs |
| Microsoft Sentinel | Espace de travail Log Analytics dédié, connecteurs de données activés par source |
| Microsoft Teams Phone | Numérotation SIP validée avec l'opérateur, SBC certifié |

### Dimensionnement réseau

Le plan d'adressage VLSM doit
être entièrement configuré sur les équipements cœur/distribution avant tout déploiement applicatif,
condition préalable à la mise en réseau des nouvelles VM.

## Étapes de pré-migration

1. **Sauvegarde complète de l'existant** : image des serveurs physiques et virtuels, export de
   l'annuaire Active Directory, sauvegarde intégrale de la base SQL Server 2012 (KHS-Core), sauvegarde
   des configurations des équipements réseau (running-config) — condition préalable à tout retour
   arrière.
2. **Mise en place d'un environnement de test isolé**, réplique fonctionnelle de la production, pour
   valider en amont la compatibilité de **KHS-Core** avec SQL Server 2022 (traitement du risque **P5**
   du registre des risques) et le comportement des
   nouvelles règles de segmentation réseau.
3. **Vérification des prérequis matériels et logiciels** : réception et test du matériel commandé
   (phase Planification du Gantt), licences Microsoft 365/VMware/
   Veeam/Fortinet activées.
4. **Communication et conduite du changement** : calendrier de migration diffusé à l'ensemble des
   collaborateurs, désignation d'un référent par service, FAQ et support dédié pendant la période de
   bascule — mesure d'atténuation du risque **P4** (résistance au changement).
5. **Formation préalable des référents pilotes** sur les nouveaux outils (Teams, SharePoint, GLPI) avant
   la généralisation.
6. **Définition des fenêtres de maintenance**, en dehors des heures ouvrées et hors périodes de forte
   activité bancaire (évitant notamment les périodes de fin de mois, sensibles pour les opérations de
   clôture).
7. **Validation formelle du plan de retour arrière** pour chaque étape critique de la
   migration (bascule réseau, migration AD, migration KHS-Core), avec test de
   restauration effectif en environnement de recette.
8. **Gel des évolutions applicatives** non liées au projet pendant les fenêtres de bascule critiques
   (migration AD, migration KHS-Core), afin de limiter les variables lors d'un éventuel incident.

## Étapes de la migration

La migration est séquencée en sept étapes, alignées sur la phase **Déploiement** du
diagramme de Gantt, chaque étape reposant sur la précédente.

### Étape 1 — Réseau

Déploiement des nouveaux équipements (Cisco Catalyst 9300/9200, FortiGate 200F HA) **en parallèle**
de l'infrastructure existante. Configuration du plan d'adressage VLSM et des VLAN
(cf. architecture réseau cible). Bascule progressive
VLAN par VLAN, avec test de connectivité systématique avant retrait de chaque équipement legacy.
Activation des deux tunnels VPN inter-sites redondants avant toute autre migration, condition de la
continuité des étapes suivantes.

### Étape 2 — Systèmes et virtualisation

Déploiement du cluster VMware vSphere (HA/DRS) sur les deux sites. Migration des machines virtuelles
existantes par conversion **P2V/V2V**. Mise en place de la réplication du stockage (Veeam) entre Paris et
Lyon. Ajout de nouveaux contrôleurs de domaine (Windows Server 2022) en coexistence avec l'AD 2016
existant, puis transfert des rôles FSMO et décommissionnement des anciens contrôleurs.

### Étape 3 — Identité et bureautique (Microsoft 365 / Entra ID)

Déploiement d'Entra Connect et synchronisation hybride AD ↔ Entra ID. Migration Office 365 par vagues
de 150 utilisateurs (pilote de 20 utilisateurs en premier lieu), avec bascule progressive de l'activation
du **MFA obligatoire** via Conditional Access.

### Étape 4 — Messagerie

Migration hybride des boîtes Exchange 2013 vers **Exchange Online**, par lots, avec coexistence
temporaire (double routage) le temps du basculement complet. Redirection finale des enregistrements
MX une fois l'ensemble des boîtes migrées et validées.

### Étape 5 — Cybersécurité

Déploiement de Microsoft Defender for Endpoint sur l'ensemble du parc. Connexion de l'ensemble des
sources (pare-feu, EDR, identité, messagerie, GED) à **Microsoft Sentinel**. Activation des politiques
Purview (classification, DLP) sur la GED. Déploiement du bastion PAM (Entra PIM) pour les comptes à
privilèges.

### Étape 6 — Application métier KHS-Core

Bascule finale de la base **KHS-Core** vers le cluster SQL Server 2022 Always On, en présence de
l'éditeur du progiciel. Exécution du jeu de tests de non-régression métier avant ouverture aux
utilisateurs. Cette étape, la plus sensible du projet (risque **P5**), est réalisée en fenêtre de
maintenance nocturne avec plan de retour arrière activable en moins d'une heure.

### Étape 7 — Postes clients

Déploiement des nouvelles images Windows 11 (client lourd) et des postes clients légers/VDI (VMware
Horizon), par vagues de service, avec double fonctionnement temporaire (ancien + nouveau poste)
jusqu'à validation par l'utilisateur, puis décommissionnement du matériel obsolète.

## Étape post-migration (tests et vérification)

### Tests techniques

| Test | Objectif | Méthode |
|---|---|---|
| Connectivité réseau | Valider tous les VLAN, sur les deux sites | Tests ping/traceroute inter-VLAN, contrôle des ACL |
| Bascule PRA/PCA | Vérifier les RTO/RPO définis au Lot G | Simulation de panne (arrêt contrôlé d'un hôte VMware, coupure d'un lien pare-feu) |
| Restauration de sauvegarde | Vérifier l'intégrité et la disponibilité des sauvegardes | Restauration réelle d'un jeu de données sur environnement isolé (cf. Lot 1) |
| Fonctionnel KHS-Core | Non-régression métier | Jeu de tests réalisé avec l'éditeur (opérations bancaires courantes) |
| Détection SOC | Vérifier la remontée d'alertes | Injection d'événements de test dans Sentinel (cf. démonstration SOC) |
| Conformité des accès | Vérifier l'activation du MFA | Contrôle Entra ID : 100 % des comptes soumis à Conditional Access |
| Performance | Vérifier l'absence de dégradation | Mesure des temps de réponse KHS-Core avant/après migration |

### Période d'hypercare

Une période d'**hypercare de deux semaines** suit la mise en production généralisée : support renforcé
(présence sur site des ingénieurs MOM-TECH), suivi quotidien des tickets GLPI, ajustement des règles de
détection Sentinel pour réduire les faux positifs, et point quotidien avec la DSI de KHS Bank.

### Validation formelle

L'ensemble de ces tests alimente le **cahier de tests** et donne lieu au **procès-verbal de recette**
(cf. Recette), condition de la validation contractuelle du
projet par KHS Bank.

## Éléments à surveiller

Au-delà de la période d'hypercare, les indicateurs suivants sont intégrés à la supervision continue
(PRTG, GLPI, Microsoft Sentinel — cf. Lot H) et font
l'objet d'un reporting régulier à la DSI de KHS Bank dans le cadre du
contrat de maintenance.

| Élément surveillé | Outil | Seuil d'alerte indicatif |
|---|---|---|
| Disponibilité des liens VPN et des accès Internet (2 sites) | PRTG | Toute coupure > 1 min |
| Charge CPU/RAM du cluster VMware | PRTG / vCenter | > 80 % soutenu |
| Latence de réplication du stockage (écart au RPO cible) | Veeam | > 15 min (VM critiques) |
| Taux d'échec d'authentification MFA | Microsoft Entra ID / Sentinel | Pic anormal (indicateur de tentative d'intrusion) |
| Volume et pertinence des alertes SOC | Microsoft Sentinel | Taux de faux positifs > 20 % |
| Temps de réponse de l'application KHS-Core | Supervision applicative | Dégradation > 20 % par rapport à la ligne de base |
| Volume et nature des tickets GLPI | GLPI | Pic de tickets liés à un même composant (signal de dérive) |
| Espace disponible sur les baies de stockage | PRTG / Veeam | < 20 % d'espace libre |
| Conformité des postes (chiffrement, MFA, correctifs à jour) | Microsoft Intune | Tout poste non conforme |
| Expiration des certificats et licences (Fortinet, VMware, Microsoft) | GLPI (inventaire) | Alerte à J-60 avant expiration |

Ces indicateurs reprennent et complètent les indicateurs de suivi du projet
définis en phase de pilotage, désormais utilisés en régime de fonctionnement normal (*Run*).

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# 8. Bilan financier, recette et conclusion

## Bilan financier, recette et conclusion

- Bilan financier — investissement (CAPEX) et facturation récurrente (OPEX),
  au regard du budget annuel de 14 M€ fixé par le cahier des charges.
- Contrat de maintenance — niveaux de service et obligations MOM-TECH/KHS Bank.
- Recette — cahier de tests et procès-verbal de recette.
- Conclusion — synthèse du dossier au regard des objectifs initiaux.

## Bilan financier

### 1. Investissement initial (CAPEX)

| Poste | Détail | Coût estimé |
|---|---|---:|
| Réseau (Lot A) | Switches Cisco Catalyst 9300/9200 (2 sites), cluster FortiGate 200F HA (2 sites), câblage Cat 6A | 780 000 € |
| Postes clients (Lot B) | 920 postes (léger/lourd) + infrastructure VDI (VMware Horizon) | 650 000 € |
| Virtualisation & stockage (Lot 3 + Lot 1) | 4 hôtes ESXi, 2 baies SAN répliquées, Veeam Backup & Replication | 900 000 € |
| Sécurité ([Lot D/E/F](../05-solutions/)) | Bastion PAM, déploiement Purview/DLP, paramétrage IPS | 150 000 € |
| SOC (Sentinel) | Mise en œuvre, connecteurs, playbooks SOAR | 200 000 € |
| Licences Microsoft 365 E5 (920 utilisateurs, 1ʳᵉ année) | 57 €/utilisateur/mois × 920 × 12 mois | 629 280 € |
| Bases de données (Lot 5) | Licences SQL Server 2022 Enterprise (Always On), migration Oracle 19c | 380 000 € |
| VOIP (Lot 6) | Licences Teams Phone + SBC | 120 000 € |
| Prestations d'ingénierie MOM-TECH | Audit, conception, déploiement, recette — 4 ingénieurs × 6 mois | 480 000 € |
| Formation | Utilisateurs et équipes techniques internes | 90 000 € |
| **Sous-total** | | **4 379 280 €** |
| Marge pour aléas (cf. risque **P3**, registre des risques) | 10 % | 437 928 € |
| **Total investissement (CAPEX)** | | **≈ 4 817 000 €** |

### 2. Facturation récurrente (OPEX — contrat de maintenance)

| Poste | Coût mensuel | Coût annuel |
|---|---:|---:|
| Licences Microsoft 365 E5 (run) | 52 440 € | 629 280 € |
| Maintenance réseau (support et abonnements Cisco/Fortinet) | 12 000 € | 144 000 € |
| Astreinte SOC 24/7 (MOM-TECH) | 35 000 € | 420 000 € |
| Contrat de maintenance infrastructure (préventive/corrective) | 18 000 € | 216 000 € |
| Sauvegarde et réplication (stockage cloud immuable) | 8 000 € | 96 000 € |
| **Total facturation mensuelle** | **≈ 125 440 €** | **≈ 1 505 280 €/an** |

### 3. Analyse au regard du budget contractuel

Le cahier des charges fixe un **budget annuel de 14 000 000 €** pour l'ensemble de la maintenance et de
l'évolution du SI de KHS Bank (tous projets confondus, hors périmètre du présent projet).

- L'investissement initial (CAPEX, ≈ 4,8 M€) est un coût **ponctuel**, amorti sur la durée du projet
  (6 mois) et financé sur l'exercice budgétaire en cours.
- Le coût de fonctionnement récurrent (OPEX, ≈ 1,5 M€/an) représente environ **11 %** du budget annuel
  disponible, laissant une marge significative pour les autres postes de dépenses IT de KHS Bank
  (applicatifs métiers, autres projets, personnel interne).

Ce dimensionnement respecte l'exigence du cahier des charges de « diminution des coûts de
fonctionnement » : la rationalisation du parc, la mutualisation des éditeurs (socle Microsoft unique pour
la bureautique, l'identité et une large partie de la sécurité) et la fin des coûts cachés identifiés lors de
l'audit (partages « sauvages », matériel racheté en pure perte) génèrent une économie structurelle par
rapport à la situation antérieure, malgré l'investissement initial.

## Contrat de maintenance informatique

**Entre les soussignés :**

La société **MOM-TECH**, représentée par son Chef de projet en sa qualité d'intervenant,

Ci-après dénommée « le Prestataire », d'une part,

**Et :**

La société **KHS Bank**, représentée par sa Directrice/son Directeur des Systèmes d'Information en sa
qualité d'intervenant,

Ci-après dénommée « le Client », d'autre part,

Dénommées conjointement « Les parties », il a été préalablement exposé ce qui suit : le présent contrat
est un contrat de maintenance et de support informatique faisant suite au projet de migration et de
sécurisation du système d'information de KHS Bank.

### Article 1 — Objet

Le présent contrat a pour objet de définir les conditions dans lesquelles le Prestataire assure la
maintenance préventive et corrective de l'infrastructure déployée (réseau, systèmes, virtualisation,
cybersécurité) ainsi que l'astreinte du SOC, décrits dans les [propositions de solutions](../05-solutions/).

### Article 2 — Durée

Le présent contrat est conclu pour une durée initiale de **trois ans**, à compter du procès-verbal de
recette (cf. Recette), renouvelable par tacite reconduction par périodes d'un an, sauf
dénonciation par l'une des parties avec un préavis de trois mois.

### Article 3 — Obligations du Prestataire

Le Prestataire s'engage à :

- assurer la **maintenance préventive** (supervision continue, application des correctifs de sécurité,
  contrôle des sauvegardes et de la réplication PRA/PCA) ;
- assurer la **maintenance corrective** sur incident, selon les niveaux de service définis à l'Article 4 ;
- maintenir une **astreinte SOC 24/7** pour les incidents de sécurité critiques ;
- fournir un **reporting mensuel** des indicateurs de service (disponibilité, incidents, tickets traités) à
  la DSI de KHS Bank ;
- réaliser une **revue de sécurité trimestrielle** et un **test d'intrusion annuel**
  (cf. Lot F) ;
- assurer une **veille technologique** en matière d'infrastructure, d'intelligence artificielle et de
  cybersécurité, conformément à l'article 3.1 du cahier des charges.

### Article 4 — Niveaux de service (SLA)

| Criticité | Exemple | Délai de prise en charge | Délai de résolution cible |
|---|---|---|---|
| Critique | Panne du cœur de réseau, indisponibilité KHS-Core, incident de sécurité majeur | 15 minutes | 1 heure (RTO KHS-Core) |
| Majeure | Panne d'un équipement redondé, dégradation de service | 1 heure | 4 heures |
| Mineure | Incident sans impact utilisateur direct | 4 heures | 2 jours ouvrés |
| Demande standard | Demande d'évolution mineure, question d'exploitation | 1 jour ouvré | Selon planification |

Le non-respect des délais de résolution cibles pour les incidents de criticité **critique** et **majeure**
donne lieu à des pénalités contractuelles, définies en annexe financière du contrat.

### Article 5 — Obligations du Client

Le Client s'engage à désigner un référent technique disponible pour les échanges avec le Prestataire, à
faciliter l'accès aux locaux et aux équipements pour les interventions programmées, et à respecter les
échéances de paiement définies à l'Article 6.

### Article 6 — Prix et facturation

Conformément au bilan financier, la facturation récurrente s'élève à
**≈ 125 440 € par mois** (licences, maintenance réseau, astreinte SOC, maintenance infrastructure,
sauvegarde/réplication), payable mensuellement à terme échu.

### Article 7 — Confidentialité

Le Prestataire s'engage à respecter la confidentialité des données bancaires et personnelles auxquelles
il pourrait avoir accès dans le cadre de ses interventions, conformément au RGPD et au secret bancaire,
et à faire signer une clause de confidentialité à l'ensemble de ses collaborateurs intervenant sur le
périmètre KHS Bank.

### Article 8 — Résiliation

Le contrat peut être résilié de plein droit par l'une des parties en cas de manquement grave de l'autre
partie à ses obligations, après mise en demeure restée infructueuse pendant trente jours.

## Recette

### Cahier de tests (extrait)

| Réf. | Lot | Test | Résultat attendu | Statut |
|---|---|---|---|---|
| T01 | A | Bascule automatique du cœur de réseau (arrêt d'un membre du stack) | Aucune coupure perceptible | ✅ Conforme |
| T02 | A | Bascule du lien VPN principal vers le lien de secours | Reprise < 30 s, aucune perte de session applicative | ✅ Conforme |
| T03 | G | Bascule du cluster VMware (arrêt d'un hôte) | RTO ≤ 30 min, VM critiques redémarrées automatiquement | ✅ Conforme |
| T04 | 1 | Restauration d'une sauvegarde Veeam (VM de test) | Restauration complète en moins de 2 heures | ✅ Conforme |
| T05 | 5 | Bascule Always On de la base KHS-Core | RTO ≤ 1 heure, RPO ≤ 15 min, aucune perte de transaction validée | ✅ Conforme |
| T06 | C | Connexion utilisateur sans second facteur | Accès refusé (MFA obligatoire) | ✅ Conforme |
| T07 | D | Simulation d'exécution de fichier malveillant sur un poste test | Détection et isolation automatique par Defender for Endpoint | ✅ Conforme |
| T08 | SOC | Injection d'un événement d'authentification suspecte | Alerte générée dans Sentinel en moins de 5 minutes | ✅ Conforme |
| T09 | F | Tentative d'envoi externe d'un document classé confidentiel | Blocage automatique par la politique DLP | ✅ Conforme |
| T10 | B | Poste client léger : absence de données locales après déconnexion | Aucune donnée persistée localement | ✅ Conforme |
| T11 | 6 | Appel test entre les deux sites via Teams Phone | Qualité vocale conforme, QoS respectée | ✅ Conforme |
| T12 | Réseau | Isolement du VLAN invités vis-à-vis du LAN interne | Aucune route accessible vers les VLAN internes | ✅ Conforme |

L'intégralité du cahier de tests (couvrant chaque lot principal et complémentaire) est fournie en annexe
du dossier complet.

### Procès-verbal de recette (modèle)

```
PROCÈS-VERBAL DE RECETTE
Projet : Migration et sécurisation du système d'information — KHS Bank
Prestataire : MOM-TECH

Entre les soussignés, il est convenu ce qui suit :

Le Client déclare avoir pris connaissance des résultats des tests de recette figurant au cahier
de tests, réalisés du [date] au [date], sur l'ensemble des lots principaux et complémentaires
définis au cahier des charges.

☐ Recette prononcée sans réserve
☐ Recette prononcée avec réserve(s) — liste des réserves ci-jointe, avec délai de levée convenu
☐ Recette refusée — motifs ci-joints

Fait à Paris, le [date], en deux exemplaires.

Pour KHS Bank                              Pour MOM-TECH
[Nom, fonction, signature]                 [Nom, fonction, signature]
```

La validation du procès-verbal de recette, signé conjointement par la DSI de KHS Bank et le Chef de
projet MOM-TECH, marque le passage du projet en phase de fonctionnement normal (*Run*), couverte par
le contrat de maintenance.

## Conclusion

### Synthèse du projet

Le cahier des charges de KHS Bank exprimait
un besoin double : moderniser un système d'information vieillissant et hétérogène, et le mettre en
conformité avec les exigences strictes du secteur bancaire (ACPR, DSP2, PCI-DSS, RGPD). L'
[audit de l'existant](../04-audit-existant/) a mis en évidence quatorze constats de criticité élevée,
concentrés sur trois axes : l'absence de redondance (réseau, stockage, pare-feu), l'absence de
dispositif de détection et de continuité (pas de SOC, pas de PRA/PCA formalisé), et une protection
insuffisante des données sensibles (pas de MFA, pas de GED sécurisée).

MOM-TECH a répondu à chacun de ces constats par une [architecture cible](../06-architecture/) cohérente,
construite autour de trois piliers technologiques limitant la fragmentation des éditeurs : Cisco/Fortinet
pour le réseau, VMware/Veeam pour la virtualisation et le PRA/PCA, et un socle Microsoft 365 E5/Entra ID
pour l'identité, la bureautique et une large part de la cybersécurité — complété par **Microsoft
Sentinel**, SOC exploitant la détection assistée par intelligence artificielle, cœur de métier de
MOM-TECH.

Le [plan de migration](../07-migration/) en sept étapes, construit sur un principe de coexistence
progressive, a permis d'atteindre l'objectif contractuel central : **aucune interruption des services
bancaires** pendant toute la durée du projet. La recette confirme la conformité de
l'ensemble des lots aux exigences du cahier des charges.

### Résultats au regard des objectifs initiaux

| Objectif du cahier des charges | Résultat |
|---|---|
| Fiabiliser le SI | Suppression de tous les points de défaillance unique identifiés ; RTO=0 sur le réseau et la virtualisation |
| Sécuriser le SI | MFA généralisé, SOC opérationnel, GED sécurisée, conformité RGPD/ACPR/DSP2 démontrée en recette |
| Moderniser les usages | Migration Office 365 achevée, parc harmonisé (Windows 11), VOIP unifié |
| Maîtriser les coûts | Investissement (≈ 4,8 M€) et fonctionnement récurrent (≈ 1,5 M€/an) représentant ≈ 11 % du budget annuel disponible |
| Accompagner le changement | Plan de formation exécuté, référents pilotes désignés dans chaque service |

### Perspectives

Conformément à l'article 3.1 du cahier des charges, MOM-TECH poursuit dans le cadre du
contrat de maintenance une **veille technologique continue** en matière
d'infrastructure, d'intelligence artificielle et de cybersécurité, avec deux axes prioritaires identifiés
pour les prochaines évolutions :

- l'extension des capacités de détection par IA du SOC à la **lutte anti-fraude** sur les transactions
  KHS-Core (au-delà du seul périmètre de sécurité SI), en s'appuyant sur les données déjà collectées
  par Sentinel ;
- l'évaluation d'une architecture **cloud souverain** pour les données les plus sensibles, à mesure que
  l'offre française/européenne se consolide, en cohérence avec les exigences de souveraineté
  numérique croissantes dans le secteur bancaire.

Cette démarche d'amélioration continue s'inscrit directement dans le principe directeur ITIL v4 retenu
dès le lancement du projet (cf. démarche ITIL) : le projet ne
se referme pas sur la recette, mais ouvre un cycle de maintien en conditions opérationnelles et
d'évolution continue du système d'information de KHS Bank.

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# 9. Procédures détaillées

## Procédures détaillées

Conformément aux exigences du dossier de mise en situation, cette section fournit :

- la procédure complète de configuration du commutateur cœur N3
  (Cisco Catalyst 9300, site de Paris) ;
- la procédure complète du lot complémentaire approfondi — Lot 1, Stockage et sauvegarde
  (Veeam Backup & Replication).

Ces deux procédures s'appuient directement sur le plan d'adressage VLSM
et les prérequis techniques d'installation définis
précédemment dans le dossier.

## Procédure de configuration du commutateur cœur N3 (Cisco Catalyst 9300 — site de Paris)

### 1. Contexte et objectifs

Cette procédure détaille la configuration complète du **cœur de réseau N3** du siège de Paris,
constitué de deux commutateurs **Cisco Catalyst 9300** montés en **stack (StackWise)**, formant un
plan de commutation et de gestion unique — condition de suppression du point de défaillance unique
identifié lors de l'audit (constat **R1**, cf. audit réseau).

Elle couvre : la mise en stack, la configuration de base, la création des VLAN et des interfaces
virtuelles (SVI) selon le plan d'adressage VLSM, le
relais DHCP, la sécurisation des accès et la supervision. La même méthode est répliquée à l'identique
sur le cœur de réseau du site de Lyon, avec le plan d'adressage propre à ce site.

### 2. Prérequis

- 2 commutateurs Cisco Catalyst 9300, firmware **IOS-XE 17.x**, licences **DNA Advantage**.
- 1 câble de stack StackWise entre les deux commutateurs.
- Accès console (câble console RJ45/USB) pour la configuration initiale.
- Plan d'adressage VLSM du site de Paris (cf. architecture réseau cible).
- Serveurs DHCP/DNS déjà positionnés dans le VLAN 30 (cf. prérequis d'installation).

### 3. Étape 1 — Mise en stack des deux commutateurs

Connexion physique des deux commutateurs via le câble StackWise, puis vérification de la formation du
stack :

```
Switch> enable
Switch# show switch
Switch/Stack Mac Address : xxxx.xxxx.xxxx
Switch#   Role     Priority   State
 *1       Active     15       Ready
  2       Standby    14       Ready
```

Le commutateur avec la priorité la plus élevée devient le membre **actif** (plan de contrôle). La
priorité peut être ajustée pour forcer le rôle actif sur un membre déterminé :

```
Switch(config)# switch 1 priority 15
Switch(config)# switch 2 priority 14
```

### 4. Étape 2 — Configuration de base

```
Switch> enable
Switch# configure terminal
Switch(config)# hostname CORE-PARIS
CORE-PARIS(config)# enable secret <mot_de_passe_complexe>
CORE-PARIS(config)# banner motd #
ACCES RESERVE - KHS BANK - Toute connexion non autorisee est interdite et tracee.
#
CORE-PARIS(config)# username admmomtech privilege 15 secret <mot_de_passe_complexe>
CORE-PARIS(config)# ip domain-name khsbank.internal
CORE-PARIS(config)# crypto key generate rsa modulus 2048
CORE-PARIS(config)# line vty 0 15
CORE-PARIS(config-line)# transport input ssh
CORE-PARIS(config-line)# login local
CORE-PARIS(config-line)# exec-timeout 5 0
CORE-PARIS(config-line)# exit
CORE-PARIS(config)# ntp server 10.10.4.65
CORE-PARIS(config)# logging host 10.10.4.70
CORE-PARIS(config)# logging trap informational
```

*Explication :* l'accès en gestion (Telnet) est désactivé au profit du **SSH uniquement**, avec
authentification locale et déconnexion automatique après 5 minutes d'inactivité — conforme au constat
d'audit sur l'absence de durcissement des accès d'administration (VLAN 99).

### 5. Étape 3 — Création des VLAN

```
CORE-PARIS(config)# vlan 10
CORE-PARIS(config-vlan)# name BUREAUTIQUE
CORE-PARIS(config-vlan)# exit
CORE-PARIS(config)# vlan 20
CORE-PARIS(config-vlan)# name BANCAIRE-KHSCORE
CORE-PARIS(config-vlan)# exit
CORE-PARIS(config)# vlan 30
CORE-PARIS(config-vlan)# name SERVEURS
CORE-PARIS(config-vlan)# exit
CORE-PARIS(config)# vlan 40
CORE-PARIS(config-vlan)# name WIFI-INVITES
CORE-PARIS(config-vlan)# exit
CORE-PARIS(config)# vlan 50
CORE-PARIS(config-vlan)# name VOIP
CORE-PARIS(config-vlan)# exit
CORE-PARIS(config)# vlan 99
CORE-PARIS(config-vlan)# name MANAGEMENT
CORE-PARIS(config-vlan)# exit
```

### 6. Étape 4 — Configuration des interfaces

#### Liaisons montantes vers la distribution (trunk)

```
CORE-PARIS(config)# interface range TenGigabitEthernet1/0/1-2
CORE-PARIS(config-if-range)# switchport mode trunk
CORE-PARIS(config-if-range)# switchport trunk allowed vlan 10,20,30,40,50,99
CORE-PARIS(config-if-range)# channel-group 1 mode active
CORE-PARIS(config-if-range)# exit
CORE-PARIS(config)# interface Port-channel1
CORE-PARIS(config-if)# description LIEN-DISTRIBUTION-LACP
CORE-PARIS(config-if)# exit
```

*Explication :* les deux liaisons vers la distribution sont agrégées en **LACP (Port-channel)**, apportant
à la fois de la bande passante supplémentaire et une tolérance de panne sur un lien physique.

### 7. Étape 5 — Interfaces virtuelles (SVI) et routage inter-VLAN

```
CORE-PARIS(config)# ip routing
CORE-PARIS(config)# interface Vlan10
CORE-PARIS(config-if)# description BUREAUTIQUE
CORE-PARIS(config-if)# ip address 10.10.0.1 255.255.252.0
CORE-PARIS(config-if)# exit
CORE-PARIS(config)# interface Vlan20
CORE-PARIS(config-if)# description BANCAIRE-KHSCORE
CORE-PARIS(config-if)# ip address 10.10.4.1 255.255.255.192
CORE-PARIS(config-if)# exit
CORE-PARIS(config)# interface Vlan30
CORE-PARIS(config-if)# description SERVEURS
CORE-PARIS(config-if)# ip address 10.10.4.65 255.255.255.224
CORE-PARIS(config-if)# exit
CORE-PARIS(config)# interface Vlan40
CORE-PARIS(config-if)# description WIFI-INVITES
CORE-PARIS(config-if)# ip address 10.10.8.1 255.255.255.0
CORE-PARIS(config-if)# exit
CORE-PARIS(config)# interface Vlan50
CORE-PARIS(config-if)# description VOIP
CORE-PARIS(config-if)# ip address 10.10.9.1 255.255.254.0
CORE-PARIS(config-if)# exit
CORE-PARIS(config)# interface Vlan99
CORE-PARIS(config-if)# description MANAGEMENT
CORE-PARIS(config-if)# ip address 10.10.12.1 255.255.255.192
CORE-PARIS(config-if)# exit
```

*Explication :* chaque SVI reprend exactement l'adressage défini dans le
plan VLSM, l'adresse `.1` de
chaque sous-réseau étant systématiquement réservée à la passerelle.

### 8. Étape 6 — Relais DHCP (IP Helper)

Les serveurs DHCP étant hébergés dans le VLAN 30 (10.10.4.66 et 10.10.4.67, cf.
prérequis d'installation), chaque SVI cliente doit relayer les
requêtes DHCP broadcast vers ces serveurs :

```
CORE-PARIS(config)# interface Vlan10
CORE-PARIS(config-if)# ip helper-address 10.10.4.66
CORE-PARIS(config-if)# ip helper-address 10.10.4.67
CORE-PARIS(config-if)# exit
CORE-PARIS(config)# interface Vlan40
CORE-PARIS(config-if)# ip helper-address 10.10.4.66
CORE-PARIS(config-if)# exit
CORE-PARIS(config)# interface Vlan50
CORE-PARIS(config-if)# ip helper-address 10.10.4.66
CORE-PARIS(config-if)# exit
```

*Explication :* le VLAN 20 (bancaire) et le VLAN 99 (management) ne disposent volontairement pas de
relais DHCP : les hôtes qui y résident (serveurs applicatifs, équipements réseau) reçoivent une adresse
**IP fixe**, conformément à la politique de sécurité (traçabilité renforcée sur ces segments sensibles).

### 9. Étape 7 — Sécurisation

#### Ports d'accès (postes utilisateurs)

```
CORE-PARIS(config)# interface range GigabitEthernet1/0/1-48
CORE-PARIS(config-if-range)# switchport mode access
CORE-PARIS(config-if-range)# switchport access vlan 10
CORE-PARIS(config-if-range)# switchport port-security
CORE-PARIS(config-if-range)# switchport port-security maximum 2
CORE-PARIS(config-if-range)# switchport port-security violation restrict
CORE-PARIS(config-if-range)# spanning-tree portfast
CORE-PARIS(config-if-range)# spanning-tree bpduguard enable
CORE-PARIS(config-if-range)# exit
```

#### Protections réseau complémentaires

```
CORE-PARIS(config)# spanning-tree mode rapid-pvst
CORE-PARIS(config)# ip dhcp snooping
CORE-PARIS(config)# ip dhcp snooping vlan 10,40,50
CORE-PARIS(config)# ip arp inspection vlan 10,40,50
```

#### ACL d'isolement du VLAN invités (VLAN 40)

```
CORE-PARIS(config)# ip access-list extended ACL-INVITES
CORE-PARIS(config-ext-nacl)# deny ip 10.10.8.0 0.0.0.255 10.10.0.0 0.0.15.255
CORE-PARIS(config-ext-nacl)# permit ip any any
CORE-PARIS(config-ext-nacl)# exit
CORE-PARIS(config)# interface Vlan40
CORE-PARIS(config-if)# ip access-group ACL-INVITES in
CORE-PARIS(config-if)# exit
```

*Explication :* cette ACL interdit tout trafic du VLAN invités vers l'ensemble des VLAN internes de
KHS Bank (10.10.0.0/20), tout en autorisant la sortie vers Internet — conforme au constat d'audit R5 et à
la segmentation définie dans l'architecture réseau cible.
Une ACL similaire, plus stricte, isole le VLAN 20 (bancaire) de manière à n'autoriser que les flux
applicatifs strictement nécessaires entre les postes conseillers et les serveurs KHS-Core.

### 10. Étape 8 — Supervision

```
CORE-PARIS(config)# snmp-server community <chaine_lecture_seule> RO
CORE-PARIS(config)# snmp-server host 10.10.4.68 version 2c <chaine_lecture_seule>
CORE-PARIS(config)# snmp-server enable traps
CORE-PARIS(config)# logging host 10.10.4.69
CORE-PARIS(config)# logging trap informational
```

*Explication :* le commutateur est déclaré comme équipement supervisé dans **PRTG** (10.10.4.68) et
envoie ses journaux vers le collecteur **Microsoft Sentinel** (10.10.4.69), conformément au
Lot H et au SOC.

### 11. Étape 9 — Vérification

```
CORE-PARIS# show vlan brief
CORE-PARIS# show ip interface brief
CORE-PARIS# show etherchannel summary
CORE-PARIS# show ip dhcp snooping
CORE-PARIS# show spanning-tree summary
CORE-PARIS# copy running-config startup-config
```

La configuration est sauvegardée en mémoire non volatile (`startup-config`) puis exportée et versionnée
dans GLPI (documentation technique) conformément au Lot I.
Un test de connectivité inter-VLAN et un test de bascule du stack (arrêt contrôlé du membre actif)
concluent la procédure, conformément au cahier de tests (T01).

## Procédure du lot complémentaire approfondi — Lot 1 : Stockage et sauvegarde

### 1. Contexte et objectifs

Cette procédure détaille la mise en œuvre complète de la solution de stockage et de sauvegarde retenue
au Lot 1, qui
corrige les constats d'audit **S1** (baie unique) et **S2** (sauvegardes sans copie externalisée) et
conditionne le PRA/PCA (Lot G). Elle couvre : le déploiement du
serveur Veeam, la déclaration de l'infrastructure de sauvegarde, la configuration de la réplication
inter-sites, la mise en œuvre de la règle **3-2-1-1**, et la procédure de test de restauration.

### 2. Prérequis

- Serveur **Veeam Backup & Replication** (Windows Server 2022, 8 vCPU / 32 Go RAM, cf.
  prérequis d'installation).
- Cluster **VMware vSphere** opérationnel sur les deux sites (Paris/Lyon), avec vCenter Server 8.0.
- Baie de stockage principale (Paris) et baie secondaire (Lyon) accessibles en réseau au serveur Veeam.
- Compte de service disposant des droits d'administration sur vCenter.
- Accès réseau sortant HTTPS 443 vers le stockage objet cloud (dépôt immuable).

### 3. Étape 1 — Installation et connexion à l'infrastructure de virtualisation

1. Installer le rôle **Veeam Backup & Replication** sur le serveur dédié (VLAN 30 — Serveurs).
2. Depuis la console Veeam : **Backup Infrastructure → Managed Servers → Add Server → VMware vSphere**,
   renseigner l'adresse du vCenter Server de Paris, puis répéter l'opération pour le vCenter de Lyon.
3. Vérifier la découverte des hôtes ESXi et des machines virtuelles sur les deux sites.

### 4. Étape 2 — Déclaration des dépôts de sauvegarde (Backup Repositories)

| Dépôt | Type | Localisation | Rôle |
|---|---|---|---|
| REPO-PARIS-LOCAL | Disque (baie SAN principale) | Paris | Sauvegarde de production (copie 1) |
| REPO-LYON-SECOURS | Disque (baie SAN secondaire) | Lyon | Copie de sauvegarde hors site (copie 2) |
| REPO-CLOUD-IMMUABLE | Stockage objet (compatible S3, Object Lock) | Cloud | Copie immuable anti-rançongiciel (copie 3) |

```
Backup Infrastructure → Backup Repositories → Add Repository
  → Direct attached storage → sélectionner la baie Paris → nommer "REPO-PARIS-LOCAL"
  → répéter pour la baie Lyon → nommer "REPO-LYON-SECOURS"
  → Object storage → S3 Compatible → activer "Make recent backups immutable for [30] days"
    → nommer "REPO-CLOUD-IMMUABLE"
```

*Explication :* l'activation de l'option **Immutability** verrouille les fichiers de sauvegarde en écriture
pendant la durée définie (30 jours) : même un compte administrateur compromis ne peut ni modifier ni
supprimer ces sauvegardes avant expiration du verrou — protection déterminante contre les
rançongiciels qui ciblent en priorité les sauvegardes.

### 5. Étape 3 — Configuration du job de réplication (PRA/PCA)

```
Home → Replication Job → Virtual Machine
  → Nom : "REPL-VM-CRITIQUES-PARIS-LYON"
  → Sélectionner les VM critiques : AD, KHS-Core (nœud secondaire), GED/Fichiers
  → Destination : cluster VMware Lyon, datastore de réplication
  → Planification : réplication continue, intervalle 15 minutes
  → Réseau de réplication : dédié (VLAN 30, flux chiffré)
```

*Explication :* l'intervalle de 15 minutes correspond exactement au **RPO cible** défini pour les services
critiques dans le Lot G — PRA/PCA.

### 6. Étape 4 — Configuration des jobs de sauvegarde (règle 3-2-1-1)

#### Job de sauvegarde principale

```
Home → Backup Job → Virtual Machine
  → Nom : "BACKUP-QUOTIDIEN-PARIS"
  → Sélectionner l'ensemble des VM de production (Paris)
  → Dépôt cible : REPO-PARIS-LOCAL
  → Planification : quotidienne, 22h00
  → Rétention : 30 points de restauration (30 jours), synthèse mensuelle conservée 12 mois
  → Activer "GFS" (Grandfather-Father-Son) pour la rétention longue durée
```

#### Job de copie de sauvegarde (hors site + immuable)

```
Home → Backup Copy Job → Virtual Machine
  → Nom : "COPIE-LYON-ET-CLOUD"
  → Source : job "BACKUP-QUOTIDIEN-PARIS"
  → Cible 1 : REPO-LYON-SECOURS (copie hors site, quotidienne)
  → Cible 2 : REPO-CLOUD-IMMUABLE (copie immuable, hebdomadaire)
  → Fenêtre de copie : en dehors des heures ouvrées
```

*Explication :* ce schéma applique intégralement la règle **3-2-1-1** définie au
Lot 1 :
**3** copies (production + Lyon + cloud), sur **2** types de support (disque SAN + stockage objet), **1**
copie hors site (Lyon), **1** copie immuable (cloud).

### 7. Étape 5 — Vérification automatisée (SureBackup)

```
Home → SureBackup Job
  → Nom : "VERIF-AUTOMATIQUE-HEBDO"
  → Lier au job "BACKUP-QUOTIDIEN-PARIS"
  → Environnement de test : réseau isolé (sandbox Veeam)
  → Tests : démarrage de la VM, ping applicatif, vérification des services (AD, SQL)
  → Planification : hebdomadaire
```

*Explication :* SureBackup démarre automatiquement les VM restaurées dans un environnement réseau
isolé et exécute des tests applicatifs, garantissant que les sauvegardes sont **réellement restaurables**
et non uniquement présentes sur le dépôt — répondant directement au principe retenu dans le
Lot 1 (« une
sauvegarde non testée n'est pas une sauvegarde »).

### 8. Étape 6 — Procédure de test de restauration manuelle (trimestrielle)

1. Sélectionner un point de restauration récent dans la console Veeam (**Home → Restore → Entire VM**).
2. Restaurer vers un environnement de test isolé (réseau sans accès à la production).
3. Démarrer la VM restaurée et vérifier l'intégrité des données (contrôle applicatif, contrôle de
   cohérence de la base pour KHS-Core).
4. Consigner le résultat dans un **procès-verbal de test de restauration** (date, VM testée, durée de
   restauration constatée, conformité au RTO cible, anomalies éventuelles).
5. Archiver le procès-verbal dans GLPI (documentation technique, cf.
   Lot I).

### 9. Étape 7 — Supervision

Les jobs de sauvegarde et de réplication sont supervisés via **PRTG** (sonde Veeam dédiée) et génèrent
une alerte en cas d'échec ou de dépassement de la fenêtre de sauvegarde, conformément aux
éléments à surveiller définis pour la phase post-migration.

### 10. Résultat attendu

À l'issue de cette procédure, KHS Bank dispose d'un dispositif de sauvegarde conforme à la règle
3-2-1-1, testé automatiquement chaque semaine (SureBackup) et manuellement chaque trimestre, avec une
protection anti-rançongiciel effective (copie immuable) — élément validé lors de la recette (test **T04**,
cf. Recette).

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# Annexes

## Annexe A — Cahier des charges KHS Bank (texte intégral)

### Cahier des charges pour l'évolution du système d'information de KHS BANK

> Document rédigé par le donneur d'ordre (KHS Bank), adapté du modèle de cahier des charges fourni par
> l'établissement de formation (Groupe Solaris) au secteur bancaire. Ce document sert de point d'entrée
> au dossier de mise en situation : il fixe le périmètre, les contraintes et l'infrastructure existante que
> MOM-TECH doit auditer puis faire évoluer.

#### 1. Contexte

##### 1.1 Objet du marché

Ce cahier des charges définit la mission générale de la prestation informatique dans les établissements
du groupe **KHS Bank**.

L'évolution concerne la totalité du système d'information des deux sites, à partir de l'infrastructure
réseau (matérielle et logicielle), des serveurs et postes de travail, des terminaux connectés, des services
et applications bancaires et bureautiques, des procédures de maintenance courante et de sécurité, ainsi
que de la mise en conformité avec les nouveaux enjeux de la cybersécurité et de la continuité d'activité
(gestion de crise, exigences de résilience propres au secteur bancaire). Le donneur d'ordre attend
également des recommandations sur tout élément non prévu au présent projet mais dont le prestataire,
de par sa compétence technique, estimerait l'évolution nécessaire ; dans ce cas, une étude d'impact
(bénéfices/risques) devra être fournie.

L'ampleur de la tâche et la portée des mesures dépendent :

- de la taille du parc informatique et des équipements réseau ;
- du volume et de la sensibilité des données traitées (données bancaires et personnelles des clients) ;
- de la complexité de l'infrastructure ;
- des spécificités et de l'organisation interne de l'établissement (contraintes réglementaires du secteur
  bancaire) ;
- des moyens mis à disposition.

**NB :** L'application métier cœur de métier (le progiciel bancaire **KHS-Core**) n'est pas concernée par la
maintenance applicative, celle-ci étant prise en charge par l'éditeur. Le prestataire reste néanmoins
responsable de l'infrastructure qui l'héberge (serveurs, base de données, réseau, sécurité).

##### 1.2 Champ d'application

Le Groupe a engagé depuis plusieurs années une politique de modernisation de son infrastructure de
gestion afin d'offrir un service attractif, réactif et sécurisé à ses clients particuliers, professionnels et
privés, tout en répondant aux exigences croissantes du superviseur bancaire.

##### 1.3 À propos de KHS Bank

KHS Bank est un établissement bancaire de taille intermédiaire proposant des services de banque de
détail, de banque des professionnels et de gestion de patrimoine (banque privée). L'établissement
s'appuie sur trois pôles d'activité :

- **Banque de détail** : comptes courants, épargne, crédits immobiliers et à la consommation pour les
  particuliers ;
- **Banque des professionnels et entreprises** : financement, gestion de trésorerie, moyens de paiement ;
- **Gestion de patrimoine / banque privée** : conseil en investissement pour une clientèle exigeante en
  matière de confidentialité et de disponibilité de service.

KHS Bank est agréée en tant qu'établissement de crédit par l'Autorité de Contrôle Prudentiel et de
Résolution (ACPR) et est soumise à ce titre à des obligations renforcées de sécurité, de traçabilité et de
continuité d'activité.

##### 1.4 Contexte d'origine

Depuis sa création en 2004, KHS Bank a connu une croissance régulière de son portefeuille clients et de
son produit net bancaire. Afin de conserver sa compétitivité et sa conformité réglementaire, KHS Bank
dispose d'un budget annuel de **14 000 000 €** destiné à la maintenance et à l'évolution de son système
d'information. La société dispose d'un **siège social à Paris La Défense** et d'un **site secondaire à Lyon**
(centre de back-office et plateforme téléphonique clients), qui doit pouvoir accéder en permanence aux
ressources du siège.

Depuis 2019, consciente de la vétusté de son SI et des risques croissants en matière de cybersécurité
(le secteur bancaire étant une cible privilégiée des attaques), la direction a engagé une réflexion sur la
modernisation de son SI sans parvenir, faute de compétences internes suffisantes, à statuer sur les
actions nécessaires. Il a donc été décidé de confier cette migration à un prestataire externe spécialisé,
aussi bien sur les environnements utilisateurs que serveurs, réseau et sécurité.

La société compte environ **780 utilisateurs** répartis dans les différents services du siège (répartis dans
le même immeuble), et environ **140 utilisateurs** sur le site secondaire de Lyon.

##### 1.5 Les contraintes principales

KHS Bank est attachée à la démarche **ITIL** ; tous les services sont organisés par rapport au référentiel de
la version 4. Toute la démarche projet du prestataire devra donc s'appuyer sur ce référentiel et en
respecter les préconisations.

Le prestataire devra en outre justifier de toutes les technologies utilisées et démontrer leur conformité
avec les exigences réglementaires du secteur bancaire :

- **RGPD** (Règlement Général sur la Protection des Données) ;
- **Recommandations ACPR/Banque de France** en matière de sécurité des systèmes d'information et de
  plan de continuité d'activité (les interruptions de service sur les moyens de paiement sont
  particulièrement surveillées) ;
- **DSP2** (Directive sur les Services de Paiement 2) et exigences d'authentification forte du client ;
- **Norme PCI-DSS** pour toute donnée relative aux cartes de paiement ;
- **Secret bancaire** et cloisonnement strict des données clients.

##### 1.6 Infrastructure existante

Au niveau des services réseau, l'infrastructure actuelle dispose de :

- Connexions VPN permettant la communication entre le siège et le site de Lyon. Ces connexions
  permettent actuellement l'accès à l'annuaire Active Directory, à la messagerie, au serveur de fichiers et
  à l'application métier **KHS-Core**.
- Base de données utilisateurs **SQL Server 2012**, environnement **Windows Active Directory 2016**
  (présent au siège et à Lyon).
- Services : DNS, DHCP, routage, pare-feu, accès Internet, partages fichiers.
- Système de messagerie **Exchange 2013**.
- Services web : portail intranet et espace client (extranet) associés à une base de données dédiée.
- Serveur d'application métier : **KHS-Core**, progiciel bancaire reposant sur une base de données
  **SQL Server 2012**, hébergeant la gestion des comptes, des opérations et des moyens de paiement.
- Les ordinateurs (postes fixes et portables) sont issus de configurations hétérogènes, déployées de
  manière disparate selon les services.
- L'environnement des utilisateurs est basé sur **Windows 8** pour les postes les plus récents ; la suite
  **Office 2007/2010/2011** cohabite selon les services.

Les serveurs du SI : deux serveurs Linux hébergent les applications de gestion administrative, la gestion
économique et financière, la paye et des bases de données Oracle. Un serveur de fichiers sous
**Windows Server 2016** héberge les répertoires personnels et les partages communs. Une dizaine de
serveurs rack hébergent la messagerie, les applications web et les bases de données métier. L'ensemble
des données est stocké sur une seule baie de stockage. Les sauvegardes sont réalisées par deux robots
de sauvegarde, les bandes étant conservées dans les sous-sols du siège — configuration jugée
insuffisante au regard des exigences de continuité d'activité imposées à un établissement bancaire.

Postes de travail : environ **920 postes** (fixes et portables), système d'exploitation Windows 8, suites
bureautiques hétérogènes (Office 2016, Office 2011 Mac, Open Office), navigateurs Internet Explorer 7 et
9. Achats étalés entre 2007 et 2017.

Réseau : architecture à trois niveaux faiblement redondante. L'ensemble des plateaux du siège est
interconnecté en réseau local Ethernet mixte (liens 100 Base TX, backbone 1000 Base TX). Les deux
sites sont connectés via une solution VPN unique, sans lien de secours.

#### 2. Opportunité du projet et actions attendues

Il a été décidé de refondre l'ensemble du SI et d'en fiabiliser l'organisation lors d'une action unique
confiée à un prestataire externe spécialisé en intelligence artificielle, cloud et cybersécurité — domaines
jugés stratégiques par la direction pour répondre à la fois aux enjeux de fraude, de résilience et de
compétitivité digitale.

##### 2.1 Redondances

D'anciens serveurs locaux sont toujours en activité sur le site de Lyon ; personne ne souhaite les
débrancher, faute de documentation sur leur usage réel.

##### 2.2 Congestion et latence

Une équipe du site de Lyon a mis en place un partage de fichiers « sauvage », échappant à la gestion
centrale et générant des coûts cachés et des risques de sécurité. Les utilisateurs constatent un temps de
latence important au démarrage des postes puis tout au long de la journée ; à certains moments, seules
les applications de gestion financière et la téléphonie restent disponibles.

##### 2.3 Dysfonctionnements

La coexistence de versions différentes des suites bureautiques pose des problèmes de compatibilité sur
d'anciens fichiers Excel utilisés pour des modèles de simulation financière. Les pertes de fichiers, rares
avant 2010, se banalisent. L'utilisation de systèmes et logiciels obsolètes expose l'établissement à des
failles de sécurité critiques ; le non-respect des exigences RGPD et des recommandations ACPR
exposerait KHS Bank à de lourdes sanctions financières et réputationnelles.

##### 2.4 Divers

Certains collaborateurs contournent la lenteur du réseau en se connectant via smartphone en 4G, sur des
partages temporaires non sauvegardés (FTP), au détriment de la traçabilité exigée en environnement
bancaire.

#### 3. Besoins et attentes

Face à cette situation, une analyse globale du SI est nécessaire, dans le strict respect de la législation sur
la protection des données et du secret bancaire. Le prestataire retenu devra :

- identifier ce qui est en place et les causes de dysfonctionnements ;
- proposer un diagnostic global et des solutions d'amélioration ;
- refondre, si nécessaire, l'architecture physique et logique de tout ou partie du SI ;
- proposer le remplacement/la mise à jour du matériel non performant ;
- réaliser un audit de sécurité après mise en place de la nouvelle infrastructure ;
- diminuer les coûts de fonctionnement et fiabiliser le SI en conformité avec les réglementations
  bancaires et la sécurité des données, tout en augmentant la productivité, en particulier en situation de
  crise (plan de continuité d'activité).

##### 3.1 Actions attendues

Le prestataire devra fournir une description détaillée de son intervention en termes de coûts, de délais
et de gains de performance, et se conformer au formalisme de gestion de projet suivant :

- équipe projet composée de deux sous-équipes : **Équipe Architecture Système** et **Équipe Réseau &
  Sécurité** ;
- identification et nomination de l'instance de pilotage ;
- analyse des principaux risques ;
- définition des indicateurs de suivi du projet ;
- définition de la stratégie d'accompagnement des populations impactées ;
- plan de formation des utilisateurs ;
- veille technologique en matière d'infrastructure, d'intelligence artificielle et de sécurité.

#### 4. Structure des réponses et lotissements

##### 4.1 Généralités

KHS Bank (Maître d'Ouvrage) recherche un prestataire unique (Maître d'Œuvre), **MOM-TECH**, pour
l'aider à faire évoluer son système d'information et le rendre conforme aux performances et exigences
réglementaires attendues pour un établissement de cette taille.

##### 4.2 Lots principaux (lots A à J)

- **Lot A** : Architecture réseau (switches, routeurs, DMZ, accès distants…) et services DHCP/DNS
- **Lot B** : Déploiement des postes clients (client léger, client lourd)
- **Lot C** : Migration des logiciels de bureautique vers Office 365
- **Lot D** : Solution antivirus/EDR centralisée
- **Lot E** : Système de prévention d'intrusion (IDS/IPS)
- **Lot F** : Audit de sécurité
- **Lot G** : PRA / PCA
- **Lot H** : Monitoring et ticketing
- **Lot I** : Gestion de parc informatique et contrat de maintenance
- **Lot J** : Déploiements et mises à jour (OS et applications)

##### 4.3 Lots complémentaires (lots 1 à 6)

- **Lot 1** : Stockage et sauvegarde
- **Lot 2** : Annuaire LDAP
- **Lot 3** : Virtualisation
- **Lot 4** : Messagerie
- **Lot 5** : Bases de données (applications métiers / outils collaboratifs)
- **Lot 6** : VOIP

##### 4.4 Déploiements — obligation de moyens

Le prestataire devra préciser les moyens dont il dispose pour garantir le respect des délais, minimiser
l'impact de l'évolution du SI sur l'activité bancaire (aucun arrêt total d'un service, en particulier des
moyens de paiement) et les délais moyens d'approvisionnement auprès de ses fournisseurs.

#### 5. Examen de l'infrastructure du point de vue cybersécurité

Le prestataire devra examiner et mettre à jour les politiques et procédures de sécurité, l'architecture de
sécurité existante, les processus d'évaluation de vulnérabilité et de tests d'intrusion, la sécurité réseau
(pare-feu, IDS/IPS, segmentation, passerelle web et messagerie, proxy, DLP, gestion des correctifs, AV,
SIEM), et formuler des recommandations pour l'efficacité des contrôles de sécurité, avec une attention
particulière portée à la fraude et aux tentatives d'intrusion visant les systèmes de paiement.

**Livrables :** recommandations et modifications des politiques et procédures existantes ; rapport détaillé
avec plan d'action et mécanisme de reporting (tableau de bord).

#### 6. Préparation de la cybersecurity framework

- Préparation de la politique et des procédures de cybersécurité ;
- Préparation du plan de gestion de la cyber-crise dans le cadre de la politique de cybersécurité.

**Livrables :** politique et procédures de cybersécurité ; plan de gestion de la cyber-crise ; changements
apportés aux politiques/procédures existantes.

#### 7. Mise en place du SOC

Mise en place et intégration d'un SOC (Security Operations Center), avec exploitation d'un SIEM et, dans
la mesure du possible, de mécanismes de détection assistée par intelligence artificielle (détection
d'anomalies comportementales, lutte anti-fraude).

**Livrables :** architecture du SOC ; planning préliminaire de réalisation ; plan de test global ; plan de
formation ; contrat de support ; démonstration sur plateforme de test.
