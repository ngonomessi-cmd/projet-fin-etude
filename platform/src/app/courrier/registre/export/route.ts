import { nomDeFichier } from "@/lib/atelier/exporter";
import { CARACTERES, en, MODES, NATURES, STATUTS_COURRIER } from "@/lib/courrier/constantes";
import { contexteCourrier } from "@/lib/courrier/contexte";
import { formaterDate } from "@/lib/courrier/format";
import { genererRegistrePdf, type LigneRegistre } from "@/lib/courrier/pdf";
import { genererXlsxFeuille, sur } from "@/lib/courrier/tableur";
import { traducteurDepartements, traductionServeur } from "@/lib/i18n/serveur";
import { nomOrganisation } from "@/lib/organisation";
import { creerClientServeur } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Export du registre (PDF ou Excel). Fonction de la base : réservée au service du courrier, et chaque
// export est inscrit au journal d'audit.

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
  const { data, error } = await supabase.rpc("registre_courrier", { p_debut: debut, p_fin: fin });
  if (error) return introuvable();
  const lignes = (data ?? []) as LigneRegistre[];

  const periode = debut || fin ? ` ${t("du", "from")} ${debut ?? t("début", "start")} ${t("au", "to")} ${fin ?? t("ce jour", "today")}` : "";
  const titre = `${t("Registre du courrier arrivée", "Incoming mail register")}${periode}`;
  const entetesHttp = (type: string, nom: string, taille: number) => ({
    "Content-Type": type,
    "Content-Disposition": `attachment; filename="${nom}"; filename*=UTF-8''${encodeURIComponent(nom)}`,
    "Content-Length": String(taille),
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
  });

  if (!xlsx) {
    const pdf = await genererRegistrePdf(lignes, titre, ctx.profil.nom_complet, langue, dep);
    return new Response(new Uint8Array(pdf), { headers: entetesHttp("application/pdf", nomDeFichier(titre, "pdf"), pdf.length) });
  }

  const classeur = await genererXlsxFeuille({
    organisation: nomOrganisation(langue),
    titre,
    feuille: t("Registre", "Register"),
    entetes: [t("Numéro", "Number"), t("Reçu le", "Received"), t("Expéditeur", "Sender"), t("Référence", "Reference"), t("Date lettre", "Letter date"), t("Réception", "Receipt"), t("Nature", "Type"), t("Pièces", "Items"), t("Objet", "Subject"), t("Caractère", "Type"), t("Département", "Department"), t("Destinataire", "Recipient"), t("Statut", "Status"), t("Décharge", "Receipt")],
    largeurs: [18, 12, 30, 18, 12, 14, 12, 8, 34, 16, 28, 24, 12, 18],
    lignes: lignes.map((l) => [
      l.numero, formaterDate(l.recu_le, langue), sur(l.expediteur), sur(l.reference_expediteur), formaterDate(l.date_lettre, langue),
      en(MODES[l.mode_reception] ?? [l.mode_reception, l.mode_reception], langue), en(NATURES[l.nature] ?? [l.nature, l.nature], langue), String(l.nb_pieces),
      sur(l.objet), en(CARACTERES[l.caractere]?.libelle ?? [l.caractere, l.caractere], langue), sur(dep(l.departement)), sur(l.destinataire),
      en(STATUTS_COURRIER[l.statut]?.libelle ?? [l.statut, l.statut], langue),
      l.decharge_le ? `${formaterDate(l.decharge_le, langue)} (${l.decharge_mode === "papier" ? t("papier", "paper") : t("appli", "app")})` : "",
    ]),
  });
  return new Response(new Uint8Array(classeur), {
    headers: entetesHttp("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", nomDeFichier(titre, "xlsx"), classeur.length),
  });
}
