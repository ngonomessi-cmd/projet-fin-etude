import Link from "next/link";
import { notFound } from "next/navigation";
import { Alerte, Puce, boutonDiscret, boutonPrincipal, carte, champ } from "@/components/courrier/Alerte";
import {
  CARACTERES, en, MESSAGES_CONSERVATION_ERREUR, MESSAGES_CONSERVATION_OK, MESSAGES_COURRIER_ERREUR, MESSAGES_COURRIER_OK, MODES, MOUVEMENTS, NATURES,
  STATUTS_COURRIER, STATUTS_DEPART, UUID, type CategorieConservation,
} from "@/lib/courrier/constantes";
import { contexteCourrier, departementsOrganisation, nomsDesProfils } from "@/lib/courrier/contexte";
import { formaterDate, formaterDateHeure, formaterTaille } from "@/lib/courrier/format";
import { traducteurDepartements, traductionServeur } from "@/lib/i18n/serveur";
import { creerClientServeur } from "@/lib/supabase/server";
import { accuserReception, annuler, changerStatut, corriger, dechargePapier, declarerRemise, enregistrerPiece, imputer } from "../actions";
import { SectionConservation } from "../SectionConservation";
import { NumerisationCourrier } from "./NumerisationCourrier";

export const dynamic = "force-dynamic";

type Courrier = {
  id: string; numero: string; recu_le: string; expediteur: string; reference_expediteur: string | null; date_lettre: string | null;
  mode_reception: string; nature: string; nb_pieces: number; objet: string | null; caractere: string; departement: string;
  destinataire_id: string | null; affecte_a: string | null; instruction: string | null; echeance: string | null; statut: string;
  remise_declaree_le: string | null; decharge_le: string | null; decharge_par: string | null; decharge_mode: string | null;
  code_suivi: string; annule_motif: string | null; enregistre_par: string;
  categorie: string; conservation_annees: number | null; gele_le: string | null; gel_motif: string | null; sort_final_le: string | null;
};

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erreur?: string }> };

const Etiquette = ({ children }: { children: React.ReactNode }) => (
  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-paper-muted">{children}</dt>
);

