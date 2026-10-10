-- ============================================================================
-- Correction RLS (Row Level Security) — réécriture via fonctions dédiées
--
-- La policy UPDATE consolidée de la migration 0002, bien que logiquement
-- correcte (vérifié par des tests directs sur les mêmes données réelles,
-- sous le même utilisateur impersonné), échouait systématiquement en
-- conditions réelles avec "new row violates row-level security policy for
-- table documents". Cette policy encodait sa logique avec des sous-requêtes
-- EXISTS imbriquées directement dans les clauses USING / WITH CHECK.
--
-- La policy de lecture (peut_lire_document), elle, fonctionne parfaitement
-- en production : elle encapsule sa logique dans une fonction SQL dédiée
-- plutôt que de l'écrire inline. On applique le même principe ici.
-- ============================================================================

drop policy if exists "modification_document_selon_role" on public.documents;

create function public.peut_modifier_document(d public.documents)
returns boolean
language sql
security invoker
stable
set search_path = public
as $$
  select
    (d.owner_id = auth.uid() and d.statut in ('brouillon', 'rejete'))
    or (
      d.statut in ('en_verification', 'valide')
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
          and (p.role = 'administrateur' or (p.role = 'validateur' and p.departement = d.departement))
      )
    );
$$;

create function public.peut_enregistrer_modification_document(d public.documents)
returns boolean
language sql
security invoker
stable
set search_path = public
as $$
  select
    d.owner_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('administrateur', 'validateur')
    );
$$;

create policy "modification_document_selon_role"
  on public.documents for update
  to authenticated
  using (public.peut_modifier_document(documents))
  with check (public.peut_enregistrer_modification_document(documents));
