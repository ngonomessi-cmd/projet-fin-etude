# Présentation de la société cliente : KHS Bank

## Identité

| | |
|---|---|
| Raison sociale | KHS Bank |
| Statut | Établissement de crédit agréé par l'ACPR |
| Siège social | Paris La Défense (92) |
| Site secondaire | Lyon (69) — back-office et centre de relation client |
| Création | 2004 |
| Effectif | ≈ 920 collaborateurs (780 au siège, 140 à Lyon) |
| Budget annuel SI | 14 000 000 € |
| Secteurs d'activité | Banque de détail, banque des professionnels, gestion de patrimoine |

## Historique et positionnement

Fondée en 2004, KHS Bank s'est développée en combinant une offre de banque de détail traditionnelle
et une activité de gestion de patrimoine à forte valeur ajoutée. Sa croissance régulière du produit net
bancaire lui a permis de consolider sa position d'établissement de taille intermédiaire, reconnu pour la
qualité de sa relation client et la confidentialité apportée à sa clientèle privée.

Comme l'ensemble du secteur bancaire, KHS Bank fait face à une double pression : la nécessité de
moderniser son expérience client (services digitaux, mobilité) et l'intensification des exigences
réglementaires et des menaces de cybersécurité pesant sur le secteur financier. C'est dans ce contexte
que la direction a décidé de confier la refonte de son système d'information à un prestataire spécialisé.

## Organisation

```
                         Direction Générale
                                 │
        ┌───────────────┬───────┼───────┬────────────────┐
        │                │               │                │
  Direction des    Direction des   Direction     Direction Conformité
  Systèmes         Risques &       Commerciale    & Sécurité (RSSI)
  d'Information     Contrôle
  (DSI)             Interne
        │
   ┌────┴─────┬─────────────┬───────────────┐
Responsable  Responsable   Responsable      Chef de Projet
Infrastructure Support     Sécurité SI      (référent MOM-TECH)
& Réseau      Utilisateurs  (interne)
```

Le pilotage du projet côté client est assuré conjointement par la **DSI** (maîtrise d'ouvrage) et la
**Direction Conformité & Sécurité**, qui doit valider toute solution impactant la protection des données
clients et le respect des exigences ACPR/RGPD.

## Infrastructure et contexte technique (synthèse)

KHS Bank exploite un système d'information vieillissant, hérité de choix technologiques successifs non
harmonisés entre le siège et le site de Lyon (cf. [cahier des charges](../02-cahier-des-charges/cahier-des-charges-khs-bank.md)
pour le détail complet) : postes sous Windows 8, annuaire Active Directory 2016, messagerie
Exchange 2013, base SQL Server 2012, liaison VPN unique entre sites sans redondance. Cette dette
technique, conjuguée à l'absence de SOC et de PCA formalisé, constitue le principal facteur de risque
identifié par la direction.

## Enjeux du projet pour KHS Bank

1. **Conformité réglementaire** : ACPR, DSP2, PCI-DSS, RGPD, secret bancaire.
2. **Continuité d'activité** : les interruptions de service sur les moyens de paiement ont un impact direct
   sur la confiance client et sont surveillées par le régulateur.
3. **Cybersécurité** : le secteur bancaire est une cible privilégiée (fraude, rançongiciels, hameçonnage
   ciblant les collaborateurs et les clients).
4. **Performance et modernisation** : réduction de la latence, harmonisation du parc, migration vers des
   outils collaboratifs modernes (Office 365).
