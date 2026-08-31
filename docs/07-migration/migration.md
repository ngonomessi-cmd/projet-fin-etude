# Étapes de la migration

La migration est séquencée en sept étapes, alignées sur la phase **Déploiement** du
[diagramme de Gantt](../03-gestion-de-projet/gantt.md), chaque étape reposant sur la précédente.

## Étape 1 — Réseau

Déploiement des nouveaux équipements (Cisco Catalyst 9300/9200, FortiGate 200F HA) **en parallèle**
de l'infrastructure existante. Configuration du plan d'adressage VLSM et des VLAN
(cf. [architecture réseau cible](../06-architecture/architecture-reseau-cible.md)). Bascule progressive
VLAN par VLAN, avec test de connectivité systématique avant retrait de chaque équipement legacy.
Activation des deux tunnels VPN inter-sites redondants avant toute autre migration, condition de la
continuité des étapes suivantes.

## Étape 2 — Systèmes et virtualisation

Déploiement du cluster VMware vSphere (HA/DRS) sur les deux sites. Migration des machines virtuelles
existantes par conversion **P2V/V2V**. Mise en place de la réplication du stockage (Veeam) entre Paris et
Lyon. Ajout de nouveaux contrôleurs de domaine (Windows Server 2022) en coexistence avec l'AD 2016
existant, puis transfert des rôles FSMO et décommissionnement des anciens contrôleurs.

## Étape 3 — Identité et bureautique (Microsoft 365 / Entra ID)

Déploiement d'Entra Connect et synchronisation hybride AD ↔ Entra ID. Migration Office 365 par vagues
de 150 utilisateurs (pilote de 20 utilisateurs en premier lieu), avec bascule progressive de l'activation
du **MFA obligatoire** via Conditional Access.

## Étape 4 — Messagerie

Migration hybride des boîtes Exchange 2013 vers **Exchange Online**, par lots, avec coexistence
temporaire (double routage) le temps du basculement complet. Redirection finale des enregistrements
MX une fois l'ensemble des boîtes migrées et validées.

## Étape 5 — Cybersécurité

Déploiement de Microsoft Defender for Endpoint sur l'ensemble du parc. Connexion de l'ensemble des
sources (pare-feu, EDR, identité, messagerie, GED) à **Microsoft Sentinel**. Activation des politiques
Purview (classification, DLP) sur la GED. Déploiement du bastion PAM (Entra PIM) pour les comptes à
privilèges.

## Étape 6 — Application métier KHS-Core

Bascule finale de la base **KHS-Core** vers le cluster SQL Server 2022 Always On, en présence de
l'éditeur du progiciel. Exécution du jeu de tests de non-régression métier avant ouverture aux
utilisateurs. Cette étape, la plus sensible du projet (risque **P5**), est réalisée en fenêtre de
maintenance nocturne avec plan de retour arrière activable en moins d'une heure.

## Étape 7 — Postes clients

Déploiement des nouvelles images Windows 11 (client lourd) et des postes clients légers/VDI (VMware
Horizon), par vagues de service, avec double fonctionnement temporaire (ancien + nouveau poste)
jusqu'à validation par l'utilisateur, puis décommissionnement du matériel obsolète.
