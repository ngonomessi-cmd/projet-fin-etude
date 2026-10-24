-- ============================================================================
-- Ateliers documentaires : rédaction Word / Excel / PowerPoint dans la
-- plateforme, partage ciblé, modèles.
--
-- Règles (validées avec le porteur du projet) :
--   - Créer / éditer / partager : rédacteur, validateur, administrateur.
--   - Lecteur : lecture seule. Auditeur : lecture de tout, mais ne produit
--     jamais de document (séparation des pouvoirs : un contrôleur ne peut
--     pas être juge et partie).
--   - Partage : vers toute personne qu'on a le droit de contacter dans la
--     messagerie (peut_ouvrir_conversation), ou vers une conversation où l'on
--     peut publier ; en lecture ou en co-édition. Un document CONFIDENTIEL ne
--     se partage qu'à l'intérieur de son département. Tout partage est
--     inscrit au journal d'audit.
--   - Édition : un seul éditeur à la fois (verrou de 2 minutes, renouvelé
--     tant que l'éditeur est ouvert) ; uniquement à l'état brouillon/rejeté.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Le validateur peut désormais créer des documents
-- ----------------------------------------------------------------------------
drop policy if exists "depot_document_par_redacteur" on public.documents;
create policy "depot_document_par_redacteur"
  on public.documents for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and statut = 'brouillon'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('redacteur', 'validateur', 'administrateur')
    )
  );

-- ----------------------------------------------------------------------------
-- 2. Contenu éditable dans la plateforme + verrou d'édition
-- ----------------------------------------------------------------------------
alter table public.documents
  add column if not exists format_atelier text check (format_atelier in ('texte', 'tableur', 'presentation')),
  add column if not exists contenu jsonb,
  add column if not exists verrou_par uuid references public.profiles (id),
  add column if not exists verrou_jusqua timestamptz;

alter table public.documents drop constraint if exists ck_documents_taille_contenu;
alter table public.documents add constraint ck_documents_taille_contenu
  check (contenu is null or octet_length(contenu::text) <= 2 * 1024 * 1024);

-- ----------------------------------------------------------------------------
-- 3. Partages
-- ----------------------------------------------------------------------------
create table if not exists public.document_partages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  organisation text not null,
  profil_id uuid references public.profiles (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete cascade,
  droit text not null default 'lecture' check (droit in ('lecture', 'edition')),
  partage_par uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint ck_partage_une_cible check ((profil_id is null) <> (conversation_id is null))
);

create unique index if not exists ux_partage_document_profil
  on public.document_partages (document_id, profil_id) where profil_id is not null;
create unique index if not exists ux_partage_document_conversation
  on public.document_partages (document_id, conversation_id) where conversation_id is not null;
create index if not exists idx_partages_profil on public.document_partages (profil_id);
create index if not exists idx_partages_conversation on public.document_partages (conversation_id);

alter table public.document_partages enable row level security;
-- Lecture seulement : création et retrait passent par les fonctions plus bas.
grant select on public.document_partages to authenticated;

drop policy if exists "partages_lecture_concernes" on public.document_partages;
create policy "partages_lecture_concernes"
  on public.document_partages for select
  to authenticated
  using (
    partage_par = auth.uid()
    or profil_id = auth.uid()
    or (
      conversation_id is not null
      and exists (
        select 1 from public.conversation_participants cp
        where cp.conversation_id = document_partages.conversation_id and cp.profil_id = auth.uid()
      )
    )
  );

-- Partage dont bénéficie l'utilisateur courant (directement ou via une
-- conversation dont il est membre). SECURITY DEFINER : appelée depuis la règle
-- de visibilité des documents, sans dépendre des policies d'autres tables.
create or replace function public.partage_avec_moi(p_document_id uuid, p_edition boolean default false)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.document_partages s
    where s.document_id = p_document_id
      and (not p_edition or s.droit = 'edition')
      and (
        s.profil_id = auth.uid()
        or (
          s.conversation_id is not null
          and exists (
            select 1 from public.conversation_participants cp
            where cp.conversation_id = s.conversation_id and cp.profil_id = auth.uid()
          )
        )
      )
  );
$$;
grant execute on function public.partage_avec_moi(uuid, boolean) to authenticated;

