# Architecture réseau cible

## 1. Schéma d'ensemble

```
                         FAI Principal          FAI Secours
                        (Orange Business)        (SFR Pro)
                              │                       │
                    ┌─────────┴───────────┬───────────┴─────────┐
                    │                                             │
            ┌───────┴────────┐                            ┌───────┴────────┐
            │  Cluster HA     │                            │  Cluster HA     │
            │  FortiGate 200F │◀──── 2 tunnels IPsec ─────▶│  FortiGate 200F │
            │  (siège Paris)  │      redondants (VPN)       │  (site Lyon)    │
            └───────┬────────┘                            └───────┬────────┘
                    │                                             │
              ┌─────┴─────┐                                 ┌─────┴─────┐
              │    DMZ     │                                 │  (pas de   │
              │ (portail   │                                 │   DMZ,     │
              │ intranet/  │                                 │  back-     │
              │ extranet)  │                                 │  office)   │
              └─────┬─────┘                                 └─────┬─────┘
                    │                                             │
        ┌───────────┴───────────┐                       ┌─────────┴─────────┐
        │  Stack Cisco Catalyst  │                       │  Stack Cisco       │
        │  9300 (cœur N3, HA)    │                       │  Catalyst 9300     │
        └───────────┬───────────┘                       │  (cœur N3, HA)     │
                    │                                    └─────────┬─────────┘
        ┌───────────┴───────────┐                                 │
        │ Catalyst 9200 (distri) │                       Catalyst 9200 (distri)
        └───────────┬───────────┘                                 │
       ┌─────────────┼─────────────┐                    ┌──────────┴──────────┐
   Accès (postes) Accès (Wi-Fi) Accès (VOIP)         Accès (postes)      Accès (Wi-Fi/VOIP)
   VLAN 10/20      VLAN 40       VLAN 50              VLAN 10/20 Lyon     VLAN 40/50 Lyon
        │
   VLAN 30 (serveurs) ── Cluster VMware / stockage (cf. architecture systèmes)
   VLAN 99 (management) ── accès administrateurs via bastion PAM
```

Chaque site dispose désormais de son propre cluster de pare-feu en haute disponibilité, de son propre
double lien Internet et de son propre cœur de réseau redondant — supprimant la dépendance totale du
site de Lyon envers le siège constatée lors de l'audit (constats R2, R3, R4).

## 2. Segmentation VLAN

| VLAN | Usage | Isolation appliquée |
|---|---|---|
| 10 | Postes bureautique | ACL inter-VLAN, accès Internet filtré (proxy Fortinet) |
| 20 | Application bancaire KHS-Core | Isolé, accès filtré par règles pare-feu applicatives strictes |
| 30 | Serveurs / cluster de virtualisation | Accès restreint aux seuls flux applicatifs et à l'administration |
| 40 | Wi-Fi invités | Accès Internet uniquement, aucune route vers le LAN interne |
| 50 | Téléphonie (VOIP / Teams Phone) | QoS dédiée, VLAN voix séparé du VLAN données |
| 99 | Management des équipements | Accès via bastion PAM (Entra PIM), authentification forte obligatoire |

## 3. Plan d'adressage (VLSM)

KHS Bank dispose d'un plan d'adressage privé en **10.0.0.0/8**, décliné par site puis par VLAN selon la
méthode VLSM (*Variable Length Subnet Masking*), afin d'allouer à chaque segment une taille de
sous-réseau adaptée à son nombre réel d'hôtes, sans gaspillage d'adresses.

### Site Paris (siège) — bloc 10.10.0.0/16

| VLAN | Besoin (hôtes) | Sous-réseau alloué | Masque | Hôtes utilisables | Plage utile |
|---|---:|---|---|---:|---|
| 10 — Bureautique | 780 (+ marge) | 10.10.0.0/22 | 255.255.252.0 | 1022 | 10.10.0.1 – 10.10.3.254 |
| 20 — Bancaire (KHS-Core) | ≤ 50 | 10.10.4.0/26 | 255.255.255.192 | 62 | 10.10.4.1 – 10.10.4.62 |
| 30 — Serveurs | ≤ 30 | 10.10.4.64/27 | 255.255.255.224 | 30 | 10.10.4.65 – 10.10.4.94 |
| 40 — Wi-Fi invités | ≤ 200 | 10.10.8.0/24 | 255.255.255.0 | 254 | 10.10.8.1 – 10.10.8.254 |
| 50 — VOIP | ≤ 300 | 10.10.9.0/23 | 255.255.254.0 | 510 | 10.10.9.1 – 10.10.10.254 |
| 99 — Management | ≤ 50 | 10.10.12.0/26 | 255.255.255.192 | 62 | 10.10.12.1 – 10.10.12.62 |

### Site Lyon (secondaire) — bloc 10.20.0.0/16

| VLAN | Besoin (hôtes) | Sous-réseau alloué | Masque | Hôtes utilisables | Plage utile |
|---|---:|---|---|---:|---|
| 10 — Bureautique | 140 (+ marge) | 10.20.0.0/24 | 255.255.255.0 | 254 | 10.20.0.1 – 10.20.0.254 |
| 20 — Bancaire (KHS-Core) | ≤ 30 | 10.20.1.0/27 | 255.255.255.224 | 30 | 10.20.1.1 – 10.20.1.30 |
| 30 — Serveurs (DC secours) | ≤ 15 | 10.20.1.32/28 | 255.255.255.240 | 14 | 10.20.1.33 – 10.20.1.46 |
| 40 — Wi-Fi invités | ≤ 100 | 10.20.2.0/25 | 255.255.255.128 | 126 | 10.20.2.1 – 10.20.2.126 |
| 50 — VOIP | ≤ 100 | 10.20.2.128/25 | 255.255.255.128 | 126 | 10.20.2.129 – 10.20.2.254 |
| 99 — Management | ≤ 20 | 10.20.3.0/27 | 255.255.255.224 | 30 | 10.20.3.1 – 10.20.3.30 |

### Interconnexion inter-sites et DMZ

| Liaison | Sous-réseau | Masque |
|---|---|---|
| Tunnel VPN IPsec principal (Paris ↔ Lyon) | 10.0.0.0/30 | 255.255.255.252 |
| Tunnel VPN IPsec secours (Paris ↔ Lyon) | 10.0.0.4/30 | 255.255.255.252 |
| DMZ (siège) | 10.0.1.0/28 | 255.255.255.240 |

**Exemple de calcul (VLAN 10 — Bureautique Paris) :** pour héberger 780 utilisateurs avec une marge de
croissance, il faut au minimum 2⁹ = 512 adresses (insuffisant), donc 2¹⁰ = 1024 adresses, soit un masque
en **/22** (32 − 10 = 22), offrant 1024 − 2 = **1022 adresses utilisables** — largement suffisant et cohérent
avec la volumétrie cible sans sur-allocation excessive du bloc /16 disponible.

## 4. Justification

Le dimensionnement par VLSM, plutôt qu'un découpage uniforme en /24, évite le gaspillage d'adresses sur
les VLAN à faible population (management, serveurs) tout en réservant la capacité nécessaire aux VLAN à
forte population (bureautique). Cette rigueur de plan d'adressage facilite également la lecture des
règles de pare-feu (cf. [Lot A](../05-solutions/lot-a-architecture-reseau.md)) et la
[procédure de configuration détaillée](../09-procedures/) fournie plus loin dans le dossier.
