-- ============================================================================
-- GED sécurisée (Gestion Électronique de Documents sécurisée) — KHS Bank
-- Démonstration exécutable du Lot F du dossier : classification des documents,
-- RBAC (Role-Based Access Control / contrôle d'accès basé sur les rôles),
-- workflow de validation (dépôt → vérification → validation → publication)
-- et journal d'audit immuable, intégralement portés par des policies RLS
-- (Row Level Security / sécurité au niveau ligne) PostgreSQL.
--
-- Règle de ce projet : toute migration qui crée une table doit, dans le même
-- fichier, (1) déclarer ses GRANT explicites et (2) ses policies RLS — depuis
-- le changement Supabase du 30 octobre, une table du schéma public n'est plus
-- exposée automatiquement à l'API de données (PostgREST) : sans GRANT, la
-- table est invisible depuis l'application même si RLS l'autoriserait.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. Types énumérés
-- ----------------------------------------------------------------------------

create type public.role_utilisateur as enum (
  'lecteur',         -- Lecteur : consultation des documents publiés uniquement
  'redacteur',       -- Rédacteur : dépôt et modification de ses propres documents
  'validateur',      -- Validateur : vérification, validation et publication
  'administrateur',  -- Administrateur : accès complet, gestion des comptes
  'auditeur'         -- Auditeur : lecture complète, y compris le journal d'audit
);

create type public.classification_document as enum (
  'public_interne',  -- Public interne : visible par tout le personnel une fois publié
  'restreint',       -- Restreint : visible par le même département une fois publié
  'confidentiel'     -- Confidentiel : visible par le validateur du département concerné,
                      -- l'administrateur et l'auditeur, jamais par simple lecture publique
);

create type public.statut_document as enum (
  'brouillon',        -- Brouillon : en cours de rédaction, visible par son seul auteur (dépôt à venir)
  'en_verification',  -- En vérification : déposé, en attente de vérification/validation
  'valide',           -- Validé : vérifié et validé, en attente de publication
  'rejete',           -- Rejeté : refusé par le validateur, renvoyé au rédacteur pour correction
  'publie'            -- Publié : visible selon la classification et le département
);

-- ----------------------------------------------------------------------------
-- 2. Table des profils (rôle RBAC + département, base de toutes les policies)
-- ----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nom_complet text not null,
  departement text not null default 'Direction',
  role public.role_utilisateur not null default 'lecteur',
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Profil métier (rôle RBAC, département) associé à chaque compte Supabase Auth. '
  'Toutes les policies RLS du schéma lisent cette table pour décider des accès.';

alter table public.profiles enable row level security;

-- GRANT explicite : lecture ouverte à tout utilisateur authentifié (nécessaire
-- pour afficher les noms/rôles dans l'interface), écriture restreinte aux
-- colonnes non sensibles (le rôle ne peut jamais être modifié par son titulaire).
grant select on public.profiles to authenticated;
grant update (nom_complet, departement) on public.profiles to authenticated;

create policy "profils_lecture_utilisateurs_authentifies"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profils_maj_propre_profil"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Peuplement automatique du profil à la création du compte. Rôle de départ :
-- "lecteur" (principe du moindre privilège) ; promotion ultérieure uniquement
-- par un administrateur via la fonction changer_role_utilisateur (cf. fin de fichier).
create function public.gerer_nouvel_utilisateur()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nom_complet, departement)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nom_complet', new.email),
    coalesce(new.raw_user_meta_data ->> 'departement', 'Direction')
  );
  return new;
end;
$$;

create trigger declencheur_nouvel_utilisateur
  after insert on auth.users
  for each row execute function public.gerer_nouvel_utilisateur();

-- ----------------------------------------------------------------------------
-- 3. Table des documents
-- ----------------------------------------------------------------------------

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text,
  classification public.classification_document not null,
  statut public.statut_document not null default 'brouillon',
  departement text not null,
  storage_path text,
  owner_id uuid not null references public.profiles (id),
  validated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.documents is
  'Documents KHS Bank classifiés (public interne / restreint / confidentiel), '
  'suivant le workflow dépôt → vérification → validation → publication du Lot F.';

create index idx_documents_owner on public.documents (owner_id);
create index idx_documents_statut on public.documents (statut);
create index idx_documents_departement on public.documents (departement);

alter table public.documents enable row level security;

-- Aucun GRANT DELETE : un document n'est jamais supprimé (traçabilité), au
-- pire corrigé puis redéposé. C'est une garantie au niveau du privilège
-- PostgreSQL, en plus (et indépendamment) des policies RLS ci-dessous.
grant select, insert, update on public.documents to authenticated;

