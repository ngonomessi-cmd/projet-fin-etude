# Recette

## Cahier de tests (extrait)

| Réf. | Lot | Test | Résultat attendu | Statut |
|---|---|---|---|---|
| T01 | A | Bascule automatique du cœur de réseau (arrêt d'un membre du stack) | Aucune coupure perceptible | ✅ Conforme |
| T02 | A | Bascule du lien VPN principal vers le lien de secours | Reprise < 30 s, aucune perte de session applicative | ✅ Conforme |
| T03 | G | Bascule du cluster VMware (arrêt d'un hôte) | RTO ≤ 30 min, VM critiques redémarrées automatiquement | ✅ Conforme |
| T04 | 1 | Restauration d'une sauvegarde Veeam (VM de test) | Restauration complète en moins de 2 heures | ✅ Conforme |
| T05 | 5 | Bascule Always On de la base KHS-Core | RTO ≤ 1 heure, RPO ≤ 15 min, aucune perte de transaction validée | ✅ Conforme |
| T06 | C | Connexion utilisateur sans second facteur | Accès refusé (MFA obligatoire) | ✅ Conforme |
| T07 | D | Simulation d'exécution de fichier malveillant sur un poste test | Détection et isolation automatique par Defender for Endpoint | ✅ Conforme |
| T08 | SOC | Injection d'un événement d'authentification suspecte | Alerte générée dans Sentinel en moins de 5 minutes | ✅ Conforme |
| T09 | F | Tentative d'envoi externe d'un document classé confidentiel | Blocage automatique par la politique DLP | ✅ Conforme |
| T10 | B | Poste client léger : absence de données locales après déconnexion | Aucune donnée persistée localement | ✅ Conforme |
| T11 | 6 | Appel test entre les deux sites via Teams Phone | Qualité vocale conforme, QoS respectée | ✅ Conforme |
| T12 | Réseau | Isolement du VLAN invités vis-à-vis du LAN interne | Aucune route accessible vers les VLAN internes | ✅ Conforme |

L'intégralité du cahier de tests (couvrant chaque lot principal et complémentaire) est fournie en annexe
du dossier complet.

## Procès-verbal de recette (modèle)

```
PROCÈS-VERBAL DE RECETTE
Projet : Migration et sécurisation du système d'information — KHS Bank
Prestataire : MOM-TECH

Entre les soussignés, il est convenu ce qui suit :

Le Client déclare avoir pris connaissance des résultats des tests de recette figurant au cahier
de tests, réalisés du [date] au [date], sur l'ensemble des lots principaux et complémentaires
définis au cahier des charges.

☐ Recette prononcée sans réserve
☐ Recette prononcée avec réserve(s) — liste des réserves ci-jointe, avec délai de levée convenu
☐ Recette refusée — motifs ci-joints

Fait à Paris, le [date], en deux exemplaires.

Pour KHS Bank                              Pour MOM-TECH
[Nom, fonction, signature]                 [Nom, fonction, signature]
```

La validation du procès-verbal de recette, signé conjointement par la DSI de KHS Bank et le Chef de
projet MOM-TECH, marque le passage du projet en phase de fonctionnement normal (*Run*), couverte par
le [contrat de maintenance](contrat-maintenance.md).
