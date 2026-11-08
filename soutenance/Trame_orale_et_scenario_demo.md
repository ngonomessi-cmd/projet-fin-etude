---
title: "Soutenance KHS Bank — Trame orale, scénario de démonstration et questions du jury"
---

# 1. Vue d'ensemble

| Partie | Durée | Diapositives |
|---|---:|---|
| Introduction et acteurs | 3 min | 1 à 4 |
| Cahier des charges | 2 min | 5 |
| Actions réalisées (gestion de projet, audit, solutions, architecture, migration) | 7 min | 6 à 9 |
| **Maquette Cisco Packet Tracer** (présentation, puis tests en direct ou captures) | **4 à 6 min** | 10 et 11 |
| Focus GED sécurisée (présentation) | 4 min | 12 à 15 |
| **Démonstration en direct de la GED** | **8 à 10 min** | 14 (support) |
| Synthèse (bilan, recette, conclusion) | 4 min | 16 à 19 |
| **Total** | **≈ 34 à 36 min** (dont 18 min de démonstrations) | |

Le plan suit celui attendu à la soutenance : entreprise et acteurs, éléments clés du cahier des charges, actions réalisées (aspects techniques et méthodologiques), synthèse et conclusion. **Adaptez les durées** à celles annoncées par votre jury. Si la présentation doit être plus courte : la démonstration de la GED se réduit à la version courte (§ 3.2) et la maquette Packet Tracer à un seul test (la bascule HSRP, PT11).

# 2. Trame orale diapositive par diapositive

Les mêmes textes figurent dans les notes du fichier PowerPoint (mode présentateur).

| N° | Message à faire passer | Phrase d'accroche |
|---:|---|---|
| 1 | Sujet, rôle, plan | « Je vais vous présenter la migration et la sécurisation du système d'information de KHS Bank, réalisées pour MOM-TECH. » |
| 2 | Annoncer le plan | « Quatre temps, puis deux démonstrations. » |
| 3 | KHS Bank : banque réglementée, SI vieillissant | « Un établissement agréé ACPR, 920 collaborateurs, deux sites, et un SI hérité de choix non harmonisés. » |
| 4 | MOM-TECH : trois pôles, équipe de 4 ingénieurs | « Notre conviction : la sécurité se pense dès la conception. » |
| 5 | Cinq objectifs, contraintes fortes, 26 semaines | « Le point dur : aucune interruption des services bancaires. » |
| 6 | Pilotage : PBS, WBS, OBS, RACI, risques, Gantt, ITIL v4 | « Six phases, du 5 janvier au 26 juin 2026. » |
| 7 | Audit : 14 constats critiques en 3 axes | « Redondance, détection et continuité, protection des données sensibles. » |
| 8 | Trois piliers pour limiter la fragmentation des éditeurs | « Moins d'éditeurs, moins de failles d'intégration. » |
| 9 | Architecture cible et migration en 7 étapes | « Coexistence progressive : zéro interruption. » |
| 10 | Maquette Packet Tracer : deux sites, HSRP, VLAN, ASA, GRE | « Pour ne pas rester sur le papier, j'ai construit l'architecture réseau dans Packet Tracer, avec le même plan d'adressage que le dossier. » |
| 11 | Tests de résilience et de sécurité ; simplifications assumées | « Je coupe le cœur actif pendant un ping continu : le second cœur prend le relais. C'est la fin du point de défaillance unique R1. » |
| 12 | Lot F : production = SharePoint + Purview ; démonstrateur libre | « Je ne peux pas montrer Purview sans tenant. J'ai donc construit un démonstrateur qui applique les mêmes règles. » |
| 13 | La sécurité est dans la base, pas dans le code | « Même si l'application avait un défaut, la base refuserait l'accès. » |
| 14 | Annonce de la démonstration | « Cinq personnages, un document confidentiel, six étapes. » |
| 15 | Courrier physique et multi-organisation | « Le courrier papier reste critique dans une banque. Une même plateforme sert deux organisations, cloisonnées par la base. » |
| 16 | ≈ 4,8 M€ d'investissement, ≈ 1,5 M€/an, ≈ 11 % du budget | « Le coût récurrent laisse de la marge sur le budget de 14 M€. » |
| 17 | Recette : tous les tests de l'extrait sont conformes | « Chaque exigence critique a un test et un résultat attendu. » |
| 18 | Objectifs atteints, perspectives | « 14 constats traités, aucune interruption. Prochaines étapes : IA anti-fraude, cloud souverain. » |
| 19 | Remerciements | « Je suis à votre disposition pour vos questions. » |

