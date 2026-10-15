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

Fonctionnalité ajoutée (`/messagerie`), inspirée de la note « La messagerie interne » de l'Espace
Agents de la Cour suprême du Cameroun (conversations privées, groupes de travail de 60 agents au
plus, canaux officiels, mention « Urgent », correction des messages pendant 15 minutes, archivage,
confidentialité stricte, rétention réglable de 1 à 20 ans). La hiérarchie d'autorisation du document
source (organigramme judiciaire : Premier Président, Procureur Général, présidents de chambre…) est
en revanche **adaptée** au RBAC plat de KHS Bank (`lecteur`/`redacteur`/`validateur`/`administrateur`/
`auditeur`) plutôt que recopiée telle quelle — le détail de l'adaptation est commenté en tête de
[`supabase/migrations/0008_messagerie_interne.sql`](supabase/migrations/0008_messagerie_interne.sql).

### Mise en service

1. Exécuter `0008_messagerie_interne.sql` (cf. §1) : il crée les tables, le bucket de stockage
   `messagerie-pieces-jointes`, le canal « Toute la banque » et un canal par département (peuplés
   automatiquement selon le `departement`/`role` de chaque profil — aucune liste à tenir à jour).
2. Pour le **temps réel** (nouveaux messages affichés sans recharger la page), vérifier dans
   **Database → Replication** que la table `messages` est bien dans la publication
   `supabase_realtime` (la migration le fait déjà via `alter publication`, cette étape sert juste à
   le confirmer visuellement si besoin).
3. Pour la **purge automatique** (messages plus vieux que la durée de conservation réglée par un
   administrateur) et les **alertes par courriel** (agent non connecté ayant un message non lu),
   renseigner dans Vercel les variables `SUPABASE_SERVICE_ROLE_KEY` et `CRON_SECRET` (cf.
   `.env.local.example`) — `vercel.json` déclenche alors `/api/cron/messagerie` toutes les 15
   minutes.
4. Les alertes par courriel elles-mêmes nécessitent en plus `RESEND_API_KEY` et `RESEND_FROM_EMAIL`
   (compte gratuit sur [resend.com](https://resend.com)) : **aucun fournisseur de courriel n'est
   branché par défaut** dans cet environnement de démonstration — sans ces deux variables, la purge
   de rétention continue de fonctionner mais aucun courriel n'est réellement envoyé. Limitation
   assumée, à annoncer en soutenance comme les autres simplifications du projet.

### Simplifications assumées par rapport au document source (à annoncer en soutenance)

- **Pas d'escalade hiérarchique entre lecteur/rédacteur/validateur** : KHS Bank n'a pas
  d'organigramme à niveaux comparable à celui d'une juridiction pour sa messagerie interne — seul
  l'**auditeur** reprend la règle à l'identique (il n'ouvre jamais de conversation, il répond
  seulement à celles où il est invité), parce que KHS Bank a justement déjà un rôle de ce nom dans
  son RBAC documentaire (Lot F).
- **Pas d'analyse antivirus réelle** des pièces jointes : la colonne `statut_analyse` existe
  (`non_analyse`/`propre`/`infecte`) pour qu'un déploiement réel y branche un webhook de scan, mais
  aucun moteur antivirus n'est disponible dans cet environnement — elle n'est donc volontairement
  pas vérifiée par les policies RLS, pour ne pas bloquer la fonctionnalité sans scanner réel.
- **Ajout de participants à un groupe uniquement à sa création**, pas d'ajout a posteriori dans
  cette première version.
- **Accusés de lecture par message** (qui a lu la dernière annonce d'un canal) non repris dans
  l'interface — seul le compteur global de messages non lus (pastille rouge) l'est.
