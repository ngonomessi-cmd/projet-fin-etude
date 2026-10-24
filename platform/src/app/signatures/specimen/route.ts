import { NextResponse } from "next/server";
import { creerClientServeur } from "@/lib/supabase/server";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { BUCKET_SIGNATURES } from "@/lib/signature/produire";

export const runtime = "nodejs";

// Aperçu de SA propre signature, et seulement de la sienne (la ligne du
// spécimen n'est lisible que par son titulaire). L'image n'est jamais
// téléchargeable depuis le stockage.
export async function GET() {
  const supabase = await creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse(null, { status: 401 });
  const { data } = await supabase.from("specimens_signature").select("chemin").eq("profil_id", user.id).maybeSingle();
  if (!data) return new NextResponse(null, { status: 404 });
  const { data: image } = await creerClientAdmin().storage.from(BUCKET_SIGNATURES).download(data.chemin);
  if (!image) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(await image.arrayBuffer()), {
    headers: { "Content-Type": "image/png", "Cache-Control": "private, no-store" },
  });
}
