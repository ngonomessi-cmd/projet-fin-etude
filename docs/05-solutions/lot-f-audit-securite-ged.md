# Lot F — Audit de sécurité (et gestion électronique de documents sécurisée)

## Constats traités

C2 (absence de MFA), C5 (documents sensibles non classifiés, absence de GED), C6 (absence de PSSI
formalisée), C8 (absence de gestion des comptes à privilèges) — cf.
[audit cybersécurité](../04-audit-existant/audit-cybersecurite.md).

## 1. Méthodologie d'audit de sécurité continue

Au-delà de l'audit initial (cf. [Audit de l'existant](../04-audit-existant/)), MOM-TECH met en place un
cycle d'audit récurrent, conforme à la démarche d'amélioration continue ITIL v4 :

- audit annuel des règles de pare-feu / ACL / NAT ;
- tests d'intrusion (pentest) externes annuels, réalisés par un prestataire indépendant, conformément
  aux recommandations ANSSI ;
- revue trimestrielle des droits d'accès (comptes dormants, privilèges excessifs) ;
- rédaction/mise à jour de la **Politique de Sécurité du Système d'Information (PSSI)**, diffusée et
  signée par l'ensemble des collaborateurs — corrige **C6**.

## 2. Gestion électronique de documents (GED) sécurisée

### Contexte

L'audit a révélé que les documents internes sensibles de KHS Bank (dossiers de crédit, pièces KYC,
rapports de conformité) sont stockés sur un serveur de fichiers classique, sans classification ni
traçabilité des accès (constat **C5**). Cette lacune expose l'établissement à un risque de fuite de
données et à une non-conformité RGPD/secret bancaire.

### Solution proposée

Mise en place d'une GED sécurisée s'appuyant sur **SharePoint Online / OneDrive Entreprise**
(inclus dans le socle Microsoft 365 E5 du [Lot C](lot-c-office365-entra-id.md)), enrichie par
**Microsoft Purview** :

- **Classification des documents** par niveau de confidentialité (public interne / restreint / confidentiel)
  via des étiquettes de sensibilité (*sensitivity labels*) appliquées automatiquement selon le contenu
  détecté (ex. numéro de compte, IBAN, pièce d'identité) ;
- **Contrôle d'accès basé sur les rôles (RBAC)**, aligné sur le modèle vu dans les projets de
  dématérialisation documentaire comparables (rédacteur, validateur, administrateur, auditeur) ;
- **Chiffrement au repos et en transit**, natif à la plateforme ;
- **Data Loss Prevention (DLP)** : blocage ou alerte automatique en cas de tentative d'envoi externe
  d'un document classé confidentiel ;
- **Journal d'audit immuable** (Microsoft Purview Audit), consultable par les auditeurs internes et
  externalisable vers le SIEM pour investigation en cas d'incident ;
- **Workflow de validation** pour les documents sensibles (dépôt → vérification → validation →
  publication), sur le même principe que les circuits de double validation documentaire.

### Gestion des comptes à privilèges (PAM)

Mise en place de **Microsoft Entra Privileged Identity Management (PIM)** : élévation de privilèges
temporaire et justifiée pour les comptes administrateurs (réseau, systèmes, sécurité), avec approbation
et journalisation systématiques — corrige **C8**.

## Justification

Ce choix évite de déployer une GED spécifique supplémentaire (coût, intégration, formation) en
s'appuyant sur la plateforme Microsoft 365 déjà retenue pour la bureautique et l'identité : la
classification, le DLP et l'audit documentaire héritent directement de l'IAM (Entra ID) et du SIEM
(Sentinel) déjà en place, pour une cohérence d'ensemble et une charge d'exploitation réduite.

## Bénéfices attendus

- Protection renforcée des documents bancaires sensibles, conforme RGPD et secret bancaire.
- Traçabilité complète des accès et des modifications, exploitable en cas de contrôle ACPR.
- Réduction du risque d'abus de privilèges administrateur.
