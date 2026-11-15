-- ============================================================================
-- 0034 — Rôle « superviseur » : ajout de la valeur à l'énumération des rôles.
-- ============================================================================
-- À exécuter SEUL, avant 0035 : PostgreSQL n'autorise l'usage d'une nouvelle valeur
-- d'énumération qu'une fois la transaction qui l'a créée validée.
alter type public.role_utilisateur add value if not exists 'superviseur';
