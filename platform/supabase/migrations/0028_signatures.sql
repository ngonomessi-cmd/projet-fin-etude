-- ============================================================================
-- Signature des documents — première qualité : le Directeur Général (DG).
--
-- Deux natures de signature, au choix pour chaque document :
--   - ÉLECTRONIQUE (circulation interne) : le serveur appose l'image de la
--     signature enregistrée du signataire, son nom, la date, un numéro et un
--     QR code de vérification sur le PDF du document ;
--   - MANUSCRITE + CACHET (documents officiels) : le serveur produit un BON À
--     SIGNER numéroté (zone « Signature et cachet » + QR code) ; on l'imprime,
--     le DG signe et cachette, on dépose le scan, qui devient l'original.
--
-- Garanties :
--   - seule la personne désignée « titulaire » de la qualité (ex. DG), ou son
--     délégataire pendant la durée de la délégation, peut signer ;
--   - le code Google Authenticator est redemandé à chaque signature
--     (5 codes faux en 15 minutes : signature suspendue) ;
--   - seuls les documents validés ou publiés se signent ; le PDF signé est
--     produit par le serveur, stocké et scellé par une empreinte SHA-256 ;
--   - un registre sans écriture directe ni suppression ; un numéro
--     abandonné reste visible ; un document signé ne se supprime pas ;
--   - n'importe qui peut vérifier un document papier ou PDF avec son numéro
--     ou son QR code (page publique /verifier), qui ne révèle jamais le titre
--     ni le contenu ;
--   - chaque geste est inscrit au journal d'audit.
--
-- Les autres qualités (directeurs, chefs de service…) s'ajouteront à la table
-- qualites_signature quand l'organigramme sera arrêté : rien d'autre à
-- changer.
--
-- À exécuter après la migration 0027.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Qualités au titre desquelles on signe
-- ----------------------------------------------------------------------------
create table if not exists public.qualites_signature (
  code text primary key check (code ~ '^[A-Z][A-Z0-9]{1,9}$'),
  intitule text not null,      -- avec l'article, tel qu'imprimé : « Le Directeur Général »
  intitule_en text not null,   -- « The Director General »
  ordre integer not null default 100,
  created_at timestamptz not null default now()
);

insert into public.qualites_signature (code, intitule, intitule_en, ordre)
values ('DG', 'Le Directeur Général', 'The Director General', 1)
on conflict (code) do nothing;

