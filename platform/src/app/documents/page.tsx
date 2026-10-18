import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { DocumentsParDepartement, type GroupeDepartement } from "./DocumentsParDepartement";
import type { Document, Profil } from "@/lib/types";

export default async function PageDocuments() {
  const supabase = await creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profilData } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const profil = profilData as Profil;

  // Aucun filtre ici : la liste visible est entièrement déterminée par la
  // policy RLS "lecture_documents_selon_classification_et_role" côté base —
  // la même requête renvoie un résultat différent selon le rôle connecté.
  const [{ data: documentsData }, { data: profilsData }] = await Promise.all([
    supabase.from("documents").select("*").order("updated_at", { ascending: false }),
    supabase.from("profiles").select("departement"),
  ]);
  const documents = (documentsData ?? []) as Document[];

  const peutDeposer = profil.role === "redacteur" || profil.role === "administrateur";

  // Un dossier par département, créé automatiquement — même principe que les
  // canaux de diffusion : tout département connu (via les profils) obtient
  // son dossier, même sans document dedans pour l'instant.
  const departements = new Set<string>();
  for (const p of (profilsData ?? []) as { departement: string }[]) {
    if (p.departement?.trim()) departements.add(p.departement.trim());
  }
  for (const d of documents) {
    if (d.departement?.trim()) departements.add(d.departement.trim());
  }

  const groupes: GroupeDepartement[] = [...departements]
    .sort((a, b) => a.localeCompare(b, "fr"))
    .map((departement) => ({
      departement,
      documents: documents.filter((d) => d.departement === departement),
    }));

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-serif text-2xl font-semibold">Documents</h1>
              <p className="text-sm text-paper-muted">
                Liste filtrée automatiquement par les policies RLS (Row Level Security) de Supabase — ce
                que vous voyez dépend uniquement de votre rôle et de votre département.
              </p>
            </div>
            {peutDeposer && (
              <Link
                href="/documents/new"
                className="shrink-0 rounded-md bg-navy-950 px-4 py-2 text-center text-sm font-medium text-white hover:bg-navy-900"
              >
                Déposer un document
              </Link>
            )}
          </div>

          {groupes.length === 0 ? (
            <p className="rounded-lg border border-paper-200 bg-white p-6 text-sm text-paper-muted">
              Aucun document visible pour votre compte.
            </p>
          ) : (
            <DocumentsParDepartement groupes={groupes} />
          )}
        </div>
      </main>
    </div>
  );
}