# 3. Scénario de démonstration (8 à 10 minutes)

## 3.1 Personnages et comptes à préparer

Tous les comptes sont créés à l'avance sur le site KHS Bank (page de connexion), puis leur rôle est attribué par l'administrateur. Chaque compte a enrôlé **Google Authenticator** (la double authentification est obligatoire).

| Personnage | Rôle de la plateforme | Département | Particularité |
|---|---|---|---|
| Rita, rédactrice | `redacteur` | Finance | Dépose le document |
| Victor, validateur | `validateur` | Finance | Valide, publie, archive ; peut être chef du courrier |
| Marc, Directeur Général | `administrateur` | Direction Générale | Doit **voir** le document pour le signer : d'où le rôle administrateur, ou un partage explicite |
| Camille, agent du courrier | `redacteur` + rôle courrier « agent » | Finance | Enregistre le courrier arrivé |
| Léo, lecteur | `lecteur` | Finance | Montre l'isolation |
| Aude, auditrice | `auditeur` | Audit | Consulte le journal |
| Alice, administratrice | `administrateur` | Direction | Désigne le Directeur Général |

Le rôle « chef du courrier » et « agent du courrier » se désigne depuis la page **Utilisateurs** par un administrateur.

## 3.2 Déroulé

| # | Qui | Action | Ce que le jury doit voir | Durée |
|---:|---|---|---|---:|
| 1 | Rita | Ouvrir « Mes brouillons » et la fiche du rapport de conformité (classification **confidentiel**), cliquer « Déposer pour vérification » | Le statut passe à « En vérification » ; la référence `KHS-2026-…` est attribuée par la base | 1 min |
| 2 | Léo | Ouvrir la liste des documents, puis tenter d'ouvrir l'adresse de la fiche | Liste sans le document ; la fiche répond « introuvable » : la base, pas l'interface, refuse | 1 min |
| 3 | Victor | Saisir un commentaire, « Valider », puis « Publier » | Le circuit exige le validateur du département | 1 min |
| 4 | Marc | Page **Signatures** (spécimen déjà enregistré), puis fiche du document : saisir le code Authenticator, « Signer le document » | Le PDF signé porte un bloc de signature et un QR code ; un **nouveau** code TOTP est exigé | 2 min |
| 5 | Un tiers (téléphone, sans compte) | Scanner le QR / ouvrir `/verifier`, puis déposer le fichier | « Signature authentique » ; fichier identique reconnu ; le titre du document n'est pas divulgué | 1 min |
| 6 | Victor | « Archiver », confirmer | Empreinte SHA-256 scellée ; plus aucune modification possible, même pour un administrateur | 1 min |
| 7 | Camille | **Courrier → Nouveau** : saisir expéditeur, référence, objet ; numériser ; « Déclarer la remise » | Numéro `ARR-2026-…`, récépissé PDF, empreinte du scan | 1,5 min |
| 8 | Aude | **Audit** | Chaque étape est inscrite ; aucune action de suppression n'existe | 1 min |
| 9 | (Optionnel, en commentaire) | Montrer le code du déclencheur d'immutabilité, ou citer le test qui refuse `DELETE` | Le journal est protégé, **y compris pour la clé de service** | 0,5 min |

**Version courte (5 min)** : étapes 1, 2, 4, 5 et 8.

## 3.3 Points de vigilance (testés lors de la préparation)

