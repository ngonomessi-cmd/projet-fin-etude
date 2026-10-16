-- ============================================================================
-- Messagerie interne — KHS Bank (GED sécurisée)
--
-- Inspirée de la note « La messagerie interne » de l'Espace Agents de la Cour
-- suprême du Cameroun (conversations privées, groupes de travail, canaux
-- officiels, mention « Urgent », correction à 15 minutes, archivage,
-- confidentialité stricte, rétention réglable). Le principe est repris à
-- l'identique ; la hiérarchie d'autorisation, elle, est adaptée au RBAC plat
-- de KHS Bank (role_utilisateur : lecteur/redacteur/validateur/
-- administrateur/auditeur) plutôt qu'à l'organigramme d'une juridiction :
--   - administrateur : rôle « niveau 1 » du document source (Premier
--     Président / Procureur Général / super admin fusionnés) — ouvre une
--     conversation avec n'importe qui, seul à publier sur le canal général.
--   - validateur : rôle d'autorité de département — publie sur le canal de
--     son département, peut marquer un message « Urgent ».
--   - auditeur : reprend EXACTEMENT la règle du document source, KHS Bank a
--     déjà un rôle de ce nom dans le RBAC documentaire — il n'ouvre jamais de
--     conversation, il répond seulement à celles où il est invité.
--   - lecteur/redacteur : pas d'équivalent « guichet »/« greffier » dans un
--     organigramme bancaire plat ; simplification assumée (à annoncer en
--     soutenance, comme les autres écarts du projet) : ils peuvent ouvrir une
--     conversation privée ou un groupe avec n'importe quel agent non-auditeur,
--     KHS Bank n'ayant pas de règle d'escalade hiérarchique documentée pour sa
--     messagerie interne (contrairement au circuit de validation documentaire,
--     lui strictement RBAC — cf. migration 0001).
--
-- Règle de confidentialité la plus importante, reprise sans adaptation : à la
-- différence des documents (où administrateur/auditeur voient tout), ici
-- PERSONNE ne lit une conversation à laquelle il ne participe pas — pas même
-- l'administrateur. Seules les policies RLS ci-dessous en décident.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Types
-- ----------------------------------------------------------------------------

create type public.type_conversation as enum (
  'privee',  -- Entre deux agents (reprise de la conversation existante s'il y en a une)
  'groupe',  -- Plusieurs agents (60 au plus), autour d'un objet
  'canal'    -- Canal officiel (général ou par département), créé/peuplé automatiquement
);

-- ----------------------------------------------------------------------------
-- 2. Conversations
-- ----------------------------------------------------------------------------

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  type public.type_conversation not null,
  titre text,
  departement text,            -- renseigné uniquement pour un canal de département
  canal_general boolean not null default false,  -- vrai pour l'unique canal "Toute la banque"
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint ck_canal_departement_ou_general check (
    (type = 'canal') or (departement is null and canal_general = false)
  )
);

comment on table public.conversations is
  'Conversations privées, groupes de travail et canaux officiels de la messagerie interne KHS Bank.';

-- Un seul canal général, et un seul canal par département (appartenance
-- déduite automatiquement du département du profil, cf. déclencheur plus bas
-- — "aucune liste à tenir à jour", comme dans le document source).
create unique index ux_conversations_canal_general on public.conversations (canal_general) where canal_general;
create unique index ux_conversations_canal_departement on public.conversations (departement) where type = 'canal' and departement is not null;

alter table public.conversations enable row level security;

grant select, insert on public.conversations to authenticated;

-- La policy SELECT ("conversations_lecture_participant") est créée plus bas
-- (fin de la § 3), une fois la table conversation_participants en place : son
-- USING référence cette table, que PostgreSQL doit pouvoir résoudre dès la
-- création de la policy, pas seulement à l'exécution de chaque requête.

-- Les canaux ne sont jamais créés directement par un utilisateur : ils le sont
-- par le déclencheur de synchronisation (cf. § 6). Seules privee/groupe
-- passent par cette policy, et uniquement via les fonctions du § 7 (qui, en
-- SECURITY INVOKER, restent soumises à cette même policy).
create policy "conversations_creation_privee_ou_groupe"
  on public.conversations for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and type in ('privee', 'groupe')
    and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'auditeur')
  );

-- ----------------------------------------------------------------------------
-- 3. Participants
-- ----------------------------------------------------------------------------

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  profil_id uuid not null references public.profiles (id) on delete cascade,
  peut_publier boolean not null default true,   -- faux pour un simple membre d'un canal officiel
  archivee boolean not null default false,
  dernier_lu_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (conversation_id, profil_id)
);

