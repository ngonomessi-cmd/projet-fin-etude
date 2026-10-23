import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { SIGLE_ORGANISATION } from "@/lib/organisation";
import type { ActualitePublique } from "@/lib/types";

export const metadata = { title: "Actualités" };

export default async function PageActualitesPubliques() {
  const supabase = await creerClientServeur();
  const { data } = await supabase
    .from("actualites_publiques")
    .select("*")
    .eq("organisation", SIGLE_ORGANISATION)
    .eq("statut", "publie")
    .order("publie_at", { ascending: false });
  const actualites = (data ?? []) as ActualitePublique[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
      <h1 className="font-serif text-3xl font-semibold text-navy-950">Actualités</h1>
      <p className="mt-2 text-sm text-paper-muted">Les dernières actualités publiées par l&apos;agence.</p>

      {actualites.length === 0 ? (
        <p className="mt-10 rounded-lg border border-paper-200 bg-paper-50 p-6 text-sm text-paper-muted">
          Aucune actualité publiée pour le moment.
        </p>
      ) : (
        <ul className="mt-10 space-y-6">
          {actualites.map((actualite) => (
            <li key={actualite.id} className="rounded-lg border border-paper-200 p-6 hover:border-gold-500">
              <Link href={`/actualites/${actualite.slug}`}>
                {actualite.publie_at && (
                  <p className="text-xs font-medium uppercase tracking-wide text-paper-soft">
                    {new Date(actualite.publie_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
                <h2 className="mt-2 font-serif text-xl font-semibold text-navy-950">{actualite.titre}</h2>
                {actualite.extrait && <p className="mt-2 text-sm leading-relaxed text-paper-muted">{actualite.extrait}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
