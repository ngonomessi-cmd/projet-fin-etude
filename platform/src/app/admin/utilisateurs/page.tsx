import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { LABEL_ROLE } from "@/lib/labels";
import type { Profil } from "@/lib/types";
import { SelecteurRole } from "./SelecteurRole";

export default async function PageUtilisateurs() {
  const supabase = await creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profilData } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const profil = profilData as Profil;

  if (profil.role !== "administrateur") {
    return (
      <>
        <NavBar />
        <main className="mx-auto max-w-3xl px-4 py-6">
          <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Accès réservé au rôle Administrateur. Cette page serait de toute façon vide pour vous : la
            table "profiles" ne masque pas sa lecture, mais seule la fonction changer_role_utilisateur
            (appelée par les contrôles ci-dessous) vérifie et refuse côté base toute tentative d&apos;un
            autre rôle.
          </p>
        </main>
      </>
    );
  }

  const { data } = await supabase.from("profiles").select("*").order("nom_complet");
  const utilisateurs = (data ?? []) as Profil[];

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="mb-1 text-xl font-semibold text-slate-900">Utilisateurs</h1>
        <p className="mb-6 text-sm text-slate-500">
          Gestion des rôles RBAC (contrôle d&apos;accès basé sur les rôles). Chaque changement est
          enregistré dans le journal d&apos;audit, via la fonction PostgreSQL changer_role_utilisateur.
        </p>

        <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Nom</th>
                <th className="px-4 py-2">Département</th>
                <th className="px-4 py-2">Rôle</th>
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-900">{u.nom_complet}</td>
                  <td className="px-4 py-2 text-slate-600">{u.departement}</td>
                  <td className="px-4 py-2">
                    <SelecteurRole utilisateurId={u.id} roleActuel={u.role} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Rôles disponibles : {Object.values(LABEL_ROLE).join(", ")}.
        </p>
      </main>
    </>
  );
}
