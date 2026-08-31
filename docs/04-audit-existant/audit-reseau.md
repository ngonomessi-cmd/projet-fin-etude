# Audit réseau

## 1. Architecture réseau actuelle

L'infrastructure réseau de KHS Bank repose sur une architecture à trois niveaux (cœur, distribution,
accès), présente uniquement au siège de Paris ; le site de Lyon ne dispose que d'un niveau d'accès
raccordé au siège par un lien VPN unique.

```
                         Internet (FAI unique, sans lien de secours)
                                        │
                                 ┌──────┴──────┐
                                 │  Firewall    │  (unique, siège uniquement)
                                 └──────┬──────┘
                                        │
                              ┌─────────┴─────────┐
                              │  Switch Cœur (N3)  │  ← point de défaillance unique
                              └─────────┬─────────┘
                     ┌──────────────────┼──────────────────┐
             ┌───────┴───────┐  ┌───────┴───────┐  ┌───────┴───────┐
             │  Distribution │  │  Distribution │  │  Distribution │
             └───────┬───────┘  └───────┬───────┘  └───────┬───────┘
                     │                  │                  │
              Switches d'accès   Switches d'accès   Switches d'accès
              (postes, Wi-Fi)    (postes, Wi-Fi)    (postes, Wi-Fi)

                                        │
                                 Lien VPN IPsec
                                 (unique, non redondant)
                                        │
                              ┌─────────┴─────────┐
                              │  Site de Lyon      │
                              │  Switch d'accès    │
                              └───────────────────┘
```

## 2. Segmentation réseau actuelle

La segmentation est quasi inexistante : quelques VLAN ont été créés au fil du temps (postes utilisateurs,
serveurs, invités) sans plan d'adressage documenté ni cohérence entre les deux sites. Aucune DMZ
formalisée n'isole les services exposés (portail intranet/extranet) du réseau interne. Les flux liés à
l'application bancaire **KHS-Core** transitent sur le même réseau que la bureautique, sans cloisonnement
dédié — un écart majeur au regard des exigences de sécurité bancaire.

## 3. Inventaire des équipements réseau

| Équipement | État matériel | Marque | Modèle | Quantité | État de la garantie |
|---|---|---|---|---|---|
| Switch cœur (N3) | Souhait de remplacement | Cisco | Catalyst 3560-X | 1 (siège uniquement) | Expirée |
| Switch distribution | Utilisable | Cisco | Catalyst 2960-X | 6 (siège) | Expire bientôt |
| Switch accès — siège | Utilisable | Cisco | Catalyst 2960-S (24 ports) | 34 | Expire bientôt |
| Switch accès — Lyon | Utilisable | Cisco | Catalyst 2960-S (24 ports) | 9 | Expire bientôt |
| Routeurs | Souhait de remplacement | Cisco | ISR 2911 | 2 (1 par site) | Expirée |
| Pare-feu | Souhait de remplacement | Fortinet | FortiGate 100E | 1 (siège uniquement) | Expirée |
| Points d'accès Wi-Fi | Performant | Cisco | Aironet 2802 | 22 (18 siège / 4 Lyon) | Active |
| Câblage | Souhait de remplacement | — | Catégorie 5e | — | N/A |
| Ligne Internet — siège | Utilisable, sans secours | Orange Business | Fibre 1 Gbps symétrique | 1 lien | N/A |
| Ligne Internet — Lyon | Utilisable, sans secours | Orange Business | Fibre 200 Mbps symétrique | 1 lien | N/A |
| Lien VPN inter-sites | Utilisable, non redondant | — | IPsec site-to-site | 1 tunnel | N/A |

*Légende : État de la garantie — Expirée / Expire bientôt / Active.*

## 4. Les liens VPN

Le lien VPN IPsec entre le siège et Lyon est l'unique voie d'accès du site secondaire à l'annuaire Active
Directory, à la messagerie, au serveur de fichiers et à l'application **KHS-Core**. Aucune redondance
n'est en place (pas de second tunnel, pas de FAI de secours) : une rupture de ce lien isole intégralement
le site de Lyon, y compris pour la consultation des comptes et le traitement des opérations bancaires —
un risque majeur au regard des exigences de continuité de service du régulateur.

## 5. Constats de l'audit réseau

| # | Constat | Risque associé | Criticité |
|---|---|---|---|
| R1 | Switch cœur unique, sans redondance (pas de stack ni de VSS) | Panne totale du réseau siège | Élevée |
| R2 | Pare-feu unique, présent uniquement au siège | Site de Lyon non protégé en direct, dépendance totale au VPN | Élevée |
| R3 | Lien VPN inter-sites unique, sans secours | Isolement du site de Lyon en cas de rupture | Élevée |
| R4 | FAI unique par site, sans lien de secours | Perte d'accès Internet = perte de service pour les deux sites | Élevée |
| R5 | Absence de segmentation/DMZ formalisée | Flux bancaires non isolés, surface d'attaque élargie | Élevée |
| R6 | Équipements cœur/routeurs/pare-feu hors garantie | Absence de support constructeur en cas de panne | Moyenne |
| R7 | Câblage catégorie 5e vieillissant | Limitation de débit, fiabilité réduite | Moyenne |

Ces constats alimentent directement la [conclusion de l'audit](conclusion-audit.md) et la proposition de
solutions du [lot A — Architecture réseau](../05-solutions/lot-a-architecture-reseau.md).
