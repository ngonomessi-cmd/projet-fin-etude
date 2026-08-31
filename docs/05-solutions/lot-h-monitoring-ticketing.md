# Lot H — Monitoring et ticketing

## Constat traité

S6 (absence d'outil centralisé de gestion des correctifs et de supervision) — cf.
[audit systèmes](../04-audit-existant/audit-systemes.md).

## Solution proposée

- **Supervision infrastructure** : **PRTG Network Monitor**, supervision des équipements réseau
  (cf. [Lot A](lot-a-architecture-reseau.md)), des serveurs et du cluster de virtualisation
  (cf. [Lot 3](lots-complementaires.md#lot-3--virtualisation)), avec seuils d'alerte et tableaux de bord
  partagés avec la DSI de KHS Bank.
- **Ticketing / gestion des incidents** : **GLPI**, aligné sur les pratiques ITIL v4 *Incident Management*
  et *Problem Management* : catégorisation des tickets par lot, SLA par criticité, base de connaissance
  partagée avec le [Lot I](lot-i-gestion-parc-maintenance.md).
- Remontée automatique des alertes critiques (rupture de lien, panne matérielle) vers le SOC
  (cf. [cybersecurity framework et SOC](cybersecurity-framework-soc.md)) pour distinguer un incident
  d'exploitation d'un incident de sécurité.

## Justification

GLPI, déjà retenu pour l'inventaire du parc au [Lot I](lot-i-gestion-parc-maintenance.md), sert
également de plateforme de ticketing : un seul outil pour la gestion du parc et des incidents simplifie
l'exploitation par l'équipe interne de KHS Bank après transfert de compétences (cf. risque **P12**).

## Bénéfices attendus

- Détection proactive des anomalies avant impact utilisateur.
- Traçabilité complète du traitement des incidents, exploitable pour le reporting ACPR.
