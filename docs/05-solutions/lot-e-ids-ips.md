# Lot E — Système de prévention d'intrusion (IDS/IPS)

## Constats traités

R5 (absence de segmentation/DMZ), C1 (absence de détection) — cf. audits
[réseau](../04-audit-existant/audit-reseau.md) et [cybersécurité](../04-audit-existant/audit-cybersecurite.md).

## Solution proposée

- Activation du module **IPS natif des pare-feu Fortinet FortiGate** (cf. [Lot A](lot-a-architecture-reseau.md))
  en coupure sur l'ensemble des flux inter-VLAN et sur les flux entrants/sortants Internet, sur les deux
  sites.
- Signatures mises à jour automatiquement (FortiGuard), avec profils de protection renforcés sur le
  **VLAN 20 (application bancaire KHS-Core)** et la DMZ.
- Journaux IPS envoyés vers **Microsoft Sentinel** (cf. [SOC](cybersecurity-framework-soc.md)) pour
  corrélation avec les événements EDR et identité.
- Positionnement complémentaire d'une sonde de détection réseau (NDR) sur le cœur de réseau du siège
  pour la détection de mouvements latéraux, alimentant également le SIEM.

## Justification

Intégrer l'IPS directement dans les pare-feu déjà retenus au Lot A évite d'ajouter un boîtier
supplémentaire (réduction des coûts et de la complexité d'exploitation), tout en conservant une
détection en coupure sur tous les flux sensibles. La centralisation des journaux vers le SIEM permet de
traiter ce lot non comme un silo technique isolé, mais comme une source d'alerte parmi d'autres dans la
stratégie de détection globale du SOC.

## Bénéfices attendus

- Blocage en temps réel des tentatives d'intrusion sur les flux bancaires.
- Visibilité consolidée des tentatives d'intrusion au sein du SOC.
