-- ============================================================================
-- "Les documents fictifs doivent aussi être téléchargeables comme celui qui
-- existait déjà."
--
-- Les documents fictifs (migration 0016) n'ont pas de fichier joint : ils
-- n'avaient été créés qu'en base (titre, description, classification...),
-- sans passer par le formulaire de dépôt qui, lui, écrit aussi dans le
-- stockage Supabase. Pour corriger ça depuis l'application (bouton admin
-- "Générer les fichiers des documents fictifs"), il faut d'abord autoriser
-- l'upload : la policy existante "depot_fichier_par_proprietaire_en_brouillon"
-- n'autorise que le PROPRIÉTAIRE du document à déposer un fichier, et
-- seulement tant que le document est en "brouillon" — or nos documents
-- fictifs appartiennent à divers rédacteurs et sont déjà "publie".
--
-- Cette policy est donc volontairement étroite : un administrateur peut
-- déposer un fichier pour n'importe quel document, mais UNIQUEMENT s'il n'a
-- encore AUCUN fichier (storage_path is null) — impossible de remplacer un
-- fichier déjà déposé par ce biais.
-- ============================================================================

create policy "depot_fichier_par_administrateur_si_absent"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents-ged'
    and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'administrateur'
    )
    and exists (
      select 1 from public.documents d
      where d.id::text = split_part(storage.objects.name, '/', 1)
        and d.storage_path is null
    )
  );
