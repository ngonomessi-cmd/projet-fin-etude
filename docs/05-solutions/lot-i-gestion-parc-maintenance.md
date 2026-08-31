# Lot I — Gestion de parc informatique et contrat de maintenance

## Constats traités

S7 (absence d'outil de gestion de parc), R6 (équipements hors garantie) — cf.
[audits systèmes et réseau](../04-audit-existant/).

## Solution proposée

- **GLPI** comme outil unique de gestion de parc (matériel et logiciel), couplé au module ticketing du
  [Lot H](lot-h-monitoring-ticketing.md) : inventaire automatique (agent FusionInventory), suivi des
  garanties, des licences et des contrats fournisseurs.
- **Contrat de maintenance MOM-TECH** couvrant :
  - maintenance préventive (supervision, application des correctifs, contrôle des sauvegardes) ;
  - maintenance corrective (intervention sur incident, SLA par criticité) ;
  - astreinte pour les composants critiques identifiés au PRA/PCA ;
  - reporting mensuel des indicateurs de service (disponibilité, incidents, tickets traités).

Le détail contractuel (niveaux de service, pénalités, durée) est présenté dans le
[bilan financier et la recette](../08-bilan-financier-recette/).

## Justification

Un inventaire centralisé et à jour est la condition préalable à toute politique de renouvellement matériel
maîtrisée : il permet d'anticiper les fins de garantie (constat **R6**) avant qu'elles ne deviennent un
risque opérationnel.

## Bénéfices attendus

- Visibilité complète et permanente sur l'état du parc.
- Anticipation du renouvellement matériel, réduction des ruptures de garantie.
