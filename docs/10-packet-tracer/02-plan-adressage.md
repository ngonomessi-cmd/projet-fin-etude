# Plan d'adressage

Le plan VLAN et VLSM reprend **exactement** celui du [dossier](../06-architecture/architecture-reseau-cible.md#3-plan-dadressage-vlsm),
pour démontrer la cohérence entre la conception et la maquette. Seules les adresses des liaisons
routeur/pare-feu/WAN (non présentes dans le dossier, propres à la construction Packet Tracer) sont
ajoutées ici.

## Site Paris

| VLAN | Usage | Réseau | Masque | Passerelle (HSRP, virtuelle) | CORE-PARIS-SW1 (physique) | CORE-PARIS-SW2 (physique) |
|---|---|---|---|---|---|---|
| 10 | Bureautique | 10.10.0.0/22 | 255.255.252.0 | 10.10.0.1 | 10.10.0.2 | 10.10.0.3 |
| 20 | Bancaire (KHS-Core) | 10.10.4.0/26 | 255.255.255.192 | 10.10.4.1 | 10.10.4.2 | 10.10.4.3 |
| 30 | Serveurs | 10.10.4.64/27 | 255.255.255.224 | 10.10.4.65 | 10.10.4.66 | 10.10.4.67 |
| 40 | Wi-Fi invités | 10.10.8.0/24 | 255.255.255.0 | 10.10.8.1 | 10.10.8.2 | 10.10.8.3 |
| 50 | VOIP | 10.10.10.0/23 | 255.255.254.0 | 10.10.10.1 | 10.10.10.2 | 10.10.10.3 |
| 99 | Management | 10.10.12.0/26 | 255.255.255.192 | 10.10.12.1 | 10.10.12.2 | 10.10.12.3 |
| 999 | Native (inutilisé, durcissement) | — | — | — | — | — |

**Adresses des hôtes Paris :**

| Hôte | VLAN | Adresse IP | Passerelle |
|---|---|---|---|
| PC-BUR-PARIS-1 | 10 | DHCP (plage 10.10.0.10–200) | 10.10.0.1 |
| PC-BANCAIRE-PARIS-1 | 20 | 10.10.4.10/26 | 10.10.4.1 |
| SRV-PARIS (DHCP+DNS+fichiers) | 30 | 10.10.4.70/27 (statique) | 10.10.4.65 |
| LAPTOP-WIFI-PARIS-1 | 40 | DHCP (plage 10.10.8.10–200) | 10.10.8.1 |
| IPPHONE-PARIS-1 | 50 | DHCP (plage 10.10.10.10–200) | 10.10.10.1 |

## Liaisons routées Paris (hors dossier, propres à la maquette)

| Liaison | Réseau /30 | Extrémité A | Extrémité B |
|---|---|---|---|
| RTR-PARIS ↔ ISP-RTR | 203.0.113.0/30 | RTR-PARIS Gi0/0 = .2 | ISP-RTR Gi0/0 = .1 |
| RTR-PARIS ↔ FW-PARIS | 10.10.254.0/30 | RTR-PARIS Gi0/1 = .1 | FW-PARIS Eth0/0 (outside) = .2 |
| FW-PARIS ↔ CORE-PARIS-SW1/SW2 (VLAN 100, transit partagé) | 10.10.254.4/29 | FW-PARIS Eth0/1+0/2 (inside) = .5 | CORE-PARIS-SW1 = .6 · CORE-PARIS-SW2 = .7 |
| CORE-PARIS-SW1 ↔ ACC-PARIS-SW | trunk VLAN 10,20,40,50,99 | Fa0/1 | Fa0/1 |
| CORE-PARIS-SW2 ↔ ACC-PARIS-SW | trunk VLAN 10,20,40,50,99 | Fa0/1 | Fa0/2 |
| Tunnel GRE Paris (Tunnel0) | 172.16.0.0/30 | RTR-PARIS = .1 | (RTR-LYON = .2) |

## Site Lyon

| VLAN | Usage | Réseau | Masque | Passerelle (CORE-LYON-SW) |
|---|---|---|---|---|
| 10 | Bureautique | 10.20.0.0/24 | 255.255.255.0 | 10.20.0.1 |
| 20 | Bancaire (KHS-Core) | 10.20.1.0/27 | 255.255.255.224 | 10.20.1.1 |
| 30 | Serveurs | 10.20.1.32/28 | 255.255.255.240 | 10.20.1.33 |
| 40 | Wi-Fi invités | 10.20.2.0/25 | 255.255.255.128 | 10.20.2.1 |
| 50 | VOIP | 10.20.2.128/25 | 255.255.255.128 | 10.20.2.129 |
| 99 | Management | 10.20.3.0/27 | 255.255.255.224 | 10.20.3.1 |

**Adresses des hôtes Lyon :**

| Hôte | VLAN | Adresse IP | Passerelle |
|---|---|---|---|
| PC-BUR-LYON-1 | 10 | DHCP (plage 10.20.0.10–200) | 10.20.0.1 |
| PC-BANCAIRE-LYON-1 | 20 | 10.20.1.10/27 | 10.20.1.1 |
| SRV-LYON (DHCP+DNS) | 30 | 10.20.1.40/28 (statique) | 10.20.1.33 |

## Liaisons routées Lyon

| Liaison | Réseau /30 | Extrémité A | Extrémité B |
|---|---|---|---|
| RTR-LYON ↔ ISP-RTR | 203.0.113.4/30 | RTR-LYON Gi0/0 = .6 | ISP-RTR Gi0/1 = .5 |
| RTR-LYON ↔ FW-LYON | 10.20.254.0/30 | RTR-LYON Gi0/1 = .1 | FW-LYON Eth0/0 (outside) = .2 |
| FW-LYON ↔ CORE-LYON-SW | 10.20.254.4/30 | FW-LYON Eth0/1 (inside) = .5 | CORE-LYON-SW Gi0/1 = .6 |
| Tunnel GRE Lyon (Tunnel0) | 172.16.0.0/30 | RTR-LYON = .2 | (RTR-PARIS = .1) |

## Internet simulé

| Liaison | Réseau /30 | Extrémité A | Extrémité B |
|---|---|---|---|
| ISP-RTR ↔ SRV-INTERNET-TEST | 203.0.113.8/30 | ISP-RTR Gi0/2 = .9 | SRV-INTERNET-TEST = .10 |

## Logique de routage (résumé)

- **RTR-PARIS / RTR-LYON** : route par défaut vers `ISP-RTR` (Internet) + route statique spécifique vers
  le réseau distant (10.20.0.0/16 ou 10.10.0.0/16) via le **Tunnel0**.
- **FW-PARIS / FW-LYON** : route par défaut vers le routeur de site (`outside`) ; exemption de NAT
  (Network Address Translation) pour le trafic à destination du site distant (trafic inter-site jamais
  traduit, uniquement le trafic réellement destiné à Internet).
- **CORE-PARIS-SW1/2 / CORE-LYON-SW** : route par défaut vers le pare-feu (`inside`).

Cette logique est détaillée avec la syntaxe exacte dans les fichiers de [configs/](configs/).