-- Qui occupe la qualité, par organisation (désigné par l'administrateur).
create table if not exists public.titulaires_signature (
  organisation text not null,
  qualite text not null references public.qualites_signature (code),
  profil_id uuid not null references public.profiles (id) on delete cascade,
  depuis timestamptz not null default now(),
  designe_par uuid references public.profiles (id) on delete set null,
  primary key (organisation, qualite)
);

-- Délégations de signature, nominatives et bornées dans le temps (1 an max).
create table if not exists public.delegations_signature (
  id uuid primary key default gen_random_uuid(),
  organisation text not null,
  qualite text not null references public.qualites_signature (code),
  delegant_id uuid references public.profiles (id) on delete set null,
  delegataire_id uuid references public.profiles (id) on delete set null,
  delegant_nom text not null,
  delegataire_nom text not null,
  titre_delegataire text not null check (char_length(trim(titre_delegataire)) between 2 and 120),
  debut timestamptz not null default now(),
  fin timestamptz not null,
  objet text check (objet is null or char_length(objet) <= 500),
  reference_acte text check (reference_acte is null or char_length(reference_acte) <= 120),
  cree_le timestamptz not null default now(),
  revoquee_le timestamptz,
  revoquee_par uuid references public.profiles (id) on delete set null,
  motif_revocation text,
  constraint ck_delegation_duree check (fin > debut and fin <= debut + interval '366 days'),
  constraint ck_delegation_personnes check (delegataire_id is null or delegant_id is null or delegataire_id <> delegant_id)
);
create index if not exists idx_delegations_delegataire on public.delegations_signature (delegataire_id);

-- Image de la signature de chaque agent (fichier dans le bucket privé).
create table if not exists public.specimens_signature (
  profil_id uuid primary key references public.profiles (id) on delete cascade,
  chemin text not null,
  largeur integer not null check (largeur > 0),
  hauteur integer not null check (hauteur > 0),
  depose_le timestamptz not null default now()
);

-- Numérotation : un compteur par organisation, qualité et année.
create table if not exists public.compteurs_signature (
  organisation text not null,
  qualite text not null,
  annee integer not null,
  dernier integer not null default 0,
  primary key (organisation, qualite, annee)
);

-- ----------------------------------------------------------------------------
-- 2. Registre des signatures
-- ----------------------------------------------------------------------------
create table if not exists public.signatures (
  id uuid primary key default gen_random_uuid(),
  organisation text not null,
  document_id uuid references public.documents (id) on delete set null,
  -- Figés au moment de la signature : la vérification survit au document.
  reference_document text,
  titre_document text not null,
  classification_document public.classification_document,
  nature text not null check (nature in ('electronique', 'manuscrite')),
  qualite text not null references public.qualites_signature (code),
  intitule text not null,
  intitule_en text not null,
  numero text not null unique,
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{12}$'),
  langue text not null default 'fr' check (langue in ('fr', 'en')),
  signataire_id uuid references public.profiles (id) on delete set null,
  signataire_nom text,
  delegation_id uuid references public.delegations_signature (id),
  titre_delegataire text,
  statut text not null default 'en_preparation'
    check (statut in ('en_preparation', 'attente_original', 'valide', 'revoquee', 'abandonnee')),
  cree_par uuid references public.profiles (id) on delete set null,
  cree_par_nom text,
  cree_le timestamptz not null default now(),
  signe_le timestamptz,
  chemin_pdf text,
  empreinte_pdf text,
  chemin_original text,
  empreinte_original text,
  original_depose_le timestamptz,
  original_depose_par uuid references public.profiles (id) on delete set null,
  revoquee_le timestamptz,
  revoquee_par uuid references public.profiles (id) on delete set null,
  motif_revocation text
);

-- Une seule signature « vivante » par document.
create unique index if not exists ux_signature_vivante_document
  on public.signatures (document_id)
  where statut in ('en_preparation', 'attente_original', 'valide');
create index if not exists idx_signatures_organisation on public.signatures (organisation, cree_le desc);

-- Plafonds : page publique de vérification, codes Google Authenticator faux.
create table if not exists public.verifications_signature (
  ip_hash text not null,
  le timestamptz not null default now()
);
create index if not exists idx_verifications_signature on public.verifications_signature (ip_hash, le);

create table if not exists public.echecs_code_signature (
  profil_id uuid not null references public.profiles (id) on delete cascade,
  le timestamptz not null default now()
);
create index if not exists idx_echecs_code_signature on public.echecs_code_signature (profil_id, le);

-- ----------------------------------------------------------------------------
-- 3. Droits : lecture seule, aucune écriture directe (tout passe par les
--    fonctions ci-dessous), double authentification exigée (cf. 0027).
-- ----------------------------------------------------------------------------
alter table public.qualites_signature enable row level security;
alter table public.titulaires_signature enable row level security;
alter table public.delegations_signature enable row level security;
alter table public.specimens_signature enable row level security;
alter table public.compteurs_signature enable row level security;
alter table public.signatures enable row level security;
alter table public.verifications_signature enable row level security;
alter table public.echecs_code_signature enable row level security;

revoke all on public.qualites_signature, public.titulaires_signature, public.delegations_signature,
  public.specimens_signature, public.compteurs_signature, public.signatures,
  public.verifications_signature, public.echecs_code_signature
  from anon, authenticated;
grant select on public.qualites_signature, public.titulaires_signature, public.delegations_signature,
  public.specimens_signature, public.signatures
  to authenticated;

drop policy if exists "qualites_lecture" on public.qualites_signature;
create policy "qualites_lecture" on public.qualites_signature
  for select to authenticated using (true);

drop policy if exists "titulaires_lecture_organisation" on public.titulaires_signature;
create policy "titulaires_lecture_organisation" on public.titulaires_signature
  for select to authenticated using (organisation = public.mon_organisation());

drop policy if exists "delegations_lecture_organisation" on public.delegations_signature;
create policy "delegations_lecture_organisation" on public.delegations_signature
  for select to authenticated using (organisation = public.mon_organisation());

drop policy if exists "specimen_lecture_titulaire" on public.specimens_signature;
create policy "specimen_lecture_titulaire" on public.specimens_signature
  for select to authenticated using (profil_id = auth.uid());

-- Est titulaire de la qualité dans son organisation ?
create or replace function public.est_titulaire_signature(p_qualite text, p_profil uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.titulaires_signature t
    join public.profiles p on p.id = t.profil_id
    where t.qualite = p_qualite and t.profil_id = p_profil and t.organisation = p.organisation
  );
$$;
revoke execute on function public.est_titulaire_signature(text, uuid) from public, anon;
grant execute on function public.est_titulaire_signature(text, uuid) to authenticated, service_role;

-- Registre : visible par le signataire, la personne qui a préparé, le
-- titulaire de la qualité, l'administrateur et l'auditeur de l'organisation,
-- et quiconque peut lire le document signé.
create or replace function public.peut_voir_signature(s public.signatures)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.organisation = s.organisation
      and (
        s.signataire_id = auth.uid()
        or s.cree_par = auth.uid()
        or p.role in ('administrateur', 'auditeur')
        or public.est_titulaire_signature(s.qualite)
        or (
          s.document_id is not null
          and exists (select 1 from public.documents d where d.id = s.document_id and public.peut_lire_document(d))
        )
      )
  );
$$;
revoke execute on function public.peut_voir_signature(public.signatures) from public, anon;
grant execute on function public.peut_voir_signature(public.signatures) to authenticated;

drop policy if exists "signatures_lecture" on public.signatures;
create policy "signatures_lecture" on public.signatures
  for select to authenticated using (public.peut_voir_signature(signatures));

-- Double authentification (migration 0027) sur les nouvelles tables.
do $$
declare
  v_table text;
