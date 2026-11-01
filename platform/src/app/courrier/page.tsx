import Link from "next/link";
import { Alerte, Puce, carte } from "@/components/courrier/Alerte";
import { ActualisationAuto } from "@/components/courrier/ActualisationAuto";
import { CARACTERES, en, STATUTS_COURRIER } from "@/lib/courrier/constantes";
import { contexteCourrier, nomsDesProfils } from "@/lib/courrier/contexte";
import { formaterDate } from "@/lib/courrier/format";
import { traducteurDepartements, traductionServeur } from "@/lib/i18n/serveur";
import { creerClientServeur } from "@/lib/supabase/server";

type Ligne = {
  id: string; numero: string; recu_le: string; expediteur: string; reference_expediteur: string | null; objet: string | null;
  caractere: string; statut: string; departement: string; destinataire_id: string | null; affecte_a: string | null;
  remise_declaree_le: string | null; echeance: string | null;
};
type Props = { searchParams: Promise<{ vue?: string }> };

export default async function MonCourrier({ searchParams }: Props) {
  const { vue = "a-retirer" } = await searchParams;
  const ctx = await contexteCourrier();
  if (!ctx) return null;
  const { t, langue } = await traductionServeur();
  const dep = await traducteurDepartements();
  const supabase = await creerClientServeur();

  const VUES = [
    { cle: "a-retirer", libelle: t("À retirer", "To collect") },
    { cle: "suivi", libelle: t("En cours", "In progress") },
    { cle: "classes", libelle: t("Classés", "Filed") },
    { cle: "tous", libelle: t("Tous", "All") },
  ];

  let requete = supabase
    .from("courriers")
    .select("id, numero, recu_le, expediteur, reference_expediteur, objet, caractere, statut, departement, destinataire_id, affecte_a, remise_declaree_le, echeance")
    .order("recu_le", { ascending: false })
    .limit(100);
  // Le service du courrier voit tout le registre ; « Mon courrier » se limite à ce qui lui est adressé ou imputé
  // — et, pour un validateur, au courrier ordinaire de son département (hors plis personnels).
  if (ctx.role) {
    const departement = ctx.profil.departement.replace(/["\\]/g, "");
    const parDepartement = ctx.profil.role === "validateur" && departement ? `,and(departement.eq."${departement}",caractere.neq.personnel)` : "";
    requete = requete.or(`destinataire_id.eq.${ctx.userId},affecte_a.eq.${ctx.userId}${parDepartement}`);
  }
  if (vue === "a-retirer") requete = requete.eq("statut", "recu");
  else if (vue === "suivi") requete = requete.in("statut", ["remis", "traite"]);
  else if (vue === "classes") requete = requete.in("statut", ["classe", "annule"]);
  const { data, error } = await requete.returns<Ligne[]>();
  const lignes = data ?? [];
  const noms = await nomsDesProfils(lignes.flatMap((l) => [l.destinataire_id, l.affecte_a]));

  return (
    <div>
      <ActualisationAuto secondes={30} />
      <p className="text-sm text-paper-muted">
        {t(
          "Le courrier physique qui vous est adressé, à vous ou à votre département. À son arrivée, le service du courrier l'enregistre sans l'ouvrir ; vous accusez réception à la remise.",
          "Physical mail addressed to you or to your department. On arrival, the mail service registers it without opening it; you acknowledge receipt on delivery."
        )}
      </p>
      <nav aria-label={t("Filtres", "Filters")} className="mt-4 flex flex-wrap gap-2 text-sm">
        {VUES.map((v) => (
          <Link
            key={v.cle}
            href={v.cle === "a-retirer" ? "/courrier" : `/courrier?vue=${v.cle}`}
            aria-current={vue === v.cle ? "page" : undefined}
            className={`rounded-full border px-3 py-1 ${vue === v.cle ? "border-gold-600 bg-gold-50 font-medium" : "border-paper-200 bg-white hover:border-gold-600"}`}
          >
            {v.libelle}
          </Link>
        ))}
      </nav>
      {error && (
        <div className="mt-4">
          <Alerte type="erreur">{t("Le courrier n'a pas pu être chargé. Réessayez dans un instant.", "The mail could not be loaded. Try again in a moment.")}</Alerte>
        </div>
      )}
      {lignes.length === 0 ? (
        <p className={`${carte} mt-6 p-8 text-center text-sm text-paper-muted`}>
          {vue === "a-retirer" ? t("Aucun courrier à retirer.", "No mail to collect.") : t("Aucun courrier.", "No mail.")}
        </p>
      ) : (
        <ul className={`${carte} mt-6 divide-y divide-paper-200 overflow-hidden`}>
          {lignes.map((c) => {
            const st = STATUTS_COURRIER[c.statut] ?? STATUTS_COURRIER.recu;
            const car = CARACTERES[c.caractere];
            return (
              <li key={c.id}>
                <Link href={`/courrier/${c.id}`} className={`block px-5 py-4 hover:bg-paper-50 ${c.statut === "recu" ? "bg-amber-50/60" : ""}`}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-xs text-paper-muted">{c.numero}</span>
                    <Puce classe={st.classe}>{en(st.libelle, langue)}</Puce>
                    {c.caractere !== "ordinaire" && car && <Puce classe={car.classe}>{en(car.libelle, langue)}</Puce>}
                    {c.statut === "recu" && c.remise_declaree_le && (
                      <span className="text-xs font-medium text-amber-800">{t("Remis : accusez réception", "Delivered: acknowledge receipt")}</span>
                    )}
                    {c.echeance && c.statut !== "classe" && (
                      <span className="text-xs text-paper-muted">
                        {t("échéance", "due")} {formaterDate(c.echeance, langue)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-base font-medium text-[#1c2029]">{c.objet || (c.caractere === "personnel" ? t("Pli personnel", "Personal envelope") : c.expediteur)}</p>
                  <p className="mt-0.5 text-xs text-paper-muted">
                    {t("De", "From")} {c.expediteur}
                    {c.reference_expediteur ? ` · ${t("réf.", "ref.")} ${c.reference_expediteur}` : ""} · {t("à", "to")}{" "}
                    {c.destinataire_id ? (noms[c.destinataire_id] ?? t("Agent", "Staff member")) : dep(c.departement)}
                    {c.affecte_a ? ` · ${t("imputé à", "assigned to")} ${noms[c.affecte_a] ?? t("Agent", "Staff member")}` : ""} · {t("reçu le", "received on")}{" "}
                    {formaterDate(c.recu_le, langue)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
