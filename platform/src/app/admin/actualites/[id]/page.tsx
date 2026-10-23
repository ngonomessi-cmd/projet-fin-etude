import Link from "next/link";
import { notFound } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import type { ActualitePublique, Profil } from "@/lib/types";
import { FormulaireActualite } from "../FormulaireActualite";

export default async function PageEditionActualite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const { data } = await supabase.from("actualites_publiques").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const actualite = data as ActualitePublique;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <Link href="/admin/actualites" className="mb-4 inline-block text-sm text-paper-muted hover:text-gold-600 hover:underline">
            ← Retour aux actualités
          </Link>
          <div className="mb-6 flex items-center justify-between gap-3">
            <h1 className="font-serif text-2xl font-semibold">Modifier l&apos;actualité</h1>
            {actualite.statut === "publie" && (
              <Link
                href={`/actualites/${actualite.slug}`}
                target="_blank"
                className="shrink-0 text-sm text-paper-muted hover:text-gold-600 hover:underline"
              >
                Voir sur le site public →
              </Link>
            )}
          </div>
          <FormulaireActualite actualite={actualite} />
        </div>
      </main>
    </div>
  );
}
