::: {custom-style="Title"}
RECETTE DE LA MAQUETTE PACKET TRACER
:::

::: {custom-style="Subtitle"}
Tests, résultats commentés et glossaire
:::

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

```{=openxml}
<w:sdt><w:sdtPr><w:docPartObj><w:docPartGallery w:val="Table of Contents"/><w:docPartUnique/></w:docPartObj></w:sdtPr><w:sdtContent><w:p><w:pPr><w:pStyle w:val="TOCHeading"/></w:pPr><w:r><w:t>Sommaire</w:t></w:r></w:p><w:p><w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/><w:instrText xml:space="preserve"> TOC \o "1-2" \h \z \u </w:instrText><w:fldChar w:fldCharType="separate"/><w:fldChar w:fldCharType="end"/></w:r></w:p></w:sdtContent></w:sdt>
```

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# À quoi sert ce document

La maquette Packet Tracer reproduit, à échelle réduite, l'architecture réseau cible proposée par MOM-TECH à
KHS Bank : deux sites (Paris et Lyon), une passerelle redondante à Paris, des pare-feu, un tunnel entre les
sites, la séparation des flux par VLAN et l'isolement du Wi-Fi invités.

La **recette** est l'étape où l'on vérifie, test par test, que ce qui a été construit fait bien ce qui était
promis. Elle a été menée le 15 novembre 2026 sur la maquette réelle. Ce document en donne :

1. les notions indispensables pour lire un résultat (« Comment lire un résultat ») ;
2. chaque test : son objectif, la commande tapée, le résultat obtenu et son interprétation (« Les tests un par un ») ;
3. les anomalies trouvées pendant la recette et leur correction ;
4. les limites connues de la maquette ;
5. le procès-verbal de synthèse ;
6. les questions probables du jury, avec des réponses ;
7. un glossaire qui définit **tous** les sigles employés.

> **Conseil de lecture :** dès qu'un sigle n'est pas clair, aller voir le glossaire en fin de document. Chaque
> sigle y est défini en une ou deux phrases simples.

# La maquette en bref

![Schéma logique de la maquette Packet Tracer](docs/figures/maquette-logique.png)

## Les équipements

| Équipement | Modèle | Rôle |
|---|---|---|
| RTR-PARIS, RTR-LYON | Routeur Cisco 2911 | Routeurs de bordure : sortie Internet avec NAT, extrémités du tunnel GRE entre les sites |
| FW-PARIS, FW-LYON | Pare-feu Cisco ASA 5505 | Filtrent tout ce qui entre depuis l'extérieur |
| CORE-PARIS-SW1, CORE-PARIS-SW2 | Commutateur de niveau 3 Cisco 3560 | Cœur du réseau de Paris : routage entre VLAN, passerelle redondante HSRP (SW1 actif, SW2 en secours) |
| CORE-LYON-SW | Commutateur de niveau 3 Cisco 3560 | Cœur du réseau de Lyon (un seul équipement, site secondaire) |
| ACC-PARIS-SW, ACC-LYON-SW | Commutateur Cisco 2960 | Commutateurs d'accès : on y branche les postes |
| SRV-PARIS, SRV-LYON | Serveur | DHCP et DNS (et partage de fichiers à Paris) |
| ISP-RTR, SRV-INTERNET-TEST | Routeur, serveur | Simulent le fournisseur d'accès et « Internet » |
| PC, portable, téléphone IP | Postes de test | Représentent un utilisateur de chaque catégorie |

## Le plan d'adressage utile pour les tests

| Réseau | VLAN | Adresses | Passerelle |
|---|---|---|---|
| Bureautique Paris | 10 | `10.10.0.0/22` | `10.10.0.1` (adresse virtuelle HSRP) |
| Bancaire Paris | 20 | `10.10.4.0/26` | `10.10.4.1` |
| Serveurs Paris | 30 | `10.10.4.64/27` (SRV-PARIS = `10.10.4.70`) | `10.10.4.65` |
| Wi-Fi invités Paris | 40 | `10.10.8.0/24` | `10.10.8.1` |
| Voix (téléphones IP) Paris | 50 | `10.10.10.0/23` | `10.10.10.1` |
| Administration Paris | 99 | `10.10.12.0/26` | `10.10.12.1` |
| Transit cœur ↔ pare-feu Paris | 100 | `10.10.254.8/29` : FW `.9`, SW1 `.10`, SW2 `.11`, adresse virtuelle `.12` | — |
| Transit pare-feu ↔ routeur Paris | — | `10.10.254.0/30` : RTR `.1`, FW `.2` | — |
| Bureautique Lyon | 10 | `10.20.0.0/24` | `10.20.0.1` |
| Transit Lyon | — | FW ↔ cœur `10.20.254.4/30` (FW `.5`, cœur `.6`) ; RTR ↔ FW `10.20.254.0/30` (RTR `.1`, FW `.2`) | — |
| Liens « Internet » | — | Paris `203.0.113.0/30`, Lyon `203.0.113.4/30`, serveur de test `203.0.113.10` | — |
| Tunnel GRE | — | `172.16.0.0/30` : Paris `.1`, Lyon `.2` | — |

