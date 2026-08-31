# Matrice RACI

**R** = Réalisateur (un seul par tâche) · **A** = Approbateur (un seul par tâche) · **C** = Consulté ·
**I** = Informé

| Livrable / Tâche | DSI (KHS) | RSSI (KHS) | Chef de projet (MOM-TECH) | Ing. Réseaux & Sécurité | Ing. Systèmes & Virtualisation | Ing. Cybersécurité / SOC | Fournisseurs |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Pilotage** | | | | | | | |
| Cadrage du projet | A | C | R | I | I | I | |
| Étude du cahier des charges / évaluation du besoin | A | C | R | C | C | C | |
| PBS / WBS / OBS / RACI / Gantt | A | I | R | C | C | C | |
| Gestion des risques projet | A | C | R | C | C | C | |
| Suivi de projet (COPIL) | A | C | R | I | I | I | |
| **Audit** | | | | | | | |
| Audit réseau | C | I | A | R | I | I | |
| Audit systèmes | C | I | A | I | R | I | |
| Audit cybersécurité | I | C | A | I | I | R | |
| Rapport d'audit consolidé | A | C | R | C | C | C | |
| **Conception** | | | | | | | |
| Architecture réseau cible | C | I | A | R | C | C | |
| Architecture systèmes cible | C | I | A | C | R | C | |
| Conception cybersécurité (SOC/SIEM, IAM, GED) | I | C | A | C | C | R | |
| Validation de l'architecture (COPIL) | A | C | R | I | I | I | |
| **Planification** | | | | | | | |
| Consultation fournisseurs / appel d'offres | I | I | R | C | C | I | C |
| Choix des prestataires (FAI secours, éditeurs) | C | I | A | C | C | I | C |
| Plan de migration (pré/migration/post) | C | I | R | C | C | C | |
| Commande et livraison du matériel | I | I | R | I | I | I | R |
| **Déploiement** | | | | | | | |
| Déploiement réseau (câblage, équipements, VPN) | I | I | A | R | I | I | |
| Déploiement systèmes (virtualisation, stockage, AD, messagerie, postes) | I | I | A | I | R | I | |
| Déploiement cybersécurité (SOC/SIEM, EDR, IAM/MFA, PRA/PCA, GED) | I | C | A | I | I | R | |
| Migration de l'application métier KHS-Core | C | I | A | I | R | C | |
| **Tests, Recette et Finalisation** | | | | | | | |
| Tests de déploiement par lot | I | I | A | R | R | R | |
| Cahier de tests et recette | A | C | R | C | C | C | |
| Validation client (PV de recette) | A | C | R | I | I | I | |
| Formation des utilisateurs | C | I | R | I | R | I | |
| Documentation d'installation et d'exploitation | I | I | R | C | C | C | |
| Contrat de maintenance | A | C | R | I | I | I | |
| Bilan financier et facturation | A | I | R | I | I | I | |
