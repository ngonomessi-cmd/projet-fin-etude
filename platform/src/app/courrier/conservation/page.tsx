import Link from "next/link";
import { notFound } from "next/navigation";
import { Alerte, boutonPrincipal, carte, champ } from "@/components/courrier/Alerte";
import { en, MESSAGES_CONSERVATION_ERREUR, MESSAGES_CONSERVATION_OK } from "@/lib/courrier/constantes";
import { contexteCourrier } from "@/lib/courrier/contexte";
import { formaterDate } from "@/lib/courrier/format";
import { traductionServeur } from "@/lib/i18n/serveur";
import { creerClientServeur } from "@/lib/supabase/server";
import { validerSortFinal } from "./actions";

export const dynamic = "force-dynamic";

type Proposition = { type: "courrier" | "depart"; id: string; numero: string; objet: string; categorie: string; categorie_libelle: string; sort_final: string; echeance: string; nb_pieces: number };
type Props = { searchParams: Promise<{ ok?: string; erreur?: string }> };

// Éléments arrivés à échéance : le système PROPOSE, le chef du courrier VALIDE. Détruire = supprimer les
// scans ; la ligne du registre (numéro, date, objet) est conservée sans limite.
export default async function Conservation({ searchParams }: Props) {
  const { ok, erreur } = await searchParams;
  const ctx = await contexteCourrier();
  if (ctx?.role !== "chef") notFound();
  const { t, langue } = await traductionServeur();
  const supabase = await creerClientServeur();
  const { data, error } = await supabase.rpc("propositions_conservation");
  const lignes = (data ?? []) as Proposition[];

  const groupes = [
    { cle: "courrier-destruction", type: "courrier", sort: "destruction", titre: t("Courrier arrivé : scans à détruire", "Incoming mail: scans to destroy"), bouton: t("Valider la destruction des scans cochés", "Validate destruction of the ticked scans") },
    { cle: "courrier-versement", type: "courrier", sort: "versement", titre: t("Courrier arrivé : à verser aux archives", "Incoming mail: to transfer to the archives"), bouton: t("Enregistrer le versement des éléments cochés", "Record the transfer of the ticked items") },
    { cle: "depart-destruction", type: "depart", sort: "destruction", titre: t("Courrier départ : scans à détruire", "Outgoing mail: scans to destroy"), bouton: t("Valider la destruction des scans cochés", "Validate destruction of the ticked scans") },
    { cle: "depart-versement", type: "depart", sort: "versement", titre: t("Courrier départ : à verser aux archives", "Outgoing mail: to transfer to the archives"), bouton: t("Enregistrer le versement des éléments cochés", "Record the transfer of the ticked items") },
  ] as const;

  return (
    <div>
      <h2 className="font-serif text-xl font-semibold">{t("Conservation du courrier", "Mail retention")}</h2>
      <p className="mt-1 max-w-3xl text-sm text-paper-muted">
        {t(
          "Éléments arrivés à échéance selon leur catégorie. Rien n'est détruit automatiquement : vous validez, avec la référence de la décision (procès-verbal de destruction, bordereau de versement). Les scans détruits ne se récupèrent pas ; la ligne du registre reste. Un élément gelé (enquête, contentieux, audit) n'apparaît pas ici.",
          "Items that have reached their deadline according to their category. Nothing is destroyed automatically: you validate, with the reference of the decision (destruction minutes, transfer slip). Destroyed scans cannot be recovered; the register line stays. A frozen item (investigation, litigation, audit) does not appear here."
        )}
      </p>
      <div className="mt-4 space-y-3">
        {ok && ok in MESSAGES_CONSERVATION_OK && <Alerte type="ok">{en(MESSAGES_CONSERVATION_OK[ok], langue)}</Alerte>}
        {erreur && <Alerte type="erreur">{en(MESSAGES_CONSERVATION_ERREUR[erreur] ?? MESSAGES_CONSERVATION_ERREUR.generique, langue)}</Alerte>}
        {error && <Alerte type="erreur">{t("Les propositions n'ont pas pu être chargées.", "The proposals could not be loaded.")}</Alerte>}
      </div>

      {lignes.length === 0 && !error && (
        <p className={`${carte} mt-6 p-8 text-center text-paper-muted`}>{t("Aucun élément n'est arrivé à échéance.", "No item has reached its deadline.")}</p>
      )}

      {groupes.map((g) => {
        const items = lignes.filter((l) => l.type === g.type && l.sort_final === g.sort);
        if (items.length === 0) return null;
        return (
          <section key={g.cle} className="mt-8" aria-labelledby={`titre-${g.cle}`}>
            <h3 id={`titre-${g.cle}`} className="font-serif text-base font-semibold">
              {g.titre} <span className="rounded-full bg-gold-500 px-2 text-sm font-semibold text-navy-950">{items.length}</span>
            </h3>
            <form action={validerSortFinal} className="mt-3 space-y-3">
              <input type="hidden" name="type" value={g.type} />
              <input type="hidden" name="sort" value={g.sort} />
              <ul className={`${carte} divide-y divide-paper-200 overflow-hidden`}>
                {items.map((l) => (
                  <li key={l.id} className="flex items-start gap-3 px-4 py-3 text-sm">
                    <input type="checkbox" name="ids" value={l.id} id={`c-${l.id}`} aria-label={`${t("Inclure", "Include")} ${l.numero}`} className="mt-1" />
                    <label htmlFor={`c-${l.id}`} className="min-w-0 flex-1">
                      <span className="font-mono text-xs">{l.numero}</span> — {l.objet}
                      <span className="block text-xs text-paper-muted">
                        {l.categorie_libelle} · {t("échu le", "due on")} {formaterDate(l.echeance, langue)}
                        {g.sort === "destruction" ? ` · ${l.nb_pieces} scan${l.nb_pieces > 1 ? "s" : ""}` : ""}
                      </span>
                    </label>
                    <Link href={g.type === "depart" ? `/courrier/depart/${l.id}#conservation` : `/courrier/${l.id}#conservation`} className="shrink-0 text-xs text-navy-900 underline underline-offset-4">
                      {t("Voir la fiche", "View the record")}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-64 flex-1">
                  <label htmlFor={`motif-${g.cle}`} className="mb-1 block text-xs font-medium text-paper-muted">{t("Référence de la décision (obligatoire)", "Decision reference (required)")}</label>
                  <input
                    id={`motif-${g.cle}`}
                    name="motif"
                    required
                    minLength={5}
                    maxLength={500}
                    className={champ}
                    placeholder={g.sort === "destruction" ? t("Procès-verbal de destruction n° …", "Destruction minutes no. …") : t("Bordereau de versement n° …", "Transfer slip no. …")}
                  />
                </div>
                <button type="submit" className={boutonPrincipal}>{g.bouton}</button>
              </div>
            </form>
          </section>
        );
      })}
    </div>
  );
}
