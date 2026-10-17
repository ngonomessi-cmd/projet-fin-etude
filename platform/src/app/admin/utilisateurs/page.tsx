import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { LABEL_ROLE } from "@/lib/labels";
import type { Profil } from "@/lib/types";
import { SelecteurRole } from "./SelecteurRole";
import { ChampTexteModifiable } from "./ChampTexteModifiable";

export default async function PageUtilisateurs() {
  const supabase = await creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profilData } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const profil = profilData as Profil;

  if (profil.role !== "administrateur") {
    return (
      <div className="flex min-h-screen">
        <NavBar />
        <main className="min-w-0 flex-1 overflow-y-auto px-8 py-8">
          <div className="mx-auto max-w-3xl">
            <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Accès réservé au rôle Administrateur. Cette page serait de toute façon vide pour vous : la
              table "profiles" ne masque pas sa lecture, mais seule la fonction changer_role_utilisateur
              (appelée par les contrôles ci-dessous) vérifie et refuse côté base toute tentative d&apos;un
              autre rôle.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const { data } = await supabase.from("profiles").select("*").order("nom_complet");
  const utilisateurs = (data ?? []) as Profil[];

  return (
    <div className="flex min-h-screen">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-1 font-serif text-2xl font-semibold">Utilisateurs</h1>
          <p className="mb-6 text-sm text-paper-muted">
            Gestion des rôles RBAC (contrôle d&apos;accès basé sur les rôles) et des profils. Le nom et le
            département se modifient directement dans le tableau (cliquez, modifiez, cliquez ailleurs
            pour enregistrer). Chaque changement est enregistré dans le journal d&apos;audit, via les
            fonctions PostgreSQL changer_role_utilisateur et modifier_profil_utilisateur.
          </p>

          <div className="overflow-hidden rounded-lg border border-paper-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-paper-50 text-left text-paper-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Nom</th>
                  <th className="px-4 py-2.5 font-medium">E-mail</th>
                  <th className="px-4 py-2.5 font-medium">Département</th>
                  <th className="px-4 py-2.5 font-medium">Rôle</th>
                </tr>
              </thead>
              <tbody>
                {utilisateurs.map((u) => (
                  <tr key={u.id} className="border-t border-paper-200">
                    <td className="px-2 py-1 font-medium text-[#1c2029]">
                      <ChampTexteModifiable utilisateurId={u.id} champ="nom_complet" valeurInitiale={u.nom_complet} />
                    </td>
                    <td className="px-4 py-2 text-paper-muted">{u.email ?? "—"}</td>
                    <td className="px-2 py-1 text-paper-muted">
                      <ChampTexteModifiable utilisateurId={u.id} champ="departement" valeurInitiale={u.departement} />
                    </td>
                    <td className="px-4 py-2">
                      <SelecteurRole utilisateurId={u.id} roleActuel={u.role} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-paper-soft">
            Rôles disponibles : {Object.values(LABEL_ROLE).join(", ")}.
          </p>
        </div>
      </main>
    </div>
  );
}
