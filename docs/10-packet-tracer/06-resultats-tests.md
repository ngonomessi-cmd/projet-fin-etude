# Résultats des tests de la maquette (recette du 15/11/2026)

Résultats réellement observés dans Packet Tracer, test par test (complète le [plan de test](05-plan-de-test.md)).

| # | Test | Résultat observé | Statut |
|---|---|---|---|
| PT02 | Attribution DHCP (PC-BUR-PARIS-1) | `10.10.0.11/22`, passerelle `10.10.0.1`, DNS `10.10.4.70` (relais `ip helper-address`) | Conforme |
| — | HSRP des VLAN utilisateurs | SW1 Active (priorité 110), SW2 Standby (priorité 90) sur Vl10/20/30/40/50/99 | Conforme |
| — | Transit cœur ↔ pare-feu (VLAN 100) | SW1 → `10.10.254.9` : 4/5 ; SW2 → `10.10.254.9` : 4/5 ; HSRP Vl100 SW1 Active / SW2 Standby, VIP `10.10.254.12` | Conforme |
| — | Table de routage FW-PARIS | `S* 0.0.0.0/0 via 10.10.254.1` (outside) ; `S 10.10.0.0/16 via 10.10.254.12` (inside) | Conforme |
| — | FW-PARIS → VIP HSRP `10.10.254.12` | 4/5 (1er paquet perdu = résolution ARP) | Conforme |
| — | FW-PARIS → RTR-PARIS `10.10.254.1` (outside) | 4/5 | Conforme |
| PT06 | Sortie Internet (PC-BANCAIRE-PARIS-1 → `203.0.113.10`) | 3/4 réponses, TTL=124 (4 sauts routés : cœur, ASA, RTR-PARIS, ISP), après ajout de la route de retour | Conforme |
| PT06 (NAT) | `show ip nat translations` sur RTR-PARIS | 4 entrées `icmp 203.0.113.2:9-12 ↔ 10.10.4.10:9-12` vers `203.0.113.10` (PAT sur l'adresse publique de Gi0/0) | Conforme |
| — | FW-LYON ↔ CORE-LYON-SW (`10.20.254.4/30`) | CORE-LYON-SW → `10.20.254.5` : 4/5 après correction | Conforme |

## Anomalies détectées pendant la recette et corrections

| Anomalie | Cause | Correction |
|---|---|---|
| PC en APIPA (169.254.x.x), DHCP en échec | Port du serveur resté dans le VLAN 1 sur SW1 puis SW2 (configuration antérieure) | Réaffectation des ports d'accès selon le plan de câblage |
| Trunks refusés sur les cœurs 3560 | `switchport mode trunk` exige l'encapsulation explicite | Ajout de `switchport trunk encapsulation dot1q` |
| `Bad mask /29 for address 10.10.254.7` | `.7` est l'adresse de diffusion de `10.10.254.0/29` | Transit inside renuméroté en `10.10.254.8/29` (FW `.9`, SW1 `.10`, SW2 `.11`, VIP HSRP `.12`) |
| Pas de retour du pare-feu vers le LAN | Route de retour absente sur l'ASA | `route inside 10.10.0.0 255.255.0.0 10.10.254.12` (VIP HSRP) |
| PT06 : ping Internet en échec, aucune traduction NAT | Pas de route de retour vers `10.10.0.0/16` sur RTR-PARIS (idem `10.20.0.0/16` sur RTR-LYON) | `ip route 10.10.0.0 255.255.0.0 10.10.254.2` (et `10.20.0.0/16 → 10.20.254.2` à Lyon) |
| Flux inter-site bloqué à l'entrée des pare-feu (anticipé pour PT07) | L'ASA refuse par défaut tout trafic entrant de niveau 0 vers 100 | ACL `OUTSIDE-IN` limitée au LAN de l'autre site sur chaque ASA |
| FW-LYON avec l'adresse d'usine `192.168.1.1/24` côté inside | Configuration inside de l'ASA de Lyon jamais appliquée | `Vlan1` inside en `10.20.254.5/30` + `route inside 10.20.0.0/16 → 10.20.254.6` |
| CORE-LYON-SW ne joint pas le pare-feu (0/5) ; `NATIVE_VLAN_MISMATCH` sur Fa0/3 | Câblage réel décalé : pare-feu sur Fa0/1 (et non Gi0/1), accès sur Fa0/3 (trunk avec VLAN natif 1 au lieu de 999) | Lien routé `10.20.254.6/30` déplacé sur Fa0/1 ; Fa0/3 en trunk dot1q, VLAN natif 999 |
