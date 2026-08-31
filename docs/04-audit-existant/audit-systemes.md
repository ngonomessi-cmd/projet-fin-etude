# Audit systèmes

## 1. Audit serveurs

### 1.1 Salle serveurs — siège de Paris

| Rôle | Système | Quantité | Constat |
|---|---|---|---|
| Applications de gestion administrative/financière, paye | Linux (bases Oracle) | 2 serveurs | Fonctionnels mais non documentés, montée de version Oracle non planifiée |
| Serveur de fichiers | Windows Server 2016 | 1 serveur | Point de défaillance unique, pas de cluster |
| Messagerie, applications web, base métier | Windows Server (rack) | ≈ 10 serveurs | Mutualisation excessive de rôles sur des serveurs physiques vieillissants |
| Base applicative **KHS-Core** | SQL Server 2012 | 1 instance | Version en fin de support étendu, faille de sécurité potentielle |
| Contrôleur de domaine (AD) | Windows Server 2016 | 1 (siège), 1 (Lyon) | Réplication AD fonctionnelle mais aucun test de bascule documenté |
| Messagerie | Exchange 2013 | 1 serveur | Version obsolète, fin de support Microsoft dépassée |

### 1.2 Stockage et sauvegarde

- L'ensemble des données est stocké sur **une seule baie de stockage** (SAN), sans réplication vers un
  second équipement : point de défaillance unique critique pour un établissement bancaire.
- Les sauvegardes sont réalisées par **deux robots de sauvegarde** (bandes), mais les bandes sont
  **conservées dans les sous-sols du siège** — aucune copie externalisée (« règle 3-2-1 » non respectée).
- Aucun **RPO/RTO** formalisé n'existe à ce jour ; aucun test de restauration documenté n'a été retrouvé.

### 1.3 Salle serveurs — équipements généraux

| Équipement | État constaté |
|---|---|
| Climatisation | Présente, redondance non vérifiée |
| Onduleurs | Présents, autonomie non documentée, pas de test de coupure récent |
| Baies | Occupation proche de la saturation, pas de marge d'évolution |

## 2. Audit des services

| Service | Constat |
|---|---|
| Active Directory / DNS / DHCP | Fonctionnels, mais schéma AD non révisé depuis plusieurs années ; pas de politique de mots de passe renforcée ; pas de MFA |
| Messagerie (Exchange 2013) | Version obsolète, absence de filtrage anti-phishing avancé, cible privilégiée d'attaques par ingénierie sociale |
| Serveur de fichiers | Pas de quotas ni de classification des données, arborescence de partages non documentée |
| Sauvegarde | Cf. §1.2 — absence de copie externalisée et de PRA formalisé |
| Déploiement et mises à jour | Pas d'outil centralisé de gestion des correctifs (WSUS/SCCM absent ou non exploité) |

## 3. Audit postes clients

| Élément | Constat |
|---|---|
| Système d'exploitation | Windows 8 (fin de support Microsoft dépassée), ≈ 920 postes |
| Suite bureautique | Hétérogène : Office 2016 (Wintel), Office 2011 (Mac), Open Office selon les services |
| Navigateurs | Internet Explorer 7 et 9 — versions obsolètes et non sécurisées |
| Ancienneté du matériel | Achats étalés entre 2007 et 2017 ; ≈ 30 % du parc a plus de 8 ans |
| Antivirus | Présent mais géré poste par poste, sans console centrale ni visibilité SOC |
| Gestion du parc | Pas d'inventaire centralisé (pas d'outil de type GLPI en place) |

## 4. Constats de l'audit systèmes

| # | Constat | Risque associé | Criticité |
|---|---|---|---|
| S1 | Baie de stockage unique, sans réplication | Perte de données en cas de sinistre matériel | Élevée |
| S2 | Sauvegardes sur bandes conservées sur site, sans copie externalisée | Perte de données en cas de sinistre du siège (incendie, dégât des eaux) | Élevée |
| S3 | SQL Server 2012 (hébergeant KHS-Core) en fin de support | Vulnérabilités non corrigées sur un système critique | Élevée |
| S4 | Exchange 2013 obsolète | Exposition accrue au phishing et compromission de comptes | Élevée |
| S5 | Windows 8 et IE7/IE9 sur les postes clients | Absence de correctifs de sécurité récents | Élevée |
| S6 | Absence d'outil centralisé de gestion des correctifs | Délai de correction des vulnérabilités non maîtrisé | Moyenne |
| S7 | Absence d'outil de gestion de parc (inventaire) | Difficulté de pilotage du cycle de vie matériel/logiciel | Moyenne |
| S8 | Aucun RPO/RTO formalisé, pas de test de restauration | Incapacité à garantir une reprise d'activité maîtrisée | Élevée |

Ces constats alimentent la [conclusion de l'audit](conclusion-audit.md) et les propositions des lots
[B (postes clients)](../05-solutions/lot-b-postes-clients.md),
[C (Office 365)](../05-solutions/lot-c-office365.md),
[Lot 1 (stockage/sauvegarde)](../05-solutions/lot-1-stockage-sauvegarde.md),
[Lot 4 (messagerie)](../05-solutions/lot-4-messagerie.md) et
[Lot G (PRA/PCA)](../05-solutions/lot-g-pra-pca.md).
