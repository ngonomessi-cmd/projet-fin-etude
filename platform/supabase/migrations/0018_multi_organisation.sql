-- ============================================================================
-- Isolation multi-organisation (KHS Bank + une seconde organisation déployée
-- sur la MÊME base Supabase, faute de pouvoir créer un second projet gratuit).
--
-- Jusqu'ici, tout l'isolement des données reposait sur le département
-- (texte libre) et le rôle. Deux organisations distinctes peuvent parfaitement
-- avoir toutes deux un département nommé "Direction Générale" : sans
-- changement, leurs agents se verraient mutuellement comme des collègues du
-- même département, et administrateurs/validateurs d'une organisation
-- pourraient agir sur les documents, conversations et comptes de l'autre.
--
-- Principe retenu : une colonne "organisation" (texte libre, ex. "KHS",
-- "API"), posée sur chaque table qui porte vraiment une appartenance
-- (profiles, documents, conversations, audit_log, parametres_messagerie) ;
-- les tables "enfants" (messages, pièces jointes, accusés...) restent
-- protégées indirectement, via leur lien vers une ligne déjà isolée.
--
-- La valeur n'est JAMAIS fournie par le client : elle est systématiquement
-- déduite côté base (déclencheur BEFORE INSERT, à partir du créateur/
-- propriétaire de la ligne), pour qu'aucune requête directe à l'API ne
-- puisse la falsifier. Toutes les lignes déjà existantes au moment de cette
-- migration sont rattachées à "KHS" (valeur par défaut de la colonne).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Colonnes "organisation" + rattachement de l'existant à "KHS"
-- ----------------------------------------------------------------------------

alter table public.profiles add column if not exists organisation text not null default 'KHS';
alter table public.documents add column if not exists organisation text not null default 'KHS';
alter table public.conversations add column if not exists organisation text not null default 'KHS';
alter table public.audit_log add column if not exists organisation text not null default 'KHS';

create index if not exists idx_profiles_organisation on public.profiles (organisation);
create index if not exists idx_documents_organisation on public.documents (organisation);
create index if not exists idx_conversations_organisation on public.conversations (organisation);

-- ----------------------------------------------------------------------------
-- 2. Fonction utilitaire : organisation de l'utilisateur courant.
--    SECURITY DEFINER (contourne RLS pour sa propre requête interne) afin de
--    pouvoir être appelée depuis la policy SELECT de "profiles" elle-même,
--    sans provoquer la récursion déjà rencontrée (cf. migration 0009).
-- ----------------------------------------------------------------------------

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

-- ----------------------------------------------------------------------------
-- 3. Rattachement automatique à la création (jamais fourni par le client)
-- ----------------------------------------------------------------------------

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

create function public.tamponner_organisation_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.organisation := (select organisation from public.profiles where id = new.created_by);
  return new;
end;
$$;

create trigger declencheur_organisation_conversation
  before insert on public.conversations
  for each row execute function public.tamponner_organisation_conversation();

create function public.tamponner_organisation_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.organisation := coalesce(
    (select organisation from public.profiles where id = new.acteur_id),
    'KHS'
  );
  return new;
end;
$$;

create trigger declencheur_organisation_audit
  before insert on public.audit_log
  for each row execute function public.tamponner_organisation_audit();

-- Peuplement du profil à la création du compte : l'organisation vient des
-- métadonnées passées par l'application au moment de l'inscription
-- (NEXT_PUBLIC_ORG_SIGLE de chaque déploiement, cf. src/lib/organisation.ts et
-- src/app/login/actions.ts) — jamais choisie librement par la personne qui
-- s'inscrit, seulement par le déploiement qu'elle utilise.
create or replace function public.gerer_nouvel_utilisateur()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nom_complet, departement, organisation)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nom_complet', new.email),
    coalesce(new.raw_user_meta_data ->> 'departement', 'Direction'),
    coalesce(new.raw_user_meta_data ->> 'organisation', 'KHS')
  );
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. Profils : un agent ne voit que les profils de sa propre organisation
-- ----------------------------------------------------------------------------

drop policy if exists "profils_lecture_utilisateurs_authentifies" on public.profiles;
create policy "profils_lecture_utilisateurs_authentifies"
  on public.profiles for select
  to authenticated
  using (organisation = public.mon_organisation());

