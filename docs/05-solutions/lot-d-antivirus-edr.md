# Lot D — Solution antivirus centralisée (EDR/XDR)

## Constat traité

C4 (absence d'EDR/XDR centralisé, antivirus géré poste par poste) — cf.
[audit cybersécurité](../04-audit-existant/audit-cybersecurite.md).

## Solution proposée

Déploiement de **Microsoft Defender for Endpoint (Plan 2)**, inclus dans les licences Microsoft 365 E5
attribuées au [Lot C](lot-c-office365-entra-id.md), sur l'ensemble des postes clients (légers et lourds) et
des serveurs Windows :

- détection comportementale et analyse des menaces avancées (au-delà de la signature antivirus
  classique) ;
- **remédiation automatique** des menaces détectées (isolation du poste, arrêt de processus) ;
- **console unique** centralisée, intégrée nativement au SIEM (cf. [Microsoft Sentinel](cybersecurity-framework-soc.md))
  pour la corrélation d'alertes ;
- couverture des serveurs Linux (agent Defender for Linux) pour les deux serveurs hébergeant les
  applications de gestion administrative.

## Justification

L'intégration native avec l'identité Entra ID et le SIEM Sentinel permet de corréler automatiquement une
alerte EDR avec un événement d'authentification suspect — une capacité de détection croisée qui
s'inscrit dans l'approche IA de MOM-TECH (détection d'anomalies comportementales) et répond
directement au constat **C1** (absence de SOC) traité par ailleurs.

## Bénéfices attendus

- Détection et réponse centralisées sur l'ensemble du parc (920 postes, ~15 serveurs).
- Réduction du délai moyen de détection d'un incident (MTTD) par la corrélation SIEM.
- Conformité renforcée avec les exigences ACPR de sécurisation des postes de travail.