-- Règle de visibilité : celle de la migration 0018, plus les partages.
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
        or public.partage_avec_moi(d.id, false)
      )
  );
$$;

-- Peut modifier le CONTENU : auteur ou co-éditeur, document encore en
-- brouillon ou rejeté, rôle producteur (jamais lecteur ni auditeur).
create or replace function public.peut_editer_document(p_document_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.documents d
    join public.profiles p on p.id = auth.uid()
    where d.id = p_document_id
      and p.organisation = d.organisation
      and p.role in ('redacteur', 'validateur', 'administrateur')
      and d.statut in ('brouillon', 'rejete')
      and (d.owner_id = auth.uid() or public.partage_avec_moi(d.id, true))
  );
$$;
grant execute on function public.peut_editer_document(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 4. Partager / retirer / lister
-- ----------------------------------------------------------------------------
create or replace function public.partager_document(
  p_document_id uuid,
  p_profils uuid[] default '{}',
  p_conversation_id uuid default null,
  p_droit text default 'lecture'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moi public.profiles;
  v_doc public.documents;
  v_cible public.profiles;
  v_id uuid;
  v_nombre integer := 0;
begin
  select * into v_moi from public.profiles where id = auth.uid();
  if v_moi.id is null or v_moi.role not in ('redacteur', 'validateur', 'administrateur') then
    raise exception 'Votre rôle ne permet pas de partager un document.';
  end if;
  if p_droit not in ('lecture', 'edition') then
    raise exception 'Droit de partage inconnu.';
  end if;

  select * into v_doc from public.documents where id = p_document_id;
  if v_doc.id is null or v_doc.organisation <> v_moi.organisation then
    raise exception 'Document introuvable.';
  end if;
  if not (
    v_doc.owner_id = v_moi.id
    or v_moi.role = 'administrateur'
    or public.partage_avec_moi(v_doc.id, true)
  ) then
    raise exception 'Seuls l''auteur, un co-éditeur ou un administrateur peuvent partager ce document.';
  end if;

  -- Personnes
  foreach v_id in array coalesce(p_profils, '{}') loop
    select * into v_cible from public.profiles where id = v_id;
    if v_cible.id is null or v_cible.organisation <> v_moi.organisation then
      raise exception 'Destinataire introuvable.';
    end if;
    if not public.peut_ouvrir_conversation(v_id) then
      raise exception 'Vous ne pouvez pas partager avec % : vous n''êtes pas autorisé à le contacter.', v_cible.nom_complet;
    end if;
    if v_doc.classification = 'confidentiel' and v_cible.departement <> v_doc.departement then
      raise exception 'Document confidentiel : % n''appartient pas au département %.', v_cible.nom_complet, v_doc.departement;
    end if;
    insert into public.document_partages (document_id, organisation, profil_id, droit, partage_par)
      values (v_doc.id, v_doc.organisation, v_id, p_droit, v_moi.id)
      on conflict (document_id, profil_id) where profil_id is not null
      do update set droit = excluded.droit, partage_par = excluded.partage_par, created_at = now();
    v_nombre := v_nombre + 1;
  end loop;

  -- Conversation (groupe ou canal) : il faut y être membre et pouvoir y publier
  if p_conversation_id is not null then
    if not exists (
      select 1 from public.conversation_participants cp
      join public.conversations c on c.id = cp.conversation_id
      where cp.conversation_id = p_conversation_id
        and cp.profil_id = v_moi.id
        and cp.peut_publier
        and c.organisation = v_moi.organisation
    ) then
      raise exception 'Vous ne pouvez pas publier dans cette conversation.';
    end if;
    if v_doc.classification = 'confidentiel' and exists (
      select 1 from public.conversation_participants cp
      join public.profiles p on p.id = cp.profil_id
      where cp.conversation_id = p_conversation_id and p.departement <> v_doc.departement
    ) then
      raise exception 'Document confidentiel : cette conversation compte des membres hors du département %.', v_doc.departement;
    end if;
    insert into public.document_partages (document_id, organisation, conversation_id, droit, partage_par)
      values (v_doc.id, v_doc.organisation, p_conversation_id, p_droit, v_moi.id)
      on conflict (document_id, conversation_id) where conversation_id is not null
      do update set droit = excluded.droit, partage_par = excluded.partage_par, created_at = now();
    v_nombre := v_nombre + 1;
  end if;

  if v_nombre = 0 then
    raise exception 'Choisissez au moins un destinataire.';
  end if;

  insert into public.audit_log (document_id, acteur_id, action, details)
    values (
      v_doc.id, v_moi.id, 'partage',
      jsonb_build_object('profils', coalesce(p_profils, '{}'), 'conversation', p_conversation_id, 'droit', p_droit)
    );

  return v_nombre;
end;
$$;
grant execute on function public.partager_document(uuid, uuid[], uuid, text) to authenticated;

create or replace function public.retirer_partage(p_partage_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_partage public.document_partages;
  v_doc public.documents;
  v_moi public.profiles;
begin
  select * into v_moi from public.profiles where id = auth.uid();
  select * into v_partage from public.document_partages where id = p_partage_id;
  if v_partage.id is null then
    raise exception 'Partage introuvable.';
  end if;
  select * into v_doc from public.documents where id = v_partage.document_id;
  if not (
    v_doc.owner_id = v_moi.id
    or v_partage.partage_par = v_moi.id
    or (v_moi.role = 'administrateur' and v_moi.organisation = v_doc.organisation)
  ) then
    raise exception 'Vous ne pouvez pas retirer ce partage.';
  end if;
  delete from public.document_partages where id = p_partage_id;
  insert into public.audit_log (document_id, acteur_id, action, details)
    values (v_doc.id, v_moi.id, 'retrait_partage',
      jsonb_build_object('profil', v_partage.profil_id, 'conversation', v_partage.conversation_id));
end;
$$;
grant execute on function public.retirer_partage(uuid) to authenticated;

create or replace function public.lister_partages_document(p_document_id uuid)
returns table (
  id uuid,
  cible text,
  type_cible text,
  droit text,
  partage_par text,
  created_at timestamptz,
  retirable boolean
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_doc public.documents;
  v_moi public.profiles;
begin
  select * into v_doc from public.documents where documents.id = p_document_id;
  select * into v_moi from public.profiles where profiles.id = auth.uid();
  if v_doc.id is null or not public.peut_lire_document(v_doc) then
    return;
  end if;
  return query
    select s.id,
      coalesce(pc.nom_complet, c.titre, case when c.canal_general then 'Toute l''organisation' else 'Canal ' || c.departement end),
      case when s.profil_id is not null then 'personne' else c.type::text end,
      s.droit,
      pp.nom_complet,
      s.created_at,
      (v_doc.owner_id = v_moi.id or s.partage_par = v_moi.id
        or (v_moi.role = 'administrateur' and v_moi.organisation = v_doc.organisation))
    from public.document_partages s
    join public.profiles pp on pp.id = s.partage_par
    left join public.profiles pc on pc.id = s.profil_id
    left join public.conversations c on c.id = s.conversation_id
    where s.document_id = p_document_id
    order by s.created_at desc;
end;
$$;
grant execute on function public.lister_partages_document(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 5. Verrou d'édition et enregistrement du contenu
-- ----------------------------------------------------------------------------
create or replace function public.prendre_verrou_document(p_document_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doc public.documents;
  v_nom text;
begin
  if not public.peut_editer_document(p_document_id) then
    return jsonb_build_object('ok', false, 'motif', 'lecture_seule');
  end if;
  select * into v_doc from public.documents where id = p_document_id for update;
  if v_doc.verrou_par is not null and v_doc.verrou_par <> auth.uid() and v_doc.verrou_jusqua > now() then
    select nom_complet into v_nom from public.profiles where id = v_doc.verrou_par;
    return jsonb_build_object('ok', false, 'motif', 'verrouille', 'par', v_nom, 'jusqua', v_doc.verrou_jusqua);
  end if;
  update public.documents
    set verrou_par = auth.uid(), verrou_jusqua = now() + interval '2 minutes'
    where id = p_document_id;
  return jsonb_build_object('ok', true);
end;
$$;
grant execute on function public.prendre_verrou_document(uuid) to authenticated;

create or replace function public.liberer_verrou_document(p_document_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.documents
    set verrou_par = null, verrou_jusqua = null
    where id = p_document_id and verrou_par = auth.uid();
$$;
grant execute on function public.liberer_verrou_document(uuid) to authenticated;

create or replace function public.enregistrer_contenu_document(
  p_document_id uuid,
  p_contenu jsonb,
  p_titre text default null
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_doc public.documents;
  v_maintenant timestamptz := now();
begin
  if not public.peut_editer_document(p_document_id) then
    raise exception 'Ce document n''est pas modifiable par vous (droits, ou document déjà soumis à validation).';
  end if;
  select * into v_doc from public.documents where id = p_document_id for update;
  if v_doc.verrou_par is not null and v_doc.verrou_par <> auth.uid() and v_doc.verrou_jusqua > now() then
    raise exception 'Document en cours de modification par une autre personne.';
  end if;
  update public.documents
    set contenu = p_contenu,
        titre = coalesce(nullif(trim(p_titre), ''), titre),
        updated_at = v_maintenant,
        verrou_par = auth.uid(),
        verrou_jusqua = v_maintenant + interval '2 minutes'
    where id = p_document_id;
  -- Traçabilité sans inonder le journal : une entrée par personne et par
  -- tranche de 15 minutes de travail.
  if not exists (
    select 1 from public.audit_log
    where document_id = p_document_id and acteur_id = auth.uid()
      and action = 'modification_contenu' and created_at > v_maintenant - interval '15 minutes'
  ) then
    insert into public.audit_log (document_id, acteur_id, action, details)
      values (p_document_id, auth.uid(), 'modification_contenu', '{}'::jsonb);
  end if;
  return v_maintenant;
end;
$$;
grant execute on function public.enregistrer_contenu_document(uuid, jsonb, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 6. Bibliothèque de modèles
-- ----------------------------------------------------------------------------
create table if not exists public.modeles_documents (
  id uuid primary key default gen_random_uuid(),
  organisation text,               -- null : modèle commun fourni avec la plateforme
  departement text,                -- null : proposé à tous les départements
  titre text not null check (char_length(titre) between 2 and 160),
  description text,
  format text not null check (format in ('texte', 'tableur', 'presentation')),
  contenu jsonb not null,
  actif boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.modeles_documents enable row level security;
grant select, insert, update, delete on public.modeles_documents to authenticated;

drop policy if exists "modeles_lecture" on public.modeles_documents;
create policy "modeles_lecture"
  on public.modeles_documents for select
  to authenticated
  using (
    (
      actif
      and (organisation is null or organisation = public.mon_organisation())
      and (
        departement is null
        or departement = (select p.departement from public.profiles p where p.id = auth.uid())
      )
    )
    or (
      organisation = public.mon_organisation()
      and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'administrateur')
    )
  );

drop policy if exists "modeles_gestion_administrateur" on public.modeles_documents;
create policy "modeles_gestion_administrateur"
  on public.modeles_documents for all
  to authenticated
  using (
    organisation = public.mon_organisation()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'administrateur')
  )
  with check (
    organisation = public.mon_organisation()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'administrateur')
  );

create or replace function public.tamponner_modele()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.organisation := (select organisation from public.profiles where id = auth.uid());
  else
    new.organisation := old.organisation;
    new.created_by := old.created_by;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists declencheur_tamponner_modele on public.modeles_documents;
create trigger declencheur_tamponner_modele
  before insert or update on public.modeles_documents
  for each row
  when (auth.uid() is not null)
  execute function public.tamponner_modele();

-- Modèles communs livrés avec la plateforme (organisation null)
insert into public.modeles_documents (organisation, titre, description, format, contenu)
select null, v.titre, v.description, v.format, v.contenu::jsonb
from (values
  ('Note de service', 'Note interne officielle : objet, dispositions, entrée en vigueur, signature.', 'texte', $j${
    "type": "doc", "content": [
      {"type": "heading", "attrs": {"level": 1, "textAlign": "center"}, "content": [{"type": "text", "text": "NOTE DE SERVICE"}]},
      {"type": "paragraph", "attrs": {"textAlign": "center"}, "content": [{"type": "text", "text": "N° ……/……/……"}]},
      {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Objet : "}, {"type": "text", "text": "[objet de la note]"}]},
      {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Destinataires : "}, {"type": "text", "text": "[services concernés]"}]},
      {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Contexte"}]},
      {"type": "paragraph", "content": [{"type": "text", "text": "[Rappeler brièvement le contexte et les raisons de cette note.]"}]},
      {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Dispositions"}]},
      {"type": "bulletList", "content": [
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Première disposition]"}]}]},
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Deuxième disposition]"}]}]},
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Troisième disposition]"}]}]}
      ]},
      {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Entrée en vigueur"}]},
      {"type": "paragraph", "content": [{"type": "text", "text": "La présente note entre en vigueur à compter de sa date de signature."}]},
      {"type": "paragraph", "attrs": {"textAlign": "right"}, "content": [{"type": "text", "text": "Fait à [ville], le [date]"}]},
      {"type": "paragraph", "attrs": {"textAlign": "right"}, "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "[Nom et fonction du signataire]"}]}
    ]}$j$),
  ('Compte rendu de réunion', 'Participants, ordre du jour, échanges et tableau des décisions.', 'texte', $j${
    "type": "doc", "content": [
      {"type": "heading", "attrs": {"level": 1}, "content": [{"type": "text", "text": "Compte rendu de réunion"}]},
      {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Date : "}, {"type": "text", "text": "[date]   "}, {"type": "text", "marks": [{"type": "bold"}], "text": "Lieu : "}, {"type": "text", "text": "[lieu ou visioconférence]"}]},
      {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Rédigé par : "}, {"type": "text", "text": "[nom]"}]},
      {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Participants"}]},
      {"type": "bulletList", "content": [
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Nom — fonction]"}]}]},
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Nom — fonction]"}]}]}
      ]},
      {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Ordre du jour"}]},
      {"type": "orderedList", "attrs": {"start": 1}, "content": [
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Point 1]"}]}]},
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[Point 2]"}]}]}
      ]},
      {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Échanges"}]},
      {"type": "paragraph", "content": [{"type": "text", "text": "[Résumé des échanges, point par point.]"}]},
      {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "Décisions et actions"}]},
      {"type": "table", "content": [
        {"type": "tableRow", "content": [
          {"type": "tableHeader", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Action"}]}]},
          {"type": "tableHeader", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Responsable"}]}]},
          {"type": "tableHeader", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Échéance"}]}]}
        ]},
        {"type": "tableRow", "content": [
          {"type": "tableCell", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[action]"}]}]},
          {"type": "tableCell", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[nom]"}]}]},
          {"type": "tableCell", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[date]"}]}]}
        ]},
        {"type": "tableRow", "content": [
          {"type": "tableCell", "content": [{"type": "paragraph"}]},
          {"type": "tableCell", "content": [{"type": "paragraph"}]},
          {"type": "tableCell", "content": [{"type": "paragraph"}]}
        ]}
      ]},
      {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Prochaine réunion : "}, {"type": "text", "text": "[date]"}]}
    ]}$j$),
  ('Courrier officiel', 'Lettre à en-tête : références, objet, corps, formule de politesse.', 'texte', $j${
    "type": "doc", "content": [
      {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "[Nom de l'organisation]"}]},
      {"type": "paragraph", "content": [{"type": "text", "text": "[Adresse] — [Téléphone] — [E-mail]"}]},
      {"type": "paragraph", "attrs": {"textAlign": "right"}, "content": [{"type": "text", "text": "[Ville], le [date]"}]},
      {"type": "paragraph", "attrs": {"textAlign": "right"}, "content": [{"type": "text", "text": "À l'attention de [destinataire]"}, {"type": "hardBreak"}, {"type": "text", "text": "[Adresse du destinataire]"}]},
      {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Réf. : "}, {"type": "text", "text": "[référence]"}]},
      {"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Objet : "}, {"type": "text", "text": "[objet du courrier]"}]},
      {"type": "paragraph", "content": [{"type": "text", "text": "Madame, Monsieur,"}]},
      {"type": "paragraph", "attrs": {"textAlign": "justify"}, "content": [{"type": "text", "text": "[Corps du courrier.]"}]},
      {"type": "paragraph", "attrs": {"textAlign": "justify"}, "content": [{"type": "text", "text": "Nous vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées."}]},
      {"type": "paragraph", "attrs": {"textAlign": "right"}, "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "[Nom et fonction du signataire]"}]}
    ]}$j$),
  ('Suivi budgétaire', 'Budget prévu / réalisé par poste, écarts et taux calculés automatiquement.', 'tableur', $j${
    "feuilles": [{
      "nom": "Budget",
      "gras": ["A1", "A3", "B3", "C3", "D3", "E3", "A10", "B10", "C10", "D10", "E10"],
      "cellules": {
        "A1": "Suivi budgétaire — exercice [année]",
        "A3": "Poste", "B3": "Budget prévu", "C3": "Réalisé", "D3": "Écart", "E3": "Taux de réalisation (%)",
        "A4": "Fonctionnement", "B4": "12000000", "C4": "9500000", "D4": "=B4-C4", "E4": "=SI(B4=0;0;ARRONDI(C4/B4*100;1))",
        "A5": "Personnel", "B5": "45000000", "C5": "44100000", "D5": "=B5-C5", "E5": "=SI(B5=0;0;ARRONDI(C5/B5*100;1))",
        "A6": "Communication", "B6": "6000000", "C6": "3200000", "D6": "=B6-C6", "E6": "=SI(B6=0;0;ARRONDI(C6/B6*100;1))",
        "A7": "Équipement", "B7": "15000000", "C7": "11800000", "D7": "=B7-C7", "E7": "=SI(B7=0;0;ARRONDI(C7/B7*100;1))",
        "A8": "Missions", "B8": "8000000", "C8": "6400000", "D8": "=B8-C8", "E8": "=SI(B8=0;0;ARRONDI(C8/B8*100;1))",
        "A10": "Total", "B10": "=SOMME(B4:B8)", "C10": "=SOMME(C4:C8)", "D10": "=B10-C10", "E10": "=SI(B10=0;0;ARRONDI(C10/B10*100;1))"
      }
    }]}$j$),
  ('Tableau de suivi des dossiers', 'Registre des dossiers : client ou investisseur, objet, dates, statut, responsable.', 'tableur', $j${
    "feuilles": [{
      "nom": "Dossiers",
      "gras": ["A1", "A3", "B3", "C3", "D3", "E3", "F3", "A15", "B15"],
      "cellules": {
        "A1": "Suivi des dossiers",
        "A3": "N°", "B3": "Client / investisseur", "C3": "Objet", "D3": "Date de dépôt", "E3": "Statut", "F3": "Responsable",
        "A4": "1", "A5": "2", "A6": "3", "A7": "4", "A8": "5", "A9": "6", "A10": "7", "A11": "8", "A12": "9", "A13": "10",
        "A15": "Dossiers saisis", "B15": "=NBVAL(B4:B13)"
      }
    }]}$j$),
  ('Présentation de projet', 'Contexte, objectifs, atouts et risques, calendrier, prochaines étapes.', 'presentation', $j${
    "diapositives": [
      {"disposition": "titre", "titre": "[Titre du projet]", "sousTitre": "[Direction / service — date]"},
      {"disposition": "contenu", "titre": "Contexte", "puces": ["[Situation actuelle]", "[Enjeux]", "[Besoin identifié]"]},
      {"disposition": "contenu", "titre": "Objectifs", "puces": ["[Objectif 1]", "[Objectif 2]", "[Objectif 3]"]},
      {"disposition": "deux_colonnes", "titre": "Atouts et risques", "colonneGauche": {"titre": "Atouts", "puces": ["[Atout 1]", "[Atout 2]"]}, "colonneDroite": {"titre": "Risques", "puces": ["[Risque 1]", "[Risque 2]"]}},
      {"disposition": "contenu", "titre": "Calendrier", "puces": ["[Phase 1 — période]", "[Phase 2 — période]", "[Phase 3 — période]"]},
      {"disposition": "contenu", "titre": "Prochaines étapes", "puces": ["[Décision attendue]", "[Ressources nécessaires]"]},
      {"disposition": "titre", "titre": "Merci", "sousTitre": "[Contact]"}
    ]}$j$)
) as v(titre, description, format, contenu)
where not exists (
  select 1 from public.modeles_documents m where m.organisation is null and m.titre = v.titre
);
