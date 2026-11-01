import Link from "next/link";
import { notFound } from "next/navigation";
import { Alerte, Puce, boutonDiscret, boutonPrincipal, carte, champ } from "@/components/courrier/Alerte";
import { CARACTERES, en, STATUTS_COURRIER } from "@/lib/courrier/constantes";
import { contexteCourrier } from "@/lib/courrier/contexte";
import { formaterDate } from "@/lib/courrier/format";
import { traducteurDepartements, traductionServeur } from "@/lib/i18n/serveur";
import { creerClientServeur } from "@/lib/supabase/server";

type Props = { searchParams: Promise<{ q?: string; statut?: string; debut?: string; fin?: string }> };

type Ligne = { id: string; numero: string; recu_le: string; expediteur: string; reference_expediteur: string | null; objet: string | null; caractere: string; statut: string; departement: string };
const date = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");

export default async function Registre({ searchParams }: Props) {
  const { q = "", statut = "", debut: d = "", fin: f = "" } = await searchParams;
  const ctx = await contexteCourrier();
  if (!ctx?.role) notFound();
  const { t, langue } = await traductionServeur();
  const dep = await traducteurDepartements();
  const debut = date(d);
  const fin = date(f);
  // Caractères qui casseraient le filtre de recherche : retirés.
  const recherche = q.replace(/[,()%*\\"']/g, " ").trim().slice(0, 80);

  const supabase = await creerClientServeur();
  let requete = supabase.from("courriers").select("id, numero, recu_le, expediteur, reference_expediteur, objet, caractere, statut, departement").order("recu_le", { ascending: false }).limit(200);
  if (recherche) requete = requete.or(`numero.ilike.%${recherche}%,expediteur.ilike.%${recherche}%,reference_expediteur.ilike.%${recherche}%,objet.ilike.%${recherche}%`);
  if (statut in STATUTS_COURRIER) requete = requete.eq("statut", statut);
  if (debut) requete = requete.gte("recu_le", `${debut}T00:00:00+01:00`);
  if (fin) requete = requete.lte("recu_le", `${fin}T23:59:59+01:00`);
  const { data, error } = await requete.returns<Ligne[]>();
  const lignes = data ?? [];
  const parametres = new URLSearchParams({ ...(debut ? { debut } : {}), ...(fin ? { fin } : {}) }).toString();
  const th = "px-4 py-3 font-medium";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-paper-muted">
          {t(
            "Tous les plis arrivés, du plus récent au plus ancien. Rien ne se supprime : une erreur s'annule ou se corrige avec un motif.",
            "All incoming mail, newest first. Nothing is deleted: a mistake is cancelled or corrected with a reason."
          )}
        </p>
        <Link href="/courrier/nouveau" className={boutonPrincipal}>{t("Enregistrer un courrier", "Register mail")}</Link>
      </div>

      <form action="/courrier/registre" className="mt-4 grid gap-3 sm:grid-cols-5">
        <div className="sm:col-span-2">
          <label htmlFor="q" className="mb-1 block text-xs font-medium text-paper-muted">{t("Recherche (numéro, expéditeur, référence, objet)", "Search (number, sender, reference, subject)")}</label>
          <input id="q" name="q" defaultValue={recherche} className={champ} />
        </div>
        <div>
          <label htmlFor="statut" className="mb-1 block text-xs font-medium text-paper-muted">{t("Statut", "Status")}</label>
          <select id="statut" name="statut" defaultValue={statut} className={champ}>
            <option value="">{t("Tous", "All")}</option>
            {Object.entries(STATUTS_COURRIER).map(([k, v]) => <option key={k} value={k}>{en(v.libelle, langue)}</option>)}
          </select>
        </div>
        <div><label htmlFor="debut" className="mb-1 block text-xs font-medium text-paper-muted">{t("Du", "From")}</label><input id="debut" name="debut" type="date" defaultValue={debut} className={champ} /></div>
        <div><label htmlFor="fin" className="mb-1 block text-xs font-medium text-paper-muted">{t("Au", "To")}</label><input id="fin" name="fin" type="date" defaultValue={fin} className={champ} /></div>
        <div className="flex flex-wrap gap-3 sm:col-span-5">
          <button type="submit" className={boutonDiscret}>{t("Filtrer", "Filter")}</button>
          <a href={`/courrier/registre/export?format=pdf${parametres ? `&${parametres}` : ""}`} className={boutonDiscret}>{t("Exporter le registre (PDF)", "Export the register (PDF)")}</a>
          <a href={`/courrier/registre/export?format=xlsx${parametres ? `&${parametres}` : ""}`} className={boutonDiscret}>{t("Exporter le registre (Excel)", "Export the register (Excel)")}</a>
        </div>
      </form>

      {error && (
        <div className="mt-4"><Alerte type="erreur">{t("Le registre n'a pas pu être chargé. Réessayez dans un instant.", "The register could not be loaded. Try again in a moment.")}</Alerte></div>
      )}
      {lignes.length === 0 ? (
        <p className={`${carte} mt-6 p-8 text-center text-sm text-paper-muted`}>{t("Aucun courrier ne correspond.", "No mail matches.")}</p>
      ) : (
        <div className={`${carte} mt-6 overflow-x-auto`}>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-paper-50 text-paper-muted">
              <tr>
                <th scope="col" className={th}>{t("Numéro", "Number")}</th>
                <th scope="col" className={th}>{t("Reçu le", "Received")}</th>
                <th scope="col" className={th}>{t("Expéditeur", "Sender")}</th>
                <th scope="col" className={th}>{t("Objet", "Subject")}</th>
                <th scope="col" className={th}>{t("Destinataire", "Recipient")}</th>
                <th scope="col" className={th}>{t("Statut", "Status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-200">
              {lignes.map((c) => {
                const st = STATUTS_COURRIER[c.statut] ?? STATUTS_COURRIER.recu;
                const car = CARACTERES[c.caractere];
                return (
                  <tr key={c.id} className="hover:bg-paper-50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                      <Link href={`/courrier/${c.id}`} className="text-navy-900 underline underline-offset-4">{c.numero}</Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{formaterDate(c.recu_le, langue)}</td>
                    <td className="px-4 py-3">{c.expediteur}{c.reference_expediteur && <span className="block text-xs text-paper-muted">{c.reference_expediteur}</span>}</td>
                    <td className="px-4 py-3">{c.objet || (c.caractere === "personnel" ? <span className="italic text-paper-muted">{t("Pli personnel", "Personal envelope")}</span> : "—")}</td>
                    <td className="px-4 py-3">{dep(c.departement)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Puce classe={st.classe}>{en(st.libelle, langue)}</Puce>
                      {c.caractere !== "ordinaire" && car && <span className="ml-1"><Puce classe={car.classe}>{en(car.libelle, langue)}</Puce></span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {lignes.length === 200 && (
        <p className="mt-3 text-xs text-paper-muted">{t("Les 200 courriers les plus récents sont affichés : affinez la recherche ou exportez le registre.", "The 200 most recent items are shown: refine the search or export the register.")}</p>
      )}
    </div>
  );
}
