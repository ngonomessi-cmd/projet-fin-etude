-- ============================================================================
-- Ajoute l'adresse e-mail sur le profil, pour l'afficher dans la page
-- Utilisateurs (/admin/utilisateurs). Jusqu'ici, l'e-mail n'existait que
-- dans auth.users, inaccessible en lecture aux rôles authenticated/anon
-- (restriction volontaire de Supabase) — on le recopie donc sur "profiles",
-- peuplé à l'inscription puis tenu à jour si l'e-mail change.
--
-- Visibilité : la policy "profils_lecture_utilisateurs_authentifies"
-- (migration 0001) autorise déjà tout utilisateur authentifié à lire tous
-- les profils (nom, département, rôle) — l'e-mail suit la même règle, par
-- cohérence avec le reste du profil. La page qui l'affiche reste réservée
-- aux administrateurs au niveau applicatif, comme le nom et le département.
-- ============================================================================

alter table public.profiles add column if not exists email text;

update public.profiles p
  set email = u.email
  from auth.users u
  where u.id = p.id and p.email is null;

-- CREATE OR REPLACE sur la même signature que la migration 0001 : pas besoin
-- de retoucher le déclencheur "declencheur_nouvel_utilisateur" qui l'appelle.
create or replace function public.gerer_nouvel_utilisateur()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nom_complet, departement, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nom_complet', new.email),
    coalesce(new.raw_user_meta_data ->> 'departement', 'Direction'),
    new.email
  );
  return new;
end;
$$;

-- Garde l'e-mail du profil synchronisé si l'agent le change depuis
-- Supabase Auth (changement d'adresse, etc.).
create function public.synchroniser_email_profil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists declencheur_synchronisation_email on auth.users;
create trigger declencheur_synchronisation_email
  after update of email on auth.users
  for each row execute function public.synchroniser_email_profil();
