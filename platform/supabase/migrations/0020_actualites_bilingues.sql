-- Ajoute les champs anglais des actualités publiques. Nullable et sans
-- valeur par défaut : les articles déjà publiés restent affichés (le site
-- public retombe sur la version française tant que l'anglais n'est pas
-- renseigné, cf. src/lib/i18n/dictionnaire.ts et les pages (public)/).
alter table public.actualites_publiques
  add column titre_en text,
  add column extrait_en text,
  add column contenu_en text;
