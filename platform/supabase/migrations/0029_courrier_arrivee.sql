-- ============================================================================
-- Service du courrier — 1/3 : courrier ARRIVÉE.
--
-- Module repris de la « Chancellerie numérique » (Ministère de la Justice) et
-- adapté à la plateforme : le « Service du courrier » enregistre chaque pli
-- reçu SANS l'ouvrir (seul ce qui se lit à l'extérieur est saisi), le numérise
-- si le pli est ouvrable, le remet, puis le destinataire accuse réception.
--
-- Adaptations au schéma de la plateforme (aucune table d'organigramme) :
--   - « structure destinataire » = DÉPARTEMENT du destinataire (texte, comme
--     profiles.departement) ; il doit exister dans l'organisation ;
--   - « responsable de la structure » = VALIDATEUR de ce département ;
--   - pas de statut de compte : tous les comptes sont actifs ;
--   - journal d'audit : la table audit_log existante (fonction journaliser) ;
--   - isolation par organisation : mon_organisation() comme partout ailleurs ;
--   - double authentification : policies restrictives (migration 0027).
--
-- Rôles du courrier (colonne profiles.role_courrier, désignés par un
-- administrateur qui ne peut pas se désigner lui-même) :
--   - « agent » : enregistre, numérise, remet, exporte le registre ;
--   - « chef »  : en plus, corrige et annule (toujours avec motif), et
--     gère la conservation (migration 0031).
-- L'administrateur ne lit PAS le courrier des autres, sauf s'il en est
-- destinataire ou membre du service du courrier. Un pli « personnel » n'a
-- jamais d'objet, n'est jamais numérisé et n'est lisible que de son
-- destinataire (et, pour l'enveloppe, du service du courrier).
--
-- Rien ne se supprime : annulation ou correction motivées, historique des
-- mouvements conservé, journal d'audit sans contenu sensible. Toutes les
-- écritures passent par des fonctions de la base (aucune écriture directe).
--
-- À exécuter une seule fois, après la migration 0028, puis 0030 et 0031.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Outils communs au module
-- ----------------------------------------------------------------------------

-- Journal d'audit (interne : jamais exposé à l'API). Ne reçoit que des
-- identifiants et des actions, jamais le texte d'un courrier.
create or replace function public.journaliser(p_action text, p_document uuid, p_details jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (document_id, acteur_id, action, details)
  values (p_document, auth.uid(), p_action, coalesce(p_details, '{}'::jsonb));
end;
$$;
revoke execute on function public.journaliser(text, uuid, jsonb) from public, anon, authenticated;

-- Un département « existe » s'il est porté par au moins un agent de l'organisation.
create or replace function public.departement_existe(p_organisation text, p_departement text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where organisation = p_organisation and departement = trim(coalesce(p_departement, ''))
      and trim(coalesce(p_departement, '')) <> ''
  );
$$;
revoke execute on function public.departement_existe(text, text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 1. Rôles du courrier
-- -----------------------------------------------------------------------------

alter table public.profiles add column if not exists role_courrier text check (role_courrier in ('agent', 'chef'));

create function public.role_courrier()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select (select p.role_courrier from public.profiles p where p.id = auth.uid());
$$;

create function public.definir_role_courrier(p_profil uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moi   public.profiles;
  v_cible public.profiles;
begin
  select * into v_moi from public.profiles where id = auth.uid();
  select * into v_cible from public.profiles where id = p_profil for update;
  if v_moi.id is null or v_moi.role <> 'administrateur' or v_cible.id is null
     or v_cible.organisation <> v_moi.organisation then
    raise exception 'Action réservée aux administrateurs de l''organisation' using errcode = '42501';
  end if;
  if p_role is not null and p_role not in ('agent', 'chef') then
    raise exception 'Rôle de courrier inconnu' using errcode = '22023';
  end if;
  if v_cible.id = v_moi.id then
    raise exception 'Un administrateur ne se désigne pas lui-même pour le courrier' using errcode = '42501';
  end if;
  update public.profiles set role_courrier = p_role where id = p_profil;
  perform public.journaliser('profil.role_courrier', null, jsonb_build_object('profil', p_profil, 'role', p_role));
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Tables
-- -----------------------------------------------------------------------------

create table public.compteurs_courrier (
  organisation text not null,
  annee        int  not null,
  dernier      int  not null default 0,
  primary key (organisation, annee)
);

create table public.courriers (
  id                 uuid primary key default gen_random_uuid(),
  organisation       text not null,
  numero             text not null,
  annee              int  not null,
  recu_le            timestamptz not null default clock_timestamp(),
  expediteur         text not null check (length(expediteur) between 1 and 300),
  reference_expediteur text check (reference_expediteur is null or length(reference_expediteur) <= 200),
  date_lettre        date,
  mode_reception     text not null check (mode_reception in ('depot', 'poste', 'coursier', 'huissier', 'autre')),
  nature             text not null check (nature in ('lettre', 'pli', 'colis', 'recommande', 'autre')),
  nb_pieces          int  not null default 1 check (nb_pieces between 1 and 999),
  objet              text check (objet is null or length(objet) <= 500),
  caractere          text not null default 'ordinaire' check (caractere in ('ordinaire', 'urgent', 'personnel')),
  departement        text not null check (length(departement) between 1 and 100),
  destinataire_id    uuid references public.profiles (id),
  affecte_a          uuid references public.profiles (id),
  instruction        text check (instruction is null or length(instruction) <= 1000),
  echeance           date,
  statut             text not null default 'recu' check (statut in ('recu', 'remis', 'traite', 'classe', 'annule')),
  remise_declaree_le timestamptz,
  remise_declaree_par uuid references public.profiles (id),
  decharge_le        timestamptz,
  decharge_par       uuid references public.profiles (id),
  decharge_mode      text check (decharge_mode in ('application', 'papier')),
  code_suivi         text not null,
  annule_motif       text,
  enregistre_par     uuid not null references public.profiles (id),
  created_at         timestamptz not null default clock_timestamp(),
  updated_at         timestamptz not null default clock_timestamp(),
  unique (organisation, numero),
  -- Un pli personnel : destinataire nommé, et aucun objet (le service n'y lit rien).
  constraint courrier_personnel check (caractere <> 'personnel' or (destinataire_id is not null and objet is null))
);
create index idx_courriers_recu on public.courriers (organisation, recu_le desc);
create index idx_courriers_dest on public.courriers (destinataire_id) where destinataire_id is not null;
create index idx_courriers_departement on public.courriers (organisation, departement);

create table public.courrier_pieces (
  id               uuid primary key default gen_random_uuid(),
  courrier_id      uuid not null references public.courriers (id) on delete restrict,
  chemin_fichier   text not null unique,
  nom_fichier      text not null check (length(nom_fichier) between 1 and 200),
  taille           bigint not null check (taille > 0),
  empreinte_sha256 text not null check (empreinte_sha256 ~ '^[0-9a-f]{64}$'),
  nature           text not null default 'scan' check (nature in ('scan', 'decharge')),
  ajoute_par       uuid not null references public.profiles (id),
  created_at       timestamptz not null default clock_timestamp(),
  constraint courrier_piece_chemin check (split_part(chemin_fichier, '/', 1) = courrier_id::text)
);
create index idx_courrier_pieces on public.courrier_pieces (courrier_id);

create table public.courrier_mouvements (
  id          bigint generated always as identity primary key,
  courrier_id uuid not null references public.courriers (id) on delete restrict,
  action      text not null,
  par         uuid references public.profiles (id),
  details     jsonb not null default '{}',
  created_at  timestamptz not null default clock_timestamp()
);
create index idx_courrier_mouvements on public.courrier_mouvements (courrier_id, created_at);

-- -----------------------------------------------------------------------------
-- 3. Qui voit quoi
-- -----------------------------------------------------------------------------

-- Un courrier me CONCERNE comme destinataire : nominatif ; imputé à moi ; ou — hors pli personnel —
-- validateur (responsable) du département destinataire.
create function public.courrier_me_concerne(p_courrier uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.courriers c
    join public.profiles p on p.id = auth.uid() and p.organisation = c.organisation
    where c.id = p_courrier
      and (
        c.destinataire_id = p.id or c.affecte_a = p.id
        or (c.caractere <> 'personnel' and p.role = 'validateur' and p.departement = c.departement)
      )
  );
$$;

-- Lecture : le service du courrier (enveloppe) ou un concerné. Ni administrateur ni
-- super administrateur, sauf s'ils sont eux-mêmes concernés ou du service du courrier.
create function public.peut_lire_courrier(p_courrier uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.courriers c
    join public.profiles p on p.id = auth.uid() and p.organisation = c.organisation
    where c.id = p_courrier
      and (p.role_courrier is not null or public.courrier_me_concerne(c.id))
  );
$$;

-- Les pièces numérisées : jamais pour un pli personnel (il n'est pas numérisé).
create function public.peut_lire_piece_courrier(p_chemin text)
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
  );
$$;

create function public.peut_deposer_piece_courrier(p_chemin text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select p_chemin ~ '^[0-9a-f-]{36}/[^/]+$'
    and public.role_courrier() is not null
    and exists (
      select 1 from public.courriers c
      where c.id::text = split_part(p_chemin, '/', 1) and c.organisation = public.mon_organisation()
        and c.caractere <> 'personnel' and c.statut <> 'annule'
    );
$$;

-- -----------------------------------------------------------------------------
-- 4. Droits et RLS (lecture seule ; toute écriture passe par les fonctions)
-- -----------------------------------------------------------------------------

revoke all on table public.compteurs_courrier, public.courriers, public.courrier_pieces, public.courrier_mouvements
  from anon, authenticated;
revoke all on sequence public.courrier_mouvements_id_seq from anon, authenticated;
grant select on public.courriers, public.courrier_pieces, public.courrier_mouvements to authenticated;
alter table public.compteurs_courrier enable row level security;   -- aucun accès direct
alter table public.courriers enable row level security;
alter table public.courrier_pieces enable row level security;
alter table public.courrier_mouvements enable row level security;

create policy courriers_lecture on public.courriers
  for select to authenticated using (public.peut_lire_courrier(id));
create policy pieces_courrier_lecture on public.courrier_pieces
  for select to authenticated using (public.peut_lire_piece_courrier(chemin_fichier));
create policy mouvements_courrier_lecture on public.courrier_mouvements
  for select to authenticated using (public.peut_lire_courrier(courrier_id));

-- Archive privée des scans : un dossier par courrier ; dépôt par le service du courrier ;
-- ni modification ni suppression (un scan déposé est immuable). Le MFA s'applique à tout le stockage.
insert into storage.buckets (id, name, public) values ('courrier', 'courrier', false) on conflict (id) do nothing;

create policy courrier_fichiers_lecture on storage.objects
  for select to authenticated
  using (bucket_id = 'courrier' and public.peut_lire_piece_courrier(name));
create policy courrier_fichiers_depot on storage.objects
  for insert to authenticated
  with check (bucket_id = 'courrier' and lower(name) like '%.pdf' and public.peut_deposer_piece_courrier(name));

-- -----------------------------------------------------------------------------
-- 5. Fonctions
-- -----------------------------------------------------------------------------

-- Mouvement + journal d'audit (interne).
create function public.mouvement_courrier(p_courrier uuid, p_action text, p_details jsonb default '{}')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.courrier_mouvements (courrier_id, action, par, details) values (p_courrier, p_action, auth.uid(), p_details);
  update public.courriers set updated_at = clock_timestamp() where id = p_courrier;
  perform public.journaliser('courrier.' || p_action, null, jsonb_build_object('courrier', p_courrier) || p_details);
end;
$$;

create function public.enregistrer_courrier(
  p_expediteur text,
  p_reference  text,
  p_date_lettre date,
  p_mode       text,
  p_nature     text,
  p_nb_pieces  int,
  p_objet      text,
  p_caractere  text,
  p_departement text,
  p_destinataire uuid,
  p_echeance   date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moi    public.profiles;
  v_annee  int := extract(year from (now() at time zone 'Africa/Douala'))::int;
  v_n      int;
  v_id     uuid;
  v_dest   public.profiles;
  v_exp    text := left(trim(coalesce(p_expediteur, '')), 300);
begin
  select * into v_moi from public.profiles where id = auth.uid();
  if v_moi.id is null or v_moi.role_courrier is null then
    raise exception 'Action réservée au service du courrier' using errcode = '42501';
  end if;
  if v_exp = '' then
    raise exception 'Indiquez l''expéditeur' using errcode = '22023';
  end if;
  if coalesce(p_caractere, 'ordinaire') not in ('ordinaire', 'urgent', 'personnel') then
    raise exception 'Caractère inconnu' using errcode = '22023';
  end if;
  if not public.departement_existe(v_moi.organisation, p_departement) then
    raise exception 'Département destinataire inconnu' using errcode = '42501';
  end if;
  if p_destinataire is not null then
    select * into v_dest from public.profiles
    where id = p_destinataire and organisation = v_moi.organisation;
    if v_dest.id is null then
      raise exception 'Destinataire inconnu ou inactif' using errcode = '42501';
    end if;
  end if;
  if p_caractere = 'personnel' and p_destinataire is null then
    raise exception 'Un pli personnel doit avoir un destinataire nommé' using errcode = '22023';
  end if;

  insert into public.compteurs_courrier as c (organisation, annee, dernier)
  values (v_moi.organisation, v_annee, 1)
  on conflict (organisation, annee) do update set dernier = c.dernier + 1
  returning dernier into v_n;

  insert into public.courriers (
    organisation, numero, annee, expediteur, reference_expediteur, date_lettre, mode_reception, nature, nb_pieces,
    objet, caractere, departement, destinataire_id, echeance, code_suivi, enregistre_par
  ) values (
    v_moi.organisation, 'ARR-' || v_annee || '-' || lpad(v_n::text, 6, '0'), v_annee, v_exp,
    nullif(left(trim(coalesce(p_reference, '')), 200), ''), p_date_lettre, p_mode, p_nature, coalesce(p_nb_pieces, 1),
    case when p_caractere = 'personnel' then null else nullif(left(trim(coalesce(p_objet, '')), 500), '') end,
    coalesce(p_caractere, 'ordinaire'), trim(p_departement), p_destinataire, p_echeance,
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)), v_moi.id
  ) returning id into v_id;
  perform public.mouvement_courrier(v_id, 'enregistre', jsonb_build_object('caractere', coalesce(p_caractere, 'ordinaire')));
  return v_id;
end;
$$;

-- Enregistre un scan déjà déposé dans l'archive (le navigateur dépose, le serveur relit et calcule
-- l'empreinte, puis appelle cette fonction).
create function public.ajouter_piece_courrier(p_courrier uuid, p_chemin text, p_nom text, p_taille bigint, p_empreinte text, p_nature text default 'scan')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c  public.courriers;
  v_id uuid;
begin
  if public.role_courrier() is null then
    raise exception 'Action réservée au service du courrier' using errcode = '42501';
  end if;
  select * into v_c from public.courriers where id = p_courrier and organisation = public.mon_organisation() for update;
  if v_c.id is null or v_c.caractere = 'personnel' or v_c.statut = 'annule' then
    raise exception 'Ce courrier ne peut pas être numérisé' using errcode = '42501';
  end if;
  if p_nature not in ('scan', 'decharge') then
    raise exception 'Nature de pièce inconnue' using errcode = '22023';
  end if;
  if split_part(p_chemin, '/', 1) <> p_courrier::text
     or not exists (select 1 from storage.objects where bucket_id = 'courrier' and name = p_chemin) then
    raise exception 'Fichier introuvable dans l''archive' using errcode = '42501';
  end if;
  insert into public.courrier_pieces (courrier_id, chemin_fichier, nom_fichier, taille, empreinte_sha256, nature, ajoute_par)
  values (p_courrier, p_chemin, left(p_nom, 200), p_taille, p_empreinte, p_nature, auth.uid())
  returning id into v_id;
  perform public.mouvement_courrier(p_courrier, case when p_nature = 'scan' then 'numerise' else 'decharge_scannee' end,
    jsonb_build_object('piece', v_id, 'empreinte', p_empreinte));
  return v_id;
end;
$$;

-- Le service déclare avoir remis (ou mis à disposition) le pli : le destinataire est invité à accuser réception.
create function public.declarer_remise_courrier(p_courrier uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_c public.courriers;
begin
  if public.role_courrier() is null then
    raise exception 'Action réservée au service du courrier' using errcode = '42501';
  end if;
  select * into v_c from public.courriers where id = p_courrier and organisation = public.mon_organisation() for update;
  if v_c.id is null or v_c.statut <> 'recu' then
    raise exception 'Ce courrier n''est plus à remettre' using errcode = '42501';
  end if;
  update public.courriers set remise_declaree_le = clock_timestamp(), remise_declaree_par = auth.uid() where id = p_courrier;
  perform public.mouvement_courrier(p_courrier, 'remise_declaree');
end;
$$;

-- Décharge papier : le service a fait signer le destinataire sur papier (le scan de la décharge est facultatif).
create function public.decharge_papier_courrier(p_courrier uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_c public.courriers;
begin
  if public.role_courrier() is null then
    raise exception 'Action réservée au service du courrier' using errcode = '42501';
  end if;
  select * into v_c from public.courriers where id = p_courrier and organisation = public.mon_organisation() for update;
  if v_c.id is null or v_c.statut <> 'recu' then
    raise exception 'Ce courrier n''est plus à remettre' using errcode = '42501';
  end if;
  update public.courriers
  set statut = 'remis', decharge_le = clock_timestamp(), decharge_par = auth.uid(), decharge_mode = 'papier',
      remise_declaree_le = coalesce(remise_declaree_le, clock_timestamp()), remise_declaree_par = coalesce(remise_declaree_par, auth.uid())
  where id = p_courrier;
  perform public.mouvement_courrier(p_courrier, 'decharge', jsonb_build_object('mode', 'papier'));
end;
$$;

-- Accusé de réception par le destinataire (ou, pour un courrier adressé à un département seul, par son
-- responsable) : décharge électronique, horodatée.
create function public.accuser_reception_courrier(p_courrier uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_c public.courriers;
begin
  select * into v_c from public.courriers where id = p_courrier for update;
  if v_c.id is null or not public.courrier_me_concerne(p_courrier) or v_c.statut <> 'recu' then
    raise exception 'Accusé de réception impossible' using errcode = '42501';
  end if;
  -- Un courrier nominatif n'est accusé que par son destinataire (ou la personne à qui il est imputé).
  if v_c.destinataire_id is not null and v_c.destinataire_id <> auth.uid() and v_c.affecte_a is distinct from auth.uid() then
    raise exception 'Seul le destinataire nommé accuse réception' using errcode = '42501';
  end if;
  update public.courriers
  set statut = 'remis', decharge_le = clock_timestamp(), decharge_par = auth.uid(), decharge_mode = 'application'
  where id = p_courrier;
  perform public.mouvement_courrier(p_courrier, 'decharge', jsonb_build_object('mode', 'application'));
end;
$$;

-- Imputation : le validateur du département destinataire confie le courrier à un agent de son département,
-- avec une instruction.
create function public.imputer_courrier(p_courrier uuid, p_agent uuid, p_instruction text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c    public.courriers;
  v_moi  public.profiles;
  v_cible public.profiles;
begin
  select * into v_moi from public.profiles where id = auth.uid();
  select * into v_c from public.courriers where id = p_courrier for update;
  if v_moi.id is null or v_c.id is null or v_c.organisation <> v_moi.organisation or v_c.caractere = 'personnel'
     or v_c.statut in ('annule', 'classe') or v_moi.role <> 'validateur' or v_moi.departement <> v_c.departement then
    raise exception 'Imputation réservée au responsable du département destinataire' using errcode = '42501';
  end if;
  select * into v_cible from public.profiles
  where id = p_agent and organisation = v_moi.organisation;
  if v_cible.id is null or v_cible.departement <> v_moi.departement then
    raise exception 'Cet agent n''est pas dans votre département' using errcode = '42501';
  end if;
  update public.courriers set affecte_a = p_agent, instruction = nullif(left(trim(coalesce(p_instruction, '')), 1000), '') where id = p_courrier;
  perform public.mouvement_courrier(p_courrier, 'impute', jsonb_build_object('agent', p_agent));
end;
$$;

-- Suites : traité ou classé, par un concerné, une fois le courrier remis.
create function public.changer_statut_courrier(p_courrier uuid, p_statut text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_c public.courriers;
begin
  select * into v_c from public.courriers where id = p_courrier for update;
  if p_statut not in ('traite', 'classe') then
    raise exception 'Statut inconnu' using errcode = '22023';
  end if;
  if v_c.id is null or not public.courrier_me_concerne(p_courrier) or v_c.statut not in ('remis', 'traite') then
    raise exception 'Changement de statut impossible' using errcode = '42501';
  end if;
  if v_c.destinataire_id is not null and v_c.destinataire_id <> auth.uid() and v_c.affecte_a is distinct from auth.uid()
     and v_c.caractere = 'personnel' then
    raise exception 'Seul le destinataire nommé traite un pli personnel' using errcode = '42501';
  end if;
  update public.courriers set statut = p_statut where id = p_courrier;
  perform public.mouvement_courrier(p_courrier, p_statut);
end;
$$;

-- Chef du courrier : annulation et correction, toujours motivées. Rien ne s'efface.
create function public.annuler_courrier(p_courrier uuid, p_motif text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c public.courriers;
  v_motif text := trim(coalesce(p_motif, ''));
begin
  if public.role_courrier() is distinct from 'chef' then
    raise exception 'Action réservée au chef du courrier' using errcode = '42501';
  end if;
  if length(v_motif) < 5 then
    raise exception 'Indiquez le motif (5 caractères au moins)' using errcode = '22023';
  end if;
  select * into v_c from public.courriers where id = p_courrier and organisation = public.mon_organisation() for update;
  if v_c.id is null or v_c.statut = 'annule' then
    raise exception 'Courrier introuvable ou déjà annulé' using errcode = '42501';
  end if;
  update public.courriers set statut = 'annule', annule_motif = left(v_motif, 500) where id = p_courrier;
  perform public.mouvement_courrier(p_courrier, 'annule', jsonb_build_object('motif', left(v_motif, 500)));
end;
$$;

create function public.corriger_courrier(
  p_courrier uuid, p_expediteur text, p_reference text, p_objet text, p_departement text, p_destinataire uuid, p_motif text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c public.courriers;
  v_motif text := trim(coalesce(p_motif, ''));
begin
  if public.role_courrier() is distinct from 'chef' then
    raise exception 'Action réservée au chef du courrier' using errcode = '42501';
  end if;
  if length(v_motif) < 5 then
    raise exception 'Indiquez le motif (5 caractères au moins)' using errcode = '22023';
  end if;
  select * into v_c from public.courriers where id = p_courrier and organisation = public.mon_organisation() for update;
  if v_c.id is null or v_c.statut = 'annule' then
    raise exception 'Courrier introuvable ou annulé' using errcode = '42501';
  end if;
  if not public.departement_existe(v_c.organisation, p_departement) then
    raise exception 'Département destinataire inconnu' using errcode = '42501';
  end if;
  if p_destinataire is not null and not exists (
    select 1 from public.profiles where id = p_destinataire and organisation = v_c.organisation) then
    raise exception 'Destinataire inconnu' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_expediteur, ''))) = 0 then
    raise exception 'Indiquez l''expéditeur' using errcode = '22023';
  end if;
  if v_c.caractere = 'personnel' and p_destinataire is null then
    raise exception 'Un pli personnel doit avoir un destinataire nommé' using errcode = '22023';
  end if;
  update public.courriers
  set expediteur = left(trim(p_expediteur), 300),
      reference_expediteur = nullif(left(trim(coalesce(p_reference, '')), 200), ''),
      objet = case when v_c.caractere = 'personnel' then null else nullif(left(trim(coalesce(p_objet, '')), 500), '') end,
      departement = trim(p_departement), destinataire_id = p_destinataire
  where id = p_courrier;
  perform public.mouvement_courrier(p_courrier, 'corrige', jsonb_build_object(
    'motif', left(v_motif, 500),
    'avant', jsonb_build_object('expediteur', v_c.expediteur, 'reference', v_c.reference_expediteur, 'objet', v_c.objet,
                                'departement', v_c.departement, 'destinataire', v_c.destinataire_id)));
end;
$$;

-- Pastilles : à remettre (service du courrier) + à retirer (concerné, décharge attendue).
create function public.pastilles_courrier()
returns int
language sql
stable
set search_path = public
as $$
  select
    case when public.role_courrier() is not null
         then (select count(*)::int from public.courriers c where c.statut = 'recu' and c.remise_declaree_le is null) else 0 end
    + (select count(*)::int from public.courriers c
       where c.statut = 'recu' and public.courrier_me_concerne(c.id)
         and (c.destinataire_id = auth.uid() or c.affecte_a = auth.uid() or c.remise_declaree_le is not null));
$$;

-- Registre exportable : service du courrier seulement ; l'export est journalisé.
create function public.registre_courrier(p_debut date, p_fin date)
returns table (
  numero text, recu_le timestamptz, expediteur text, reference_expediteur text, date_lettre date,
  mode_reception text, nature text, nb_pieces int, objet text, caractere text,
  departement text, destinataire text, statut text, decharge_le timestamptz, decharge_mode text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.role_courrier() is null then
    raise exception 'Action réservée au service du courrier' using errcode = '42501';
  end if;
  perform public.journaliser('courrier.registre', null, jsonb_build_object('debut', p_debut, 'fin', p_fin));
  return query
  select c.numero, c.recu_le, c.expediteur, c.reference_expediteur, c.date_lettre, c.mode_reception, c.nature, c.nb_pieces,
         c.objet, c.caractere, c.departement, pr.nom_complet, c.statut, c.decharge_le, c.decharge_mode
  from public.courriers c
  left join public.profiles pr on pr.id = c.destinataire_id
  where c.organisation = public.mon_organisation()
    and (c.recu_le at time zone 'Africa/Douala')::date between coalesce(p_debut, date '2000-01-01') and coalesce(p_fin, date '2999-12-31')
  order by c.recu_le;
end;
$$;


-- -----------------------------------------------------------------------------
-- Privilèges d'exécution : fermés, puis ouverts aux seuls agents connectés
-- -----------------------------------------------------------------------------

revoke execute on function
  public.role_courrier(), public.definir_role_courrier(uuid, text),
  public.courrier_me_concerne(uuid), public.peut_lire_courrier(uuid),
  public.peut_lire_piece_courrier(text), public.peut_deposer_piece_courrier(text),
  public.mouvement_courrier(uuid, text, jsonb),
  public.enregistrer_courrier(text, text, date, text, text, int, text, text, text, uuid, date),
  public.ajouter_piece_courrier(uuid, text, text, bigint, text, text),
  public.declarer_remise_courrier(uuid), public.decharge_papier_courrier(uuid),
  public.accuser_reception_courrier(uuid), public.imputer_courrier(uuid, uuid, text),
  public.changer_statut_courrier(uuid, text), public.annuler_courrier(uuid, text),
  public.corriger_courrier(uuid, text, text, text, text, uuid, text),
  public.pastilles_courrier(), public.registre_courrier(date, date)
from public, anon, authenticated;
grant execute on function
  public.role_courrier(), public.definir_role_courrier(uuid, text),
  public.courrier_me_concerne(uuid), public.peut_lire_courrier(uuid),
  public.peut_lire_piece_courrier(text), public.peut_deposer_piece_courrier(text),
  public.enregistrer_courrier(text, text, date, text, text, int, text, text, text, uuid, date),
  public.ajouter_piece_courrier(uuid, text, text, bigint, text, text),
  public.declarer_remise_courrier(uuid), public.decharge_papier_courrier(uuid),
  public.accuser_reception_courrier(uuid), public.imputer_courrier(uuid, uuid, text),
  public.changer_statut_courrier(uuid, text), public.annuler_courrier(uuid, text),
  public.corriger_courrier(uuid, text, text, text, text, uuid, text),
  public.pastilles_courrier(), public.registre_courrier(date, date)
to authenticated;

-- ----------------------------------------------------------------------------
-- Double authentification (migration 0027) sur les nouvelles tables
-- ----------------------------------------------------------------------------
do $$
declare
  v_table text;
begin
  foreach v_table in array array['compteurs_courrier', 'courriers', 'courrier_pieces', 'courrier_mouvements']
  loop
    execute format('drop policy if exists "mfa_obligatoire" on public.%I', v_table);
    execute format(
      'create policy "mfa_obligatoire" on public.%I as restrictive for all to authenticated '
      'using (public.mfa_validee()) with check (public.mfa_validee())',
      v_table
    );
  end loop;
end $$;
