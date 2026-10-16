-- ============================================================================
-- Messagerie interne — fonctionnalités avancées (KHS Bank)
--
-- Adapté d'une note technique décrivant la messagerie d'un autre site
-- (équipe interne séparée des visiteurs, "équipe_membres", pages /equipe/...).
-- Chez KHS Bank, tous les comptes "profiles" sont déjà des agents internes :
-- pas de table d'appartenance séparée, pas de pages /equipe/... — on
-- continue sur /messagerie et /admin/utilisateurs (migration 0008).
--
-- Hiérarchie à 4 niveaux de la note source, mappée sur le RBAC KHS Bank :
--   1 Direction              -> administrateur (écrit à tous)
--   2 Responsable de service -> validateur (écrit à tous)
--   3 Collaborateur          -> redacteur (tous sauf administrateur)
--   4 Stagiaire              -> lecteur (son département, hors administrateur)
--   auditeur (hors note source, propre au RBAC documentaire KHS Bank)
--     -> inchangé depuis la migration 0008 : jamais initiateur.
-- ============================================================================

-- Nécessite 0009_correctif_recursion_participants.sql (appliqué avant celui-ci).

-- ----------------------------------------------------------------------------
-- 1. Hiérarchie d'ouverture de conversation (remplace la règle de 0008)
-- ----------------------------------------------------------------------------
-- Signature identique à la version 0008 (p_cible_id uuid) : CREATE OR REPLACE
-- suffit, aucune dépendance (trigger/policy) à recréer.
create or replace function public.peut_ouvrir_conversation(p_cible_id uuid)
returns boolean
language sql
security invoker
stable
set search_path = public
as $$
  select
    p_cible_id <> auth.uid()
    and exists (select 1 from public.profiles where id = p_cible_id)
    and (
      -- Direction et responsables de service écrivent à tout le monde.
      exists (select 1 from public.profiles where id = auth.uid() and role in ('administrateur', 'validateur'))
      -- Collaborateur : tout le monde sauf la Direction.
      or (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'redacteur')
        and not exists (select 1 from public.profiles where id = p_cible_id and role = 'administrateur')
      )
      -- Stagiaire : uniquement son propre département, jamais la Direction.
      or (
        exists (select 1 from public.profiles where id = auth.uid() and role = 'lecteur')
        and exists (
          select 1 from public.profiles pa, public.profiles pc
          where pa.id = auth.uid() and pc.id = p_cible_id
            and pa.departement = pc.departement
            and pc.role <> 'administrateur'
        )
      )
      -- auditeur : jamais (ni aucune autre condition ci-dessus ne le couvre).
    );
$$;

-- ----------------------------------------------------------------------------
-- 2. Sourdine (mute) et transfert
-- ----------------------------------------------------------------------------

alter table public.conversation_participants
  add column if not exists sourdine boolean not null default false;
comment on column public.conversation_participants.sourdine is
  'Mise en sourdine : la conversation continue de recevoir des messages, mais ne compte plus dans le badge de non-lus (cf. compter_messages_non_lus ci-dessous) ni dans les alertes e-mail.';

alter table public.messages
  add column if not exists transfere_de_message_id uuid references public.messages (id);
comment on column public.messages.transfere_de_message_id is
  'Renseigné pour un message transféré (bouton "Transférer") : pointe vers le message d''origine. Les pièces jointes ne sont pas reprises lors d''un transfert (limitation assumée).';

-- Compteur de non-lus : exclut désormais les conversations en sourdine
-- (CREATE OR REPLACE, même signature que 0008).
create or replace function public.compter_messages_non_lus()
returns integer
language sql
security invoker
stable
set search_path = public
as $$
  select count(*)::integer
  from public.messages m
  join public.conversation_participants cp
    on cp.conversation_id = m.conversation_id and cp.profil_id = auth.uid()
  where m.supprime_at is null
    and m.auteur_id <> auth.uid()
    and not cp.sourdine
    and m.created_at > coalesce(cp.dernier_lu_at, 'epoch'::timestamptz);
$$;

-- ----------------------------------------------------------------------------
-- 3. Pièces jointes : 10 Mo (au lieu de 4), et plus aucune non analysée
--    n'est acceptée (hors date, l'analyse a toujours lieu avant l'envoi côté
--    application — cf. lib/messagerie/antivirus.ts — mais la contrainte est
--    reprise ici au niveau base, "la base refuse tout message dont la pièce
--    jointe n'a pas été analysée").
-- ----------------------------------------------------------------------------

