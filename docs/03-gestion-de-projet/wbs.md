# WBS — Work Breakdown Structure

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
