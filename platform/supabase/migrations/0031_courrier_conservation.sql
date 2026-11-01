-- ============================================================================
-- Service du courrier — 3/3 : CONSERVATION (catégories, gel, propositions de
-- destruction validées par le chef du courrier).
--
-- Principe : le système PROPOSE, une personne habilitée (le chef du courrier)
-- VALIDE. Jamais de destruction automatique. Détruire = supprimer les scans
-- (pièces et fichiers) ; la ligne du registre (numéro, date, objet,
-- expéditeur ou destinataire) est conservée sans limite : elle prouve que le
-- courrier a existé. Un élément GELÉ (enquête, contentieux, audit) n'est
-- jamais proposé ni reclassé tant qu'il l'est.
--
-- Les durées sont des propositions de départ, pas des règles légales : à
-- valider avec le service des archives de l'Agence.
--
-- Pour une autre organisation : insérer ses propres catégories dans
-- categories_conservation (une ligne par catégorie, avec son sigle).
--
-- À exécuter une seule fois, après les migrations 0029 et 0030.
-- ============================================================================

-- -----------------------------------------------------------------------------
-- 1. Catégories
-- -----------------------------------------------------------------------------

create table public.categories_conservation (
  organisation text not null,
  code         text not null check (code ~ '^[a-z0-9_]{2,40}$'),
  libelle      text not null check (length(libelle) between 1 and 200),
  description  text,
  duree_annees int check (duree_annees is null or duree_annees between 1 and 100),   -- null = illimitée
  duree_propre boolean not null default false,   -- la durée est fixée pour chaque pièce par le propriétaire de l'information
  sort_final   text not null check (sort_final in ('destruction', 'versement')),
  ordre        int not null default 100,
  actif        boolean not null default true,
  primary key (organisation, code)
);

revoke all on table public.categories_conservation from anon, authenticated;
grant select on public.categories_conservation to authenticated;
alter table public.categories_conservation enable row level security;
create policy categories_conservation_lecture on public.categories_conservation
  for select to authenticated using (organisation = public.mon_organisation());

-- Catégories de départ de l'Agence (organisation « API »). Les durées sont des PROPOSITIONS à faire valider
-- avec le service des archives : elles se changent dans cette table, sans toucher au code.
insert into public.categories_conservation (organisation, code, libelle, description, duree_annees, duree_propre, sort_final, ordre) values
  ('API', 'correspondance', 'Correspondance courante', 'Courrier ordinaire, sans portée d''acte : 5 ans, puis destruction des scans sur validation.', 5, false, 'destruction', 10),
  ('API', 'actes', 'Actes, décisions et courrier engageant l''Agence', 'Conservé 10 ans, puis versé aux archives : jamais détruit sans décision.', 10, false, 'versement', 20),
  ('API', 'dossiers_investisseurs', 'Dossiers d''investisseurs et d''agrément', 'Courrier lié à un projet d''investissement ou à un agrément : 10 ans après clôture, puis versement aux archives.', 10, false, 'versement', 25),
  ('API', 'confidentiel', 'Pièces confidentielles', 'Durée fixée, pièce par pièce, par le propriétaire de l''information.', null, true, 'versement', 30)
on conflict (organisation, code) do nothing;

-- -----------------------------------------------------------------------------
-- 2. Colonnes sur les courriers (arrivée) et les départs
-- -----------------------------------------------------------------------------

alter table public.courriers
  add column categorie text not null default 'correspondance',
  add column conservation_annees int check (conservation_annees is null or conservation_annees between 1 and 100),
  add column gele_le timestamptz,
  add column gel_motif text check (gel_motif is null or length(gel_motif) between 5 and 500),
  add column sort_final_le timestamptz,
  add constraint courriers_gel_coherent check ((gele_le is null) = (gel_motif is null));
alter table public.departs
  add column categorie text not null default 'correspondance',
  add column conservation_annees int check (conservation_annees is null or conservation_annees between 1 and 100),
  add column gele_le timestamptz,
  add column gel_motif text check (gel_motif is null or length(gel_motif) between 5 and 500),
  add column sort_final_le timestamptz,
  add constraint departs_gel_coherent check ((gele_le is null) = (gel_motif is null));

-- -----------------------------------------------------------------------------
-- 3. Classement, gel, propositions, validation du sort final
-- -----------------------------------------------------------------------------

create function public.est_chef_courrier()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.role_courrier() = 'chef', false);
$$;

