-- ============================================================================
-- Actualités publiques — vitrine publique de l'organisation.
--
-- Reprend le principe du document "Architecture B — cœur souverain, façade
-- diffusée" (Cour Suprême du Cameroun) : le site public ne lit jamais les
-- tables sensibles de la GED (documents internes, messagerie, comptes) ;
-- il ne lit que du contenu explicitement publié pour le public, dans sa
-- propre table. Chez nous, la séparation est logique (RLS), pas deux
-- infrastructures physiques distinctes, mais la garantie est la même :
-- un visiteur non connecté (rôle "anon") ne peut lire que des lignes dont
-- le statut est "publie", jamais un brouillon.
--
-- "organisation" (comme pour les autres tables partagées entre KHS Bank et
-- une seconde organisation, migration 0018) : le site public de l'une
-- n'affiche jamais les actualités de l'autre, même si elles partagent la
-- même base. Toujours déduite côté base, jamais fournie par le client.
-- ============================================================================

create table public.actualites_publiques (
  id uuid primary key default gen_random_uuid(),
  organisation text not null,
  titre text not null,
  slug text not null,
  extrait text,
  contenu text not null,
  statut text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  auteur_id uuid not null references public.profiles (id),
  publie_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation, slug)
);

comment on table public.actualites_publiques is
  'Actualités/articles de la vitrine publique, rédigés et publiés par un administrateur. '
  'Seules les lignes "publie" sont lisibles sans connexion (policy "anon").';

create index idx_actualites_publiques_organisation_statut on public.actualites_publiques (organisation, statut, publie_at desc);

alter table public.actualites_publiques enable row level security;

grant select on public.actualites_publiques to anon, authenticated;
grant insert, update, delete on public.actualites_publiques to authenticated;

-- Lecture publique : uniquement les articles publiés (vrai pour un visiteur
-- anonyme comme pour un agent connecté — rien de spécial à vérifier ici,
-- cf. filtrage par organisation côté application pour la vitrine publique,
-- la notion d'organisation n'ayant pas de sens pour un visiteur "anon").
create policy "actualites_lecture_publiees"
  on public.actualites_publiques for select
  to anon, authenticated
  using (statut = 'publie');

-- Lecture complète (y compris brouillons) réservée à un administrateur de
-- la même organisation, pour l'écran d'administration.
create policy "actualites_lecture_administrateur"
  on public.actualites_publiques for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'administrateur' and p.organisation = actualites_publiques.organisation
    )
  );

create policy "actualites_ecriture_administrateur"
  on public.actualites_publiques for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'administrateur' and p.organisation = actualites_publiques.organisation
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'administrateur' and p.organisation = actualites_publiques.organisation
    )
  );

-- Organisation et auteur toujours déduits de l'administrateur connecté,
-- jamais du client — mêmes principe et fonction-patron que pour
-- documents/conversations (migration 0018).
create function public.tamponner_organisation_actualite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.auteur_id := auth.uid();
  new.organisation := (select organisation from public.profiles where id = auth.uid());
  if new.statut = 'publie' and new.publie_at is null then
    new.publie_at := now();
  end if;
  if new.statut = 'brouillon' then
    new.publie_at := null;
  end if;
  return new;
end;
$$;

create trigger declencheur_organisation_actualite
  before insert on public.actualites_publiques
  for each row execute function public.tamponner_organisation_actualite();

create function public.tamponner_maj_actualite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.organisation := old.organisation;
  new.auteur_id := old.auteur_id;
  new.updated_at := now();
  if new.statut = 'publie' and old.statut = 'brouillon' then
    new.publie_at := now();
  elsif new.statut = 'brouillon' then
    new.publie_at := null;
  else
    new.publie_at := old.publie_at;
  end if;
  return new;
end;
$$;

create trigger declencheur_maj_actualite
  before update on public.actualites_publiques
  for each row execute function public.tamponner_maj_actualite();
