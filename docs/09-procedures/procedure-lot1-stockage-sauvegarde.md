# Procédure du lot complémentaire approfondi — Lot 1 : Stockage et sauvegarde

## 1. Contexte et objectifs

Cette procédure détaille la mise en œuvre complète de la solution de stockage et de sauvegarde retenue
au [Lot 1](../05-solutions/lots-complementaires.md#lot-1---stockage-et-sauvegarde-lot-approfondi), qui
corrige les constats d'audit **S1** (baie unique) et **S2** (sauvegardes sans copie externalisée) et
conditionne le [PRA/PCA (Lot G)](../05-solutions/lot-g-pra-pca.md). Elle couvre : le déploiement du
serveur Veeam, la déclaration de l'infrastructure de sauvegarde, la configuration de la réplication
inter-sites, la mise en œuvre de la règle **3-2-1-1**, et la procédure de test de restauration.

## 2. Prérequis

- Serveur **Veeam Backup & Replication** (Windows Server 2022, 8 vCPU / 32 Go RAM, cf.
  [prérequis d'installation](../07-migration/prerequis-installation.md)).
- Cluster **VMware vSphere** opérationnel sur les deux sites (Paris/Lyon), avec vCenter Server 8.0.
- Baie de stockage principale (Paris) et baie secondaire (Lyon) accessibles en réseau au serveur Veeam.
- Compte de service disposant des droits d'administration sur vCenter.
- Accès réseau sortant HTTPS 443 vers le stockage objet cloud (dépôt immuable).

## 3. Étape 1 — Installation et connexion à l'infrastructure de virtualisation

1. Installer le rôle **Veeam Backup & Replication** sur le serveur dédié (VLAN 30 — Serveurs).
2. Depuis la console Veeam : **Backup Infrastructure → Managed Servers → Add Server → VMware vSphere**,
   renseigner l'adresse du vCenter Server de Paris, puis répéter l'opération pour le vCenter de Lyon.
3. Vérifier la découverte des hôtes ESXi et des machines virtuelles sur les deux sites.

## 4. Étape 2 — Déclaration des dépôts de sauvegarde (Backup Repositories)

| Dépôt | Type | Localisation | Rôle |
|---|---|---|---|
| REPO-PARIS-LOCAL | Disque (baie SAN principale) | Paris | Sauvegarde de production (copie 1) |
| REPO-LYON-SECOURS | Disque (baie SAN secondaire) | Lyon | Copie de sauvegarde hors site (copie 2) |
| REPO-CLOUD-IMMUABLE | Stockage objet (compatible S3, Object Lock) | Cloud | Copie immuable anti-rançongiciel (copie 3) |

```
Backup Infrastructure → Backup Repositories → Add Repository
  → Direct attached storage → sélectionner la baie Paris → nommer "REPO-PARIS-LOCAL"
  → répéter pour la baie Lyon → nommer "REPO-LYON-SECOURS"
  → Object storage → S3 Compatible → activer "Make recent backups immutable for [30] days"
    → nommer "REPO-CLOUD-IMMUABLE"
```

*Explication :* l'activation de l'option **Immutability** verrouille les fichiers de sauvegarde en écriture
pendant la durée définie (30 jours) : même un compte administrateur compromis ne peut ni modifier ni
supprimer ces sauvegardes avant expiration du verrou — protection déterminante contre les
rançongiciels qui ciblent en priorité les sauvegardes.

## 5. Étape 3 — Configuration du job de réplication (PRA/PCA)

```
Home → Replication Job → Virtual Machine
  → Nom : "REPL-VM-CRITIQUES-PARIS-LYON"
  → Sélectionner les VM critiques : AD, KHS-Core (nœud secondaire), GED/Fichiers
  → Destination : cluster VMware Lyon, datastore de réplication
  → Planification : réplication continue, intervalle 15 minutes
  → Réseau de réplication : dédié (VLAN 30, flux chiffré)
```

*Explication :* l'intervalle de 15 minutes correspond exactement au **RPO cible** défini pour les services
critiques dans le [Lot G — PRA/PCA](../05-solutions/lot-g-pra-pca.md).

## 6. Étape 4 — Configuration des jobs de sauvegarde (règle 3-2-1-1)

### Job de sauvegarde principale

```
Home → Backup Job → Virtual Machine
  → Nom : "BACKUP-QUOTIDIEN-PARIS"
  → Sélectionner l'ensemble des VM de production (Paris)
  → Dépôt cible : REPO-PARIS-LOCAL
  → Planification : quotidienne, 22h00
  → Rétention : 30 points de restauration (30 jours), synthèse mensuelle conservée 12 mois
  → Activer "GFS" (Grandfather-Father-Son) pour la rétention longue durée
```

### Job de copie de sauvegarde (hors site + immuable)

```
Home → Backup Copy Job → Virtual Machine
  → Nom : "COPIE-LYON-ET-CLOUD"
  → Source : job "BACKUP-QUOTIDIEN-PARIS"
  → Cible 1 : REPO-LYON-SECOURS (copie hors site, quotidienne)
  → Cible 2 : REPO-CLOUD-IMMUABLE (copie immuable, hebdomadaire)
  → Fenêtre de copie : en dehors des heures ouvrées
```

*Explication :* ce schéma applique intégralement la règle **3-2-1-1** définie au
[Lot 1](../05-solutions/lots-complementaires.md#lot-1---stockage-et-sauvegarde-lot-approfondi) :
**3** copies (production + Lyon + cloud), sur **2** types de support (disque SAN + stockage objet), **1**
copie hors site (Lyon), **1** copie immuable (cloud).

## 7. Étape 5 — Vérification automatisée (SureBackup)

```
Home → SureBackup Job
  → Nom : "VERIF-AUTOMATIQUE-HEBDO"
  → Lier au job "BACKUP-QUOTIDIEN-PARIS"
  → Environnement de test : réseau isolé (sandbox Veeam)
  → Tests : démarrage de la VM, ping applicatif, vérification des services (AD, SQL)
  → Planification : hebdomadaire
```

*Explication :* SureBackup démarre automatiquement les VM restaurées dans un environnement réseau
isolé et exécute des tests applicatifs, garantissant que les sauvegardes sont **réellement restaurables**
et non uniquement présentes sur le dépôt — répondant directement au principe retenu dans le
[Lot 1](../05-solutions/lots-complementaires.md#lot-1---stockage-et-sauvegarde-lot-approfondi) (« une
sauvegarde non testée n'est pas une sauvegarde »).

## 8. Étape 6 — Procédure de test de restauration manuelle (trimestrielle)

1. Sélectionner un point de restauration récent dans la console Veeam (**Home → Restore → Entire VM**).
2. Restaurer vers un environnement de test isolé (réseau sans accès à la production).
3. Démarrer la VM restaurée et vérifier l'intégrité des données (contrôle applicatif, contrôle de
   cohérence de la base pour KHS-Core).
4. Consigner le résultat dans un **procès-verbal de test de restauration** (date, VM testée, durée de
   restauration constatée, conformité au RTO cible, anomalies éventuelles).
5. Archiver le procès-verbal dans GLPI (documentation technique, cf.
   [Lot I](../05-solutions/lot-i-gestion-parc-maintenance.md)).

## 9. Étape 7 — Supervision

Les jobs de sauvegarde et de réplication sont supervisés via **PRTG** (sonde Veeam dédiée) et génèrent
une alerte en cas d'échec ou de dépassement de la fenêtre de sauvegarde, conformément aux
[éléments à surveiller](../07-migration/elements-a-surveiller.md) définis pour la phase post-migration.

## 10. Résultat attendu

À l'issue de cette procédure, KHS Bank dispose d'un dispositif de sauvegarde conforme à la règle
3-2-1-1, testé automatiquement chaque semaine (SureBackup) et manuellement chaque trimestre, avec une
protection anti-rançongiciel effective (copie immuable) — élément validé lors de la recette (test **T04**,
cf. [Recette](../08-bilan-financier-recette/recette.md)).
