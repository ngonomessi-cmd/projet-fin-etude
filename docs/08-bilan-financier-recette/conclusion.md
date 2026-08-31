# Conclusion

## Synthèse du projet

Le [cahier des charges](../02-cahier-des-charges/cahier-des-charges-khs-bank.md) de KHS Bank exprimait
un besoin double : moderniser un système d'information vieillissant et hétérogène, et le mettre en
conformité avec les exigences strictes du secteur bancaire (ACPR, DSP2, PCI-DSS, RGPD). L'
[audit de l'existant](../04-audit-existant/) a mis en évidence quatorze constats de criticité élevée,
concentrés sur trois axes : l'absence de redondance (réseau, stockage, pare-feu), l'absence de
dispositif de détection et de continuité (pas de SOC, pas de PRA/PCA formalisé), et une protection
insuffisante des données sensibles (pas de MFA, pas de GED sécurisée).

MOM-TECH a répondu à chacun de ces constats par une [architecture cible](../06-architecture/) cohérente,
construite autour de trois piliers technologiques limitant la fragmentation des éditeurs : Cisco/Fortinet
pour le réseau, VMware/Veeam pour la virtualisation et le PRA/PCA, et un socle Microsoft 365 E5/Entra ID
pour l'identité, la bureautique et une large part de la cybersécurité — complété par **Microsoft
Sentinel**, SOC exploitant la détection assistée par intelligence artificielle, cœur de métier de
MOM-TECH.

Le [plan de migration](../07-migration/) en sept étapes, construit sur un principe de coexistence
progressive, a permis d'atteindre l'objectif contractuel central : **aucune interruption des services
bancaires** pendant toute la durée du projet. La [recette](recette.md) confirme la conformité de
l'ensemble des lots aux exigences du cahier des charges.

## Résultats au regard des objectifs initiaux

| Objectif du cahier des charges | Résultat |
|---|---|
| Fiabiliser le SI | Suppression de tous les points de défaillance unique identifiés ; RTO=0 sur le réseau et la virtualisation |
| Sécuriser le SI | MFA généralisé, SOC opérationnel, GED sécurisée, conformité RGPD/ACPR/DSP2 démontrée en recette |
| Moderniser les usages | Migration Office 365 achevée, parc harmonisé (Windows 11), VOIP unifié |
| Maîtriser les coûts | Investissement (≈ 4,8 M€) et fonctionnement récurrent (≈ 1,5 M€/an) représentant ≈ 11 % du budget annuel disponible |
| Accompagner le changement | Plan de formation exécuté, référents pilotes désignés dans chaque service |

## Perspectives

Conformément à l'article 3.1 du cahier des charges, MOM-TECH poursuit dans le cadre du
[contrat de maintenance](contrat-maintenance.md) une **veille technologique continue** en matière
d'infrastructure, d'intelligence artificielle et de cybersécurité, avec deux axes prioritaires identifiés
pour les prochaines évolutions :

- l'extension des capacités de détection par IA du SOC à la **lutte anti-fraude** sur les transactions
  KHS-Core (au-delà du seul périmètre de sécurité SI), en s'appuyant sur les données déjà collectées
  par Sentinel ;
- l'évaluation d'une architecture **cloud souverain** pour les données les plus sensibles, à mesure que
  l'offre française/européenne se consolide, en cohérence avec les exigences de souveraineté
  numérique croissantes dans le secteur bancaire.

Cette démarche d'amélioration continue s'inscrit directement dans le principe directeur ITIL v4 retenu
dès le lancement du projet (cf. [démarche ITIL](../03-gestion-de-projet/demarche-itil.md)) : le projet ne
se referme pas sur la recette, mais ouvre un cycle de maintien en conditions opérationnelles et
d'évolution continue du système d'information de KHS Bank.
