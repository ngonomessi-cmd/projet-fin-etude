-- ============================================================================
-- Corrections RLS (Row Level Security) — GED sécurisée KHS Bank
--
-- 1. Les transitions de statut par le validateur échouaient avec
--    "new row violates row-level security policy for table documents" :
--    deux policies UPDATE séparées (une pour le propriétaire, une pour le
--    validateur/administrateur) laissaient planer une ambiguïté sur la
--    combinaison de leurs clauses USING/WITH CHECK respectives. On les
--    remplace par une seule policy consolidée, sans ambiguïté possible.
--
-- 2. Le validateur (et plus généralement quiconque peut déjà lire un
--    document) ne voyait aucune entrée de son journal d'audit, faute
--    d'en être l'auteur ou le propriétaire. On étend la policy de lecture
--    de audit_log à : "quiconque a le droit de lire le document associé
--    a aussi le droit de lire son historique".
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Documents : policy UPDATE unique
-- ----------------------------------------------------------------------------

drop policy if exists "proprietaire_modifie_brouillon_ou_rejete" on public.documents;
drop policy if exists "validateur_traite_verification_et_publication" on public.documents;

create policy "modification_document_selon_role"
  on public.documents for update
  to authenticated
  using (
    (owner_id = auth.uid() and statut in ('brouillon', 'rejete'))
    or (
      statut in ('en_verification', 'valide')
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
          and (p.role = 'administrateur' or (p.role = 'validateur' and p.departement = documents.departement))
      )
    )
  )
  with check (
    owner_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('administrateur', 'validateur')
    )
  );

-- ----------------------------------------------------------------------------
-- 2. Journal d'audit : lecture étendue à quiconque peut lire le document
-- ----------------------------------------------------------------------------

drop policy if exists "lecture_audit_selon_role_ou_propriete" on public.audit_log;

create policy "lecture_audit_selon_role_ou_document_lisible"
  on public.audit_log for select
  to authenticated
  using (
    acteur_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('administrateur', 'auditeur'))
    or (
      document_id is not null
      and exists (select 1 from public.documents d where d.id = audit_log.document_id and public.peut_lire_document(d))
    )
  );
