# Étape post-migration (tests et vérification)

## Tests techniques

| Test | Objectif | Méthode |
|---|---|---|
| Connectivité réseau | Valider tous les VLAN, sur les deux sites | Tests ping/traceroute inter-VLAN, contrôle des ACL |
| Bascule PRA/PCA | Vérifier les RTO/RPO définis au [Lot G](../05-solutions/lot-g-pra-pca.md) | Simulation de panne (arrêt contrôlé d'un hôte VMware, coupure d'un lien pare-feu) |
| Restauration de sauvegarde | Vérifier l'intégrité et la disponibilité des sauvegardes | Restauration réelle d'un jeu de données sur environnement isolé (cf. [Lot 1](../05-solutions/lots-complementaires.md)) |
| Fonctionnel KHS-Core | Non-régression métier | Jeu de tests réalisé avec l'éditeur (opérations bancaires courantes) |
| Détection SOC | Vérifier la remontée d'alertes | Injection d'événements de test dans Sentinel (cf. [démonstration SOC](../05-solutions/cybersecurity-framework-soc.md)) |
| Conformité des accès | Vérifier l'activation du MFA | Contrôle Entra ID : 100 % des comptes soumis à Conditional Access |
| Performance | Vérifier l'absence de dégradation | Mesure des temps de réponse KHS-Core avant/après migration |

## Période d'hypercare

Une période d'**hypercare de deux semaines** suit la mise en production généralisée : support renforcé
(présence sur site des ingénieurs MOM-TECH), suivi quotidien des tickets GLPI, ajustement des règles de
détection Sentinel pour réduire les faux positifs, et point quotidien avec la DSI de KHS Bank.

## Validation formelle

L'ensemble de ces tests alimente le **cahier de tests** et donne lieu au **procès-verbal de recette**
(cf. [Recette](../08-bilan-financier-recette/recette.md)), condition de la validation contractuelle du
projet par KHS Bank.
