import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import type { ModeleDocument, Profil } from "@/lib/types";
import { ListeModeles } from "./ListeModeles";

export default async function PageModeles() {
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
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <p className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Accès réservé au rôle Administrateur.
          </p>
        </main>
      </div>
    );
  }

  const { data } = await supabase.from("modeles_documents").select("*").order("titre");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-1 font-serif text-2xl font-semibold">Modèles de documents</h1>
          <p className="mb-6 text-sm text-paper-muted">
            Points de départ proposés lors de la création d&apos;un document (Word, Excel, PowerPoint). Un modèle peut être
            réservé à un département.
          </p>
          <ListeModeles modeles={(data ?? []) as ModeleDocument[]} />
        </div>
      </main>
    </div>
  );
}
