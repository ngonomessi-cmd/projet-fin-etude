-- 1) Illustration des actualités : chemin d'une image de la bibliothèque du
--    site (public/images/site/...), choisie dans le formulaire admin.
alter table public.actualites_publiques add column if not exists image_url text
  check (image_url is null or image_url ~ '^/images/site/[a-z0-9-]+\.jpg$');

-- 2) Cinq actualités D'EXEMPLE pour l'agence (organisation 'API'), publiées,
--    en français et en anglais. Textes de démonstration à remplacer avant
--    une mise en ligne réelle. Pour les retirer d'un coup :
--
--    delete from public.actualites_publiques
--    where organisation = 'API' and slug in (
--      'forum-economique-cameroun-ue-vers-de-nouveaux-partenariats',
--      'infrastructures-et-energie-le-cameroun-renforce-son-attractivite',
--      'agro-industrie-de-nouvelles-opportunites-pour-les-investisseurs',
--      'agrement-aux-regimes-incitatifs-un-accompagnement-renforce',
--      'promotion-de-la-destination-cameroun-aupres-des-investisseurs'
--    );
--
-- Le déclencheur d'insertion tamponne normalement l'auteur et l'organisation
-- depuis la session (auth.uid()), absente dans l'éditeur SQL : il est
-- suspendu le temps de cette insertion, l'auteur étant le premier
-- administrateur de l'agence.
do $$
begin
  if not exists (select 1 from public.profiles where organisation = 'API' and role = 'administrateur') then
    raise exception 'Aucun administrateur de l''organisation API : impossible d''attribuer les actualités d''exemple.';
  end if;
end;
$$;

begin;

alter table public.actualites_publiques disable trigger declencheur_organisation_actualite;

insert into public.actualites_publiques
  (organisation, auteur_id, statut, slug, image_url, publie_at, titre, extrait, contenu, titre_en, extrait_en, contenu_en)
