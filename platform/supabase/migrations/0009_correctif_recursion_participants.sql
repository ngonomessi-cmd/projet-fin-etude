-- ============================================================================
-- Correctif : récursion infinie sur la policy RLS de conversation_participants
--
-- La policy "participants_lecture_coparticipant" (migration 0008)
-- interrogeait conversation_participants depuis une policy posée sur
-- conversation_participants elle-même : PostgreSQL ré-évalue la policy pour
-- la sous-requête, qui ré-évalue la policy, etc. ("infinite recursion
-- detected in policy for relation conversation_participants", constaté à
-- l'usage réel — ouverture d'une conversation).
--
-- Correction standard (recommandée par la documentation Supabase pour ce cas
-- précis) : passer par une fonction SECURITY DEFINER, qui s'exécute avec les
-- droits du propriétaire des tables, donc hors RLS pour sa propre requête
-- interne — la policy appelle la fonction au lieu de recopier la sous-
-- requête, ce qui casse le cycle.
-- ============================================================================

create function public.est_participant_conversation(p_conversation_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = p_conversation_id and profil_id = auth.uid()
  );
$$;

grant execute on function public.est_participant_conversation(uuid) to authenticated;

drop policy if exists "participants_lecture_coparticipant" on public.conversation_participants;
create policy "participants_lecture_coparticipant"
  on public.conversation_participants for select
  to authenticated
  using (public.est_participant_conversation(conversation_id));
