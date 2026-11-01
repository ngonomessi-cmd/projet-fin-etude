"use client";

import { useState } from "react";
import { boutonDiscret, boutonPrincipal, carte, champ } from "@/components/courrier/Alerte";
import { useTraduction } from "@/components/i18n/Langue";
import { en, MODES_ENVOI } from "@/lib/courrier/constantes";
import { demanderExpedition, enregistrerDepart } from "../actions";

export type Option = { id: string; libelle: string };
type Ligne = { cle: string; nom: string; adresse: string; role: "destinataire" | "ampliation" };

// Deux usages du même formulaire :
//  * « demande » : un agent demande l'expédition d'un document VALIDÉ ;
//  * « direct »  : le service du courrier enregistre une lettre déjà signée sur papier.
export function FormulaireDepart({
  usage, document, objetInitial, departements, arrivees, arriveeInitiale,
}: {
  usage: "demande" | "direct";
  document?: string;
  objetInitial: string;
  departements: Option[];
  arrivees: Option[];
  arriveeInitiale?: string;
}) {
  const { t, langue } = useTraduction();
  const nouvelle = (role: Ligne["role"] = "destinataire"): Ligne => ({ cle: crypto.randomUUID(), nom: "", adresse: "", role });
  const [lignes, setLignes] = useState<Ligne[]>(() => [{ cle: "premiere", nom: "", adresse: "", role: "destinataire" }]);
  const [ar, setAr] = useState(false);
  const maj = (cle: string, changement: Partial<Ligne>) => setLignes((l) => l.map((x) => (x.cle === cle ? { ...x, ...changement } : x)));

  return (
    <form action={usage === "demande" ? demanderExpedition : enregistrerDepart} className={`${carte} space-y-6 p-5 sm:p-6`}>
      {usage === "demande" && <input type="hidden" name="document" value={document} />}

      <div>
        <label htmlFor="objet" className="mb-1 block text-sm font-medium">{t("Objet de la lettre", "Subject of the letter")}</label>
        <input id="objet" name="objet" required maxLength={500} defaultValue={objetInitial} className={champ} />
      </div>

      {usage === "direct" && (
        <div>
          <label htmlFor="departement" className="mb-1 block text-sm font-medium">{t("Département émetteur", "Sending department")}</label>
          <select id="departement" name="departement" required defaultValue="" className={champ}>
            <option value="" disabled>{t("Choisir…", "Choose…")}</option>
            {departements.map((s) => <option key={s.id} value={s.id}>{s.libelle}</option>)}
          </select>
        </div>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t("Destinataires et ampliations", "Recipients and copies")}</legend>
        <ul className="space-y-3">
          {lignes.map((l, i) => (
            <li key={l.cle} className="grid gap-2 rounded-md border border-paper-200 p-3 sm:grid-cols-[1fr_1fr_9rem_auto]">
              <div>
                <label htmlFor={`nom-${l.cle}`} className="mb-1 block text-xs text-paper-muted">{t("Nom (institution ou personne)", "Name (institution or person)")}</label>
                <input id={`nom-${l.cle}`} name="dest_nom" maxLength={300} value={l.nom} onChange={(e) => maj(l.cle, { nom: e.target.value })} className={champ} required={i === 0} />
              </div>
              <div>
                <label htmlFor={`adresse-${l.cle}`} className="mb-1 block text-xs text-paper-muted">{t("Adresse", "Address")} <span>({t("facultative", "optional")})</span></label>
                <input id={`adresse-${l.cle}`} name="dest_adresse" maxLength={500} value={l.adresse} onChange={(e) => maj(l.cle, { adresse: e.target.value })} className={champ} />
              </div>
              <div>
                <label htmlFor={`role-${l.cle}`} className="mb-1 block text-xs text-paper-muted">{t("Rôle", "Role")}</label>
                <select id={`role-${l.cle}`} name="dest_role" value={l.role} onChange={(e) => maj(l.cle, { role: e.target.value as Ligne["role"] })} className={champ}>
                  <option value="destinataire">{t("Destinataire", "Recipient")}</option>
                  <option value="ampliation">{t("Ampliation", "Copy")}</option>
                </select>
              </div>
              <div className="flex items-end">
                {lignes.length > 1 && (
                  <button type="button" className="px-2 py-2 text-sm text-red-700" aria-label={`${t("Retirer la ligne", "Remove line")} ${i + 1}`} onClick={() => setLignes((x) => x.filter((y) => y.cle !== l.cle))}>✕</button>
                )}
              </div>
            </li>
          ))}
        </ul>
        {lignes.length < 20 && (
          <button type="button" className={`${boutonDiscret} mt-3`} onClick={() => setLignes((l) => [...l, nouvelle("ampliation")])}>+ {t("Ajouter une ligne", "Add a line")}</button>
        )}
        <p className="mt-2 text-xs text-paper-muted">
          {t(
            "Un destinataire au moins. Les « ampliations » (copies) sont envoyées mais n'empêchent pas de clore le départ sans leur accusé.",
            "At least one recipient. “Copies” are sent too, but the outgoing mail can be closed without their acknowledgement."
          )}
        </p>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="mode" className="mb-1 block text-sm font-medium">{t("Mode d'envoi", "Delivery method")}</label>
          <select id="mode" name="mode" defaultValue="poste" className={champ}>
            {Object.entries(MODES_ENVOI).map(([k, v]) => <option key={k} value={k}>{en(v, langue)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="nb_pieces" className="mb-1 block text-sm font-medium">{t("Nombre de pièces", "Number of items")}</label>
          <input id="nb_pieces" name="nb_pieces" type="number" min={1} max={999} defaultValue={1} className={champ} />
        </div>
        <div>
          <label htmlFor="courrier_arrivee" className="mb-1 block text-sm font-medium">{t("En réponse au courrier", "In reply to mail")} <span className="font-normal text-paper-soft">({t("facultatif", "optional")})</span></label>
          <select id="courrier_arrivee" name="courrier_arrivee" defaultValue={arriveeInitiale ?? ""} className={champ}>
            <option value="">{t("Aucun", "None")}</option>
            {arrivees.map((a) => <option key={a.id} value={a.id}>{a.libelle}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="urgent" value="oui" /> {t("Envoi urgent", "Urgent dispatch")}</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="ar" value="oui" checked={ar} onChange={(e) => setAr(e.target.checked)} /> {t("Accusé de réception souhaité", "Acknowledgement of receipt requested")}</label>
        {ar && (
          <div className="ml-6 flex items-center gap-2 text-sm">
            <label htmlFor="relance_jours">{t("Me le rappeler si rien n'est reçu après", "Remind me if nothing is received after")}</label>
            <input id="relance_jours" name="relance_jours" type="number" min={1} max={365} defaultValue={15} className={`${champ} !w-20`} />
            <span>{t("jours", "days")}</span>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="note" className="mb-1 block text-sm font-medium">{t("Note pour le service du courrier", "Note for the mail service")} <span className="font-normal text-paper-soft">({t("facultative", "optional")})</span></label>
        <textarea id="note" name="note" rows={3} maxLength={1000} className={champ} />
      </div>

      <button type="submit" className={boutonPrincipal}>{usage === "demande" ? t("Transmettre au service du courrier", "Pass to the mail service") : t("Enregistrer le départ", "Register the outgoing mail")}</button>
    </form>
  );
}