-- ----------------------------------------------------------------------------
-- 5. Documents : la visibilité et les droits de validation ne traversent
--    jamais une frontière d'organisation, même à rôle/département identiques.
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
        or p.role in ('administrateur', 'auditeur')
        or (
          d.statut = 'publie' and (
            d.classification = 'public_interne'
            or (d.classification = 'restreint' and p.departement = d.departement)
            or (d.classification = 'confidentiel' and p.role = 'validateur' and p.departement = d.departement)
          )
        )
        or (d.statut = 'en_verification' and p.role = 'validateur' and p.departement = d.departement)
      )
  );
$$;

drop policy if exists "modification_document_selon_role" on public.documents;
create policy "modification_document_selon_role"
  on public.documents for update
  to authenticated
  using (
    (owner_id = auth.uid() and statut in ('brouillon', 'rejete'))
    or (
      statut in ('en_verification', 'valide')
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
          and p.organisation = documents.organisation
          and (p.role = 'administrateur' or (p.role = 'validateur' and p.departement = documents.departement))
      )
    )
  )
  with check (
    owner_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.organisation = documents.organisation
        and p.role in ('administrateur', 'validateur')
    )
  );

create or replace function public.transition_statut_document(
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
  v_organisation text;
  v_transition_valide boolean := false;
begin
  select role, departement, organisation into v_role, v_departement, v_organisation
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
        and v_organisation = v_doc.organisation
        and (v_role = 'administrateur' or (v_role = 'validateur' and v_departement = v_doc.departement)) then
    v_transition_valide := true;  -- vérification + validation (ou rejet motivé)
  elsif v_doc.statut = 'valide'
        and p_nouveau_statut = 'publie'
        and v_organisation = v_doc.organisation
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

-- ----------------------------------------------------------------------------
-- 6. Journal d'audit : le "voit tout" de l'administrateur/auditeur s'arrête
--    à la frontière de son organisation (les entrées sans document, comme un
--    changement de rôle, portent elles-mêmes leur propre organisation).
-- ----------------------------------------------------------------------------

drop policy if exists "lecture_audit_selon_role_ou_document_lisible" on public.audit_log;
create policy "lecture_audit_selon_role_ou_document_lisible"
  on public.audit_log for select
  to authenticated
  using (
    acteur_id = auth.uid()
    or (
      organisation = public.mon_organisation()
      and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('administrateur', 'auditeur'))
    )
    or (
      document_id is not null
      and exists (select 1 from public.documents d where d.id = audit_log.document_id and public.peut_lire_document(d))
    )
  );

-- ----------------------------------------------------------------------------
-- 7. Administration des comptes : un administrateur ne gère que les comptes
--    de sa propre organisation.
-- ----------------------------------------------------------------------------

