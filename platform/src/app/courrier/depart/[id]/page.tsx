import Link from "next/link";
import { notFound } from "next/navigation";
import { Alerte, Puce, boutonDiscret, boutonPrincipal, carte, champ } from "@/components/courrier/Alerte";
import {
  en, MESSAGES_CONSERVATION_ERREUR, MESSAGES_CONSERVATION_OK, MESSAGES_DEPART_ERREUR, MESSAGES_DEPART_OK, MODES_ENVOI, MOUVEMENTS_DEPART, STATUTS_DEPART, UUID,
  type CategorieConservation,
} from "@/lib/courrier/constantes";
import { contexteCourrier, nomsDesProfils } from "@/lib/courrier/contexte";
import { formaterDate, formaterDateHeure, formaterTaille } from "@/lib/courrier/format";
import { traducteurDepartements, traductionServeur } from "@/lib/i18n/serveur";
import { creerClientServeur } from "@/lib/supabase/server";
import { NumerisationCourrier } from "../../[id]/NumerisationCourrier";
import { FormulaireDecharge } from "./FormulaireDecharge";
import { SectionConservation } from "../../SectionConservation";
import { accepterDemande, accuserSansDecharge, annulerDepart, enregistrerPieceDepart, expedier, refuserDemande } from "../actions";

export const dynamic = "force-dynamic";

type Depart = {
  id: string; numero: string | null; statut: string; objet: string; document_id: string | null; document_reference: string | null;
  signature_numero: string | null; courrier_arrivee_id: string | null; demandeur_id: string; departement: string; mode_envoi: string;
  nb_pieces: number; urgent: boolean; ar_demande: boolean; relance_jours: number | null; relance_le: string | null; note: string | null;
  demande_le: string; enregistre_le: string | null; expedie_le: string | null; motif: string | null;
  categorie: string; conservation_annees: number | null; gele_le: string | null; gel_motif: string | null; sort_final_le: string | null;
};
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erreur?: string }> };
const Etiquette = ({ children }: { children: React.ReactNode }) => (
  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-paper-muted">{children}</dt>
);