Tout ce qui commence par `10.` est une **adresse privée** : elle n'existe qu'à l'intérieur de KHS Bank et ne
circule jamais telle quelle sur Internet. Les adresses `203.0.113.x` jouent le rôle d'adresses publiques.

# Comment lire un résultat

## Le ping

`ping` envoie un petit message (une « demande d'écho » ICMP) à une adresse et attend la réponse. C'est le test
de base : « est-ce que j'arrive à joindre cet équipement, et est-ce qu'il arrive à me répondre ? ».

| Ce qu'on voit | Où | Ce que ça veut dire |
|---|---|---|
| `!` | routeur / commutateur Cisco | une réponse reçue |
| `.` | routeur / commutateur Cisco | pas de réponse dans les 2 secondes |
| `Success rate is 80 percent (4/5)` | Cisco | 4 réponses sur 5 envoyées |
| `Reply from …` | PC | une réponse reçue |
| `Request timed out.` | PC | pas de réponse : le paquet s'est perdu à l'aller ou au retour |
| `Destination host unreachable` | PC | un équipement du chemin **répond lui-même** qu'il refuse ou ne sait pas acheminer le paquet |

**Le premier paquet perdu (`.!!!!`) est normal.** Avant d'envoyer un paquet à un voisin, un équipement doit
connaître son adresse matérielle (adresse MAC). Il la demande avec le protocole ARP ; pendant ce temps, le
premier paquet expire. Les suivants passent. Sur un long chemin, plusieurs équipements font cette résolution
à la suite : les deux ou trois premiers pings peuvent échouer.

## Le TTL

Chaque paquet porte un compteur, le **TTL** (« durée de vie »). L'émetteur le fixe au départ (128 pour un PC
Windows ou un serveur de Packet Tracer) et **chaque routeur traversé retire 1**. Si le compteur tombe à 0, le
paquet est détruit : cela évite qu'un paquet tourne en boucle à l'infini.

On s'en sert comme d'un compteur kilométrique : `TTL=124` dans une réponse veut dire que la réponse est partie
avec 128 et a traversé **4 équipements qui routent** (128 − 124 = 4). Un `TTL=128` veut dire qu'aucun routeur
n'a été traversé : les deux machines sont dans le même réseau.

## Le traceroute (`tracert`)

`tracert` envoie des paquets avec un TTL de 1, puis 2, puis 3… Chaque routeur qui reçoit un paquet arrivé à
TTL 0 renvoie un message « TTL expiré » : on obtient ainsi **la liste des équipements traversés, dans
l'ordre**. Une ligne `*` veut dire que l'équipement de ce saut n'a pas répondu (ou que sa réponse a été
filtrée), mais le trafic, lui, passe bien puisque les sauts suivants répondent.

## Les commandes `show` utilisées

| Commande | Ce qu'elle affiche |
|---|---|
| `show ip interface brief` / `show interface ip brief` (ASA) | La liste des interfaces, leur adresse IP et leur état (`up/up` = branchée et fonctionnelle) |
| `show route` (ASA) / `show ip route` | La table de routage. `C` = réseau directement connecté ; `S` = route statique (écrite à la main) ; `S*` = route par défaut, utilisée pour « tout le reste » |
| `show standby brief` | L'état HSRP de chaque VLAN : priorité (`Pri`), préemption (`P`), état (`Active` = c'est moi la passerelle, `Standby` = je suis le secours), qui est actif, qui est en secours, et l'adresse virtuelle |
| `show ip nat translations` | Les traductions d'adresses en cours : `Inside local` = adresse privée du poste, `Inside global` = adresse publique utilisée sur Internet |
| `show vlan brief` | Les VLAN et les ports de commutateur affectés à chacun |
| `ipconfig` / `ipconfig /renew` | Sur un PC : l'adresse reçue ; `/renew` redemande une adresse au serveur DHCP |

# Les tests un par un

Pour chaque test : **objectif**, **commande**, **résultat obtenu**, **interprétation**, puis la phrase à dire au
jury.

## PT01 et PT02 — Les postes reçoivent automatiquement une adresse (DHCP)

**Objectif.** Vérifier qu'un poste branché obtient seul une adresse IP, un masque, une passerelle et un
serveur DNS, sans configuration manuelle.

**Commande.** Sur PC-BUR-PARIS-1 puis sur PC-BUR-LYON-1 : `ipconfig /renew`.

**Résultat obtenu.**

| Poste | Adresse | Passerelle | DNS |
|---|---|---|---|
| PC-BUR-PARIS-1 | `10.10.0.11 / 255.255.252.0` | `10.10.0.1` | `10.10.4.70` (SRV-PARIS) |
| PC-BUR-LYON-1 | `10.20.0.10 / 255.255.255.0` | `10.20.0.1` | `10.20.1.40` (SRV-LYON) |

**Interprétation.** Le serveur DHCP de Paris est dans le VLAN 30 (serveurs), alors que le PC est dans le
VLAN 10 : la demande DHCP du PC, qui est une diffusion, ne devrait pas sortir de son VLAN. C'est le **relais
DHCP** (`ip helper-address 10.10.4.70` sur les cœurs) qui la transforme en message adressé directement au
serveur. La passerelle reçue, `10.10.0.1`, est l'**adresse virtuelle HSRP** partagée par SW1 et SW2. Le
`tracert` du test PT07 montre d'ailleurs comme premier saut `10.10.0.2` (SW1) : la passerelle répond, ce
qui valide aussi **PT01** (connectivité locale).

