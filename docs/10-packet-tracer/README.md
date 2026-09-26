# Maquette Cisco Packet Tracer — KHS Bank / MOM-TECH

Cette section adapte l'[architecture cible](../06-architecture/) du dossier en une maquette réellement
**constructible et testable dans Cisco Packet Tracer (PT)**, logiciel de simulation réseau Cisco. Je ne
peux pas exécuter Packet Tracer ni produire directement un fichier `.pkt` (format propriétaire, logiciel
graphique) — cette section fournit tout ce qu'il faut pour la construire vous-mêmes : plan d'équipements,
câblage, configurations CLI (Command Line Interface — ligne de commande) complètes, et plan de test.

- [01 — Topologie et câblage](01-topologie-et-cablage.md)
- [02 — Plan d'adressage](02-plan-adressage.md)
- [03 — Guide de construction pas-à-pas](03-guide-construction.md)
- [04 — Configuration des serveurs et postes](04-configuration-serveurs-et-postes.md)
- [05 — Plan de test](05-plan-de-test.md)
- [configs/](configs/) — un fichier `.txt` par équipement réseau, prêt à copier-coller dans sa console

## Pourquoi les équipements diffèrent du dossier "réel"

Le dossier de mise en situation prescrit des équipements haut de gamme (Cisco Catalyst 9300, Fortinet
FortiGate) qui n'existent pas dans le catalogue de Packet Tracer. La maquette utilise les équivalents
**disponibles et pédagogiquement reconnus** dans PT, sans changer la logique d'architecture :

| Rôle | Dossier (cible réelle) | Maquette Packet Tracer |
|---|---|---|
| Cœur de réseau (N3) | Cisco Catalyst 9300 en stack | 2 × Switch multicouche **3560-24PS** en **HSRP** (Hot Standby Router Protocol — protocole de redondance de passerelle) |
| Distribution / Accès | Cisco Catalyst 9200 | Switch **2960-24TT** |
| Pare-feu périmétrique | Fortinet FortiGate 200F en cluster HA | **ASA 5505** (pare-feu Cisco, un par site) |
| Routeur de bordure | Intégré au pare-feu | Routeur **1941/2911** |
| Borne Wi-Fi | Cisco Aironet 2802 | **AccessPoint-PT** |
| Serveurs (AD/DNS/DHCP, fichiers) | Windows Server 2022 | **Server-PT** (services configurables par onglet GUI) |

## Simplifications assumées (à annoncer en soutenance)

- **Un seul pare-feu par site** (pas de cluster HA) : la redondance de la maquette porte sur le cœur de
  réseau (HSRP) et sur le double lien FAI (Fournisseur d'Accès à Internet), pas sur le pare-feu lui-même.
  La configuration HA du pare-feu reste documentée dans le [Lot A du dossier](../05-solutions/lot-a-architecture-reseau.md).
- **Redondance de l'uplink cœur → pare-feu à Paris** : l'ASA 5505 en licence de base n'accepte que
  2 VLAN actifs (inside/outside), donc pas de trunk vers le cœur. Les deux ports internes disponibles
  de l'ASA (Ethernet0/1 et 0/2) sont donc affectés au **même VLAN "inside"**, formant un petit segment
  partagé (VLAN 100, transit) auquel CORE-PARIS-SW1 **et** CORE-PARIS-SW2 sont directement raccordés :
  si l'un des deux cœurs tombe, l'autre conserve un accès direct au pare-feu, sans dépendre de l'HSRP
  (Hot Standby Router Protocol) pour cela.
- **Un seul lien FAI simulé** par site vers un routeur « ISP-RTR » représentant Internet (la redondance
  FAI réelle à deux opérateurs distincts est documentée mais non doublée physiquement dans la maquette,
  pour rester dans un temps de construction raisonnable).
- **Liaison inter-site en tunnel GRE** (Generic Routing Encapsulation — encapsulation générique de
  routage) entre les deux routeurs de site, représentant le VPN (Virtual Private Network — réseau privé
  virtuel) IPsec du dossier réel. Le tunnel GRE est fiable et intégralement supporté par PT ; l'ajout
  d'IPsec par-dessus (GRE over IPsec) est indiqué en option dans les configurations routeur.
- **Échelle réduite** : quelques PC représentatifs par VLAN plutôt que les 920 postes réels — le plan
  d'adressage (VLSM) reste néanmoins identique à celui du dossier, pour démontrer la cohérence entre la
  conception papier et la maquette pratique.

## Vue d'ensemble logique

```
Internet (ISP-RTR)
        │
   ┌────┴────┐
RTR-PARIS   RTR-LYON  ←── tunnel GRE (VPN inter-site) ──→ (reliés entre eux)
   │            │
FW-PARIS     FW-LYON        (ASA 5505, périmètre + NAT)
   │            │
CORE-PARIS   CORE-LYON      (L3, HSRP à Paris)
   │            │
DIST-PARIS   ACC-LYON-SW
   │
ACC-PARIS-SW1/2 + AP + IP Phone + postes + imprimante + serveurs
```
