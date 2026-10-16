# GED sécurisée — KHS Bank (démonstration du Lot F)

Application de démonstration exécutable du **Lot F — Audit de sécurité et GED sécurisée**
(Gestion Électronique de Documents sécurisée) du dossier de mise en situation. Elle reproduit,
avec des outils open-source (Next.js + Supabase/PostgreSQL) déployables gratuitement, les
mécanismes de sécurité décrits dans le Lot F :

| Lot F (dossier papier, SharePoint/Purview) | Cette démonstration (Supabase/PostgreSQL) |
|---|---|
| Classification public interne / restreint / confidentiel | Colonne `classification` + policies RLS |
| RBAC (rédacteur, validateur, administrateur, auditeur) | Colonne `role` + policies RLS par rôle |
| Workflow dépôt → vérification → validation → publication | Fonction `transition_statut_document` (transactionnelle) |
| Journal d'audit immuable (Microsoft Purview Audit) | Table `audit_log` + déclencheur PostgreSQL interdisant toute modification/suppression |
| DLP, étiquettes de sensibilité automatiques, Entra PIM | **Non reproduits** — spécifiques à Microsoft 365/Purview, hors périmètre d'une démonstration de code |

RLS = *Row Level Security* (sécurité au niveau ligne) : chaque requête SQL est automatiquement
filtrée par PostgreSQL selon des règles ("policies") attachées à la table, qu'elle soit émise par
l'application ou par n'importe quel autre client — c'est la base de données elle-même qui porte la
sécurité, pas seulement le code de l'application.

## Pile technique

- **Next.js** (framework React, App Router) + TypeScript — hébergé sur **Vercel**.
- **Supabase** : base **PostgreSQL** managée, **Supabase Auth** (authentification), **Supabase
  Storage** (fichiers), toutes sécurisées par RLS.
- **Tailwind CSS** pour la mise en forme.

Aucun accès direct à Vercel ou Supabase n'étant disponible depuis l'environnement ayant généré ce
code, la création des ressources cloud ci-dessous est **à faire manuellement**, une seule fois.

## 1. Créer le projet Supabase

1. Créer un compte sur [supabase.com](https://supabase.com) puis un nouveau projet (région Europe
   recommandée pour la conformité RGPD).
2. Dans **Project Settings → API**, récupérer `Project URL` et la clé `anon public`.
3. Dans **SQL Editor**, exécuter dans l'ordre tous les fichiers de
   [`supabase/migrations/`](supabase/migrations/) (`0001_init.sql` puis les suivants, jusqu'à
   `0008_messagerie_interne.sql`). Chacun crée ses tables, ses `GRANT` explicites et ses policies RLS ;
   `0001_init.sql` pose les bases (documents, audit, rôles) et `0008_messagerie_interne.sql` ajoute la
   messagerie interne (§6 ci-dessous).
4. (Optionnel, pour simplifier la démonstration) Dans **Authentication → Providers → Email**,
   désactiver « Confirm email » pour pouvoir se connecter immédiatement après l'inscription, sans
   boîte mail à vérifier.

### Créer le premier compte Administrateur

Tout nouveau compte est créé avec le rôle `lecteur` par défaut (principe du moindre privilège), et
seul un administrateur peut promouvoir un autre utilisateur (fonction `changer_role_utilisateur`).
Pour amorcer le tout premier compte administrateur :

1. Créer un compte normalement depuis la page `/login` de l'application (bouton « Créer un
   compte »).
2. Dans Supabase, **Table Editor → profiles**, repérer la ligne correspondante et modifier
   manuellement `role` en `administrateur` (ou, en **SQL Editor** :
   `update public.profiles set role = 'administrateur' where id = '<uuid_de_l_utilisateur>';`).
3. Se reconnecter : ce compte peut désormais attribuer tous les rôles depuis la page
   « Utilisateurs » de l'application.

## 2. Lancer en local

```bash
cd platform
npm install
cp .env.local.example .env.local   # puis renseigner NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

L'application est alors disponible sur http://localhost:3000.

## 3. Déployer sur Vercel

```bash
npm install -g vercel   # si la CLI (interface en ligne de commande) n'est pas déjà installée
cd platform
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

Ou, de façon équivalente sans CLI : importer le dépôt GitHub dans le tableau de bord Vercel, définir
`Root Directory` sur `platform`, puis renseigner les deux mêmes variables d'environnement dans
**Project Settings → Environment Variables** avant de déployer.

## 4. Scénario de démonstration (parcours de test)

1. Créer deux rédacteurs dans des départements différents (ex. « Conformité » et « Crédit »), un
   validateur dans « Conformité », un auditeur, et promouvoir soi-même en administrateur (§1).
