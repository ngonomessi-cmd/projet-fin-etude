-- ============================================================================
-- Permet à un administrateur de créer d'avance le canal officiel d'un
-- département, même si aucun agent n'y est encore affecté (jusqu'ici, un
-- canal de département n'apparaissait que lorsqu'un premier profil de ce
-- département était créé ou modifié, via synchroniser_canaux_profil_manuel
-- — migration 0008). Dès qu'un agent rejoint ensuite ce département, le
-- même déclencheur l'y ajoute automatiquement, sans rien à refaire ici.
-- ============================================================================

create function public.creer_canal_departement(p_departement text)
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

  -- Ajoute immédiatement les agents déjà présents dans ce département
  -- (sinon ils n'y seraient membres qu'à leur prochaine modification de profil).
  insert into public.conversation_participants (conversation_id, profil_id, peut_publier)
    select v_canal.id, p.id, p.role in ('administrateur', 'validateur')
    from public.profiles p
    where p.departement = trim(p_departement)
    on conflict (conversation_id, profil_id) do update set peut_publier = excluded.peut_publier;

  return v_canal;
end;
$$;

grant execute on function public.creer_canal_departement(text) to authenticated;
