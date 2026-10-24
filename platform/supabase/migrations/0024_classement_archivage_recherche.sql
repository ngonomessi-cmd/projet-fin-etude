-- ============================================================================
-- Classement, archivage réglementé et recherche documentaire.
--
-- Règles (validées avec le porteur du projet) :
--   - Chaque document reçoit une RÉFÉRENCE unique, attribuée par la base
--     (ex. API-2026-000123) : jamais saisie ni modifiable.
--   - Chaque document porte une NATURE (note de service, courrier, contrat…)
--     qui fixe sa durée de conservation une fois archivé.
--   - Un BROUILLON (jamais soumis) est privé : seuls son auteur et les
--     personnes avec qui il l'a partagé le voient — y compris face à
--     l'administrateur et à l'auditeur.
--   - ARCHIVAGE : uniquement un document publié, par le validateur de son
--     département ou un administrateur (jamais par l'auteur seul), ou
--     automatiquement N mois après la publication (12 par défaut, réglable,
--     0 = désactivé).
--   - Un document archivé est en LECTURE SEULE DÉFINITIVE : la base refuse
--     toute modification et toute suppression, quel que soit le rôle (même
--     service_role, le contrôle étant un déclencheur et non une policy).
--     Son empreinte SHA-256 est scellée à l'archivage (preuve d'intégrité).
--   - Pour corriger un document publié ou archivé : NOUVELLE VERSION, copie
--     en brouillon liée à l'original (v2, v3…).
--   - RECHERCHE plein texte (titre, référence, description, texte du
--     contenu), exécutée avec les droits de l'appelant : elle ne renvoie que
--     ce qu'il a le droit de lire.
--   - Tout est inscrit au journal d'audit.
--   - Correctif : le validateur voit de nouveau les documents validés et
--     rejetés de son département et peut valider (régression de la 0018).
--
-- À exécuter après la migration 0023.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Nouvelles colonnes
-- ----------------------------------------------------------------------------
alter table public.documents
  add column if not exists reference text,
  add column if not exists nature text,
  add column if not exists version integer not null default 1,
  add column if not exists version_precedente_id uuid references public.documents (id),
  add column if not exists publie_le timestamptz,
  add column if not exists archive_le timestamptz,
  add column if not exists archive_par uuid references public.profiles (id),
  add column if not exists archive_auto boolean not null default false,
  add column if not exists empreinte_sha256 text,
  add column if not exists fin_conservation date;

alter table public.documents drop constraint if exists ck_documents_nature;
alter table public.documents add constraint ck_documents_nature check (
  nature is null or nature in (
    'note_service', 'courrier', 'compte_rendu', 'rapport', 'decision', 'contrat',
    'piece_comptable', 'procedure', 'ressources_humaines', 'presentation', 'autre'
  )
);

-- Durée de conservation par défaut (en années, 0 = conservation permanente).
-- Repères : OHADA (pièces comptables 10 ans), usages courants de l'archivage
-- administratif. Chaque organisation peut les ajuster (section 6).
create or replace function public.duree_conservation_defaut(p_nature text)
returns integer
language sql
immutable
as $$
  select case coalesce(p_nature, 'autre')
    when 'note_service' then 5
    when 'courrier' then 5
    when 'compte_rendu' then 10
    when 'rapport' then 10
    when 'decision' then 0
    when 'contrat' then 10
    when 'piece_comptable' then 10
    when 'procedure' then 10
    when 'ressources_humaines' then 30
    when 'presentation' then 3
    else 5
  end;
$$;

-- ----------------------------------------------------------------------------
-- 2. Références uniques : <ORGANISATION>-<ANNÉE>-<NUMÉRO SUR 6 CHIFFRES>
-- ----------------------------------------------------------------------------
create table if not exists public.compteurs_references (
  organisation text not null,
  annee integer not null,
  dernier integer not null default 0,
  primary key (organisation, annee)
);
alter table public.compteurs_references enable row level security;
-- Aucun accès direct : seuls les déclencheurs (SECURITY DEFINER) y écrivent.
revoke all on public.compteurs_references from anon, authenticated;