2. Rédacteur « Conformité » dépose un document classé **confidentiel** → visible uniquement par
   lui-même, le validateur de son département, l'administrateur et l'auditeur (vérifiable en se
   connectant avec le rédacteur « Crédit », qui ne doit rien voir).
3. Rédacteur soumet le document (« Déposer pour vérification ») → statut `en_verification`.
4. Validateur « Conformité » le voit apparaître, le **valide**, puis le **publie**.
5. Une fois publié, un document **restreint** devient visible à tout le département « Conformité »
   (mais pas « Crédit ») ; un document **public interne** devient visible à tous les départements.
6. Le **journal d'audit** (`/audit`) trace chaque dépôt, validation, rejet et publication, et
   l'administrateur ne peut ni le modifier ni le supprimer (à tester directement en SQL Editor : une
   tentative d'`UPDATE`/`DELETE` sur `audit_log` échoue toujours, même avec la clé `service_role`).

## 5. Points de sécurité à souligner lors de la soutenance

- **Aucune logique d'autorisation dans le code applicatif** : la liste de documents (`/documents`)
  exécute toujours la même requête `select * from documents`, et c'est PostgreSQL qui renvoie un
  résultat différent selon le rôle connecté — même un accès direct à l'API Supabase (hors de
  l'application) resterait soumis aux mêmes règles.
- **GRANT explicites** : conformément au changement Supabase du 30 octobre (plus d'exposition
  automatique des tables à l'API de données), chaque table du schéma `public` déclare ses propres
  `GRANT`, au minimum nécessaire (jamais de `DELETE` sur `documents`/`audit_log`, par exemple).
- **Défense en profondeur** sur le workflow : les transitions de statut passent par la fonction
  `transition_statut_document`, qui vérifie la légalité métier de la transition, mais reste exécutée
  avec les droits de l'utilisateur appelant (`SECURITY INVOKER`) — les policies RLS s'appliquent donc
  aussi à elle, pas seulement au code applicatif.
- **Immuabilité du journal d'audit** garantie par un déclencheur PostgreSQL `BEFORE UPDATE OR DELETE`
  qui refuse systématiquement, y compris pour une clé de service qui contournerait RLS.
- **Fichiers** : chaque téléchargement passe par une URL signée à durée de vie limitée (5 minutes),
  jamais par une URL publique permanente.

## 6. Messagerie interne

Fonctionnalité ajoutée (`/messagerie`), construite en deux passes à partir de deux notes
d'inspiration différentes :

1. **`0008_messagerie_interne.sql`** — d'après la note « La messagerie interne » de l'Espace Agents
   de la Cour suprême du Cameroun : conversations privées, groupes de travail (60 agents au plus),
   canaux officiels, mention « Urgent », correction des messages pendant 15 minutes, archivage,
   confidentialité stricte.
2. **`0010_messagerie_fonctionnalites_avancees.sql`** — d'après une note décrivant la messagerie
   d'un autre site (équipe interne séparée des visiteurs via une table `equipe_membres`, pages
   `/equipe/...`) : accusés de lecture façon WhatsApp, présence, transfert, sourdine, recherche et
   filtres, analyse antivirus des pièces jointes, alertes e-mail en quasi temps réel, rétention à 3
   ans, panneau Détails.

Dans les deux cas, la hiérarchie d'autorisation et l'architecture des comptes sont **adaptées** au
RBAC plat de KHS Bank plutôt que recopiées telles quelles — KHS Bank n'a pas de table de membres
d'équipe séparée (tous les comptes `profiles` sont déjà des agents internes) ni de pages `/equipe/...`
(on reste sur `/messagerie` et `/admin/utilisateurs`). Correspondance retenue pour la hiérarchie à 4
niveaux de la seconde note :

| Niveau de la note source | Rôle KHS Bank |
|---|---|
| 1 Direction | `administrateur` (écrit à tous) |
| 2 Responsable de service | `validateur` (écrit à tous) |
| 3 Collaborateur | `redacteur` (tous sauf `administrateur`) |
| 4 Stagiaire | `lecteur` (son département, hors `administrateur`) |
| — | `auditeur` : propre au RBAC documentaire KHS Bank (Lot F), reste à part — jamais initiateur, répond seulement aux conversations où il est invité |

Le détail de chaque adaptation est commenté en tête des fichiers de migration correspondants.

### Mise en service

