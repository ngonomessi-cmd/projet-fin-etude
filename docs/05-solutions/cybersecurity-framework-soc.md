# Préparation de la cybersecurity framework et mise en place du SOC

*Répond aux sections 5, 6 et 7 du [cahier des charges KHS Bank](../02-cahier-des-charges/cahier-des-charges-khs-bank.md).*

## 1. Cybersecurity framework

### Politique et procédures de cybersécurité

MOM-TECH élabore, en collaboration avec le RSSI de KHS Bank, l'ensemble des documents de gouvernance
attendus :

- **Politique de Sécurité du Système d'Information (PSSI)**, structurée selon les grands domaines de la
  norme **ISO 27001** (contrôle d'accès, cryptographie, sécurité physique, continuité, conformité) ;
- **Procédure de gestion des incidents de sécurité**, alignée sur la pratique ITIL v4 *Incident
  Management* ;
- **Procédure de révocation des accès** (départ, changement de poste), intégrée au workflow RH-DSI ;
- **Registre des traitements** (RGPD) et **cartographie des données** sensibles, en cohérence avec la
  [GED sécurisée du Lot F](lot-f-audit-securite-ged.md).

### Plan de gestion de la cyber-crise

Un plan de gestion de crise cyber est formalisé, couvrant :

- la **cellule de crise** (RSSI, DSI, Direction Générale, MOM-TECH, communication) et son mode
  d'activation ;
- les **scénarios de crise** prioritaires pour un établissement bancaire : rançongiciel, fuite de données
  clients, indisponibilité des moyens de paiement, fraude massive ;
- la **procédure de notification** réglementaire (CNIL sous 72h en cas de violation de données, ACPR
  pour tout incident majeur affectant les services bancaires) ;
- des **exercices de crise** semestriels (simulation d'incident) pour tester la procédure en conditions
  réelles.

## 2. Mise en place du SOC (Security Operations Center)

### Architecture du SOC

Le SOC repose sur **Microsoft Sentinel**, SIEM/SOAR cloud natif, alimenté par l'ensemble des sources de
journalisation mises en place dans les lots précédents :

```
        Sources d'événements                         SOC (Microsoft Sentinel)
   ┌─────────────────────────────┐             ┌─────────────────────────────┐
   │ Fortinet FortiGate (Lot A/E) │────────────▶│                             │
   │ Defender for Endpoint (Lot D)│────────────▶│   Corrélation d'événements  │
   │ Entra ID / Conditional Access│────────────▶│   Détection assistée par IA │
   │ (Lot C)                      │             │   (UEBA — analyse compor-   │
   │ Microsoft Purview (Lot F)    │────────────▶│   tementale utilisateurs)   │
   │ Exchange Online / Defender   │────────────▶│                             │
   │ for Office 365 (Lot 4)       │             │   Playbooks de réponse      │
   │ Journaux serveurs / GLPI     │────────────▶│   automatisée (SOAR)        │
   └─────────────────────────────┘             └──────────────┬──────────────┘
                                                                │
                                                      Analystes SOC MOM-TECH
                                                      (astreinte 24/7 sur
                                                       incidents critiques)
```

L'exploitation de l'**intelligence artificielle** (analyse comportementale — UEBA) permet de détecter des
scénarios spécifiques au secteur bancaire : connexions atypiques à des heures inhabituelles,
enchaînement de transactions suspectes dans KHS-Core, exfiltration massive de documents depuis la GED
— un axe différenciant porté par le pôle IA & Data de MOM-TECH.

### Planning préliminaire de réalisation

| Étape | Contenu | Phase du projet |
|---|---|---|
| Instrumentation | Connexion des sources (pare-feu, EDR, identité, messagerie) à Sentinel | Déploiement |
| Corrélation | Activation des règles de détection et des playbooks SOAR | Déploiement |
| Astreinte | Mise en place du support 24/7 sur incidents critiques | Tests/Recette |
| Amélioration continue | Ajustement des règles selon les faux positifs constatés | Post-migration |

### Plan de test global

Tests de bout en bout par scénario (ex. simulation de compromission d'un compte, exfiltration de
document confidentiel) afin de valider la remontée d'alerte, le délai de détection et l'efficacité des
playbooks de réponse automatisée.

### Plan de formation et contrat de support

- Formation des équipes internes KHS Bank à la lecture des tableaux de bord SOC et à la procédure
  d'escalade (cf. [formation utilisateurs](../03-gestion-de-projet/gantt.md)) ;
- Contrat de support MOM-TECH incluant l'astreinte SOC, détaillé dans le
  [bilan financier](../08-bilan-financier-recette/).

### Démonstration sur plateforme de test

Une démonstration du SOC est réalisée en environnement de recette avant mise en production, avec
injection d'événements de test (simulation d'attaque) pour valider la chaîne complète de détection et de
réponse.