-- Rattrapage des documents existants, dans l'ordre de création.
with numerotes as (
  select id,
    upper(organisation) || '-' || extract(year from created_at)::int || '-' ||
      lpad(row_number() over (partition by organisation, extract(year from created_at) order by created_at, id)::text, 6, '0') as ref
  from public.documents
  where reference is null
)
update public.documents d set reference = n.ref from numerotes n where n.id = d.id;

insert into public.compteurs_references (organisation, annee, dernier)
  select upper(organisation), extract(year from created_at)::int, count(*)
  from public.documents
  group by 1, 2
on conflict (organisation, annee) do update set dernier = greatest(public.compteurs_references.dernier, excluded.dernier);

alter table public.documents alter column reference set not null;
create unique index if not exists ux_documents_reference on public.documents (reference);

-- Date de publication des documents déjà publiés : reprise du journal
-- d'audit, à défaut la dernière mise à jour.
update public.documents d
  set publie_le = coalesce(
    (select max(a.created_at) from public.audit_log a
      where a.document_id = d.id and a.action = 'transition_statut' and a.details->>'nouveau_statut' = 'publie'),
    d.updated_at)
  where d.statut = 'publie' and d.publie_le is null;

create index if not exists idx_documents_publie_le on public.documents (publie_le);
create index if not exists idx_documents_archive_le on public.documents (archive_le);
create index if not exists idx_documents_version_precedente on public.documents (version_precedente_id);

-- ----------------------------------------------------------------------------
-- 3. Protections posées par la base (déclencheurs, donc valables pour tous)
-- ----------------------------------------------------------------------------

-- À la création : référence attribuée par la base ; version, archivage et
-- date de publication jamais fournis par le client.
create or replace function public.preparer_nouveau_document()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org text;
  v_annee integer := extract(year from now())::int;
  v_numero integer;
begin
  v_org := upper(coalesce((select organisation from public.profiles where id = new.owner_id), new.organisation, 'KHS'));
  insert into public.compteurs_references (organisation, annee, dernier)
    values (v_org, v_annee, 1)
    on conflict (organisation, annee) do update set dernier = public.compteurs_references.dernier + 1
    returning dernier into v_numero;
  new.reference := v_org || '-' || v_annee || '-' || lpad(v_numero::text, 6, '0');

  if coalesce(current_setting('ged.nouvelle_version', true), '') <> 'on' then
    new.version := 1;
    new.version_precedente_id := null;
  end if;
  new.publie_le := null;
  new.archive_le := null;
  new.archive_par := null;
  new.archive_auto := false;
  new.empreinte_sha256 := null;
  new.fin_conservation := null;
  return new;
end;
$$;

drop trigger if exists declencheur_preparer_nouveau_document on public.documents;
create trigger declencheur_preparer_nouveau_document
  before insert on public.documents
  for each row execute function public.preparer_nouveau_document();

-- À chaque modification : un document archivé est intouchable ; l'identité
-- (référence, version) ne change jamais ; la date de publication est posée
-- par la base au passage à "publié" ; les champs d'archivage ne sont
-- écrits que par la fonction d'archivage.
create or replace function public.proteger_document()
returns trigger
language plpgsql
as $$
begin
  if old.archive_le is not null then
    raise exception 'Document archivé (%) : lecture seule définitive.', old.reference
      using errcode = 'P0001';
  end if;

  new.reference := old.reference;
  new.organisation := old.organisation;
  new.version := old.version;
  new.version_precedente_id := old.version_precedente_id;
  new.created_at := old.created_at;

  if new.statut = 'publie' and old.statut <> 'publie' then
    new.publie_le := now();
  else
    new.publie_le := old.publie_le;
  end if;

  if coalesce(current_setting('ged.archivage', true), '') <> 'on' then
    new.archive_le := old.archive_le;
    new.archive_par := old.archive_par;
    new.archive_auto := old.archive_auto;
    new.empreinte_sha256 := old.empreinte_sha256;
    new.fin_conservation := old.fin_conservation;
  end if;
  return new;
end;
$$;

drop trigger if exists declencheur_proteger_document on public.documents;
create trigger declencheur_proteger_document
  before update on public.documents
  for each row execute function public.proteger_document();

create or replace function public.interdire_suppression_archive()
returns trigger
language plpgsql
as $$
begin
  if old.archive_le is not null then
    raise exception 'Document archivé (%) : suppression interdite.', old.reference;
  end if;
  return old;
