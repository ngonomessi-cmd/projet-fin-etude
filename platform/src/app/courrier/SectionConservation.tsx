import { boutonDiscret, carte, champ } from "@/components/courrier/Alerte";
import type { CategorieConservation } from "@/lib/courrier/constantes";
import { formaterDateHeure } from "@/lib/courrier/format";
import { traductionServeur } from "@/lib/i18n/serveur";
import { classerConservation, degelerConservation, gelerConservation } from "./conservation/actions";

type Props = {
  type: "courrier" | "depart";
  id: string;
  categorie: string;
  conservationAnnees: number | null;
  geleLe: string | null;
  gelMotif: string | null;
  sortFinalLe: string | null;
  categories: CategorieConservation[];
  /** Agent ou chef du courrier : classe. */
  service: boolean;
  /** Chef du courrier : gèle et dégèle. */
  chef: boolean;
};

// Conservation d'un courrier ou d'un départ : catégorie, durée, gel. Réservé au service du courrier.
export async function SectionConservation({ type, id, categorie, conservationAnnees, geleLe, gelMotif, sortFinalLe, categories, service, chef }: Props) {
  if (!service) return null;
  const { t, langue } = await traductionServeur();
  const cat = categories.find((c) => c.code === categorie);
  const duree = conservationAnnees ?? cat?.duree_annees ?? null;
  const verrouille = Boolean(geleLe || sortFinalLe);
  return (
    <section id="conservation" className="mt-8" aria-labelledby="titre-conservation">
      <h2 id="titre-conservation" className="font-serif text-lg font-semibold">{t("Conservation", "Retention")}</h2>
      <div className={`${carte} mt-3 space-y-3 p-5 text-sm`}>
        <p>
          <strong className="font-medium">{cat?.libelle ?? categorie}</strong> ·{" "}
          {duree ? t(`${duree} an${duree > 1 ? "s" : ""} après le dernier mouvement`, `${duree} year${duree > 1 ? "s" : ""} after the last movement`) : t("durée illimitée", "unlimited period")} ·{" "}
          {cat?.sort_final === "versement" ? t("versement aux archives", "transfer to the archives") : t("destruction des scans sur validation", "scans destroyed once validated")}
        </p>
        {sortFinalLe && (
          <p className="text-paper-muted">
            {t("Sort final enregistré le", "Final outcome recorded on")} {formaterDateHeure(sortFinalLe, langue)}.
          </p>
        )}
        {geleLe && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-amber-900">
            <strong className="font-semibold">{t("Gelé", "Frozen")}</strong> {t("depuis le", "since")} {formaterDateHeure(geleLe, langue)} : {gelMotif}
          </p>
        )}
        {!verrouille && (
          <form action={classerConservation} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="id" value={id} />
            <div className="min-w-56 flex-1">
              <label htmlFor="categorie-conservation" className="mb-1 block text-xs font-medium text-paper-muted">{t("Catégorie", "Category")}</label>
              <select id="categorie-conservation" name="categorie" defaultValue={categorie} className={champ}>
                {categories.map((c) => <option key={c.code} value={c.code}>{c.libelle}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="duree-conservation" className="mb-1 block text-xs font-medium text-paper-muted">{t("Durée (si fixée pour cette pièce)", "Period (if set for this item)")}</label>
              <input id="duree-conservation" name="duree" type="number" min={1} max={100} defaultValue={conservationAnnees ?? ""} className={`${champ} !w-24`} />
            </div>
            <button type="submit" className={boutonDiscret}>{t("Classer", "Classify")}</button>
          </form>
        )}
        {chef && !sortFinalLe && (geleLe ? (
          <form action={degelerConservation}>
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="id" value={id} />
            <button type="submit" className={boutonDiscret}>{t("Lever le gel", "Lift the freeze")}</button>
          </form>
        ) : (
          <details>
            <summary className="cursor-pointer text-navy-900 underline underline-offset-4">
              {t("Geler la conservation (enquête, contentieux, audit)", "Freeze retention (investigation, litigation, audit)")}
            </summary>
            <form action={gelerConservation} className="mt-3 flex flex-wrap items-end gap-3">
              <input type="hidden" name="type" value={type} />
              <input type="hidden" name="id" value={id} />
              <div className="min-w-56 flex-1">
                <label htmlFor="motif-gel" className="mb-1 block text-xs font-medium text-paper-muted">{t("Motif", "Reason")}</label>
                <input id="motif-gel" name="motif" required minLength={5} maxLength={500} className={champ} />
              </div>
              <button type="submit" className={boutonDiscret}>{t("Geler", "Freeze")}</button>
            </form>
          </details>
        ))}
      </div>
    </section>
  );
}
