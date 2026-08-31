# Architecture systèmes cible

## 1. Schéma de la salle serveurs et du cluster de virtualisation

```
                         Site Paris (siège)                         Site Lyon (secours actif)
                 ┌─────────────────────────────────┐        ┌─────────────────────────────────┐
                 │   Cluster VMware vSphere HA/DRS   │        │   Cluster VMware vSphere HA/DRS   │
                 │  ┌───────────┐  ┌───────────┐    │        │  ┌───────────┐                    │
                 │  │  Hôte 1   │  │  Hôte 2   │    │◀──────▶│  │  Hôte 1   │                    │
                 │  └───────────┘  └───────────┘    │  vMotion/│  └───────────┘                    │
                 │  VM : AD, DNS/DHCP, Fichiers,     │  réplic. │  VM : AD (secours), DNS/DHCP,     │
                 │  GLPI, PRTG, Sentinel (collecteur)│  Veeam   │  Fichiers (répliqué)               │
                 └───────────────┬───────────────────┘        └───────────────┬───────────────────┘
                                 │                                             │
                 ┌───────────────┴───────────────────┐        ┌───────────────┴───────────────────┐
                 │  Baie de stockage SAN principale   │──────▶│  Baie de stockage SAN secondaire   │
                 │  (production)                       │ répl. │  (réplique asynchrone 15 min)      │
                 └─────────────────────────────────────┘        └─────────────────────────────────────┘

                 ┌─────────────────────────────────┐
                 │  Cluster SQL Server 2022          │
                 │  Always On Availability Group     │
                 │  (KHS-Core) — nœud Paris          │◀────────────────────▶ nœud Lyon (secours)
                 └─────────────────────────────────┘

                 ┌─────────────────────────────────┐
                 │  Serveurs Linux (Oracle 19c)       │
                 │  gestion administrative/paye       │
                 └─────────────────────────────────┘
```

## 2. Répartition des rôles serveurs

| Rôle | Localisation | Redondance |
|---|---|---|
| Contrôleur de domaine (AD/DNS/DHCP) | 1 par site | Réplication multi-maître AD native |
| Cluster de virtualisation (VMware vSphere HA/DRS) | Paris + Lyon | Bascule automatique inter-hôtes, réplication inter-sites via Veeam |
| Base applicative KHS-Core (SQL Server 2022) | Paris (primaire) + Lyon (secondaire) | Always On Availability Group, bascule automatique |
| Bases Oracle (gestion administrative/paye) | Paris | Sauvegarde + réplication vers Lyon (cf. [Lot 1](../05-solutions/lots-complementaires.md)) |
| Serveur de fichiers / GED | Paris (primaire) | Réplication asynchrone vers Lyon |
| Messagerie | Cloud (Exchange Online) | SLA Microsoft 99,9 % |
| Supervision (PRTG/GLPI), collecteur SIEM (Sentinel) | Paris, redondé en VM sur Lyon | Reprise manuelle en cas de sinistre du siège |

## 3. Dimensionnement indicatif

| Composant | Paris | Lyon |
|---|---|---|
| Hôtes de virtualisation | 2 (cluster HA) | 1 (secours actif, extensible à 2) |
| Capacité stockage SAN | 40 To utiles (marge 40 %) | 40 To utiles (miroir) |
| VM actives | ≈ 35 | ≈ 10 (+ bascule des VM critiques en cas de sinistre) |

## 4. Justification

La réplication du cluster de virtualisation et du stockage entre Paris et Lyon transforme le site
secondaire en véritable **site de secours actif**, condition nécessaire pour respecter les RPO/RTO définis
au [Lot G — PRA/PCA](../05-solutions/lot-g-pra-pca.md) et l'exigence de continuité de service du
régulateur bancaire sur l'application KHS-Core.
