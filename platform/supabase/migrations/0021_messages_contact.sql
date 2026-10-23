-- Messages envoyés depuis le formulaire « Nous contacter » du site public.
-- Principe « façade diffusée » : la façade peut seulement DÉPOSER un
-- message (insert), jamais en relire un ; la lecture et le traitement sont
-- réservés aux administrateurs de l'organisation destinataire.
create table public.messages_contact (
  id uuid primary key default gen_random_uuid(),
  organisation text not null check (char_length(organisation) between 1 and 20),
  nom text not null check (char_length(nom) between 2 and 120),
  email text not null check (char_length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  telephone text check (telephone is null or char_length(telephone) <= 40),
  entreprise text check (entreprise is null or char_length(entreprise) <= 160),
  sujet text not null check (char_length(sujet) between 2 and 160),
  message text not null check (char_length(message) between 10 and 5000),
  traite boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_messages_contact_organisation on public.messages_contact (organisation, created_at desc);

alter table public.messages_contact enable row level security;

grant insert on public.messages_contact to anon, authenticated;
grant select, update, delete on public.messages_contact to authenticated;

create policy "contact_depot_public"
  on public.messages_contact for insert
  to anon, authenticated
  with check (traite = false);

create policy "contact_lecture_administrateur"
  on public.messages_contact for select
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'administrateur' and p.organisation = messages_contact.organisation
  ));

create policy "contact_traitement_administrateur"
  on public.messages_contact for update
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'administrateur' and p.organisation = messages_contact.organisation
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'administrateur' and p.organisation = messages_contact.organisation
  ));

create policy "contact_suppression_administrateur"
  on public.messages_contact for delete
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'administrateur' and p.organisation = messages_contact.organisation
  ));

-- Seul le statut « traité » est modifiable : le contenu d'un message reçu
-- reste tel qu'envoyé.
create function public.figer_message_contact()
returns trigger
language plpgsql
as $$
begin
  new.organisation := old.organisation;
  new.nom := old.nom;
  new.email := old.email;
  new.telephone := old.telephone;
  new.entreprise := old.entreprise;
  new.sujet := old.sujet;
  new.message := old.message;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger declencheur_figer_message_contact
  before update on public.messages_contact
  for each row execute function public.figer_message_contact();