comment on table public.conversation_participants is
  'Appartenance à une conversation : pour privee/groupe, fixée à la création ; '
  'pour un canal, synchronisée automatiquement sur le département/rôle du profil.';

create index idx_conversation_participants_profil on public.conversation_participants (profil_id);

alter table public.conversation_participants enable row level security;

grant select, insert, update on public.conversation_participants to authenticated;

create policy "participants_lecture_coparticipant"
  on public.conversation_participants for select
  to authenticated
  using (exists (
    select 1 from public.conversation_participants cp2
    where cp2.conversation_id = conversation_participants.conversation_id and cp2.profil_id = auth.uid()
  ));

-- Ajout des participants uniquement par le créateur de la conversation, au
-- moment de sa création (privee/groupe) — pas d'ajout a posteriori dans cette
-- première version : simplification assumée, à annoncer en soutenance.
create policy "participants_ajout_par_createur"
  on public.conversation_participants for insert
  to authenticated
  with check (exists (
    select 1 from public.conversations c
    where c.id = conversation_participants.conversation_id
      and c.created_by = auth.uid()
      and c.type in ('privee', 'groupe')
  ));

-- Chacun ne gère que son propre statut (archivage, dernière lecture).
create policy "participants_maj_propre_statut"
  on public.conversation_participants for update
  to authenticated
  using (profil_id = auth.uid())
  with check (profil_id = auth.uid());

-- Policy SELECT de "conversations" déclarée ici (et non § 2) : son USING
-- référence conversation_participants, qui doit déjà exister à la création
-- de la policy.
create policy "conversations_lecture_participant"
  on public.conversations for select
  to authenticated
  using (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversations.id and cp.profil_id = auth.uid()
  ));

-- ----------------------------------------------------------------------------
-- 4. Messages
-- ----------------------------------------------------------------------------

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  auteur_id uuid not null references public.profiles (id),
  contenu text not null check (char_length(contenu) between 1 and 10000),
  urgent boolean not null default false,
  modifie_at timestamptz,
  supprime_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.messages is
  'Messages de la messagerie interne. Suppression toujours logicielle (supprime_at) : '
  'jamais de DELETE, pour laisser la mention "Message supprimé par son auteur".';

create index idx_messages_conversation on public.messages (conversation_id, created_at);
create index idx_messages_auteur on public.messages (auteur_id, created_at);

alter table public.messages enable row level security;

-- Aucun GRANT DELETE : cf. commentaire ci-dessus.
grant select, insert, update on public.messages to authenticated;

create policy "messages_lecture_participant"
  on public.messages for select
  to authenticated
  using (exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id and cp.profil_id = auth.uid()
  ));

-- Expéditeur toujours celui connecté ; "Urgent" réservé à validateur/
-- administrateur (équivalent des "niveaux 1 et 2" du document source) ; sur
-- un canal, il faut avoir le droit d'y publier.
create policy "messages_envoi_participant_autorise"
  on public.messages for insert
  to authenticated
  with check (
    auteur_id = auth.uid()
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.profil_id = auth.uid()
        and cp.peut_publier
    )
    and (
      not urgent
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('administrateur', 'validateur'))
    )
  );

-- Correction : l'auteur peut modifier ou supprimer (logiciellement) son
-- message pendant 15 minutes seulement, et jamais après.
create policy "messages_correction_auteur_15_minutes"
  on public.messages for update
  to authenticated
  using (auteur_id = auth.uid() and supprime_at is null and created_at > now() - interval '15 minutes')
  with check (auteur_id = auth.uid());

