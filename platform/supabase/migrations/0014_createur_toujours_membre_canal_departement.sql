-- ============================================================================
-- Correctif : un administrateur qui crée d'avance le canal d'un département
-- (fonction creer_canal_departement, migration 0011) n'y était ajouté comme
-- participant que si son PROPRE département correspondait exactement à
-- celui du canal — un administrateur d'un autre département ne voyait donc
-- jamais le canal qu'il venait pourtant de créer (la conversation existe
-- bien, "créer_by" le prouve, mais la liste "/messagerie" n'affiche que les
-- conversations dont on est participant).
--
-- Correctif : le créateur est désormais toujours ajouté comme participant,
-- avec le droit de publier, même si son département ne correspond pas.
-- ============================================================================

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
    values ('canal', 'Département — ' || trim(p_departement), trim(p_departement), auth.uid())
    on conflict (departement) where (type = 'canal' and departement is not null) do nothing;

  select * into v_canal from public.conversations where type = 'canal' and departement = trim(p_departement);

  -- Agents déjà présents dans ce département.
  insert into public.conversation_participants (conversation_id, profil_id, peut_publier)
    select v_canal.id, p.id, p.role in ('administrateur', 'validateur')
    from public.profiles p
    where p.departement = trim(p_departement)
    on conflict (conversation_id, profil_id) do update set peut_publier = excluded.peut_publier;

  -- L'administrateur créateur est toujours ajouté, même si son propre
  -- département ne correspond pas à celui du canal.
  insert into public.conversation_participants (conversation_id, profil_id, peut_publier)
    values (v_canal.id, auth.uid(), true)
    on conflict (conversation_id, profil_id) do update set peut_publier = true;

  return v_canal;
end;
$$;

-- Rattrapage : ajoute tous les administrateurs aux canaux de département
-- déjà créés (comme "Direction") auxquels ils n'étaient pas encore ajoutés.
insert into public.conversation_participants (conversation_id, profil_id, peut_publier)
select c.id, p.id, true
from public.conversations c
join public.profiles p on p.role = 'administrateur'
where c.type = 'canal' and c.departement is not null
on conflict (conversation_id, profil_id) do update set peut_publier = true;
