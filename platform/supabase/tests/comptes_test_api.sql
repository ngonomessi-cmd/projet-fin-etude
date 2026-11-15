-- Administrateur de l'organisation API (requis par la migration 0022).
insert into auth.users (id, email, raw_user_meta_data) values
 ('22222222-0000-0000-0000-000000000001','admin@api','{"nom_complet":"Admin API","departement":"DG","organisation":"API"}');
update public.profiles set role='administrateur' where id='22222222-0000-0000-0000-000000000001';