end;
$$;

drop trigger if exists declencheur_interdire_suppression_archive on public.documents;
create trigger declencheur_interdire_suppression_archive
  before delete on public.documents
  for each row execute function public.interdire_suppression_archive();

-- ----------------------------------------------------------------------------
-- 4. Visibilité : brouillons privés
--    Règle 0023 inchangée, sauf que l'administrateur et l'auditeur ne voient
--    plus les brouillons des autres (espace de travail personnel), tant
--    qu'ils ne leur ont pas été partagés.
-- ----------------------------------------------------------------------------
create or replace function public.peut_lire_document(d public.documents)
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
      and p.organisation = d.organisation
      and (
        d.owner_id = auth.uid()
        or (p.role in ('administrateur', 'auditeur') and d.statut <> 'brouillon')
        or (
          d.statut = 'publie' and (
            d.classification = 'public_interne'
            or (d.classification = 'restreint' and p.departement = d.departement)
            or (d.classification = 'confidentiel' and p.role = 'validateur' and p.departement = d.departement)
          )
        )
        or (d.statut in ('en_verification', 'valide', 'rejete') and p.role = 'validateur' and p.departement = d.departement)
        or public.partage_avec_moi(d.id, false)
      )
  );
$$;

-- Correctif : la migration 0018 avait recréé cette fonction en SECURITY
-- INVOKER, annulant la migration 0004 — le validateur ne pouvait plus faire
-- passer un document de "en vérification" à "validé" (la ligne modifiée
-- sortait de sa visibilité). La fonction vérifie elle-même rôle,
-- département, organisation et transition autorisée.
alter function public.transition_statut_document(uuid, public.statut_document, text) security definer;

-- ----------------------------------------------------------------------------
-- 5. Recherche plein texte
-- ----------------------------------------------------------------------------

-- Minuscules sans accents : "Réunion" et "reunion" se retrouvent.
create or replace function public.normaliser_recherche(p_texte text)
returns text
language sql
immutable
as $$
  select translate(lower(coalesce(p_texte, '')),
    'àâäáãåçéèêëíìîïñóòôöõúùûüýÿ',
    'aaaaaaceeeeiiiinooooouuuuyy');
$$;

-- Texte lisible d'un contenu rédigé dans la plateforme (texte, tableur ou
-- présentation), sans les clés techniques de structure.
create or replace function public.texte_contenu(p_contenu jsonb)
returns text
language plpgsql
immutable
as $$
declare
  v_resultat text := '';
  v_cle text;
  v_valeur jsonb;
begin
  if p_contenu is null then
    return '';
  end if;
  case jsonb_typeof(p_contenu)
    when 'string' then
      return p_contenu #>> '{}';
    when 'array' then
      for v_valeur in select value from jsonb_array_elements(p_contenu) loop
        v_resultat := v_resultat || ' ' || public.texte_contenu(v_valeur);
      end loop;
    when 'object' then
      for v_cle, v_valeur in select key, value from jsonb_each(p_contenu) loop
        if v_cle not in ('type', 'attrs', 'marks', 'disposition', 'gras', 'largeurs') then
          v_resultat := v_resultat || ' ' || public.texte_contenu(v_valeur);
        end if;
      end loop;
    else
      return '';
  end case;
  return v_resultat;
end;
$$;

alter table public.documents drop column if exists recherche;
alter table public.documents add column recherche tsvector generated always as (
  setweight(to_tsvector('french'::regconfig, public.normaliser_recherche(coalesce(reference, '') || ' ' || coalesce(titre, ''))), 'A')
  || setweight(to_tsvector('french'::regconfig, public.normaliser_recherche(coalesce(description, ''))), 'B')
  || setweight(to_tsvector('french'::regconfig, public.normaliser_recherche(left(public.texte_contenu(contenu), 200000))), 'C')
) stored;

create index if not exists idx_documents_recherche on public.documents using gin (recherche);

