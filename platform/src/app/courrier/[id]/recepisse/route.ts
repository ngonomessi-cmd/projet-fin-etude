import { MODES, NATURES, UUID, en } from "@/lib/courrier/constantes";
import { contexteCourrier } from "@/lib/courrier/contexte";
import { genererRecepisse } from "@/lib/courrier/pdf";
import { nomDeFichier } from "@/lib/atelier/exporter";
import { traducteurDepartements, traductionServeur } from "@/lib/i18n/serveur";
import { creerClientServeur } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const introuvable = () => new Response("Introuvable", { status: 404, headers: { "Cache-Control": "no-store" } });

// Récépissé de dépôt : réservé au service du courrier (lecture sous la RLS, aucune clé de service).
export async function GET(_requete: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return introuvable();
  const ctx = await contexteCourrier();
  if (!ctx?.role) return introuvable();
  const { langue } = await traductionServeur();
  const dep = await traducteurDepartements();
  const supabase = await creerClientServeur();
  const { data: c } = await supabase
    .from("courriers")
    .select("numero, code_suivi, recu_le, expediteur, reference_expediteur, nature, mode_reception, nb_pieces, departement, destinataire_id, caractere, enregistre_par")
    .eq("id", id)
    .maybeSingle<{ numero: string; code_suivi: string; recu_le: string; expediteur: string; reference_expediteur: string | null; nature: string; mode_reception: string; nb_pieces: number; departement: string; destinataire_id: string | null; caractere: string; enregistre_par: string }>();
  if (!c) return introuvable();
  const { data: profils } = await supabase
    .from("profiles")
    .select("id, nom_complet")
    .in("id", [c.enregistre_par, ...(c.destinataire_id ? [c.destinataire_id] : [])])
    .returns<{ id: string; nom_complet: string }[]>();
  const nom = (pid: string | null) => (pid ? profils?.find((p) => p.id === pid)?.nom_complet || null : null);
  const pdf = await genererRecepisse(
    {
      numero: c.numero, codeSuivi: c.code_suivi, recuLe: c.recu_le, expediteur: c.expediteur, reference: c.reference_expediteur,
      nature: en(NATURES[c.nature] ?? [c.nature, c.nature], langue), mode: en(MODES[c.mode_reception] ?? [c.mode_reception, c.mode_reception], langue),
      nbPieces: c.nb_pieces, departement: dep(c.departement), destinataire: nom(c.destinataire_id), caractere: c.caractere,
      agent: nom(c.enregistre_par) ?? (langue === "en" ? "Mail service" : "Service du courrier"),
    },
    langue
  );
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nomDeFichier(`Recepisse ${c.numero}`, "pdf")}"`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
