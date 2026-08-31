# Bilan financier

## 1. Investissement initial (CAPEX)

| Poste | Détail | Coût estimé |
|---|---|---:|
| Réseau ([Lot A](../05-solutions/lot-a-architecture-reseau.md)) | Switches Cisco Catalyst 9300/9200 (2 sites), cluster FortiGate 200F HA (2 sites), câblage Cat 6A | 780 000 € |
| Postes clients ([Lot B](../05-solutions/lot-b-postes-clients.md)) | 920 postes (léger/lourd) + infrastructure VDI (VMware Horizon) | 650 000 € |
| Virtualisation & stockage ([Lot 3](../05-solutions/lots-complementaires.md) + [Lot 1](../05-solutions/lots-complementaires.md)) | 4 hôtes ESXi, 2 baies SAN répliquées, Veeam Backup & Replication | 900 000 € |
| Sécurité ([Lot D/E/F](../05-solutions/)) | Bastion PAM, déploiement Purview/DLP, paramétrage IPS | 150 000 € |
| SOC ([Sentinel](../05-solutions/cybersecurity-framework-soc.md)) | Mise en œuvre, connecteurs, playbooks SOAR | 200 000 € |
| Licences Microsoft 365 E5 (920 utilisateurs, 1ʳᵉ année) | 57 €/utilisateur/mois × 920 × 12 mois | 629 280 € |
| Bases de données ([Lot 5](../05-solutions/lots-complementaires.md)) | Licences SQL Server 2022 Enterprise (Always On), migration Oracle 19c | 380 000 € |
| VOIP ([Lot 6](../05-solutions/lots-complementaires.md)) | Licences Teams Phone + SBC | 120 000 € |
| Prestations d'ingénierie MOM-TECH | Audit, conception, déploiement, recette — 4 ingénieurs × 6 mois | 480 000 € |
| Formation | Utilisateurs et équipes techniques internes | 90 000 € |
| **Sous-total** | | **4 379 280 €** |
| Marge pour aléas (cf. risque **P3**, [registre des risques](../03-gestion-de-projet/gestion-des-risques.md)) | 10 % | 437 928 € |
| **Total investissement (CAPEX)** | | **≈ 4 817 000 €** |

## 2. Facturation récurrente (OPEX — contrat de maintenance)

| Poste | Coût mensuel | Coût annuel |
|---|---:|---:|
| Licences Microsoft 365 E5 (run) | 52 440 € | 629 280 € |
| Maintenance réseau (support et abonnements Cisco/Fortinet) | 12 000 € | 144 000 € |
| Astreinte SOC 24/7 (MOM-TECH) | 35 000 € | 420 000 € |
| Contrat de maintenance infrastructure (préventive/corrective) | 18 000 € | 216 000 € |
| Sauvegarde et réplication (stockage cloud immuable) | 8 000 € | 96 000 € |
| **Total facturation mensuelle** | **≈ 125 440 €** | **≈ 1 505 280 €/an** |

## 3. Analyse au regard du budget contractuel

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
