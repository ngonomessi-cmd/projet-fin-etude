# Conclusion de l'audit — synthèse et priorisation

## Synthèse consolidée des constats

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

## Priorisation

Quatorze constats sont classés en criticité **élevée** : ils concernent en priorité la résilience du réseau
inter-sites, la continuité d'activité (PRA/PCA, sauvegarde), la détection des incidents (SOC/SIEM), le
contrôle des accès (MFA, PAM) et la protection des documents sensibles (GED sécurisée) — autant de
points directement liés aux exigences réglementaires (ACPR, DSP2, RGPD) du cahier des charges.

Cette priorisation guide l'ordre de traitement retenu dans les [propositions de solutions](../05-solutions/)
et sera reprise dans le diagramme de Gantt de la [gestion de projet](../03-gestion-de-projet/) pour
séquencer les lots à plus fort enjeu de conformité et de continuité en début de déploiement.
