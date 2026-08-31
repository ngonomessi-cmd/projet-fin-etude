# Lot B — Déploiement des postes clients : client léger / client lourd

## Constat traité

S5 (Windows 8 obsolète, navigateurs non sécurisés, parc hétérogène) — cf.
[audit systèmes](../04-audit-existant/audit-systemes.md).

## Solution proposée

Une approche **mixte client léger / client lourd**, selon le profil d'usage :

| Profil | Population | Solution |
|---|---|---|
| Métiers sensibles (conseillers clientèle, back-office, gestion de patrimoine) | ≈ 600 postes | **Client léger / VDI** (VMware Horizon), aucune donnée bancaire stockée localement |
| Fonctions support et nomades (commerciaux, direction, IT) | ≈ 320 postes | **Client lourd** Windows 11 Entreprise LTSC, chiffrement BitLocker |

- Image système standardisée, déployée via **Microsoft Intune / MDT** (cf. [Lot J](lot-j-deploiements-mises-a-jour.md)).
- Suite bureautique unifiée : **Microsoft 365 Apps** (cf. [Lot C](lot-c-office365-entra-id.md)).
- Navigateur unique et à jour (Microsoft Edge, mises à jour automatiques).
- Postes clients légers administrés depuis le datacenter (cluster VMware, cf. [Lot 3](lots-complementaires.md#lot-3--virtualisation)) :
  aucune information client persistée sur le poste physique, ce qui réduit fortement le risque en cas de
  vol ou perte de matériel — un point fort en environnement bancaire.

## Justification

Le client léger pour les métiers manipulant des données clients sensibles répond directement à
l'exigence de confidentialité du secret bancaire et facilite la conformité RGPD/PCI-DSS (les données ne
transitent jamais au-delà de l'environnement contrôlé du datacenter). Le client lourd reste réservé aux
usages nécessitant de la mobilité ou une puissance de calcul locale, où le VDI apporterait plus de
contraintes que de bénéfices.

## Bénéfices attendus

- Fin de l'hétérogénéité du parc et de l'exposition liée à Windows 8/IE7-9.
- Réduction du risque de fuite de données sur les postes exposés (vol, perte).
- Simplification du support (image standard, déploiement centralisé).