-- Anti-abus : au plus 30 messages par minute et par agent (10 000 caractères
-- par message déjà garanti par la contrainte CHECK ci-dessus).
create function public.verifier_limite_messages()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if (select count(*) from public.messages where auteur_id = new.auteur_id and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'Limite de 30 messages par minute atteinte, réessayez dans quelques instants.';
  end if;
  return new;
end;
$$;

create trigger declencheur_limite_messages
  before insert on public.messages
  for each row execute function public.verifier_limite_messages();

-- Un nouveau message désarchive la conversation pour tous ses participants
-- ("elle réapparaît dès qu'un nouveau message y arrive").
create function public.desarchiver_conversation_sur_nouveau_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversation_participants
    set archivee = false
    where conversation_id = new.conversation_id and archivee = true;
  return new;
end;
$$;

create trigger declencheur_desarchivage_nouveau_message
  after insert on public.messages
  for each row execute function public.desarchiver_conversation_sur_nouveau_message();

-- ----------------------------------------------------------------------------
-- 5. Pièces jointes
-- ----------------------------------------------------------------------------

create table public.pieces_jointes_message (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  storage_path text not null,
  nom_fichier text not null,
  taille_octets bigint not null check (taille_octets > 0 and taille_octets <= 4 * 1024 * 1024),
  type_mime text not null check (type_mime in (
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation',
    'text/plain', 'text/csv',
    'image/png', 'image/jpeg', 'image/gif', 'image/webp'
  )),
  -- Analyse antivirus prévue par le document source : aucun moteur antivirus
  -- réel n'est disponible dans cet environnement de développement/démonstration
  -- (simplification assumée, à annoncer en soutenance). La colonne existe pour
  -- qu'un déploiement réel branche un webhook de scan (ex. ClamAV) qui la
  -- ferait passer à 'propre'/'infecte' ; ici, elle reste à 'non_analyse' et
  -- n'est volontairement pas vérifiée par les policies ci-dessous, pour ne pas
  -- bloquer l'usage normal de la fonctionnalité sans scanner réel branché.
  statut_analyse text not null default 'non_analyse' check (statut_analyse in ('non_analyse', 'propre', 'infecte')),
  created_at timestamptz not null default now()
);

create index idx_pieces_jointes_message on public.pieces_jointes_message (message_id);

alter table public.pieces_jointes_message enable row level security;

grant select, insert on public.pieces_jointes_message to authenticated;

create policy "pieces_jointes_lecture_participant"
  on public.pieces_jointes_message for select
  to authenticated
  using (exists (
    select 1 from public.messages m
    join public.conversation_participants cp on cp.conversation_id = m.conversation_id
    where m.id = pieces_jointes_message.message_id and cp.profil_id = auth.uid()
  ));

create policy "pieces_jointes_depot_par_auteur_du_message"
  on public.pieces_jointes_message for insert
  to authenticated
  with check (exists (
    select 1 from public.messages m where m.id = pieces_jointes_message.message_id and m.auteur_id = auth.uid()
  ));

-- Stockage : convention de chemin "<message_id>/<nom_du_fichier>", même
-- principe que le bucket "documents-ged" de la migration 0001. Le lien de
-- téléchargement signé (1 minute, cf. document source) est généré côté
-- application avec createSignedUrl(path, 60) ; ce n'est pas une policy RLS.
insert into storage.buckets (id, name, public)
values ('messagerie-pieces-jointes', 'messagerie-pieces-jointes', false)
on conflict (id) do nothing;

create policy "messagerie_lecture_fichiers_selon_participant"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'messagerie-pieces-jointes'
    and exists (
      select 1 from public.pieces_jointes_message pj
      join public.messages m on m.id = pj.message_id
      join public.conversation_participants cp on cp.conversation_id = m.conversation_id
      where pj.storage_path = storage.objects.name and cp.profil_id = auth.uid()
    )
  );

create policy "messagerie_depot_fichiers_par_auteur_message"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'messagerie-pieces-jointes'
    and exists (
      select 1 from public.messages m
      where m.id::text = split_part(storage.objects.name, '/', 1) and m.auteur_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 6. Canaux officiels : création et synchronisation automatiques
-- ----------------------------------------------------------------------------

-- Logique de synchronisation, réutilisée à la fois par le déclencheur (une
-- ligne à la fois, sur INSERT/UPDATE) et par le backfill ci-dessous (toutes
-- les lignes déjà existantes au moment de cette migration). Crée au passage,
-- de façon idempotente, le canal général et le canal du département si
-- besoin — "l'appartenance se déduit de la fonction et du département de
-- chaque compte : il n'y a aucune liste à tenir à jour" (document source, § 3-4).
create function public.synchroniser_canaux_profil_manuel(p_profil public.profiles)
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
    values ('canal', 'Département — ' || p_profil.departement, p_profil.departement, p_profil.id)
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

-- Déclencheur : appelle la fonction ci-dessus pour la ligne concernée, puis
-- gère en plus le cas d'un changement de département (on quitte l'ancien
-- canal, aucune liste à corriger manuellement).
create function public.synchroniser_canaux_profil()
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
      from public.conversations where type = 'canal' and departement = old.departement;
    if v_ancien_canal_departement_id is not null then
      delete from public.conversation_participants
        where conversation_id = v_ancien_canal_departement_id and profil_id = new.id;
    end if;
  end if;

  return new;
end;
$$;

create trigger declencheur_synchronisation_canaux_profil
  after insert or update of departement, role on public.profiles
  for each row execute function public.synchroniser_canaux_profil();

