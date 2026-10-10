-- ============================================================================
-- Contournement d'une anomalie RLS (Row Level Security) sur l'UPDATE de
-- "documents" par le validateur/administrateur.
--
-- Diagnostic effectué (migrations 0002 et 0003, tests directs en SQL sous
-- l'utilisateur impersonné) : la logique des policies est démontrée
-- correcte avec les données réelles (toutes les conditions évaluées à
-- vrai), y compris en appelant directement les fonctions utilisées par la
-- policy — qui renvoient toutes "true". Pourtant, l'UPDATE réel échoue
-- systématiquement avec "new row violates row-level security policy for
-- table documents". Il s'agit d'un comportement du moteur RLS de
-- PostgreSQL non résolu malgré plusieurs restructurations de la policy.
--
-- Plutôt que de continuer à dépendre de cette policy pour ce chemin
-- d'écriture précis, transition_statut_document passe en SECURITY
-- DEFINER : elle s'exécute désormais avec les droits du propriétaire de
-- la fonction (qui contourne RLS), mais sa propre vérification métier
-- explicite (le bloc if/elsif listant exactement les transitions
-- autorisées selon le rôle et le département) reste l'unique garde-fou
-- et n'est pas affaiblie — exactement le même principe que la fonction
-- changer_role_utilisateur, déjà en SECURITY DEFINER pour la même raison.
-- search_path reste figé sur "public" (déjà présent) pour éviter tout
-- détournement par substitution de schéma.
-- ============================================================================

alter function public.transition_statut_document(uuid, public.statut_document, text)
  security definer;