**À dire au jury.** « Les postes sont configurés automatiquement ; un seul serveur DHCP sert tous les VLAN
grâce au relais DHCP des cœurs de réseau. »

## Lien entre le cœur de réseau et le pare-feu (vérification préalable)

**Objectif.** Avant les tests de flux, vérifier les liaisons internes : cœurs ↔ pare-feu ↔ routeur.

**Commandes et résultats.**

| Depuis | Commande | Résultat |
|---|---|---|
| CORE-PARIS-SW1 | `ping 10.10.254.9` (pare-feu) | 4/5 |
| CORE-PARIS-SW2 | `ping 10.10.254.9` | 4/5 (0/5 avant la reconfiguration du pare-feu) |
| FW-PARIS | `ping 10.10.254.12` (adresse virtuelle des cœurs) | 4/5 |
| FW-PARIS | `ping 10.10.254.1` (RTR-PARIS) | 4/5 |
| CORE-LYON-SW | `ping 10.20.254.5` (FW-LYON) | 4/5 (0/5 avant correction du câblage) |

`show route` sur FW-PARIS montre les deux routes utiles :

- `S* 0.0.0.0 via 10.10.254.1` : tout ce qui n'est pas connu part vers RTR-PARIS (Internet) ;
- `S 10.10.0.0 255.255.0.0 via 10.10.254.12, inside` : le retour vers le réseau interne passe par l'adresse
  virtuelle HSRP des deux cœurs. C'est ce qui permet au pare-feu de continuer à joindre le LAN si SW1 tombe.

## PT06 — Sortie vers Internet et traduction d'adresse (NAT)

**Objectif.** Un poste interne doit pouvoir joindre Internet, et son adresse privée doit être remplacée par
l'adresse publique de la banque au passage du routeur.

**Commandes.** Sur PC-BANCAIRE-PARIS-1 : `ping 203.0.113.10`. Puis sur RTR-PARIS :
`show ip nat translations`.

**Résultat obtenu.** `Reply from 203.0.113.10 … TTL=124` (3 réponses sur 4), et sur le routeur :

| Pro | Inside global | Inside local | Outside global |
|---|---|---|---|
| icmp | `203.0.113.2:9` | `10.10.4.10:9` | `203.0.113.10:9` |
| icmp | `203.0.113.2:10` | `10.10.4.10:10` | `203.0.113.10:10` |
| … | … | … | … |

**Interprétation.**

- `TTL=124` : la réponse a traversé 4 équipements qui routent (ISP-RTR, RTR-PARIS, FW-PARIS, SW1).
- La table NAT montre que le poste `10.10.4.10` sort sur Internet sous l'adresse publique `203.0.113.2`. Le
  numéro qui suit les deux-points (`:9`, `:10`…) distingue chaque échange : c'est le **PAT** (traduction de
  port), qui permet à **tous** les postes de partager **une seule** adresse publique.

**Anomalie trouvée au premier essai.** Le ping échouait et la table NAT restait vide : RTR-PARIS n'avait pas
de route de retour vers `10.10.0.0/16` (anomalie A6).

**À dire au jury.** « Les adresses internes ne sont jamais exposées sur Internet : le routeur les traduit en
une adresse publique unique. »

## PT07 — Communication entre Paris et Lyon par le tunnel GRE

**Objectif.** Un poste de Paris doit joindre un poste de Lyon à travers Internet, par le tunnel.

**Commandes.** Sur PC-BUR-PARIS-1 : `ping -n 10 10.20.0.10`, puis `tracert 10.20.0.10`.

**Résultat obtenu.** 10 réponses sur 10, 0 % de perte, `TTL=122`. Le `tracert` donne :

| Saut | Adresse | Équipement |
|---|---|---|
| 1 | `10.10.0.2` | CORE-PARIS-SW1 (passerelle) |
| 2 | `10.10.254.9` | FW-PARIS |
| 3 | `*` | RTR-PARIS |
| 4 | `*` | RTR-LYON (extrémité du tunnel) |
| 5 | `10.20.254.2` | FW-LYON |
| 6 | `10.20.254.6` | CORE-LYON-SW |
| 7 | `10.20.0.10` | PC-BUR-LYON-1 |

**Interprétation.**

- `TTL=122` : 6 équipements qui routent (SW1, FW-PARIS, RTR-PARIS, RTR-LYON, FW-LYON, CORE-LYON-SW). Le
  routeur du fournisseur (ISP-RTR) **n'est pas compté** : le paquet du PC voyage **emballé** dans un paquet
  GRE ; ISP-RTR ne voit et ne modifie que l'emballage. C'est la preuve que le trafic passe par le tunnel.
- Les `*` des sauts 3 et 4 sont un effet de la sécurité : les deux routeurs envoient bien leur message « TTL
  expiré », mais avec une adresse source (`10.10.254.1`, `172.16.0.2`) que la règle d'entrée du pare-feu de
  Paris ne laisse pas passer — elle n'admet que les adresses du réseau de Lyon. Le flux utile, lui, passe.

**À dire au jury.** « Les deux sites communiquent comme s'ils étaient sur le même réseau privé, à travers un
tunnel GRE établi au-dessus d'Internet. »

