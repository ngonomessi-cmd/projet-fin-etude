# Propositions de solutions

Chaque lot du [cahier des charges](../02-cahier-des-charges/cahier-des-charges-khs-bank.md) est traité
individuellement, avec un fil conducteur cohérent :

- **Réseau** : Cisco (cœur/distribution/accès) + Fortinet (pare-feu/IPS), en cohérence avec le parc
  existant et les compétences de l'équipe Réseau & Sécurité.
- **Virtualisation & stockage** : VMware vSphere + Veeam Backup & Replication, pour un cluster haute
  disponibilité répliqué entre les deux sites (socle du PRA/PCA).
- **Identité, bureautique & sécurité applicative** : socle **Microsoft 365 E5 / Microsoft Entra ID**
  (ex-Azure AD) — bureautique, messagerie, IAM/MFA, EDR (Defender for Endpoint), protection des
  données (Purview DLP) et GED sécurisée s'appuient sur la **même plateforme**, ce qui simplifie
  l'administration, réduit le nombre d'éditeurs et permet une intégration native avec le SOC.
- **Supervision & SOC** : **Microsoft Sentinel** (SIEM/SOAR avec détection assistée par IA — UEBA), au
  cœur de l'expertise IA de MOM-TECH, complété par PRTG/Zabbix pour la supervision infrastructure et
  GLPI pour la gestion de parc et le ticketing.

Ce choix limite la fragmentation technologique (un nombre d'éditeurs réduit = moins de failles
d'intégration, conformément au constat d'audit sur l'hétérogénéité du SI existant) tout en couvrant
l'ensemble des exigences réglementaires (RGPD, ACPR, DSP2, PCI-DSS) identifiées dans l'audit.

## Lots principaux

| Lot | Objet | Solution retenue | Constats traités |
|---|---|---|---|
| [A](lot-a-architecture-reseau.md) | Architecture réseau, DHCP/DNS | Cisco Catalyst 9000 + Fortinet FortiGate HA, VLAN/DMZ, double lien FAI | R1-R7 |
| [B](lot-b-postes-clients.md) | Postes clients (léger/lourd) | Windows 11 + VDI (VMware Horizon) pour le back-office | S5 |
| [C](lot-c-office365-entra-id.md) | Bureautique Office 365 + identité | Microsoft 365 E5, Entra ID hybride, Conditional Access MFA | S5, C2 |
| [D](lot-d-antivirus-edr.md) | Antivirus/EDR centralisé | Microsoft Defender for Endpoint (XDR) | C4 |
| [E](lot-e-ids-ips.md) | Système de prévention d'intrusion | Fortinet IPS (FortiGate) + Defender complémentaire | R5, C1 |
| [F](lot-f-audit-securite-ged.md) | Audit de sécurité + GED sécurisée | Méthodologie d'audit continue + Microsoft Purview (GED, DLP, PAM/PIM) | C2, C5, C6, C8 |
| [G](lot-g-pra-pca.md) | PRA / PCA | Cluster VMware répliqué + Veeam, RPO/RTO définis | S1, S2, S8, C3 |
| [H](lot-h-monitoring-ticketing.md) | Monitoring et ticketing | PRTG/Zabbix + GLPI | S6, S7 |
| [I](lot-i-gestion-parc-maintenance.md) | Gestion de parc et contrat de maintenance | GLPI + contrat de maintenance MOM-TECH | S7, R6 |
| [J](lot-j-deploiements-mises-a-jour.md) | Déploiements et mises à jour | Microsoft Intune + WSUS | S6 |

## Lots complémentaires

| Lot | Objet | Solution retenue | Traitement |
|---|---|---|---|
| [1](lots-complementaires.md) | Stockage et sauvegarde | Baies répliquées + Veeam (règle 3-2-1-1), copie immuable cloud | **Approfondi** (constats S1/S2) |
| [2](lots-complementaires.md) | Annuaire LDAP | Active Directory modernisé + Entra ID Connect | Synthétique |
| [3](lots-complementaires.md) | Virtualisation | Cluster VMware vSphere HA/DRS | Synthétique |
| [4](lots-complementaires.md) | Messagerie | Exchange Online + Defender for Office 365 | Synthétique |
| [5](lots-complementaires.md) | Bases de données | SQL Server 2022 Always On (KHS-Core), Oracle 19c | Synthétique |
| [6](lots-complementaires.md) | VOIP | Microsoft Teams Phone + SBC | Synthétique |

> Conformément au cahier des charges (§4.4), **le lot 1 (Stockage et sauvegarde)** est le lot
> complémentaire approfondi : il répond aux constats d'audit les plus critiques (baie unique, sauvegarde
> sans copie externalisée) et conditionne directement le PRA/PCA. Sa [procédure de mise en œuvre
> détaillée](../09-procedures/) est fournie dans la section Procédures.

## Cybersécurité (hors lots A-J)

- [Préparation de la cybersecurity framework et mise en place du SOC](cybersecurity-framework-soc.md)
  (cahier des charges §5, §6, §7)