-- Backfill : synchronise tous les profils déjà existants au moment où cette
-- migration s'applique (création du canal général, des canaux de département,
-- et des lignes de participation manquantes).
do $$
declare
  v_profil public.profiles;
begin
  for v_profil in select * from public.profiles loop
    perform public.synchroniser_canaux_profil_manuel(v_profil);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 7. Ouverture de conversation : hiérarchie adaptée au RBAC KHS Bank
-- ----------------------------------------------------------------------------

-- Règle unique (cf. en-tête de ce fichier) : seul l'auditeur ne peut jamais
-- ouvrir de conversation ; tous les autres rôles le peuvent, avec quiconque.
-- "Répondre reste toujours possible" est garanti indépendamment : la policy
-- "messages_envoi_participant_autorise" n'exige que d'être déjà participant,
-- jamais d'avoir soi-même ouvert la conversation.
create function public.peut_ouvrir_conversation(p_cible_id uuid)
returns boolean
language sql
security invoker
stable
set search_path = public
as $$
  select
    p_cible_id <> auth.uid()
    and exists (select 1 from public.profiles where id = p_cible_id)
    and not exists (select 1 from public.profiles where id = auth.uid() and role = 'auditeur');
$$;

grant execute on function public.peut_ouvrir_conversation(uuid) to authenticated;

-- Reprend une conversation privée existante avec cette personne si elle
-- existe déjà ("si une conversation existe déjà avec la même personne, elle
-- est reprise"), sinon en crée une.
create function public.ouvrir_conversation_privee(p_autre_id uuid)
returns public.conversations
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_conversation public.conversations;
begin
  if not public.peut_ouvrir_conversation(p_autre_id) then
    raise exception 'Vous ne pouvez pas ouvrir de conversation avec cet agent.';
  end if;

  select c.* into v_conversation
    from public.conversations c
    where c.type = 'privee'
      and exists (select 1 from public.conversation_participants where conversation_id = c.id and profil_id = auth.uid())
      and exists (select 1 from public.conversation_participants where conversation_id = c.id and profil_id = p_autre_id)
    limit 1;

  if v_conversation.id is not null then
    return v_conversation;
  end if;

  insert into public.conversations (type, created_by) values ('privee', auth.uid()) returning * into v_conversation;
  insert into public.conversation_participants (conversation_id, profil_id) values (v_conversation.id, auth.uid());
  insert into public.conversation_participants (conversation_id, profil_id) values (v_conversation.id, p_autre_id);

  return v_conversation;
end;
$$;

grant execute on function public.ouvrir_conversation_privee(uuid) to authenticated;

-- Groupe de travail : 60 agents au plus (cf. document source), créateur inclus.
create function public.creer_groupe_messagerie(p_titre text, p_participants uuid[])
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
    if v_autre_id <> auth.uid() and exists (select 1 from public.profiles where id = v_autre_id) then
      insert into public.conversation_participants (conversation_id, profil_id) values (v_conversation.id, v_autre_id)
        on conflict (conversation_id, profil_id) do nothing;
    end if;
  end loop;

  return v_conversation;
end;
$$;

grant execute on function public.creer_groupe_messagerie(text, uuid[]) to authenticated;

-- ----------------------------------------------------------------------------
-- 8. Durée de conservation (réglable, 1 à 20 ans, par défaut 5)
-- ----------------------------------------------------------------------------

create table public.parametres_messagerie (
  id boolean primary key default true check (id),  -- une seule ligne (singleton)
  duree_conservation_ans integer not null default 5 check (duree_conservation_ans between 1 and 20),
  modifie_par uuid references public.profiles (id),
  modifie_at timestamptz not null default now()
);

insert into public.parametres_messagerie (id) values (true) on conflict (id) do nothing;

alter table public.parametres_messagerie enable row level security;

grant select on public.parametres_messagerie to authenticated;

create policy "parametres_messagerie_lecture_authentifies"
  on public.parametres_messagerie for select
  to authenticated
  using (true);

-- Modification réservée à l'administrateur (équivalent KHS Bank du "Premier
-- Président, Procureur Général ou super admin" du document source).
create function public.definir_duree_conservation_messagerie(p_annees integer)
returns public.parametres_messagerie
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parametres public.parametres_messagerie;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'administrateur') then
    raise exception 'Seul un administrateur peut modifier la durée de conservation de la messagerie.';
  end if;
  if p_annees < 1 or p_annees > 20 then
    raise exception 'La durée de conservation doit être comprise entre 1 et 20 ans.';
  end if;

  update public.parametres_messagerie
    set duree_conservation_ans = p_annees, modifie_par = auth.uid(), modifie_at = now()
    where id = true
    returning * into v_parametres;

  insert into public.audit_log (document_id, acteur_id, action, details)
    values (null, auth.uid(), 'modification_duree_conservation_messagerie', jsonb_build_object('nouvelle_duree_ans', p_annees));

  return v_parametres;