## PT08 — Le trafic entre les sites n'est pas traduit

**Objectif.** Le trafic Paris ↔ Lyon doit garder ses adresses privées (il passe par le tunnel) : il ne doit
**pas** être traduit par le NAT.

**Commande.** Juste après PT07, sur RTR-PARIS : `show ip nat translations`.

**Résultat obtenu.** Table vide : aucune ligne pour `10.20.0.10`.

**Interprétation.** La liste de contrôle d'accès qui sélectionne le trafic à traduire commence par
`access-list 100 deny ip 10.10.0.0 0.0.255.255 10.20.0.0 0.0.255.255` : le trafic vers Lyon est exclu du
NAT. Par contraste, PT06 (vers Internet) avait bien créé des lignes.

## PT04 — Les invités du Wi-Fi n'accèdent pas au réseau interne

**Objectif.** Un visiteur connecté au Wi-Fi invités ne doit jamais pouvoir joindre les postes ou les serveurs
de la banque (constat d'audit R5).

**Commandes.** Sur LAPTOP-WIFI-PARIS-1 : `ipconfig /renew`, puis `ping 10.10.0.11` (un PC interne).

**Résultat obtenu.** Adresse `10.10.8.10/24`, passerelle `10.10.8.1` (VLAN 40) ; le ping donne quatre fois
`Reply from 10.10.8.2: Destination host unreachable`.

**Interprétation.** `10.10.8.2` est SW1 sur le VLAN invités. Sa règle `ACL-INVITES`
(`deny ip 10.10.8.0 0.0.0.255 10.10.0.0 0.0.15.255`) rejette le paquet **dès son arrivée** et prévient
l'émetteur. Le blocage vient donc bien de la règle de sécurité.

**Anomalie trouvée au premier essai — la plus parlante de la recette.** Le portable recevait d'abord
`10.10.0.12` (réseau bureautique) et joignait le PC interne avec `TTL=128`, c'est-à-dire sans même passer par
un routeur : **un invité se retrouvait sur le réseau des employés**. Cause : les configurations des ports du
portable et du téléphone étaient inversées sur le commutateur d'accès (anomalie A3).

**À dire au jury.** « La recette a détecté une vraie faille : avant correction, un invité atterrissait dans le
réseau des employés. Après correction, il est isolé. »

## PT05 — Les invités ont bien accès à Internet

**Commande.** Sur LAPTOP-WIFI-PARIS-1 : `ping 203.0.113.10`.

**Résultat obtenu.** 3 réponses sur 4, `TTL=124`.

**Interprétation.** La règle `ACL-INVITES` se termine par `permit ip any any` : seul le réseau interne est
interdit, Internet reste accessible. C'est le service attendu d'un Wi-Fi invités.

## PT09 — Le téléphone IP est placé dans le VLAN voix

**Objectif.** Séparer la voix des données, pour la qualité des appels et la sécurité.

**Vérification.** Survol du téléphone IPPHONE-PARIS-1 dans Packet Tracer.

**Résultat obtenu.** `Vlan50 Up 10.10.10.10/23`, passerelle `10.10.10.1`.

**Interprétation.** Le port du commutateur porte deux VLAN : `switchport access vlan 10` pour un PC branché
derrière le téléphone, et `switchport voice vlan 50` pour le téléphone. Le commutateur annonce le VLAN voix au
téléphone (par CDP), qui s'y place seul et obtient une adresse du réseau voix.

## PT10 — Le pare-feu bloque ce qui vient de l'extérieur

**Objectif.** Rien ne doit pouvoir entrer dans le réseau de la banque depuis Internet, sauf ce qui est
explicitement autorisé (ici : le réseau de Lyon).

**Commandes.** Sur RTR-PARIS, qui est **du côté extérieur** du pare-feu : `ping 10.10.254.2` (interface
extérieure du pare-feu) puis `ping 10.10.0.11` (un PC interne).

**Résultat obtenu.** 0/5 et 0/5.

**Interprétation.**

- La route vers `10.10.0.0/16` existe bien sur RTR-PARIS : c'est exactement celle qu'a empruntée PT07 avec
  succès. La seule différence est l'adresse source (`10.10.254.1` au lieu du réseau de Lyon) : **c'est donc
  la règle d'entrée `OUTSIDE-IN` du pare-feu qui bloque**.
- Le pare-feu ne répond même pas aux pings sur son interface extérieure : il est « furtif », un attaquant qui
  balaie les adresses ne le voit pas.

**Pourquoi le test a été déplacé.** Le plan initial proposait un ping depuis ISP-RTR. Il aurait échoué pour
une mauvaise raison : le routeur du fournisseur ne connaît pas les adresses privées de la banque (le routage
bloquait avant le pare-feu). Le test depuis RTR-PARIS isole vraiment le rôle du pare-feu.

## PT11 — Bascule de la passerelle (HSRP) : le test phare

**Objectif.** Démontrer que la panne d'un cœur de réseau ne coupe plus l'agence (constat d'audit R1 : un
point de défaillance unique).

**Déroulé.**

1. Sur PC-BUR-PARIS-1 : `ping -t 203.0.113.10` (ping continu vers Internet).
2. Sur SW1 : `show standby brief` → SW1 est **Active** sur les 7 groupes HSRP, priorité 110, avec `P`
   (préemption) ; la colonne Standby donne les adresses de SW2.
3. Panne de SW1 : le 3560 de Packet Tracer n'a pas d'interrupteur, on coupe donc **tous ses ports**
   (`interface range FastEthernet0/1 - 24 , GigabitEthernet0/1 - 2` puis `shutdown`). Vu du réseau, c'est
   identique à une perte d'alimentation.
4. Sur SW2 : `show standby brief`.

**Résultat obtenu.**

- Sur le PC : **6 `Request timed out`** puis reprise **automatique** des réponses.
- Sur SW2 : messages `%HSRP-6-STATECHANGE: … Standby -> Active` pour les 7 groupes ; état **Active**,
  priorité 90, Standby `unknown` (SW1 ne répond plus), adresses virtuelles **inchangées**.

**Interprétation.** SW1 et SW2 s'échangent en permanence de petits messages « je suis vivant » (hello, toutes
les 3 secondes). Quand SW2 n'entend plus SW1 pendant 10 secondes (hold time), il prend l'adresse virtuelle.
Les PC n'ont rien à changer : leur passerelle `10.10.0.1` existe toujours, elle a simplement changé
d'équipement. Coupure observée : environ 6 secondes, sans intervention humaine.

