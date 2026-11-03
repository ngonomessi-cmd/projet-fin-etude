-- ============================================================================
-- Service du courrier — 4/4 : le départ se prouve par une DÉCHARGE.
--
-- Complément repris de la « Chancellerie numérique » et adapté (départements en
-- texte à la place de l'organigramme).
--
-- Avant : un clic « Accusé reçu » validait un destinataire, sans aucune preuve.
-- Maintenant, deux voies seulement, toutes deux réservées au service du courrier :
--   1. enregistrer_decharge_depart : le fichier de la décharge (scan ou photos
--      assemblées en PDF), la date et l'heure RÉELLES de remise (ni avant
--      l'expédition, ni dans le futur), le nom et la qualité de la personne qui
--      a signé, le mode de remise. Fichier, accusé et historique sont
--      enregistrés en une seule opération ;
--   2. accuser_sans_decharge_depart : exception réservée au CHEF du courrier,
--      avec motif obligatoire (10 caractères au moins), visible dans le dossier
--      et journalisée.
-- L'ancienne fonction qui validait sans preuve est supprimée. Les accusés déjà
-- enregistrés restent valides : leur colonne « preuve » est vide et ils
-- s'affichent « avant l'obligation de décharge ».
--
-- Une pièce de nature « accusé » ne peut plus être déposée en dehors de la
-- décharge : un scan isolé ne passe pas pour une preuve.
--
-- À exécuter une seule fois, après les migrations 0029 à 0032.
-- ============================================================================

alter table public.depart_destinataires
  add column preuve              text check (preuve is null or preuve in ('decharge', 'sans_decharge')),
  add column remis_le            timestamptz,
  add column recu_par            text check (recu_par is null or length(recu_par) between 1 and 200),
  add column recu_qualite        text check (recu_qualite is null or length(recu_qualite) <= 200),
  add column remise_mode         text check (remise_mode is null or remise_mode in ('main', 'coursier', 'huissier', 'poste', 'autre')),
  add column decharge_piece_id   uuid references public.depart_pieces (id),
  add column motif_sans_decharge text check (motif_sans_decharge is null or length(motif_sans_decharge) between 10 and 500);

-- -----------------------------------------------------------------------------
-- Pièces : une pièce de nature « accusé » ne se dépose plus que par la décharge
-- -----------------------------------------------------------------------------
-- Même fonction qu'avant, avec une garde : la nature « accuse » exige le marqueur posé (pour la durée de la transaction)
-- par enregistrer_decharge_depart. Un scan d'accusé isolé ne peut donc plus passer pour une preuve.

create or replace function public.ajouter_piece_depart(p_depart uuid, p_chemin text, p_nom text, p_taille bigint, p_empreinte text, p_nature text default 'lettre', p_destinataire uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_d  public.departs;
  v_id uuid;
begin
  select * into v_d from public.departs where id = p_depart and organisation = public.mon_organisation() for update;
  if v_d.id is null or v_d.statut in ('annule', 'refuse') then
    raise exception 'Ce départ n''accepte plus de pièce' using errcode = '42501';
  end if;
  if not (public.role_courrier() is not null or (v_d.demandeur_id = auth.uid() and v_d.statut = 'demande' and p_nature = 'lettre')) then
    raise exception 'Dépôt non autorisé' using errcode = '42501';
  end if;
  if p_nature not in ('lettre', 'lettre_signee', 'accuse', 'annexe') then
    raise exception 'Nature de pièce inconnue' using errcode = '22023';
  end if;
  if p_nature = 'accuse' and coalesce(current_setting('courrier.decharge', true), '') <> 'oui' then
    raise exception 'Un accusé de réception se dépose avec la décharge du destinataire' using errcode = '42501';
  end if;
  if p_destinataire is not null and not exists (select 1 from public.depart_destinataires where id = p_destinataire and depart_id = p_depart) then
    raise exception 'Destinataire inconnu' using errcode = '42501';
  end if;
  if split_part(p_chemin, '/', 1) <> p_depart::text
     or not exists (select 1 from storage.objects where bucket_id = 'courrier' and name = p_chemin) then
    raise exception 'Fichier introuvable dans l''archive' using errcode = '42501';
  end if;
  insert into public.depart_pieces (depart_id, chemin_fichier, nom_fichier, taille, empreinte_sha256, nature, destinataire_id, ajoute_par)
  values (p_depart, p_chemin, left(p_nom, 200), p_taille, p_empreinte, p_nature, p_destinataire, auth.uid())
  returning id into v_id;
  perform public.mouvement_depart(p_depart, case p_nature when 'accuse' then 'accuse_scanne' else 'piece' end,
    jsonb_build_object('piece', v_id, 'nature', p_nature, 'empreinte', p_empreinte));
  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1. Décharge déposée
-- -----------------------------------------------------------------------------

create function public.enregistrer_decharge_depart(
  p_depart uuid, p_destinataire uuid, p_chemin text, p_nom text, p_taille bigint, p_empreinte text,
  p_remis_le timestamptz, p_recu_par text, p_qualite text, p_mode text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_d     public.departs;
  v_x     public.depart_destinataires;
  v_nom   text := left(trim(coalesce(p_recu_par, '')), 200);
  v_piece uuid;
begin
  if public.role_courrier() is null then
    raise exception 'Action réservée au service du courrier' using errcode = '42501';
  end if;
  select * into v_d from public.departs where id = p_depart and organisation = public.mon_organisation() for update;
  if v_d.id is null or v_d.statut not in ('expedie', 'accuse') then
    raise exception 'Ce départ n''est pas expédié' using errcode = '42501';
  end if;
  select * into v_x from public.depart_destinataires where id = p_destinataire and depart_id = p_depart for update;
  if v_x.id is null or v_x.statut <> 'expedie' then
    raise exception 'Destinataire introuvable ou accusé déjà enregistré' using errcode = '42501';
  end if;
  if v_nom = '' then
    raise exception 'Indiquez le nom de la personne qui a signé la décharge' using errcode = '22023';
  end if;
  if coalesce(p_mode, '') not in ('main', 'coursier', 'huissier', 'poste', 'autre') then
    raise exception 'Mode de remise inconnu' using errcode = '22023';
  end if;
  -- La remise réelle : pas avant l'expédition (à la minute près), pas dans le futur (5 minutes de tolérance sur l'horloge du poste).
  if p_remis_le is null
     or p_remis_le < coalesce(v_x.expedie_le, v_d.expedie_le) - interval '1 minute'   -- le champ de date du formulaire est arrondi à la minute
     or p_remis_le > clock_timestamp() + interval '5 minutes' then
    raise exception 'La date de remise doit se situer entre l''expédition et maintenant' using errcode = '22023';
  end if;

  perform set_config('courrier.decharge', 'oui', true);
  v_piece := public.ajouter_piece_depart(p_depart, p_chemin, p_nom, p_taille, p_empreinte, 'accuse', p_destinataire);
  perform set_config('courrier.decharge', '', true);

  update public.depart_destinataires
  set statut = 'accuse', accuse_le = clock_timestamp(), accuse_par = auth.uid(), preuve = 'decharge', remis_le = p_remis_le,
      recu_par = v_nom, recu_qualite = nullif(left(trim(coalesce(p_qualite, '')), 200), ''), remise_mode = p_mode,
      decharge_piece_id = v_piece
  where id = p_destinataire;
  if not exists (select 1 from public.depart_destinataires where depart_id = p_depart and role = 'destinataire' and statut <> 'accuse') then
    update public.departs set statut = 'accuse' where id = p_depart;
  end if;
  perform public.mouvement_depart(p_depart, 'accuse',
    jsonb_build_object('destinataire', p_destinataire, 'preuve', 'decharge', 'remis_le', p_remis_le, 'piece', v_piece));
  return v_piece;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Exception : accusé sans décharge (chef du courrier, motif obligatoire)
-- -----------------------------------------------------------------------------

create function public.accuser_sans_decharge_depart(p_depart uuid, p_destinataire uuid, p_motif text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_d     public.departs;
  v_x     public.depart_destinataires;
  v_motif text := left(trim(coalesce(p_motif, '')), 500);
begin
  if public.role_courrier() is distinct from 'chef' then
    raise exception 'Action réservée au chef du courrier' using errcode = '42501';
  end if;
  if length(v_motif) < 10 then
    raise exception 'Le motif doit compter au moins 10 caractères' using errcode = '22023';
  end if;
  select * into v_d from public.departs where id = p_depart and organisation = public.mon_organisation() for update;
  if v_d.id is null or v_d.statut not in ('expedie', 'accuse') then
    raise exception 'Ce départ n''est pas expédié' using errcode = '42501';
  end if;
  select * into v_x from public.depart_destinataires where id = p_destinataire and depart_id = p_depart for update;
  if v_x.id is null or v_x.statut <> 'expedie' then
    raise exception 'Destinataire introuvable ou accusé déjà enregistré' using errcode = '42501';
  end if;

  update public.depart_destinataires
  set statut = 'accuse', accuse_le = clock_timestamp(), accuse_par = auth.uid(), preuve = 'sans_decharge', motif_sans_decharge = v_motif
  where id = p_destinataire;
  if not exists (select 1 from public.depart_destinataires where depart_id = p_depart and role = 'destinataire' and statut <> 'accuse') then
    update public.departs set statut = 'accuse' where id = p_depart;
  end if;
  perform public.mouvement_depart(p_depart, 'accuse', jsonb_build_object('destinataire', p_destinataire, 'preuve', 'sans_decharge'));
end;
$$;

-- L'ancienne validation sans preuve disparaît.
drop function public.accuser_destinataire_depart(uuid, uuid);

-- -----------------------------------------------------------------------------
-- Registre : la preuve de chaque accusé (nombre de décharges / accusés sans décharge)
-- -----------------------------------------------------------------------------
-- Colonne « accuses » inchangée (« 2/3 ») ; « preuves » détaille : « 1 décharge ; 1 sans décharge ».

drop function public.registre_depart(date, date);
create function public.registre_depart(p_debut date, p_fin date)
returns table (
  numero text, enregistre_le timestamptz, expedie_le timestamptz, objet text, departement text, demandeur text,
  mode_envoi text, nb_pieces int, urgent boolean, destinataires text, ampliations text, statut text,
  ar_demande boolean, accuses text, reponse_a text, signature_numero text, preuves text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.role_courrier() is null then
    raise exception 'Action réservée au service du courrier' using errcode = '42501';
  end if;
  perform public.journaliser('depart.registre', null, jsonb_build_object('debut', p_debut, 'fin', p_fin));
  return query
  select d.numero, d.enregistre_le, d.expedie_le, d.objet, d.departement, pr.nom_complet, d.mode_envoi, d.nb_pieces, d.urgent,
         (select string_agg(x.nom, ' ; ' order by x.ordre) from public.depart_destinataires x where x.depart_id = d.id and x.role = 'destinataire'),
         (select string_agg(x.nom, ' ; ' order by x.ordre) from public.depart_destinataires x where x.depart_id = d.id and x.role = 'ampliation'),
         d.statut, d.ar_demande,
         (select count(*) filter (where x.statut = 'accuse') || '/' || count(*) from public.depart_destinataires x where x.depart_id = d.id and x.role = 'destinataire'),
         c.numero, d.signature_numero,
         (select nullif(concat_ws(' ; ',
                   nullif(count(*) filter (where x.preuve = 'decharge'), 0) || ' décharge(s)',
                   nullif(count(*) filter (where x.preuve = 'sans_decharge'), 0) || ' sans décharge',
                   nullif(count(*) filter (where x.statut = 'accuse' and x.preuve is null), 0) || ' avant décharge obligatoire'), '')
            from public.depart_destinataires x where x.depart_id = d.id and x.role = 'destinataire')
  from public.departs d
  join public.profiles pr on pr.id = d.demandeur_id
  left join public.courriers c on c.id = d.courrier_arrivee_id
  where d.organisation = public.mon_organisation() and d.statut in ('enregistre', 'expedie', 'accuse', 'annule')
    and (d.enregistre_le at time zone 'Africa/Douala')::date between coalesce(p_debut, date '2000-01-01') and coalesce(p_fin, date '2999-12-31')
  order by d.enregistre_le;
end;
$$;

-- Privilèges d'exécution : fermés, puis ouverts aux seuls agents connectés (chaque fonction vérifie le rôle).
revoke execute on function
  public.enregistrer_decharge_depart(uuid, uuid, text, text, bigint, text, timestamptz, text, text, text),
  public.accuser_sans_decharge_depart(uuid, uuid, text),
  public.registre_depart(date, date)
from public, anon, authenticated;
grant execute on function
  public.enregistrer_decharge_depart(uuid, uuid, text, text, bigint, text, timestamptz, text, text, text),
  public.accuser_sans_decharge_depart(uuid, uuid, text),
  public.registre_depart(date, date)
to authenticated;
