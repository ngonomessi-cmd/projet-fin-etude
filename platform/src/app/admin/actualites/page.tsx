import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { Badge } from "@/components/Badge";
import { COULEUR_ACTUALITE, libelles } from "@/lib/labels";
import type { ActualitePublique, Profil } from "@/lib/types";
import { traductionServeur } from "@/lib/i18n/serveur";

export default async function PageAdminActualites() {
  const supabase = await creerClientServeur();
  const { langue, t, dl } = await traductionServeur();

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
              {t("Accès réservé au rôle Administrateur.", "Administrators only.")}
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
              <h1 className="mb-1 font-serif text-2xl font-semibold">{t("Actualités publiques", "Public news")}</h1>
              <p className="text-sm text-paper-muted">
                {t(
                  "Rédigées et publiées ici, elles apparaissent sur le site public, sous « Actualités ». Un brouillon n'est jamais visible sans connexion.",
                  "Written and published here, they appear on the public website under \"News\". A draft is never visible without signing in."
                )}
              </p>
            </div>
            <Link
              href="/admin/actualites/nouvelle"
              className="shrink-0 rounded-md bg-navy-950 px-4 py-2 text-center text-sm font-medium text-white hover:bg-navy-900"
            >
              {t("Nouvelle actualité", "New article")}
            </Link>
          </div>

          {actualites.length === 0 ? (
            <p className="rounded-lg border border-paper-200 bg-white p-6 text-sm text-paper-muted">
              {t("Aucune actualité pour l'instant.", "No news yet.")}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-paper-200 bg-white shadow-sm">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="bg-paper-50 text-left text-paper-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">{t("Titre", "Title")}</th>
                    <th className="px-4 py-2.5 font-medium">{t("Statut", "Status")}</th>
                    <th className="px-4 py-2.5 font-medium">{t("Mis à jour", "Updated")}</th>
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
                        <Badge texte={libelles(langue).actualite[a.statut]} classesCouleur={COULEUR_ACTUALITE[a.statut]} />
                      </td>
                      <td className="px-4 py-2.5 text-paper-soft">{new Date(a.updated_at).toLocaleString(dl)}</td>
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
