-- ============================================================================
-- Double authentification (MFA) obligatoire : Google Authenticator (TOTP).
--
-- L'application oblige chaque agent, après son mot de passe, à saisir le
-- code à 6 chiffres de Google Authenticator (et à le configurer à la
-- première connexion). Cette migration fait respecter la même règle PAR LA
-- BASE, pour qu'une session ouverte avec le seul mot de passe (niveau
-- « aal1 » du jeton Supabase) ne puisse rien lire ni modifier, même en
-- appelant l'API directement :
--   1. Policies RESTRICTIVES sur toutes les tables de la GED et sur le
--      stockage : en plus des règles existantes, le jeton doit être « aal2 ».
--      (Couvre aussi le temps réel de la messagerie.)
--   2. Fonction « pre-request » de PostgREST : refuse toute requête d'un
--      agent connecté sans MFA, y compris les appels de fonctions (RPC)
--      SECURITY DEFINER, qui ne passent pas par les policies.
--   Restent accessibles sans MFA : les actualités publiques et l'envoi du
--   formulaire de contact (site public).
--   3. Un administrateur peut réinitialiser la double authentification d'un
--      agent de son organisation (téléphone perdu) ; c'est tracé dans l'audit.
--
-- À exécuter après la migration 0026. Vérifier ensuite dans Supabase :
-- Authentication › Multi-Factor › « TOTP (App Authenticator) » activé
-- (c'est le réglage par défaut).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Niveau d'authentification de la session courante
-- ----------------------------------------------------------------------------
create or replace function public.mfa_validee()
returns boolean
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'aal',
    'aal1'
  ) = 'aal2';
$$;
grant execute on function public.mfa_validee() to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. Policies restrictives sur toutes les tables de la GED
-- ----------------------------------------------------------------------------
do $$
declare
  v_table text;
begin
  for v_table in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relrowsecurity
      and c.relname not in ('actualites_publiques', 'messages_contact')
  loop
    execute format('drop policy if exists "mfa_obligatoire" on public.%I', v_table);
    execute format(
      'create policy "mfa_obligatoire" on public.%I as restrictive for all to authenticated '
      'using (public.mfa_validee()) with check (public.mfa_validee())',
      v_table
    );
  end loop;
end $$;

-- Messages du formulaire de contact : l'envoi reste ouvert (site public),
-- mais leur lecture et leur traitement (Admin › Messages reçus) exigent le MFA.
drop policy if exists "mfa_obligatoire_lecture" on public.messages_contact;
create policy "mfa_obligatoire_lecture" on public.messages_contact
  as restrictive for select to authenticated using (public.mfa_validee());
drop policy if exists "mfa_obligatoire_modification" on public.messages_contact;
create policy "mfa_obligatoire_modification" on public.messages_contact
  as restrictive for update to authenticated using (public.mfa_validee()) with check (public.mfa_validee());
drop policy if exists "mfa_obligatoire_suppression" on public.messages_contact;
create policy "mfa_obligatoire_suppression" on public.messages_contact
  as restrictive for delete to authenticated using (public.mfa_validee());

-- Fichiers (documents et pièces jointes de la messagerie).
drop policy if exists "mfa_obligatoire" on storage.objects;
create policy "mfa_obligatoire" on storage.objects
  as restrictive for all to authenticated
  using (public.mfa_validee()) with check (public.mfa_validee());

-- ----------------------------------------------------------------------------
-- 3. Contrôle avant chaque requête PostgREST (couvre les fonctions RPC)
-- ----------------------------------------------------------------------------
create or replace function public.controle_mfa_requete()
returns void
language plpgsql
stable
as $$
declare
  v_claims jsonb := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  v_chemin text := coalesce(current_setting('request.path', true), '');
begin
  if v_claims ->> 'role' = 'authenticated'
     and coalesce(v_claims ->> 'aal', 'aal1') <> 'aal2'
     and v_chemin not in ('/actualites_publiques', '/messages_contact') then
    raise exception 'Double authentification requise : saisissez votre code Google Authenticator.'
      using errcode = '42501';
  end if;
end;
$$;
grant execute on function public.controle_mfa_requete() to anon, authenticated, service_role;

do $$
begin
  execute 'alter role authenticator set pgrst.db_pre_request = ''public.controle_mfa_requete''';
  perform pg_notify('pgrst', 'reload config');
exception when others then
  -- Sans ce droit, les policies restrictives ci-dessus protègent déjà toutes
  -- les tables ; seul le contrôle des fonctions RPC manquerait.
  raise notice 'pre-request non installé (%), policies restrictives actives.', sqlerrm;
end $$;

-- ----------------------------------------------------------------------------
-- 4. Administration : état du MFA et réinitialisation (téléphone perdu)
-- ----------------------------------------------------------------------------
create or replace function public.etat_mfa_utilisateurs()
returns table (utilisateur_id uuid, mfa_actif boolean)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_moi public.profiles;
begin
  select * into v_moi from public.profiles where id = auth.uid();
  if v_moi.id is null or v_moi.role <> 'administrateur' or not public.mfa_validee() then
    return;
  end if;
  return query
    select p.id,
      exists (select 1 from auth.mfa_factors f where f.user_id = p.id and f.status = 'verified')
    from public.profiles p
    where p.organisation = v_moi.organisation;
end;
$$;
grant execute on function public.etat_mfa_utilisateurs() to authenticated;

create or replace function public.reinitialiser_mfa_utilisateur(p_utilisateur_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moi public.profiles;
  v_cible public.profiles;
begin
  select * into v_moi from public.profiles where id = auth.uid();
  select * into v_cible from public.profiles where id = p_utilisateur_id;
  if v_moi.id is null or v_moi.role <> 'administrateur' or not public.mfa_validee() then
    raise exception 'Seul un administrateur peut réinitialiser la double authentification.';
  end if;
  if v_cible.id is null or v_cible.organisation <> v_moi.organisation then
    raise exception 'Utilisateur introuvable.';
  end if;
  if v_cible.id = v_moi.id then
    raise exception 'Vous ne pouvez pas réinitialiser votre propre double authentification : demandez-le à un autre administrateur.';
  end if;

  delete from auth.mfa_factors where user_id = v_cible.id;

  insert into public.audit_log (acteur_id, action, details)
    values (v_moi.id, 'reinitialisation_mfa', jsonb_build_object('utilisateur', v_cible.id, 'nom', v_cible.nom_complet));
end;
$$;
grant execute on function public.reinitialiser_mfa_utilisateur(uuid) to authenticated;
