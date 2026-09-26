# Topologie et câblage

> Version allégée (20 équipements au lieu de 28) : mêmes compétences démontrées (VLAN, HSRP, ACL, NAT,
> VPN, DHCP, sécurité des ports), avec un seul switch d'accès et un seul serveur par site, moins
> d'appareils terminaux redondants. Voir les [simplifications assumées](README.md#simplifications-assumées-à-annoncer-en-soutenance).

## 1. Inventaire des équipements

### Site Paris (siège)

| Nom | Modèle Packet Tracer | Rôle |
|---|---|---|
| RTR-PARIS | Router 2911 | Routeur de bordure (Internet + tunnel GRE) |
| FW-PARIS | ASA 5505 | Pare-feu périmétrique (NAT, ACL) |
| CORE-PARIS-SW1 | Multilayer Switch 3560-24PS | Cœur N3, HSRP actif |
| CORE-PARIS-SW2 | Multilayer Switch 3560-24PS | Cœur N3, HSRP secours |
| ACC-PARIS-SW | Switch 2960-24TT | Accès unique (postes, bancaire, Wi-Fi, VOIP) |
| AP-PARIS | AccessPoint-PT | Borne Wi-Fi (VLAN invités) |
| SRV-PARIS | Server-PT | DHCP + DNS + fichiers (HTTP/FTP), un seul serveur |
| PC-BUR-PARIS-1 | PC-PT | Poste bureautique (VLAN 10) |
| PC-BANCAIRE-PARIS-1 | PC-PT | Poste application KHS-Core (VLAN 20) |
| LAPTOP-WIFI-PARIS-1 | Laptop-PT | Poste Wi-Fi invité (VLAN 40) |
| IPPHONE-PARIS-1 | IP Phone-PT | Téléphonie (VLAN 50, voix) |

### Site Lyon (secondaire)

