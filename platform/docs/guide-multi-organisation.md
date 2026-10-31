# Une plateforme, plusieurs organisations — guide de mise en place

Comment KHS Bank et l'Agence de Promotion des Investissements (API) tournent
sur **le même code** et **la même base Supabase**, tout en restant totalement
cloisonnées. Le guide est écrit pour être refait dans un autre projet.

---

## 1. Le principe en une image

```
                 ┌────────────── Dépôt Git (un seul code) ──────────────┐
                 │                                                       │
     Projet Vercel « KHS »                              Projet Vercel « API »
     NEXT_PUBLIC_ORG_SIGLE=KHS                          NEXT_PUBLIC_ORG_SIGLE=API
     couleurs, logo, nom KHS                            couleurs, logo, nom API
     site public : désactivé                            site public : activé
                 │                                                       │
                 └──────────────► UN SEUL projet Supabase ◄──────────────┘
                                  (Auth, base, Storage)
                                  colonne « organisation » + RLS
```

Trois règles font tout fonctionner :

1. **Le code ne contient aucune marque en dur.** Tout ce qui change d'une
   organisation à l'autre (nom, sigle, logo, couleurs, options) est lu dans des
   variables d'environnement. Chaque projet Vercel a les siennes.
2. **Chaque ligne sensible de la base porte une colonne `organisation`.** Sa
   valeur n'est **jamais** fournie par le navigateur : elle est posée par un
   trigger, à partir du profil de l'utilisateur.
3. **Les policies RLS comparent cette colonne à l'organisation de
   l'utilisateur connecté.** Même avec la clé publique et une requête
   trafiquée, un agent API ne peut ni lire ni écrire une donnée KHS.

Résultat : un correctif poussé sur `main` est déployé automatiquement sur les
deux sites, une seule migration SQL met à jour les deux, et une seule facture
Supabase.

---

## 2. Côté base de données (Supabase)

### 2.1 La colonne `organisation`

Sur chaque table « racine » (celles qui appartiennent à une organisation) :

```sql
alter table public.profiles      add column if not exists organisation text not null default 'KHS';
alter table public.documents     add column if not exists organisation text not null default 'KHS';
alter table public.conversations add column if not exists organisation text not null default 'KHS';
alter table public.audit_log     add column if not exists organisation text not null default 'KHS';

create index if not exists idx_documents_organisation on public.documents (organisation);
```

- Texte libre court (`'KHS'`, `'API'`…) : ajouter une organisation ne demande
  **aucune migration**, pas de table `organisations` à maintenir.
- Le `default 'KHS'` rattache automatiquement les données qui existaient avant
  le passage en multi‑organisation. Dans un nouveau projet, mettez le sigle de
  la première organisation.

Tables concernées dans ce projet : `profiles`, `documents`, `conversations`,
`audit_log`, `parametres_messagerie`, `actualites_publiques`,
`messages_contact`, `document_partages`, `compteurs_references`,
`parametres_archivage`, `departements_noms_en`, `modeles_documents`, et les
tables de signature (titulaires, délégations, compteurs, signatures).

