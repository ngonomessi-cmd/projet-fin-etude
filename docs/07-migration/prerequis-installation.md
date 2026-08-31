# Prérequis techniques d'installation

## Composants virtualisés (cluster VMware vSphere)

| Composant | vCPU | RAM | Disque | OS / Version | Prérequis particuliers |
|---|:---:|:---:|:---:|---|---|
| Contrôleur de domaine (AD/DNS/DHCP) — 1 par site | 4 | 8 Go | 80 Go (OS + data) | Windows Server 2022 | Niveau fonctionnel de forêt 2016 minimum |
| Cluster SQL Server 2022 Always On (KHS-Core) — 2 nœuds | 8 | 32 Go | 500 Go SSD (tempdb séparé) | Windows Server 2022 + SQL Server 2022 Enterprise | Windows Server Failover Cluster (WSFC), témoin de quorum, .NET Framework 4.8 |
| Serveur de fichiers / GED transitoire | 4 | 16 Go | 2 To | Windows Server 2022 | Rôle File Server, DFS-R le temps de la bascule vers SharePoint Online |
| Serveurs applicatifs Oracle 19c (gestion admin./paye) — 2 | 8 | 32 Go | 1 To | Oracle Linux 8 | Oracle Database 19c Enterprise, swap ≥ 16 Go |
| Entra Connect (synchronisation AD ↔ Entra ID) | 2 | 4 Go | 100 Go | Windows Server 2022 | Compte de service dédié, SQL Server Express (embarqué) |
| Collecteur Microsoft Sentinel (Azure Monitor Agent) | 2 | 8 Go | 100 Go (logs) | Windows Server 2022 | Connectivité sortante HTTPS 443 vers Azure |
| GLPI (gestion de parc / ticketing) | 2 | 4 Go | 50 Go | Ubuntu Server 22.04 LTS | PHP 8.1+, MariaDB 10.6+, Apache 2.4 |
| PRTG Network Monitor | 4 | 8 Go | 100 Go | Windows Server 2022 | .NET Framework 4.8, accès SNMP/WMI aux équipements supervisés |
| Veeam Backup & Replication | 8 | 32 Go | Selon volumétrie (cf. Lot 1) | Windows Server 2022 | Compatibilité VMware vSphere 8.0, accès réseau aux baies |

## Infrastructure physique

| Composant | Version / modèle | Prérequis particuliers |
|---|---|---|
| Hôtes de virtualisation (2 par site) | VMware ESXi 8.0 | 384 Go RAM/hôte, vCenter Server 8.0, licences vSphere Enterprise Plus (HA/DRS) |
| Switch cœur/distribution/accès | Cisco IOS-XE 17.x | Licences DNA Advantage (StackWise Virtual, sécurité) |
| Pare-feu | FortiOS 7.4 | Abonnements FortiGuard (IPS, antivirus, filtrage web), licence HA |
| Baies de stockage | Firmware constructeur à jour | Support de la réplication asynchrone compatible Veeam |

## Services cloud (aucune VM on-premise requise)

| Service | Prérequis |
|---|---|
| Microsoft 365 E5 (bureautique, Entra ID, Defender, Purview) | Tenant Microsoft dédié KHS Bank, domaine vérifié, connectivité Internet stable |
| Exchange Online | Migration hybride (coexistence temporaire avec Exchange 2013 le temps du basculement des boîtes) |
| SharePoint Online / OneDrive (GED) | Politiques de rétention et de classification pré-configurées avant ouverture aux utilisateurs |
| Microsoft Sentinel | Espace de travail Log Analytics dédié, connecteurs de données activés par source |
| Microsoft Teams Phone | Numérotation SIP validée avec l'opérateur, SBC certifié |

## Dimensionnement réseau

Le [plan d'adressage VLSM](../06-architecture/architecture-reseau-cible.md#3-plan-dadressage-vlsm) doit
être entièrement configuré sur les équipements cœur/distribution avant tout déploiement applicatif,
condition préalable à la mise en réseau des nouvelles VM.
