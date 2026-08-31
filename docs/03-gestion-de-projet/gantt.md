# Diagramme de Gantt et gestion des ressources humaines

## Planning macro

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

## Détail des tâches et ressources assignées

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

## Gestion des ressources humaines

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
de vigilance identifié dans le [registre des risques](gestion-des-risques.md) (risque **P2** — indisponibilité
d'un membre clé de l'équipe).
