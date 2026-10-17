-- ============================================================================
-- Correctif : "new row violates row-level security policy for table
-- conversations" lors de l'ouverture d'une conversation privée ou de la
-- création d'un groupe.
--
-- Diagnostic (reproduit directement en base, hors application) : l'échec ne
-- vient pas de l'INSERT lui-même (il réussit seul, et dans un simple bloc
-- DO), mais du "RETURNING * INTO ..." qui le suit dans
-- ouvrir_conversation_privee / creer_groupe_messagerie. PostgreSQL exige que
-- la ligne tout juste insérée soit aussi lisible selon la policy SELECT de
-- la table — or à cet instant précis (juste après l'INSERT dans
-- "conversations", juste avant l'INSERT dans "conversation_participants" qui
-- suit dans la même fonction), aucune ligne de participation n'existe encore
-- pour cette conversation : la policy "conversations_lecture_participant"
-- (qui ne vérifie que conversation_participants) refuse donc la lecture, et
-- PostgreSQL rapporte ce refus avec le même message que pour un WITH CHECK.
--
-- Correctif : le créateur d'une conversation peut toujours la lire, même
-- avant d'y être formellement participant.
-- ============================================================================

drop policy if exists "conversations_lecture_participant" on public.conversations;
create policy "conversations_lecture_participant"
  on public.conversations for select
  to authenticated
  using (
    created_by = auth.uid()
    or public.est_participant_conversation(id)
  );
