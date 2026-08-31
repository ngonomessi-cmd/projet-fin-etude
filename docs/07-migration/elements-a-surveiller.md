# Éléments à surveiller

Au-delà de la période d'hypercare, les indicateurs suivants sont intégrés à la supervision continue
(PRTG, GLPI, Microsoft Sentinel — cf. [Lot H](../05-solutions/lot-h-monitoring-ticketing.md)) et font
l'objet d'un reporting régulier à la DSI de KHS Bank dans le cadre du
[contrat de maintenance](../05-solutions/lot-i-gestion-parc-maintenance.md).

| Élément surveillé | Outil | Seuil d'alerte indicatif |
|---|---|---|
| Disponibilité des liens VPN et des accès Internet (2 sites) | PRTG | Toute coupure > 1 min |
| Charge CPU/RAM du cluster VMware | PRTG / vCenter | > 80 % soutenu |
| Latence de réplication du stockage (écart au RPO cible) | Veeam | > 15 min (VM critiques) |
| Taux d'échec d'authentification MFA | Microsoft Entra ID / Sentinel | Pic anormal (indicateur de tentative d'intrusion) |
| Volume et pertinence des alertes SOC | Microsoft Sentinel | Taux de faux positifs > 20 % |
| Temps de réponse de l'application KHS-Core | Supervision applicative | Dégradation > 20 % par rapport à la ligne de base |
| Volume et nature des tickets GLPI | GLPI | Pic de tickets liés à un même composant (signal de dérive) |
| Espace disponible sur les baies de stockage | PRTG / Veeam | < 20 % d'espace libre |
| Conformité des postes (chiffrement, MFA, correctifs à jour) | Microsoft Intune | Tout poste non conforme |
| Expiration des certificats et licences (Fortinet, VMware, Microsoft) | GLPI (inventaire) | Alerte à J-60 avant expiration |

Ces indicateurs reprennent et complètent les [indicateurs de suivi du projet](../03-gestion-de-projet/README.md#indicateurs-de-suivi-du-projet)
définis en phase de pilotage, désormais utilisés en régime de fonctionnement normal (*Run*).
