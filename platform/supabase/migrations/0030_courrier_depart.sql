-- ============================================================================
-- Service du courrier — 2/3 : courrier DÉPART.
--
-- Parcours d'une lettre qui part de l'Agence :
--   1. un agent demande l'expédition depuis un DOCUMENT VALIDÉ (ou publié) de
--      la GED (destinataires, ampliations, mode d'envoi, accusé de réception
--      souhaité) ; le service du courrier crée directement les départs de
--      lettres signées sur papier ;
--   2. le service ACCEPTE la demande (numéro d'ordre DEP-AAAA-NNNNNN) ou la
--      renvoie avec un motif ;
--   3. il EXPÉDIE (date et heure, bordereau d'envoi), puis
--   4. enregistre l'ACCUSÉ DE RÉCEPTION de chaque destinataire (scan
--      facultatif) ; une relance est signalée si l'accusé tarde.
-- La plateforme n'envoie ni ne poste rien : elle garde la trace et les preuves.
--
-- Un départ peut répondre à un courrier ARRIVÉ. Un document confidentiel
-- n'est jamais joint : le service ne voit que l'enveloppe. Rien ne se supprime.
--
-- À exécuter une seule fois, après la migration 0029.
-- ============================================================================

create table public.compteurs_depart (
  organisation text not null,
  annee        int  not null,
  dernier      int  not null default 0,
  primary key (organisation, annee)
);

create table public.departs (
  id                 uuid primary key default gen_random_uuid(),
  organisation       text not null,
  numero             text,
  annee              int,
  statut             text not null default 'demande' check (statut in ('demande', 'enregistre', 'expedie', 'accuse', 'refuse', 'annule')),
  objet              text not null check (length(objet) between 1 and 500),
  document_id        uuid references public.documents (id) on delete set null,
  document_reference text,
  signature_numero   text,
  courrier_arrivee_id uuid references public.courriers (id),
  demandeur_id       uuid not null references public.profiles (id),
  departement        text not null check (length(departement) between 1 and 100),
  mode_envoi         text not null check (mode_envoi in ('main', 'poste', 'coursier', 'huissier', 'email', 'autre')),
  nb_pieces          int  not null default 1 check (nb_pieces between 1 and 999),
  urgent             boolean not null default false,
  ar_demande         boolean not null default false,
  relance_jours      int check (relance_jours is null or relance_jours between 1 and 365),
  relance_le         date,
  note               text check (note is null or length(note) <= 1000),
  demande_le         timestamptz not null default clock_timestamp(),
  enregistre_le      timestamptz,
  enregistre_par     uuid references public.profiles (id),
  expedie_le         timestamptz,
  expedie_par        uuid references public.profiles (id),
  motif              text,
  created_at         timestamptz not null default clock_timestamp(),
  updated_at         timestamptz not null default clock_timestamp(),
  unique (organisation, numero),
  constraint depart_numero check (statut not in ('enregistre', 'expedie', 'accuse') or numero is not null)
);
create index idx_departs_org on public.departs (organisation, demande_le desc);
create index idx_departs_arrivee on public.departs (courrier_arrivee_id) where courrier_arrivee_id is not null;

create table public.depart_destinataires (
  id         uuid primary key default gen_random_uuid(),
  depart_id  uuid not null references public.departs (id) on delete restrict,
  role       text not null default 'destinataire' check (role in ('destinataire', 'ampliation')),
  nom        text not null check (length(nom) between 1 and 300),
  adresse    text check (adresse is null or length(adresse) <= 500),
  statut     text not null default 'a_expedier' check (statut in ('a_expedier', 'expedie', 'accuse')),
  expedie_le timestamptz,
  accuse_le  timestamptz,
  accuse_par uuid references public.profiles (id),
  ordre      int not null default 0
);
create index idx_depart_destinataires on public.depart_destinataires (depart_id, ordre);

create table public.depart_pieces (
  id               uuid primary key default gen_random_uuid(),
  depart_id        uuid not null references public.departs (id) on delete restrict,
  chemin_fichier   text not null unique,
  nom_fichier      text not null check (length(nom_fichier) between 1 and 200),
  taille           bigint not null check (taille > 0),
  empreinte_sha256 text not null check (empreinte_sha256 ~ '^[0-9a-f]{64}$'),
  nature           text not null default 'lettre' check (nature in ('lettre', 'lettre_signee', 'accuse', 'annexe')),
  destinataire_id  uuid references public.depart_destinataires (id),
  ajoute_par       uuid not null references public.profiles (id),
  created_at       timestamptz not null default clock_timestamp(),
  constraint depart_piece_chemin check (split_part(chemin_fichier, '/', 1) = depart_id::text)
);
create index idx_depart_pieces on public.depart_pieces (depart_id);

create table public.depart_mouvements (
  id         bigint generated always as identity primary key,
  depart_id  uuid not null references public.departs (id) on delete restrict,
  action     text not null,
  par        uuid references public.profiles (id),
  details    jsonb not null default '{}',
  created_at timestamptz not null default clock_timestamp()
);
create index idx_depart_mouvements on public.depart_mouvements (depart_id, created_at);

-- -----------------------------------------------------------------------------
-- Qui voit quoi : le service du courrier ; le demandeur ; le validateur (responsable) du département
-- émetteur. Ni administrateur technique, sauf s'il est lui-même demandeur ou du service du courrier.
-- -----------------------------------------------------------------------------

create function public.peut_lire_depart(p_depart uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.departs d
    join public.profiles p on p.id = auth.uid() and p.organisation = d.organisation
    where d.id = p_depart
      and (
        p.role_courrier is not null
        or d.demandeur_id = p.id
        or (p.role = 'validateur' and p.departement = d.departement)
      )
  );
$$;

-- L'archive privée sert aux deux registres : le premier segment du chemin est l'identifiant du
-- courrier arrivé OU du départ.
create or replace function public.peut_lire_piece_courrier(p_chemin text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.courriers c
    where c.id::text = split_part(p_chemin, '/', 1) and c.caractere <> 'personnel'
      and public.peut_lire_courrier(c.id)
  ) or exists (
    select 1 from public.departs d
    where d.id::text = split_part(p_chemin, '/', 1) and public.peut_lire_depart(d.id)
  );
$$;

create or replace function public.peut_deposer_piece_courrier(p_chemin text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select p_chemin ~ '^[0-9a-f-]{36}/[^/]+$'
    and (
      (public.role_courrier() is not null and exists (
        select 1 from public.courriers c
        where c.id::text = split_part(p_chemin, '/', 1) and c.organisation = public.mon_organisation()
          and c.caractere <> 'personnel' and c.statut <> 'annule'))
      or exists (
        select 1 from public.departs d
        where d.id::text = split_part(p_chemin, '/', 1) and d.organisation = public.mon_organisation()
          and d.statut not in ('annule', 'refuse')
          -- le service dépose à tout moment ; le demandeur seulement tant que sa demande n'est pas traitée
          and (public.role_courrier() is not null or (d.demandeur_id = auth.uid() and d.statut = 'demande')))
    );
$$;

-- -----------------------------------------------------------------------------
-- Droits et RLS (lecture seule ; toute écriture passe par les fonctions)
-- -----------------------------------------------------------------------------

revoke all on table public.compteurs_depart, public.departs, public.depart_destinataires, public.depart_pieces, public.depart_mouvements
  from anon, authenticated;
revoke all on sequence public.depart_mouvements_id_seq from anon, authenticated;
grant select on public.departs, public.depart_destinataires, public.depart_pieces, public.depart_mouvements to authenticated;
alter table public.compteurs_depart enable row level security;   -- aucun accès direct
alter table public.departs enable row level security;
alter table public.depart_destinataires enable row level security;
alter table public.depart_pieces enable row level security;
alter table public.depart_mouvements enable row level security;

create policy departs_lecture on public.departs for select to authenticated using (public.peut_lire_depart(id));
create policy depart_dest_lecture on public.depart_destinataires for select to authenticated using (public.peut_lire_depart(depart_id));
create policy depart_pieces_lecture on public.depart_pieces for select to authenticated using (public.peut_lire_piece_courrier(chemin_fichier));
create policy depart_mouvements_lecture on public.depart_mouvements for select to authenticated using (public.peut_lire_depart(depart_id));

-- -----------------------------------------------------------------------------
-- Fonctions
-- -----------------------------------------------------------------------------

create function public.mouvement_depart(p_depart uuid, p_action text, p_details jsonb default '{}')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.depart_mouvements (depart_id, action, par, details) values (p_depart, p_action, auth.uid(), p_details);
  update public.departs set updated_at = clock_timestamp() where id = p_depart;
  perform public.journaliser('depart.' || p_action, null, jsonb_build_object('depart', p_depart) || p_details);
end;
$$;

-- Destinataires : [{"nom": "...", "adresse": "...", "role": "destinataire"|"ampliation"}, …], 1 à 20, dont un destinataire au moins.
create function public.enregistrer_destinataires_depart(p_depart uuid, p_destinataires jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_el jsonb;
  v_n  int := 0;
  v_principaux int := 0;
begin
  if p_destinataires is null or jsonb_typeof(p_destinataires) <> 'array'
     or jsonb_array_length(p_destinataires) not between 1 and 20 then
    raise exception 'Indiquez de 1 à 20 destinataires' using errcode = '22023';
  end if;
  for v_el in select * from jsonb_array_elements(p_destinataires) loop
    if length(trim(coalesce(v_el ->> 'nom', ''))) not between 1 and 300 then
      raise exception 'Chaque destinataire doit avoir un nom' using errcode = '22023';
    end if;
    if coalesce(v_el ->> 'role', 'destinataire') not in ('destinataire', 'ampliation') then
      raise exception 'Rôle de destinataire inconnu' using errcode = '22023';
    end if;
    if coalesce(v_el ->> 'role', 'destinataire') = 'destinataire' then v_principaux := v_principaux + 1; end if;
    insert into public.depart_destinataires (depart_id, role, nom, adresse, ordre)
    values (p_depart, coalesce(v_el ->> 'role', 'destinataire'), left(trim(v_el ->> 'nom'), 300),
            nullif(left(trim(coalesce(v_el ->> 'adresse', '')), 500), ''), v_n);
    v_n := v_n + 1;
  end loop;
  if v_principaux = 0 then
    raise exception 'Indiquez au moins un destinataire (et pas seulement des ampliations)' using errcode = '22023';
  end if;
end;
$$;

create function public.numeroter_depart(p_depart uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org   text;
  v_annee int := extract(year from (now() at time zone 'Africa/Douala'))::int;
  v_n     int;
begin
  select organisation into v_org from public.departs where id = p_depart;
  insert into public.compteurs_depart as c (organisation, annee, dernier) values (v_org, v_annee, 1)
  on conflict (organisation, annee) do update set dernier = c.dernier + 1
  returning dernier into v_n;
  -- Le numéro et le statut « enregistré » se posent ensemble (un départ enregistré a toujours un numéro).
  update public.departs
  set numero = 'DEP-' || v_annee || '-' || lpad(v_n::text, 6, '0'), annee = v_annee, statut = 'enregistre',
      enregistre_le = clock_timestamp(), enregistre_par = auth.uid()
  where id = p_depart;
end;
$$;

-- 1a. Demande d'expédition par un agent, depuis un document VALIDÉ.
create function public.demander_expedition(
  p_objet text, p_document uuid, p_courrier_arrivee uuid, p_mode text, p_nb_pieces int,
  p_urgent boolean, p_ar boolean, p_relance_jours int, p_note text, p_destinataires jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moi public.profiles;
  v_doc public.documents;
  v_sig text;
  v_id  uuid;
  v_objet text := left(trim(coalesce(p_objet, '')), 500);
begin
  select * into v_moi from public.profiles where id = auth.uid();
  if v_moi.id is null or trim(coalesce(v_moi.departement, '')) = '' then
    raise exception 'Votre compte doit être rattaché à un département' using errcode = '42501';
  end if;
  if v_objet = '' then
    raise exception 'Indiquez l''objet de la lettre' using errcode = '22023';
  end if;
  select * into v_doc from public.documents where id = p_document;
  if v_doc.id is null or not public.peut_lire_document(v_doc) or v_doc.statut not in ('valide', 'publie') then
    raise exception 'Choisissez un document validé auquel vous avez accès' using errcode = '42501';
  end if;
  if p_courrier_arrivee is not null and not public.peut_lire_courrier(p_courrier_arrivee) then
    raise exception 'Courrier d''origine inaccessible' using errcode = '42501';
  end if;
  select s.numero into v_sig from public.signatures s where s.document_id = p_document and s.statut = 'valide' order by s.signe_le desc limit 1;

  insert into public.departs (organisation, objet, document_id, document_reference, signature_numero, courrier_arrivee_id,
    demandeur_id, departement, mode_envoi, nb_pieces, urgent, ar_demande, relance_jours, note)
  values (v_moi.organisation, v_objet, p_document, v_doc.reference, v_sig, p_courrier_arrivee,
    v_moi.id, v_moi.departement, p_mode, coalesce(p_nb_pieces, 1), coalesce(p_urgent, false), coalesce(p_ar, false),
    case when coalesce(p_ar, false) then coalesce(p_relance_jours, 15) end,
    nullif(left(trim(coalesce(p_note, '')), 1000), ''))
  returning id into v_id;
  perform public.enregistrer_destinataires_depart(v_id, p_destinataires);
  perform public.mouvement_depart(v_id, 'demande', jsonb_build_object('document', p_document));
  return v_id;
end;
$$;

-- 1b. Départ créé directement par le service (lettre signée sur papier) : numéroté tout de suite.
create function public.enregistrer_depart(
  p_objet text, p_departement text, p_courrier_arrivee uuid, p_mode text, p_nb_pieces int,
  p_urgent boolean, p_ar boolean, p_relance_jours int, p_note text, p_destinataires jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moi public.profiles;
  v_id  uuid;
  v_objet text := left(trim(coalesce(p_objet, '')), 500);
begin
  select * into v_moi from public.profiles where id = auth.uid();
  if v_moi.id is null or v_moi.role_courrier is null then
    raise exception 'Action réservée au service du courrier' using errcode = '42501';
  end if;
  if v_objet = '' then
    raise exception 'Indiquez l''objet de la lettre' using errcode = '22023';
  end if;
  if not public.departement_existe(v_moi.organisation, p_departement) then
    raise exception 'Département émetteur inconnu' using errcode = '42501';
  end if;
  if p_courrier_arrivee is not null and not exists (
    select 1 from public.courriers where id = p_courrier_arrivee and organisation = v_moi.organisation) then
    raise exception 'Courrier d''origine inconnu' using errcode = '42501';
  end if;
  insert into public.departs (organisation, statut, objet, courrier_arrivee_id, demandeur_id, departement, mode_envoi,
    nb_pieces, urgent, ar_demande, relance_jours, note)
  values (v_moi.organisation, 'demande', v_objet, p_courrier_arrivee, v_moi.id, trim(p_departement), p_mode,
    coalesce(p_nb_pieces, 1), coalesce(p_urgent, false), coalesce(p_ar, false),
    case when coalesce(p_ar, false) then coalesce(p_relance_jours, 15) end,
    nullif(left(trim(coalesce(p_note, '')), 1000), ''))
  returning id into v_id;
  perform public.enregistrer_destinataires_depart(v_id, p_destinataires);
  perform public.numeroter_depart(v_id);
  perform public.mouvement_depart(v_id, 'enregistre', jsonb_build_object('direct', true));
  return v_id;
end;
$$;

-- 2. Le service accepte (numéro d'ordre) ou renvoie la demande.
create function public.accepter_demande_depart(p_depart uuid, p_mode text, p_nb_pieces int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_d public.departs;
begin
  if public.role_courrier() is null then
    raise exception 'Action réservée au service du courrier' using errcode = '42501';
  end if;
  select * into v_d from public.departs where id = p_depart and organisation = public.mon_organisation() for update;
  if v_d.id is null or v_d.statut <> 'demande' then
    raise exception 'Cette demande n''est plus en attente' using errcode = '42501';
  end if;
  update public.departs set mode_envoi = coalesce(p_mode, mode_envoi), nb_pieces = coalesce(p_nb_pieces, nb_pieces) where id = p_depart;
  perform public.numeroter_depart(p_depart);
  perform public.mouvement_depart(p_depart, 'enregistre');
end;
$$;

create function public.refuser_demande_depart(p_depart uuid, p_motif text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_d public.departs;
  v_motif text := trim(coalesce(p_motif, ''));
begin
  if public.role_courrier() is null then
    raise exception 'Action réservée au service du courrier' using errcode = '42501';
  end if;
  if length(v_motif) < 5 then
    raise exception 'Indiquez le motif (5 caractères au moins)' using errcode = '22023';
  end if;
  select * into v_d from public.departs where id = p_depart and organisation = public.mon_organisation() for update;
  if v_d.id is null or v_d.statut <> 'demande' then
    raise exception 'Cette demande n''est plus en attente' using errcode = '42501';
  end if;
  update public.departs set statut = 'refuse', motif = left(v_motif, 500) where id = p_depart;
  perform public.mouvement_depart(p_depart, 'refuse', jsonb_build_object('motif', left(v_motif, 500)));
end;
$$;

-- 3. Expédition : tous les destinataires partent ensemble ; la relance est calculée si un accusé est demandé.
create function public.expedier_depart(p_depart uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_d public.departs;
begin
  if public.role_courrier() is null then
    raise exception 'Action réservée au service du courrier' using errcode = '42501';
  end if;
  select * into v_d from public.departs where id = p_depart and organisation = public.mon_organisation() for update;
  if v_d.id is null or v_d.statut <> 'enregistre' then
    raise exception 'Ce départ ne peut pas être expédié dans son état actuel' using errcode = '42501';
  end if;
  update public.depart_destinataires set statut = 'expedie', expedie_le = clock_timestamp() where depart_id = p_depart and statut = 'a_expedier';
  update public.departs
  set statut = 'expedie', expedie_le = clock_timestamp(), expedie_par = auth.uid(),
      relance_le = case when ar_demande then (now() at time zone 'Africa/Douala')::date + coalesce(relance_jours, 15) end
  where id = p_depart;
  perform public.mouvement_depart(p_depart, 'expedie');
end;
$$;

-- 4. Accusé de réception d'un destinataire ; le départ passe à « accusé » quand tous les destinataires (hors ampliations) ont accusé.
create function public.accuser_destinataire_depart(p_depart uuid, p_destinataire uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_d public.departs;
begin
  if public.role_courrier() is null then
    raise exception 'Action réservée au service du courrier' using errcode = '42501';
  end if;
  select * into v_d from public.departs where id = p_depart and organisation = public.mon_organisation() for update;
  if v_d.id is null or v_d.statut not in ('expedie', 'accuse') then
    raise exception 'Ce départ n''est pas expédié' using errcode = '42501';
  end if;
  update public.depart_destinataires set statut = 'accuse', accuse_le = clock_timestamp(), accuse_par = auth.uid()
  where id = p_destinataire and depart_id = p_depart and statut = 'expedie';
  if not found then
    raise exception 'Destinataire introuvable ou accusé déjà enregistré' using errcode = '42501';
  end if;
  if not exists (select 1 from public.depart_destinataires where depart_id = p_depart and role = 'destinataire' and statut <> 'accuse') then
    update public.departs set statut = 'accuse' where id = p_depart;
  end if;
  perform public.mouvement_depart(p_depart, 'accuse', jsonb_build_object('destinataire', p_destinataire));
end;
$$;

-- Annulation motivée : le chef du courrier (départs enregistrés ou expédiés) ou le demandeur (sa demande en attente).
create function public.annuler_depart(p_depart uuid, p_motif text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_d public.departs;
  v_motif text := trim(coalesce(p_motif, ''));
begin
  if length(v_motif) < 5 then
    raise exception 'Indiquez le motif (5 caractères au moins)' using errcode = '22023';
  end if;
  select * into v_d from public.departs where id = p_depart and organisation = public.mon_organisation() for update;
  if v_d.id is null or v_d.statut in ('annule', 'refuse') then
    raise exception 'Départ introuvable ou déjà clos' using errcode = '42501';
  end if;
  -- coalesce : sans rôle de courrier, role_courrier() est NULL et « NULL = 'chef' » ne refuserait rien.
  if not (coalesce(public.role_courrier(), '') = 'chef' or (v_d.demandeur_id = auth.uid() and v_d.statut = 'demande')) then
    raise exception 'Annulation réservée au chef du courrier, ou au demandeur tant que sa demande est en attente' using errcode = '42501';
  end if;
  update public.departs set statut = 'annule', motif = left(v_motif, 500) where id = p_depart;
  perform public.mouvement_depart(p_depart, 'annule', jsonb_build_object('motif', left(v_motif, 500)));
end;
$$;

-- Pièces : lettre (jointe à la demande par le demandeur, ou par le service), lettre signée scannée, accusés, annexes.
create function public.ajouter_piece_depart(p_depart uuid, p_chemin text, p_nom text, p_taille bigint, p_empreinte text, p_nature text default 'lettre', p_destinataire uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_d  public.departs;
  v_id uuid;
begin
  select * into v_d from public.departs where id = p_depart and organisation = public.mon_organisation() for update;
  if v_d.id is null or v_d.statut in ('annule', 'refuse') then
    raise exception 'Ce départ n''accepte plus de pièce' using errcode = '42501';
  end if;
  if not (public.role_courrier() is not null or (v_d.demandeur_id = auth.uid() and v_d.statut = 'demande' and p_nature = 'lettre')) then
    raise exception 'Dépôt non autorisé' using errcode = '42501';
  end if;
  if p_nature not in ('lettre', 'lettre_signee', 'accuse', 'annexe') then
    raise exception 'Nature de pièce inconnue' using errcode = '22023';
  end if;
  if p_destinataire is not null and not exists (select 1 from public.depart_destinataires where id = p_destinataire and depart_id = p_depart) then
    raise exception 'Destinataire inconnu' using errcode = '42501';
  end if;
  if split_part(p_chemin, '/', 1) <> p_depart::text
     or not exists (select 1 from storage.objects where bucket_id = 'courrier' and name = p_chemin) then
    raise exception 'Fichier introuvable dans l''archive' using errcode = '42501';
  end if;
  insert into public.depart_pieces (depart_id, chemin_fichier, nom_fichier, taille, empreinte_sha256, nature, destinataire_id, ajoute_par)
  values (p_depart, p_chemin, left(p_nom, 200), p_taille, p_empreinte, p_nature, p_destinataire, auth.uid())
  returning id into v_id;
  perform public.mouvement_depart(p_depart, case p_nature when 'accuse' then 'accuse_scanne' else 'piece' end,
    jsonb_build_object('piece', v_id, 'nature', p_nature, 'empreinte', p_empreinte));
  return v_id;
end;
$$;

-- Pastilles du courrier : arrivées à remettre / à retirer, plus (service) demandes d'expédition et relances échues.
create or replace function public.pastilles_courrier()
returns int
language sql
stable
set search_path = public
as $$
  select
    case when public.role_courrier() is not null
         then (select count(*)::int from public.courriers c where c.statut = 'recu' and c.remise_declaree_le is null)
            + (select count(*)::int from public.departs d where d.statut = 'demande')
            + (select count(*)::int from public.departs d
               where d.statut = 'expedie' and d.ar_demande and d.relance_le <= (now() at time zone 'Africa/Douala')::date)
         else 0 end
    + (select count(*)::int from public.courriers c
       where c.statut = 'recu' and public.courrier_me_concerne(c.id)
         and (c.destinataire_id = auth.uid() or c.affecte_a = auth.uid() or c.remise_declaree_le is not null));
$$;

-- Registre des départs exportable : service du courrier seulement ; l'export est journalisé.
create function public.registre_depart(p_debut date, p_fin date)
returns table (
  numero text, enregistre_le timestamptz, expedie_le timestamptz, objet text, departement text, demandeur text,
  mode_envoi text, nb_pieces int, urgent boolean, destinataires text, ampliations text, statut text,
  ar_demande boolean, accuses text, reponse_a text, signature_numero text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.role_courrier() is null then
    raise exception 'Action réservée au service du courrier' using errcode = '42501';
  end if;
  perform public.journaliser('depart.registre', null, jsonb_build_object('debut', p_debut, 'fin', p_fin));
  return query
  select d.numero, d.enregistre_le, d.expedie_le, d.objet, d.departement, pr.nom_complet, d.mode_envoi, d.nb_pieces, d.urgent,
         (select string_agg(x.nom, ' ; ' order by x.ordre) from public.depart_destinataires x where x.depart_id = d.id and x.role = 'destinataire'),
         (select string_agg(x.nom, ' ; ' order by x.ordre) from public.depart_destinataires x where x.depart_id = d.id and x.role = 'ampliation'),
         d.statut, d.ar_demande,
         (select count(*) filter (where x.statut = 'accuse') || '/' || count(*) from public.depart_destinataires x where x.depart_id = d.id and x.role = 'destinataire'),
         c.numero, d.signature_numero
  from public.departs d
  join public.profiles pr on pr.id = d.demandeur_id
  left join public.courriers c on c.id = d.courrier_arrivee_id
  where d.organisation = public.mon_organisation() and d.statut in ('enregistre', 'expedie', 'accuse', 'annule')
    and (d.enregistre_le at time zone 'Africa/Douala')::date between coalesce(p_debut, date '2000-01-01') and coalesce(p_fin, date '2999-12-31')
  order by d.enregistre_le;
end;
$$;

-- -----------------------------------------------------------------------------
-- Privilèges d'exécution : fermés, puis ouverts aux seuls agents connectés
-- -----------------------------------------------------------------------------

revoke execute on function
  public.peut_lire_depart(uuid), public.mouvement_depart(uuid, text, jsonb),
  public.enregistrer_destinataires_depart(uuid, jsonb), public.numeroter_depart(uuid),
  public.demander_expedition(text, uuid, uuid, text, int, boolean, boolean, int, text, jsonb),
  public.enregistrer_depart(text, text, uuid, text, int, boolean, boolean, int, text, jsonb),
  public.accepter_demande_depart(uuid, text, int), public.refuser_demande_depart(uuid, text),
  public.expedier_depart(uuid), public.accuser_destinataire_depart(uuid, uuid),
  public.annuler_depart(uuid, text),
  public.ajouter_piece_depart(uuid, text, text, bigint, text, text, uuid),
  public.pastilles_courrier(), public.registre_depart(date, date)
from public, anon, authenticated;
grant execute on function
  public.peut_lire_depart(uuid),
  public.demander_expedition(text, uuid, uuid, text, int, boolean, boolean, int, text, jsonb),
  public.enregistrer_depart(text, text, uuid, text, int, boolean, boolean, int, text, jsonb),
  public.accepter_demande_depart(uuid, text, int), public.refuser_demande_depart(uuid, text),
  public.expedier_depart(uuid), public.accuser_destinataire_depart(uuid, uuid),
  public.annuler_depart(uuid, text),
  public.ajouter_piece_depart(uuid, text, text, bigint, text, text, uuid),
  public.pastilles_courrier(), public.registre_depart(date, date)
to authenticated;

-- ----------------------------------------------------------------------------
-- Double authentification (migration 0027) sur les nouvelles tables
-- ----------------------------------------------------------------------------
do $$
declare
  v_table text;
begin
  foreach v_table in array array['compteurs_depart', 'departs', 'depart_destinataires', 'depart_pieces', 'depart_mouvements']
  loop
    execute format('drop policy if exists "mfa_obligatoire" on public.%I', v_table);
    execute format(
      'create policy "mfa_obligatoire" on public.%I as restrictive for all to authenticated '
      'using (public.mfa_validee()) with check (public.mfa_validee())',
      v_table
    );
  end loop;
end $$;
