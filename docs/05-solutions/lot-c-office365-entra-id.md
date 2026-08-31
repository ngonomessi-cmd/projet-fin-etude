# Lot C — Migration des logiciels de bureautique vers Office 365

## Constats traités

S5 (suites bureautiques hétérogènes et obsolètes), C2 (absence de MFA, non-conformité DSP2) — cf.
[audit systèmes](../04-audit-existant/audit-systemes.md) et [audit cybersécurité](../04-audit-existant/audit-cybersecurite.md).

## Solution proposée

### Bureautique

Migration de l'ensemble des postes vers **Microsoft 365 E5**, incluant les applications bureautiques
(Word, Excel, PowerPoint, Outlook), Teams (collaboration et visioconférence) et SharePoint/OneDrive
(stockage collaboratif, socle de la [GED sécurisée du lot F](lot-f-audit-securite-ged.md)).

Le choix de la licence **E5** (plutôt que E3) est justifié par l'inclusion native des briques de sécurité
utilisées dans les lots suivants (Defender for Endpoint, Defender for Office 365, Purview) : un seul
contrat, une seule console d'administration, une intégration native — cohérent avec le constat d'audit
sur la dispersion des outils de sécurité.

### Identité (IAM)

Mise en place d'une **identité hybride** :

- **Active Directory** on-premise conservé comme source de vérité (cf. [Lot 2](lots-complementaires.md#lot-2--annuaire-ldap)) ;
- synchronisation vers **Microsoft Entra ID** (ex-Azure AD) via Entra Connect ;
- **Conditional Access** imposant une **authentification multifacteur (MFA)** pour tous les accès aux
  ressources Microsoft 365 et, via Entra ID Application Proxy, pour les accès distants aux applications
  internes — corrige directement le constat **C2** (non-conformité DSP2 sur l'authentification forte).

### Migration

- Déploiement pilote sur un service représentatif (20 utilisateurs), puis généralisation par vagues de
  150 utilisateurs afin de limiter l'impact sur l'activité (cf. [plan de migration](../07-migration/)).
- Conversion des documents Excel hérités (modèles de simulation financière en échec, cf. cahier des
  charges §2.3) via un contrôle de compatibilité avant bascule.

## Justification

Une plateforme unique pour la bureautique **et** l'identité réduit le nombre d'annuaires et de points
d'authentification à sécuriser, simplifie l'audit des accès (exigence ACPR) et permet un déploiement du
MFA sans solution tierce supplémentaire.

## Bénéfices attendus

- Fin des incompatibilités entre versions de suites bureautiques.
- Mise en conformité DSP2 (authentification forte) dès ce lot.
- Base d'identité unifiée pour l'ensemble des lots de sécurité qui suivent.
