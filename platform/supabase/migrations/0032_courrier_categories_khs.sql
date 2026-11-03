-- ============================================================================
-- Service du courrier — catégories de conservation de KHS Bank.
--
-- Le service du courrier (migrations 0029 à 0031) fonctionne pour toute
-- organisation de la plateforme ; seules les catégories de conservation sont
-- propres à chacune. 0031 a créé celles de l'Agence (« API ») : cette
-- migration crée celles de KHS Bank.
--
-- Les durées sont des PROPOSITIONS de départ, pas des règles légales : à faire
-- valider par la conformité et le service des archives de la banque. Elles se
-- changent dans la table, sans toucher au code.
--
-- Pour activer le service chez KHS Bank : NEXT_PUBLIC_ORG_COURRIER=true dans
-- son projet Vercel, puis redéployer. À exécuter après la migration 0031.
-- ============================================================================

insert into public.categories_conservation (organisation, code, libelle, description, duree_annees, duree_propre, sort_final, ordre) values
  ('KHS', 'correspondance', 'Correspondance courante', 'Courrier ordinaire, sans portée d''acte : 5 ans, puis destruction des scans sur validation.', 5, false, 'destruction', 10),
  ('KHS', 'actes', 'Contrats, décisions et courrier engageant la banque', 'Conservé 10 ans, puis versé aux archives : jamais détruit sans décision.', 10, false, 'versement', 20),
  ('KHS', 'dossiers_clients', 'Dossiers de clients et de crédit', 'Courrier lié à un client, à un crédit ou à une garantie : 10 ans après la clôture, puis versement aux archives.', 10, false, 'versement', 25),
  ('KHS', 'confidentiel', 'Pièces confidentielles', 'Durée fixée, pièce par pièce, par le propriétaire de l''information.', null, true, 'versement', 30)
on conflict (organisation, code) do nothing;