-- SECURITY INVOKER : la policy RLS de lecture des documents s'applique telle
-- quelle — la recherche ne peut jamais révéler un document illisible.
create or replace function public.rechercher_documents(
  p_texte text default null,
  p_departement text default null,
  p_nature text default null,
  p_statut text default null,
  p_auteur uuid default null,
  p_du date default null,
  p_au date default null,
  p_format text default null,
  p_limite integer default 100
)
returns table (
  id uuid,
  reference text,
  titre text,
  description text,
  classification public.classification_document,
  statut public.statut_document,
  departement text,
  nature text,
  format_atelier text,
  owner_id uuid,
  auteur text,
  version integer,
  created_at timestamptz,
  updated_at timestamptz,
  publie_le timestamptz,
  archive_le timestamptz,
  rang real,
  extrait text
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_mots text;
  v_requete tsquery;
  v_requete_extrait tsquery;
  v_brut text := nullif(trim(coalesce(p_texte, '')), '');
begin
  if v_brut is not null then
    select string_agg(m || ':*', ' & ') into v_mots
      from regexp_split_to_table(public.normaliser_recherche(v_brut), '[^a-z0-9]+') m
      where m <> '';
    if v_mots is not null then
      v_requete := to_tsquery('french', v_mots);
      if numnode(v_requete) = 0 then
        v_requete := null;
      end if;
    end if;
    -- Pour surligner l'extrait dans le texte d'origine (accents compris).
    select string_agg(m || ':*', ' | ') into v_mots
      from regexp_split_to_table(lower(v_brut), '[^[:alnum:]]+') m
      where m <> '';
    if v_mots is not null then
      v_requete_extrait := to_tsquery('french', v_mots);
    end if;
  end if;

  return query
    select d.id, d.reference, d.titre, d.description, d.classification, d.statut, d.departement,
      d.nature, d.format_atelier, d.owner_id, p.nom_complet, d.version, d.created_at, d.updated_at,
      d.publie_le, d.archive_le,
      case when v_requete is null then 0::real else ts_rank(d.recherche, v_requete) end,
      case
        when v_brut is null or v_requete_extrait is null then null
        else ts_headline('french',
          left(coalesce(d.description, '') || ' ' || public.texte_contenu(d.contenu), 20000),
          v_requete_extrait,
          'StartSel=⟦, StopSel=⟧, MaxWords=28, MinWords=12, MaxFragments=1')
      end
    from public.documents d
    left join public.profiles p on p.id = d.owner_id
    where (
        v_brut is null
        or (v_requete is not null and d.recherche @@ v_requete)
        or d.reference ilike '%' || v_brut || '%'
        or public.normaliser_recherche(d.titre) like '%' || public.normaliser_recherche(v_brut) || '%'
      )
      and (p_departement is null or d.departement = p_departement)
      and (p_nature is null or coalesce(d.nature, 'autre') = p_nature)
      and (p_auteur is null or d.owner_id = p_auteur)
      and (p_format is null
        or (p_format = 'fichier' and d.format_atelier is null)
        or d.format_atelier = p_format)
      and (p_statut is null
        or (p_statut = 'archive' and d.archive_le is not null)
        or (p_statut = 'publie' and d.statut = 'publie' and d.archive_le is null)
        or (p_statut not in ('archive', 'publie') and d.statut::text = p_statut))
      and (p_du is null or coalesce(d.publie_le, d.created_at)::date >= p_du)
      and (p_au is null or coalesce(d.publie_le, d.created_at)::date <= p_au)
    order by 17 desc, d.updated_at desc
    limit least(greatest(coalesce(p_limite, 100), 1), 300);
end;
$$;
grant execute on function public.rechercher_documents(text, text, text, text, uuid, date, date, text, integer) to authenticated;

-- ----------------------------------------------------------------------------
-- 6. Paramètres d'archivage par organisation
-- ----------------------------------------------------------------------------
create table if not exists public.parametres_archivage (
  organisation text primary key,
  delai_archivage_mois integer not null default 12 check (delai_archivage_mois between 0 and 120),
  durees_conservation jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);
alter table public.parametres_archivage enable row level security;
grant select on public.parametres_archivage to authenticated;

drop policy if exists "parametres_archivage_lecture" on public.parametres_archivage;
create policy "parametres_archivage_lecture"
  on public.parametres_archivage for select
  to authenticated
  using (organisation = public.mon_organisation());

create or replace function public.duree_conservation(p_organisation text, p_nature text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select (pa.durees_conservation ->> coalesce(p_nature, 'autre'))::integer
      from public.parametres_archivage pa where pa.organisation = p_organisation),
    public.duree_conservation_defaut(p_nature)
  );