begin
  foreach v_table in array array['qualites_signature', 'titulaires_signature', 'delegations_signature',
    'specimens_signature', 'compteurs_signature', 'signatures', 'verifications_signature', 'echecs_code_signature']
  loop
    execute format('drop policy if exists "mfa_obligatoire" on public.%I', v_table);
    execute format(
      'create policy "mfa_obligatoire" on public.%I as restrictive for all to authenticated '
      'using (public.mfa_validee()) with check (public.mfa_validee())',
      v_table
    );
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 4. Protections posées par la base
-- ----------------------------------------------------------------------------
-- Le registre ne perd jamais une ligne, et l'identité d'une signature
-- (numéro, code, qualité, signataire, document) ne change jamais.
create or replace function public.proteger_signature()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Registre des signatures : suppression interdite (n° %).', old.numero;
  end if;
  new.id := old.id;
  new.organisation := old.organisation;
  new.numero := old.numero;
  new.code := old.code;
  new.nature := old.nature;
  new.qualite := old.qualite;
  new.intitule := old.intitule;
  new.intitule_en := old.intitule_en;
  new.titre_document := old.titre_document;
  new.reference_document := old.reference_document;
  new.classification_document := old.classification_document;
  new.delegation_id := old.delegation_id;
  new.titre_delegataire := old.titre_delegataire;
  new.cree_le := old.cree_le;
  new.signataire_nom := old.signataire_nom;
  -- Seule évolution autorisée du lien au document : sa suppression (on delete set null).
  if new.document_id is not null then
    new.document_id := old.document_id;
  end if;
  if old.statut in ('revoquee', 'abandonnee') and new.statut <> old.statut then
    raise exception 'Signature % : état définitif.', old.numero;
  end if;
  return new;
end;
$$;

drop trigger if exists declencheur_proteger_signature on public.signatures;
create trigger declencheur_proteger_signature
  before update or delete on public.signatures
  for each row execute function public.proteger_signature();

-- Un document qui porte une signature en cours ou valide ne se supprime pas.
create or replace function public.interdire_suppression_document_signe()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_numero text;
begin
  select numero into v_numero from public.signatures
  where document_id = old.id and statut in ('en_preparation', 'attente_original', 'valide')
  limit 1;
  if v_numero is not null then
    raise exception 'Document signé (n° %) : suppression interdite. Révoquez d''abord la signature.', v_numero;
  end if;
  return old;
end;
$$;

drop trigger if exists declencheur_interdire_suppression_document_signe on public.documents;
create trigger declencheur_interdire_suppression_document_signe
  before delete on public.documents
  for each row execute function public.interdire_suppression_document_signe();

-- ----------------------------------------------------------------------------
-- 5. Titulaires et délégations
-- ----------------------------------------------------------------------------
-- Délégation en cours pour cette qualité. Elle tombe d'elle-même si le
-- délégant n'occupe plus la fonction.
create or replace function public.delegation_active(p_qualite text, p_profil uuid default auth.uid())
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select d.id
  from public.delegations_signature d
  join public.profiles p on p.id = p_profil
  join public.titulaires_signature t
    on t.organisation = d.organisation and t.qualite = d.qualite and t.profil_id = d.delegant_id
  where d.qualite = p_qualite
    and d.delegataire_id = p_profil
    and d.organisation = p.organisation
    and d.revoquee_le is null
    and now() >= d.debut and now() < d.fin
  order by d.cree_le desc
  limit 1;
$$;
revoke execute on function public.delegation_active(text, uuid) from public, anon;
grant execute on function public.delegation_active(text, uuid) to authenticated, service_role;

