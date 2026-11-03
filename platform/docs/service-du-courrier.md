# Service du courrier — arrivée, départ, conservation

Module repris de la « Chancellerie numérique » du Ministère de la Justice et adapté à la plateforme
de l'Agence de Promotion des Investissements du Cameroun (organisation `API`). Il gère le
**courrier physique** : l'enregistrement des plis reçus, leur numérisation, leur remise, les lettres
qui partent, et la durée pendant laquelle on les conserve.

Il est **désactivé par défaut** : seul un déploiement qui définit `NEXT_PUBLIC_ORG_COURRIER=true`
affiche le menu « Courrier ». Il fonctionne pour l'**API** et pour **KHS Bank** : les deux organisations
partagent le code et la base, mais chacune a ses propres registres, sa numérotation, ses rôles de courrier
et ses catégories de conservation, sans rien voir de l'autre.

## 1. Les rôles

| Rôle | Qui | Ce qu'il peut faire |
|---|---|---|
| **Agent du courrier** | désigné par un administrateur | enregistrer un pli, le numériser, déclarer la remise, enregistrer un départ, exporter les registres |
| **Chef du courrier** | désigné par un administrateur | en plus : corriger et annuler (avec motif), geler la conservation, valider les destructions |
| **Destinataire** | l'agent nommé sur le pli | accuser réception, marquer traité, classer |
| **Validateur du département** | responsable du département destinataire | voit le courrier ordinaire du département, accuse réception, impute à un agent de son département |

