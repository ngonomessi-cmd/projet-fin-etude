import { NextResponse } from "next/server";
import { creerClientServeur } from "@/lib/supabase/server";
import { exporterDocument } from "@/lib/atelier/exporter";
import type { Document } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(requete: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cible = new URL(requete.url).searchParams.get("format") === "pdf" ? "pdf" : "natif";

  const supabase = await creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL(`/login?redirect=/documents/${id}`, requete.url));

  // Lecture soumise à RLS : un document invisible pour ce compte n'est
  // jamais exporté (réponse 404, indistinguable d'un identifiant inexistant).
  const { data } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
  const doc = data as Document | null;
  if (!doc) return new NextResponse("Document introuvable.", { status: 404 });
  if (!doc.format_atelier) return new NextResponse("Ce document n'a pas été rédigé dans la plateforme.", { status: 400 });

  const fichier = await exporterDocument(doc, cible);

  await supabase.from("audit_log").insert({
    document_id: doc.id,
    acteur_id: user.id,
    action: "telechargement",
    details: { format: cible === "pdf" ? "pdf" : doc.format_atelier },
  });

  return new NextResponse(new Uint8Array(fichier.tampon), {
    headers: {
      "Content-Type": fichier.typeMime,
      "Content-Disposition": `attachment; filename="${fichier.nomFichier}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
