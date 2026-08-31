# Lots complémentaires

Conformément au cahier des charges (§4.4), le **lot 1 (Stockage et sauvegarde)** est le lot complémentaire
retenu pour un traitement approfondi ; les lots 2 à 6 sont traités de façon synthétique mais justifiée.

## Lot 1 - Stockage et sauvegarde (lot approfondi)

### Constats traités

S1 (baie de stockage unique), S2 (sauvegardes sans copie externalisée) — cf.
[audit systèmes](../04-audit-existant/audit-systemes.md). Ce lot conditionne directement le
[PRA/PCA (Lot G)](lot-g-pra-pca.md).

### Architecture cible

- **Baie de stockage principale** (siège) : baie SAN hybride (SSD + HDD), dimensionnée avec 40 % de
  marge d'évolution sur 5 ans.
- **Baie de stockage secondaire** (Lyon) : réplication asynchrone en continu des volumes critiques via
  **Veeam Backup & Replication**, dans le cadre du cluster VMware réparti (cf.
  [Lot 3](#lot-3---virtualisation) et [Lot G](lot-g-pra-pca.md)).
- **Règle de sauvegarde 3-2-1-1** :
  - **3** copies des données (production + 2 sauvegardes) ;
  - sur **2** supports différents (disque sur baie secondaire + stockage objet immuable) ;
  - **1** copie hors site (réplication vers le site de Lyon, physiquement distinct du siège) ;
  - **1** copie **immuable** (verrouillée en écriture pendant une durée définie, sur un stockage objet type
    Azure Blob avec *immutability policy*) — protection déterminante contre les rançongiciels, qui ciblent
    en priorité les sauvegardes accessibles en écriture.
- Suppression des robots de sauvegarde sur bandes conservées en sous-sol (constat S2) au profit de ce
  schéma disque + cloud.
- **Tests de restauration trimestriels documentés**, avec procès-verbal archivé — condition nécessaire
  pour qu'un PRA soit considéré comme opérationnel (« une sauvegarde non testée n'est pas une
  sauvegarde »).

### Fréquences et rétention

| Type de donnée | Fréquence de sauvegarde | Rétention |
|---|---|---|
| VM critiques (KHS-Core, AD, GED) | Réplication continue (15 min) + snapshot quotidien | 30 jours (quotidien), 12 mois (mensuel) |
| Serveur de fichiers / autres VM | Sauvegarde quotidienne incrémentale | 90 jours |
| Archives réglementaires (relevés, contrats) | Sauvegarde hebdomadaire | Conforme aux durées légales de conservation bancaire |

> La procédure complète et détaillée de mise en œuvre de ce lot (configuration Veeam, politique de
> réplication, test de restauration) est fournie dans la section [Procédures](../09-procedures/).

## Lot 2 - Annuaire LDAP

Modernisation de l'**Active Directory** existant (niveau fonctionnel de forêt mis à jour), avec un
contrôleur de domaine par site en haute disponibilité et synchronisation vers **Microsoft Entra ID**
(cf. [Lot C](lot-c-office365-entra-id.md)) pour l'identité hybride. Politique de mots de passe renforcée
(longueur, complexité, verrouillage après échecs) et désactivation automatisée des comptes inactifs.

## Lot 3 - Virtualisation

**Cluster VMware vSphere (HA/DRS)** réparti entre le siège et Lyon, socle du [PRA/PCA (Lot G)](lot-g-pra-pca.md).
Bascule automatique des machines virtuelles en cas de panne d'un hôte physique ; répartition de charge
dynamique (DRS) pour absorber les pics d'activité (ex. clôtures comptables mensuelles).

## Lot 4 - Messagerie

Migration d'**Exchange 2013** vers **Exchange Online** (Microsoft 365 E5, cf. [Lot C](lot-c-office365-entra-id.md)),
avec **Microsoft Defender for Office 365** pour le filtrage anti-phishing et anti-malware — un point
d'entrée majeur des attaques ciblant le secteur bancaire. Archivage légal des messages conforme aux
durées de conservation réglementaires (ACPR).

## Lot 5 - Bases de données

- Migration de **SQL Server 2012** (base de l'application métier KHS-Core) vers **SQL Server 2022** en
  configuration **Always On Availability Group** entre le siège et Lyon, pour la haute disponibilité de
  l'application bancaire.
- Montée de version des bases **Oracle** hébergées sur les deux serveurs Linux (gestion administrative,
  financière, paye).
- Outils collaboratifs : **SharePoint Online / Microsoft Teams** (cf. [Lot C](lot-c-office365-entra-id.md)
  et [GED sécurisée du Lot F](lot-f-audit-securite-ged.md)).

## Lot 6 - VOIP

Bascule de la téléphonie vers **Microsoft Teams Phone**, cohérente avec l'investissement Microsoft 365
déjà retenu, complétée par un **SBC (Session Border Controller)** pour l'interconnexion avec le réseau
téléphonique commuté (RTC). VLAN dédié et QoS assurés par les équipements réseau du
[Lot A](lot-a-architecture-reseau.md).
