import { notFound, redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { NOM_ORGANISATION } from "@/lib/organisation";
import type { Document } from "@/lib/types";
import { AtelierDocument } from "./AtelierDocument";

export default async function PageEditerDocument({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await creerClientServeur();

  const { data } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
  const doc = data as Document | null;
  if (!doc) notFound();
  if (!doc.format_atelier) redirect(`/documents/${id}`);

  const { data: peutEditer } = await supabase.rpc("peut_editer_document", { p_document_id: id });

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <AtelierDocument
            documentId={doc.id}
            titreInitial={doc.titre}
            format={doc.format_atelier}
            contenuInitial={doc.contenu}
            peutEditer={Boolean(peutEditer)}
            archive={Boolean(doc.archive_le)}
            organisation={NOM_ORGANISATION}
          />
        </div>
      </main>
    </div>
  );
}
