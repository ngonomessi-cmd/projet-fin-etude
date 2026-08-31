# Lot J — Déploiements et mises à jour (OS et applications)

## Constat traité

S6 (absence d'outil centralisé de gestion des correctifs) — cf.
[audit systèmes](../04-audit-existant/audit-systemes.md).

## Solution proposée

- **Microsoft Intune** pour la gestion des postes clients (cf. [Lot B](lot-b-postes-clients.md)) :
  déploiement d'image, politiques de conformité, mise à jour automatique de Windows 11 et des
  applications Microsoft 365.
- **WSUS** relié à Intune pour la maîtrise du séquencement des correctifs sur les serveurs Windows
  (validation en environnement de test avant déploiement en production).
- Fenêtres de maintenance planifiées hors heures d'ouverture pour les mises à jour serveurs, avec
  procédure de retour arrière (cf. [gestion des changements ITIL](../03-gestion-de-projet/demarche-itil.md)).

## Justification

L'intégration Intune/Entra ID (cf. [Lot C](lot-c-office365-entra-id.md)) permet un déploiement conditionné
à la conformité du poste (chiffrement actif, antivirus à jour) avant tout accès aux ressources sensibles —
un principe de sécurité *zero trust* cohérent avec les exigences bancaires.

## Bénéfices attendus

- Réduction du délai moyen de correction des vulnérabilités.
- Conformité systématique des postes avant accès aux données sensibles.
