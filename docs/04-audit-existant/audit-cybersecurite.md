# Audit cybersécurité

## 1. Contexte de l'audit

Le secteur bancaire figure parmi les cibles privilégiées des cyberattaques (fraude aux moyens de
paiement, hameçonnage ciblé — *spear phishing*, rançongiciel). L'audit cybersécurité vise à évaluer le
niveau de maturité de KHS Bank au regard de ces menaces et des exigences réglementaires (ACPR,
RGPD, DSP2, PCI-DSS), en s'appuyant sur les recommandations de l'**ANSSI**.

## 2. Audit organisationnel et physique

### 2.1 Organisation de la sécurité

Un RSSI est en poste au sein de la Direction Conformité & Sécurité, mais ne dispose ni d'équipe dédiée,
ni d'outillage de supervision (pas de SOC/SIEM). Aucune politique de sécurité des systèmes
d'information (PSSI) formalisée et diffusée n'a été retrouvée ; les pratiques de sécurité reposent
largement sur des habitudes non documentées.

### 2.2 Audit physique

| Élément | Constat |
|---|---|
| Accès à la salle serveurs | Contrôle par badge, sans registre de traçabilité horodaté exploité |
| Vidéosurveillance | Présente aux entrées du bâtiment, absente en salle serveurs |
| Gestion des visiteurs | Pas de procédure formalisée d'accompagnement des prestataires externes |

## 3. Audit technique

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

## 4. Analyse de l'audit — niveau de maturité

Le niveau de maturité cybersécurité de KHS Bank est jugé **insuffisant** au regard des exigences propres
au secteur bancaire : absence de détection (pas de SOC/SIEM), absence de plan de continuité formalisé,
authentification faible (pas de MFA malgré l'exigence DSP2), absence de gestion sécurisée des documents
sensibles. Ces écarts exposent KHS Bank à un risque de sanction réglementaire (ACPR, CNIL) et à un
risque opérationnel et réputationnel en cas d'incident.

## 5. Constats de l'audit cybersécurité

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

Ces constats sont consolidés dans la [conclusion de l'audit](conclusion-audit.md) et traités par les lots
[D (antivirus/EDR)](../05-solutions/), [E (IDS/IPS)](../05-solutions/), [F (audit de sécurité)](../05-solutions/),
[G (PRA/PCA)](../05-solutions/), ainsi que par la [préparation de la cybersecurity framework et la mise en
place du SOC](../05-solutions/).
