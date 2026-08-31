# Étude du cahier des charges et évaluation du besoin

> Analyse du [cahier des charges KHS Bank](cahier-des-charges-khs-bank.md) par MOM-TECH, préalable à
> toute proposition de solution. Cette étude structure les besoins exprimés par domaine, formalise les
> contraintes à respecter et fixe la méthode d'audit qui sera mise en œuvre (cf. [audit de l'existant](../04-audit-existant/)).

## 1. Synthèse des objectifs du projet

| Objectif | Traduction opérationnelle |
|---|---|
| Fiabiliser le SI | Redondance réseau, PRA/PCA formalisé, haute disponibilité des services bancaires |
| Sécuriser le SI | Mise en conformité RGPD/ACPR/DSP2/PCI-DSS, SOC/SIEM, IAM, GED sécurisée |
| Moderniser les usages | Migration Office 365, harmonisation du parc, unification des sites |
| Maîtriser les coûts | Rationalisation du parc et des licences, budget encadré à 14 M€/an |
| Accompagner le changement | Plan de formation, communication, gestion des risques humains |

## 2. Synthèse des besoins par domaine

### 2.1 Besoins réseaux

- Fiabiliser la liaison inter-sites (siège Paris ↔ site Lyon), actuellement assurée par un lien VPN unique
  sans secours.
- Segmenter le réseau (DMZ, séparation des flux bancaires/bureautiques/invités) pour réduire la surface
  d'attaque.
- Mettre à niveau des équipements réseau vieillissants (switches, routeurs) et homogénéiser le parc.
- Garantir la disponibilité des moyens de paiement (contrainte réglementaire ACPR).

### 2.2 Besoins en cybersécurité

- Combler l'absence de SOC/SIEM et de politique de détection d'intrusion.
- Sécuriser les accès (IAM, authentification forte conforme DSP2) et les échanges de documents
  sensibles (GED sécurisée, DLP).
- Mettre en place un PRA/PCA formalisé avec RPO/RTO définis, adaptés aux exigences de continuité d'un
  établissement bancaire.
- Assurer la conformité RGPD (cartographie des traitements, protection des données clients) et la
  résistance aux menaces ciblant spécifiquement le secteur (fraude, hameçonnage, rançongiciel).

### 2.3 Besoins système

- Remplacer les systèmes obsolètes (Windows 8, Office 2007/2010/2011, Exchange 2013, AD 2016,
  SQL Server 2012) par des versions supportées et sécurisées.
- Fiabiliser le stockage et la sauvegarde (actuellement une baie unique et des bandes conservées sur
  site, sans copie externalisée).
- Uniformiser le déploiement des postes de travail et des applicatifs (actuellement hétérogènes).
- Garantir la compatibilité et la continuité de fonctionnement de l'application métier **KHS-Core**.

## 3. Contraintes identifiées

| Type | Contrainte |
|---|---|
| Réglementaire | RGPD, ACPR, DSP2, PCI-DSS, secret bancaire |
| Méthodologique | Démarche ITIL v4 obligatoire ; équipe projet structurée en 2 sous-équipes |
| Organisationnelle | Deux sites (Paris/Lyon), 920 utilisateurs, réticence des équipes IT internes |
| Financière | Budget annuel plafonné à 14 M€ pour la maintenance et l'évolution du SI |
| Opérationnelle | Aucune interruption totale de service tolérée, en particulier sur les moyens de paiement |
| Applicative | KHS-Core (progiciel bancaire) hors périmètre de maintenance applicative, mais son
  infrastructure d'hébergement est dans le périmètre |

## 4. Méthode et mise en place de l'audit

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

## 5. Résultats attendus, délais et évaluation

- **Résultats attendus** : diagnostic complet du SI, architecture cible justifiée, plan de migration sans
  interruption de service, conformité réglementaire démontrée.
- **Délais** : planning détaillé dans le diagramme de Gantt (cf. [gestion de projet](../03-gestion-de-projet/)).
- **Évaluation** : recette contractuelle en fin de projet (cf. [Recette](../08-bilan-financier-recette/)),
  validée conjointement par la DSI et la Direction Conformité & Sécurité de KHS Bank.
