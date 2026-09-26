# Configuration des serveurs, postes et équipements terminaux

Contrairement aux routeurs/commutateurs/pare-feu, les serveurs, PC et bornes Wi-Fi de Packet Tracer se
configurent principalement via leur **onglet graphique** (Desktop / Config / Services), pas en CLI.

## SRV-DHCP-DNS-PARIS

**Onglet Desktop → IP Configuration** (adressage statique) :
- IP : `10.10.4.70` — Masque : `255.255.255.224` — Passerelle : `10.10.4.65` — DNS : `10.10.4.70` (lui-même)

**Onglet Services → DHCP** (activer, puis créer un pool par VLAN client) :

| Pool | Passerelle par défaut | DNS | Adresse de départ | Masque | Max. utilisateurs |
|---|---|---|---|---|---|
| BUREAUTIQUE | 10.10.0.1 | 10.10.4.70 | 10.10.0.10 | 255.255.252.0 | 500 |
| WIFI-INVITES | 10.10.8.1 | 10.10.4.70 | 10.10.8.10 | 255.255.255.0 | 190 |
| VOIP | 10.10.10.1 | 10.10.4.70 | 10.10.10.10 | 255.255.254.0 | 190 |

**Onglet Services → DNS** (activer, ajouter des enregistrements de type A) :

| Nom | Adresse IP |
|---|---|
| khscore.khsbank.internal | 10.10.4.10 |
| fichiers.khsbank.internal | 10.10.4.71 |

## SRV-FICHIERS-PARIS

**IP Configuration** : IP `10.10.4.71` / masque `255.255.255.224` / passerelle `10.10.4.65` / DNS `10.10.4.70`.

**Services → HTTP** : activé (page d'accueil éditable, ex. « Portail intranet KHS Bank »).
**Services → FTP** : activé, créer un utilisateur (ex. `momtech` / `Cisco123!`) avec droits lecture/écriture,
pour démontrer un partage de fichiers accessible depuis les postes.

## SRV-DHCP-DNS-LYON

**IP Configuration** : IP `10.20.1.40` / masque `255.255.255.240` / passerelle `10.20.1.33` / DNS `10.20.1.40`.

**Services → DHCP** :

| Pool | Passerelle par défaut | DNS | Adresse de départ | Masque |
|---|---|---|---|---|
| BUREAUTIQUE-LYON | 10.20.0.1 | 10.20.1.40 | 10.20.0.10 | 255.255.255.0 |
| WIFI-LYON | 10.20.2.1 | 10.20.1.40 | 10.20.2.10 | 255.255.255.128 |
| VOIP-LYON | 10.20.2.129 | 10.20.1.40 | 10.20.2.140 | 255.255.255.128 |

## SRV-INTERNET-TEST

**IP Configuration** : IP `203.0.113.10` / masque `255.255.255.252` / passerelle `203.0.113.9`.
**Services → HTTP** : activé (page « Vous avez atteint Internet ») — sert de cible de test pour vérifier
que le NAT (Network Address Translation) fonctionne depuis les deux sites.

## Postes et périphériques

| Équipement | Configuration |
|---|---|
| PC-BUR-PARIS-1/2 | DHCP (automatique, VLAN 10) |
| PC-BANCAIRE-PARIS-1 | IP statique `10.10.4.10` / `255.255.255.192` / passerelle `10.10.4.1` / DNS `10.10.4.70` |
| PRINT-PARIS-1 | IP statique `10.10.0.20` / `255.255.252.0` / passerelle `10.10.0.1` |
| LAPTOP-WIFI-PARIS-1 | Carte réseau **Wireless** ajoutée (Physical → glisser un module WMP300N), connexion au SSID `KHS-GUEST-PARIS`, DHCP |
| IPPHONE-PARIS-1 | DHCP automatique via VLAN voix (aucune configuration manuelle) |
| PC-BUR-LYON-1 | DHCP (VLAN 10) |
| PC-BANCAIRE-LYON-1 | IP statique `10.20.1.10` / `255.255.255.224` / passerelle `10.20.1.1` / DNS `10.20.1.40` |
| LAPTOP-WIFI-LYON-1 | Wi-Fi, SSID `KHS-GUEST-LYON`, DHCP |
| IPPHONE-LYON-1 | DHCP automatique |

## Bornes Wi-Fi (AP-PARIS / AP-LYON)

Sur chaque `AccessPoint-PT`, onglet **Config → Port1 (Wireless)** :
- SSID : `KHS-GUEST-PARIS` (ou `KHS-GUEST-LYON`)
- Authentification : **WPA2-PSK**, phrase de passe `KhsGuest2026!`
- Canal : laisser par défaut

> Ces bornes ne font que ponter le VLAN invités (40) déjà défini sur leur port filaire d'accès — aucune
> configuration réseau supplémentaire n'est nécessaire côté commutateur.
