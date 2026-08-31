# Gestion de projet — Migration et sécurisation du SI de KHS Bank

Cette section formalise la gestion de projet exigée par le [cahier des charges](../02-cahier-des-charges/cahier-des-charges-khs-bank.md) :
structuration en deux sous-équipes, instance de pilotage, gestion des risques, indicateurs de suivi,
démarche ITIL v4.

- [PBS — Product Breakdown Structure](pbs.md)
- [WBS — Work Breakdown Structure](wbs.md)
- [OBS — Organizational Breakdown Structure](obs.md)
- [Matrice RACI](raci.md)
- [Gestion des risques projet](gestion-des-risques.md)
- [Diagramme de Gantt et gestion des ressources humaines](gantt.md)
- [Démarche ITIL v4](demarche-itil.md)

## Instance de pilotage

Un **Comité de Pilotage (COPIL)** est institué, réunissant mensuellement :

- côté KHS Bank : le Directeur des Systèmes d'Information (sponsor), le RSSI, un représentant de la
  Direction Conformité & Sécurité ;
- côté MOM-TECH : le Chef de projet et les deux responsables de sous-équipe (Architecture Système /
  Réseau & Sécurité).

Le COPIL valide les livrables de chaque phase, arbitre les risques remontés et autorise le passage à la
phase suivante (jalons de type *Go/No-Go*).

## Indicateurs de suivi du projet

| Indicateur | Cible | Fréquence de suivi |
|---|---|---|
| Avancement du planning (% tâches terminées / prévues) | ≥ 95 % à chaque jalon | Hebdomadaire |
| Taux de constats d'audit traités | 100 % des constats de criticité élevée avant recette | À chaque COPIL |
| Disponibilité des services pendant la migration | Aucune interruption des moyens de paiement | Continu |
| Respect du budget | Écart ≤ 5 % du budget alloué au projet | Mensuel |
| Incidents de sécurité pendant le déploiement | 0 incident majeur | Continu |
