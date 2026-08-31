# Lot A — Architecture réseau (switches, routeurs, DMZ, accès distants) et services DHCP/DNS

## Constats traités

R1 (switch cœur unique), R2 (pare-feu unique), R3 (VPN non redondant), R4 (FAI unique), R5 (absence de
segmentation/DMZ), R6 (équipements hors garantie), R7 (câblage vieillissant) — cf.
[audit réseau](../04-audit-existant/audit-reseau.md).

## Solution proposée

### Cœur et distribution

- **Cœur de réseau (N3)** : 2 × Cisco Catalyst 9300 en **stack (StackWise Virtual)** par site → élimine le
  point de défaillance unique R1.
- **Distribution** : Cisco Catalyst 9200, redondance des uplinks vers le cœur.
- **Accès** : Cisco Catalyst 9200L PoE+ (alimentation des bornes Wi-Fi et futurs postes Teams Phone,
  cf. [Lot 6](lots-complementaires.md#lot-6--voip)).

### Sécurité périmétrique

- **Pare-feu** : cluster **Fortinet FortiGate 200F en haute disponibilité (HA actif/passif)** sur chaque
  site (siège **et** Lyon, corrigeant R2) intégrant le module IPS (cf. [Lot E](lot-e-ids-ips.md)).
- **DMZ** dédiée pour les services exposés (portail intranet/extranet), isolée du réseau interne et des
  flux bancaires — corrige R5.

### Segmentation

Plan d'adressage VLAN unifié entre les deux sites :

| VLAN | Usage | Isolation |
|---|---|---|
| VLAN 10 | Postes bureautique | ACL inter-VLAN restrictives |
| VLAN 20 | Application bancaire KHS-Core | Isolé, accès filtré par pare-feu applicatif |
| VLAN 30 | Serveurs | Isolé, accès administrateurs uniquement |
| VLAN 40 | Wi-Fi invités | Accès Internet uniquement, aucun accès au LAN interne |
| VLAN 50 | Téléphonie (VOIP) | QoS dédiée |
| VLAN 99 | Management des équipements | Accès restreint (bastion/PAM, cf. [Lot F](lot-f-audit-securite-ged.md)) |

### Connectivité et redondance

- **Liaison inter-sites** : 2 tunnels IPsec redondants entre Paris et Lyon, sur deux fournisseurs d'accès
  distincts (corrige R3 et R4), avec bascule automatique par routage à métrique.
- **Accès Internet** : double lien FAI par site (opérateur principal + opérateur de secours).
- **DHCP/DNS** : services Windows en **DHCP failover** (un serveur par site, réplication de la base de
  baux) et DNS répliqué sur les deux contrôleurs de domaine (cf. [Lot 2](lots-complementaires.md#lot-2--annuaire-ldap)).
- **Câblage** : remplacement du câblage catégorie 5e par du **catégorie 6A**, corrigeant R7.

## Justification du choix

Le maintien de la marque **Cisco** pour le réseau capitalise sur les compétences déjà en place chez KHS
Bank et limite la courbe d'apprentissage pour l'équipe interne qui reprendra l'exploitation en fin de
projet (cf. risque **P12**). Le choix **Fortinet** pour la sécurité périmétrique s'appuie sur sa forte
intégration avec Fortinet FortiAnalyzer, dont les journaux alimenteront directement le SIEM
(cf. [Microsoft Sentinel](cybersecurity-framework-soc.md)).

## Bénéfices attendus

- Suppression de tous les points de défaillance unique identifiés lors de l'audit.
- Réduction de la surface d'attaque par segmentation stricte des flux bancaires.
- Conformité à l'exigence contractuelle de non-interruption des services de paiement.