La désignation se fait dans **Utilisateurs → colonne « Service du courrier »**. Un administrateur
ne peut pas se désigner lui-même, et ne lit pas le courrier des autres (sauf s'il en est destinataire
ou membre du service). Un pli **personnel** n'a jamais d'objet, n'est jamais numérisé, et n'est lisible
que de son destinataire (le service du courrier ne voit que l'enveloppe).

## 2. Parcours

**Arrivée** — Enregistrement (numéro `ARR-AAAA-NNNNNN`, récépissé PDF) → numérisation (PDF, ou photos
d'un téléphone assemblées en un PDF dans le navigateur) → remise déclarée → accusé de réception du
destinataire (ou décharge papier) → imputation, traité, classé. Chaque scan est archivé avec son
empreinte SHA-256.

**Départ** — Deux entrées : l'agent clique sur **« Transmettre au service du courrier »** depuis un
document validé ou publié (la lettre signée, ou le PDF du document, est jointe automatiquement, sauf
document confidentiel), ou le service enregistre directement une lettre signée sur papier. Le service
accepte (numéro `DEP-AAAA-NNNNNN`) ou renvoie avec un motif, imprime le bordereau d'envoi, marque
l'expédition, puis enregistre la **décharge** de chaque destinataire. Une relance est signalée si la
décharge tarde (15 jours par défaut).

**Décharge** — l'accusé de réception d'un destinataire ne se valide plus d'un simple clic : il se prouve.
Sur la ligne du destinataire, « Enregistrer la décharge » demande, en une seule opération :
le **fichier** de la décharge (PDF du scanner, ou photos de téléphone assemblées en un PDF) ;
la **date et l'heure réelles de remise** (pas avant l'expédition, pas dans le futur) ;
le **nom** (obligatoire) et la **qualité** de la personne qui a signé ; le **mode de remise**.
Le fichier est contrôlé comme tout scan, son empreinte SHA-256 est calculée côté serveur et il est archivé
comme pièce « Décharge ». Une seule décharge par destinataire, un seul fichier par décharge.
**Exception** : le **chef du courrier** peut accuser « sans décharge », avec un motif de 10 caractères au
moins, qui reste visible dans le dossier et dans le journal. Un agent du courrier n'y a pas accès. Les accusés
enregistrés avant cette obligation restent valides (« Accusé enregistré avant l'obligation de décharge »).
Le récépissé d'envoi PDF et l'export Excel du registre des départs indiquent la preuve de chaque réception.

**Conservation** — Chaque élément appartient à une catégorie (durée, sort final). Le système
**propose** les éléments échus ; le **chef du courrier valide**, avec la référence de la décision.
Détruire = supprimer les scans ; la ligne du registre est conservée sans limite. Un élément **gelé**
(enquête, contentieux, audit) n'est jamais proposé. Aucune destruction automatique.

Les catégories de départ de l'Agence (à faire valider avec le service des archives, elles se changent
dans la table `categories_conservation` sans toucher au code) :

| Catégorie | Durée | Sort final |
|---|---|---|
| Correspondance courante | 5 ans | destruction des scans sur validation |
| Actes, décisions et courrier engageant l'Agence | 10 ans | versement aux archives |
| Dossiers d'investisseurs et d'agrément | 10 ans | versement aux archives |
| Pièces confidentielles | fixée pièce par pièce | versement aux archives |

## 3. Sécurité

- Toutes les écritures passent par des fonctions de la base (`security definer`) ; aucune écriture
  directe sur les tables du courrier.
- Isolation par organisation (`mon_organisation()`), double authentification exigée (policies
  restrictives de la migration 0027), archive privée `courrier` (PDF seulement, un scan déposé n'est ni
  modifiable ni supprimable avant destruction validée).
- Le journal d'audit ne contient que des identifiants et des actions, jamais le texte d'un courrier.
- Les messages d'erreur passent dans l'adresse sous forme de clés, jamais de texte libre.
- Contrôles internes des PDF déposés (signature `%PDF-`, JavaScript, lancement de programme, fichier
  embarqué) ; aucun fichier n'est envoyé à un tiers.

## 4. Mise en service

1. Dans Supabase (**SQL Editor**), exécuter **une seule fois, dans l'ordre**, après la migration 0028 :
   `0029_courrier_arrivee.sql`, `0030_courrier_depart.sql`, `0031_courrier_conservation.sql`
   `0032_courrier_categories_khs.sql` (catégories de conservation de KHS Bank)
   et `0033_courrier_decharge_depart.sql` (décharge de réception des départs).
2. Dans le projet Vercel de chaque organisation qui l'utilise (API, KHS Bank) :
   `NEXT_PUBLIC_ORG_COURRIER=true`, puis redéployer.
3. **Utilisateurs** : donner « Agent du courrier » aux agents du service, « Chef du courrier » à son responsable.
4. Essayer avec deux comptes : enregistrer un pli pour un département, numériser, déclarer la remise,
   accuser réception avec le validateur du département, exporter le registre.

Catégories de départ de KHS Bank (propositions, à faire valider par la conformité) : correspondance courante
(5 ans, destruction), contrats et décisions (10 ans, versement), dossiers de clients et de crédit (10 ans,
versement), pièces confidentielles (durée fixée pièce par pièce).

Pour une troisième organisation : ajouter ses catégories dans `categories_conservation` (une ligne par
catégorie, avec son sigle), comme le fait la migration 0032.

## 5. Tests réalisés

- **Base de données** : 169 contrôles pour l'API (dont 22 sur la décharge) et 15 pour KHS (numérotation indépendante, cloisonnement,
  catégories propres) sur un PostgreSQL jetable (désignation, numérotation, cloisonnement
  entre organisations, plis personnels, archive, imputation, correction, annulation, registres, départ,
  conservation, gel, destruction, double authentification).
- **Navigateur** : parcours complet en 42 vérifications (enregistrement, numérisation, remise, accusé,
  imputation, départ, bordereau, exports PDF et Excel, conservation, cloisonnement, mobile, anglais).

## 6. Limites connues

- Pas d'antivirus extérieur : les contrôles sont internes.
- Un département n'existe que s'il est porté par au moins un agent (il n'y a pas d'organigramme).
- La lettre jointe à une demande d'expédition est la version signée si elle existe, sinon le PDF du
  document ; un document confidentiel n'est jamais joint.
- Une décharge par destinataire : pas de dépôt groupé. L'accusé électronique automatique (quand le destinataire
  utilise aussi la plateforme) n'est pas prévu : sa valeur juridique reste à confirmer.
- Pas de page publique de suivi, pas de relance automatique par e-mail, pas de reconnaissance du texte
  des scans (OCR).
- Les durées de conservation sont des propositions, pas des règles légales.