create or replace function public.changer_role_utilisateur(
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
  v_appelant_organisation text;
  v_cible_organisation text;
  v_profil public.profiles;
begin
  select role, organisation into v_appelant_role, v_appelant_organisation
    from public.profiles where id = auth.uid();

  if v_appelant_role is distinct from 'administrateur' then
    raise exception 'Seul un administrateur peut modifier le rôle d''un utilisateur.';
  end if;

  select organisation into v_cible_organisation from public.profiles where id = p_utilisateur_id;
  if v_cible_organisation is distinct from v_appelant_organisation then
    raise exception 'Cet utilisateur n''appartient pas à votre organisation.';
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

create or replace function public.modifier_profil_utilisateur(
  p_utilisateur_id uuid,
  p_nom_complet text default null,
  p_departement text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appelant_role public.role_utilisateur;
  v_appelant_organisation text;
  v_cible_organisation text;
  v_profil public.profiles;
begin
  select role, organisation into v_appelant_role, v_appelant_organisation
    from public.profiles where id = auth.uid();

  if v_appelant_role is distinct from 'administrateur' then
    raise exception 'Seul un administrateur peut modifier le profil d''un autre utilisateur.';
  end if;

  select organisation into v_cible_organisation from public.profiles where id = p_utilisateur_id;
  if v_cible_organisation is distinct from v_appelant_organisation then
    raise exception 'Cet utilisateur n''appartient pas à votre organisation.';
  end if;

  update public.profiles
    set nom_complet = coalesce(nullif(p_nom_complet, ''), nom_complet),
        departement = coalesce(nullif(p_departement, ''), departement)
    where id = p_utilisateur_id
    returning * into v_profil;

  if v_profil.id is null then
    raise exception 'Utilisateur introuvable.';
  end if;

  insert into public.audit_log (document_id, acteur_id, action, details)
    values (
      null, auth.uid(), 'modification_profil',
      jsonb_build_object('utilisateur_cible', p_utilisateur_id, 'nom_complet', p_nom_complet, 'departement', p_departement)
    );

  return v_profil;
end;
$$;

-- ----------------------------------------------------------------------------
-- 8. Stockage : un administrateur ne dépose un fichier manquant (migration
--    0017) que pour un document de sa propre organisation.
-- ----------------------------------------------------------------------------

drop policy if exists "depot_fichier_par_administrateur_si_absent" on storage.objects;
create policy "depot_fichier_par_administrateur_si_absent"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents-ged'
    and exists (
      select 1 from public.documents d
      join public.profiles p on p.id = auth.uid()
      where d.id::text = split_part(storage.objects.name, '/', 1)
        and d.storage_path is null
        and p.role = 'administrateur'
        and p.organisation = d.organisation
    )
  );

-- ----------------------------------------------------------------------------
-- 9. Messagerie : canaux un par organisation (plus seulement un par
--    département), ouverture de conversation et ajout de participants
--    strictement internes à l'organisation de l'appelant.
-- ----------------------------------------------------------------------------

drop index if exists public.ux_conversations_canal_general;
create unique index ux_conversations_canal_general
  on public.conversations (organisation) where canal_general;

drop index if exists public.ux_conversations_canal_departement;
create unique index ux_conversations_canal_departement
  on public.conversations (organisation, departement) where type = 'canal' and departement is not null;

create or replace function public.synchroniser_canaux_profil_manuel(p_profil public.profiles)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_canal_general_id uuid;
  v_canal_departement_id uuid;
begin
  insert into public.conversations (type, titre, canal_general, created_by)
    values ('canal', 'Organisation entière', true, p_profil.id)
    on conflict (organisation) where canal_general do nothing;

  select id into v_canal_general_id
    from public.conversations where canal_general and organisation = p_profil.organisation limit 1;

  if v_canal_general_id is not null then
    insert into public.conversation_participants (conversation_id, profil_id, peut_publier)
      values (v_canal_general_id, p_profil.id, p_profil.role = 'administrateur')
      on conflict (conversation_id, profil_id) do update set peut_publier = excluded.peut_publier;
  end if;

  insert into public.conversations (type, titre, departement, created_by)
    values ('canal', p_profil.departement, p_profil.departement, p_profil.id)
    on conflict (organisation, departement) where (type = 'canal' and departement is not null) do nothing;

  select id into v_canal_departement_id
    from public.conversations
    where type = 'canal' and departement = p_profil.departement and organisation = p_profil.organisation;

  if v_canal_departement_id is not null then
    insert into public.conversation_participants (conversation_id, profil_id, peut_publier)
      values (v_canal_departement_id, p_profil.id, p_profil.role in ('administrateur', 'validateur'))
      on conflict (conversation_id, profil_id) do update set peut_publier = excluded.peut_publier;
  end if;
end;
$$;

create or replace function public.synchroniser_canaux_profil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ancien_canal_departement_id uuid;
begin
  perform public.synchroniser_canaux_profil_manuel(new);

  if tg_op = 'UPDATE' and old.departement is distinct from new.departement then
    select id into v_ancien_canal_departement_id
      from public.conversations
      where type = 'canal' and departement = old.departement and organisation = new.organisation;
    if v_ancien_canal_departement_id is not null then
      delete from public.conversation_participants
        where conversation_id = v_ancien_canal_departement_id and profil_id = new.id;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.creer_canal_departement(p_departement text)
returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organisation text;
  v_canal public.conversations;
begin
  select organisation into v_organisation
    from public.profiles where id = auth.uid() and role = 'administrateur';
  if v_organisation is null then
    raise exception 'Seul un administrateur peut créer un canal de département.';
  end if;
  if p_departement is null or length(trim(p_departement)) = 0 then
    raise exception 'Le département ne peut pas être vide.';
  end if;

  insert into public.conversations (type, titre, departement, created_by)
    values ('canal', trim(p_departement), trim(p_departement), auth.uid())
    on conflict (organisation, departement) where (type = 'canal' and departement is not null) do nothing;

  select * into v_canal
    from public.conversations
    where type = 'canal' and departement = trim(p_departement) and organisation = v_organisation;

  insert into public.conversation_participants (conversation_id, profil_id, peut_publier)
    select v_canal.id, p.id, p.role in ('administrateur', 'validateur')
    from public.profiles p
    where p.departement = trim(p_departement) and p.organisation = v_organisation
    on conflict (conversation_id, profil_id) do update set peut_publier = excluded.peut_publier;

  insert into public.conversation_participants (conversation_id, profil_id, peut_publier)
    values (v_canal.id, auth.uid(), true)
    on conflict (conversation_id, profil_id) do update set peut_publier = true;

  return v_canal;
end;
$$;

create or replace function public.renommer_canal(p_conversation_id uuid, p_nouveau_titre text)
returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_canal public.conversations;
begin
  if not exists (
    select 1 from public.profiles p
    join public.conversations c on c.id = p_conversation_id
    where p.id = auth.uid() and p.role = 'administrateur' and p.organisation = c.organisation
  ) then
    raise exception 'Seul un administrateur de cette organisation peut renommer ce canal.';
  end if;
  if p_nouveau_titre is null or length(trim(p_nouveau_titre)) = 0 then
    raise exception 'Le titre ne peut pas être vide.';
  end if;

  update public.conversations
    set titre = trim(p_nouveau_titre)
    where id = p_conversation_id and type = 'canal'
    returning * into v_canal;

  if v_canal is null then
    raise exception 'Canal introuvable.';
  end if;

  return v_canal;
end;
$$;

create or replace function public.supprimer_canal(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles p
    join public.conversations c on c.id = p_conversation_id
    where p.id = auth.uid() and p.role = 'administrateur' and p.organisation = c.organisation
  ) then
    raise exception 'Seul un administrateur de cette organisation peut supprimer ce canal.';
  end if;

  delete from public.conversations where id = p_conversation_id and type = 'canal';

  if not found then
    raise exception 'Canal introuvable.';
  end if;
end;
$$;

-- "Voit tous les canaux" de l'administrateur (migration 0015) restreint à sa
-- propre organisation.
drop policy if exists "conversations_lecture_participant" on public.conversations;
create policy "conversations_lecture_participant"
  on public.conversations for select
  to authenticated
  using (
    created_by = auth.uid()
    or public.est_participant_conversation(id)
    or (
      type = 'canal'
      and organisation = public.mon_organisation()
      and exists (select 1 from public.profiles where id = auth.uid() and role = 'administrateur')
    )
  );

-- Un agent ne peut ouvrir une conversation privée, ou ajouter quelqu'un à un
-- groupe, qu'avec un agent de sa propre organisation.
create or replace function public.peut_ouvrir_conversation(p_cible_id uuid)
returns boolean
language sql
security invoker
stable
set search_path = public
as $$
  select
    p_cible_id <> auth.uid()
    and exists (
      select 1 from public.profiles
      where id = p_cible_id and organisation = public.mon_organisation()
    )
    and (
      exists (select 1 from public.profiles where id = auth.uid() and role in ('administrateur', 'validateur'))
      or (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'redacteur')
        and not exists (select 1 from public.profiles where id = p_cible_id and role = 'administrateur')
      )
      or (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'lecteur')
        and exists (
          select 1 from public.profiles pa, public.profiles pc
          where pa.id = auth.uid() and pc.id = p_cible_id
            and pa.departement = pc.departement
            and pc.role <> 'administrateur'
        )
      )
    );