select 'API', admin.id, 'publie', v.slug, v.image_url, now() - v.anciennete, v.titre, v.extrait, v.contenu, v.titre_en, v.extrait_en, v.contenu_en
from (values
  (
    'forum-economique-cameroun-ue-vers-de-nouveaux-partenariats',
    '/images/site/mission-4.jpg',
    interval '2 days',
    $t$Forum économique Cameroun–UE : vers de nouveaux partenariats$t$,
    $t$Investisseurs européens et acteurs camerounais se sont réunis pour explorer de nouvelles opportunités de coopération économique.$t$,
    $t$L'agence a participé au forum économique réunissant des entreprises européennes et camerounaises autour des opportunités d'investissement au Cameroun.

Les échanges ont porté sur les secteurs prioritaires — agro-industrie, énergie, infrastructures et services numériques — ainsi que sur les dispositifs d'accompagnement mis à la disposition des investisseurs.

En marge des sessions plénières, l'équipe de l'agence a tenu des rencontres bilatérales avec plusieurs porteurs de projets afin de présenter le guichet unique et les régimes incitatifs prévus par la législation en vigueur.$t$,
    $t$Cameroon–EU Economic Forum: towards new partnerships$t$,
    $t$European investors and Cameroonian stakeholders met to explore new opportunities for economic cooperation.$t$,
    $t$The agency took part in the economic forum bringing together European and Cameroonian companies around investment opportunities in Cameroon.

Discussions focused on priority sectors — agribusiness, energy, infrastructure and digital services — as well as on the support schemes available to investors.

Alongside the plenary sessions, the agency's team held bilateral meetings with several project promoters to present the one-stop shop and the incentive schemes provided for by current legislation.$t$
  ),
  (
    'infrastructures-et-energie-le-cameroun-renforce-son-attractivite',
    '/images/site/route.jpg',
    interval '9 days',
    $t$Infrastructures et énergie : le Cameroun renforce son attractivité$t$,
    $t$Transport, énergie, logistique : les grands chantiers structurants ouvrent de nouvelles perspectives aux investisseurs.$t$,
    $t$Le développement des infrastructures de transport et de production d'énergie constitue l'un des leviers majeurs de l'attractivité du Cameroun.

Ces projets structurants créent un environnement favorable aux investissements dans l'industrie, la logistique et les services, en améliorant l'accès aux marchés nationaux et régionaux.

L'agence accompagne les investisseurs intéressés par ces secteurs, de l'information initiale jusqu'à la mise en relation avec les administrations et partenaires compétents.$t$,
    $t$Infrastructure and energy: Cameroon strengthens its appeal$t$,
    $t$Transport, energy, logistics: major structural projects are opening up new prospects for investors.$t$,
    $t$The development of transport and energy infrastructure is one of the main drivers of Cameroon's attractiveness.

These structural projects create a favourable environment for investment in industry, logistics and services, by improving access to national and regional markets.

The agency supports investors interested in these sectors, from initial information through to liaison with the relevant authorities and partners.$t$
  ),
  (
    'agro-industrie-de-nouvelles-opportunites-pour-les-investisseurs',
    '/images/site/actualite-3.jpg',
    interval '16 days',
    $t$Agro-industrie : de nouvelles opportunités pour les investisseurs$t$,
    $t$Transformation locale, chaînes de valeur, exportation : l'agro-industrie reste un secteur porteur au Cameroun.$t$,
    $t$Grâce à la diversité de ses terres et de ses climats, le Cameroun offre un fort potentiel dans la production et la transformation agricoles.

La transformation locale des produits agricoles permet de créer davantage de valeur ajoutée, des emplois et de nouvelles filières d'exportation vers les marchés de la sous-région.

Les porteurs de projets agro-industriels peuvent solliciter l'agence pour un pré-diagnostic de leur projet et une orientation vers les dispositifs adaptés.$t$,
    $t$Agribusiness: new opportunities for investors$t$,
    $t$Local processing, value chains, exports: agribusiness remains a promising sector in Cameroon.$t$,
    $t$Thanks to the diversity of its land and climates, Cameroon offers strong potential in agricultural production and processing.

Local processing of agricultural products creates more added value, jobs and new export channels to the markets of the sub-region.

Promoters of agribusiness projects can contact the agency for a pre-assessment of their project and guidance towards suitable schemes.$t$
  ),
  (
    'agrement-aux-regimes-incitatifs-un-accompagnement-renforce',
    '/images/site/mission-3.jpg',
    interval '23 days',
    $t$Agrément aux régimes incitatifs : un accompagnement renforcé$t$,
    $t$L'agence renforce son appui aux porteurs de projets dans la constitution et le suivi de leurs dossiers d'agrément.$t$,
    $t$Bénéficier des régimes incitatifs prévus par la législation suppose la constitution d'un dossier complet et conforme.

Pour faciliter cette étape, l'agence propose un accompagnement personnalisé : vérification des pièces, conseils sur la présentation du projet et suivi de l'instruction auprès des administrations compétentes.

Les investisseurs peuvent prendre contact avec l'agence via le formulaire du site pour être orientés vers un conseiller.$t$,
    $t$Approval for incentive schemes: stronger support$t$,
    $t$The agency is stepping up its support for project promoters in preparing and following up their approval applications.$t$,
    $t$Benefiting from the incentive schemes provided for by law requires a complete and compliant application.

To make this step easier, the agency offers personalised support: checking documents, advice on presenting the project and following up the review with the relevant authorities.

Investors can contact the agency through the website form to be directed to an adviser.$t$
  ),
  (
    'promotion-de-la-destination-cameroun-aupres-des-investisseurs',
    '/images/site/hero-missions.jpg',
    interval '30 days',
    $t$Promotion de la destination Cameroun auprès des investisseurs$t$,
    $t$L'agence poursuit ses actions de valorisation des atouts du pays auprès des investisseurs nationaux et internationaux.$t$,
    $t$Faire connaître les atouts du Cameroun est au cœur des missions de l'agence : ressources naturelles, position stratégique en Afrique centrale, jeunesse et talents qualifiés.

À travers l'information économique, la participation à des évènements dédiés et l'accueil de délégations, l'agence présente les opportunités d'investissement du pays et les dispositifs d'accompagnement disponibles.

Ces actions visent à attirer des investissements durables, créateurs d'emplois et de valeur pour l'économie nationale.$t$,
    $t$Promoting Cameroon as a destination for investors$t$,
    $t$The agency continues to showcase the country's strengths to national and international investors.$t$,
    $t$Raising awareness of Cameroon's strengths is at the heart of the agency's missions: natural resources, a strategic position in Central Africa, and young, skilled talent.

Through economic information, participation in dedicated events and hosting delegations, the agency presents the country's investment opportunities and the support schemes available.

These actions aim to attract sustainable investment that creates jobs and value for the national economy.$t$
  )
) as v(slug, image_url, anciennete, titre, extrait, contenu, titre_en, extrait_en, contenu_en)
cross join lateral (
  select id from public.profiles
  where organisation = 'API' and role = 'administrateur'
  order by created_at
  limit 1
) as admin
on conflict (organisation, slug) do nothing;

alter table public.actualites_publiques enable trigger declencheur_organisation_actualite;

commit;
