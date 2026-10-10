-- ============================================================================
-- Permet à un administrateur de modifier le nom complet et le département
-- d'un autre utilisateur depuis la page "Utilisateurs" de l'application.
--
-- La policy "profils_maj_propre_profil" (migration 0001) ne permet qu'à un
-- utilisateur de modifier SON PROPRE profil — c'est volontaire et reste en
-- place (un rédacteur ne doit pas pouvoir modifier le profil d'un autre).
-- Un administrateur doit en revanche pouvoir corriger le profil de
-- n'importe quel compte (faute de frappe sur le département, etc.) :
-- même principe que changer_role_utilisateur (SECURITY DEFINER, avec sa
-- propre vérification explicite du rôle appelant).
--
-- p_nom_complet et p_departement sont tous deux facultatifs (défaut NULL)
-- et combinés via COALESCE : l'appelant ne fournit que le champ qu'il
-- modifie réellement, l'autre reste inchangé.
-- ============================================================================

create function public.modifier_profil_utilisateur(
  p_utilisateur_id uuid,
  p_nom_complet text default null,
  p_departement text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_appelant_role public.role_utilisateur;
  v_profil public.profiles;
begin
  select role into v_appelant_role from public.profiles where id = auth.uid();

  if v_appelant_role is distinct from 'administrateur' then
    raise exception 'Seul un administrateur peut modifier le profil d''un autre utilisateur.';
  end if;

  update public.profiles
    set nom_complet = coalesce(nullif(p_nom_complet, ''), nom_complet),
        departement = coalesce(nullif(p_departement, ''), departement)
    where id = p_utilisateur_id
    returning * into v_profil;

  if v_profil.id is null then
    raise exception 'Utilisateur introuvable.';
  end if;

  insert into public.audit_log (document_id, acteur_id, action, details)
    values (
      null, auth.uid(), 'modification_profil',
      jsonb_build_object('utilisateur_cible', p_utilisateur_id, 'nom_complet', p_nom_complet, 'departement', p_departement)
    );

  return v_profil;
end;
$$;

grant execute on function public.modifier_profil_utilisateur(uuid, text, text) to authenticated;