$$;
grant execute on function public.duree_conservation(text, text) to authenticated;

create or replace function public.definir_parametres_archivage(p_delai_mois integer, p_durees jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moi public.profiles;
  v_cle text;
  v_valeur jsonb;
begin
  select * into v_moi from public.profiles where id = auth.uid();
  if v_moi.id is null or v_moi.role <> 'administrateur' then
    raise exception 'Seul un administrateur peut régler l''archivage.';
  end if;
  if p_delai_mois is null or p_delai_mois < 0 or p_delai_mois > 120 then
    raise exception 'Le délai d''archivage automatique doit être compris entre 0 et 120 mois.';
  end if;
  for v_cle, v_valeur in select key, value from jsonb_each(coalesce(p_durees, '{}'::jsonb)) loop
    if v_cle not in ('note_service', 'courrier', 'compte_rendu', 'rapport', 'decision', 'contrat',
        'piece_comptable', 'procedure', 'ressources_humaines', 'presentation', 'autre') then
      raise exception 'Nature inconnue : %.', v_cle;
    end if;
    if jsonb_typeof(v_valeur) <> 'number' or (v_valeur #>> '{}')::numeric not between 0 and 100
        or (v_valeur #>> '{}')::numeric <> trunc((v_valeur #>> '{}')::numeric) then
      raise exception 'Durée invalide pour % (nombre entier d''années entre 0 et 100).', v_cle;
    end if;
  end loop;

  insert into public.parametres_archivage (organisation, delai_archivage_mois, durees_conservation, updated_at, updated_by)
    values (v_moi.organisation, p_delai_mois, coalesce(p_durees, '{}'::jsonb), now(), v_moi.id)
    on conflict (organisation) do update
      set delai_archivage_mois = excluded.delai_archivage_mois,
          durees_conservation = excluded.durees_conservation,
          updated_at = now(),
          updated_by = v_moi.id;

  insert into public.audit_log (acteur_id, action, details)
    values (v_moi.id, 'parametres_archivage',
      jsonb_build_object('delai_archivage_mois', p_delai_mois, 'durees_conservation', p_durees));
end;
$$;
grant execute on function public.definir_parametres_archivage(integer, jsonb) to authenticated;

-- ----------------------------------------------------------------------------
-- 7. Archivage scellé
-- ----------------------------------------------------------------------------

-- Empreinte SHA-256 du document : métadonnées d'identité + contenu rédigé
-- + identifiant d'intégrité (ETag) du fichier stocké s'il y en a un.
create or replace function public.calculer_empreinte_document(p_document_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  d public.documents;
  v_etag text;
begin
  select * into d from public.documents where id = p_document_id;
  if d.id is null then
    return null;
  end if;
  if d.storage_path is not null then
    select o.metadata ->> 'eTag' into v_etag
      from storage.objects o
      where o.bucket_id = 'documents-ged' and o.name = d.storage_path;
  end if;
  return encode(sha256(convert_to(concat_ws('|',
    d.id::text, d.reference, d.titre, coalesce(d.description, ''), d.classification::text,
    d.departement, coalesce(d.nature, ''), d.version::text,
    coalesce(extract(epoch from d.publie_le)::text, ''),
    coalesce(d.contenu::text, ''), coalesce(d.storage_path, ''), coalesce(v_etag, '')
  ), 'UTF8')), 'hex');
end;
$$;
revoke execute on function public.calculer_empreinte_document(uuid) from public, anon, authenticated;

-- Fonction interne commune à l'archivage manuel et automatique.
create or replace function public.sceller_archive_document(
  p_document_id uuid,
  p_acteur uuid,
  p_automatique boolean,
  p_motif text default null
)
returns public.documents
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doc public.documents;
  v_duree integer;
  v_empreinte text;
begin
  select * into v_doc from public.documents where id = p_document_id for update;
  if v_doc.id is null then
    raise exception 'Document introuvable.';
  end if;
  if v_doc.archive_le is not null then
    raise exception 'Ce document est déjà archivé.';
  end if;
  if v_doc.statut <> 'publie' then
    raise exception 'Seul un document publié peut être archivé (validation obligatoire).';
  end if;

  v_duree := public.duree_conservation(v_doc.organisation, v_doc.nature);
  v_empreinte := public.calculer_empreinte_document(v_doc.id);

  perform set_config('ged.archivage', 'on', true);
  update public.documents
    set archive_le = now(),
        archive_par = case when p_automatique then null else p_acteur end,
        archive_auto = p_automatique,
        empreinte_sha256 = v_empreinte,
        fin_conservation = case when v_duree = 0 then null else (now() + make_interval(years => v_duree))::date end,
        verrou_par = null,
        verrou_jusqua = null
    where id = v_doc.id
    returning * into v_doc;
  perform set_config('ged.archivage', '', true);

  -- Plus aucune co-édition possible sur un document archivé.
  update public.document_partages set droit = 'lecture' where document_id = v_doc.id and droit = 'edition';

  insert into public.audit_log (document_id, acteur_id, action, details)
    values (v_doc.id, p_acteur,
      case when p_automatique then 'archivage_automatique' else 'archivage' end,
      jsonb_build_object(
        'reference', v_doc.reference,
        'empreinte_sha256', v_empreinte,
        'fin_conservation', v_doc.fin_conservation,
        'motif', nullif(trim(coalesce(p_motif, '')), '')
      ));
  return v_doc;
end;
$$;
revoke execute on function public.sceller_archive_document(uuid, uuid, boolean, text) from public, anon, authenticated;

-- Archivage manuel : validateur du département ou administrateur.
create or replace function public.archiver_document(p_document_id uuid, p_motif text default null)
returns public.documents
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moi public.profiles;
  v_doc public.documents;
begin
  select * into v_moi from public.profiles where id = auth.uid();
  select * into v_doc from public.documents where id = p_document_id;
  if v_doc.id is null or v_moi.id is null or v_doc.organisation <> v_moi.organisation then
    raise exception 'Document introuvable.';
  end if;
  if not (v_moi.role = 'administrateur' or (v_moi.role = 'validateur' and v_moi.departement = v_doc.departement)) then
    raise exception 'Seuls le validateur du département % et l''administrateur peuvent archiver ce document.', v_doc.departement;
  end if;
  return public.sceller_archive_document(p_document_id, v_moi.id, false, p_motif);
end;
$$;
grant execute on function public.archiver_document(uuid, text) to authenticated;

-- Archivage automatique (tâche planifiée nocturne, rôle service uniquement) :
-- tout document publié depuis plus de N mois (réglage de son organisation,
-- 12 par défaut, 0 = désactivé).
create or replace function public.archiver_documents_echus()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doc record;
  v_total integer := 0;
begin
  for v_doc in
    select d.id, coalesce(d.validated_by, d.owner_id) as acteur
    from public.documents d
    left join public.parametres_archivage pa on pa.organisation = d.organisation
    where d.statut = 'publie'
      and d.archive_le is null
      and d.publie_le is not null
      and coalesce(pa.delai_archivage_mois, 12) > 0
      and d.publie_le < now() - make_interval(months => coalesce(pa.delai_archivage_mois, 12))
  loop
    perform public.sceller_archive_document(v_doc.id, v_doc.acteur, true, null);
    v_total := v_total + 1;
  end loop;
  return v_total;
end;
$$;
revoke execute on function public.archiver_documents_echus() from public, anon, authenticated;
grant execute on function public.archiver_documents_echus() to service_role;

-- Contrôle d'intégrité : recalcule l'empreinte et la compare au sceau.
create or replace function public.verifier_integrite_document(p_document_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doc public.documents;
  v_actuelle text;
begin
  select * into v_doc from public.documents where id = p_document_id;
  if v_doc.id is null or not public.peut_lire_document(v_doc) then
    raise exception 'Document introuvable.';
  end if;
  if v_doc.archive_le is null then
    raise exception 'Ce document n''est pas archivé : il n''a pas encore d''empreinte scellée.';
  end if;
  v_actuelle := public.calculer_empreinte_document(p_document_id);
  insert into public.audit_log (document_id, acteur_id, action, details)
    values (v_doc.id, auth.uid(), 'controle_integrite',
      jsonb_build_object('conforme', v_actuelle = v_doc.empreinte_sha256));
  return jsonb_build_object(
    'conforme', v_actuelle = v_doc.empreinte_sha256,
    'empreinte_scellee', v_doc.empreinte_sha256,
    'empreinte_actuelle', v_actuelle
  );
end;
$$;
grant execute on function public.verifier_integrite_document(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 8. Classement (nature) et nouvelles versions
-- ----------------------------------------------------------------------------
create or replace function public.classer_document(p_document_id uuid, p_nature text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moi public.profiles;
  v_doc public.documents;
begin
  select * into v_moi from public.profiles where id = auth.uid();
  select * into v_doc from public.documents where id = p_document_id;
  if v_doc.id is null or v_moi.id is null or v_doc.organisation <> v_moi.organisation then
    raise exception 'Document introuvable.';
  end if;
  if v_doc.archive_le is not null then
    raise exception 'Document archivé : son classement ne peut plus changer.';
  end if;
  if not (
    (v_doc.owner_id = v_moi.id and v_doc.statut in ('brouillon', 'rejete'))
    or v_moi.role = 'administrateur'
    or (v_moi.role = 'validateur' and v_moi.departement = v_doc.departement and v_doc.statut <> 'brouillon')
  ) then
    raise exception 'Vous ne pouvez pas modifier la nature de ce document.';
  end if;
  update public.documents set nature = p_nature, updated_at = now() where id = p_document_id;
  insert into public.audit_log (document_id, acteur_id, action, details)
    values (v_doc.id, v_moi.id, 'classement', jsonb_build_object('ancienne', v_doc.nature, 'nouvelle', p_nature));
end;
$$;
grant execute on function public.classer_document(uuid, text) to authenticated;

create or replace function public.nouvelle_version_document(p_document_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moi public.profiles;
  v_doc public.documents;
  v_existant public.documents;
  v_nom text;
  v_id uuid;
begin
  select * into v_moi from public.profiles where id = auth.uid();
  select * into v_doc from public.documents where id = p_document_id;
  if v_doc.id is null or v_moi.id is null or not public.peut_lire_document(v_doc) then
    raise exception 'Document introuvable.';
  end if;
  if v_moi.role not in ('redacteur', 'validateur', 'administrateur') then
    raise exception 'Votre rôle ne permet pas de produire un document.';
  end if;
  if v_doc.statut <> 'publie' then
    raise exception 'Seul un document publié ou archivé donne lieu à une nouvelle version ; un brouillon se modifie directement.';
  end if;
  if not (v_doc.owner_id = v_moi.id or v_moi.role = 'administrateur' or v_moi.departement = v_doc.departement) then
    raise exception 'Seuls l''auteur, le département % ou un administrateur peuvent réviser ce document.', v_doc.departement;
  end if;

  -- Une seule révision en cours à la fois.
  select * into v_existant from public.documents
    where version_precedente_id = v_doc.id and statut <> 'publie'
    order by created_at desc limit 1;
  if v_existant.id is not null then
    if v_existant.owner_id = v_moi.id then
      return v_existant.id;
    end if;
    select nom_complet into v_nom from public.profiles where id = v_existant.owner_id;
    raise exception 'Une nouvelle version (%) est déjà en préparation par %.', v_existant.reference, v_nom;
  end if;

  perform set_config('ged.nouvelle_version', 'on', true);
  insert into public.documents (
    titre, description, classification, statut, departement, owner_id,
    nature, format_atelier, contenu, version, version_precedente_id
  ) values (
    v_doc.titre, v_doc.description, v_doc.classification, 'brouillon', v_doc.departement, v_moi.id,
    v_doc.nature, v_doc.format_atelier, v_doc.contenu, v_doc.version + 1, v_doc.id
  ) returning id into v_id;
  perform set_config('ged.nouvelle_version', '', true);

  insert into public.audit_log (document_id, acteur_id, action, details)
    values (v_id, v_moi.id, 'nouvelle_version',
      jsonb_build_object('version', v_doc.version + 1, 'depuis', v_doc.reference));
  return v_id;
end;
$$;
grant execute on function public.nouvelle_version_document(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 9. Partage : un document archivé ne se partage qu'en lecture
-- ----------------------------------------------------------------------------
create or replace function public.partager_document(
  p_document_id uuid,
  p_profils uuid[] default '{}',
  p_conversation_id uuid default null,
  p_droit text default 'lecture'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moi public.profiles;
  v_doc public.documents;
  v_cible public.profiles;
  v_id uuid;
  v_nombre integer := 0;
begin
  select * into v_moi from public.profiles where id = auth.uid();
  if v_moi.id is null or v_moi.role not in ('redacteur', 'validateur', 'administrateur') then
    raise exception 'Votre rôle ne permet pas de partager un document.';
  end if;
  if p_droit not in ('lecture', 'edition') then
    raise exception 'Droit de partage inconnu.';
  end if;

  select * into v_doc from public.documents where id = p_document_id;
  if v_doc.id is null or v_doc.organisation <> v_moi.organisation then
    raise exception 'Document introuvable.';
  end if;
  if v_doc.archive_le is not null and p_droit = 'edition' then
    raise exception 'Document archivé : partage en lecture seule uniquement.';
  end if;
  if not (
    v_doc.owner_id = v_moi.id
    or v_moi.role = 'administrateur'
    or public.partage_avec_moi(v_doc.id, true)
  ) then
    raise exception 'Seuls l''auteur, un co-éditeur ou un administrateur peuvent partager ce document.';
  end if;

  foreach v_id in array coalesce(p_profils, '{}') loop
    select * into v_cible from public.profiles where id = v_id;
    if v_cible.id is null or v_cible.organisation <> v_moi.organisation then
      raise exception 'Destinataire introuvable.';
    end if;
    if not public.peut_ouvrir_conversation(v_id) then
      raise exception 'Vous ne pouvez pas partager avec % : vous n''êtes pas autorisé à le contacter.', v_cible.nom_complet;
    end if;
    if v_doc.classification = 'confidentiel' and v_cible.departement <> v_doc.departement then
      raise exception 'Document confidentiel : % n''appartient pas au département %.', v_cible.nom_complet, v_doc.departement;
    end if;
    insert into public.document_partages (document_id, organisation, profil_id, droit, partage_par)
      values (v_doc.id, v_doc.organisation, v_id, p_droit, v_moi.id)
      on conflict (document_id, profil_id) where profil_id is not null
      do update set droit = excluded.droit, partage_par = excluded.partage_par, created_at = now();
    v_nombre := v_nombre + 1;
  end loop;

  if p_conversation_id is not null then
    if not exists (
      select 1 from public.conversation_participants cp
      join public.conversations c on c.id = cp.conversation_id
      where cp.conversation_id = p_conversation_id
        and cp.profil_id = v_moi.id
        and cp.peut_publier
        and c.organisation = v_moi.organisation
    ) then
      raise exception 'Vous ne pouvez pas publier dans cette conversation.';
    end if;
    if v_doc.classification = 'confidentiel' and exists (
      select 1 from public.conversation_participants cp
      join public.profiles p on p.id = cp.profil_id
      where cp.conversation_id = p_conversation_id and p.departement <> v_doc.departement
    ) then
      raise exception 'Document confidentiel : cette conversation compte des membres hors du département %.', v_doc.departement;
    end if;
    insert into public.document_partages (document_id, organisation, conversation_id, droit, partage_par)
      values (v_doc.id, v_doc.organisation, p_conversation_id, p_droit, v_moi.id)
      on conflict (document_id, conversation_id) where conversation_id is not null
      do update set droit = excluded.droit, partage_par = excluded.partage_par, created_at = now();
    v_nombre := v_nombre + 1;
  end if;

  if v_nombre = 0 then
    raise exception 'Choisissez au moins un destinataire.';
  end if;

  insert into public.audit_log (document_id, acteur_id, action, details)
    values (
      v_doc.id, v_moi.id, 'partage',
      jsonb_build_object('profils', coalesce(p_profils, '{}'), 'conversation', p_conversation_id, 'droit', p_droit)
    );

  return v_nombre;
end;
$$;
grant execute on function public.partager_document(uuid, uuid[], uuid, text) to authenticated;