| Nom | Modèle Packet Tracer | Rôle |
|---|---|---|
| RTR-LYON | Router 2911 | Routeur de bordure |
| FW-LYON | ASA 5505 | Pare-feu périmétrique |
| CORE-LYON-SW | Multilayer Switch 3560-24PS | Cœur + distribution + passerelle (pas d'HSRP) |
| ACC-LYON-SW | Switch 2960-24TT | Accès |
| SRV-LYON | Server-PT | DHCP + DNS |
| PC-BUR-LYON-1 | PC-PT | Poste bureautique |
| PC-BANCAIRE-LYON-1 | PC-PT | Poste KHS-Core |

### Internet simulé

| Nom | Modèle Packet Tracer | Rôle |
|---|---|---|
| ISP-RTR | Router 2911 | Représente le fournisseur d'accès Internet |
| SRV-INTERNET-TEST | Server-PT | Cible de test (ping, DNS, HTTP) « côté Internet » |

**Total : 20 équipements** (contre 28 dans la version initiale — Wi-Fi et téléphonie ne sont démontrés
qu'à Paris, un site suffit à prouver la compétence ; un seul serveur et un seul switch d'accès par site).

## 2. Ce qui change par rapport à la version initiale

| Suppression | Remplacé par |
|---|---|
| DIST-PARIS-SW | Les deux cœurs se connectent **directement** à ACC-PARIS-SW (2 liens redondants) |
| ACC-PARIS-SW2 | Fusionné dans **ACC-PARIS-SW**, qui porte tous les VLAN clients |
| SRV-FICHIERS-PARIS | Fusionné dans **SRV-PARIS** (un serveur Packet Tracer peut cumuler DHCP, DNS, HTTP, FTP) |
| PC-BUR-PARIS-2 | Un seul poste bureautique suffit à prouver le VLAN 10 |
| PRINT-PARIS-1 | Aucune compétence réseau notée n'en dépend |
| AP-LYON, LAPTOP-WIFI-LYON-1, IPPHONE-LYON-1 | Wi-Fi et VOIP déjà démontrés à Paris |

## 3. Plan de câblage

| Périphérique A | Interface A | Câble | Périphérique B | Interface B |
|---|---|---|---|---|
| RTR-PARIS | GigabitEthernet0/0 | Automatique | ISP-RTR | GigabitEthernet0/0 |
| RTR-LYON | GigabitEthernet0/0 | Automatique | ISP-RTR | GigabitEthernet0/1 |
| ISP-RTR | GigabitEthernet0/2 | Automatique | SRV-INTERNET-TEST | FastEthernet0 |
| RTR-PARIS | GigabitEthernet0/1 | Automatique | FW-PARIS | Ethernet0/0 (outside) |
| FW-PARIS | Ethernet0/1 (inside) | Automatique | CORE-PARIS-SW1 | GigabitEthernet0/1 |
| FW-PARIS | Ethernet0/2 (inside) | Automatique | CORE-PARIS-SW2 | GigabitEthernet0/1 |
| RTR-LYON | GigabitEthernet0/1 | Automatique | FW-LYON | Ethernet0/0 (outside) |
| FW-LYON | Ethernet0/1 (inside) | Automatique | CORE-LYON-SW | GigabitEthernet0/1 |
| CORE-PARIS-SW1 | GigabitEthernet0/2 | Automatique | CORE-PARIS-SW2 | GigabitEthernet0/2 |
| CORE-PARIS-SW1 | FastEthernet0/2 | Automatique | SRV-PARIS | FastEthernet0 |
| CORE-PARIS-SW1 | FastEthernet0/1 | Automatique | ACC-PARIS-SW | FastEthernet0/1 |
| CORE-PARIS-SW2 | FastEthernet0/1 | Automatique | ACC-PARIS-SW | FastEthernet0/2 |
| ACC-PARIS-SW | FastEthernet0/3 | Automatique | PC-BUR-PARIS-1 | FastEthernet0 |
| ACC-PARIS-SW | FastEthernet0/4 | Automatique | PC-BANCAIRE-PARIS-1 | FastEthernet0 |
| ACC-PARIS-SW | FastEthernet0/5 | Automatique | AP-PARIS | Port0 |
| AP-PARIS | — (sans fil) | Wi-Fi | LAPTOP-WIFI-PARIS-1 | Carte Wi-Fi |
| ACC-PARIS-SW | FastEthernet0/6 | Automatique | IPPHONE-PARIS-1 | Port Switch |
| CORE-LYON-SW | FastEthernet0/2 | Automatique | SRV-LYON | FastEthernet0 |
| CORE-LYON-SW | FastEthernet0/1 | Automatique | ACC-LYON-SW | FastEthernet0/1 |
| ACC-LYON-SW | FastEthernet0/2 | Automatique | PC-BUR-LYON-1 | FastEthernet0 |
| ACC-LYON-SW | FastEthernet0/3 | Automatique | PC-BANCAIRE-LYON-1 | FastEthernet0 |

## 4. Schéma logique

```
                                   ┌───────────────────┐
                                   │  SRV-INTERNET-TEST │
                                   └─────────┬─────────┘
                                             │
                                   ┌─────────┴─────────┐
                                   │      ISP-RTR       │
                                   └────┬──────────┬───┘
                          Gi0/0 (Paris) │          │ Gi0/1 (Lyon)
                    ┌────────────────────┘          └────────────────────┐
              ┌─────┴─────┐                                       ┌──────┴────┐
              │ RTR-PARIS │═══════ Tunnel GRE (VPN inter-site) ══════│ RTR-LYON  │
              └─────┬─────┘                                       └──────┬────┘
                    │                                                    │
              ┌─────┴─────┐                                       ┌──────┴────┐
              │ FW-PARIS  │ (ASA 5505)                             │ FW-LYON   │
              └──┬─────┬──┘                                       └──────┬────┘
         ┌───────┘     └───────┐                                         │
   ┌─────┴──────┐        ┌─────┴──────┐                            ┌─────┴──────┐
   │CORE-PARIS  │══HSRP═══│CORE-PARIS  │                            │ CORE-LYON  │
   │   -SW1     │  +trunk  │   -SW2     │                            │    -SW     │
   └──┬───┬─────┘          └─────┬───┬──┘                            └──┬───┬────┘
      │   └──────── ACC-PARIS-SW ┘   │                                  │   │
   SRV-PARIS   (postes, bancaire, Wi-Fi, VOIP)                     SRV-LYON  ACC-LYON-SW
                                                                              (postes)
```