1. Exécuter dans l'ordre `0008_messagerie_interne.sql`,
   `0009_correctif_recursion_participants.sql` (corrige une récursion RLS infinie sur
   `conversation_participants`, constatée à l'usage réel) puis
   `0010_messagerie_fonctionnalites_avancees.sql`. La première crée les tables, le bucket de
   stockage `messagerie-pieces-jointes`, le canal « Toute la banque » et un canal par département
   (peuplés automatiquement selon le `departement`/`role` de chaque profil — aucune liste à tenir à
   jour) ; la troisième ajoute la hiérarchie à 4 niveaux, les accusés de lecture, la présence, le
   transfert, la sourdine et porte la rétention par défaut à 3 ans.
2. Pour le **temps réel** (nouveaux messages et accusés de lecture affichés sans recharger la
   page), vérifier dans **Database → Replication** que les tables `messages` et `message_statuts`
   sont bien dans la publication `supabase_realtime` (les migrations le font déjà via
   `alter publication`, cette étape sert juste à le confirmer visuellement si besoin).
3. Pour la **purge automatique** (nuit à 3h30, cf. `vercel.json`) et les **alertes par courriel**
   (envoyées à l'envoi de chaque message, cf. ci-dessous), renseigner dans Vercel
   `SUPABASE_SERVICE_ROLE_KEY` — seule façon de lire l'adresse e-mail d'un destinataire
   (`auth.admin.getUserById`) — et `CRON_SECRET` pour la route de purge (cf. `.env.local.example`).
4. Les alertes par courriel elles-mêmes nécessitent en plus `RESEND_API_KEY`, `RESEND_FROM_EMAIL` et
   `NEXT_PUBLIC_SITE_URL` (compte gratuit sur [resend.com](https://resend.com)) : **aucun
   fournisseur de courriel n'est branché par défaut** dans cet environnement de démonstration — sans
   ces variables, l'envoi de messages continue de fonctionner mais aucun courriel n'est réellement
   envoyé. Limitation assumée, à annoncer en soutenance comme les autres simplifications du projet.
5. Optionnel : `CLOUDMERSIVE_API_KEY` (offre gratuite, 800 analyses/mois sur
   [cloudmersive.com](https://cloudmersive.com)) ajoute une seconde couche d'analyse antivirus des
   pièces jointes, en plus des contrôles intégrés (toujours actifs, cf. ci-dessous).

### Accusés de lecture, présence et antivirus — comment ça marche concrètement

- **Coches façon WhatsApp** (✓ envoyé, ✓✓ grises = reçu, ✓✓ bleues = lu) : une ligne
  `message_statuts` par (message, destinataire) est semée automatiquement à l'envoi (déclencheur
  PostgreSQL). « Reçu » est marqué par une écoute Supabase Realtime **globale**, montée une seule
  fois pour toute la session (`PresenceMessagerie.tsx`, dans `NavBar`) — pas seulement dans la
  conversation ouverte ; RLS s'applique au flux Realtime exactement comme à une requête normale,
  cet abonnement sans filtre ne reçoit donc que les messages des conversations dont l'agent est déjà
  participant. « Lu » est marqué quand la conversation est affichée et l'onglet visible
  (`document.visibilityState === "visible"`). Une relecture de secours toutes les 4 secondes
  complète l'abonnement Realtime dans le fil de discussion, au cas où un évènement serait manqué.
- **Présence** : le même composant signale toutes les 30 secondes (`profiles.derniere_activite_at`)
  tant que l'onglet est visible — sert à la fois au statut « reçu » (approché) et à la règle
  « hors ligne depuis plus de 2 minutes » des alertes e-mail.
- **Antivirus** (`lib/messagerie/antivirus.ts`) : contrôles intégrés toujours actifs (type réel du
  fichier comparé au type déclaré via les octets de signature, exécutables cachés même sous une
  extension trompeuse, macro Office détectée dans un fichier `.docx`/`.xlsx`/`.pptx`, JavaScript
  détecté dans un PDF), puis Cloudmersive Virus Scan API en complément si la clé est configurée.
  Ce ne sont pas des signatures virales complètes : les contrôles intégrés sont ciblés, pas un
  moteur antivirus généraliste.

### Simplifications assumées (à annoncer en soutenance)

- **Hiérarchie à 4 niveaux sans équivalent exact pour `lecteur`/`redacteur`** : la note source
  distingue Collaborateur/Stagiaire par fonction réelle dans l'entreprise, KHS Bank les distingue
  par rôle RBAC documentaire (Lot F) — rapprochement raisonnable mais pas une correspondance
  métier garantie à 100 %.
- **Transfert de message limité au texte** : les pièces jointes ne sont pas reprises (aurait
  demandé de dupliquer l'objet dans Supabase Storage vers un nouveau chemin, hors scope de cette
  version).
- **Ajout de participants à un groupe uniquement à sa création**, pas d'ajout a posteriori.
- **Présence approchée par heartbeat** (30 s), pas une vraie détection de déconnexion instantanée
  (WebSocket `presence` de Supabase Realtime aurait été plus précis, mais plus complexe à mettre en
  cohérence avec la règle simple « hors ligne depuis plus de 2 minutes »).
- **Recherche de conversations côté client** (texte déjà chargé), pas une recherche plein texte
  côté base — suffisant au volume d'une démonstration, pas forcément au-delà.
