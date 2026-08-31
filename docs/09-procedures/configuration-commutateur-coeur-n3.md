# Procédure de configuration du commutateur cœur N3 (Cisco Catalyst 9300 — site de Paris)

## 1. Contexte et objectifs

Cette procédure détaille la configuration complète du **cœur de réseau N3** du siège de Paris,
constitué de deux commutateurs **Cisco Catalyst 9300** montés en **stack (StackWise)**, formant un
plan de commutation et de gestion unique — condition de suppression du point de défaillance unique
identifié lors de l'audit (constat **R1**, cf. [audit réseau](../04-audit-existant/audit-reseau.md)).

Elle couvre : la mise en stack, la configuration de base, la création des VLAN et des interfaces
virtuelles (SVI) selon le [plan d'adressage VLSM](../06-architecture/architecture-reseau-cible.md), le
relais DHCP, la sécurisation des accès et la supervision. La même méthode est répliquée à l'identique
sur le cœur de réseau du site de Lyon, avec le plan d'adressage propre à ce site.

## 2. Prérequis

- 2 commutateurs Cisco Catalyst 9300, firmware **IOS-XE 17.x**, licences **DNA Advantage**.
- 1 câble de stack StackWise entre les deux commutateurs.
- Accès console (câble console RJ45/USB) pour la configuration initiale.
- Plan d'adressage VLSM du site de Paris (cf. [architecture réseau cible](../06-architecture/architecture-reseau-cible.md#3-plan-dadressage-vlsm)).
- Serveurs DHCP/DNS déjà positionnés dans le VLAN 30 (cf. [prérequis d'installation](../07-migration/prerequis-installation.md)).

## 3. Étape 1 — Mise en stack des deux commutateurs

Connexion physique des deux commutateurs via le câble StackWise, puis vérification de la formation du
stack :

```
Switch> enable
Switch# show switch
Switch/Stack Mac Address : xxxx.xxxx.xxxx
Switch#   Role     Priority   State
 *1       Active     15       Ready
  2       Standby    14       Ready
```

Le commutateur avec la priorité la plus élevée devient le membre **actif** (plan de contrôle). La
priorité peut être ajustée pour forcer le rôle actif sur un membre déterminé :

```
Switch(config)# switch 1 priority 15
Switch(config)# switch 2 priority 14
```

## 4. Étape 2 — Configuration de base

```
Switch> enable
Switch# configure terminal
Switch(config)# hostname CORE-PARIS
CORE-PARIS(config)# enable secret <mot_de_passe_complexe>
CORE-PARIS(config)# banner motd #
ACCES RESERVE - KHS BANK - Toute connexion non autorisee est interdite et tracee.
#
CORE-PARIS(config)# username admmomtech privilege 15 secret <mot_de_passe_complexe>
CORE-PARIS(config)# ip domain-name khsbank.internal
CORE-PARIS(config)# crypto key generate rsa modulus 2048
CORE-PARIS(config)# line vty 0 15
CORE-PARIS(config-line)# transport input ssh
CORE-PARIS(config-line)# login local
CORE-PARIS(config-line)# exec-timeout 5 0
CORE-PARIS(config-line)# exit
CORE-PARIS(config)# ntp server 10.10.4.65
CORE-PARIS(config)# logging host 10.10.4.70
CORE-PARIS(config)# logging trap informational
```

*Explication :* l'accès en gestion (Telnet) est désactivé au profit du **SSH uniquement**, avec
authentification locale et déconnexion automatique après 5 minutes d'inactivité — conforme au constat
d'audit sur l'absence de durcissement des accès d'administration (VLAN 99).

## 5. Étape 3 — Création des VLAN

```
CORE-PARIS(config)# vlan 10
CORE-PARIS(config-vlan)# name BUREAUTIQUE
CORE-PARIS(config-vlan)# exit
CORE-PARIS(config)# vlan 20
CORE-PARIS(config-vlan)# name BANCAIRE-KHSCORE
CORE-PARIS(config-vlan)# exit
CORE-PARIS(config)# vlan 30
CORE-PARIS(config-vlan)# name SERVEURS
CORE-PARIS(config-vlan)# exit
CORE-PARIS(config)# vlan 40
CORE-PARIS(config-vlan)# name WIFI-INVITES
CORE-PARIS(config-vlan)# exit
CORE-PARIS(config)# vlan 50
CORE-PARIS(config-vlan)# name VOIP
CORE-PARIS(config-vlan)# exit
CORE-PARIS(config)# vlan 99
CORE-PARIS(config-vlan)# name MANAGEMENT
CORE-PARIS(config-vlan)# exit
```

## 6. Étape 4 — Configuration des interfaces

### Liaisons montantes vers la distribution (trunk)

```
CORE-PARIS(config)# interface range TenGigabitEthernet1/0/1-2
CORE-PARIS(config-if-range)# switchport mode trunk
CORE-PARIS(config-if-range)# switchport trunk allowed vlan 10,20,30,40,50,99
CORE-PARIS(config-if-range)# channel-group 1 mode active
CORE-PARIS(config-if-range)# exit
CORE-PARIS(config)# interface Port-channel1
CORE-PARIS(config-if)# description LIEN-DISTRIBUTION-LACP
CORE-PARIS(config-if)# exit
```

*Explication :* les deux liaisons vers la distribution sont agrégées en **LACP (Port-channel)**, apportant
à la fois de la bande passante supplémentaire et une tolérance de panne sur un lien physique.

## 7. Étape 5 — Interfaces virtuelles (SVI) et routage inter-VLAN

```
CORE-PARIS(config)# ip routing
CORE-PARIS(config)# interface Vlan10
CORE-PARIS(config-if)# description BUREAUTIQUE
CORE-PARIS(config-if)# ip address 10.10.0.1 255.255.252.0
CORE-PARIS(config-if)# exit
CORE-PARIS(config)# interface Vlan20
CORE-PARIS(config-if)# description BANCAIRE-KHSCORE
CORE-PARIS(config-if)# ip address 10.10.4.1 255.255.255.192
CORE-PARIS(config-if)# exit
CORE-PARIS(config)# interface Vlan30
CORE-PARIS(config-if)# description SERVEURS
CORE-PARIS(config-if)# ip address 10.10.4.65 255.255.255.224
CORE-PARIS(config-if)# exit
CORE-PARIS(config)# interface Vlan40
CORE-PARIS(config-if)# description WIFI-INVITES
CORE-PARIS(config-if)# ip address 10.10.8.1 255.255.255.0
CORE-PARIS(config-if)# exit
CORE-PARIS(config)# interface Vlan50
CORE-PARIS(config-if)# description VOIP
CORE-PARIS(config-if)# ip address 10.10.9.1 255.255.254.0
CORE-PARIS(config-if)# exit
CORE-PARIS(config)# interface Vlan99
CORE-PARIS(config-if)# description MANAGEMENT
CORE-PARIS(config-if)# ip address 10.10.12.1 255.255.255.192
CORE-PARIS(config-if)# exit
```

*Explication :* chaque SVI reprend exactement l'adressage défini dans le
[plan VLSM](../06-architecture/architecture-reseau-cible.md#3-plan-dadressage-vlsm), l'adresse `.1` de
chaque sous-réseau étant systématiquement réservée à la passerelle.

## 8. Étape 6 — Relais DHCP (IP Helper)

Les serveurs DHCP étant hébergés dans le VLAN 30 (10.10.4.66 et 10.10.4.67, cf.
[prérequis d'installation](../07-migration/prerequis-installation.md)), chaque SVI cliente doit relayer les
requêtes DHCP broadcast vers ces serveurs :

```
CORE-PARIS(config)# interface Vlan10
CORE-PARIS(config-if)# ip helper-address 10.10.4.66
CORE-PARIS(config-if)# ip helper-address 10.10.4.67
CORE-PARIS(config-if)# exit
CORE-PARIS(config)# interface Vlan40
CORE-PARIS(config-if)# ip helper-address 10.10.4.66
CORE-PARIS(config-if)# exit
CORE-PARIS(config)# interface Vlan50
CORE-PARIS(config-if)# ip helper-address 10.10.4.66
CORE-PARIS(config-if)# exit
```

*Explication :* le VLAN 20 (bancaire) et le VLAN 99 (management) ne disposent volontairement pas de
relais DHCP : les hôtes qui y résident (serveurs applicatifs, équipements réseau) reçoivent une adresse
**IP fixe**, conformément à la politique de sécurité (traçabilité renforcée sur ces segments sensibles).

## 9. Étape 7 — Sécurisation

### Ports d'accès (postes utilisateurs)

```
CORE-PARIS(config)# interface range GigabitEthernet1/0/1-48
CORE-PARIS(config-if-range)# switchport mode access
CORE-PARIS(config-if-range)# switchport access vlan 10
CORE-PARIS(config-if-range)# switchport port-security
CORE-PARIS(config-if-range)# switchport port-security maximum 2
CORE-PARIS(config-if-range)# switchport port-security violation restrict
CORE-PARIS(config-if-range)# spanning-tree portfast
CORE-PARIS(config-if-range)# spanning-tree bpduguard enable
CORE-PARIS(config-if-range)# exit
```

### Protections réseau complémentaires

```
CORE-PARIS(config)# spanning-tree mode rapid-pvst
CORE-PARIS(config)# ip dhcp snooping
CORE-PARIS(config)# ip dhcp snooping vlan 10,40,50
CORE-PARIS(config)# ip arp inspection vlan 10,40,50
```

### ACL d'isolement du VLAN invités (VLAN 40)

```
CORE-PARIS(config)# ip access-list extended ACL-INVITES
CORE-PARIS(config-ext-nacl)# deny ip 10.10.8.0 0.0.0.255 10.10.0.0 0.0.15.255
CORE-PARIS(config-ext-nacl)# permit ip any any
CORE-PARIS(config-ext-nacl)# exit
CORE-PARIS(config)# interface Vlan40
CORE-PARIS(config-if)# ip access-group ACL-INVITES in
CORE-PARIS(config-if)# exit
```

*Explication :* cette ACL interdit tout trafic du VLAN invités vers l'ensemble des VLAN internes de
KHS Bank (10.10.0.0/20), tout en autorisant la sortie vers Internet — conforme au constat d'audit R5 et à
la segmentation définie dans l'[architecture réseau cible](../06-architecture/architecture-reseau-cible.md).
Une ACL similaire, plus stricte, isole le VLAN 20 (bancaire) de manière à n'autoriser que les flux
applicatifs strictement nécessaires entre les postes conseillers et les serveurs KHS-Core.

## 10. Étape 8 — Supervision

```
CORE-PARIS(config)# snmp-server community <chaine_lecture_seule> RO
CORE-PARIS(config)# snmp-server host 10.10.4.68 version 2c <chaine_lecture_seule>
CORE-PARIS(config)# snmp-server enable traps
CORE-PARIS(config)# logging host 10.10.4.69
CORE-PARIS(config)# logging trap informational
```

*Explication :* le commutateur est déclaré comme équipement supervisé dans **PRTG** (10.10.4.68) et
envoie ses journaux vers le collecteur **Microsoft Sentinel** (10.10.4.69), conformément au
[Lot H](../05-solutions/lot-h-monitoring-ticketing.md) et au [SOC](../05-solutions/cybersecurity-framework-soc.md).

## 11. Étape 9 — Vérification

```
CORE-PARIS# show vlan brief
CORE-PARIS# show ip interface brief
CORE-PARIS# show etherchannel summary
CORE-PARIS# show ip dhcp snooping
CORE-PARIS# show spanning-tree summary
CORE-PARIS# copy running-config startup-config
```

La configuration est sauvegardée en mémoire non volatile (`startup-config`) puis exportée et versionnée
dans GLPI (documentation technique) conformément au [Lot I](../05-solutions/lot-i-gestion-parc-maintenance.md).
Un test de connectivité inter-VLAN et un test de bascule du stack (arrêt contrôlé du membre actif)
concluent la procédure, conformément au [cahier de tests](../08-bilan-financier-recette/recette.md) (T01).
