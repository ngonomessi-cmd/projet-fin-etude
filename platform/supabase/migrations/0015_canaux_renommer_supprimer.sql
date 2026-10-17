-- ============================================================================
-- Trois changements demandés sur les canaux de diffusion (canaux de
-- département et canal général) :
--
-- 1. Le titre d'un canal de département ne commence plus par
--    "Département — " : il reprend simplement le nom du département
--    (ex. "Direction Générale" au lieu de "Département — Direction Générale").
--    Correctif rétroactif sur les canaux déjà créés, et sur les deux points
--    de création (synchroniser_canaux_profil_manuel, migration 0008 ;
--    creer_canal_departement, migration 0011/0014).
--
-- 2. Un administrateur peut désormais renommer ou supprimer n'importe quel
--    canal — utile notamment pour nettoyer les doublons visibles dans la
--    liste "Messagerie" (créés par de petites variations du nom de
--    département saisi dans le formulaire "Créer un canal de département" :
--    l'index unique ux_conversations_canal_departement ne déduplique que les
--    chaînes strictement identiques).
--
-- 3. Un administrateur n'était visible dans un canal de département que
--    s'il y était participant (cf. correctif 0014, qui ne couvre que les
--    canaux déjà créés et les créations via creer_canal_departement) : pour
--    pouvoir renommer/supprimer même un canal auto-créé par
--    synchroniser_canaux_profil_manuel auquel aucun administrateur n'a
--    encore été ajouté, tout administrateur peut désormais lire tous les
--    canaux (policy SELECT étendue).
-- ============================================================================

-- 1a. Retire le préfixe des canaux déjà créés.
update public.conversations
  set titre = departement
  where type = 'canal' and departement is not null;

-- 1b. Nouveaux canaux de département créés automatiquement à la synchronisation
-- d'un profil (CREATE OR REPLACE, même signature que la migration 0008).
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
    values ('canal', 'Toute la banque — KHS Bank', true, p_profil.id)
    on conflict (canal_general) where canal_general do nothing;

  select id into v_canal_general_id from public.conversations where canal_general limit 1;

  if v_canal_general_id is not null then
    insert into public.conversation_participants (conversation_id, profil_id, peut_publier)
      values (v_canal_general_id, p_profil.id, p_profil.role = 'administrateur')
      on conflict (conversation_id, profil_id) do update set peut_publier = excluded.peut_publier;
  end if;

  insert into public.conversations (type, titre, departement, created_by)
    values ('canal', p_profil.departement, p_profil.departement, p_profil.id)
    on conflict (departement) where (type = 'canal' and departement is not null) do nothing;

  select id into v_canal_departement_id
    from public.conversations where type = 'canal' and departement = p_profil.departement;

  if v_canal_departement_id is not null then
    insert into public.conversation_participants (conversation_id, profil_id, peut_publier)
      values (v_canal_departement_id, p_profil.id, p_profil.role in ('administrateur', 'validateur'))
      on conflict (conversation_id, profil_id) do update set peut_publier = excluded.peut_publier;
  end if;
end;
$$;

-- 1c. Création manuelle d'avance par un administrateur (CREATE OR REPLACE,
-- même signature que la migration 0011/0014).
create or replace function public.creer_canal_departement(p_departement text)
returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_canal public.conversations;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'administrateur') then
    raise exception 'Seul un administrateur peut créer un canal de département.';
  end if;
  if p_departement is null or length(trim(p_departement)) = 0 then
    raise exception 'Le département ne peut pas être vide.';
  end if;

  insert into public.conversations (type, titre, departement, created_by)
    values ('canal', trim(p_departement), trim(p_departement), auth.uid())
    on conflict (departement) where (type = 'canal' and departement is not null) do nothing;

  select * into v_canal from public.conversations where type = 'canal' and departement = trim(p_departement);

  insert into public.conversation_participants (conversation_id, profil_id, peut_publier)
    select v_canal.id, p.id, p.role in ('administrateur', 'validateur')
    from public.profiles p
    where p.departement = trim(p_departement)
    on conflict (conversation_id, profil_id) do update set peut_publier = excluded.peut_publier;

  insert into public.conversation_participants (conversation_id, profil_id, peut_publier)
    values (v_canal.id, auth.uid(), true)
    on conflict (conversation_id, profil_id) do update set peut_publier = true;

  return v_canal;
end;
$$;

-- 3. Tout administrateur peut lire tous les canaux (même ceux où il n'est
-- pas encore participant), en plus des règles déjà en place (créateur, ou
-- co-participant quel que soit le type de conversation).
drop policy if exists "conversations_lecture_participant" on public.conversations;
create policy "conversations_lecture_participant"
  on public.conversations for select
  to authenticated
  using (
    created_by = auth.uid()
    or public.est_participant_conversation(id)
    or (
      type = 'canal'
      and exists (select 1 from public.profiles where id = auth.uid() and role = 'administrateur')
    )
  );

-- Un message transféré pointe vers son message d'origine
-- (transfere_de_message_id) sans règle ON DELETE explicite : supprimer un
-- canal dont un message aurait été transféré ailleurs échouait donc sur
-- cette contrainte. On la rend permissive (le message transféré garde son
-- contenu, seul le lien vers l'original disparaît).
alter table public.messages drop constraint if exists messages_transfere_de_message_id_fkey;
alter table public.messages
  add constraint messages_transfere_de_message_id_fkey
  foreign key (transfere_de_message_id) references public.messages (id) on delete set null;

-- 2a. Renommer un canal.
create or replace function public.renommer_canal(p_conversation_id uuid, p_nouveau_titre text)
returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_canal public.conversations;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'administrateur') then
    raise exception 'Seul un administrateur peut renommer un canal.';
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

grant execute on function public.renommer_canal(uuid, text) to authenticated;

-- 2b. Supprimer un canal (les participants, messages, pièces jointes,
-- accusés de lecture et alertes associés sont supprimés en cascade par les
-- contraintes de clé étrangère existantes — migration 0008/0010).
create or replace function public.supprimer_canal(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'administrateur') then
    raise exception 'Seul un administrateur peut supprimer un canal.';
  end if;

  delete from public.conversations where id = p_conversation_id and type = 'canal';

  if not found then
    raise exception 'Canal introuvable.';
  end if;
end;
$$;

grant execute on function public.supprimer_canal(uuid) to authenticated;
