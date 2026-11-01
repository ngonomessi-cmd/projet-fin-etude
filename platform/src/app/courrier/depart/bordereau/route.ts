import { nomDeFichier } from "@/lib/atelier/exporter";
import { UUID } from "@/lib/courrier/constantes";
import { contexteCourrier } from "@/lib/courrier/contexte";
import { genererBordereau, type LigneBordereau } from "@/lib/courrier/pdf";
import { traductionServeur } from "@/lib/i18n/serveur";
import { creerClientServeur } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const introuvable = () => new Response("Introuvable", { status: 404, headers: { "Cache-Control": "no-store" } });

type Depart = { id: string; numero: string; objet: string; mode_envoi: string; nb_pieces: number; urgent: boolean; enregistre_le: string };
type Destinataire = { depart_id: string; nom: string; adresse: string | null; ordre: number };

// Bordereau d'envoi : feuille à faire signer au coursier (ou au destinataire) pour les plis cochés.
// Service du courrier uniquement ; seuls les départs enregistrés ou expédiés y figurent.
export async function GET(requete: Request) {
  const ids = [...new Set(new URL(requete.url).searchParams.getAll("ids"))].filter((i) => UUID.test(i)).slice(0, 200);
  const ctx = await contexteCourrier();
  if (!ctx?.role || ids.length === 0) return introuvable();
  const { langue, t } = await traductionServeur();
  const supabase = await creerClientServeur();
  const { data: departs } = await supabase.from("departs")
    .select("id, numero, objet, mode_envoi, nb_pieces, urgent, enregistre_le")
    .in("id", ids).in("statut", ["enregistre", "expedie", "accuse"])
    .order("enregistre_le")
    .returns<Depart[]>();
  if (!departs?.length) return introuvable();
  const { data: dests } = await supabase.from("depart_destinataires")
    .select("depart_id, nom, adresse, ordre")
    .in("depart_id", departs.map((d) => d.id)).eq("role", "destinataire").order("ordre")
    .returns<Destinataire[]>();

  const lignes: LigneBordereau[] = [];
  for (const d of departs) {
    for (const x of (dests ?? []).filter((y) => y.depart_id === d.id)) {
      lignes.push({ numero: d.numero, objet: d.objet, destinataire: x.nom, adresse: x.adresse, mode: d.mode_envoi, nbPieces: d.nb_pieces, urgent: d.urgent });
    }
  }
  const pdf = await genererBordereau(lignes, t("Bordereau d'envoi du courrier départ", "Outgoing mail dispatch sheet"), ctx.profil.nom_complet, langue);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nomDeFichier("Bordereau d'envoi", "pdf")}"`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
