# Démarche ITIL v4

Le [cahier des charges](../02-cahier-des-charges/cahier-des-charges-khs-bank.md) impose que la démarche
projet s'appuie sur le référentiel **ITIL v4**. MOM-TECH structure donc le projet autour du **Système de
Valeur des Services (SVS)** et de sa **chaîne de valeur des services (Service Value Chain)**, plutôt que
sur les seuls processus séquentiels historiques d'ITIL v3.

## Les quatre dimensions ITIL v4 appliquées au projet

| Dimension ITIL v4 | Application au projet KHS Bank |
|---|---|
| Organisations et personnes | OBS/RACI du projet, plan de formation, gestion du changement auprès des équipes internes (risque P4) |
| Information et technologie | Architecture réseau/systèmes cible, SOC/SIEM, GED sécurisée, outil de ticketing/monitoring (Lot H) |
| Partenaires et fournisseurs | Fournisseurs matériel/logiciel, FAI de secours, éditeur de KHS-Core |
| Flux de valeur et processus | WBS du projet, procédures de migration, procédures de gestion des incidents et des changements |

## Correspondance entre les phases du projet et la chaîne de valeur des services

| Phase du projet (WBS) | Activité de la chaîne de valeur ITIL v4 | Pratiques ITIL mobilisées |
|---|---|---|
| Pilotage | **Plan** | Gestion de portefeuille, gestion des risques |
| Audit | **Engage** | Gestion des niveaux de service, gestion des relations |
| Conception | **Design & Transition** | Gestion de la sécurité de l'information, gestion de la continuité de service |
| Planification | **Obtain/Build** | Gestion des fournisseurs, gestion des déploiements |
| Déploiement | **Obtain/Build** puis **Deliver & Support** | Gestion des déploiements, gestion des changements (*Change Enablement*), gestion des mises en production |
| Tests, Recette et Finalisation | **Deliver & Support** | Gestion des incidents, gestion des problèmes, centre de services (*Service Desk*), amélioration continue |

## Pratiques ITIL v4 clés pour ce projet

- **Gestion des changements (Change Enablement)** : chaque intervention en production (migration
  réseau, bascule KHS-Core) est soumise à une procédure de changement documentée, validée en COPIL,
  avec un plan de retour arrière — directement lié à l'exigence contractuelle de non-interruption des
  moyens de paiement.
- **Gestion de la sécurité de l'information** : intégrée dès la phase de conception (SOC/SIEM, IAM/MFA,
  GED sécurisée), conformément au principe *security by design* porté par MOM-TECH.
- **Gestion de la continuité des services** : formalisation du PRA/PCA avec RPO/RTO définis par service
  (cf. [Lot G](../05-solutions/lot-g-pra-pca.md)), répondant au constat d'audit **S8/C3**.
- **Gestion des niveaux de service (SLM)** : indicateurs de suivi définis dans la [gestion de projet](README.md#indicateurs-de-suivi-du-projet)
  et futurs SLA du [contrat de maintenance](../08-bilan-financier-recette/).
- **Amélioration continue** : revue de fin de projet et recommandations de veille technologique
  (cf. cahier des charges §3.1), transmises à KHS Bank pour le maintien en conditions opérationnelles.

## Principes directeurs ITIL v4 retenus

1. **Se concentrer sur la valeur** : chaque lot est priorisé selon son impact sur la conformité et la
   continuité de service (cf. [priorisation de l'audit](../04-audit-existant/conclusion-audit.md)).
2. **Partir de l'existant** : l'audit exhaustif précède toute proposition de solution.
3. **Progresser de manière itérative avec retour d'expérience** : déploiement par lot, avec tests
   intermédiaires avant la recette finale.
4. **Collaborer et favoriser la visibilité** : COPIL mensuel, RACI partagé entre KHS Bank et MOM-TECH.
5. **Penser et travailler de façon globale** : coordination systématique entre les deux sous-équipes
   (Architecture Système / Réseau & Sécurité) sur les sujets transverses (PRA/PCA, GED).
6. **Rester simple et pratique** : solutions dimensionnées au besoin réel de KHS Bank, sans
   sur-ingénierie (cf. arbitrages du [bilan financier](../08-bilan-financier-recette/)).
7. **Optimiser et automatiser** : supervision centralisée (Lot H), gestion automatisée des correctifs et du
   parc (Lot I/J).
