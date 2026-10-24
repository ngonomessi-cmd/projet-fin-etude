import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { LABEL_ROLE, libelles } from "@/lib/labels";
import type { RoleUtilisateur } from "@/lib/types";
import type { Profil } from "@/lib/types";
import { SelecteurRole } from "./SelecteurRole";
import { ChampTexteModifiable } from "./ChampTexteModifiable";
import { NomsDepartementsEn } from "./NomsDepartementsEn";
import { EtatMfa } from "./EtatMfa";
import { PLATEFORME_BILINGUE } from "@/lib/i18n/plateforme";
import { chargerNomsDepartementsEn } from "@/lib/i18n/serveur";
import { traductionServeur } from "@/lib/i18n/serveur";

export default async function PageUtilisateurs() {
  const supabase = await creerClientServeur();
  const { langue, t } = await traductionServeur();
  const L = libelles(langue);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profilData } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const profil = profilData as Profil;

  if (profil.role !== "administrateur") {
    return (
      <div className="flex min-h-screen flex-col lg:flex-row">
        <NavBar />
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-3xl">
            <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {t(
                "Accès réservé au rôle Administrateur. Cette page serait de toute façon vide pour vous : la table \"profiles\" ne masque pas sa lecture, mais seule la fonction changer_role_utilisateur (appelée par les contrôles ci-dessous) vérifie et refuse côté base toute tentative d'un autre rôle.",
                "Administrators only. Any attempt from another role is checked and refused by the database (changer_role_utilisateur function)."
              )}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const { data } = await supabase.from("profiles").select("*").order("nom_complet");
  const utilisateurs = (data ?? []) as Profil[];
  const { data: etatsMfa } = await supabase.rpc("etat_mfa_utilisateurs");
  const mfaActif = new Map(((etatsMfa ?? []) as { utilisateur_id: string; mfa_actif: boolean }[]).map((e) => [e.utilisateur_id, e.mfa_actif]));
  const nomsEn = PLATEFORME_BILINGUE ? await chargerNomsDepartementsEn() : {};
  const lignesDepartements = [...new Set(utilisateurs.map((u) => u.departement?.trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "fr"))
    .map((d) => ({ departement: d, nomEn: nomsEn[d] ?? "" }));

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-1 font-serif text-2xl font-semibold">{t("Utilisateurs", "Users")}</h1>
          <p className="mb-6 text-sm text-paper-muted">
            {t(
              "Gestion des rôles RBAC (contrôle d'accès basé sur les rôles) et des profils. Le nom et le département se modifient directement dans le tableau (cliquez, modifiez, cliquez ailleurs pour enregistrer). Chaque changement est enregistré dans le journal d'audit, via les fonctions PostgreSQL changer_role_utilisateur et modifier_profil_utilisateur.",
              "Manage RBAC roles (role-based access control) and profiles. Name and department are edited directly in the table (click, edit, click elsewhere to save). Every change is recorded in the audit log, through the PostgreSQL functions changer_role_utilisateur and modifier_profil_utilisateur."
            )}
          </p>

          <div className="overflow-x-auto rounded-lg border border-paper-200 bg-white shadow-sm">
            <table className="tableau-empilable w-full min-w-[760px] text-sm">
              <thead className="bg-paper-50 text-left text-paper-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">{t("Nom", "Name")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("E-mail", "Email")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("Département", "Department")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("Rôle", "Role")}</th>
                  <th className="px-4 py-2.5 font-medium">{t("Double authentification", "Two-factor auth.")}</th>
                </tr>
              </thead>
              <tbody>
                {utilisateurs.map((u) => (
                  <tr key={u.id} className="border-t border-paper-200">
                    <td className="px-2 py-1 font-medium text-[#1c2029]">
                      <ChampTexteModifiable utilisateurId={u.id} champ="nom_complet" valeurInitiale={u.nom_complet} />
                    </td>
                    <td data-label={t("E-mail", "Email")} className="px-4 py-2 text-paper-muted break-all">
                      {u.email ?? "—"}
                    </td>
                    <td data-label={t("Département", "Department")} className="px-2 py-1 text-paper-muted">
                      <ChampTexteModifiable utilisateurId={u.id} champ="departement" valeurInitiale={u.departement} />
                    </td>
                    <td data-label={t("Rôle", "Role")} className="px-4 py-2">
                      <SelecteurRole utilisateurId={u.id} roleActuel={u.role} />
                    </td>
                    <td data-label={t("Double authentification", "Two-factor auth.")} className="px-4 py-2">
                      <EtatMfa utilisateurId={u.id} nom={u.nom_complet} actif={mfaActif.get(u.id) ?? false} estMoi={u.id === user!.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {PLATEFORME_BILINGUE && <NomsDepartementsEn lignes={lignesDepartements} />}

          <section className="mt-6 rounded-lg border border-paper-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 font-serif text-base font-semibold">{t("Ce que permet chaque rôle", "What each role can do")}</h2>
            <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
              {(Object.keys(LABEL_ROLE) as RoleUtilisateur[]).map((r) => (
                <div key={r} className="contents">
                  <dt className="font-medium text-[#1c2029]">{L.role[r]}</dt>
                  <dd className="text-paper-muted">{L.descriptionRole[r]}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-paper-soft">
              {t(
                "Partage : avec toute personne que l'on peut contacter dans la messagerie ; un document confidentiel reste dans son département. Chaque partage est inscrit au journal d'audit.",
                "Sharing: with anyone you can contact in messaging; a confidential document stays within its department. Every share is recorded in the audit log."
              )}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
