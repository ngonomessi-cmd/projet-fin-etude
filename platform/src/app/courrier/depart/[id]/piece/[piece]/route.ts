import { UUID } from "@/lib/courrier/constantes";
import { creerClientServeur } from "@/lib/supabase/server";

// Téléchargement d'une pièce de départ : droits vérifiés par la RLS, puis adresse signée d'une minute.
export async function GET(_requete: Request, { params }: { params: Promise<{ id: string; piece: string }> }) {
  const { id, piece } = await params;
  if (!UUID.test(id) || !UUID.test(piece)) return new Response("Introuvable", { status: 404 });
  const supabase = await creerClientServeur();
  const { data: p } = await supabase.from("depart_pieces").select("chemin_fichier, nom_fichier").eq("id", piece).eq("depart_id", id)
    .maybeSingle<{ chemin_fichier: string; nom_fichier: string }>();
  if (!p) return new Response("Introuvable", { status: 404 });
  const { data, error } = await supabase.storage.from("courrier").createSignedUrl(p.chemin_fichier, 60, { download: p.nom_fichier });
  if (error || !data) return new Response("Fichier indisponible", { status: 404 });
  return new Response(null, { status: 302, headers: { Location: data.signedUrl, "Cache-Control": "no-store" } });
}