-- Classe un courrier ou un départ dans une catégorie (service du courrier). Pour une catégorie à durée propre,
-- la durée en années est obligatoire.
create function public.classer_conservation(p_type text, p_id uuid, p_categorie text, p_duree int default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cat public.categories_conservation;
  v_org text;
begin
  if public.role_courrier() is null then
    raise exception 'Action réservée au service du courrier' using errcode = '42501';
  end if;
  if p_type not in ('courrier', 'depart') then
    raise exception 'Type inconnu' using errcode = '22023';
  end if;
  select * into v_cat from public.categories_conservation
  where organisation = public.mon_organisation() and code = p_categorie and actif;
  if v_cat.code is null then
    raise exception 'Catégorie de conservation inconnue' using errcode = '22023';
  end if;
  if v_cat.duree_propre and coalesce(p_duree, 0) not between 1 and 100 then
    raise exception 'Cette catégorie exige une durée de conservation (en années)' using errcode = '22023';
  end if;
  if p_type = 'courrier' then
    update public.courriers set categorie = p_categorie, conservation_annees = case when v_cat.duree_propre then p_duree end
    where id = p_id and organisation = public.mon_organisation() and sort_final_le is null and gele_le is null;
  else
    update public.departs set categorie = p_categorie, conservation_annees = case when v_cat.duree_propre then p_duree end
    where id = p_id and organisation = public.mon_organisation() and sort_final_le is null and gele_le is null;
  end if;
  if not found then
    raise exception 'Élément introuvable, gelé ou déjà traité' using errcode = '42501';
  end if;
  perform public.journaliser('conservation.classe', null, jsonb_build_object('type', p_type, 'id', p_id, 'categorie', p_categorie, 'duree', p_duree));
end;
$$;

-- Gel : rien ne se détruit tant qu'un élément est gelé (enquête, contentieux, audit). Chef du courrier.
create function public.geler_conservation(p_type text, p_id uuid, p_motif text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.est_chef_courrier() then
    raise exception 'Action réservée au chef du courrier' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_motif, ''))) not between 5 and 500 then
    raise exception 'Indiquez le motif du gel (5 caractères au moins)' using errcode = '22023';
  end if;
  if p_type = 'courrier' then
    update public.courriers set gele_le = clock_timestamp(), gel_motif = trim(p_motif)
    where id = p_id and organisation = public.mon_organisation() and gele_le is null;
  elsif p_type = 'depart' then
    update public.departs set gele_le = clock_timestamp(), gel_motif = trim(p_motif)
    where id = p_id and organisation = public.mon_organisation() and gele_le is null;
  else
    raise exception 'Type inconnu' using errcode = '22023';
  end if;
  if not found then
    raise exception 'Élément introuvable ou déjà gelé' using errcode = '42501';
  end if;
  perform public.journaliser('conservation.gel', null, jsonb_build_object('type', p_type, 'id', p_id));
end;
$$;

