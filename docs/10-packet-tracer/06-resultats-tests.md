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

## Anomalies détectées pendant la recette et corrections

| Anomalie | Cause | Correction |
|---|---|---|
| PC en APIPA (169.254.x.x), DHCP en échec | Port du serveur resté dans le VLAN 1 sur SW1 puis SW2 (configuration antérieure) | Réaffectation des ports d'accès selon le plan de câblage |
| Trunks refusés sur les cœurs 3560 | `switchport mode trunk` exige l'encapsulation explicite | Ajout de `switchport trunk encapsulation dot1q` |
| `Bad mask /29 for address 10.10.254.7` | `.7` est l'adresse de diffusion de `10.10.254.0/29` | Transit inside renuméroté en `10.10.254.8/29` (FW `.9`, SW1 `.10`, SW2 `.11`, VIP HSRP `.12`) |
| Pas de retour du pare-feu vers le LAN | Route de retour absente sur l'ASA | `route inside 10.10.0.0 255.255.0.0 10.10.254.12` (VIP HSRP) |
