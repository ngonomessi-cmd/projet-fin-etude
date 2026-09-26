# Configuration des serveurs, postes et équipements terminaux

Contrairement aux routeurs/commutateurs/pare-feu, les serveurs, PC et bornes Wi-Fi de Packet Tracer se
configurent principalement via leur **onglet graphique** (Desktop / Config / Services), pas en CLI.

## SRV-PARIS (DHCP + DNS + fichiers, un seul serveur)

**Onglet Desktop → IP Configuration** (adressage statique) :
- IP : `10.10.4.70` — Masque : `255.255.255.224` — Passerelle : `10.10.4.65` — DNS : `10.10.4.70` (lui-même)

**Onglet Services → DHCP** (activer, puis créer un pool par VLAN client) :

| Pool | Passerelle par défaut | DNS | Adresse de départ | Masque | Max. utilisateurs |
|---|---|---|---|---|---|
| BUREAUTIQUE | 10.10.0.1 | 10.10.4.70 | 10.10.0.10 | 255.255.252.0 | 500 |
| WIFI-INVITES | 10.10.8.1 | 10.10.4.70 | 10.10.8.10 | 255.255.255.0 | 190 |
| VOIP | 10.10.10.1 | 10.10.4.70 | 10.10.10.10 | 255.255.254.0 | 190 |

**Onglet Services → DNS** (activer, ajouter un enregistrement de type A) :

| Nom | Adresse IP |
|---|---|
| khscore.khsbank.internal | 10.10.4.10 |

**Onglet Services → HTTP** : activé (page d'accueil éditable, ex. « Portail intranet KHS Bank »).
**Onglet Services → FTP** : activé, créer un utilisateur (ex. `momtech` / `Cisco123!`) avec droits
lecture/écriture, pour démontrer un partage de fichiers accessible depuis les postes.

## SRV-LYON (DHCP + DNS)

**IP Configuration** : IP `10.20.1.40` / masque `255.255.255.240` / passerelle `10.20.1.33` / DNS `10.20.1.40`.

**Services → DHCP** :

| Pool | Passerelle par défaut | DNS | Adresse de départ | Masque |
|---|---|---|---|---|
| BUREAUTIQUE-LYON | 10.20.0.1 | 10.20.1.40 | 10.20.0.10 | 255.255.255.0 |

## SRV-INTERNET-TEST

**IP Configuration** : IP `203.0.113.10` / masque `255.255.255.252` / passerelle `203.0.113.9`.
**Services → HTTP** : activé (page « Vous avez atteint Internet ») — sert de cible de test pour vérifier
que le NAT (Network Address Translation) fonctionne depuis les deux sites.

## Postes et périphériques

| Équipement | Configuration |
|---|---|
| PC-BUR-PARIS-1 | DHCP (automatique, VLAN 10) |
| PC-BANCAIRE-PARIS-1 | IP statique `10.10.4.10` / `255.255.255.192` / passerelle `10.10.4.1` / DNS `10.10.4.70` |
| LAPTOP-WIFI-PARIS-1 | Carte réseau **Wireless** ajoutée (Physical → glisser un module WMP300N), connexion au SSID `KHS-GUEST-PARIS`, DHCP |
| IPPHONE-PARIS-1 | DHCP automatique via VLAN voix (aucune configuration manuelle) |
| PC-BUR-LYON-1 | DHCP (VLAN 10) |
| PC-BANCAIRE-LYON-1 | IP statique `10.20.1.10` / `255.255.255.224` / passerelle `10.20.1.1` / DNS `10.20.1.40` |

## Borne Wi-Fi (AP-PARIS)

Sur `AP-PARIS`, onglet **Config → Port1 (Wireless)** :
- SSID : `KHS-GUEST-PARIS`
- Authentification : **WPA2-PSK**, phrase de passe `KhsGuest2026!`
- Canal : laisser par défaut

> Cette borne ne fait que ponter le VLAN invités (40) déjà défini sur son port filaire d'accès — aucune
> configuration réseau supplémentaire n'est nécessaire côté commutateur. Le Wi-Fi et la téléphonie IP ne
> sont démontrés qu'à Paris : la compétence est la même à Lyon, il suffirait d'y répéter exactement ce
> montage (cf. [simplifications assumées](README.md#simplifications-assumées-à-annoncer-en-soutenance)).
