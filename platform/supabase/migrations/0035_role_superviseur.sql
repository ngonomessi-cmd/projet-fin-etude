-- ============================================================================
-- 0035 — Rôle « superviseur » : droits sur les contenus de tous les départements,
--        aucun droit sur les réglages.
-- ============================================================================
-- Prérequis : 0034 exécutée (valeur 'superviseur' de l'énumération).
--
-- Le superviseur PEUT, dans tous les départements de son organisation : lire tout document
-- sorti du brouillon (y compris confidentiel), déposer et rédiger, valider, rejeter, publier,
-- archiver, classer, créer une nouvelle version, partager, préparer un bon à signer, voir les
-- signatures, consulter le journal d'audit, voir le courrier non personnel et les départs.
--
-- Il NE PEUT PAS (fonctions et règles inchangées, réservées à l'administrateur) : changer les
-- rôles ou les profils, voir ou réinitialiser la double authentification des agents, gérer les
-- modèles, les actualités, le courrier du public, les noms anglais des départements, les
-- paramètres d'archivage et de messagerie, les qualités, titulaires et délégations de signature,
-- les canaux, ni désigner les rôles du service du courrier.
--
-- Les brouillons restent privés : seuls leur auteur et les personnes avec qui ils sont partagés
-- les voient, comme pour l'administrateur.

-- ---------------------------------------------------------------- fonctions
-- archiver_document
CREATE OR REPLACE FUNCTION public.archiver_document(p_document_id uuid, p_motif text DEFAULT NULL::text)
 RETURNS documents
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_moi public.profiles;
  v_doc public.documents;
begin
  select * into v_moi from public.profiles where id = auth.uid();
  select * into v_doc from public.documents where id = p_document_id;
  if v_doc.id is null or v_moi.id is null or v_doc.organisation <> v_moi.organisation then
    raise exception 'Document introuvable.';
  end if;
  if not (v_moi.role in ('administrateur', 'superviseur') or (v_moi.role = 'validateur' and v_moi.departement = v_doc.departement)) then
    raise exception 'Seuls le validateur du département % et l''administrateur peuvent archiver ce document.', v_doc.departement;
  end if;
  return public.sceller_archive_document(p_document_id, v_moi.id, false, p_motif);
end;
$function$;

-- bon_a_signer
CREATE OR REPLACE FUNCTION public.bon_a_signer(p_document_id uuid, p_qualite text, p_langue text DEFAULT 'fr'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_moi public.profiles;
  v_auteur uuid;
begin
  select * into v_moi from public.profiles where id = auth.uid();
  if v_moi.id is null then
    raise exception 'Session requise.';
  end if;
  select owner_id into v_auteur from public.documents where id = p_document_id;
  if not (
    v_auteur = auth.uid()
    or v_moi.role in ('administrateur', 'superviseur')
    or public.est_titulaire_signature(p_qualite)
    or public.delegation_active(p_qualite) is not null
  ) then
    raise exception 'Seuls l''auteur du document, un administrateur ou le signataire peuvent préparer un bon à signer.';
  end if;
  return public.reserver_signature(p_document_id, p_qualite, 'manuscrite', p_langue, null, null);
end;
$function$;

-- classer_document
CREATE OR REPLACE FUNCTION public.classer_document(p_document_id uuid, p_nature text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_moi public.profiles;
  v_doc public.documents;
begin
  select * into v_moi from public.profiles where id = auth.uid();
  select * into v_doc from public.documents where id = p_document_id;
  if v_doc.id is null or v_moi.id is null or v_doc.organisation <> v_moi.organisation then
    raise exception 'Document introuvable.';
  end if;
  if v_doc.archive_le is not null then
    raise exception 'Document archivé : son classement ne peut plus changer.';
  end if;
  if not (
    (v_doc.owner_id = v_moi.id and v_doc.statut in ('brouillon', 'rejete'))
    or v_moi.role in ('administrateur', 'superviseur')
    or (v_moi.role = 'validateur' and v_moi.departement = v_doc.departement and v_doc.statut <> 'brouillon')
  ) then
    raise exception 'Vous ne pouvez pas modifier la nature de ce document.';
  end if;
  update public.documents set nature = p_nature, updated_at = now() where id = p_document_id;
  insert into public.audit_log (document_id, acteur_id, action, details)
    values (v_doc.id, v_moi.id, 'classement', jsonb_build_object('ancienne', v_doc.nature, 'nouvelle', p_nature));
end;
$function$;

-- courrier_me_concerne
CREATE OR REPLACE FUNCTION public.courrier_me_concerne(p_courrier uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.courriers c
    join public.profiles p on p.id = auth.uid() and p.organisation = c.organisation
    where c.id = p_courrier
      and (
        c.destinataire_id = p.id or c.affecte_a = p.id
        or (c.caractere <> 'personnel' and p.role = 'validateur' and p.departement = c.departement)
      or (c.caractere <> 'personnel' and p.role = 'superviseur')
      )
  );
$function$;

-- lister_partages_document
CREATE OR REPLACE FUNCTION public.lister_partages_document(p_document_id uuid)
 RETURNS TABLE(id uuid, cible text, type_cible text, droit text, partage_par text, created_at timestamp with time zone, retirable boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        or (v_moi.role in ('administrateur', 'superviseur') and v_moi.organisation = v_doc.organisation))
    from public.document_partages s
    join public.profiles pp on pp.id = s.partage_par
    left join public.profiles pc on pc.id = s.profil_id
    left join public.conversations c on c.id = s.conversation_id
    where s.document_id = p_document_id
    order by s.created_at desc;
end;
$function$;

-- retirer_partage
CREATE OR REPLACE FUNCTION public.retirer_partage(p_partage_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    or (v_moi.role in ('administrateur', 'superviseur') and v_moi.organisation = v_doc.organisation)
  ) then
    raise exception 'Vous ne pouvez pas retirer ce partage.';
  end if;
  delete from public.document_partages where id = p_partage_id;
  insert into public.audit_log (document_id, acteur_id, action, details)
    values (v_doc.id, v_moi.id, 'retrait_partage',
      jsonb_build_object('profil', v_partage.profil_id, 'conversation', v_partage.conversation_id));
end;
$function$;

-- nouvelle_version_document
CREATE OR REPLACE FUNCTION public.nouvelle_version_document(p_document_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_moi public.profiles;
  v_doc public.documents;
  v_existant public.documents;
  v_nom text;
  v_id uuid;
begin
  select * into v_moi from public.profiles where id = auth.uid();
  select * into v_doc from public.documents where id = p_document_id;
  if v_doc.id is null or v_moi.id is null or not public.peut_lire_document(v_doc) then
    raise exception 'Document introuvable.';
  end if;
  if v_moi.role not in ('redacteur', 'validateur', 'administrateur', 'superviseur') then
    raise exception 'Votre rôle ne permet pas de produire un document.';
  end if;
  if v_doc.statut <> 'publie' then
    raise exception 'Seul un document publié ou archivé donne lieu à une nouvelle version ; un brouillon se modifie directement.';
  end if;
  if not (v_doc.owner_id = v_moi.id or v_moi.role in ('administrateur', 'superviseur') or v_moi.departement = v_doc.departement) then
    raise exception 'Seuls l''auteur, le département % ou un administrateur peuvent réviser ce document.', v_doc.departement;
  end if;

  -- Une seule révision en cours à la fois.
  select * into v_existant from public.documents
    where version_precedente_id = v_doc.id and statut <> 'publie'
    order by created_at desc limit 1;
  if v_existant.id is not null then
    if v_existant.owner_id = v_moi.id then
      return v_existant.id;
    end if;
    select nom_complet into v_nom from public.profiles where id = v_existant.owner_id;
    raise exception 'Une nouvelle version (%) est déjà en préparation par %.', v_existant.reference, v_nom;
  end if;

  perform set_config('ged.nouvelle_version', 'on', true);
  insert into public.documents (
    titre, description, classification, statut, departement, owner_id,
    nature, format_atelier, contenu, version, version_precedente_id
  ) values (
    v_doc.titre, v_doc.description, v_doc.classification, 'brouillon', v_doc.departement, v_moi.id,
    v_doc.nature, v_doc.format_atelier, v_doc.contenu, v_doc.version + 1, v_doc.id
  ) returning id into v_id;
  perform set_config('ged.nouvelle_version', '', true);

  insert into public.audit_log (document_id, acteur_id, action, details)
    values (v_id, v_moi.id, 'nouvelle_version',
      jsonb_build_object('version', v_doc.version + 1, 'depuis', v_doc.reference));
  return v_id;
end;
$function$;

-- original_peut_deposer
CREATE OR REPLACE FUNCTION public.original_peut_deposer(p_signature_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.signatures s
    join public.profiles p on p.id = auth.uid() and p.organisation = s.organisation
    left join public.documents d on d.id = s.document_id
    where s.id = p_signature_id
      and s.nature = 'manuscrite'
      and s.statut in ('attente_original', 'valide')
      and (
        s.cree_par = auth.uid()
        or d.owner_id = auth.uid()
        or p.role in ('administrateur', 'superviseur')
        or public.est_titulaire_signature(s.qualite)
        or public.delegation_active(s.qualite) is not null
      )
  );
$function$;

-- partager_document
CREATE OR REPLACE FUNCTION public.partager_document(p_document_id uuid, p_profils uuid[] DEFAULT '{}'::uuid[], p_conversation_id uuid DEFAULT NULL::uuid, p_droit text DEFAULT 'lecture'::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_moi public.profiles;
  v_doc public.documents;
  v_cible public.profiles;
  v_id uuid;
  v_nombre integer := 0;
begin
  select * into v_moi from public.profiles where id = auth.uid();
  if v_moi.id is null or v_moi.role not in ('redacteur', 'validateur', 'administrateur', 'superviseur') then
    raise exception 'Votre rôle ne permet pas de partager un document.';
  end if;
  if p_droit not in ('lecture', 'edition') then
    raise exception 'Droit de partage inconnu.';
  end if;

  select * into v_doc from public.documents where id = p_document_id;
  if v_doc.id is null or v_doc.organisation <> v_moi.organisation then
    raise exception 'Document introuvable.';
  end if;
  if v_doc.archive_le is not null and p_droit = 'edition' then
    raise exception 'Document archivé : partage en lecture seule uniquement.';
  end if;
  if not (
    v_doc.owner_id = v_moi.id
    or v_moi.role in ('administrateur', 'superviseur')
    or public.partage_avec_moi(v_doc.id, true)
  ) then
    raise exception 'Seuls l''auteur, un co-éditeur ou un administrateur peuvent partager ce document.';
  end if;

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
$function$;

-- peut_editer_document
CREATE OR REPLACE FUNCTION public.peut_editer_document(p_document_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.documents d
    join public.profiles p on p.id = auth.uid()
    where d.id = p_document_id
      and p.organisation = d.organisation
      and p.role in ('redacteur', 'validateur', 'administrateur', 'superviseur')
      and d.statut in ('brouillon', 'rejete')
      and (d.owner_id = auth.uid() or public.partage_avec_moi(d.id, true))
  );
$function$;

-- peut_enregistrer_modification_document
CREATE OR REPLACE FUNCTION public.peut_enregistrer_modification_document(d documents)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select
    d.owner_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('administrateur', 'validateur', 'superviseur')
    );
$function$;

-- peut_lire_depart
CREATE OR REPLACE FUNCTION public.peut_lire_depart(p_depart uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.departs d
    join public.profiles p on p.id = auth.uid() and p.organisation = d.organisation
    where d.id = p_depart
      and (
        p.role_courrier is not null
        or d.demandeur_id = p.id
        or (p.role = 'validateur' and p.departement = d.departement)
      or p.role = 'superviseur'
      )
  );
$function$;

-- peut_lire_document
CREATE OR REPLACE FUNCTION public.peut_lire_document(d documents)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.organisation = d.organisation
      and (
        d.owner_id = auth.uid()
        or (p.role in ('administrateur', 'auditeur', 'superviseur') and d.statut <> 'brouillon')
        or (
          d.statut = 'publie' and (
            d.classification = 'public_interne'
            or (d.classification = 'restreint' and p.departement = d.departement)
            or (d.classification = 'confidentiel' and p.role = 'validateur' and p.departement = d.departement)
          )
        )
        or (d.statut in ('en_verification', 'valide', 'rejete') and p.role = 'validateur' and p.departement = d.departement)
        or public.partage_avec_moi(d.id, false)
      )
  );
$function$;

-- peut_modifier_document
CREATE OR REPLACE FUNCTION public.peut_modifier_document(d documents)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select
    (d.owner_id = auth.uid() and d.statut in ('brouillon', 'rejete'))
    or (
      d.statut in ('en_verification', 'valide')
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
          and (p.role in ('administrateur', 'superviseur') or (p.role = 'validateur' and p.departement = d.departement))
      )
    );
$function$;

-- peut_ouvrir_conversation
CREATE OR REPLACE FUNCTION public.peut_ouvrir_conversation(p_cible_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select
    p_cible_id <> auth.uid()
    and exists (
      select 1 from public.profiles
      where id = p_cible_id and organisation = public.mon_organisation()
    )
    and (
      exists (select 1 from public.profiles where id = auth.uid() and role in ('administrateur', 'validateur', 'superviseur'))
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
$function$;

-- peut_voir_signature
CREATE OR REPLACE FUNCTION public.peut_voir_signature(s signatures)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.organisation = s.organisation
      and (
        s.signataire_id = auth.uid()
        or s.cree_par = auth.uid()
        or p.role in ('administrateur', 'auditeur', 'superviseur')
        or public.est_titulaire_signature(s.qualite)
        or (
          s.document_id is not null
          and exists (select 1 from public.documents d where d.id = s.document_id and public.peut_lire_document(d))
        )
      )
  );
$function$;

-- transition_statut_document
CREATE OR REPLACE FUNCTION public.transition_statut_document(p_document_id uuid, p_nouveau_statut statut_document, p_commentaire text DEFAULT NULL::text)
 RETURNS documents
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
        and (v_role in ('administrateur', 'superviseur') or (v_role = 'validateur' and v_departement = v_doc.departement)) then
    v_transition_valide := true;  -- vérification + validation (ou rejet motivé)
  elsif v_doc.statut = 'valide'
        and p_nouveau_statut = 'publie'
        and v_organisation = v_doc.organisation
        and (v_role in ('administrateur', 'superviseur') or (v_role = 'validateur' and v_departement = v_doc.departement)) then
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
$function$;

-- ---------------------------------------------------------------- règles RLS
drop policy if exists "depot_document_par_redacteur" on public.documents;
create policy "depot_document_par_redacteur" on public.documents for insert to authenticated
with check (
  owner_id = auth.uid() and statut = 'brouillon'
  and exists (select 1 from public.profiles p where p.id = auth.uid()
              and p.role in ('redacteur', 'validateur', 'administrateur', 'superviseur'))
);

drop policy if exists "modification_document_selon_role" on public.documents;
create policy "modification_document_selon_role" on public.documents for update to authenticated
using (
  (owner_id = auth.uid() and statut in ('brouillon', 'rejete'))
  or (statut in ('en_verification', 'valide') and exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.organisation = documents.organisation
          and (p.role in ('administrateur', 'superviseur') or (p.role = 'validateur' and p.departement = documents.departement))))
)
with check (
  owner_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.organisation = documents.organisation
             and p.role in ('administrateur', 'validateur', 'superviseur'))
);

drop policy if exists "lecture_audit_selon_role_ou_document_lisible" on public.audit_log;
create policy "lecture_audit_selon_role_ou_document_lisible" on public.audit_log for select to authenticated
using (
  acteur_id = auth.uid()
  or (organisation = public.mon_organisation() and exists (
        select 1 from public.profiles p where p.id = auth.uid() and p.role in ('administrateur', 'auditeur', 'superviseur')))
  or (document_id is not null and exists (
        select 1 from public.documents d where d.id = audit_log.document_id and public.peut_lire_document(d)))
);

drop policy if exists "messages_envoi_participant_autorise" on public.messages;
create policy "messages_envoi_participant_autorise" on public.messages for insert to authenticated
with check (
  auteur_id = auth.uid()
  and exists (select 1 from public.conversation_participants cp
              where cp.conversation_id = messages.conversation_id and cp.profil_id = auth.uid() and cp.peut_publier)
  and (not urgent or exists (select 1 from public.profiles p where p.id = auth.uid()
                             and p.role in ('administrateur', 'validateur', 'superviseur')))
);

notify pgrst, 'reload schema';
