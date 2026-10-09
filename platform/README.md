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
3. Dans **SQL Editor**, exécuter l'intégralité du fichier
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). Il crée les tables, les
   `GRANT` explicites, toutes les policies RLS, le bucket de stockage et les fonctions de workflow.
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
