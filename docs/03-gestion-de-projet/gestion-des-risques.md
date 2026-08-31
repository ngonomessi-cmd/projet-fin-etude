# Gestion des risques projet

> À ne pas confondre avec les constats de l'[audit de l'existant](../04-audit-existant/conclusion-audit.md),
> qui portent sur l'état du SI de KHS Bank. Cette section couvre les **risques liés à la conduite du
> projet** lui-même (délais, ressources, budget, conduite du changement, réglementation).

## Échelle d'évaluation

| Valeur | Impact | Probabilité | Détection |
|:---:|---|---|---|
| 1 | Mineur, sans conséquence sur le planning | Improbable | Détecté très en amont |
| 2 | Faible, absorbable sans replanification | Peu probable | Signe avant-coureur identifiable |
| 3 | Notable, replanification d'une tâche | Probable | Signe avant-coureur difficilement décelable |
| 4 | Important, impact sur un jalon | Très probable | Aucun signe avant-coureur |
| 5 | Critique, remet en cause un livrable majeur ou la conformité réglementaire | Quasi certain | Détection impossible avant survenue |

Criticité = Impact × Probabilité (sur 25).

## Registre des risques

| # | Risque | Catégorie | Impact | Proba. | Criticité | Action de mitigation | Porteur | Criticité résiduelle |
|---|---|---|:---:|:---:|:---:|---|---|:---:|
| P1 | Retard de livraison du matériel réseau/serveurs | Logistique | 4 | 3 | 12 | Anticiper les commandes dès la fin de la conception, prévoir un stock tampon d'équipements critiques | Chef de projet | 4 |
| P2 | Indisponibilité d'un membre clé de l'équipe projet | Humain | 4 | 2 | 8 | Documentation continue, doublon de compétences entre les deux sous-équipes, plan de montée en charge | Chef de projet | 4 |
| P3 | Dépassement du budget alloué | Financier | 5 | 2 | 10 | Chiffrage détaillé par lot validé en COPIL, marge de 10 % provisionnée, suivi mensuel des dépenses | Chef de projet / DSI | 5 |
| P4 | Résistance au changement des équipes informatiques internes de KHS Bank | Organisationnel | 3 | 4 | 12 | Communication dès le lancement, association des équipes internes à l'audit et aux tests, plan de formation | DSI / Chef de projet | 3 |
| P5 | Incompatibilité de l'application métier KHS-Core avec la nouvelle infrastructure | Technique | 5 | 3 | 15 | Environnement de test dédié, tests de compatibilité avant migration en production, éditeur KHS-Core associé | Ing. Systèmes | 6 |
| P6 | Interruption d'un service bancaire pendant la migration (moyens de paiement) | Opérationnel / Réglementaire | 5 | 2 | 10 | Migrations planifiées hors heures ouvrées, bascule progressive, plan de retour arrière testé | Chef de projet | 5 |
| P7 | Non-conformité réglementaire découverte tardivement (ACPR/DSP2/PCI-DSS) | Réglementaire | 5 | 2 | 10 | Revue de conformité à chaque jalon avec la Direction Conformité & Sécurité, veille réglementaire continue | Ing. Cybersécurité | 5 |
| P8 | Fuite ou perte de données pendant la phase de migration | Sécurité | 5 | 2 | 10 | Chiffrement des flux et supports de migration, contrôle d'intégrité post-migration, sauvegarde préalable systématique | Ing. Cybersécurité | 5 |
| P9 | Sous-estimation du périmètre lors de l'audit initial | Méthodologique | 3 | 2 | 6 | Grille d'audit exhaustive validée en amont, entretiens croisés avec plusieurs interlocuteurs par domaine | Chef de projet | 4 |
| P10 | Difficulté d'approvisionnement (pénurie composants) | Logistique | 3 | 3 | 9 | Identification de fournisseurs alternatifs, commande anticipée des équipements à délai long | Chef de projet | 6 |
| P11 | Perte de données lors de la migration de la base SQL Server 2012 | Technique | 5 | 2 | 10 | Sauvegarde complète avant migration, migration à blanc en environnement de test, contrôle de cohérence post-migration | Ing. Systèmes | 5 |
| P12 | Manque de compétences internes KHS Bank pour la reprise en MCO après le projet | Organisationnel | 3 | 3 | 9 | Plan de formation des équipes techniques internes, documentation d'exploitation détaillée, période de transfert de compétences | Chef de projet | 6 |

## Priorisation

Trois risques dépassent le seuil de criticité 12 avant mitigation (**P4**, **P5**, **P1**) et concentrent
l'attention du COPIL en début de projet. Le risque **P5** (incompatibilité de KHS-Core), le plus critique du
registre, justifie la mise en place systématique d'un environnement de test isolé avant toute migration en
production — cohérent avec les [étapes de pré-migration](../07-migration/pre-migration.md) détaillées
plus loin dans le dossier.
