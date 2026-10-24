"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTraduction } from "@/components/i18n/Langue";
import { deleguerSignatureAction, designerTitulaireAction, revoquerDelegationAction, type ResultatAction } from "./actions";

const CHAMP = "w-full rounded-md border border-paper-200 bg-white px-3 py-2 text-sm";
const BOUTON = "rounded-md bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50";

export type Personne = { id: string; nom_complet: string; role: string; departement: string | null };

function Message({ resultat }: { resultat: ResultatAction | null }) {
  if (!resultat) return null;
  return (
    <p className={`mt-2 rounded-md px-3 py-2 text-sm ${resultat.erreur ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>
      {resultat.erreur ?? resultat.succes}
    </p>
  );
}

// Administrateur : qui occupe la qualité (ex. le DG).
export function ChoixTitulaire({ qualite, titulaireId, personnes }: { qualite: string; titulaireId: string | null; personnes: Personne[] }) {
  const router = useRouter();
  const { t } = useTraduction();
  const [choix, setChoix] = useState(titulaireId ?? "");
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState<ResultatAction | null>(null);

  async function enregistrer() {
    if (
      titulaireId &&
      choix !== titulaireId &&
      !window.confirm(
        t(
          "Changer de titulaire met fin à toutes les délégations accordées par le titulaire actuel. Continuer ?",
          "Changing the holder ends every delegation granted by the current holder. Continue?"
        )
      )
    )
      return;
    setEnCours(true);
    const r = await designerTitulaireAction(qualite, choix || null);
    setResultat(r);
    setEnCours(false);
    if (!r.erreur) router.refresh();
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select value={choix} onChange={(e) => setChoix(e.target.value)} className={`${CHAMP} sm:max-w-sm`}>
          <option value="">{t("— Vacant —", "— Vacant —")}</option>
          {personnes
            .filter((p) => p.role !== "auditeur" && p.role !== "lecteur")
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom_complet}
                {p.departement ? ` — ${p.departement}` : ""}
              </option>
            ))}
        </select>
        <button type="button" disabled={enCours || choix === (titulaireId ?? "")} onClick={enregistrer} className={BOUTON}>
          {t("Enregistrer", "Save")}
        </button>
      </div>
      <Message resultat={resultat} />
    </div>
  );
}

// Titulaire : déléguer sa signature (un an au plus).
export function FormulaireDelegation({ qualite, personnes, moiId }: { qualite: string; personnes: Personne[]; moiId: string }) {
  const router = useRouter();
  const { t } = useTraduction();
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState<ResultatAction | null>(null);
  const aujourdhui = new Date().toISOString().slice(0, 10);

  async function soumettre(formulaire: FormData) {
    setEnCours(true);
    formulaire.set("qualite", qualite);
    const r = await deleguerSignatureAction(formulaire);
    setResultat(r);
    setEnCours(false);
    if (!r.erreur) router.refresh();
  }

  return (
    <form action={soumettre} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="text-xs text-paper-muted">
        {t("Délégataire", "Delegate")}
        <select name="delegataire" required className={`${CHAMP} mt-1`} defaultValue="">
          <option value="" disabled>
            {t("Choisir…", "Choose…")}
          </option>
          {personnes
            .filter((p) => p.id !== moiId && p.role !== "auditeur" && p.role !== "lecteur")
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom_complet}
                {p.departement ? ` — ${p.departement}` : ""}
              </option>
            ))}
        </select>
      </label>
      <label className="text-xs text-paper-muted">
        {t("Titre imprimé sous « par délégation »", "Title printed under \"by delegation\"")}
        <input name="titre" required maxLength={120} placeholder={t("Le Directeur Général Adjoint", "The Deputy Director General")} className={`${CHAMP} mt-1`} />
      </label>
      <label className="text-xs text-paper-muted">
        {t("Du", "From")}
        <input type="date" name="debut" required defaultValue={aujourdhui} min={aujourdhui} className={`${CHAMP} mt-1`} />
      </label>
      <label className="text-xs text-paper-muted">
        {t("Au (un an au plus)", "To (one year at most)")}
        <input type="date" name="fin" required min={aujourdhui} className={`${CHAMP} mt-1`} />
      </label>
      <label className="text-xs text-paper-muted">
        {t("Objet (facultatif)", "Purpose (optional)")}
        <input name="objet" maxLength={500} placeholder={t("Ex. intérim pendant les congés", "E.g. acting during leave")} className={`${CHAMP} mt-1`} />
      </label>
      <label className="text-xs text-paper-muted">
        {t("Référence de l'acte de délégation (facultatif)", "Reference of the delegation act (optional)")}
        <input name="reference_acte" maxLength={120} placeholder={t("Ex. Décision n° 012/2026", "E.g. Decision No. 012/2026")} className={`${CHAMP} mt-1`} />
      </label>
      <div className="sm:col-span-2">
        <button type="submit" disabled={enCours} className={BOUTON}>
          {t("Déléguer ma signature", "Delegate my signature")}
        </button>
        <Message resultat={resultat} />
      </div>
    </form>
  );
}

export function RevocationDelegation({ delegationId }: { delegationId: string }) {
  const router = useRouter();
  const { t } = useTraduction();
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState<ResultatAction | null>(null);

  if (!ouvert) {
    return (
      <button type="button" onClick={() => setOuvert(true)} className="text-xs font-medium text-red-700 hover:underline">
        {t("Révoquer", "Revoke")}
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        <input value={motif} onChange={(e) => setMotif(e.target.value)} placeholder={t("Motif", "Reason")} className="min-w-0 flex-1 rounded border border-paper-200 px-2 py-1 text-xs" />
        <button
          type="button"
          disabled={enCours || motif.trim().length < 3}
          onClick={async () => {
            setEnCours(true);
            const r = await revoquerDelegationAction(delegationId, motif);
            setResultat(r);
            setEnCours(false);
            if (!r.erreur) router.refresh();
          }}
          className="rounded bg-red-700 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          {t("Confirmer", "Confirm")}
        </button>
      </div>
      {resultat?.erreur && <span className="text-xs text-red-600">{resultat.erreur}</span>}
    </div>
  );
}
