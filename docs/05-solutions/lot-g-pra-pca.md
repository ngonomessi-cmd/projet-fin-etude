# Lot G — PRA / PCA

## Constats traités

S1 (baie de stockage unique), S2 (sauvegardes sans copie externalisée), S8 (aucun RPO/RTO formalisé),
C3 (absence de PRA/PCA) — cf. audits [systèmes](../04-audit-existant/audit-systemes.md) et
[cybersécurité](../04-audit-existant/audit-cybersecurite.md).

## Solution proposée

### Plan de Continuité d'Activité (PCA) — RTO = RPO = 0

- **Cluster VMware vSphere HA/DRS** réparti entre le siège et un second équipement à Lyon : bascule
  automatique des machines virtuelles en cas de panne d'un hôte, sans interruption perceptible.
- **Pare-feu et routeurs en haute disponibilité** (cf. [Lot A](lot-a-architecture-reseau.md)) : bascule
  automatique en cas de défaillance d'un équipement.
- **Onduleurs** redimensionnés avec test de coupure trimestriel documenté.
- **Double lien FAI et double tunnel VPN** (cf. [Lot A](lot-a-architecture-reseau.md)) : continuité de
  l'accès réseau en cas de rupture d'un lien.

### Plan de Reprise d'Activité (PRA) — RTO > 0, RPO ≥ 0

- **Réplication du stockage** entre la baie principale (siège) et une baie secondaire (Lyon) via **Veeam
  Backup & Replication**, en réplication asynchrone toutes les 15 minutes pour les VM critiques
  (KHS-Core, Active Directory, messagerie).
- **Sauvegardes** selon la règle **3-2-1-1** (cf. détail dans le
  [Lot 1 — Stockage et sauvegarde](lots-complementaires.md#lot-1--stockage-et-sauvegarde-lot-approfondi)) :
  3 copies, sur 2 supports différents, 1 copie hors site, 1 copie immuable (protection anti-rançongiciel).

### RPO / RTO définis par service

| Service | RPO | RTO |
|---|---|---|
| Application bancaire KHS-Core | 15 min | 1 h |
| Active Directory / DNS / DHCP | 15 min | 30 min |
| Messagerie (Exchange Online) | Géré par Microsoft (SLA 99,9 %) | Géré par Microsoft |
| Serveur de fichiers / GED | 1 h | 2 h |
| Réseau (cœur, pare-feu, VPN) | 0 | 0 (bascule automatique) |

## Justification

Le choix d'un cluster VMware réparti entre les deux sites transforme le site de Lyon, jusqu'ici simple
site secondaire dépendant du siège, en un véritable site de secours actif — condition nécessaire pour
répondre aux exigences de continuité formulées par l'ACPR pour un établissement bancaire.

## Bénéfices attendus

- Continuité de service garantie sur les composants réseau et virtualisation (RTO=0).
- Reprise d'activité rapide et maîtrisée sur les services applicatifs critiques.
- Conformité aux exigences de résilience du secteur bancaire.
