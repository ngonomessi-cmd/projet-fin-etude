# Étapes de pré-migration

1. **Sauvegarde complète de l'existant** : image des serveurs physiques et virtuels, export de
   l'annuaire Active Directory, sauvegarde intégrale de la base SQL Server 2012 (KHS-Core), sauvegarde
   des configurations des équipements réseau (running-config) — condition préalable à tout retour
   arrière.
2. **Mise en place d'un environnement de test isolé**, réplique fonctionnelle de la production, pour
   valider en amont la compatibilité de **KHS-Core** avec SQL Server 2022 (traitement du risque **P5**
   du [registre des risques](../03-gestion-de-projet/gestion-des-risques.md)) et le comportement des
   nouvelles règles de segmentation réseau.
3. **Vérification des prérequis matériels et logiciels** : réception et test du matériel commandé
   (phase Planification du [Gantt](../03-gestion-de-projet/gantt.md)), licences Microsoft 365/VMware/
   Veeam/Fortinet activées.
4. **Communication et conduite du changement** : calendrier de migration diffusé à l'ensemble des
   collaborateurs, désignation d'un référent par service, FAQ et support dédié pendant la période de
   bascule — mesure d'atténuation du risque **P4** (résistance au changement).
5. **Formation préalable des référents pilotes** sur les nouveaux outils (Teams, SharePoint, GLPI) avant
   la généralisation.
6. **Définition des fenêtres de maintenance**, en dehors des heures ouvrées et hors périodes de forte
   activité bancaire (évitant notamment les périodes de fin de mois, sensibles pour les opérations de
   clôture).
7. **Validation formelle du plan de retour arrière** pour chaque étape critique de la
   [migration](migration.md) (bascule réseau, migration AD, migration KHS-Core), avec test de
   restauration effectif en environnement de recette.
8. **Gel des évolutions applicatives** non liées au projet pendant les fenêtres de bascule critiques
   (migration AD, migration KHS-Core), afin de limiter les variables lors d'un éventuel incident.