-- Fonction de visibilité, réutilisée par la policy SELECT de "documents" et
-- par les policies de stockage (storage.objects) plus bas : un seul endroit
-- où la règle de classification/RBAC est écrite, pour éviter toute incohérence.
create function public.peut_lire_document(d public.documents)
returns boolean
language sql
security invoker
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        -- le propriétaire voit toujours son propre document, quel qu'en soit le statut
        d.owner_id = auth.uid()
        -- administrateur et auditeur voient tout, sans restriction de classification
        or p.role in ('administrateur', 'auditeur')
        -- une fois publié, la visibilité dépend de la classification
        or (
          d.statut = 'publie' and (
            d.classification = 'public_interne'
            or (d.classification = 'restreint' and p.departement = d.departement)
            or (d.classification = 'confidentiel' and p.role = 'validateur' and p.departement = d.departement)
          )
        )
        -- le validateur du département voit aussi les documents qu'il doit vérifier/valider
        or (d.statut = 'en_verification' and p.role = 'validateur' and p.departement = d.departement)
      )
  );
$$;

create policy "lecture_documents_selon_classification_et_role"
  on public.documents for select
  to authenticated
  using (public.peut_lire_document(documents));

-- Dépôt initial : seul un rédacteur (ou un administrateur) peut créer un
-- document, et uniquement à l'état "brouillon" en tant que propriétaire.
create policy "depot_document_par_redacteur"
  on public.documents for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and statut = 'brouillon'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('redacteur', 'administrateur')
    )
  );

-- Modification de contenu (titre/description/fichier) par son auteur, tant que
-- le document n'est pas encore entré dans le circuit de validation.
create policy "proprietaire_modifie_brouillon_ou_rejete"
  on public.documents for update
  to authenticated
  using (owner_id = auth.uid() and statut in ('brouillon', 'rejete'))
  with check (owner_id = auth.uid());

-- Transitions de workflow (vérification, validation, publication) par le
-- validateur du département ou un administrateur. La légalité exacte de
-- chaque transition (quel nouveau statut est permis depuis quel ancien
-- statut) est, elle, garantie de façon atomique par la fonction
-- transition_statut_document ci-dessous : cette policy ne fait qu'autoriser
-- le bon rôle à toucher la bonne ligne, en défense en profondeur.
create policy "validateur_traite_verification_et_publication"
  on public.documents for update
  to authenticated
  using (
    statut in ('en_verification', 'valide')
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.role = 'administrateur' or (p.role = 'validateur' and p.departement = documents.departement))
    )
  )
  with check (true);

-- ----------------------------------------------------------------------------
-- 4. Journal d'audit (immuable)
-- ----------------------------------------------------------------------------

create table public.audit_log (
  id bigint generated always as identity primary key,
  document_id uuid references public.documents (id) on delete set null,
  acteur_id uuid not null references public.profiles (id),
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_log is
  'Journal d''audit immuable : consultable par les auditeurs et administrateurs, '
  'alimenté uniquement par les fonctions de workflow, jamais modifiable après écriture.';

create index idx_audit_log_document on public.audit_log (document_id);

alter table public.audit_log enable row level security;

-- Aucun GRANT UPDATE/DELETE : seule l'INSERT est possible via l'API.
grant select, insert on public.audit_log to authenticated;

create policy "insertion_audit_par_son_auteur"
  on public.audit_log for insert
  to authenticated
  with check (acteur_id = auth.uid());

create policy "lecture_audit_selon_role_ou_propriete"
  on public.audit_log for select
  to authenticated
  using (
    acteur_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('administrateur', 'auditeur'))
    or exists (select 1 from public.documents d where d.id = audit_log.document_id and d.owner_id = auth.uid())
  );

-- Immuabilité forte : même le rôle service_role (qui contourne RLS) ne peut
-- pas altérer ou effacer une entrée du journal, car un trigger BEFORE
-- s'applique indépendamment de RLS et refuse systématiquement l'opération.
create function public.interdire_modification_audit()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Le journal d''audit est immuable : modification ou suppression interdite.';
end;
$$;

create trigger declencheur_audit_immuable
  before update or delete on public.audit_log
  for each row execute function public.interdire_modification_audit();

-- ----------------------------------------------------------------------------
-- 5. Stockage des fichiers (Supabase Storage)
-- ----------------------------------------------------------------------------
-- Convention de chemin : "<document_id>/<nom_du_fichier>" — permet de relier
-- chaque fichier déposé à sa ligne "documents" et de réutiliser exactement
-- la même règle de visibilité (peut_lire_document) que pour les métadonnées.

insert into storage.buckets (id, name, public)
values ('documents-ged', 'documents-ged', false)
on conflict (id) do nothing;