- Un document **confidentiel** n'est visible, une fois publié, que de son propriétaire, du validateur du département, de l'administrateur et de l'auditeur. C'est le comportement attendu : il explique pourquoi le Directeur Général doit être administrateur ou destinataire d'un partage.
- Un **brouillon** n'apparaît pas dans l'onglet « En vigueur » : il faut ouvrir « Mes brouillons ».
- Le code TOTP change toutes les 30 secondes : ne pas lancer la saisie dans les 3 dernières secondes.
- **Ne jamais montrer la clé de service Supabase** ni les variables d'environnement Vercel à l'écran.

## 3.4 Plan B

- Avoir **trois sessions de navigateur déjà connectées** (profils différents) pour éviter les reconnexions et les codes TOTP.
- Préparer une **vidéo ou des captures** de chaque étape, au cas où la connexion Internet serait instable (partage de connexion du téléphone en secours).
- Avoir sous la main le PDF signé et son code de vérification.

## 3.5 Démonstration de la maquette Packet Tracer (4 à 6 minutes)

Ouvrir le fichier `.pkt` avant la soutenance, tous les équipements démarrés, une console de poste déjà ouverte.

| # | Action | Ce que le jury doit voir |
|---:|---|---|
| 1 | Sur PC-BUR-PARIS-1 : `ping -t 10.10.0.1`, puis `show standby brief` sur CORE-PARIS-SW1 | Le cœur 1 est **Active**, le cœur 2 **Standby** |
| 2 | Éteindre CORE-PARIS-SW1 | Quelques paquets perdus, puis le ping reprend : CORE-PARIS-SW2 devient actif (PT11) |
| 3 | Depuis PC-BANCAIRE-PARIS-1 : `ping 203.0.113.10` | Internet reste joignable (PT12) |
| 4 | Depuis LAPTOP-WIFI-PARIS-1 : `ping 10.10.0.10` puis `ping 203.0.113.10` | Le LAN est refusé, Internet répond (PT04, PT05) |
| 5 | Depuis PC-BUR-PARIS-1 : `ping` vers PC-BUR-LYON-1 | Réponse via le tunnel GRE (PT07) |

Rallumer le cœur 1 en fin de test (la préemption lui rend le rôle actif). **Préparez des captures de ces cinq étapes** : les résultats réels de votre maquette font foi, vérifiez-les la veille.

# 4. Check-list de la veille

0. Ouvrir la maquette Packet Tracer et dérouler les cinq tests du § 3.5 ; enregistrer le fichier `.pkt` en deux exemplaires.
1. Ouvrir le site KHS Bank et se connecter avec chaque compte (téléphone Authenticator prêt).
2. Vérifier que les migrations **0029 à 0033** ont été exécutées sur la base Supabase partagée.
3. Vérifier la **variable `SUPABASE_SERVICE_ROLE_KEY`** dans le projet Vercel de KHS Bank : l'analyse des erreurs d'exécution montre que la tâche de purge nocturne de la messagerie échoue avec « supabaseKey is required » depuis le 25 octobre. Sans cette clé, la purge et les alertes e-mail de la messagerie ne fonctionnent pas (le reste de l'application n'est pas touché). La clé est à copier depuis Supabase (Project Settings → API), jamais à coller dans le chat.
4. Déroulement complet du scénario, une fois, à blanc.
5. Charger le diaporama sur deux supports (clé USB et nuage), exporter un PDF de secours.
6. Imprimer les notes si l'ordinateur de présentation n'affiche pas le mode présentateur.

# 5. Questions probables du jury et éléments de réponse

**1. Pourquoi ne pas avoir utilisé uniquement SharePoint et Purview ?**
C'est bien la cible de production, incluse dans Microsoft 365 E5 (Lot C). Elle n'est pas démontrable sans tenant et sans licences. Le démonstrateur prouve que les règles décrites au Lot F (classification, rôles, circuit, audit immuable, MFA) sont réalisables et testables, avec des outils libres.

**2. Qu'est-ce qui n'est pas reproduit ?**
Le DLP automatique, les étiquettes de sensibilité posées par détection de contenu et Entra PIM. La classification est posée par l'agent et appliquée par la base. C'est une limite assumée et documentée.

