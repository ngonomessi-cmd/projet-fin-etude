-- ============================================================================
-- Généralise la correction de la migration 0005 : le validateur de son
-- département doit garder la visibilité d'un document à chaque étape dont
-- il est responsable, pas seulement "en_verification" et "valide" — le cas
-- "rejete" présentait exactement le même trou (perte de visibilité
-- immédiatement après avoir rejeté un document).
--
-- "brouillon" reste volontairement exclu : un brouillon est un document
-- privé du rédacteur avant tout dépôt, le validateur n'a rien à y voir
-- tant qu'il n'a pas été explicitement soumis à vérification.
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
        or (
          d.statut in ('en_verification', 'valide', 'rejete')
          and p.role = 'validateur'
          and p.departement = d.departement
        )
      )
  );
$$;