end;
$$;

grant execute on function public.definir_duree_conservation_messagerie(integer) to authenticated;

-- Purge automatique (appelée par un job planifié hors base — cf. le dossier
-- 10-packet-tracer pour la philosophie "pas d'accès CLI/cron direct depuis cet
-- environnement" ; ici, une route API Next.js protégée + Vercel Cron, voir
-- README). SECURITY DEFINER car elle doit traverser toutes les conversations,
-- pas seulement celles de son appelant ; réservée au rôle service_role
-- (aucun GRANT à "authenticated").
create function public.purger_messages_expires()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duree_ans integer;
  v_nombre_supprimes integer;
begin
  select duree_conservation_ans into v_duree_ans from public.parametres_messagerie where id = true;

  delete from public.messages
    where created_at < now() - make_interval(years => v_duree_ans);
  get diagnostics v_nombre_supprimes = row_count;

  -- Les conversations devenues vides disparaissent ; les canaux demeurent.
  delete from public.conversations c
    where c.type <> 'canal'
      and not exists (select 1 from public.messages m where m.conversation_id = c.id);

  return v_nombre_supprimes;
end;
$$;

-- Pas de GRANT à "authenticated" (volontaire : cette fonction traverse toutes
-- les conversations de tous les agents). Appelée uniquement par la route API
-- de purge (cf. README), avec la clé service_role — qui, sur Supabase,
-- nécessite tout de même ce GRANT explicite pour exécuter la fonction.
grant execute on function public.purger_messages_expires() to service_role;

-- ----------------------------------------------------------------------------
-- 9. Alertes par courriel (anti-spam : 1 au plus par heure et par
--    conversation, jamais pour un message déjà lu) — table de déduplication
--    utilisée par la fonction/route d'envoi (cf. README, § messagerie).
--    Aucun GRANT à "authenticated" : uniquement lue/écrite par service_role.
-- ----------------------------------------------------------------------------

create table public.alertes_email_messagerie (
  message_id uuid not null references public.messages (id) on delete cascade,
  destinataire_id uuid not null references public.profiles (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  envoye_at timestamptz not null default now(),
  primary key (message_id, destinataire_id)
);

create index idx_alertes_email_conversation_destinataire on public.alertes_email_messagerie (conversation_id, destinataire_id, envoye_at);

alter table public.alertes_email_messagerie enable row level security;
-- Aucune policy créée : table invisible depuis l'API pour "authenticated"
-- (ni GRANT ni policy), accessible uniquement via la clé service_role.

-- Calcule, pour chaque (conversation, destinataire) ayant au moins un message
-- non lu et pas déjà alerté dans la dernière heure, le message le plus récent
-- à mentionner dans le courriel ("un courriel par heure et par conversation,
-- jamais pour un message déjà lu"). Appelée par la route API de cron
-- (cf. src/app/api/cron/messagerie/route.ts), avec la clé service_role.
create function public.alertes_email_a_envoyer()
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
  join public.profiles p_auteur on p_auteur.id = m.auteur_id
  where not exists (
    select 1 from public.alertes_email_messagerie a
    where a.conversation_id = cp.conversation_id
      and a.destinataire_id = cp.profil_id
      and a.envoye_at > now() - interval '1 hour'
  )
  order by cp.conversation_id, cp.profil_id, m.created_at desc;
$$;

grant execute on function public.alertes_email_a_envoyer() to service_role;

-- ----------------------------------------------------------------------------
-- 10. Compteur de messages non lus (pastille rouge de la NavBar)
-- ----------------------------------------------------------------------------

create function public.compter_messages_non_lus()
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
    and m.created_at > coalesce(cp.dernier_lu_at, 'epoch'::timestamptz);
$$;

grant execute on function public.compter_messages_non_lus() to authenticated;

-- ----------------------------------------------------------------------------
-- 11. Temps réel (Supabase Realtime)
-- ----------------------------------------------------------------------------
-- "Les nouveaux messages s'affichent sans recharger la page" : la table doit
-- être ajoutée à la publication "supabase_realtime" pour que les abonnements
-- postgres_changes côté client (cf. ConversationTempsReel.tsx) reçoivent les
-- INSERT/UPDATE. RLS s'applique aussi au flux Realtime (un agent ne reçoit
-- que les évènements des conversations dont il est participant).
alter publication supabase_realtime add table public.messages;
