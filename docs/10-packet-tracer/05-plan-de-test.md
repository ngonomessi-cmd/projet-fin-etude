# Plan de test

Cohérent avec le [cahier de tests du dossier](../08-bilan-financier-recette/recette.md), adapté à ce qui
est concrètement observable dans la maquette Packet Tracer.

## Tests fonctionnels de base

| # | Test | Méthode | Résultat attendu |
|---|---|---|---|
| PT01 | Connectivité locale | `ping 10.10.0.1` depuis PC-BUR-PARIS-1 | Réponse OK (passerelle HSRP) |
| PT02 | Attribution DHCP | `ipconfig` sur PC-BUR-PARIS-1 | IP dans `10.10.0.0/22`, passerelle `10.10.0.1` |
| PT03 | Inter-VLAN autorisé | `ping` de PC-BANCAIRE-PARIS-1 vers SRV-FICHIERS-PARIS (10.10.4.71) | Réponse OK |
| PT04 | Isolation VLAN invités | `ping 10.10.0.10` depuis LAPTOP-WIFI-PARIS-1 | **Échoue** (bloqué par `ACL-INVITES`) |
| PT05 | Accès Internet des invités | `ping 203.0.113.10` (SRV-INTERNET-TEST) depuis LAPTOP-WIFI-PARIS-1 | Réponse OK (l'ACL bloque le LAN interne, pas Internet) |
| PT06 | NAT sortant | `ping 203.0.113.10` depuis PC-BANCAIRE-PARIS-1, puis `show ip nat translations` sur RTR-PARIS | Une entrée de traduction apparaît |
| PT07 | Connectivité inter-site | `ping` de PC-BUR-PARIS-1 vers PC-BUR-LYON-1 | Réponse OK, via le tunnel GRE |
| PT08 | Exemption de NAT inter-site | `show ip nat translations` sur RTR-PARIS après PT07 | **Aucune** entrée pour la destination 10.20.x.x |
| PT09 | Téléphonie | Sur IPPHONE-PARIS-1, vérifier l'obtention d'une IP dans `10.10.10.0/23` | Voice VLAN fonctionnel |
| PT10 | Filtrage du pare-feu | Depuis ISP-RTR, tenter `ping 10.10.254.5` (IP inside de FW-PARIS) | **Échoue** (aucune règle n'autorise l'entrant depuis l'extérieur) |

## Tests de résilience (les plus importants pour la soutenance)

### PT11 — Bascule HSRP (Hot Standby Router Protocol)

1. Lancer un `ping -t 10.10.0.1` en continu depuis PC-BUR-PARIS-1 (onglet Desktop → Command Prompt).
2. Sur CORE-PARIS-SW1, exécuter `show standby brief` pour confirmer qu'il est **Active**.
3. Éteindre CORE-PARIS-SW1 (clic droit → Turn Off, ou simplement `shutdown` sur son interface Vlan10
   depuis sa console avant l'extinction).
4. Observer le ping : quelques paquets perdus puis reprise automatique — CORE-PARIS-SW2 devient actif.
5. Vérifier avec `show standby brief` sur CORE-PARIS-SW2 qu'il est passé à l'état **Active**.

**Résultat attendu :** interruption de quelques secondes maximum, aucune reconfiguration manuelle
nécessaire — démontre la suppression du point de défaillance unique identifié en audit (constat **R1**).

### PT12 — Redondance de l'uplink cœur → pare-feu

1. Avec CORE-PARIS-SW1 toujours éteint (suite du test précédent), tenter `ping 203.0.113.10` depuis
   PC-BANCAIRE-PARIS-1.
2. **Résultat attendu :** la réponse fonctionne toujours — le trafic emprunte désormais CORE-PARIS-SW2,
   raccordé indépendamment au pare-feu via le VLAN de transit 100 (cf. [README](README.md#simplifications-assumées-à-annoncer-en-soutenance)).
3. Rallumer CORE-PARIS-SW1 et vérifier, avec `show standby brief`, qu'il reprend le rôle actif après
   convergence (préemption activée).

### PT13 — Panne du lien inter-site

1. Débrancher (ou désactiver l'interface Tunnel0/l'interface physique sous-jacente) le lien entre
   RTR-PARIS et ISP-RTR.
2. Tenter `ping` de PC-BUR-PARIS-1 vers PC-BUR-LYON-1.
3. **Résultat attendu :** échec — confirme que la redondance inter-site réelle nécessiterait un second
   tunnel sur un second lien FAI, comme documenté dans le
   [Lot A du dossier](../05-solutions/lot-a-architecture-reseau.md) (simplification assumée de la
   maquette, cf. README).

## Vérifications complémentaires (commandes `show`)

| Commande | Où | Ce qu'elle prouve |
|---|---|---|
| `show vlan brief` | Tous les switches | VLAN correctement créés et ports assignés |
| `show ip interface brief` | Cœurs, routeurs | Toutes les interfaces `up/up` |
| `show standby brief` | CORE-PARIS-SW1/SW2 | État HSRP (Active/Standby, priorités) |
| `show ip route` | RTR-PARIS, RTR-LYON, cœurs | Présence des routes par défaut et de la route inter-site |
| `show ip nat translations` / `show ip nat statistics` | RTR-PARIS, RTR-LYON | NAT actif uniquement pour le trafic Internet |
| `show interfaces trunk` | Tous les switches | VLAN autorisés cohérents avec le plan |
| `show port-security` | Switches d'accès | Nombre d'adresses MAC autorisées par port |
| `show crypto session` *(si IPsec ajouté en option)* | RTR-PARIS, RTR-LYON | Tunnel IPsec établi au-dessus du GRE |
