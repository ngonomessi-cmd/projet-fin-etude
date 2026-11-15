-- Comptes de test KHS (insérés avant la migration 0016, qui en a besoin).
insert into auth.users (id, email, raw_user_meta_data) values
 ('11111111-0000-0000-0000-000000000001','red@khs','{"nom_complet":"Rita Rédactrice","departement":"Finance"}'),
 ('11111111-0000-0000-0000-000000000002','val@khs','{"nom_complet":"Victor Validateur","departement":"Finance"}'),
 ('11111111-0000-0000-0000-000000000003','adm@khs','{"nom_complet":"Alice Admin","departement":"Direction"}'),
 ('11111111-0000-0000-0000-000000000004','aud@khs','{"nom_complet":"Aude Auditrice","departement":"Audit"}'),
 ('11111111-0000-0000-0000-000000000005','lec@khs','{"nom_complet":"Léo Lecteur","departement":"Finance"}'),
 ('11111111-0000-0000-0000-000000000006','red2@khs','{"nom_complet":"Rémi RH","departement":"RH"}');
update public.profiles set role='redacteur' where id in ('11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000006');
update public.profiles set role='validateur' where id='11111111-0000-0000-0000-000000000002';
update public.profiles set role='administrateur' where id='11111111-0000-0000-0000-000000000003';
update public.profiles set role='auditeur' where id='11111111-0000-0000-0000-000000000004';
