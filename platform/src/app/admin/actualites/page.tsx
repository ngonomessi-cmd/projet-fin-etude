import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { Badge } from "@/components/Badge";
import { LABEL_ACTUALITE, COULEUR_ACTUALITE } from "@/lib/labels";
import type { ActualitePublique, Profil } from "@/lib/types";

export default async function PageAdminActualites() {
  const supabase = await creerClientServeur();

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
              Accès réservé au rôle Administrateur.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const { data } = await supabase.from("actualites_publiques").select("*").order("updated_at", { ascending: false });
  const actualites = (data ?? []) as ActualitePublique[];

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-1 font-serif text-2xl font-semibold">Actualités publiques</h1>
              <p className="text-sm text-paper-muted">
                Rédigées et publiées ici, elles apparaissent sur le site public, sous « Actualités ». Un
                brouillon n&apos;est jamais visible sans connexion.
              </p>
            </div>
            <Link
              href="/admin/actualites/nouvelle"
              className="shrink-0 rounded-md bg-navy-950 px-4 py-2 text-center text-sm font-medium text-white hover:bg-navy-900"
            >
              Nouvelle actualité
            </Link>
          </div>

          {actualites.length === 0 ? (
            <p className="rounded-lg border border-paper-200 bg-white p-6 text-sm text-paper-muted">
              Aucune actualité pour l&apos;instant.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-paper-200 bg-white shadow-sm">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-paper-50 text-left text-paper-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Titre</th>
                    <th className="px-4 py-2.5 font-medium">Statut</th>
                    <th className="px-4 py-2.5 font-medium">Mis à jour</th>
                  </tr>
                </thead>
                <tbody>
                  {actualites.map((a) => (
                    <tr key={a.id} className="border-t border-paper-200 hover:bg-paper-50">
                      <td className="px-4 py-2.5">
                        <Link href={`/admin/actualites/${a.id}`} className="font-medium text-[#1c2029] hover:text-gold-600 hover:underline">
                          {a.titre}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge texte={LABEL_ACTUALITE[a.statut]} classesCouleur={COULEUR_ACTUALITE[a.statut]} />
                      </td>
                      <td className="px-4 py-2.5 text-paper-soft">{new Date(a.updated_at).toLocaleString("fr-FR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
