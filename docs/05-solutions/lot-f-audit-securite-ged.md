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

### Solution retenue : une GED sécurisée réalisée par MOM-TECH

MOM-TECH réalise et déploie une **GED sécurisée dédiée**, construite avec des outils libres (application web
Next.js, base PostgreSQL). Elle ne se limite pas au stockage : elle permet de **créer et de faire vivre les
documents dans la plateforme**, avec des règles de sécurité appliquées par la base de données elle-même.
Le détail de la réalisation est présenté au chapitre « Lot F (suite) — La GED sécurisée réalisée par
MOM-TECH ».

- **Ateliers documentaires intégrés** : rédaction en ligne de documents texte (type **Word**), de tableurs (type **Excel**) et de
  présentations (type **PowerPoint**), à partir de modèles bilingues (français / anglais), avec export au format
  natif (.docx, .xlsx, .pptx) et en **PDF**. Les documents sont créés dans la GED : ils naissent classés,
  référencés et tracés, sans passer par un poste de travail ni par un partage de fichiers.
- **Classification des documents** par niveau de confidentialité (public interne / restreint /
  confidentiel), appliquée par la base de données ;
- **Contrôle d'accès basé sur les rôles (RBAC)** (rédacteur, validateur, administrateur, auditeur) et
  cloisonnement par département, appliqués par PostgreSQL (*Row Level Security*) ;
- **Workflow de validation** pour les documents sensibles (dépôt → vérification → validation →
  publication) ;
- **Journal d'audit immuable**, consultable par les auditeurs internes, qu'aucun profil ne peut modifier ;
- **Authentification forte** : double authentification obligatoire (TOTP), imposée par la base ;
- **Signature numérique du Directeur Général** (QR code, page publique de vérification) et **archivage
  scellé** (empreinte SHA-256, lecture seule définitive) ;
- **Chiffrement en transit** (HTTPS) et fichiers servis par des adresses signées de courte durée ;
- **Messagerie interne** et **service du courrier physique** rattachés à la même plateforme.

### Compléments apportés par le socle Microsoft 365 E5

La GED ne remplace pas le socle Microsoft 365 du [Lot C](lot-c-office365-entra-id.md) : elle en reprend les
compléments là où ils sont déjà licenciés.

- **Microsoft Purview DLP** : blocage ou alerte en cas de tentative d'envoi externe d'un document classé
  confidentiel par la **messagerie**, Teams ou OneDrive (la GED, elle, ne transmet aucun document à
  l'extérieur sans action explicite d'un agent habilité) ;
- **Microsoft Entra Privileged Identity Management (PIM)**, ci-dessous, pour les comptes à privilèges.

### Gestion des comptes à privilèges (PAM)

Mise en place de **Microsoft Entra Privileged Identity Management (PIM)** : élévation de privilèges
temporaire et justifiée pour les comptes administrateurs (réseau, systèmes, sécurité), avec approbation
et journalisation systématiques — corrige **C8**. Dans la GED, le rôle d'administrateur est lui aussi
tracé dans le journal d'audit, et aucun agent ne peut s'attribuer un rôle.

## Justification

Pourquoi une GED dédiée plutôt qu'un espace SharePoint :

- **Les règles d'accès sont portées par la base de données** et non par une configuration à maintenir :
  elles se testent, se rejouent et s'auditent ; un défaut de l'interface n'ouvre aucune donnée.
- **Circuit réglementé de bout en bout** : création, validation, signature, archivage scellé et courrier
  physique sont intégrés dans un même outil, ce qui répond à l'exigence de traçabilité du secret bancaire
  et du contrôle ACPR.
- **Maîtrise des coûts** : aucune licence supplémentaire pour la GED, qui s'appuie sur des composants libres.
- **Réutilisabilité** : la même plateforme sert plusieurs organisations (cf. chapitre « Lot F (suite) »).
- SharePoint Online / OneDrive restent disponibles pour la collaboration courante (Lot C), sans porter les
  documents classés.

Contrepartie assumée : MOM-TECH assure l'exploitation et les évolutions de cette plateforme dans le cadre du
[contrat de maintenance](../08-bilan-financier-recette/contrat-maintenance.md). Son hébergement (cluster de
virtualisation du [Lot G](lot-g-pra-pca.md) ou cloud) est une décision de la Direction Conformité &
Sécurité de KHS Bank.

## Bénéfices attendus

- Protection renforcée des documents bancaires sensibles, conforme RGPD et secret bancaire.
- Traçabilité complète des accès et des modifications, exploitable en cas de contrôle ACPR.
- Documents produits directement dans l'outil, donc classés et référencés dès leur création.
- Réduction du risque d'abus de privilèges administrateur.