Les tables « enfants » (versions d'un document, commentaires, pièces jointes,
participants d'une conversation…) **n'ont pas besoin** de la colonne : leurs
policies passent par le parent (`document_id` → `documents.organisation`).

### 2.2 La fonction `mon_organisation()`

```sql
create function public.mon_organisation()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select organisation from public.profiles where id = auth.uid();
$$;

grant execute on function public.mon_organisation() to authenticated;
```

`security definer` est indispensable : sans lui, la fonction serait soumise à
la policy de `profiles`, qui appelle elle‑même `mon_organisation()` → récursion
infinie.

### 2.3 Les triggers qui « tamponnent » l'organisation

Le client n'envoie jamais l'organisation ; un trigger `BEFORE INSERT` l'écrase
avec celle du propriétaire :

```sql
create function public.tamponner_organisation_document()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.organisation := (select organisation from public.profiles where id = new.owner_id);
  return new;
end;
$$;

create trigger declencheur_organisation_document
  before insert on public.documents
  for each row execute function public.tamponner_organisation_document();
```

Même modèle pour `conversations` (créateur), `audit_log` (acteur, ou document
concerné), etc. Sur les tables où une ligne peut être modifiée, un trigger
`BEFORE UPDATE` remet l'ancienne valeur (`new.organisation := old.organisation;`)
pour qu'on ne puisse pas « déménager » une donnée vers une autre organisation
(ou, plus simple, on n'accorde pas le droit `update` sur cette colonne).

### 2.4 L'inscription : d'où vient l'organisation d'un nouveau compte ?

Supabase Auth est partagé. C'est donc **le site sur lequel la personne
s'inscrit** qui décide de son organisation, via les métadonnées d'inscription :

```ts
// src/app/login/actions.ts
await supabase.auth.signUp({
  email, password,
  options: {
    data: { nom_complet, departement, organisation: SIGLE_ORGANISATION },
    emailRedirectTo: `${await origineDuSite()}/auth/callback`,
  },
});
```

Puis le trigger de création de profil la recopie :

```sql
insert into public.profiles (id, nom_complet, departement, organisation)
values (
  new.id,
  new.raw_user_meta_data ->> 'nom_complet',
  new.raw_user_meta_data ->> 'departement',
  coalesce(new.raw_user_meta_data ->> 'organisation', 'KHS')
);
```

Ensuite, **seul le profil fait foi** : l'utilisateur ne peut pas modifier sa
colonne `organisation` (droits de colonne : seuls `nom_complet` et
`departement` sont modifiables, `grant update (nom_complet, departement) on
public.profiles to authenticated`), et les rôles ne peuvent être changés que par un administrateur
**de la même organisation** (contrôle dans les fonctions `changer_role…`).

### 2.5 Les policies RLS

Le motif de base :

```sql
-- Un agent ne voit que les profils de sa propre organisation
create policy "profils_meme_organisation" on public.profiles
  for select to authenticated
  using (organisation = public.mon_organisation());
```

Pour les documents, la condition d'organisation s'**ajoute** aux règles
existantes (rôle, département, statut) — elle ne les remplace pas :

```sql
-- extrait de peut_lire_document()
... and p.organisation = d.organisation
```

Règle d'or : chaque fonction `security definer` qui agit sur une ligne
(partager, archiver, signer, changer un rôle…) vérifie explicitement
`v_doc.organisation = v_moi.organisation`, car `security definer` contourne la
RLS.

### 2.6 Données par organisation vs données communes

| Besoin | Solution retenue |
|---|---|
| Numérotation des références (`KHS-2026-000123`, `API-2026-000045`) | `compteurs_references` avec clé primaire `(organisation, annee)` : chaque organisation a sa propre séquence |
| Réglages (durées d'archivage, messagerie…) | Table avec `organisation` en **clé primaire** : une ligne de réglages par organisation |
| Modèles de documents | `organisation` **nullable** : `null` = modèle commun aux deux, `'API'` = propre à l'API |
| Actualités et messages du site public | `organisation` obligatoire ; lecture publique filtrée, gestion réservée aux administrateurs de l'organisation |

### 2.7 Le stockage de fichiers (Storage)

Les buckets sont **partagés**. Le cloisonnement passe par le chemin du fichier :
le premier segment est l'identifiant du document, et la policy de
`storage.objects` appelle la même fonction que la table :

```sql
using (
  bucket_id = 'documents'
  and exists (
    select 1 from public.documents d
    where d.id::text = split_part(storage.objects.name, '/', 1)
      and public.peut_lire_document(d.id)   -- inclut le contrôle d'organisation
  )
)
```

Aucune policy de stockage n'a donc eu à être réécrite : elles héritent
automatiquement du contrôle d'organisation.

---

## 3. Côté application (Next.js)

### 3.1 Un seul fichier de marque : `src/lib/organisation.ts`

Toutes les valeurs visibles sont lues ici, avec des **valeurs par défaut qui
reproduisent KHS** — un déploiement sans variables ne change pas :

```ts
export const NOM_ORGANISATION   = process.env.NEXT_PUBLIC_ORG_NOM?.trim()   || "KHS Bank";
export const SIGLE_ORGANISATION = process.env.NEXT_PUBLIC_ORG_SIGLE?.trim() || "KHS";
export const URL_LOGO_ORGANISATION = process.env.NEXT_PUBLIC_ORG_LOGO_URL?.trim() || null;
export const COULEUR_PRIMAIRE = process.env.NEXT_PUBLIC_ORG_COULEUR_PRIMAIRE?.trim() || null;
export const COULEUR_ACCENT   = process.env.NEXT_PUBLIC_ORG_COULEUR_ACCENT?.trim()   || null;
export const SITE_PUBLIC_ACTIF = process.env.NEXT_PUBLIC_ORG_SITE_PUBLIC === "true";
// … nom anglais, lettre du logo, mention de connexion, ruban de couleurs
```

Ailleurs dans le code, on n'écrit **jamais** « KHS » ou « API » : on importe
ces constantes.

### 3.2 Les couleurs générées à partir de deux teintes

`src/lib/couleurs.ts` convertit une couleur primaire et une couleur d'accent en
HSL, puis calcule toute la gamme (50 → 950) utilisée par Tailwind
(`navy-*` pour les fonds, `gold-*` pour les accents). `app/layout.tsx` injecte
ces nuances en variables CSS. On ne choisit donc que **deux couleurs** par
organisation, jamais une vingtaine.

### 3.3 Les fonctionnalités activables

Une option par organisation plutôt qu'un fork du code. Exemple :
`NEXT_PUBLIC_ORG_SITE_PUBLIC=true` active le site institutionnel et le
bilinguisme pour l'API ; chez KHS, `/` redirige directement vers `/documents`.

### 3.4 Les pages publiques (non connectées)

Sans utilisateur connecté, `mon_organisation()` renvoie `null` : la RLS ne peut
pas filtrer. Les pages publiques filtrent donc explicitement par le sigle du
déploiement :

```ts
const { data } = await supabase
  .from("actualites_publiques")
  .select("…")
  .eq("organisation", SIGLE_ORGANISATION)
  .eq("publie", true);
```

Et le formulaire de contact insère `organisation: SIGLE_ORGANISATION`, pour que
le message arrive chez les administrateurs du bon site.

### 3.5 Les liens envoyés par e-mail

Supabase n'a qu'une seule « Site URL ». Si on la laissait décider, un agent API
recevrait un lien de confirmation pointant vers le site KHS. D'où
`src/lib/site.ts` :

```ts
export async function origineDuSite(): Promise<string> {
  const configuree = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configuree) return configuree;
  // à défaut : l'adresse de la requête reçue (origin / x-forwarded-host)
  …
}
```

Chaque appel qui génère un lien (`signUp`, réinitialisation du mot de passe,
alertes de messagerie, QR code de vérification des signatures) passe
`emailRedirectTo: \`${await origineDuSite()}/auth/callback\``.

**À faire dans Supabase** : *Authentication → URL Configuration → Redirect
URLs*, ajouter **les deux** adresses :

```
https://ged-khs-bank.vercel.app/**
https://api-cameroun-ged.vercel.app/**
```

Sans cela, Supabase ignore `emailRedirectTo` et renvoie vers la Site URL.

### 3.6 Les petits détails

- **MFA** : l'émetteur TOTP est `GED ${SIGLE_ORGANISATION}`, pour que
  l'application d'authentification affiche deux entrées distinctes si une même
  personne a un compte dans chaque organisation.
- **Page de vérification des signatures** (`/verifier`) : publique, elle
  affiche le nom de l'organisation lu dans la signature, pas celui du site.
- **Cron** : une seule route (`/api/cron/messagerie`) qui traite toutes les
  organisations ; elle est déclarée dans `vercel.json` et tourne sur chaque
  projet Vercel, ce qui est sans danger car le traitement est idempotent. On
  peut aussi la désactiver sur l'un des deux.

---

## 4. Côté Vercel

Deux projets Vercel importent **le même dépôt GitHub**, sur la même branche
`main`. Chaque `git push` redéploie les deux.

| Variable | KHS | API |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | même valeur | même valeur |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | même valeur | même valeur |
| `SUPABASE_SERVICE_ROLE_KEY` | même valeur (secrète) | même valeur (secrète) |
| `CRON_SECRET` | une valeur | une autre valeur |
| `NEXT_PUBLIC_SITE_URL` | `https://ged-khs-bank.vercel.app` | `https://api-cameroun-ged.vercel.app` |
| `NEXT_PUBLIC_ORG_SIGLE` | *(vide → KHS)* | `API` |
| `NEXT_PUBLIC_ORG_NOM` / `_NOM_EN` | *(vide → KHS Bank)* | nom complet FR / EN |
| `NEXT_PUBLIC_ORG_LOGO_URL` | *(vide → lettre K)* | `/logos/…png` (fichier dans `public/`) |
| `NEXT_PUBLIC_ORG_COULEUR_PRIMAIRE` / `_ACCENT` | *(vides → couleurs KHS)* | deux couleurs hex du logo |
| `NEXT_PUBLIC_ORG_COULEUR_RUBAN` | *(vide)* | `#vert,#rouge,#jaune` |
| `NEXT_PUBLIC_ORG_SITE_PUBLIC` | *(vide)* | `true` |
| `RESEND_*`, `CLOUDMERSIVE_API_KEY` | selon besoin | selon besoin |

Attention : les variables `NEXT_PUBLIC_*` sont **figées au moment du build**.
Après en avoir modifié une, il faut **redéployer** (Deployments → Redeploy).

---

## 5. Ajouter une troisième organisation — check-list

1. **Choisir un sigle** court et définitif (il apparaît dans les références de
   documents : `XYZ-2026-000001`). Ne plus jamais le changer.
2. **Vercel** : *Add New → Project*, importer le même dépôt, copier les
   variables Supabase, puis renseigner les `NEXT_PUBLIC_ORG_*` et
   `NEXT_PUBLIC_SITE_URL`.
3. **Logo** : déposer le fichier dans `public/logos/` (commit sur `main`).
4. **Supabase → Redirect URLs** : ajouter `https://nouveau-site.vercel.app/**`.
5. **Premier administrateur** : la personne s'inscrit sur le nouveau site (son
   profil reçoit automatiquement le bon sigle), puis on la promeut une fois en
   SQL :
   ```sql
   update public.profiles set role = 'administrateur'
   where id = (select id from auth.users where email = 'admin@exemple.org');
   ```
   Elle gère ensuite elle‑même les rôles de son organisation depuis l'interface.
6. **Réglages propres** (optionnel) : durées d'archivage, modèles spécifiques,
   noms anglais des départements — chacun s'enregistre avec le sigle de
   l'organisation.
7. **Test de cloisonnement** : avec un compte de chaque organisation, vérifier
   que la liste des documents, l'annuaire, la messagerie, la recherche et le
   journal d'audit ne montrent rien de l'autre.

Aucune migration SQL n'est nécessaire pour cette étape.

---

## 6. Refaire la même chose dans un autre projet — dans quel ordre

1. Centraliser la marque dans un fichier unique lu depuis l'environnement, avec
   des valeurs par défaut = l'organisation actuelle. Chasser toute mention en
   dur (`grep -ri "nom de l'organisation" src/`).
2. Écrire **une** migration : colonne `organisation` + index sur les tables
   racines, `mon_organisation()`, triggers de tampon (insert) et de verrouillage
   (update), lecture des métadonnées dans le trigger de création de profil.
3. Réécrire les policies RLS des tables racines en ajoutant la condition
   d'organisation ; relire **chaque** fonction `security definer`.
4. Passer le sigle dans les métadonnées d'inscription ; filtrer les pages
   publiques par sigle ; rendre les liens e-mail relatifs au déploiement.
5. Tester avec deux comptes (un par organisation) **en tentant de tricher** :
   requêtes directes avec la clé anon, insertion avec une organisation forgée,
   accès à un fichier Storage par son chemin. Tout doit être refusé ou corrigé
   par le trigger.
6. Créer le second projet Vercel.

---

## 7. Pièges rencontrés

- **Récursion RLS** : `mon_organisation()` doit être `security definer`, sinon
  la policy de `profiles` s'appelle elle‑même.
- **`security definer` contourne la RLS** : toute fonction de ce type doit
  refaire le contrôle d'organisation à la main.
- **Ne jamais faire confiance à une organisation envoyée par le client** : le
  trigger l'écrase systématiquement, même si le formulaire en fournit une.
  Seule exception : le formulaire de contact public (pas d'utilisateur), dont
  les messages ne sont lisibles que par les administrateurs de l'organisation
  indiquée — au pire, quelqu'un écrit au mauvais destinataire.
- **Pages publiques** : sans session, la RLS ne filtre pas par organisation ;
  le filtre `.eq("organisation", SIGLE)` est obligatoire.
- **Liens e-mail** : oublier les *Redirect URLs* dans Supabase renvoie tout le
  monde vers le même site.
- **Variables `NEXT_PUBLIC_*`** : prises en compte seulement au build suivant.
- **Contraintes d'unicité** : une contrainte `unique (reference)` ou
  `unique (code)` devient souvent `unique (organisation, code)` — sinon les
  deux organisations se bloquent mutuellement.
- **Un e-mail = un compte** : Supabase Auth étant partagé, une même adresse ne
  peut pas avoir un compte dans chaque organisation. Si ce cas existe, la
  personne utilise deux adresses (ou il faut passer à une table d'appartenance
  `profil ↔ organisation`, plus lourde).
- **Quand séparer les bases ?** Si une organisation exige une base hébergée
  ailleurs (souveraineté, contrat, volumétrie), le même code se déploie tel
  quel sur un **second projet Supabase** : il suffit de changer les variables
  `NEXT_PUBLIC_SUPABASE_*` du projet Vercel concerné et de rejouer les
  migrations. Le partage d'une base est un choix d'économie, pas une
  contrainte du code.
