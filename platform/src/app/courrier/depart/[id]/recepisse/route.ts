import { nomDeFichier } from "@/lib/atelier/exporter";
import { UUID } from "@/lib/courrier/constantes";
import { contexteCourrier } from "@/lib/courrier/contexte";
import { genererRecepisseDepart } from "@/lib/courrier/pdf";
import { traducteurDepartements, traductionServeur } from "@/lib/i18n/serveur";
import { creerClientServeur } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const introuvable = () => new Response("Introuvable", { status: 404, headers: { "Cache-Control": "no-store" } });

// Récépissé d'envoi : toute personne qui peut lire le départ (RLS), une fois le numéro attribué.
export async function GET(_requete: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return introuvable();
  const ctx = await contexteCourrier();
  if (!ctx) return introuvable();
  const { langue } = await traductionServeur();
  const dep = await traducteurDepartements();
  const supabase = await creerClientServeur();
  const { data: d } = await supabase.from("departs").select("*").eq("id", id).maybeSingle<{
    numero: string | null; objet: string; departement: string; demandeur_id: string; mode_envoi: string; nb_pieces: number; urgent: boolean;
    demande_le: string; enregistre_le: string | null; expedie_le: string | null; statut: string; signature_numero: string | null; courrier_arrivee_id: string | null;
  }>();
  if (!d || !d.numero) return introuvable();
  const [{ data: dests }, { data: demandeur }, { data: arrivee }] = await Promise.all([
    supabase.from("depart_destinataires").select("nom, adresse, role, statut, accuse_le").eq("depart_id", id).order("ordre")
      .returns<{ nom: string; adresse: string | null; role: string; statut: string; accuse_le: string | null }[]>(),
    supabase.from("profiles").select("nom_complet").eq("id", d.demandeur_id).maybeSingle<{ nom_complet: string }>(),
    d.courrier_arrivee_id ? supabase.from("courriers").select("numero").eq("id", d.courrier_arrivee_id).maybeSingle<{ numero: string }>() : Promise.resolve({ data: null }),
  ]);
  const pdf = await genererRecepisseDepart(
    {
      numero: d.numero, objet: d.objet, departement: d.departement, demandeur: demandeur?.nom_complet ?? "—", mode: d.mode_envoi, nbPieces: d.nb_pieces, urgent: d.urgent,
      demandeLe: d.demande_le, enregistreLe: d.enregistre_le, expedieLe: d.expedie_le, statut: d.statut, signature: d.signature_numero, reponseA: arrivee?.numero ?? null,
      destinataires: (dests ?? []).map((x) => ({ nom: x.nom, adresse: x.adresse, role: x.role, statut: x.statut, accuseLe: x.accuse_le })),
    },
    langue,
    dep
  );
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nomDeFichier(`Recepisse envoi ${d.numero}`, "pdf")}"`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