alter table public.pieces_jointes_message
  drop constraint if exists pieces_jointes_message_taille_octets_check,
  add constraint pieces_jointes_message_taille_octets_check
    check (taille_octets > 0 and taille_octets <= 10 * 1024 * 1024);

drop policy if exists "pieces_jointes_depot_par_auteur_du_message" on public.pieces_jointes_message;
create policy "pieces_jointes_depot_par_auteur_du_message"
  on public.pieces_jointes_message for insert
  to authenticated
  with check (
    statut_analyse = 'propre'
    and exists (select 1 from public.messages m where m.id = pieces_jointes_message.message_id and m.auteur_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- 4. Présence (heartbeat) — sert à la fois à l'alerte e-mail ("hors ligne
--    depuis plus de 2 minutes") et, de façon approchée, au statut "reçu".
-- ----------------------------------------------------------------------------

alter table public.profiles
  add column if not exists derniere_activite_at timestamptz;
comment on column public.profiles.derniere_activite_at is
  'Mise à jour par signaler_activite(), appelée toutes les 30 s par le client tant que l''onglet est visible (cf. PresenceMessagerie.tsx). "Hors ligne" = NULL ou vieille de plus de 2 minutes.';

grant update (derniere_activite_at) on public.profiles to authenticated;

create function public.signaler_activite()
returns void
language sql
security invoker
set search_path = public
as $$
  update public.profiles set derniere_activite_at = now() where id = auth.uid();
$$;

grant execute on function public.signaler_activite() to authenticated;

-- ----------------------------------------------------------------------------
-- 5. Accusés de lecture par message (façon WhatsApp : ✓ envoyé,
--    ✓✓ gris = reçu, ✓✓ bleu = lu)
-- ----------------------------------------------------------------------------

create table public.message_statuts (
  message_id uuid not null references public.messages (id) on delete cascade,
  profil_id uuid not null references public.profiles (id) on delete cascade,
  recu_at timestamptz,
  lu_at timestamptz,
  primary key (message_id, profil_id)
);

comment on table public.message_statuts is
  'Une ligne par (message, destinataire autre que l''auteur), créée automatiquement '
  'à l''envoi du message. recu_at : le destinataire avait l''application ouverte '
  '(reçu en temps réel). lu_at : la conversation était affichée, onglet visible.';

create index idx_message_statuts_profil on public.message_statuts (profil_id);

alter table public.message_statuts enable row level security;

grant select, update on public.message_statuts to authenticated;
-- Pas de GRANT INSERT à "authenticated" : les lignes sont semées uniquement
-- par le déclencheur ci-dessous (SECURITY DEFINER), jamais par le client.

create policy "statuts_lecture_participant"
  on public.message_statuts for select
  to authenticated
  using (exists (
    select 1 from public.messages m
    join public.conversation_participants cp on cp.conversation_id = m.conversation_id
    where m.id = message_statuts.message_id and cp.profil_id = auth.uid()
  ));

-- Chacun ne met à jour que son propre accusé (on ne peut jamais marquer un
-- message comme lu "pour quelqu'un d'autre").
create policy "statuts_maj_propre_accuse"
  on public.message_statuts for update
  to authenticated
  using (profil_id = auth.uid())
  with check (profil_id = auth.uid());

create function public.semer_statuts_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.message_statuts (message_id, profil_id)
  select new.id, cp.profil_id
  from public.conversation_participants cp
  where cp.conversation_id = new.conversation_id and cp.profil_id <> new.auteur_id;
  return new;
end;
$$;

create trigger declencheur_semer_statuts_message
  after insert on public.messages
  for each row execute function public.semer_statuts_message();

-- Marque tous les messages non encore lus d'une conversation comme reçus et
-- lus pour l'appelant, et met à jour le repère "dernier_lu_at" historique
-- (badge de non-lus) en une seule fonction — remplace l'ancienne mise à jour
-- directe de conversation_participants depuis l'application.
create function public.marquer_conversation_lue(p_conversation_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.conversation_participants
    set dernier_lu_at = now()
    where conversation_id = p_conversation_id and profil_id = auth.uid();

  update public.message_statuts ms
    set lu_at = now(), recu_at = coalesce(ms.recu_at, now())
    where ms.profil_id = auth.uid()
      and ms.lu_at is null
      and ms.message_id in (select id from public.messages where conversation_id = p_conversation_id);
end;
$$;

grant execute on function public.marquer_conversation_lue(uuid) to authenticated;

-- Appelée par l'écoute Realtime globale (cf. PresenceMessagerie.tsx) à
-- chaque nouveau message reçu : aucune vérification d'appartenance n'est
-- nécessaire ici, la policy "statuts_maj_propre_accuse" ci-dessus s'en
-- charge déjà (la mise à jour ne touche aucune ligne si l'appelant n'est pas
-- destinataire de ce message).
create function public.marquer_message_recu(p_message_id uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.message_statuts
    set recu_at = coalesce(recu_at, now())
    where message_id = p_message_id and profil_id = auth.uid();
$$;

grant execute on function public.marquer_message_recu(uuid) to authenticated;

-- Temps réel : la table doit être publiée pour que les coches se mettent à
-- jour sans recharger la page (RLS s'applique aussi au flux Realtime, comme
-- pour "messages" en migration 0008).
alter publication supabase_realtime add table public.message_statuts;

-- ----------------------------------------------------------------------------
-- 6. Transfert de message
-- ----------------------------------------------------------------------------
-- Ne reprend que le texte (pas les pièces jointes, cf. commentaire § 2) :
-- copier un fichier vers un nouveau chemin de stockage aurait demandé de
-- dupliquer l'objet Supabase Storage, hors scope de cette version.
create function public.transferer_message(p_message_id uuid, p_conversation_cible_id uuid)
returns public.messages
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_original public.messages;
  v_nouveau public.messages;
begin
  select * into v_original from public.messages where id = p_message_id;
  if v_original.id is null or v_original.supprime_at is not null then
    raise exception 'Message introuvable ou supprimé.';
  end if;

  insert into public.messages (conversation_id, auteur_id, contenu, transfere_de_message_id)
    values (p_conversation_cible_id, auth.uid(), v_original.contenu, p_message_id)
    returning * into v_nouveau;

  return v_nouveau;
end;
$$;

grant execute on function public.transferer_message(uuid, uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 7. Rétention : 3 ans par défaut (au lieu de 5), réglable de 1 à 20 ans
--    (fonction definir_duree_conservation_messagerie inchangée, 0008).
-- ----------------------------------------------------------------------------

alter table public.parametres_messagerie alter column duree_conservation_ans set default 3;
update public.parametres_messagerie set duree_conservation_ans = 3 where duree_conservation_ans = 5;

-- ----------------------------------------------------------------------------
-- 8. Alertes e-mail : déclenchées à l'envoi du message (pas seulement par
--    une tâche planifiée), uniquement si le destinataire est hors ligne
--    depuis plus de 2 minutes. Remplace la version "balayage périodique" de
--    la migration 0008 (même rôle service_role, nouveau paramètre optionnel
--    p_message_id ; signature différente -> DROP explicite nécessaire).
-- ----------------------------------------------------------------------------

drop function if exists public.alertes_email_a_envoyer();

create function public.alertes_email_a_envoyer(p_message_id uuid default null)
returns table (
  message_id uuid,
  destinataire_id uuid,
  conversation_id uuid,
  conversation_titre text,
  auteur_nom text,
  auteur_role public.role_utilisateur
)
language sql
security definer
set search_path = public
as $$
  select distinct on (cp.conversation_id, cp.profil_id)
    m.id, cp.profil_id, cp.conversation_id,
    coalesce(c.titre, 'Conversation privée'), p_auteur.nom_complet, p_auteur.role
  from public.conversation_participants cp
  join public.conversations c on c.id = cp.conversation_id
  join public.messages m on m.conversation_id = cp.conversation_id
    and m.auteur_id <> cp.profil_id
    and m.supprime_at is null
    and m.created_at > coalesce(cp.dernier_lu_at, 'epoch'::timestamptz)
    and (p_message_id is null or m.id = p_message_id)
  join public.profiles p_auteur on p_auteur.id = m.auteur_id
  join public.profiles p_destinataire on p_destinataire.id = cp.profil_id
  where not cp.sourdine
    and (p_destinataire.derniere_activite_at is null or p_destinataire.derniere_activite_at < now() - interval '2 minutes')
    and not exists (
      select 1 from public.alertes_email_messagerie a
      where a.conversation_id = cp.conversation_id
        and a.destinataire_id = cp.profil_id
        and a.envoye_at > now() - interval '1 hour'
    )
  order by cp.conversation_id, cp.profil_id, m.created_at desc;
$$;

grant execute on function public.alertes_email_a_envoyer(uuid) to service_role;
