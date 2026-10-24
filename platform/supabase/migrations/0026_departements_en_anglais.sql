-- ============================================================================
-- Nom anglais des départements (plateforme bilingue FR / EN).
--
-- Le département est un texte libre saisi sur chaque profil (« Direction
-- Technique »…). Cette table lui associe un nom anglais, affiché quand
-- l'interface est en anglais ; à défaut, le nom français est repris.
--   - Lecture : toute l'organisation. Écriture : administrateur seulement
--     (Admin › Utilisateurs).
--   - Pré-remplie pour les noms de départements courants.
--
-- À exécuter après la migration 0025.
-- ============================================================================

create table if not exists public.departements_noms_en (
  organisation text not null,
  departement text not null,
  nom_en text not null check (char_length(trim(nom_en)) between 1 and 120),
  updated_at timestamptz not null default now(),
  primary key (organisation, departement)
);

alter table public.departements_noms_en enable row level security;
grant select, insert, update, delete on public.departements_noms_en to authenticated;

drop policy if exists "departements_en_lecture" on public.departements_noms_en;
create policy "departements_en_lecture"
  on public.departements_noms_en for select
  to authenticated
  using (organisation = public.mon_organisation());

drop policy if exists "departements_en_gestion_administrateur" on public.departements_noms_en;
create policy "departements_en_gestion_administrateur"
  on public.departements_noms_en for all
  to authenticated
  using (
    organisation = public.mon_organisation()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'administrateur')
  )
  with check (
    organisation = public.mon_organisation()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'administrateur')
  );

-- Pré-remplissage : départements déjà présents dont le nom est courant.
-- Comparaison sans casse ni accents.
insert into public.departements_noms_en (organisation, departement, nom_en)
select distinct p.organisation, p.departement, t.nom_en
from public.profiles p
join (values
  ('direction generale', 'General Management'),
  ('direction', 'Management'),
  ('direction technique', 'Technical Department'),
  ('direction financiere', 'Finance Department'),
  ('direction des ressources humaines', 'Human Resources Department'),
  ('direction juridique', 'Legal Department'),
  ('direction commerciale', 'Sales Department'),
  ('direction des systemes d''information', 'IT Department'),
  ('direction de la communication', 'Communication Department'),
  ('direction de l''audit', 'Audit Department'),
  ('direction des investissements', 'Investment Department'),
  ('direction de la promotion', 'Promotion Department'),
  ('direction des etudes', 'Research Department'),
  ('direction administrative et financiere', 'Administration and Finance Department'),
  ('secretariat general', 'General Secretariat'),
  ('secretariat', 'Secretariat'),
  ('finance', 'Finance'),
  ('finances', 'Finance'),
  ('comptabilite', 'Accounting'),
  ('ressources humaines', 'Human Resources'),
  ('rh', 'HR'),
  ('juridique', 'Legal'),
  ('conformite', 'Compliance'),
  ('audit', 'Audit'),
  ('audit interne', 'Internal Audit'),
  ('controle interne', 'Internal Control'),
  ('credit', 'Credit'),
  ('risques', 'Risk'),
  ('communication', 'Communication'),
  ('marketing', 'Marketing'),
  ('commercial', 'Sales'),
  ('informatique', 'IT'),
  ('systemes d''information', 'Information Systems'),
  ('logistique', 'Logistics'),
  ('achats', 'Procurement'),
  ('accueil', 'Reception'),
  ('promotion des investissements', 'Investment Promotion'),
  ('investissements', 'Investments'),
  ('partenariats', 'Partnerships'),
  ('etudes', 'Research')
) as t(cle, nom_en)
  on public.normaliser_recherche(trim(p.departement)) = t.cle
where p.departement is not null and trim(p.departement) <> ''
on conflict (organisation, departement) do nothing;
