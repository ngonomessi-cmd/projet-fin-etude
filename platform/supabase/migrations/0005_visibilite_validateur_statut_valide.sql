-- ============================================================================
-- Le validateur perdait la visibilité d'un document immédiatement après
-- l'avoir validé (statut passé de "en_verification" à "valide") : la
-- fonction peut_lire_document ne couvrait la visibilité du validateur que
-- pour le statut "en_verification" (phase de vérification), pas "valide"
-- (en attente de publication) — provoquant un 404 sur sa propre page
-- juste après l'action de validation.
--
-- On étend cette visibilité : le validateur du département voit le
-- document à la fois pendant la vérification ET après sa propre
-- validation, jusqu'à sa publication.
-- ============================================================================

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
        or (d.statut in ('en_verification', 'valide') and p.role = 'validateur' and p.departement = d.departement)
      )
  );
$$;