export default async function FicheCourrier({ params, searchParams }: Props) {
  const { id } = await params;
  const { ok, erreur } = await searchParams;
  if (!UUID.test(id)) notFound();
  const ctx = await contexteCourrier();
  if (!ctx) return null;
  const { t, langue } = await traductionServeur();
  const dep = await traducteurDepartements();
  const supabase = await creerClientServeur();

  const { data: c } = await supabase.from("courriers").select("*").eq("id", id).maybeSingle<Courrier>();
  if (!c) notFound();

  const [piecesRes, mouvementsRes, concerneRes] = await Promise.all([
    supabase.from("courrier_pieces").select("id, nom_fichier, taille, empreinte_sha256, nature, ajoute_par, created_at").eq("courrier_id", id).order("created_at")
      .returns<{ id: string; nom_fichier: string; taille: number; empreinte_sha256: string; nature: string; ajoute_par: string; created_at: string }[]>(),
    supabase.from("courrier_mouvements").select("id, action, par, details, created_at").eq("courrier_id", id).order("created_at")
      .returns<{ id: number; action: string; par: string | null; details: Record<string, unknown>; created_at: string }[]>(),
    supabase.rpc("courrier_me_concerne", { p_courrier: id }),
  ]);
  const pieces = piecesRes.data ?? [];
  const mouvements = mouvementsRes.data ?? [];
  const role = ctx.role;
  const categories = role
    ? (((await supabase.from("categories_conservation").select("code, libelle, duree_annees, duree_propre, sort_final").eq("actif", true).order("ordre")).data ?? []) as CategorieConservation[])
    : [];
  // Réponses déjà parties (ou demandées) pour ce courrier : la RLS ne montre que celles que l'agent peut lire.
  const { data: reponses } = await supabase.from("departs").select("id, numero, objet, statut").eq("courrier_arrivee_id", id).order("demande_le")
    .returns<{ id: string; numero: string | null; objet: string; statut: string }[]>();

  const concerne = concerneRes.data === true;
  const personnel = c.caractere === "personnel";
  const actif = c.statut !== "annule" && c.statut !== "classe";
  const noms = await nomsDesProfils([c.destinataire_id, c.affecte_a, c.decharge_par, c.enregistre_par, ...mouvements.map((m) => m.par), ...pieces.map((p) => p.ajoute_par)]);
  const nom = (pid: string | null | undefined) => (pid ? (noms[pid] ?? t("Agent", "Staff member")) : "—");
  const st = STATUTS_COURRIER[c.statut] ?? STATUTS_COURRIER.recu;

  // Droits d'action, calculés comme la base les applique (la base reste seule juge).
  const peutAccuser = concerne && c.statut === "recu" && (c.destinataire_id === ctx.userId || c.affecte_a === ctx.userId || c.destinataire_id === null);
  const peutClore = concerne && (c.statut === "remis" || c.statut === "traite");
  const responsable = ctx.profil.role === "validateur" && ctx.profil.departement === c.departement && !personnel && actif && concerne;
  const candidats = responsable
    ? ((await supabase.from("profiles").select("id, nom_complet, departement").eq("departement", c.departement).order("nom_complet").returns<{ id: string; nom_complet: string }[]>()).data ?? [])
    : [];
  const [agents, departements] =
    role === "chef"
      ? await Promise.all([
          supabase.from("profiles").select("id, nom_complet, departement").order("nom_complet").returns<{ id: string; nom_complet: string; departement: string }[]>().then((r) => r.data ?? []),
          departementsOrganisation(),
        ])
      : [[], [] as string[]];
  const message = ok
    ? (MESSAGES_COURRIER_OK[ok] ?? MESSAGES_CONSERVATION_OK[ok])
    : null;
  const messageErreur = erreur ? (MESSAGES_COURRIER_ERREUR[erreur] ?? MESSAGES_CONSERVATION_ERREUR[erreur] ?? MESSAGES_COURRIER_ERREUR.generique) : null;

  return (
    <div className="max-w-4xl">
      <Link href={role ? "/courrier/registre" : "/courrier"} className="text-sm text-paper-muted hover:text-[#1c2029]">
        ← {role ? t("Registre des arrivées", "Incoming register") : t("Mon courrier", "My mail")}
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-mono text-xs text-paper-muted">{c.numero}</span>
        <Puce classe={st.classe}>{en(st.libelle, langue)}</Puce>
        <Puce classe={CARACTERES[c.caractere]?.classe ?? ""}>{en(CARACTERES[c.caractere]?.libelle ?? [c.caractere, c.caractere], langue)}</Puce>
      </div>
      <h2 className="mt-2 font-serif text-2xl font-semibold leading-tight">
        {c.objet || (personnel ? t("Pli personnel", "Personal envelope") : `${t("Courrier de", "Mail from")} ${c.expediteur}`)}
      </h2>

      <div className="mt-4 space-y-3">
        {message && <Alerte type="ok">{en(message, langue)}</Alerte>}
        {messageErreur && <Alerte type="erreur">{en(messageErreur, langue)}</Alerte>}
        {c.statut === "annule" && <Alerte type="erreur">{t("Courrier annulé", "Mail cancelled")} : {c.annule_motif}</Alerte>}
        {personnel && role && (
          <Alerte type="ok">
            {t("Pli personnel : ne l'ouvrez pas et ne le numérisez pas. Remettez-le fermé à son destinataire.", "Personal envelope: do not open or scan it. Hand it over sealed to its recipient.")}
          </Alerte>
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap gap-3">
        {role && (
          <a href={`/courrier/${c.id}/recepisse`} target="_blank" rel="noopener" className={boutonDiscret}>
            {t("Récépissé de dépôt (PDF)", "Deposit receipt (PDF)")}
          </a>
        )}
        {role && c.statut === "recu" && !c.remise_declaree_le && (
          <form action={declarerRemise}>
            <input type="hidden" name="id" value={c.id} />
            <button type="submit" className={boutonPrincipal}>{t("Déclarer la remise", "Declare delivery")}</button>
          </form>
        )}
        {role && c.statut === "recu" && (
          <form action={dechargePapier}>
            <input type="hidden" name="id" value={c.id} />
            <button type="submit" className={boutonDiscret}>{t("Décharge papier obtenue", "Paper receipt obtained")}</button>
          </form>
        )}
        {peutAccuser && (
          <form action={accuserReception}>
            <input type="hidden" name="id" value={c.id} />
            <button type="submit" className={boutonPrincipal}>{t("J'accuse réception", "I acknowledge receipt")}</button>
          </form>
        )}
        {peutClore && c.statut === "remis" && (
          <form action={changerStatut}>
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="statut" value="traite" />
            <button type="submit" className={boutonDiscret}>{t("Marquer traité", "Mark as handled")}</button>
          </form>
        )}
        {peutClore && (
          <form action={changerStatut}>
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="statut" value="classe" />
            <button type="submit" className={boutonDiscret}>{t("Classer", "File")}</button>
          </form>
        )}
      </div>
      {c.statut === "recu" && c.remise_declaree_le && !c.decharge_le && (
        <p className="mt-3 text-sm text-paper-muted">
          {t("Remise déclarée le", "Delivery declared on")} {formaterDateHeure(c.remise_declaree_le, langue)} : {t("en attente de l'accusé de réception du destinataire.", "waiting for the recipient to acknowledge receipt.")}
        </p>
      )}

      <dl className={`${carte} mt-5 grid gap-x-8 gap-y-4 p-5 text-sm sm:grid-cols-2`}>
        <div><Etiquette>{t("Expéditeur", "Sender")}</Etiquette><dd className="mt-1">{c.expediteur}</dd></div>
        <div>
          <Etiquette>{t("Référence de l'expéditeur", "Sender's reference")}</Etiquette>
          <dd className="mt-1">{c.reference_expediteur || "—"}{c.date_lettre ? ` · ${t("du", "dated")} ${formaterDate(c.date_lettre, langue)}` : ""}</dd>
        </div>
        <div><Etiquette>{t("Reçu le", "Received on")}</Etiquette><dd className="mt-1">{formaterDateHeure(c.recu_le, langue)}</dd></div>
        <div>
          <Etiquette>{t("Réception", "Receipt")}</Etiquette>
          <dd className="mt-1">
            {en(NATURES[c.nature] ?? [c.nature, c.nature], langue)} · {en(MODES[c.mode_reception] ?? [c.mode_reception, c.mode_reception], langue)} · {c.nb_pieces} {t(c.nb_pieces > 1 ? "pièces" : "pièce", c.nb_pieces > 1 ? "items" : "item")}
          </dd>
        </div>
        <div><Etiquette>{t("Département destinataire", "Recipient department")}</Etiquette><dd className="mt-1">{dep(c.departement)}</dd></div>
        <div><Etiquette>{t("Destinataire nommé", "Named recipient")}</Etiquette><dd className="mt-1">{nom(c.destinataire_id)}</dd></div>
        {c.affecte_a && (
          <div><Etiquette>{t("Imputé à", "Assigned to")}</Etiquette><dd className="mt-1">{nom(c.affecte_a)}{c.instruction ? ` — ${c.instruction}` : ""}</dd></div>
        )}
        {c.echeance && <div><Etiquette>{t("Échéance", "Deadline")}</Etiquette><dd className="mt-1">{formaterDate(c.echeance, langue)}</dd></div>}
        {c.decharge_le && (
          <div className="sm:col-span-2">
            <Etiquette>{t("Décharge", "Receipt")}</Etiquette>
            <dd className="mt-1">
              {formaterDateHeure(c.decharge_le, langue)} ·{" "}
              {c.decharge_mode === "papier"
                ? t("signature papier recueillie par le service", "paper signature collected by the service")
                : `${t("accusé par", "acknowledged by")} ${nom(c.decharge_par)} ${t("dans l'application", "in the application")}`}
            </dd>
          </div>
        )}
        <div><Etiquette>{t("Code de suivi", "Tracking code")}</Etiquette><dd className="mt-1 font-mono">{c.code_suivi}</dd></div>
        <div><Etiquette>{t("Enregistré par", "Registered by")}</Etiquette><dd className="mt-1">{noms[c.enregistre_par] ?? t("Service du courrier", "Mail service")}</dd></div>
      </dl>

      {/* Scans */}
      <section className="mt-8" aria-labelledby="titre-scans">
        <h2 id="titre-scans" className="font-serif text-lg font-semibold">{t("Scans archivés", "Archived scans")}</h2>
        {pieces.length === 0 ? (
          <p className={`${carte} mt-3 p-5 text-sm text-paper-muted`}>
            {personnel ? t("Un pli personnel n'est pas numérisé.", "A personal envelope is not scanned.") : t("Aucun scan : seules les références sont conservées.", "No scan: only the references are kept.")}
          </p>
        ) : (
          <ul className={`${carte} mt-3 divide-y divide-paper-200 overflow-hidden`}>
            {pieces.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {p.nom_fichier}
                    {p.nature === "decharge" && <span className="ml-2"><Puce classe="bg-sky-100 text-sky-900">{t("Décharge", "Receipt")}</Puce></span>}
                  </p>
                  <p className="mt-0.5 text-xs text-paper-muted">{nom(p.ajoute_par)} · {formaterDateHeure(p.created_at, langue)} · {formaterTaille(p.taille)}</p>
                  <p className="mt-0.5 font-mono text-[0.68rem] text-paper-muted" title={t("Empreinte SHA-256 du fichier", "SHA-256 fingerprint of the file")}>SHA-256 {p.empreinte_sha256.slice(0, 16)}…</p>
                </div>
                <a href={`/courrier/${c.id}/piece/${p.id}`} className={boutonDiscret}>{t("Télécharger", "Download")}</a>
              </li>
            ))}
          </ul>
        )}
        {role && !personnel && c.statut !== "annule" && (
          <NumerisationCourrier
            id={c.id}
            numero={c.numero}
            enregistrer={enregistrerPiece}
            natures={[
              { valeur: "scan", libelle: t("Archiver le scan", "Archive the scan") },
              { valeur: "decharge", libelle: t("Archiver comme décharge signée", "Archive as signed receipt"), infobulle: t("Pour joindre la décharge papier signée par le destinataire", "To attach the paper receipt signed by the recipient") },
            ]}
            titre={t("Numériser le courrier", "Scan the mail")}
            aide={t(
              "Pour un courrier ouvrable, adressé à un département. Scanner de bureau : choisissez le PDF. Téléphone : photographiez chaque page, elles seront assemblées en un seul PDF.",
              "For mail that can be opened, addressed to a department. Desk scanner: choose the PDF. Phone: photograph each page; they will be assembled into a single PDF."
            )}
          />
        )}
      </section>

      {/* Imputation */}
      {responsable && (
        <section className={`${carte} mt-8 p-5`} aria-labelledby="titre-imputer">
          <h2 id="titre-imputer" className="font-serif text-base font-semibold">{t("Imputer à un agent", "Assign to a staff member")}</h2>
          <form action={imputer} className="mt-3 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="id" value={c.id} />
            <div>
              <label htmlFor="agent" className="mb-1 block text-sm font-medium">{t("Agent", "Staff member")}</label>
              <select id="agent" name="agent" required defaultValue={c.affecte_a ?? ""} className={champ}>
                <option value="" disabled>{t("Choisir…", "Choose…")}</option>
                {candidats.map((p) => <option key={p.id} value={p.id}>{p.nom_complet}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="instruction" className="mb-1 block text-sm font-medium">{t("Instruction", "Instruction")} <span className="font-normal text-paper-soft">({t("facultative", "optional")})</span></label>
              <input id="instruction" name="instruction" maxLength={1000} defaultValue={c.instruction ?? ""} className={champ} />
            </div>
            <div className="sm:col-span-2"><button type="submit" className={boutonDiscret}>{t("Imputer", "Assign")}</button></div>
          </form>
        </section>
      )}

      {/* Chef du courrier : correction, annulation */}
      {role === "chef" && c.statut !== "annule" && (
        <details className="mt-8 rounded-md border border-paper-200 bg-white p-4 text-sm">
          <summary className="cursor-pointer text-navy-900 underline underline-offset-4">{t("Corriger ou annuler (chef du courrier)", "Correct or cancel (head of the mail service)")}</summary>
          <div className="mt-4 space-y-6">
            <form action={corriger} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={c.id} />
              <div className="sm:col-span-2"><label htmlFor="c-exp" className="mb-1 block text-xs font-medium text-paper-muted">{t("Expéditeur", "Sender")}</label><input id="c-exp" name="expediteur" required maxLength={300} defaultValue={c.expediteur} className={champ} /></div>
              <div><label htmlFor="c-ref" className="mb-1 block text-xs font-medium text-paper-muted">{t("Référence de l'expéditeur", "Sender's reference")}</label><input id="c-ref" name="reference" maxLength={200} defaultValue={c.reference_expediteur ?? ""} className={champ} /></div>
              {!personnel && <div><label htmlFor="c-obj" className="mb-1 block text-xs font-medium text-paper-muted">{t("Objet apparent", "Visible subject")}</label><input id="c-obj" name="objet" maxLength={500} defaultValue={c.objet ?? ""} className={champ} /></div>}
              <div>
                <label htmlFor="c-dep" className="mb-1 block text-xs font-medium text-paper-muted">{t("Département destinataire", "Recipient department")}</label>
                <select id="c-dep" name="departement" required defaultValue={c.departement} className={champ}>
                  {departements.map((d) => <option key={d} value={d}>{dep(d)}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="c-dest" className="mb-1 block text-xs font-medium text-paper-muted">{t("Personne destinataire", "Recipient")}</label>
                <select id="c-dest" name="destinataire" defaultValue={c.destinataire_id ?? ""} required={personnel} className={champ}>
                  <option value="">{t("Aucune", "None")}</option>
                  {agents.map((a) => <option key={a.id} value={a.id}>{a.nom_complet}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2"><label htmlFor="c-motif" className="mb-1 block text-xs font-medium text-paper-muted">{t("Motif de la correction (obligatoire)", "Reason for the correction (required)")}</label><input id="c-motif" name="motif" required minLength={5} maxLength={500} className={champ} /></div>
              <div className="sm:col-span-2"><button type="submit" className={boutonDiscret}>{t("Enregistrer la correction", "Save the correction")}</button></div>
            </form>
            <form action={annuler} className="flex flex-wrap items-end gap-3 border-t border-paper-200 pt-4">
              <input type="hidden" name="id" value={c.id} />
              <div className="min-w-64 flex-1">
                <label htmlFor="a-motif" className="mb-1 block text-xs font-medium text-paper-muted">
                  {t("Motif de l'annulation (obligatoire) — le courrier reste visible dans le registre", "Reason for cancelling (required) — the mail stays visible in the register")}
                </label>
                <input id="a-motif" name="motif" required minLength={5} maxLength={500} className={champ} />
              </div>
              <button type="submit" className={`${boutonDiscret} !text-red-800`}>{t("Annuler le courrier", "Cancel the mail")}</button>
            </form>
          </div>
        </details>
      )}

      <SectionConservation
        type="courrier" id={c.id} categorie={c.categorie} conservationAnnees={c.conservation_annees} geleLe={c.gele_le} gelMotif={c.gel_motif}
        sortFinalLe={c.sort_final_le} categories={categories} service={Boolean(role)} chef={role === "chef"}
      />

      {/* Réponses */}
      {((reponses?.length ?? 0) > 0 || role) && (
        <section className="mt-8" aria-labelledby="titre-reponses">
          <h2 id="titre-reponses" className="font-serif text-lg font-semibold">{t("Réponses", "Replies")}</h2>
          {(reponses?.length ?? 0) === 0 ? (
            <p className="mt-2 text-sm text-paper-muted">{t("Aucune réponse enregistrée pour ce courrier.", "No reply recorded for this mail.")}</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {reponses!.map((r) => (
                <li key={r.id}>
                  <Link href={`/courrier/depart/${r.id}`} className="font-medium text-navy-900 underline underline-offset-4">{r.numero ?? t("Demande en attente", "Request pending")}</Link>{" "}
                  — {r.objet} <span className="text-paper-muted">({en(STATUTS_DEPART[r.statut]?.libelle ?? [r.statut, r.statut], langue)})</span>
                </li>
              ))}
            </ul>
          )}
          {role && c.statut !== "annule" && (
            <Link href={`/courrier/depart/nouveau?arrivee=${c.id}`} className={`${boutonDiscret} mt-3`}>{t("Enregistrer une réponse (départ)", "Register a reply (outgoing)")}</Link>
          )}
        </section>
      )}

      {/* Historique */}
      <section className="mt-8" aria-labelledby="titre-historique">
        <h2 id="titre-historique" className="font-serif text-lg font-semibold">{t("Historique", "History")}</h2>
        <ol className="mt-3 space-y-2 border-l-2 border-paper-200 pl-4">
          {mouvements.map((m) => (
            <li key={m.id} className="text-sm">
              <span className="font-medium">{en(MOUVEMENTS[m.action] ?? [m.action, m.action], langue)}</span>
              <span className="text-paper-muted"> · {m.par ? nom(m.par) : t("Système", "System")} · {formaterDateHeure(m.created_at, langue)}</span>
              {typeof m.details?.motif === "string" && <span className="block text-xs text-paper-muted">{t("Motif", "Reason")} : {m.details.motif}</span>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
