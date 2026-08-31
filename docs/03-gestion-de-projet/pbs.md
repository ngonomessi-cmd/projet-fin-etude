# PBS — Product Breakdown Structure

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

## Détail des livrables par branche

| Branche | Livrables |
|---|---|
| Cadrage & documents de gestion de projet | Cahier des charges étudié, PBS, WBS, OBS, RACI, Gantt, registre des risques |
| Rapports d'audit | Rapport d'audit réseau, rapport d'audit systèmes, rapport d'audit cybersécurité, synthèse consolidée |
| Architecture cible & schémas techniques | Schéma réseau cible, schéma de la salle serveurs, architecture du SOC |
| Infrastructure déployée | Équipements réseau configurés, serveurs et virtualisation, postes clients déployés, messagerie migrée |
| Dispositif de sécurité | SOC/SIEM opérationnel, PRA/PCA testé, GED sécurisée, IAM/MFA déployé |
| Dossiers de recette & PV de livraison | Cahier de tests, PV de recette, PV de mise en production |
| Bilan financier & contrat de maintenance | Devis détaillé, facturation, contrat de maintenance signé |
