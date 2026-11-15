# Résultats des tests de la maquette (recette du 15/11/2026)

Résultats réellement observés dans Packet Tracer, test par test (complète le [plan de test](05-plan-de-test.md)).

| # | Test | Résultat observé | Statut |
|---|---|---|---|
| PT02 | Attribution DHCP (PC-BUR-PARIS-1) | `10.10.0.11/22`, passerelle `10.10.0.1`, DNS `10.10.4.70` (relais `ip helper-address`) | Conforme |
| PT02 (Lyon) | Attribution DHCP (PC-BUR-LYON-1, `ipconfig /renew`) | `10.20.0.10/24`, passerelle `10.20.0.1`, DNS `10.20.1.40` (SRV-LYON) | Conforme |
| — | HSRP des VLAN utilisateurs | SW1 Active (priorité 110), SW2 Standby (priorité 90) sur Vl10/20/30/40/50/99 | Conforme |
| — | Transit cœur ↔ pare-feu (VLAN 100) | SW1 → `10.10.254.9` : 4/5 ; SW2 → `10.10.254.9` : 4/5 ; HSRP Vl100 SW1 Active / SW2 Standby, VIP `10.10.254.12` | Conforme |
| — | Table de routage FW-PARIS | `S* 0.0.0.0/0 via 10.10.254.1` (outside) ; `S 10.10.0.0/16 via 10.10.254.12` (inside) | Conforme |
| — | FW-PARIS → VIP HSRP `10.10.254.12` | 4/5 (1er paquet perdu = résolution ARP) | Conforme |
| — | FW-PARIS → RTR-PARIS `10.10.254.1` (outside) | 4/5 | Conforme |
| PT06 | Sortie Internet (PC-BANCAIRE-PARIS-1 → `203.0.113.10`) | 3/4 réponses, TTL=124 (4 sauts routés : cœur, ASA, RTR-PARIS, ISP), après ajout de la route de retour | Conforme |
| PT06 (NAT) | `show ip nat translations` sur RTR-PARIS | 4 entrées `icmp 203.0.113.2:9-12 ↔ 10.10.4.10:9-12` vers `203.0.113.10` (PAT sur l'adresse publique de Gi0/0) | Conforme |
| PT07 | Inter-site PC-BUR-PARIS-1 (`10.10.0.11`) → PC-BUR-LYON-1 (`10.20.0.10`) | `ping -n 10` : 10/10, 0 % de perte, TTL=122 (6 sauts routés) | Conforme |
| PT07 (chemin) | `tracert 10.20.0.10` | 1 `10.10.0.2` (SW1) · 2 `10.10.254.9` (FW-PARIS) · 3-4 `*` (RTR-PARIS et extrémité GRE de RTR-LYON : leurs messages ICMP « TTL expiré » sont filtrés par l'ACL `OUTSIDE-IN` de FW-PARIS, qui n'admet que les sources `10.20.0.0/16`) · 5 `10.20.254.2` (FW-LYON) · 6 `10.20.254.6` (CORE-LYON-SW) · 7 `10.20.0.10` | Conforme |
| PT08 | Exemption de NAT inter-site : `show ip nat translations` sur RTR-PARIS juste après PT07 | Table vide : aucune traduction pour `10.20.0.10` (le flux inter-site emprunte le tunnel GRE sans NAT, grâce à la ligne `deny` de l'ACL 100) | Conforme |
| PT10 | Filtrage entrant : depuis RTR-PARIS (outside), `ping 10.10.254.2` et `ping 10.10.0.11` | 0/5 et 0/5. Le routage est pourtant en place (même chemin que PT07) : seule la source diffère (`10.10.254.1` au lieu de `10.20.0.0/16`), c'est donc bien l'ACL `OUTSIDE-IN` de l'ASA qui bloque. L'interface outside ne répond pas non plus au ping (pare-feu « furtif » côté Internet) | Conforme |
| PT04 | Isolation des invités : LAPTOP-WIFI-PARIS-1 (`10.10.8.10/24`, passerelle `10.10.8.1`) → `ping 10.10.0.11` | 0/4 — « Destination host unreachable » renvoyé par `10.10.8.2` (SVI VLAN 40 de SW1) : l'ACL `ACL-INVITES` rejette le paquet dès l'entrée du routage | Conforme (après correction) |
| PT05 | Accès Internet des invités : `ping 203.0.113.10` | 3/4, TTL=124 (1er paquet perdu = ARP) : l'ACL bloque le LAN interne, pas Internet | Conforme |
| PT09 | Téléphonie : IPPHONE-PARIS-1 (Cisco 7960) sur ACC-PARIS-SW Fa0/7 | `Vlan50` up, `10.10.10.10/23`, passerelle `10.10.10.1` (VIP HSRP du VLAN voix) : le téléphone a reconnu la voice VLAN 50 annoncée par le commutateur | Conforme |
| PT11 (état initial) | `show standby brief` sur CORE-PARIS-SW1 | 7 groupes HSRP Active, priorité 110, préemption (P) : Vl10 → VIP `10.10.0.1`, Vl20 → `10.10.4.1`, Vl30 → `10.10.4.65`, Vl40 → `10.10.8.1`, Vl50 → `10.10.10.1`, Vl99 → `10.10.12.1`, Vl100 → `10.10.254.12` ; Standby = SW2 sur chaque VLAN. `ping -t 203.0.113.10` stable (TTL=124) | Conforme |
| PT11 | Panne de CORE-PARIS-SW1 (tous ses ports en `shutdown` = perte totale de l'équipement ; le 3560 de PT n'a pas d'interrupteur) pendant `ping -t 203.0.113.10` | 6 « Request timed out » consécutifs (≈ 6 s, temps de détection HSRP), puis reprise automatique des réponses sans aucune intervention | Conforme |
| PT12 | Redondance de l'uplink cœur → pare-feu (même ping, SW1 hors service) | Le trafic Internet reprend via SW2 → FW-PARIS (Et0/2) : la VIP `10.10.254.12` (route de retour de l'ASA) a basculé sur SW2 avec les VIP des VLAN utilisateurs | Conforme |
| PT12 (retour) | `no shutdown` des ports de SW1 puis `show standby brief` | Préemption : `Standby -> Active` pour les 7 groupes ; SW1 de nouveau Active (priorité 110) avec SW2 en Standby (Vl100 : `unknown` le temps que SW2 repasse Standby) | Conforme |
| PT13 | Panne du lien RTR-PARIS ↔ ISP-RTR, puis `ping 10.20.0.10` depuis PC-BUR-PARIS-1 | 0/4 — « Destination host unreachable » renvoyé par `10.10.254.9` (FW-PARIS) : le tunnel GRE repose sur ce lien unique, la route vers Lyon disparaît | Conforme (limite connue : un seul lien Internet par site) |
| PT13 (retour) | Câble RTR-PARIS ↔ ISP-RTR rebranché, `ping 10.20.0.10` | Reprise automatique (tunnel GRE remonté) : réponses TTL=122 | Conforme |
| PT11 (bascule) | `show standby brief` sur CORE-PARIS-SW2 pendant la panne | Messages `%HSRP-6-STATECHANGE … Standby -> Active` pour les 7 groupes ; état Active, priorité 90, Standby `unknown` (SW1 absent), VIP inchangées | Conforme |
| Observation | Interface Vlan30 (serveurs) de SW2 passe `down` pendant la panne | SRV-PARIS (DHCP/DNS/fichiers) n'est raccordé qu'à SW1 (Fa0/3) : point de défaillance unique résiduel de la maquette. Dans la cible du dossier, les serveurs sont virtualisés en cluster avec double attachement réseau (Lot B) | Limite connue, documentée |
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
| PT04 : le laptop invité reçoit `10.10.0.12/22` (VLAN 10) et joint le LAN interne (TTL=128, même segment) | Configuration d'accès appliquée selon le plan initial (laptop Fa0/7, téléphone Fa0/6) alors que les câbles sont inversés | Inversion des configurations : Fa0/6 en VLAN 40 (laptop), Fa0/7 en VLAN 10 + voice VLAN 50 (téléphone) |
| `NATIVE_VLAN_MISMATCH` entre ACC-PARIS-SW Fa0/2 (999) et CORE-PARIS-SW2 Fa0/3 (1) | VLAN natif non appliqué sur le trunk de SW2 | `switchport trunk native vlan 999` sur SW2 Fa0/3 |
| Après PT12 : Vl100 en Standby `unknown` sur SW1 (SW1 n'entend plus SW2 sur le VLAN de transit) | VLAN 100 absent du trunk direct SW1 ↔ SW2 : les hello HSRP ne passaient que par les ports de l'ASA | `switchport trunk allowed vlan add 100` sur Fa0/2 des deux cœurs |
