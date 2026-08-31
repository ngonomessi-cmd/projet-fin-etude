# Plan de migration

Cette section détaille la mise en œuvre opérationnelle de l'[architecture cible](../06-architecture/), en
respectant la contrainte contractuelle de non-interruption des services bancaires.

- [Prérequis techniques d'installation](prerequis-installation.md) — VM, RAM, disque, OS, frameworks.
- [Étapes de pré-migration](pre-migration.md)
- [Étapes de migration](migration.md)
- [Étapes post-migration (tests et vérification)](post-migration.md)
- [Éléments à surveiller](elements-a-surveiller.md)

## Principe de bascule

La migration suit une logique de **coexistence temporaire** : chaque nouveau composant est déployé en
parallèle de l'existant, testé, puis bascule progressivement (par site, par VLAN ou par vague
d'utilisateurs), avant décommissionnement de l'ancien composant. Cette approche, plus longue qu'une
bascule « à chaud » globale, élimine le risque d'interruption totale de service (risque **P6** du
[registre des risques](../03-gestion-de-projet/gestion-des-risques.md)).