create function public.degeler_conservation(p_type text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.est_chef_courrier() then
    raise exception 'Action réservée au chef du courrier' using errcode = '42501';
  end if;
  if p_type = 'courrier' then
    update public.courriers set gele_le = null, gel_motif = null where id = p_id and organisation = public.mon_organisation() and gele_le is not null;
  elsif p_type = 'depart' then
    update public.departs set gele_le = null, gel_motif = null where id = p_id and organisation = public.mon_organisation() and gele_le is not null;
  else
    raise exception 'Type inconnu' using errcode = '22023';
  end if;
  if not found then
    raise exception 'Élément introuvable ou non gelé' using errcode = '42501';
  end if;
  perform public.journaliser('conservation.degel', null, jsonb_build_object('type', p_type, 'id', p_id));
end;
$$;

-- Éléments arrivés à échéance : clos depuis plus longtemps que leur durée de conservation, non gelés,
-- avec des pièces encore présentes (ou, pour un versement, pas encore versés). Échéance = date du dernier
-- mouvement + durée (celle de la catégorie, ou celle fixée pour la pièce). Le jour s'apprécie à Douala.
create function public.propositions_conservation()
returns table (type text, id uuid, numero text, objet text, categorie text, categorie_libelle text, sort_final text, echeance date, nb_pieces int)
language sql
security definer
stable
set search_path = public
as $$
  with candidats as (
    select 'courrier'::text as type, c.id, c.numero, coalesce(c.objet, 'Courrier de ' || c.expediteur) as objet, c.categorie,
           c.conservation_annees as duree_propre,
           (select max(m.created_at) from public.courrier_mouvements m where m.courrier_id = c.id) as dernier,
           (select count(*) from public.courrier_pieces p where p.courrier_id = c.id)::int as nb_pieces
    from public.courriers c
    where c.organisation = public.mon_organisation() and c.statut in ('traite', 'classe', 'annule')
      and c.gele_le is null and c.sort_final_le is null
    union all
    select 'depart', d.id, coalesce(d.numero, 'Demande'), d.objet, d.categorie, d.conservation_annees,
           (select max(m.created_at) from public.depart_mouvements m where m.depart_id = d.id),
           (select count(*) from public.depart_pieces p where p.depart_id = d.id)::int
    from public.departs d
    where d.organisation = public.mon_organisation() and d.gele_le is null and d.sort_final_le is null
      and (d.statut in ('accuse', 'annule', 'refuse') or (d.statut = 'expedie' and not d.ar_demande))
  )
  select c.type, c.id, c.numero, c.objet, c.categorie, k.libelle, k.sort_final,
         ((c.dernier + make_interval(years => coalesce(c.duree_propre, k.duree_annees))) at time zone 'Africa/Douala')::date,
         c.nb_pieces
  from candidats c
  join public.categories_conservation k on k.organisation = public.mon_organisation() and k.code = c.categorie
  where public.est_chef_courrier()
    and c.dernier is not null
    and coalesce(c.duree_propre, k.duree_annees) is not null
    and ((c.dernier + make_interval(years => coalesce(c.duree_propre, k.duree_annees))) at time zone 'Africa/Douala')::date
        < (clock_timestamp() at time zone 'Africa/Douala')::date
    and (k.sort_final = 'versement' or c.nb_pieces > 0)
  order by 8, 3;
$$;

-- Valide le sort final d'éléments proposés (chef du courrier) : détruit les scans (destruction) ou
-- enregistre le versement aux archives (versement). Retourne les fichiers à effacer du stockage (le
-- navigateur ne peut les effacer qu'ensuite, car la règle de stockage exige qu'ils ne soient plus référencés).
create function public.valider_sort_final(p_type text, p_ids uuid[], p_motif text)
returns table (chemin text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    uuid;
  v_sort  text;
begin
  if not public.est_chef_courrier() then
    raise exception 'Action réservée au chef du courrier' using errcode = '42501';
  end if;
  if p_type not in ('courrier', 'depart') then
    raise exception 'Type inconnu' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_motif, ''))) not between 5 and 500 then
    raise exception 'Indiquez la décision (5 caractères au moins), par exemple la référence du procès-verbal' using errcode = '22023';
  end if;
  if coalesce(cardinality(p_ids), 0) not between 1 and 200 then
    raise exception 'Choisissez entre 1 et 200 éléments' using errcode = '22023';
  end if;

  foreach v_id in array p_ids loop
    -- l'élément doit figurer parmi les propositions du moment : on ne détruit pas ce que le système ne propose pas
    select p.sort_final into v_sort from public.propositions_conservation() p where p.type = p_type and p.id = v_id;
    if v_sort is null then
      raise exception 'Cet élément n''est pas arrivé à échéance, ou il est gelé' using errcode = '42501';
    end if;
    if v_sort = 'destruction' then
      if p_type = 'courrier' then
        return query delete from public.courrier_pieces where courrier_id = v_id returning chemin_fichier;
        update public.courriers set sort_final_le = clock_timestamp() where id = v_id;
      else
        return query delete from public.depart_pieces where depart_id = v_id returning chemin_fichier;
        update public.departs set sort_final_le = clock_timestamp() where id = v_id;
      end if;
    else
      if p_type = 'courrier' then
        update public.courriers set sort_final_le = clock_timestamp() where id = v_id;
      else
        update public.departs set sort_final_le = clock_timestamp() where id = v_id;
      end if;
    end if;
    perform public.journaliser('conservation.' || case when v_sort = 'destruction' then 'destruction' else 'versement' end, null,
      jsonb_build_object('type', p_type, 'id', v_id, 'decision', trim(p_motif)));
  end loop;
end;
$$;

-- Archive du courrier : le chef du courrier efface un fichier qu'aucune pièce ne référence plus (après
-- destruction validée) ; les pièces encore référencées restent intangibles.
create policy courrier_fichiers_destruction on storage.objects
  for delete to authenticated
  using (bucket_id = 'courrier' and public.est_chef_courrier()
         and not exists (select 1 from public.courrier_pieces cp where cp.chemin_fichier = name)
         and not exists (select 1 from public.depart_pieces dp where dp.chemin_fichier = name));

-- -----------------------------------------------------------------------------
-- Privilèges d'exécution : fermés, puis ouverts aux seuls agents connectés
-- -----------------------------------------------------------------------------

revoke execute on function
  public.est_chef_courrier(), public.classer_conservation(text, uuid, text, int),
  public.geler_conservation(text, uuid, text), public.degeler_conservation(text, uuid),
  public.propositions_conservation(), public.valider_sort_final(text, uuid[], text)
from public, anon, authenticated;
grant execute on function
  public.est_chef_courrier(), public.classer_conservation(text, uuid, text, int),
  public.geler_conservation(text, uuid, text), public.degeler_conservation(text, uuid),
  public.propositions_conservation(), public.valider_sort_final(text, uuid[], text)
to authenticated;

-- ----------------------------------------------------------------------------
-- Double authentification (migration 0027) sur la nouvelle table
-- ----------------------------------------------------------------------------
drop policy if exists "mfa_obligatoire" on public.categories_conservation;
create policy "mfa_obligatoire" on public.categories_conservation
  as restrictive for all to authenticated
  using (public.mfa_validee()) with check (public.mfa_validee());
