# Topologie et câblage

## 1. Inventaire des équipements

### Site Paris (siège)

| Nom | Modèle Packet Tracer | Rôle |
|---|---|---|
| RTR-PARIS | Router 2911 | Routeur de bordure (Internet + tunnel GRE) |
| FW-PARIS | ASA 5505 | Pare-feu périmétrique (NAT, ACL) |
| CORE-PARIS-SW1 | Multilayer Switch 3560-24PS | Cœur N3, HSRP actif |
| CORE-PARIS-SW2 | Multilayer Switch 3560-24PS | Cœur N3, HSRP secours |
| DIST-PARIS-SW | Switch 2960-24TT | Distribution |
| ACC-PARIS-SW1 | Switch 2960-24TT | Accès (postes bureautique + bancaire) |
| ACC-PARIS-SW2 | Switch 2960-24TT | Accès (Wi-Fi, VOIP, imprimante) |
| AP-PARIS | AccessPoint-PT | Borne Wi-Fi (VLAN invités) |
| SRV-DHCP-DNS-PARIS | Server-PT | DHCP + DNS |
| SRV-FICHIERS-PARIS | Server-PT | Partage fichiers (FTP/HTTP) |
| PC-BUR-PARIS-1, PC-BUR-PARIS-2 | PC-PT | Postes bureautique (VLAN 10) |
| PC-BANCAIRE-PARIS-1 | PC-PT | Poste application KHS-Core (VLAN 20) |
| LAPTOP-WIFI-PARIS-1 | Laptop-PT | Poste Wi-Fi invité (VLAN 40) |
| IPPHONE-PARIS-1 | IP Phone-PT | Téléphonie (VLAN 50, voix) |
| PRINT-PARIS-1 | Printer-PT | Imprimante réseau (VLAN 10) |

### Site Lyon (secondaire)

| Nom | Modèle Packet Tracer | Rôle |
|---|---|---|
| RTR-LYON | Router 2911 | Routeur de bordure |
| FW-LYON | ASA 5505 | Pare-feu périmétrique |
| CORE-LYON-SW | Multilayer Switch 3560-24PS | Cœur + distribution (échelle réduite, sans HSRP) |
| ACC-LYON-SW | Switch 2960-24TT | Accès |
| AP-LYON | AccessPoint-PT | Borne Wi-Fi |
| SRV-DHCP-DNS-LYON | Server-PT | DHCP + DNS (secours) |
| PC-BUR-LYON-1 | PC-PT | Poste bureautique |
| PC-BANCAIRE-LYON-1 | PC-PT | Poste KHS-Core |
| LAPTOP-WIFI-LYON-1 | Laptop-PT | Poste Wi-Fi invité |
| IPPHONE-LYON-1 | IP Phone-PT | Téléphonie |

### Internet simulé

| Nom | Modèle Packet Tracer | Rôle |
|---|---|---|
| ISP-RTR | Router 2911 | Représente le fournisseur d'accès Internet |
| SRV-INTERNET-TEST | Server-PT | Cible de test (ping, DNS, HTTP) « côté Internet » |

**Total : 28 équipements.**

## 2. Plan de câblage