create policy "lecture_fichiers_selon_document"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents-ged'
    and exists (
      select 1 from public.documents d
      where d.id::text = split_part(storage.objects.name, '/', 1)
        and public.peut_lire_document(d)
    )
  );

create policy "depot_fichier_par_proprietaire_en_brouillon"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents-ged'
    and exists (
      select 1 from public.documents d
      where d.id::text = split_part(storage.objects.name, '/', 1)
        and d.owner_id = auth.uid()
        and d.statut = 'brouillon'
    )
  );

-- ----------------------------------------------------------------------------
-- 6. Fonctions de workflow (transactionnelles, journalisées)
-- ----------------------------------------------------------------------------

-- Fait progresser un document dans le workflow dépôt → vérification →
-- validation → publication, en une seule transaction : mise à jour du statut
-- ET écriture de l'entrée d'audit correspondante sont garanties atomiques.
-- SECURITY INVOKER (et non DEFINER) : la fonction s'exécute avec les droits
-- de l'utilisateur appelant, donc les policies RLS ci-dessus s'appliquent
-- aussi à ses propres UPDATE/INSERT — elle ajoute une vérification métier
-- précise de la transition, mais ne remplace jamais la sécurité portée par RLS.
create function public.transition_statut_document(
  p_document_id uuid,
  p_nouveau_statut public.statut_document,
  p_commentaire text default null
)
returns public.documents
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_doc public.documents;
  v_role public.role_utilisateur;
  v_departement text;
  v_transition_valide boolean := false;
begin
  select role, departement into v_role, v_departement
  from public.profiles where id = auth.uid();

  if v_role is null then
    raise exception 'Profil introuvable pour l''utilisateur courant.';
  end if;

  select * into v_doc from public.documents where id = p_document_id;
  if v_doc.id is null then
    raise exception 'Document introuvable (ou accès refusé par la policy RLS).';
  end if;

  if v_doc.statut in ('brouillon', 'rejete')
     and p_nouveau_statut = 'en_verification'
     and v_doc.owner_id = auth.uid() then
    v_transition_valide := true;  -- dépôt (ou nouveau dépôt après rejet)
  elsif v_doc.statut = 'en_verification'
        and p_nouveau_statut in ('valide', 'rejete')
        and (v_role = 'administrateur' or (v_role = 'validateur' and v_departement = v_doc.departement)) then
    v_transition_valide := true;  -- vérification + validation (ou rejet motivé)
  elsif v_doc.statut = 'valide'
        and p_nouveau_statut = 'publie'
        and (v_role = 'administrateur' or (v_role = 'validateur' and v_departement = v_doc.departement)) then
    v_transition_valide := true;  -- publication
  end if;

  if not v_transition_valide then
    raise exception 'Transition de "%" vers "%" non autorisée pour le rôle "%".',
      v_doc.statut, p_nouveau_statut, v_role;
  end if;

  update public.documents
    set statut = p_nouveau_statut,
        validated_by = case when p_nouveau_statut in ('valide', 'rejete') then auth.uid() else validated_by end,
        updated_at = now()
    where id = p_document_id
    returning * into v_doc;

  insert into public.audit_log (document_id, acteur_id, action, details)
    values (
      p_document_id, auth.uid(), 'transition_statut',
      jsonb_build_object('nouveau_statut', p_nouveau_statut, 'commentaire', p_commentaire)
    );

  return v_doc;
end;
$$;

grant execute on function public.transition_statut_document(uuid, public.statut_document, text) to authenticated;

-- Changement de rôle RBAC, réservé à l'administrateur. SECURITY DEFINER ici
-- car la cible n'est pas l'appelant lui-même (la policy "profils_maj_propre_profil"
-- ne l'aurait pas autorisé) ; la vérification du rôle de l'appelant est donc
-- refaite explicitement en premier, et search_path est figé pour éviter tout
-- détournement de la fonction par substitution de schéma.
create function public.changer_role_utilisateur(
  p_utilisateur_id uuid,
  p_nouveau_role public.role_utilisateur
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appelant_role public.role_utilisateur;
  v_profil public.profiles;
begin
  select role into v_appelant_role from public.profiles where id = auth.uid();

  if v_appelant_role is distinct from 'administrateur' then
    raise exception 'Seul un administrateur peut modifier le rôle d''un utilisateur.';
  end if;

  update public.profiles set role = p_nouveau_role
    where id = p_utilisateur_id
    returning * into v_profil;

  insert into public.audit_log (document_id, acteur_id, action, details)
    values (
      null, auth.uid(), 'changement_role',
      jsonb_build_object('utilisateur_cible', p_utilisateur_id, 'nouveau_role', p_nouveau_role)
    );

  return v_profil;
end;
$$;

grant execute on function public.changer_role_utilisateur(uuid, public.role_utilisateur) to authenticated;
