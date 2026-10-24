import { notFound } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { NOM_ORGANISATION } from "@/lib/organisation";
import type { ModeleDocument, Profil } from "@/lib/types";
import { EditeurModele } from "./EditeurModele";

export default async function PageEditerModele({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profilData } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const profil = profilData as Profil;

  const { data } = await supabase.from("modeles_documents").select("*").eq("id", id).maybeSingle();
  const modele = data as ModeleDocument | null;
  // Les modèles communs (organisation nulle) ne se modifient pas : on les adapte.
  if (!modele || modele.organisation === null || profil.role !== "administrateur") notFound();

  const { data: profils } = await supabase.from("profiles").select("departement");
  const departements = [...new Set(((profils ?? []) as { departement: string }[]).map((p) => p.departement).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "fr")
  );

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <EditeurModele modele={modele} departements={departements} organisation={NOM_ORGANISATION} />
        </div>
      </main>
    </div>
  );
}
