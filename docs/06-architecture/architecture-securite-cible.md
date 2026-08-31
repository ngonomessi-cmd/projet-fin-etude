# Architecture sécurité cible

## 1. Logique d'accès *zero trust*

```
 Utilisateur (poste client léger/lourd, cf. Lot B)
        │
        ▼
 Authentification Entra ID + MFA (Conditional Access, cf. Lot C)
        │
        ├── Non conforme (poste non chiffré, MFA absent) ──▶ Accès refusé
        │
        ▼ Conforme
 Accès conditionné au périmètre (VLAN, cf. architecture réseau)
        │
        ├── VLAN 20 (KHS-Core) ──▶ Filtrage applicatif pare-feu + journalisation
        ├── GED sécurisée (SharePoint/Purview) ──▶ Classification + DLP + audit immuable
        └── Ressources internes via VPN ──▶ MFA obligatoire + bastion PAM (comptes à privilèges)
        │
        ▼
 Journalisation de tous les accès ──▶ Microsoft Sentinel (SOC)
```

Chaque accès, qu'il concerne l'application bancaire, la GED ou l'administration des équipements, est
conditionné à une authentification forte et journalisé — principe de sécurité *zero trust* : aucune
confiance implicite n'est accordée du seul fait d'être connecté au réseau interne.

## 2. Intégration du dispositif de détection (SOC)

Le schéma détaillé des flux de journalisation vers le SOC est présenté dans
[Préparation de la cybersecurity framework et mise en place du SOC](../05-solutions/cybersecurity-framework-soc.md#2-mise-en-place-du-soc-security-operations-center).
Il est rappelé ici que l'ensemble des composants de l'architecture cible (pare-feu, EDR, identité, GED,
messagerie) alimentent un point de corrélation unique, condition de la détection croisée mise en avant
par MOM-TECH.

## 3. Synthèse des mécanismes de protection par couche

| Couche | Mécanisme | Lot associé |
|---|---|---|
| Identité | Entra ID, MFA, Conditional Access, PIM (comptes à privilèges) | [Lot C](../05-solutions/lot-c-office365-entra-id.md), [Lot F](../05-solutions/lot-f-audit-securite-ged.md) |
| Poste de travail | Defender for Endpoint (EDR/XDR), chiffrement BitLocker | [Lot D](../05-solutions/lot-d-antivirus-edr.md), [Lot B](../05-solutions/lot-b-postes-clients.md) |
| Réseau | Segmentation VLAN, pare-feu HA, IPS | [Lot A](../05-solutions/lot-a-architecture-reseau.md), [Lot E](../05-solutions/lot-e-ids-ips.md) |
| Application | Filtrage applicatif dédié KHS-Core, Always On (intégrité/dispo) | [Lot 5](../05-solutions/lots-complementaires.md) |
| Données | Classification, DLP, chiffrement, GED sécurisée | [Lot F](../05-solutions/lot-f-audit-securite-ged.md) |
| Continuité | Réplication, sauvegarde 3-2-1-1, PRA/PCA | [Lot G](../05-solutions/lot-g-pra-pca.md), [Lot 1](../05-solutions/lots-complementaires.md) |
| Détection & réponse | SOC / SIEM / SOAR, IA comportementale | [SOC](../05-solutions/cybersecurity-framework-soc.md) |

Cette lecture en couches (« defense in depth ») garantit qu'une défaillance ou un contournement d'un
mécanisme unique n'expose jamais directement les données bancaires ou personnelles des clients de
KHS Bank.