export default async function FicheDepart({ params, searchParams }: Props) {
  const { id } = await params;
  const { ok, erreur } = await searchParams;
  if (!UUID.test(id)) notFound();
  const ctx = await contexteCourrier();
  if (!ctx) return null;
  const { t, langue } = await traductionServeur();
  const dep = await traducteurDepartements();
  const supabase = await creerClientServeur();

  const { data: d } = await supabase.from("departs").select("*").eq("id", id).maybeSingle<Depart>();
  if (!d) notFound();
  const [destRes, piecesRes, mouvRes, arriveeRes] = await Promise.all([
    supabase.from("depart_destinataires").select("id, role, nom, adresse, statut, expedie_le, accuse_le, accuse_par, preuve, remis_le, recu_par, recu_qualite, remise_mode, decharge_piece_id, motif_sans_decharge").eq("depart_id", id).order("ordre")
      .returns<{
        id: string; role: string; nom: string; adresse: string | null; statut: string; expedie_le: string | null; accuse_le: string | null; accuse_par: string | null;
        preuve: string | null; remis_le: string | null; recu_par: string | null; recu_qualite: string | null; remise_mode: string | null; decharge_piece_id: string | null; motif_sans_decharge: string | null;
      }[]>(),
    supabase.from("depart_pieces").select("id, nom_fichier, taille, empreinte_sha256, nature, ajoute_par, created_at").eq("depart_id", id).order("created_at")
      .returns<{ id: string; nom_fichier: string; taille: number; empreinte_sha256: string; nature: string; ajoute_par: string; created_at: string }[]>(),
    supabase.from("depart_mouvements").select("id, action, par, details, created_at").eq("depart_id", id).order("created_at")
      .returns<{ id: number; action: string; par: string | null; details: Record<string, unknown>; created_at: string }[]>(),
    d.courrier_arrivee_id
      ? supabase.from("courriers").select("id, numero").eq("id", d.courrier_arrivee_id).maybeSingle<{ id: string; numero: string }>()
      : Promise.resolve({ data: null }),
  ]);
  const destinataires = destRes.data ?? [];
  const pieces = piecesRes.data ?? [];
  const mouvements = mouvRes.data ?? [];
  const noms = await nomsDesProfils([d.demandeur_id, ...mouvements.map((m) => m.par), ...pieces.map((p) => p.ajoute_par), ...destinataires.map((x) => x.accuse_par)]);
  const nom = (pid: string | null | undefined) => (pid ? (noms[pid] ?? t("Agent", "Staff member")) : "—");

  const role = ctx.role;
  const categories = role
    ? (((await supabase.from("categories_conservation").select("code, libelle, duree_annees, duree_propre, sort_final").eq("actif", true).order("ordre")).data ?? []) as CategorieConservation[])
    : [];
  const moi = d.demandeur_id === ctx.userId;
  const st = STATUTS_DEPART[d.statut] ?? STATUTS_DEPART.demande;
  const aujourdhui = new Date(Date.now() + 3600 * 1000).toISOString().slice(0, 10);
  const relance = d.statut === "expedie" && d.ar_demande && d.relance_le !== null && d.relance_le <= aujourdhui;
  const clos = d.statut === "annule" || d.statut === "refuse";
  const peutAnnuler = !clos && (role === "chef" || (moi && d.statut === "demande"));
  const message = ok ? (MESSAGES_DEPART_OK[ok] ?? MESSAGES_CONSERVATION_OK[ok]) : null;
  const messageErreur = erreur ? (MESSAGES_DEPART_ERREUR[erreur] ?? MESSAGES_CONSERVATION_ERREUR[erreur] ?? MESSAGES_DEPART_ERREUR.generique) : null;
  const naturePiece: Record<string, [string, string]> = {
    lettre: ["Lettre", "Letter"], lettre_signee: ["Lettre signée", "Signed letter"], accuse: ["Décharge", "Receipt"], annexe: ["Annexe", "Annex"],
  };

  return (
    <div className="max-w-4xl">
      <Link href="/courrier/depart" className="text-sm text-paper-muted hover:text-[#1c2029]">← {role ? t("Registre des départs", "Outgoing register") : t("Mes envois", "My dispatches")}</Link>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-mono text-xs text-paper-muted">{d.numero ?? t("Demande d'expédition", "Dispatch request")}</span>
        <Puce classe={st.classe}>{en(st.libelle, langue)}</Puce>
        {d.urgent && <Puce classe="bg-amber-100 text-amber-900">{t("Urgent", "Urgent")}</Puce>}
        {relance && <Puce classe="bg-red-100 text-red-900">{t("Relance à faire", "Reminder due")}</Puce>}
      </div>
      <h2 className="mt-2 font-serif text-2xl font-semibold leading-tight">{d.objet}</h2>

      <div className="mt-4 space-y-3">
        {message && <Alerte type="ok">{en(message, langue)}</Alerte>}
        {messageErreur && <Alerte type="erreur">{en(messageErreur, langue)}</Alerte>}
        {d.statut === "refuse" && <Alerte type="erreur">{t("Demande renvoyée par le service du courrier", "Request returned by the mail service")} : {d.motif}</Alerte>}
        {d.statut === "annule" && <Alerte type="erreur">{t("Départ annulé", "Outgoing mail cancelled")} : {d.motif}</Alerte>}
        {relance && (
          <Alerte type="erreur">
            {t("Aucune décharge n'a été enregistrée depuis l'expédition (relance prévue le", "No receipt has been recorded since dispatch (reminder due on")} {formaterDate(d.relance_le, langue)}).{" "}
            {t("Relancez le destinataire.", "Remind the recipient.")}
          </Alerte>
        )}
      </div>

      {/* Actions du service */}
      {role && d.statut === "demande" && (
        <section className={`${carte} mt-5 space-y-4 p-5`} aria-labelledby="titre-traiter">
          <h2 id="titre-traiter" className="font-serif text-base font-semibold">{t("Traiter la demande", "Process the request")}</h2>
          <form action={accepterDemande} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={d.id} />
            <div>
              <label htmlFor="mode" className="mb-1 block text-xs font-medium text-paper-muted">{t("Mode d'envoi", "Delivery method")}</label>
              <select id="mode" name="mode" defaultValue={d.mode_envoi} className={champ}>{Object.entries(MODES_ENVOI).map(([k, v]) => <option key={k} value={k}>{en(v, langue)}</option>)}</select>
            </div>
            <div>
              <label htmlFor="nb_pieces" className="mb-1 block text-xs font-medium text-paper-muted">{t("Pièces", "Items")}</label>
              <input id="nb_pieces" name="nb_pieces" type="number" min={1} max={999} defaultValue={d.nb_pieces} className={`${champ} !w-24`} />
            </div>
            <button type="submit" className={boutonPrincipal}>{t("Accepter et numéroter", "Accept and number")}</button>
          </form>
          <form action={refuserDemande} className="flex flex-wrap items-end gap-3 border-t border-paper-200 pt-4">
            <input type="hidden" name="id" value={d.id} />
            <div className="min-w-64 flex-1">
              <label htmlFor="motif-refus" className="mb-1 block text-xs font-medium text-paper-muted">{t("Renvoyer la demande au demandeur — motif (obligatoire)", "Return the request to the requester — reason (required)")}</label>
              <input id="motif-refus" name="motif" required minLength={5} maxLength={500} className={champ} />
            </div>
            <button type="submit" className={boutonDiscret}>{t("Renvoyer", "Return")}</button>
          </form>
        </section>
      )}
      {role && d.statut === "enregistre" && (
        <form action={expedier} className="mt-5">
          <input type="hidden" name="id" value={d.id} />
          <button type="submit" className={boutonPrincipal}>{t("Marquer comme expédié", "Mark as sent")}</button>
        </form>
      )}
      {d.numero && (
        <p className="mt-4">
          <a href={`/courrier/depart/${d.id}/recepisse`} target="_blank" rel="noopener" className={boutonDiscret}>{t("Récépissé d'envoi (PDF)", "Dispatch receipt (PDF)")}</a>
        </p>
      )}

      <dl className={`${carte} mt-5 grid gap-x-8 gap-y-4 p-5 text-sm sm:grid-cols-2`}>
        <div><Etiquette>{t("Département émetteur", "Sending department")}</Etiquette><dd className="mt-1">{dep(d.departement)}</dd></div>
        <div><Etiquette>{t("Demandeur", "Requester")}</Etiquette><dd className="mt-1">{nom(d.demandeur_id)}</dd></div>
        <div>
          <Etiquette>{t("Mode d'envoi", "Delivery method")}</Etiquette>
          <dd className="mt-1">{en(MODES_ENVOI[d.mode_envoi] ?? [d.mode_envoi, d.mode_envoi], langue)} · {d.nb_pieces} {t(d.nb_pieces > 1 ? "pièces" : "pièce", d.nb_pieces > 1 ? "items" : "item")}</dd>
        </div>
        <div>
          <Etiquette>{t("Accusé de réception", "Acknowledgement of receipt")}</Etiquette>
          <dd className="mt-1">{d.ar_demande ? t(`Souhaité (relance après ${d.relance_jours} jours)`, `Requested (reminder after ${d.relance_jours} days)`) : t("Non demandé", "Not requested")}</dd>
        </div>
        <div><Etiquette>{t("Demandé le", "Requested on")}</Etiquette><dd className="mt-1">{formaterDateHeure(d.demande_le, langue)}</dd></div>
        <div><Etiquette>{t("Expédié le", "Sent on")}</Etiquette><dd className="mt-1">{d.expedie_le ? formaterDateHeure(d.expedie_le, langue) : "—"}</dd></div>
        {d.document_reference && (
          <div>
            <Etiquette>{t("Document de la plateforme", "Platform document")}</Etiquette>
            <dd className="mt-1 font-mono text-xs">
              {d.document_reference}
              {d.document_id && !role && <> · <Link href={`/documents/${d.document_id}`} className="text-navy-900 underline underline-offset-4">{t("ouvrir", "open")}</Link></>}
            </dd>
          </div>
        )}
        {d.signature_numero && <div><Etiquette>{t("Signature électronique", "Electronic signature")}</Etiquette><dd className="mt-1 font-mono text-xs">{d.signature_numero}</dd></div>}
        {arriveeRes.data && (
          <div>
            <Etiquette>{t("En réponse au courrier", "In reply to mail")}</Etiquette>
            <dd className="mt-1"><Link href={`/courrier/${arriveeRes.data.id}`} className="font-mono text-xs text-navy-900 underline underline-offset-4">{arriveeRes.data.numero}</Link></dd>
          </div>
        )}
        {d.note && <div className="sm:col-span-2"><Etiquette>{t("Note du demandeur", "Requester's note")}</Etiquette><dd className="mt-1 whitespace-pre-wrap">{d.note}</dd></div>}
      </dl>

      {/* Destinataires */}
      <section className="mt-8" aria-labelledby="titre-destinataires">
        <h2 id="titre-destinataires" className="font-serif text-lg font-semibold">{t("Destinataires", "Recipients")}</h2>
        <ul className={`${carte} mt-3 divide-y divide-paper-200 overflow-hidden`}>
          {destinataires.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="text-sm font-medium">{x.nom}{x.role === "ampliation" && <span className="ml-2"><Puce classe="bg-slate-100 text-slate-700">{t("Ampliation", "Copy")}</Puce></span>}</p>
                {x.adresse && <p className="mt-0.5 text-xs text-paper-muted">{x.adresse}</p>}
                <p className="mt-0.5 text-xs text-paper-muted">
                  {x.statut === "a_expedier"
                    ? t("À expédier", "To be sent")
                    : x.statut === "expedie"
                      ? `${t("Expédié le", "Sent on")} ${formaterDateHeure(x.expedie_le, langue)}`
                      : x.preuve === "decharge"
                        ? `${t("Reçu le", "Received on")} ${formaterDateHeure(x.remis_le ?? x.accuse_le, langue)} · ${t("décharge signée par", "receipt signed by")} ${x.recu_par ?? "—"}${x.recu_qualite ? ` (${x.recu_qualite})` : ""}${x.remise_mode ? ` · ${en(MODES_ENVOI[x.remise_mode] ?? [x.remise_mode, x.remise_mode], langue)}` : ""}`
                        : `${t("Accusé le", "Acknowledged on")} ${formaterDateHeure(x.accuse_le, langue)}`}
                  {x.statut === "accuse" && x.accuse_par ? ` · ${t("enregistré par", "recorded by")} ${nom(x.accuse_par)}` : ""}
                </p>
                {x.preuve === "decharge" && (
                  <p className="mt-1 text-xs">
                    <Puce classe="bg-emerald-100 text-emerald-900">{t("Décharge signée", "Signed receipt")}</Puce>
                    {x.decharge_piece_id && (
                      <a href={`/courrier/depart/${d.id}/piece/${x.decharge_piece_id}`} className="ml-2 text-navy-900 underline underline-offset-4">{t("Voir la décharge", "View the receipt")}</a>
                    )}
                  </p>
                )}
                {x.preuve === "sans_decharge" && (
                  <p className="mt-1 text-xs text-amber-900">
                    <Puce classe="bg-amber-100 text-amber-900">{t("Sans décharge", "No receipt")}</Puce>
                    <span className="ml-2">{t("Motif", "Reason")} : {x.motif_sans_decharge}</span>
                  </p>
                )}
                {x.statut === "accuse" && !x.preuve && (
                  <p className="mt-1 text-xs text-paper-muted">{t("Accusé enregistré avant l'obligation de décharge.", "Acknowledgement recorded before receipts became mandatory.")}</p>
                )}
              </div>
              {role && x.role === "destinataire" && x.statut === "expedie" && (
                <details className="w-full rounded-md border border-paper-200 p-3" id={`decharge-${x.id}`}>
                  <summary className="cursor-pointer text-sm font-medium text-navy-900 underline underline-offset-4">{t("Enregistrer la décharge", "Record the receipt")}</summary>
                  <FormulaireDecharge departId={d.id} numero={d.numero ?? "DEP"} destinataireId={x.id} destinataireNom={x.nom} expedieLe={x.expedie_le ?? d.expedie_le} modeEnvoi={d.mode_envoi} />
                  {role === "chef" && (
                    <details className="mt-3 text-sm">
                      <summary className="cursor-pointer text-paper-muted hover:text-[#1c2029]">{t("Accuser sans décharge (exception du chef du courrier)", "Acknowledge without a receipt (exception for the head of the mail service)")}</summary>
                      <form action={accuserSansDecharge} className="mt-3 flex flex-wrap items-end gap-3">
                        <input type="hidden" name="id" value={d.id} />
                        <input type="hidden" name="destinataire" value={x.id} />
                        <div className="min-w-64 flex-1">
                          <label htmlFor={`sd-${x.id}`} className="mb-1 block text-xs font-medium text-paper-muted">
                            {t("Motif (obligatoire, 10 caractères au moins) — il reste visible dans le dossier", "Reason (required, at least 10 characters) — it stays visible in the file")}
                          </label>
                          <input id={`sd-${x.id}`} name="motif" required minLength={10} maxLength={500} className={champ} placeholder={t("ex. Confirmation de réception par téléphone, décharge égarée", "e.g. Receipt confirmed by phone, receipt lost")} />
                        </div>
                        <button type="submit" className={`${boutonDiscret} !text-amber-900`}>{t("Accuser sans décharge", "Acknowledge without a receipt")}</button>
                      </form>
                    </details>
                  )}
                </details>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Pièces */}
      <section className="mt-8" aria-labelledby="titre-pieces">
        <h2 id="titre-pieces" className="font-serif text-lg font-semibold">{t("Pièces archivées", "Archived items")}</h2>
        {pieces.length === 0 ? (
          <p className={`${carte} mt-3 p-5 text-sm text-paper-muted`}>
            {t("Aucune pièce", "No item")} : {d.document_id ? t("la lettre n'a pas été jointe (document confidentiel ou format non PDF).", "the letter was not attached (confidential document or non-PDF format).") : t("seules les références sont conservées.", "only the references are kept.")}
          </p>
        ) : (
          <ul className={`${carte} mt-3 divide-y divide-paper-200 overflow-hidden`}>
            {pieces.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {p.nom_fichier}
                    <span className="ml-2"><Puce classe="bg-sky-100 text-sky-900">{en(naturePiece[p.nature] ?? [p.nature, p.nature], langue)}</Puce></span>
                  </p>
                  <p className="mt-0.5 text-xs text-paper-muted">{nom(p.ajoute_par)} · {formaterDateHeure(p.created_at, langue)} · {formaterTaille(p.taille)}</p>
                  <p className="mt-0.5 font-mono text-[0.68rem] text-paper-muted" title={t("Empreinte SHA-256 du fichier", "SHA-256 fingerprint of the file")}>SHA-256 {p.empreinte_sha256.slice(0, 16)}…</p>
                </div>
                <a href={`/courrier/depart/${d.id}/piece/${p.id}`} className={boutonDiscret}>{t("Télécharger", "Download")}</a>
              </li>
            ))}
          </ul>
        )}
        {role && !clos && (
          <NumerisationCourrier
            id={d.id}
            numero={d.numero ?? "DEP"}
            enregistrer={enregistrerPieceDepart}
            natures={[
              { valeur: "lettre_signee", libelle: t("Archiver la lettre signée", "Archive the signed letter") },
              { valeur: "annexe", libelle: t("Archiver une annexe", "Archive an annex") },
            ]}
            titre={t("Numériser une pièce", "Scan an item")}
            aide={t(
              "Lettre signée sur papier, ou annexe. La décharge d'un destinataire se dépose depuis sa ligne, plus haut (« Enregistrer la décharge »). Scanner de bureau : choisissez le PDF. Téléphone : photographiez chaque page, elles seront assemblées en un seul PDF.",
              "Letter signed on paper, or annex. A recipient's receipt is filed from their line above (“Record the receipt”). Desk scanner: choose the PDF. Phone: photograph each page; they will be assembled into a single PDF."
            )}
          />
        )}
      </section>

      {peutAnnuler && (
        <details className="mt-8 rounded-md border border-paper-200 bg-white p-4 text-sm">
          <summary className="cursor-pointer text-navy-900 underline underline-offset-4">
            {d.statut === "demande" && moi ? t("Annuler ma demande", "Cancel my request") : t("Annuler le départ (chef du courrier)", "Cancel the outgoing mail (head of the mail service)")}
          </summary>
          <form action={annulerDepart} className="mt-3 flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={d.id} />
            <div className="min-w-64 flex-1">
              <label htmlFor="a-motif" className="mb-1 block text-xs font-medium text-paper-muted">{t("Motif (obligatoire) — le départ reste visible dans le registre", "Reason (required) — the item stays visible in the register")}</label>
              <input id="a-motif" name="motif" required minLength={5} maxLength={500} className={champ} />
            </div>
            <button type="submit" className={`${boutonDiscret} !text-red-800`}>{t("Annuler", "Cancel")}</button>
          </form>
        </details>
      )}

      <SectionConservation
        type="depart" id={d.id} categorie={d.categorie} conservationAnnees={d.conservation_annees} geleLe={d.gele_le} gelMotif={d.gel_motif}
        sortFinalLe={d.sort_final_le} categories={categories} service={role !== null} chef={role === "chef"}
      />

      <section className="mt-8" aria-labelledby="titre-historique">
        <h2 id="titre-historique" className="font-serif text-lg font-semibold">{t("Historique", "History")}</h2>
        <ol className="mt-3 space-y-2 border-l-2 border-paper-200 pl-4">
          {mouvements.map((m) => (
            <li key={m.id} className="text-sm">
              <span className="font-medium">{en(MOUVEMENTS_DEPART[m.action] ?? [m.action, m.action], langue)}</span>
              <span className="text-paper-muted"> · {m.par ? nom(m.par) : t("Système", "System")} · {formaterDateHeure(m.created_at, langue)}</span>
              {typeof m.details?.motif === "string" && <span className="block text-xs text-paper-muted">{t("Motif", "Reason")} : {m.details.motif}</span>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