$$;

create or replace function public.creer_groupe_messagerie(p_titre text, p_participants uuid[])
returns public.conversations
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_conversation public.conversations;
  v_autre_id uuid;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role <> 'auditeur') then
    raise exception 'Un auditeur ne peut pas créer de groupe de travail.';
  end if;
  if p_titre is null or length(trim(p_titre)) = 0 then
    raise exception 'Le groupe doit avoir un objet.';
  end if;
  if cardinality(p_participants) + 1 > 60 then
    raise exception 'Un groupe de travail ne peut pas dépasser 60 agents.';
  end if;

  insert into public.conversations (type, titre, created_by)
    values ('groupe', p_titre, auth.uid()) returning * into v_conversation;

  insert into public.conversation_participants (conversation_id, profil_id) values (v_conversation.id, auth.uid());

  foreach v_autre_id in array p_participants loop
    if v_autre_id <> auth.uid()
       and exists (select 1 from public.profiles where id = v_autre_id and organisation = public.mon_organisation())
    then
      insert into public.conversation_participants (conversation_id, profil_id) values (v_conversation.id, v_autre_id)
        on conflict (conversation_id, profil_id) do nothing;
    end if;
  end loop;

  return v_conversation;
end;
$$;

-- Défense en profondeur : même un ajout direct à l'API (hors des fonctions
-- ci-dessus) ne peut pas lier un participant d'une autre organisation.
drop policy if exists "participants_ajout_par_createur" on public.conversation_participants;
create policy "participants_ajout_par_createur"
  on public.conversation_participants for insert
  to authenticated
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_participants.conversation_id
        and c.created_by = auth.uid()
        and c.type in ('privee', 'groupe')
    )
    and exists (
      select 1 from public.profiles p
      where p.id = conversation_participants.profil_id and p.organisation = public.mon_organisation()
    )
  );

