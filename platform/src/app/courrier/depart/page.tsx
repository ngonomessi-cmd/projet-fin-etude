import Link from "next/link";
import { Alerte, Puce, boutonDiscret, boutonPrincipal, carte, champ } from "@/components/courrier/Alerte";
import { en, MODES_ENVOI, STATUTS_DEPART } from "@/lib/courrier/constantes";
import { contexteCourrier } from "@/lib/courrier/contexte";
import { formaterDate } from "@/lib/courrier/format";
import { traducteurDepartements, traductionServeur } from "@/lib/i18n/serveur";
import { creerClientServeur } from "@/lib/supabase/server";

type Props = { searchParams: Promise<{ q?: string; statut?: string; debut?: string; fin?: string }> };

type Ligne = {
  id: string; numero: string | null; statut: string; objet: string; mode_envoi: string; urgent: boolean; ar_demande: boolean;
  demande_le: string; enregistre_le: string | null; expedie_le: string | null; relance_le: string | null; departement: string;
};
const date = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");

export default async function Departs({ searchParams }: Props) {
  const { q = "", statut = "", debut: d = "", fin: f = "" } = await searchParams;
  const ctx = await contexteCourrier();
  if (!ctx) return null;
  const { t, langue } = await traductionServeur();
  const dep = await traducteurDepartements();
  const service = ctx.role != null;
  const debut = date(d);
  const fin = date(f);
  const recherche = q.replace(/[,()%*\\"']/g, " ").trim().slice(0, 80);

  const supabase = await creerClientServeur();
  let requete = supabase.from("departs")
    .select("id, numero, statut, objet, mode_envoi, urgent, ar_demande, demande_le, enregistre_le, expedie_le, relance_le, departement")
    .order("demande_le", { ascending: false }).limit(200);
  if (recherche) requete = requete.or(`numero.ilike.%${recherche}%,objet.ilike.%${recherche}%`);
  if (statut in STATUTS_DEPART) requete = requete.eq("statut", statut);
  if (debut) requete = requete.gte("demande_le", `${debut}T00:00:00+01:00`);
  if (fin) requete = requete.lte("demande_le", `${fin}T23:59:59+01:00`);
  const { data, error } = await requete.returns<Ligne[]>();
  const lignes = data ?? [];
  const demandes = lignes.filter((l) => l.statut === "demande");
  const aExpedier = lignes.filter((l) => l.statut === "enregistre");
  const aujourdhui = new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 10);
  const enRelance = (l: Ligne) => l.statut === "expedie" && l.ar_demande && l.relance_le !== null && l.relance_le <= aujourdhui;
  const parametres = new URLSearchParams({ ...(debut ? { debut } : {}), ...(fin ? { fin } : {}) }).toString();
  const th = "px-4 py-3 font-medium";

  const ligne = (l: Ligne) => {
    const st = STATUTS_DEPART[l.statut] ?? STATUTS_DEPART.demande;
    return (
      <tr key={l.id} className="hover:bg-paper-50">
        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
          <Link href={`/courrier/depart/${l.id}`} className="text-navy-900 underline underline-offset-4">{l.numero ?? t("Demande", "Request")}</Link>
        </td>
        <td className="whitespace-nowrap px-4 py-3">{formaterDate(l.enregistre_le ?? l.demande_le, langue)}</td>
        <td className="px-4 py-3">{l.objet}{l.urgent && <span className="ml-2"><Puce classe="bg-amber-100 text-amber-900">{t("Urgent", "Urgent")}</Puce></span>}</td>
        <td className="px-4 py-3">{dep(l.departement)}</td>
        <td className="whitespace-nowrap px-4 py-3">{en(MODES_ENVOI[l.mode_envoi] ?? [l.mode_envoi, l.mode_envoi], langue)}</td>
        <td className="whitespace-nowrap px-4 py-3">
          <Puce classe={st.classe}>{en(st.libelle, langue)}</Puce>
          {enRelance(l) && <span className="ml-1"><Puce classe="bg-red-100 text-red-900">{t("Relance", "Reminder")}</Puce></span>}
        </td>
      </tr>
    );
  };
  const tete = (
    <thead className="bg-paper-50 text-paper-muted">
      <tr>
        <th scope="col" className={th}>{t("Numéro", "Number")}</th><th scope="col" className={th}>{t("Date", "Date")}</th><th scope="col" className={th}>{t("Objet", "Subject")}</th>
        <th scope="col" className={th}>{t("Département émetteur", "Sending department")}</th><th scope="col" className={th}>{t("Envoi", "Dispatch")}</th><th scope="col" className={th}>{t("Statut", "Status")}</th>
      </tr>
    </thead>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-3xl text-sm text-paper-muted">
          {service
            ? t(
                "Les lettres qui partent de l'Agence : demandes d'expédition à traiter, départs à expédier, accusés de réception à obtenir.",
                "Letters leaving the Agency: dispatch requests to process, mail to send, acknowledgements of receipt to obtain."
              )
            : t(
                "Les lettres que vous avez fait expédier, ou celles de votre département. Pour faire expédier un document, ouvrez-le (il doit être validé) puis cliquez sur « Transmettre au service du courrier ».",
                "Letters you have had sent, or those of your department. To have a document sent, open it (it must be validated) then click “Pass to the mail service”."
              )}
        </p>
        {service && <Link href="/courrier/depart/nouveau" className={boutonPrincipal}>{t("Enregistrer un départ", "Register outgoing mail")}</Link>}
      </div>

      {error && <div className="mt-4"><Alerte type="erreur">{t("Les départs n'ont pas pu être chargés. Réessayez dans un instant.", "Outgoing mail could not be loaded. Try again in a moment.")}</Alerte></div>}

      {service && demandes.length > 0 && (
        <section className="mt-6" aria-labelledby="titre-demandes">
          <h2 id="titre-demandes" className="font-serif text-base font-semibold">
            {t("Demandes d'expédition à traiter", "Dispatch requests to process")} <span className="rounded-full bg-gold-500 px-2 text-sm font-semibold text-navy-950">{demandes.length}</span>
          </h2>
          <div className="mt-2 overflow-x-auto rounded-lg border border-gold-500/60 bg-amber-50/50"><table className="min-w-full text-left text-sm">{tete}<tbody className="divide-y divide-paper-200">{demandes.map(ligne)}</tbody></table></div>
        </section>
      )}

      {service && aExpedier.length > 0 && (
        <section className="mt-6" aria-labelledby="titre-expedier">
          <h2 id="titre-expedier" className="font-serif text-base font-semibold">{t("À expédier", "To be sent")}</h2>
          <form action="/courrier/depart/bordereau" className="mt-2">
            <ul className={`${carte} divide-y divide-paper-200 overflow-hidden`}>
              {aExpedier.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <input type="checkbox" name="ids" value={l.id} id={`b-${l.id}`} defaultChecked aria-label={`${t("Inclure", "Include")} ${l.numero} ${t("dans le bordereau", "in the dispatch sheet")}`} />
                  <label htmlFor={`b-${l.id}`} className="font-mono text-xs">{l.numero}</label>
                  <Link href={`/courrier/depart/${l.id}`} className="flex-1 truncate text-navy-900 underline underline-offset-4">{l.objet}</Link>
                  <span className="text-xs text-paper-muted">{en(MODES_ENVOI[l.mode_envoi] ?? [l.mode_envoi, l.mode_envoi], langue)}</span>
                </li>
              ))}
            </ul>
            <button type="submit" className={`${boutonDiscret} mt-2`}>{t("Imprimer le bordereau d'envoi des plis cochés (PDF)", "Print the dispatch sheet for the ticked items (PDF)")}</button>
          </form>
        </section>
      )}

      <form action="/courrier/depart" className="mt-6 grid gap-3 sm:grid-cols-5">
        <div className="sm:col-span-2">
          <label htmlFor="q" className="mb-1 block text-xs font-medium text-paper-muted">{t("Recherche (numéro, objet)", "Search (number, subject)")}</label>
          <input id="q" name="q" defaultValue={recherche} className={champ} />
        </div>
        <div>
          <label htmlFor="statut" className="mb-1 block text-xs font-medium text-paper-muted">{t("Statut", "Status")}</label>
          <select id="statut" name="statut" defaultValue={statut} className={champ}>
            <option value="">{t("Tous", "All")}</option>
            {Object.entries(STATUTS_DEPART).map(([k, v]) => <option key={k} value={k}>{en(v.libelle, langue)}</option>)}
          </select>
        </div>
        <div><label htmlFor="debut" className="mb-1 block text-xs font-medium text-paper-muted">{t("Du", "From")}</label><input id="debut" name="debut" type="date" defaultValue={debut} className={champ} /></div>
        <div><label htmlFor="fin" className="mb-1 block text-xs font-medium text-paper-muted">{t("Au", "To")}</label><input id="fin" name="fin" type="date" defaultValue={fin} className={champ} /></div>
        <div className="flex flex-wrap gap-3 sm:col-span-5">
          <button type="submit" className={boutonDiscret}>{t("Filtrer", "Filter")}</button>
          {service && (
            <>
              <a href={`/courrier/depart/export?format=pdf${parametres ? `&${parametres}` : ""}`} className={boutonDiscret}>{t("Exporter le registre (PDF)", "Export the register (PDF)")}</a>
              <a href={`/courrier/depart/export?format=xlsx${parametres ? `&${parametres}` : ""}`} className={boutonDiscret}>{t("Exporter le registre (Excel)", "Export the register (Excel)")}</a>
            </>
          )}
        </div>
      </form>

      {lignes.length === 0 ? (
        <p className={`${carte} mt-6 p-8 text-center text-sm text-paper-muted`}>{t("Aucun départ ne correspond.", "No outgoing mail matches.")}</p>
      ) : (
        <div className={`${carte} mt-6 overflow-x-auto`}><table className="min-w-full text-left text-sm">{tete}<tbody className="divide-y divide-paper-200">{lignes.map(ligne)}</tbody></table></div>
      )}
      {lignes.length === 200 && <p className="mt-3 text-xs text-paper-muted">{t("Les 200 départs les plus récents sont affichés : affinez la recherche.", "The 200 most recent items are shown: refine the search.")}</p>}
    </div>
  );
}