**À dire au jury.** « En audit, une panne du cœur coupait toute l'agence. Aujourd'hui, la même panne coûte six
secondes, sans intervention. »

## PT12 — Redondance du lien vers le pare-feu, puis retour à la normale

**Objectif.** Vérifier que le trafic Internet passe encore avec SW1 hors service, puis que SW1 reprend sa place
à son retour.

**Résultat obtenu.**

- Pendant la panne, le même `ping -t` vers Internet reprend : le trafic passe par SW2 et son propre câble vers
  le pare-feu. L'adresse virtuelle de transit `10.10.254.12`, que le pare-feu utilise pour revenir vers le
  LAN, a basculé sur SW2 avec les autres.
- Au retour de SW1 (`no shutdown` des ports) : messages `Standby -> Active` sur SW1 pour les 7 groupes ;
  `show standby brief` montre SW1 de nouveau **Active**, priorité 110.

**Interprétation.** C'est la **préemption** (`standby … preempt`) : l'équipement de plus forte priorité
reprend le rôle actif dès qu'il revient. Sans elle, SW2 resterait actif et SW1 resterait en secours.

## Tests non exécutés à ce jour

| Test | Procédure (2 minutes) | Résultat attendu |
|---|---|---|
| PT03 — Inter-VLAN autorisé | Sur PC-BANCAIRE-PARIS-1 : `ping 10.10.4.70` (SRV-PARIS) | Réponses, `TTL=127` (un seul routage, par SW1) |
| PT13 — Panne du lien inter-site | Débrancher le câble RTR-PARIS ↔ ISP-RTR, puis `ping 10.20.0.10` depuis PC-BUR-PARIS-1 | Échec : la maquette n'a qu'un lien Internet par site (voir « Limites connues ») |

# Anomalies détectées pendant la recette et corrections

Une recette qui ne trouve rien est suspecte. Celle-ci a trouvé **dix anomalies**, toutes corrigées. Elles sont
réparties en trois familles.

## Écarts entre le câblage réel et la configuration

| Symptôme | Cause | Correction |
|---|---|---|
| **A1** — PC en `169.254.x.x` (adresse de secours APIPA) : le DHCP ne répond pas | Port du serveur resté dans le VLAN 1 sur SW1 puis SW2 | Ports d'accès réaffectés selon le plan de câblage |
| **A2** — Le cœur de Lyon ne joint pas son pare-feu (0/5) ; messages `NATIVE_VLAN_MISMATCH` | Pare-feu branché sur Fa0/1 (et non Gi0/1), commutateur d'accès sur Fa0/3 | Lien routé `10.20.254.6/30` déplacé sur Fa0/1 ; Fa0/3 en trunk, VLAN natif 999 |
| **A3** — Le portable invité reçoit une adresse du réseau bureautique et joint le LAN (PT04) | Configurations des ports du portable (Fa0/6) et du téléphone (Fa0/7) inversées | Fa0/6 en VLAN 40, Fa0/7 en VLAN 10 + VLAN voix 50 |

## Erreurs de conception de la configuration

