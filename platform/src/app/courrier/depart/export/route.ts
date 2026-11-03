import { nomDeFichier } from "@/lib/atelier/exporter";
import { en, MODES_ENVOI, STATUTS_DEPART } from "@/lib/courrier/constantes";
import { contexteCourrier } from "@/lib/courrier/contexte";
import { formaterDate } from "@/lib/courrier/format";
import { genererRegistreDepartPdf, type LigneRegistreDepart } from "@/lib/courrier/pdf";
import { genererXlsxFeuille, sur } from "@/lib/courrier/tableur";
import { traducteurDepartements, traductionServeur } from "@/lib/i18n/serveur";
import { nomOrganisation } from "@/lib/organisation";
import { creerClientServeur } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Export du registre des départs (PDF ou Excel). Fonction de la base : réservée au service du
// courrier, et chaque export est inscrit au journal d'audit.

const date = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const introuvable = () => new Response("Introuvable", { status: 404, headers: { "Cache-Control": "no-store" } });

export async function GET(requete: Request) {
  const url = new URL(requete.url);
  const xlsx = url.searchParams.get("format") === "xlsx";
  const debut = date(url.searchParams.get("debut"));
  const fin = date(url.searchParams.get("fin"));
  const ctx = await contexteCourrier();
  if (!ctx?.role) return introuvable();
  const { langue, t } = await traductionServeur();
  const dep = await traducteurDepartements();

  const supabase = await creerClientServeur();
  const { data, error } = await supabase.rpc("registre_depart", { p_debut: debut, p_fin: fin });
  if (error) return introuvable();
  const lignes = (data ?? []) as LigneRegistreDepart[];

  const periode = debut || fin ? ` ${t("du", "from")} ${debut ?? t("début", "start")} ${t("au", "to")} ${fin ?? t("ce jour", "today")}` : "";
  const titre = `${t("Registre du courrier départ", "Outgoing mail register")}${periode}`;
  const entetesHttp = (type: string, nom: string, taille: number) => ({
    "Content-Type": type,
    "Content-Disposition": `attachment; filename="${nom}"; filename*=UTF-8''${encodeURIComponent(nom)}`,
    "Content-Length": String(taille),
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
  });

  if (!xlsx) {
    const pdf = await genererRegistreDepartPdf(lignes, titre, ctx.profil.nom_complet, langue, dep);
    return new Response(new Uint8Array(pdf), { headers: entetesHttp("application/pdf", nomDeFichier(titre, "pdf"), pdf.length) });
  }

  const classeur = await genererXlsxFeuille({
    organisation: nomOrganisation(langue),
    titre,
    feuille: t("Départs", "Outgoing"),
    entetes: [t("Numéro", "Number"), t("Enregistré le", "Registered"), t("Expédié le", "Sent"), t("Destinataire(s)", "Recipient(s)"), t("Ampliations", "Copies"), t("Objet", "Subject"), t("Département", "Department"), t("Demandeur", "Requester"), t("Mode d'envoi", "Method"), t("Pièces", "Items"), t("Urgent", "Urgent"), t("Statut", "Status"), t("AR demandé", "Ack. requested"), t("Accusés", "Acks"), t("En réponse à", "In reply to"), t("Signature", "Signature"), t("Preuves de réception", "Proof of receipt")],
    largeurs: [18, 12, 12, 34, 28, 36, 26, 24, 16, 8, 8, 14, 10, 10, 18, 22, 30],
    lignes: lignes.map((l) => [
      l.numero, formaterDate(l.enregistre_le, langue), formaterDate(l.expedie_le, langue), sur(l.destinataires), sur(l.ampliations), sur(l.objet), sur(dep(l.departement)), sur(l.demandeur),
      en(MODES_ENVOI[l.mode_envoi] ?? [l.mode_envoi, l.mode_envoi], langue), String(l.nb_pieces), l.urgent ? t("oui", "yes") : "", en(STATUTS_DEPART[l.statut]?.libelle ?? [l.statut, l.statut], langue),
      l.ar_demande ? t("oui", "yes") : "", l.ar_demande ? (l.accuses ?? "") : "", l.reponse_a ?? "", l.signature_numero ?? "", l.preuves ?? "",
    ]),
  });
  return new Response(new Uint8Array(classeur), {
    headers: entetesHttp("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", nomDeFichier(titre, "xlsx"), classeur.length),
  });
}