| Périphérique A | Interface A | Câble | Périphérique B | Interface B |
|---|---|---|---|---|
| RTR-PARIS | GigabitEthernet0/0 | Cuivre droit | ISP-RTR | GigabitEthernet0/0 |
| RTR-LYON | GigabitEthernet0/0 | Cuivre droit | ISP-RTR | GigabitEthernet0/1 |
| ISP-RTR | GigabitEthernet0/2 | Cuivre droit | SRV-INTERNET-TEST | FastEthernet0 |
| RTR-PARIS | GigabitEthernet0/1 | Cuivre droit | FW-PARIS | Ethernet0/0 (outside) |
| FW-PARIS | Ethernet0/1 (inside) | Cuivre droit | CORE-PARIS-SW1 | GigabitEthernet0/1 |
| FW-PARIS | Ethernet0/2 (inside) | Cuivre droit | CORE-PARIS-SW2 | GigabitEthernet0/1 |
| RTR-LYON | GigabitEthernet0/1 | Cuivre droit | FW-LYON | Ethernet0/0 (outside) |
| FW-LYON | Ethernet0/1 (inside) | Cuivre droit | CORE-LYON-SW | GigabitEthernet0/1 |
| CORE-PARIS-SW1 | GigabitEthernet0/2 | Cuivre croisé | CORE-PARIS-SW2 | GigabitEthernet0/2 |
| CORE-PARIS-SW1 | FastEthernet0/1 | Cuivre droit | DIST-PARIS-SW | FastEthernet0/1 |
| CORE-PARIS-SW2 | FastEthernet0/1 | Cuivre droit | DIST-PARIS-SW | FastEthernet0/2 |
| DIST-PARIS-SW | FastEthernet0/3 | Cuivre droit | ACC-PARIS-SW1 | FastEthernet0/1 |
| DIST-PARIS-SW | FastEthernet0/4 | Cuivre droit | ACC-PARIS-SW2 | FastEthernet0/1 |
| CORE-PARIS-SW1 | FastEthernet0/2 | Cuivre droit | SRV-DHCP-DNS-PARIS | FastEthernet0 |
| CORE-PARIS-SW1 | FastEthernet0/3 | Cuivre droit | SRV-FICHIERS-PARIS | FastEthernet0 |
| ACC-PARIS-SW1 | FastEthernet0/2 | Cuivre droit | PC-BUR-PARIS-1 | FastEthernet0 |
| ACC-PARIS-SW1 | FastEthernet0/3 | Cuivre droit | PC-BUR-PARIS-2 | FastEthernet0 |
| ACC-PARIS-SW1 | FastEthernet0/4 | Cuivre droit | PC-BANCAIRE-PARIS-1 | FastEthernet0 |
| ACC-PARIS-SW2 | FastEthernet0/2 | Cuivre droit | AP-PARIS | Port0 |
| AP-PARIS | — (sans fil) | Wi-Fi | LAPTOP-WIFI-PARIS-1 | Carte Wi-Fi |
| ACC-PARIS-SW2 | FastEthernet0/3 | Cuivre droit | IPPHONE-PARIS-1 | Port Switch |
| IPPHONE-PARIS-1 | Port PC | Cuivre droit | PC-BUR-PARIS-2 *(optionnel, PC derrière le tél.)* | — |
| ACC-PARIS-SW2 | FastEthernet0/4 | Cuivre droit | PRINT-PARIS-1 | FastEthernet0 |
| CORE-LYON-SW | FastEthernet0/1 | Cuivre droit | ACC-LYON-SW | FastEthernet0/1 |
| CORE-LYON-SW | FastEthernet0/2 | Cuivre droit | SRV-DHCP-DNS-LYON | FastEthernet0 |
| ACC-LYON-SW | FastEthernet0/2 | Cuivre droit | PC-BUR-LYON-1 | FastEthernet0 |
| ACC-LYON-SW | FastEthernet0/3 | Cuivre droit | PC-BANCAIRE-LYON-1 | FastEthernet0 |
| ACC-LYON-SW | FastEthernet0/4 | Cuivre droit | AP-LYON | Port0 |
| AP-LYON | — (sans fil) | Wi-Fi | LAPTOP-WIFI-LYON-1 | Carte Wi-Fi |
| ACC-LYON-SW | FastEthernet0/5 | Cuivre droit | IPPHONE-LYON-1 | Port Switch |

> Packet Tracer choisit automatiquement le bon type de câble si vous utilisez le câble **« Automatique »**
> (icône éclair) lors du câblage — c'est la option la plus simple pour un premier montage.

## 3. Schéma logique complet

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
              └─────┬─────┘                                       └──────┬────┘
        ┌───────────┴───────────┐                                       │
  ┌─────┴──────┐          ┌─────┴──────┐                          ┌─────┴──────┐
  │CORE-PARIS  │══HSRP═══│CORE-PARIS  │                          │ CORE-LYON  │
  │   -SW1     │  +trunk  │   -SW2     │                          │    -SW     │
  └─────┬──────┘          └─────┬──────┘                          └─────┬──────┘
        │      ┌──────────────── │                                       │
   ┌────┴──┐   │            ┌────┴────┐                             ┌────┴────┐
   │SRV-*  │   └──── DIST-PARIS-SW ───┘                             │ACC-LYON │
   └───────┘             │        │                                  -SW     │
                   ┌──────┘        └──────┐                          └──┬──┬──┘
             ACC-PARIS-SW1          ACC-PARIS-SW2                       │  │
             (postes + bancaire)    (Wi-Fi, VOIP, imprimante)      postes AP/Tel.
```