-- ----------------------------------------------------------------------------
-- 10. Paramètres de messagerie : un jeu de réglages par organisation (et non
--     plus une unique ligne partagée) — chaque organisation choisit sa
--     propre durée de conservation.
-- ----------------------------------------------------------------------------

alter table public.parametres_messagerie add column if not exists organisation text;
update public.parametres_messagerie set organisation = 'KHS' where organisation is null;
alter table public.parametres_messagerie alter column organisation set not null;
alter table public.parametres_messagerie drop constraint if exists parametres_messagerie_pkey;
alter table public.parametres_messagerie drop column if exists id;
alter table public.parametres_messagerie add primary key (organisation);

drop policy if exists "parametres_messagerie_lecture_authentifies" on public.parametres_messagerie;
create policy "parametres_messagerie_lecture_authentifies"
  on public.parametres_messagerie for select
  to authenticated
  using (organisation = public.mon_organisation());

create or replace function public.definir_duree_conservation_messagerie(p_annees integer)
returns public.parametres_messagerie
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organisation text;
  v_parametres public.parametres_messagerie;
begin
  select organisation into v_organisation
    from public.profiles where id = auth.uid() and role = 'administrateur';
  if v_organisation is null then
    raise exception 'Seul un administrateur peut modifier la durée de conservation de la messagerie.';
  end if;
  if p_annees < 1 or p_annees > 20 then
    raise exception 'La durée de conservation doit être comprise entre 1 et 20 ans.';
  end if;

  insert into public.parametres_messagerie (organisation, duree_conservation_ans, modifie_par, modifie_at)
    values (v_organisation, p_annees, auth.uid(), now())
    on conflict (organisation) do update
      set duree_conservation_ans = excluded.duree_conservation_ans,
          modifie_par = excluded.modifie_par,
          modifie_at = excluded.modifie_at
    returning * into v_parametres;

  insert into public.audit_log (document_id, acteur_id, action, details)
    values (null, auth.uid(), 'modification_duree_conservation_messagerie', jsonb_build_object('nouvelle_duree_ans', p_annees));

  return v_parametres;
end;
$$;

-- Purge : chaque organisation est purgée selon SA PROPRE durée de
-- conservation (une organisation qui n'a encore rien réglé n'est, de fait,
-- pas purgée tant qu'un administrateur n'a pas choisi une durée).
create or replace function public.purger_messages_expires()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reglage record;
  v_supprimes integer;
  v_total integer := 0;
begin
  for v_reglage in select organisation, duree_conservation_ans from public.parametres_messagerie loop
    delete from public.messages m
      using public.conversations c
      where c.id = m.conversation_id
        and c.organisation = v_reglage.organisation
        and m.created_at < now() - make_interval(years => v_reglage.duree_conservation_ans);
    get diagnostics v_supprimes = row_count;
    v_total := v_total + v_supprimes;
  end loop;

  delete from public.conversations c
    where c.type <> 'canal'
      and not exists (select 1 from public.messages m where m.conversation_id = c.id);

  return v_total;
end;
$$;
