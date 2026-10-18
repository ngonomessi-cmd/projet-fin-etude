-- ============================================================================
-- "Il faudra les ranger par département et chaque département devra avoir
-- automatiquement un dossier un peu comme pour les canaux. Et tu y mets des
-- documents fictifs consultables parce que là on n'a pas encore beaucoup de
-- documents."
--
-- Contrairement aux canaux (une ligne "conversations" par département), les
-- documents ont déjà une colonne "departement" (texte) : il n'y a donc rien à
-- créer pour le regroupement lui-même, qui se fait côté interface (page
-- Documents) à partir de la liste des départements déjà connus via la table
-- "profiles" — exactement la même source que pour les canaux de département.
-- Un département sans aucun document affiche simplement un dossier vide.
--
-- Cette migration se limite donc à peupler chaque département avec deux
-- documents fictifs (un "public interne" et un "restreint"), publiés, pour
-- que les dossiers ne soient pas vides pendant la démonstration. Idempotent :
-- sans effet si ces documents existent déjà (ex. ré-exécution accidentelle).
-- ============================================================================

do $$
declare
  v_departement text;
  v_owner uuid;
begin
  for v_departement in
    select distinct departement
    from public.profiles
    where departement is not null and length(trim(departement)) > 0
  loop
    -- Propriétaire réaliste : un rédacteur du département si possible (seul
    -- rôle, avec l'administrateur, habilité à déposer un document — policy
    -- "depot_document_par_redacteur"), sinon un administrateur, sinon
    -- n'importe quel profil de ce département.
    select id into v_owner
      from public.profiles
      where departement = v_departement and role = 'redacteur'
      limit 1;

    if v_owner is null then
      select id into v_owner
        from public.profiles
        where departement = v_departement and role = 'administrateur'
        limit 1;
    end if;

    if v_owner is null then
      select id into v_owner from public.profiles where departement = v_departement limit 1;
    end if;

    continue when v_owner is null;

    if not exists (
      select 1 from public.documents
      where departement = v_departement and titre = 'Procédure interne — ' || v_departement
    ) then
      insert into public.documents (titre, description, classification, statut, departement, owner_id)
      values (
        'Procédure interne — ' || v_departement,
        'Document fictif généré pour peupler l''espace documentaire du département ' || v_departement ||
          '. Il illustre le gabarit attendu pour ce type de contenu : objet, périmètre d''application, ' ||
          'responsables et étapes de validation avant diffusion aux équipes concernées. ' ||
          'Classification « public interne » : visible par l''ensemble du personnel une fois publié.',
        'public_interne',
        'publie',
        v_departement,
        v_owner
      );
    end if;

    if not exists (
      select 1 from public.documents
      where departement = v_departement and titre = 'Note de service — ' || v_departement
    ) then
      insert into public.documents (titre, description, classification, statut, departement, owner_id)
      values (
        'Note de service — ' || v_departement,
        'Document fictif généré pour peupler l''espace documentaire du département ' || v_departement ||
          '. Classification « restreinte » : une fois publié, un tel document n''est visible que par les ' ||
          'agents de ce même département (hors administrateur et auditeur, toujours habilités).',
        'restreint',
        'publie',
        v_departement,
        v_owner
      );
    end if;
  end loop;
end $$;
