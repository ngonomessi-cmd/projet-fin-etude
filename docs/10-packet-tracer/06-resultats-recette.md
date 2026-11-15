# Résultats de la recette de la maquette

La recette de la maquette a été menée le 15 novembre 2026 en suivant le [plan de test](05-plan-de-test.md).
Chaque test a été exécuté sur la maquette réelle ; les résultats ci-dessous sont ceux relevés à l'écran (le
relevé chronologique complet figure dans le [journal de recette](07-journal-de-recette.md)).

## Procès-verbal

| Test | Intitulé | Résultat obtenu | Statut |
|---|---|---|---|
| PT01 | Connectivité locale | La passerelle du VLAN 10 répond (`10.10.0.2`, premier saut du traceroute) | Conforme |
| PT02 | Attribution DHCP | Paris : `10.10.0.11/22`, passerelle `10.10.0.1`, DNS `10.10.4.70` ; Lyon : `10.20.0.10/24`, passerelle `10.20.0.1`, DNS `10.20.1.40` | Conforme |
| PT03 | Routage inter-VLAN (bancaire → serveurs) | Réponses de `10.10.4.70`, TTL=127 (un seul routage, par le cœur) | Conforme après correction (A11) |
| PT04 | Isolement du VLAN invités | 0/4, « Destination host unreachable » renvoyé par le cœur : l'ACL des invités rejette le paquet | Conforme après correction (A3) |
| PT05 | Accès Internet des invités | 3/4, TTL=124 | Conforme |
| PT06 | Sortie Internet et NAT | 3/4, TTL=124 ; traductions `10.10.4.10 → 203.0.113.2` (PAT) sur RTR-PARIS | Conforme après correction (A6) |
| PT07 | Paris ↔ Lyon par le tunnel GRE | 10/10, 0 % de perte, TTL=122 ; chemin vérifié par traceroute | Conforme après corrections (A2, A7, A9) |
| PT08 | Pas de NAT entre les sites | Aucune traduction pour le trafic vers Lyon | Conforme |
| PT09 | VLAN voix | Téléphone IP en `10.10.10.10/23` sur le VLAN 50 | Conforme après correction (A3) |
| PT10 | Filtrage entrant du pare-feu | 0/5 depuis la zone extérieure, alors que la route existe : seule l'ACL bloque | Conforme |
| PT11 | Bascule HSRP | Coupure de **6 secondes** sur un ping continu, puis reprise automatique ; le cœur 2 devient actif sur les 7 groupes | Conforme |
| PT12 | Redondance vers le pare-feu et préemption | Internet reste joignable par le cœur 2 ; au retour du cœur 1, il reprend le rôle actif | Conforme |
| PT13 | Panne du lien Internet | Paris ↔ Lyon injoignable (« destination injoignable »), reprise automatique au rebranchement | Conforme (limite connue) |

**Bilan : 13 tests sur 13 exécutés et conformes ; 11 anomalies détectées et corrigées pendant la recette.**

## Lecture des résultats clés

- **TTL.** Chaque routeur traversé retire 1 au compteur TTL d'un paquet (128 au départ d'un poste) : TTL=127
  signifie un routage, TTL=124 quatre. Pour PT07, TTL=122 compte six équipements routés ; le routeur du
  fournisseur d'accès n'est pas compté, car le paquet le traverse encapsulé dans le tunnel GRE : c'est la
  preuve que le trafic emprunte le tunnel.
- **Traceroute de PT07.** `10.10.0.2` (cœur 1) → `10.10.254.9` (FW-PARIS) → `*` → `*` → `10.20.254.2`
  (FW-LYON) → `10.20.254.6` (cœur de Lyon) → `10.20.0.10`. Les deux sauts muets sont les routeurs de bordure :
  leurs messages « TTL expiré » sont filtrés par la règle d'entrée du pare-feu de Paris, qui n'admet que le
  réseau de Lyon.
- **Bascule HSRP.** Le cœur 2 attend de ne plus recevoir les messages du cœur 1 pendant le délai de détention
  (10 s par défaut) avant de reprendre l'adresse virtuelle ; la coupure mesurée, 6 secondes, est conforme. Les
  postes conservent leur passerelle : seul l'équipement qui la porte change. Le constat R1 de l'audit (cœur
  unique, point de défaillance unique) est levé.
- **Filtrage.** Le pare-feu ne répond pas aux pings venus de l'extérieur, même sur sa propre interface : il
  reste invisible à un balayage d'adresses.

## Anomalies détectées et corrections

| N° | Symptôme | Cause | Correction |
|---|---|---|---|
| A1 | Postes en adresse APIPA (`169.254.x.x`) | Port du serveur resté dans le VLAN 1 | Ports d'accès réaffectés selon le plan de câblage |
| A2 | Cœur de Lyon sans lien avec son pare-feu | Câblage réel décalé (pare-feu sur Fa0/1, accès sur Fa0/3) | Configuration alignée sur le câblage réel |
| A3 | Portable invité placé dans le VLAN bureautique | Ports du portable et du téléphone inversés | Fa0/6 en VLAN 40, Fa0/7 en VLAN 10 + voix 50 |
| A4 | `Bad mask /29` sur le transit | `.7` est l'adresse de diffusion de `10.10.254.0/29` | Transit renuméroté en `10.10.254.8/29` |
| A5 | Pare-feu sans retour vers le LAN | Route de retour absente | Route vers `10.10.0.0/16` via l'adresse virtuelle HSRP `10.10.254.12` |
| A6 | Pas d'accès Internet, table NAT vide | Routeurs de bordure sans route de retour vers leur LAN | Routes `10.10.0.0/16` et `10.20.0.0/16` via les pare-feu |
| A7 | Flux inter-site refusé par les pare-feu | Un ASA refuse par défaut l'entrant | ACL `OUTSIDE-IN` limitée au réseau de l'autre site |
| A8 | Trunks refusés sur les 3560 | Encapsulation à déclarer explicitement | `switchport trunk encapsulation dot1q` |
| A9 | Pare-feu de Lyon à l'adresse d'usine | Configuration interne jamais appliquée | Interface interne `10.20.254.5/30` et route de retour |
| A10 | Incohérence de VLAN natif | VLAN natif 999 absent d'un trunk | `switchport trunk native vlan 999` |
| A11 | Après bascule, cœurs désappariés sur le VLAN de transit | VLAN 100 absent du trunk entre les deux cœurs | VLAN 100 ajouté au trunk, tables MAC et ARP vidées |

Toutes les corrections ont été reportées dans les fichiers de configuration (`configs/`), de sorte que la
documentation décrit ce qui fonctionne réellement. Trois familles se dégagent : les écarts entre câblage réel
et configuration (A1, A2, A3), les oublis de conception du routage et du filtrage (A4 à A7, A11) et les
particularités du matériel (A8 à A10). La méthode suivie est la même à chaque fois : test de proche en proche
jusqu'au segment défaillant, comparaison du réel et de la configuration, correction, nouvel essai.

## Limites constatées

- **Serveur de Paris raccordé au seul cœur 1.** Pendant la panne du cœur 1, le trafic continue, mais le
  serveur DHCP/DNS devient injoignable. La cible (Lot B) prévoit des serveurs virtualisés en cluster, raccordés
  aux deux cœurs.
- **Un seul lien Internet par site** (PT13) : la cible (Lot A) prévoit un second fournisseur d'accès et un
  second tunnel.
- **Tunnel GRE non chiffré** : la cible le protège par IPsec.
