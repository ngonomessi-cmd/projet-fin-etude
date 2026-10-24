import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { ROLES_PRODUCTEURS } from "@/lib/labels";
import type { ModeleDocument, Profil } from "@/lib/types";
import { NouveauDocument } from "./NouveauDocument";

export default async function PageNouveauDocument() {
  const supabase = await creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profilData } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const profil = profilData as Profil;

  // Lecture soumise à RLS : modèles communs + modèles de l'organisation,
  // limités au département de l'utilisateur quand l'administrateur l'a prévu.
  const { data: modelesData } = await supabase
    .from("modeles_documents")
    .select("*")
    .eq("actif", true)
    .order("titre");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-1 font-serif text-2xl font-semibold">Nouveau document</h1>
          <p className="mb-6 text-sm text-paper-muted">
            Le document est créé à l&apos;état « Brouillon » : vous pouvez le rédiger, le partager pour co-écriture, puis le
            soumettre à validation depuis sa fiche.
          </p>

          {ROLES_PRODUCTEURS.includes(profil.role) ? (
            <NouveauDocument modeles={(modelesData ?? []) as ModeleDocument[]} />
          ) : (
            <p className="rounded-lg border border-paper-200 bg-white p-5 text-sm text-paper-muted">
              Votre rôle permet de consulter les documents, mais pas d&apos;en créer. Adressez-vous à un administrateur si
              vous devez rédiger des documents.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