**3. Pourquoi mettre la sécurité dans la base plutôt que dans l'application ?**
Parce qu'un défaut applicatif (oubli d'un contrôle, nouvelle route) ne doit pas ouvrir de données. Avec la sécurité au niveau ligne (RLS), PostgreSQL filtre chaque requête, même un appel direct à l'API.

**4. Peut-on contourner la double authentification ?**
Pas par l'API : une règle restrictive sur chaque table exige le niveau d'assurance `aal2`, atteint seulement après validation du code TOTP. Sans cela, aucune table n'est lisible.

**5. Que se passe-t-il si un administrateur veut effacer une trace ?**
Impossible : un déclencheur refuse toute modification ou suppression du journal d'audit, y compris avec la clé de service.

**6. Comment prouvez-vous qu'un document signé est authentique ?**
Le PDF porte un code unique et un QR. La page publique `/verifier` compare le code ou l'empreinte du fichier déposé avec le registre de signatures ; elle ne divulgue pas le contenu.

**7. Comment gérez-vous le RGPD ?**
Minimisation (rôle `lecteur` par défaut), cloisonnement par département et par organisation, durées de conservation par nature de document, journal d'accès, aucune destruction automatique du courrier, fichiers servis par URL signées de 5 minutes. L'hébergement actuel est cloud ; le rapatriement vers une infrastructure maîtrisée est une évolution prévue.

**8. Que se passe-t-il si Supabase ou Vercel est indisponible ?**
Le démonstrateur n'a pas vocation à porter la continuité bancaire. En production, la continuité est assurée par les Lots A et G (HA, PRA/PCA, RPO/RTO). La base PostgreSQL est exportable et réinstallable ailleurs.

**9. Comment avez-vous testé ?**
Rejeu des 33 migrations sur base vierge ; tests SQL (169 sur le courrier de l'Agence, 15 sur celui de KHS, circuit documentaire, visibilité, signature, archivage) ; parcours automatisé dans un navigateur (42 contrôles) ; compilation de production ; audit des dépendances et mise à niveau de Next.js vers la version corrigée (16.4.5).

**10. Quelles vulnérabilités restent ?**
Deux avis sur des dépendances transitives : `image-size` (via la génération PowerPoint, qui ne traite que le logo PNG/JPEG de l'organisation) et `uuid` (via la bibliothèque Excel, cas non utilisé). Non exploitables dans cet usage ; à surveiller.

**11. Pourquoi deux organisations sur la même base ?**
Pour montrer la réutilisabilité : le cloisonnement est garanti par la colonne `organisation`, posée par la base, jamais par le navigateur. Une adresse e-mail correspond à un seul compte : c'est une limite connue.

**12. Quel est le lien avec le référentiel de compétences ?**
C11 (points de vulnérabilité), C12 (scénarios d'attaque testés : falsification, accès direct sans second facteur, modification du journal), C16 (MFA et chaînes d'authentification), C17 (protection des données au repos et en transit, archivage), C18 (classification et besoins de protection).

**13. Pourquoi ne pas avoir mis de cluster sur le pare-feu dans la maquette ?**
Simplification assumée : la licence de l'ASA 5505 n'autorise que deux VLAN actifs et Packet Tracer ne simule pas le cluster du FortiGate. La redondance de la maquette porte sur le cœur (HSRP) et sur le raccordement des deux cœurs au pare-feu. Le cluster HA reste décrit au Lot A du dossier.

**14. Pourquoi un tunnel GRE et pas IPsec ?**
GRE est entièrement supporté par Packet Tracer et représente la liaison inter-site. L'ajout d'IPsec par-dessus (GRE over IPsec) est documenté en option dans les configurations des routeurs ; le VPN IPsec redondant sur deux FAI est prévu dans le dossier réel.

**15. Quel lien entre la maquette et le dossier ?**
Le plan VLAN et VLSM est identique, les constats R1 (cœur unique), R3 (VPN) et R5 (segmentation) sont traités, et les tests de la maquette complètent le cahier de recette.