| Symptôme | Cause | Correction |
|---|---|---|
| **A4** — `Bad mask /29 for address 10.10.254.7` | Dans le réseau `10.10.254.0/29`, `.7` est l'adresse de diffusion : interdite pour un équipement | Transit renuméroté en `10.10.254.8/29` (FW `.9`, SW1 `.10`, SW2 `.11`, adresse virtuelle `.12`) |
| **A5** — Le pare-feu ne joint pas le réseau interne | Route de retour absente sur l'ASA | `route inside 10.10.0.0 255.255.0.0 10.10.254.12` (adresse virtuelle HSRP) |
| **A6** — PT06 : ping Internet en échec, table NAT vide | RTR-PARIS ne sait pas revenir vers `10.10.0.0/16` (idem RTR-LYON vers `10.20.0.0/16`) | `ip route 10.10.0.0 255.255.0.0 10.10.254.2` (et l'équivalent à Lyon) |
| **A7** — Flux Paris ↔ Lyon bloqué à l'entrée des pare-feu (anticipé avant PT07) | Un ASA refuse par défaut tout trafic qui va de l'extérieur (niveau 0) vers l'intérieur (niveau 100) | Règle `OUTSIDE-IN` sur chaque ASA, limitée au réseau de l'autre site |

## Particularités du matériel et paramètres oubliés

| Symptôme | Cause | Correction |
|---|---|---|
| **A8** — Trunks refusés sur les cœurs 3560 | Sur un 3560, `switchport mode trunk` exige de préciser l'encapsulation | `switchport trunk encapsulation dot1q` avant `switchport mode trunk` |
| **A9** — FW-LYON garde l'adresse d'usine `192.168.1.1/24` côté interne | Configuration interne de l'ASA de Lyon jamais appliquée | Interface interne en `10.20.254.5/30` et route de retour vers `10.20.0.0/16` |
| **A10** — `NATIVE_VLAN_MISMATCH` entre ACC-PARIS-SW et SW2 | VLAN natif 999 non appliqué sur le trunk de SW2 | `switchport trunk native vlan 999` sur SW2 Fa0/3 |

**Méthode suivie à chaque fois :** observer le symptôme → isoler le segment en panne (ping de proche en proche,
`show ip interface brief`, survol des câbles) → identifier la cause → corriger → **refaire le test** →
reporter la correction dans les fichiers de configuration du dépôt, pour que la documentation corresponde à ce
qui fonctionne réellement.

# Limites connues de la maquette

| Limite | Pourquoi | Ce que prévoit la cible du dossier |
|---|---|---|
| SRV-PARIS n'est relié qu'à SW1 : pendant la panne de SW1, l'interface du VLAN 30 de SW2 passe `down` et le serveur DHCP/DNS devient injoignable | Un serveur Packet Tracer n'a qu'une carte réseau | Serveurs virtualisés en cluster, chaque hôte raccordé aux deux cœurs (Lot B) |
| Un seul lien Internet par site : une coupure de ce lien coupe le tunnel (PT13) | Simplification de la maquette | Second fournisseur d'accès et second tunnel (Lot A) |
| Tunnel GRE non chiffré | GRE seul ne chiffre pas ; IPsec alourdit la maquette | GRE protégé par IPsec, ou VPN IPsec natif (Lot A) |
| Wi-Fi simulé par un câble pour le portable | Le module sans fil du portable est incompatible dans Packet Tracer | Bornes Wi-Fi avec SSID invités relié au VLAN 40 |
| Un seul cœur à Lyon | Site secondaire, budget | Assumé : Lyon est secouru par le PRA/PCA |

# Procès-verbal de synthèse

| Test | Intitulé | Résultat | Statut |
|---|---|---|---|
| PT01 | Connectivité locale (passerelle) | `10.10.0.2` répond (1er saut du tracert) | Conforme |
| PT02 | Attribution DHCP Paris et Lyon | `10.10.0.11/22` et `10.20.0.10/24`, passerelles et DNS corrects | Conforme |
| PT03 | Inter-VLAN autorisé | — | Non exécuté |
| PT04 | Isolation des invités | 0/4, « Destination host unreachable » par l'ACL | Conforme après correction (A3) |
| PT05 | Internet pour les invités | 3/4, TTL=124 | Conforme |
| PT06 | Sortie Internet et NAT | 3/4 ; traductions `10.10.4.10 → 203.0.113.2` | Conforme après correction (A6) |
| PT07 | Paris ↔ Lyon par le tunnel GRE | 10/10, TTL=122, chemin vérifié par tracert | Conforme après corrections (A2, A7, A9) |
| PT08 | Pas de NAT entre les sites | Table NAT vide pour `10.20.0.10` | Conforme |
| PT09 | Téléphonie (VLAN voix) | `10.10.10.10/23` sur Vlan50 | Conforme après correction (A3) |
| PT10 | Filtrage entrant du pare-feu | 0/5 et 0/5 depuis l'extérieur | Conforme |
| PT11 | Bascule HSRP | 6 s de coupure, reprise automatique, SW2 Active sur 7 groupes | Conforme |
| PT12 | Redondance vers le pare-feu et préemption | Internet joignable via SW2 ; SW1 redevient Active à son retour | Conforme |
| PT13 | Panne du lien inter-site | — | Non exécuté (limite connue) |

**Bilan : 11 tests conformes sur 11 exécutés ; 10 anomalies détectées et corrigées ; 2 tests restant à
exécuter.**

# Questions probables du jury

**« Pourquoi HSRP et pas VRRP ? »**
Les deux font la même chose. HSRP est le protocole propriétaire de Cisco, natif sur les équipements de la
maquette ; VRRP est la norme ouverte équivalente. Sur un parc multi-constructeurs, on choisirait VRRP.

**« Pourquoi 6 secondes de coupure et pas zéro ? »**
C'est le temps de détection : SW2 attend de ne plus entendre SW1 pendant le « hold time » (10 s par défaut)
avant de prendre le relais. On peut descendre sous la seconde en réduisant les temporisateurs (`standby timers
msec`), au prix de plus de messages et d'un risque de bascules intempestives.

**« Pourquoi le premier ping échoue-t-il souvent ? »**
Résolution ARP : l'équipement doit d'abord découvrir l'adresse MAC du voisin ; le premier paquet expire
pendant ce temps. Ce n'est pas une panne.

**« À quoi sert le VLAN natif 999 ? »**
Sur un trunk, le VLAN natif circule sans étiquette. Le laisser à 1 (valeur par défaut) expose à l'attaque par
« double étiquette » (VLAN hopping). On le place sur un VLAN inutilisé, sans aucun équipement.

**« Le tunnel GRE est-il sécurisé ? »**
Non, GRE seul ne chiffre pas : il emballe. En production, on le protège par IPsec (chiffrement et
authentification). C'est indiqué comme limite de la maquette et prévu dans la cible.

**« Que se passe-t-il si le pare-feu tombe ? »**
Dans la maquette, il est unique : c'est un point de défaillance assumé. En production, on déploie deux pare-feu
en mode actif/secours (failover).

**« Pourquoi le pare-feu ne répond-il pas au ping depuis l'extérieur ? »**
C'est voulu : il n'accepte en entrée que le réseau de Lyon. Ne pas répondre aux pings le rend invisible à un
balayage d'adresses.

**« Comment avez-vous trouvé les anomalies ? »**
En testant de proche en proche : ping du voisin direct, puis du suivant, jusqu'au segment qui ne répond plus ;
puis `show ip interface brief`, `show vlan brief`, `show route` et le survol des câbles pour comparer le réel
et la configuration.

# Glossaire

| Sigle / terme | Signification | Explication simple |
|---|---|---|
| **AAA** | Authentication, Authorization, Accounting | Cadre qui contrôle qui se connecte à un équipement, ce qu'il peut faire et ce qu'il a fait |
| **ACL** | Access Control List — liste de contrôle d'accès | Liste de règles « autoriser / refuser » appliquée au trafic, lue de haut en bas ; ce qui n'est pas autorisé est refusé à la fin |
| **Adresse de diffusion** | Broadcast address | Dernière adresse d'un réseau, qui sert à parler à toutes les machines à la fois ; aucun équipement ne peut la prendre |
| **Adresse privée** | RFC 1918 | Plages réservées à l'usage interne (`10.x`, `172.16-31.x`, `192.168.x`), jamais routées sur Internet |
| **Adresse virtuelle (VIP)** | Virtual IP | Adresse partagée par deux équipements HSRP ; elle appartient à celui qui est actif |
| **AP** | Access Point — point d'accès | Borne Wi-Fi qui relie les appareils sans fil au réseau filaire |
| **APIPA** | Automatic Private IP Addressing | Adresse de secours en `169.254.x.x` qu'un PC se donne quand aucun serveur DHCP ne répond : symptôme d'un problème DHCP |
| **ARP** | Address Resolution Protocol | Protocole qui trouve l'adresse MAC correspondant à une adresse IP sur le réseau local |
| **ASA** | Adaptive Security Appliance | Gamme de pare-feu Cisco (ici ASA 5505) |
| **BPDU Guard** | Bridge Protocol Data Unit Guard | Protection qui coupe un port d'accès si un commutateur pirate y est branché |
| **CDP** | Cisco Discovery Protocol | Protocole Cisco par lequel les équipements voisins se présentent (nom, port, VLAN voix…) |
| **CIDR, /24, /29…** | Classless Inter-Domain Routing | Notation de la taille d'un réseau : le nombre après `/` est le nombre de bits fixes. `/24` = 256 adresses, `/29` = 8 adresses, `/30` = 4 adresses (dont 2 utilisables) |
| **CLI** | Command Line Interface | Interface en ligne de commande des équipements |
| **Cœur de réseau** | Core | Commutateurs centraux qui relient tout et routent entre les VLAN |
| **Commutateur de niveau 3** | Layer 3 switch | Commutateur capable aussi de router entre VLAN (ici les 3560) |
| **DHCP** | Dynamic Host Configuration Protocol | Service qui attribue automatiquement une adresse IP, un masque, une passerelle et un DNS aux postes |
| **DHCP snooping** | — | Protection du commutateur qui n'accepte les réponses DHCP que sur les ports de confiance (celui du vrai serveur), contre les faux serveurs DHCP |
| **DNS** | Domain Name System | Annuaire qui traduit un nom (`khsbank.internal`) en adresse IP |
| **dot1q / 802.1Q** | Norme IEEE 802.1Q | Méthode qui ajoute une étiquette de VLAN aux trames sur un trunk |
| **FAI / ISP** | Fournisseur d'accès à Internet / Internet Service Provider | Opérateur qui raccorde le site à Internet (simulé par ISP-RTR) |
| **Failover** | Bascule | Fonctionnement en paire actif/secours d'équipements (pare-feu, routeurs) |
| **GRE** | Generic Routing Encapsulation | Tunnel qui emballe les paquets d'un site dans d'autres paquets pour les faire traverser Internet ; ne chiffre pas |
| **Hello / hold time** | — | Messages HSRP « je suis vivant » (toutes les 3 s) et délai au-delà duquel le secours prend le relais (10 s) |
| **HSRP** | Hot Standby Router Protocol | Protocole Cisco qui fait partager une même adresse de passerelle à deux équipements : si l'actif tombe, le secours prend le relais |
| **ICMP** | Internet Control Message Protocol | Protocole des messages de contrôle : ping, « TTL expiré », « destination injoignable » |
| **Inside / outside** | — | Côtés d'un pare-feu ASA : intérieur (réseau de confiance, niveau de sécurité 100) et extérieur (Internet, niveau 0) |
| **Inspection (`inspect icmp`)** | Stateful inspection | Le pare-feu mémorise ce qui sort pour laisser rentrer la réponse correspondante, et seulement elle |
| **IOS** | Internetwork Operating System | Système d'exploitation des routeurs et commutateurs Cisco |
| **IP** | Internet Protocol | Protocole d'adressage et d'acheminement des paquets |
| **IPsec** | IP Security | Ensemble de protocoles qui chiffrent et authentifient le trafic, par exemple dans un tunnel |
| **LAN** | Local Area Network | Réseau local d'un site |
| **MAC (adresse)** | Media Access Control | Adresse matérielle unique d'une carte réseau |
| **Masque** | Subnet mask | Indique quelle partie de l'adresse désigne le réseau (`255.255.255.0` = `/24`) |
| **NAT** | Network Address Translation | Traduction des adresses privées en adresse publique à la sortie vers Internet |
| **NVRAM** | Non-Volatile RAM | Mémoire qui conserve la configuration après un redémarrage (`write memory` y enregistre) |
| **PAT** | Port Address Translation (NAT « overload ») | Forme de NAT où tous les postes partagent une seule adresse publique, distingués par un numéro de port |
| **Passerelle** | Default gateway | Équipement auquel un poste envoie tout ce qui ne concerne pas son propre réseau |
| **PCA / PRA** | Plan de continuité / de reprise d'activité | Organisation pour continuer à travailler pendant une panne majeure, puis pour redémarrer après |
| **Ping** | — | Commande qui teste si une adresse répond (messages ICMP echo) |
| **Port d'accès** | Access port | Port de commutateur qui appartient à un seul VLAN, pour brancher un poste |
| **Port-security** | — | Limite le nombre d'adresses MAC autorisées sur un port, contre le branchement d'appareils non prévus |
| **PortFast** | — | Fait passer un port d'accès immédiatement en état actif, sans attendre le calcul du spanning tree |
| **Préemption** | Preempt | Option HSRP : l'équipement de plus forte priorité reprend le rôle actif dès qu'il revient |
| **Priorité HSRP** | Priority | Nombre qui désigne l'actif (le plus élevé gagne) : 110 pour SW1, 90 pour SW2 |
| **PT** | Packet Tracer | Logiciel de simulation de réseaux de Cisco |
| **PV** | Procès-verbal | Document qui acte le résultat d'une recette |
| **Recette** | Acceptance testing | Vérification formelle que ce qui est livré correspond à ce qui était demandé |
| **Route par défaut** | Default route (`0.0.0.0/0`, `S*`) | Route utilisée pour toute destination qui n'est pas connue plus précisément |
| **Route statique** | Static route (`S`) | Route écrite à la main par l'administrateur |
| **Rapid-PVST / STP** | (Rapid Per-VLAN) Spanning Tree Protocol | Protocole qui empêche les boucles entre commutateurs en bloquant les liens en trop |
| **Security-level** | Niveau de sécurité ASA | 0 à 100 ; par défaut le trafic va librement du plus haut vers le plus bas, jamais l'inverse sans règle |
| **SPOF** | Single Point Of Failure — point de défaillance unique | Élément dont la panne arrête tout le service |
| **SSH** | Secure Shell | Accès chiffré à la ligne de commande d'un équipement, à distance |
| **SVI** | Switch Virtual Interface | Interface IP d'un commutateur de niveau 3 pour un VLAN (`interface Vlan10`) : c'est la passerelle des postes de ce VLAN |
| **Tracert / traceroute** | — | Commande qui liste les équipements traversés jusqu'à une destination |
| **Trunk** | — | Lien entre commutateurs qui transporte plusieurs VLAN, chacun repéré par son étiquette 802.1Q |
| **TTL** | Time To Live — durée de vie | Compteur d'un paquet, décrémenté de 1 par chaque routeur ; sert à compter les sauts |
| **VLAN** | Virtual LAN — réseau local virtuel | Découpage logique d'un réseau physique en réseaux séparés (bureautique, bancaire, invités, voix…) |
| **VLAN natif** | Native VLAN | VLAN qui circule sans étiquette sur un trunk ; placé ici sur le VLAN 999, inutilisé, par sécurité |
| **VLAN voix** | Voice VLAN | VLAN réservé aux téléphones IP, annoncé par le commutateur |
| **VoIP** | Voice over IP | Téléphonie qui passe par le réseau informatique |
| **VPN** | Virtual Private Network | Liaison privée (souvent chiffrée) établie à travers un réseau public |
| **VRRP** | Virtual Router Redundancy Protocol | Équivalent normalisé (non propriétaire) de HSRP |
| **WAN** | Wide Area Network | Réseau étendu qui relie des sites distants (ici, via Internet) |
| **`write memory`** | — | Enregistre la configuration en cours dans la NVRAM, pour qu'elle survive à un redémarrage |