-- Qualités au titre desquelles l'utilisateur courant peut signer aujourd'hui.
create or replace function public.qualites_signature_disponibles()
returns table (
  qualite text,
  intitule text,
  intitule_en text,
  delegation_id uuid,
  titre_delegataire text,
  delegant_nom text,
  fin timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select q.code, q.intitule, q.intitule_en, null::uuid, null::text, null::text, null::timestamptz
  from public.qualites_signature q
  where public.est_titulaire_signature(q.code)
  union all
  select q.code, q.intitule, q.intitule_en, d.id, d.titre_delegataire, d.delegant_nom, d.fin
  from public.qualites_signature q
  join public.delegations_signature d on d.id = public.delegation_active(q.code)
  where not public.est_titulaire_signature(q.code);
$$;
revoke execute on function public.qualites_signature_disponibles() from public, anon;
grant execute on function public.qualites_signature_disponibles() to authenticated;

-- L'administrateur désigne (ou retire, p_profil_id null) le titulaire.
-- Changer de titulaire met fin aux délégations de son prédécesseur.
create or replace function public.designer_titulaire_signature(p_qualite text, p_profil_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moi public.profiles;
  v_cible public.profiles;
  v_ancien uuid;
begin
  select * into v_moi from public.profiles where id = auth.uid();
  if v_moi.id is null or v_moi.role <> 'administrateur' then
    raise exception 'Seul un administrateur désigne le titulaire d''une qualité de signature.';
  end if;
  if not exists (select 1 from public.qualites_signature where code = p_qualite) then
    raise exception 'Qualité de signature inconnue.';
  end if;
  if p_profil_id is not null then
    select * into v_cible from public.profiles where id = p_profil_id;
    if v_cible.id is null or v_cible.organisation <> v_moi.organisation then
      raise exception 'Utilisateur introuvable.';
    end if;
    if v_cible.role in ('auditeur', 'lecteur') then
      raise exception 'Un auditeur ou un lecteur ne peut pas être signataire.';
    end if;
  end if;

  select profil_id into v_ancien from public.titulaires_signature
  where organisation = v_moi.organisation and qualite = p_qualite;
  if v_ancien is not distinct from p_profil_id then
    return;
  end if;

  update public.delegations_signature
    set revoquee_le = now(), revoquee_par = auth.uid(), motif_revocation = 'Changement de titulaire'
  where organisation = v_moi.organisation and qualite = p_qualite and revoquee_le is null and fin > now();

  if p_profil_id is null then
    delete from public.titulaires_signature where organisation = v_moi.organisation and qualite = p_qualite;
  else
    insert into public.titulaires_signature (organisation, qualite, profil_id, depuis, designe_par)
      values (v_moi.organisation, p_qualite, p_profil_id, now(), auth.uid())
    on conflict (organisation, qualite) do update
      set profil_id = excluded.profil_id, depuis = excluded.depuis, designe_par = excluded.designe_par;
  end if;

  insert into public.audit_log (acteur_id, action, details)
    values (auth.uid(), 'titulaire_signature', jsonb_build_object(
      'qualite', p_qualite, 'ancien', v_ancien, 'nouveau', p_profil_id, 'nom', v_cible.nom_complet));
end;
$$;
revoke execute on function public.designer_titulaire_signature(text, uuid) from public, anon;
grant execute on function public.designer_titulaire_signature(text, uuid) to authenticated;

-- Le titulaire délègue sa signature, pour une durée d'un an au plus.
create or replace function public.deleguer_signature(
  p_qualite text,
  p_delegataire_id uuid,
  p_titre_delegataire text,
  p_debut timestamptz,
  p_fin timestamptz,
  p_objet text default null,
  p_reference_acte text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moi public.profiles;
  v_cible public.profiles;
  v_id uuid;
  v_debut timestamptz := coalesce(p_debut, now());
begin
  select * into v_moi from public.profiles where id = auth.uid();
  if v_moi.id is null or not public.est_titulaire_signature(p_qualite) then
    raise exception 'Seul le titulaire de la qualité peut déléguer sa signature.';
  end if;
  select * into v_cible from public.profiles where id = p_delegataire_id;
  if v_cible.id is null or v_cible.organisation <> v_moi.organisation then
    raise exception 'Utilisateur introuvable.';
  end if;
  if v_cible.id = v_moi.id then
    raise exception 'Vous ne pouvez pas vous déléguer votre propre signature.';
  end if;
  if v_cible.role in ('auditeur', 'lecteur') then
    raise exception 'Un auditeur ou un lecteur ne peut pas recevoir de délégation de signature.';
  end if;
  if p_fin is null or p_fin <= v_debut or p_fin > v_debut + interval '366 days' then
    raise exception 'Durée de délégation invalide : la fin doit suivre le début, un an au plus.';
  end if;
  if p_fin <= now() then
    raise exception 'La délégation serait déjà terminée.';
  end if;

  insert into public.delegations_signature (
    organisation, qualite, delegant_id, delegataire_id, delegant_nom, delegataire_nom,
    titre_delegataire, debut, fin, objet, reference_acte)
  values (
    v_moi.organisation, p_qualite, v_moi.id, v_cible.id, v_moi.nom_complet, v_cible.nom_complet,
    trim(p_titre_delegataire), v_debut, p_fin, nullif(trim(p_objet), ''), nullif(trim(p_reference_acte), ''))
  returning id into v_id;

  insert into public.audit_log (acteur_id, action, details)
    values (auth.uid(), 'delegation_signature', jsonb_build_object(
      'qualite', p_qualite, 'delegataire', v_cible.nom_complet, 'debut', v_debut, 'fin', p_fin, 'reference_acte', p_reference_acte));
  return v_id;
end;
$$;
revoke execute on function public.deleguer_signature(text, uuid, text, timestamptz, timestamptz, text, text) from public, anon;
grant execute on function public.deleguer_signature(text, uuid, text, timestamptz, timestamptz, text, text) to authenticated;

-- Révocation : par le titulaire actuel de la qualité, ou par l'administrateur.
create or replace function public.revoquer_delegation_signature(p_delegation_id uuid, p_motif text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moi public.profiles;
  v_d public.delegations_signature;
begin
  select * into v_moi from public.profiles where id = auth.uid();
  select * into v_d from public.delegations_signature where id = p_delegation_id for update;
  if v_d.id is null or v_moi.id is null or v_d.organisation <> v_moi.organisation then
    raise exception 'Délégation introuvable.';
  end if;
  if not (public.est_titulaire_signature(v_d.qualite) or v_moi.role = 'administrateur') then
    raise exception 'Seul le titulaire de la qualité ou un administrateur peut révoquer cette délégation.';
  end if;
  if v_d.revoquee_le is not null then
    raise exception 'Délégation déjà révoquée.';
  end if;
  if char_length(trim(coalesce(p_motif, ''))) < 3 then
    raise exception 'Indiquez le motif de la révocation.';
  end if;
  update public.delegations_signature
    set revoquee_le = now(), revoquee_par = auth.uid(), motif_revocation = trim(p_motif)
  where id = p_delegation_id;
  insert into public.audit_log (acteur_id, action, details)
    values (auth.uid(), 'revocation_delegation_signature', jsonb_build_object(
      'qualite', v_d.qualite, 'delegataire', v_d.delegataire_nom, 'motif', trim(p_motif)));
end;
$$;
revoke execute on function public.revoquer_delegation_signature(uuid, text) from public, anon;
grant execute on function public.revoquer_delegation_signature(uuid, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 6. Spécimen de signature
-- ----------------------------------------------------------------------------
-- Le fichier (déjà nettoyé et réencodé par le serveur) est déposé dans
-- signatures/specimens/<agent>/<uuid>.png ; renvoie l'ancien chemin, que le
-- serveur supprime ensuite.
create or replace function public.specimen_definir(p_chemin text, p_largeur integer, p_hauteur integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ancien text;
begin
  if auth.uid() is null then
    raise exception 'Session requise.';
  end if;
  if p_chemin !~ ('^specimens/' || auth.uid()::text || '/[0-9a-f-]{36}\.png$') then
    raise exception 'Chemin de spécimen invalide.';
  end if;
  if not exists (select 1 from storage.objects where bucket_id = 'signatures' and name = p_chemin) then
    raise exception 'Fichier de spécimen introuvable.';
  end if;
  select chemin into v_ancien from public.specimens_signature where profil_id = auth.uid();
  insert into public.specimens_signature (profil_id, chemin, largeur, hauteur, depose_le)
    values (auth.uid(), p_chemin, p_largeur, p_hauteur, now())
  on conflict (profil_id) do update
    set chemin = excluded.chemin, largeur = excluded.largeur, hauteur = excluded.hauteur, depose_le = excluded.depose_le;
  insert into public.audit_log (acteur_id, action, details)
    values (auth.uid(), 'specimen_signature', jsonb_build_object('remplacement', v_ancien is not null));
  return v_ancien;
end;
$$;
revoke execute on function public.specimen_definir(text, integer, integer) from public, anon;
grant execute on function public.specimen_definir(text, integer, integer) to authenticated;

-- ----------------------------------------------------------------------------
-- 7. Plafond des codes Google Authenticator faux (5 en 15 minutes)
-- ----------------------------------------------------------------------------
create or replace function public.signature_essai_autorise()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select (select count(*) from public.echecs_code_signature
          where profil_id = auth.uid() and le > now() - interval '15 minutes') < 5;
$$;
revoke execute on function public.signature_essai_autorise() from public, anon;
grant execute on function public.signature_essai_autorise() to authenticated;

create or replace function public.signature_echec()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  delete from public.echecs_code_signature where le < now() - interval '1 day';
  insert into public.echecs_code_signature (profil_id) values (auth.uid());
  insert into public.audit_log (acteur_id, action, details)
    values (auth.uid(), 'echec_code_signature', '{}'::jsonb);
end;
$$;
revoke execute on function public.signature_echec() from public, anon;
grant execute on function public.signature_echec() to authenticated;

-- ----------------------------------------------------------------------------
-- 8. Préparation d'une signature : droits, réservation du numéro et du code
-- ----------------------------------------------------------------------------
-- Code de vérification : 12 caractères parmi 32 (sans I, O, 0, 1), soit
-- 60 bits. Les octets viennent de gen_random_uuid() (générateur
-- cryptographique), en écartant les deux octets qui portent la version et la
-- variante de l'UUID ; 256 étant multiple de 32, le tirage est uniforme.
create or replace function public.generer_code_signature()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_octets bytea;
  v_code text;
  v_positions constant integer[] := array[0, 1, 2, 3, 4, 5, 7, 9, 10, 11, 12, 13];
  i integer;
begin
  loop
    v_octets := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
    v_code := '';
    foreach i in array v_positions loop
      v_code := v_code || substr(v_alphabet, (get_byte(v_octets, i) % 32) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.signatures where code = v_code);
  end loop;
  return v_code;
end;
$$;
revoke execute on function public.generer_code_signature() from public, anon, authenticated;

-- Contrôles communs (document finalisé, lisible en entier, signable) et
-- création de la ligne du registre. Usage interne.
create or replace function public.reserver_signature(
  p_document_id uuid,
  p_qualite text,
  p_nature text,
  p_langue text,
  p_signataire uuid,
  p_delegation uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moi public.profiles;
  v_doc public.documents;
  v_q public.qualites_signature;
  v_deleg public.delegations_signature;
  v_numero_existant text;
  v_annee integer := extract(year from (now() at time zone 'Africa/Douala'))::integer;
  v_dernier integer;
  v_numero text;
  v_code text;
  v_id uuid;
  v_signataire_nom text;
begin
  select * into v_moi from public.profiles where id = auth.uid();
  select * into v_q from public.qualites_signature where code = p_qualite;
  if v_q.code is null then
    raise exception 'Qualité de signature inconnue.';
  end if;

  select * into v_doc from public.documents where id = p_document_id for update;
  -- Un délégataire ne signe que ce qu'il peut lire en entier : aucun accès
  -- n'est ouvert pour l'occasion.
  if v_doc.id is null or v_doc.organisation <> v_moi.organisation or not public.peut_lire_document(v_doc) then
    raise exception 'Document introuvable.';
  end if;
  if v_doc.statut not in ('valide', 'publie') then
    raise exception 'Seul un document validé ou publié peut être signé.';
  end if;
  if v_doc.format_atelier is null and (v_doc.storage_path is null or lower(v_doc.storage_path) !~ '\.pdf$') then
    raise exception 'Ce document ne peut pas être signé : il doit être rédigé dans la plateforme ou déposé au format PDF.';
  end if;

  -- Une préparation restée en suspens (coupure pendant la production du
  -- PDF) est abandonnée au bout de 10 minutes : son numéro reste au registre.
  update public.signatures set statut = 'abandonnee'
  where document_id = v_doc.id and statut = 'en_preparation' and cree_le < now() - interval '10 minutes';

  select numero into v_numero_existant from public.signatures
  where document_id = v_doc.id and statut in ('en_preparation', 'attente_original', 'valide');
  if v_numero_existant is not null then
    raise exception 'Ce document porte déjà une signature en cours ou valide (n° %).', v_numero_existant;
  end if;

  if p_delegation is not null then
    select * into v_deleg from public.delegations_signature where id = p_delegation;
  end if;
  if p_signataire is not null then
    select nom_complet into v_signataire_nom from public.profiles where id = p_signataire;
  end if;

  insert into public.compteurs_signature (organisation, qualite, annee, dernier)
    values (v_doc.organisation, p_qualite, v_annee, 1)
  on conflict (organisation, qualite, annee) do update set dernier = public.compteurs_signature.dernier + 1
  returning dernier into v_dernier;

  v_numero := lpad(v_dernier::text, 4, '0') || '/' || v_doc.organisation || '/' || p_qualite || '/' || v_annee;
  v_code := public.generer_code_signature();

  insert into public.signatures (
    organisation, document_id, reference_document, titre_document, classification_document,
    nature, qualite, intitule, intitule_en, numero, code, langue,
    signataire_id, signataire_nom, delegation_id, titre_delegataire,
    statut, cree_par, cree_par_nom)
  values (
    v_doc.organisation, v_doc.id, v_doc.reference, v_doc.titre, v_doc.classification,
    p_nature, p_qualite, v_q.intitule, v_q.intitule_en, v_numero, v_code,
    case when p_langue = 'en' then 'en' else 'fr' end,
    p_signataire, v_signataire_nom, v_deleg.id, v_deleg.titre_delegataire,
    'en_preparation', auth.uid(), v_moi.nom_complet)
  returning id into v_id;

  return jsonb_build_object(
    'id', v_id, 'numero', v_numero, 'code', v_code,
    'intitule', v_q.intitule, 'intitule_en', v_q.intitule_en,
    'titre_delegataire', v_deleg.titre_delegataire, 'signataire_nom', v_signataire_nom,
    'document_id', v_doc.id);
end;
$$;
revoke execute on function public.reserver_signature(uuid, text, text, text, uuid, uuid) from public, anon, authenticated;

-- Signature électronique : par le titulaire ou son délégataire, qui doit
-- avoir enregistré l'image de sa signature.
create or replace function public.signer_preparer(p_document_id uuid, p_qualite text, p_langue text default 'fr')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delegation uuid;
begin
  if auth.uid() is null then
    raise exception 'Session requise.';
  end if;
  if not public.est_titulaire_signature(p_qualite) then
    v_delegation := public.delegation_active(p_qualite);
    if v_delegation is null then
      raise exception 'Vous ne pouvez pas signer au titre de cette qualité.';
    end if;
  end if;
  if not exists (select 1 from public.specimens_signature where profil_id = auth.uid()) then
    raise exception 'Enregistrez d''abord l''image de votre signature (page Signatures).';
  end if;
  return public.reserver_signature(p_document_id, p_qualite, 'electronique', p_langue, auth.uid(), v_delegation);
end;
$$;
revoke execute on function public.signer_preparer(uuid, text, text) from public, anon;
grant execute on function public.signer_preparer(uuid, text, text) to authenticated;

-- Bon à signer (signature manuscrite + cachet) : préparé par l'auteur du
-- document, un administrateur, le titulaire ou son délégataire.
create or replace function public.bon_a_signer(p_document_id uuid, p_qualite text, p_langue text default 'fr')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moi public.profiles;
  v_auteur uuid;
begin
  select * into v_moi from public.profiles where id = auth.uid();
  if v_moi.id is null then
    raise exception 'Session requise.';
  end if;
  select owner_id into v_auteur from public.documents where id = p_document_id;
  if not (
    v_auteur = auth.uid()
    or v_moi.role = 'administrateur'
    or public.est_titulaire_signature(p_qualite)
    or public.delegation_active(p_qualite) is not null
  ) then
    raise exception 'Seuls l''auteur du document, un administrateur ou le signataire peuvent préparer un bon à signer.';
  end if;
  return public.reserver_signature(p_document_id, p_qualite, 'manuscrite', p_langue, null, null);
end;
$$;
revoke execute on function public.bon_a_signer(uuid, text, text) from public, anon;
grant execute on function public.bon_a_signer(uuid, text, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 9. Fonctions réservées au serveur (clé de service)
-- ----------------------------------------------------------------------------
-- Enregistre le PDF produit : signature électronique → valide ; bon à
-- signer → en attente de l'original signé.
create or replace function public.signature_sceller(p_signature_id uuid, p_chemin text, p_empreinte text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_s public.signatures;
begin
  select * into v_s from public.signatures where id = p_signature_id for update;
  if v_s.id is null or v_s.statut <> 'en_preparation' then
    raise exception 'Signature introuvable ou déjà traitée.';
  end if;
  if p_empreinte !~ '^[0-9a-f]{64}$' then
    raise exception 'Empreinte invalide.';
  end if;
  update public.signatures
    set statut = case when v_s.nature = 'electronique' then 'valide' else 'attente_original' end,
        signe_le = case when v_s.nature = 'electronique' then now() else null end,
        chemin_pdf = p_chemin,
        empreinte_pdf = p_empreinte
  where id = p_signature_id;
  insert into public.audit_log (document_id, acteur_id, action, details)
    values (v_s.document_id, coalesce(v_s.signataire_id, v_s.cree_par),
      case when v_s.nature = 'electronique' then 'signature_electronique' else 'bon_a_signer' end,
      jsonb_build_object('numero', v_s.numero, 'qualite', v_s.qualite, 'par_delegation', v_s.delegation_id is not null));
end;
$$;
revoke execute on function public.signature_sceller(uuid, text, text) from public, anon, authenticated;
grant execute on function public.signature_sceller(uuid, text, text) to service_role;

-- Échec de production du PDF : le numéro est abandonné, pas effacé.
create or replace function public.signature_abandonner(p_signature_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_s public.signatures;
begin
  select * into v_s from public.signatures where id = p_signature_id for update;
  if v_s.id is null or v_s.statut <> 'en_preparation' then
    return;
  end if;
  update public.signatures set statut = 'abandonnee' where id = p_signature_id;
  insert into public.audit_log (document_id, acteur_id, action, details)
    values (v_s.document_id, v_s.cree_par, 'signature_abandonnee', jsonb_build_object('numero', v_s.numero));
end;
$$;
revoke execute on function public.signature_abandonner(uuid) from public, anon, authenticated;
grant execute on function public.signature_abandonner(uuid) to service_role;

-- Qui peut déposer le scan de l'original signé (aussi utilisé par la règle
-- de dépôt du stockage) : la personne qui a préparé le bon à signer,
-- l'auteur du document, l'administrateur, le titulaire ou son délégataire.
create or replace function public.original_peut_deposer(p_signature_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.signatures s
    join public.profiles p on p.id = auth.uid() and p.organisation = s.organisation
    left join public.documents d on d.id = s.document_id
    where s.id = p_signature_id
      and s.nature = 'manuscrite'
      and s.statut in ('attente_original', 'valide')
      and (
        s.cree_par = auth.uid()
        or d.owner_id = auth.uid()
        or p.role = 'administrateur'
        or public.est_titulaire_signature(s.qualite)
        or public.delegation_active(s.qualite) is not null
      )
  );
$$;
revoke execute on function public.original_peut_deposer(uuid) from public, anon;
grant execute on function public.original_peut_deposer(uuid) to authenticated, service_role;

-- Enregistre le scan signé, après analyse antivirus par le serveur. Le
-- remplacement d'un original exige un motif ; l'ancien fichier est conservé.
create or replace function public.original_enregistrer(
  p_signature_id uuid,
  p_chemin text,
  p_empreinte text,
  p_agent uuid,
  p_motif text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_s public.signatures;
begin
  select * into v_s from public.signatures where id = p_signature_id for update;
  if v_s.id is null or v_s.nature <> 'manuscrite' or v_s.statut not in ('attente_original', 'valide') then
    raise exception 'Signature introuvable ou ne recevant pas d''original.';
  end if;
  if p_chemin !~ ('^originaux/' || p_signature_id::text || '/[0-9a-f-]{36}\.pdf$') then
    raise exception 'Chemin de l''original invalide.';
  end if;
  if p_empreinte !~ '^[0-9a-f]{64}$' then
    raise exception 'Empreinte invalide.';
  end if;
  if v_s.chemin_original is not null and char_length(trim(coalesce(p_motif, ''))) < 3 then
    raise exception 'Indiquez le motif du remplacement de l''original.';
  end if;

  update public.signatures
    set statut = 'valide',
        signe_le = coalesce(signe_le, now()),
        chemin_original = p_chemin,
        empreinte_original = p_empreinte,
        original_depose_le = now(),
        original_depose_par = p_agent
  where id = p_signature_id;

  insert into public.audit_log (document_id, acteur_id, action, details)
    values (v_s.document_id, p_agent,
      case when v_s.chemin_original is null then 'original_signe_depose' else 'original_signe_remplace' end,
      jsonb_build_object('numero', v_s.numero, 'motif', nullif(trim(coalesce(p_motif, '')), ''),
        'ancien_chemin', v_s.chemin_original, 'ancienne_empreinte', v_s.empreinte_original));
end;
$$;
revoke execute on function public.original_enregistrer(uuid, text, text, uuid, text) from public, anon, authenticated;
grant execute on function public.original_enregistrer(uuid, text, text, uuid, text) to service_role;

-- ----------------------------------------------------------------------------
-- 10. Révocation et consultation (agent)
-- ----------------------------------------------------------------------------
-- Par le signataire ou le titulaire de la qualité ; un bon à signer encore
-- sans original peut aussi être annulé par la personne qui l'a préparé.
-- Motif obligatoire ; la ligne reste au registre.
create or replace function public.signature_revoquer(p_signature_id uuid, p_motif text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_s public.signatures;
  v_org text := public.mon_organisation();
begin
  select * into v_s from public.signatures where id = p_signature_id for update;
  if v_s.id is null or v_s.organisation is distinct from v_org then
    raise exception 'Signature introuvable.';
  end if;
  if v_s.statut not in ('valide', 'attente_original') then
    raise exception 'Cette signature n''est pas révocable (état : %).', v_s.statut;
  end if;
  if not (
    v_s.signataire_id = auth.uid()
    or public.est_titulaire_signature(v_s.qualite)
    or (v_s.statut = 'attente_original' and v_s.cree_par = auth.uid())
  ) then
    raise exception 'Seul le signataire ou le titulaire de la qualité peut révoquer cette signature.';
  end if;
  if char_length(trim(coalesce(p_motif, ''))) < 5 then
    raise exception 'Indiquez le motif de la révocation.';
  end if;
  update public.signatures
    set statut = 'revoquee', revoquee_le = now(), revoquee_par = auth.uid(), motif_revocation = trim(p_motif)
  where id = p_signature_id;
  insert into public.audit_log (document_id, acteur_id, action, details)
    values (v_s.document_id, auth.uid(), 'signature_revoquee', jsonb_build_object('numero', v_s.numero, 'motif', trim(p_motif)));
end;
$$;
revoke execute on function public.signature_revoquer(uuid, text) from public, anon;
grant execute on function public.signature_revoquer(uuid, text) to authenticated;

-- Fichier d'une signature (PDF signé / bon à signer, ou original scanné) :
-- mêmes règles que la lecture du registre ; chaque consultation est tracée.
-- Le serveur lit ensuite le fichier avec la clé de service.
create or replace function public.consulter_signature(p_signature_id uuid, p_quoi text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_s public.signatures;
  v_chemin text;
begin
  select * into v_s from public.signatures where id = p_signature_id;
  if v_s.id is null or not public.peut_voir_signature(v_s) then
    raise exception 'Signature introuvable.';
  end if;
  v_chemin := case when p_quoi = 'original' then v_s.chemin_original else v_s.chemin_pdf end;
  if v_chemin is null then
    raise exception 'Aucun fichier disponible pour cette signature.';
  end if;
  insert into public.audit_log (document_id, acteur_id, action, details)
    values (v_s.document_id, auth.uid(), 'consultation_signature', jsonb_build_object('numero', v_s.numero, 'fichier', p_quoi));
  return v_chemin;
end;
$$;
revoke execute on function public.consulter_signature(uuid, text) from public, anon;
grant execute on function public.consulter_signature(uuid, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 11. Vérification publique (serveur, clé de service)
-- ----------------------------------------------------------------------------
-- 60 vérifications par heure et par adresse IP (empreinte salée). Ne renvoie
-- JAMAIS le titre ni le contenu du document : le code circule sur papier.
create or replace function public.verifier_signature(p_code text, p_ip_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  v_s public.signatures;
begin
  delete from public.verifications_signature where le < now() - interval '1 day';
  if (select count(*) from public.verifications_signature
      where ip_hash = p_ip_hash and le > now() - interval '1 hour') >= 60 then
    return jsonb_build_object('limite', true);
  end if;
  insert into public.verifications_signature (ip_hash) values (coalesce(p_ip_hash, 'inconnu'));

  if v_code !~ '^[A-HJ-NP-Z2-9]{12}$' then
    return jsonb_build_object('trouve', false);
  end if;
  select * into v_s from public.signatures where code = v_code;
  if v_s.id is null or v_s.statut = 'en_preparation' then
    return jsonb_build_object('trouve', false);
  end if;
  return jsonb_build_object(
    'trouve', true,
    'organisation', v_s.organisation,
    'numero', v_s.numero,
    'statut', v_s.statut,
    'nature', v_s.nature,
    'intitule', v_s.intitule,
    'intitule_en', v_s.intitule_en,
    'par_delegation', v_s.delegation_id is not null,
    'titre_delegataire', v_s.titre_delegataire,
    'signataire_nom', case when v_s.nature = 'electronique' then v_s.signataire_nom end,
    'cree_le', v_s.cree_le,
    'signe_le', v_s.signe_le,
    'original_depose_le', v_s.original_depose_le,
    'revoquee_le', v_s.revoquee_le,
    'empreinte_pdf', case when v_s.nature = 'electronique' then v_s.empreinte_pdf end,
    'empreinte_original', v_s.empreinte_original);
end;
$$;
revoke execute on function public.verifier_signature(text, text) from public, anon, authenticated;
grant execute on function public.verifier_signature(text, text) to service_role;

-- ----------------------------------------------------------------------------
-- 12. Stockage privé : aucune lecture depuis le navigateur ; seul le scan de
--     l'original se dépose directement, et seulement par qui en a le droit.
--     (Garde CASE : la conversion du nom n'est tentée que sur ce bucket.)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', false)
on conflict (id) do update set public = false;

drop policy if exists "signatures_depot_original" on storage.objects;
create policy "signatures_depot_original"
  on storage.objects for insert
  to authenticated
  with check (
    case
      when bucket_id = 'signatures'
           and name ~ '^originaux/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f-]{36}\.pdf$'
        then public.original_peut_deposer(split_part(name, '/', 2)::uuid)
      else false
    end
  );
