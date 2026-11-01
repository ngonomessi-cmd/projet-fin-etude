"use client";

import { useMemo, useState } from "react";
import { boutonPrincipal, carte, champ } from "@/components/courrier/Alerte";
import { useTraduction } from "@/components/i18n/Langue";
import { CARACTERES, en, MODES, NATURES } from "@/lib/courrier/constantes";
import { enregistrerCourrier } from "../actions";

export type AgentOption = { id: string; nom: string; departement: string };

// Enregistrement d'un pli arrivé : seul ce qui se lit à l'extérieur est saisi. Un pli « personnel »
// exige un destinataire nommé et désactive l'objet : le service n'y lit ni n'y note rien.
export function FormulaireCourrier({ departements, agents }: { departements: string[]; agents: AgentOption[] }) {
  const { t, langue, dep } = useTraduction();
  const [departement, setDepartement] = useState("");
  const [caractere, setCaractere] = useState("ordinaire");
  const personnel = caractere === "personnel";
  const destinataires = useMemo(() => agents.filter((a) => a.departement === departement), [agents, departement]);
  const facultatif = <span className="font-normal text-paper-soft">({t("facultative", "optional")})</span>;

  return (
    <form action={enregistrerCourrier} className={`${carte} space-y-6 p-5 sm:p-6`}>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{t("Caractère du courrier", "Mail type")}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {Object.entries(CARACTERES).map(([cle, c]) => (
            <label key={cle} className="flex cursor-pointer gap-3 rounded-md border border-paper-200 p-3 has-[:checked]:border-navy-950 has-[:checked]:bg-paper-50">
              <input type="radio" name="caractere" value={cle} checked={caractere === cle} onChange={() => setCaractere(cle)} className="mt-1" />
              <span>
                <span className="block text-sm font-medium">{en(c.libelle, langue)}</span>
                <span className="block text-xs text-paper-muted">{en(c.aide, langue)}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="expediteur" className="mb-1 block text-sm font-medium">{t("Expéditeur", "Sender")}</label>
          <input id="expediteur" name="expediteur" required maxLength={300} className={champ} placeholder={t("Ministère des Finances", "Ministry of Finance")} />
        </div>
        <div>
          <label htmlFor="reference" className="mb-1 block text-sm font-medium">{t("Référence de l'expéditeur", "Sender's reference")} {facultatif}</label>
          <input id="reference" name="reference" maxLength={200} className={champ} placeholder="N° 245/MINFI/2026" />
        </div>
        <div>
          <label htmlFor="date_lettre" className="mb-1 block text-sm font-medium">{t("Date de la lettre", "Date of the letter")} {facultatif}</label>
          <input id="date_lettre" name="date_lettre" type="date" className={champ} />
        </div>
        <div>
          <label htmlFor="mode" className="mb-1 block text-sm font-medium">{t("Mode de réception", "How it was received")}</label>
          <select id="mode" name="mode" className={champ} defaultValue="depot">
            {Object.entries(MODES).map(([k, v]) => <option key={k} value={k}>{en(v, langue)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="nature" className="mb-1 block text-sm font-medium">{t("Nature", "Type")}</label>
          <select id="nature" name="nature" className={champ} defaultValue="lettre">
            {Object.entries(NATURES).map(([k, v]) => <option key={k} value={k}>{en(v, langue)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="nb_pieces" className="mb-1 block text-sm font-medium">{t("Nombre de pièces", "Number of items")}</label>
          <input id="nb_pieces" name="nb_pieces" type="number" min={1} max={999} defaultValue={1} className={champ} />
        </div>
        <div>
          <label htmlFor="echeance" className="mb-1 block text-sm font-medium">{t("Échéance de réponse", "Reply deadline")} {facultatif}</label>
          <input id="echeance" name="echeance" type="date" className={champ} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="objet" className="mb-1 block text-sm font-medium">
            {t("Objet apparent", "Visible subject")}{" "}
            <span className="font-normal text-paper-soft">({t("seulement s'il est écrit sur le pli", "only if written on the envelope")})</span>
          </label>
          <input id="objet" name="objet" maxLength={500} disabled={personnel} className={champ} placeholder={personnel ? t("Non saisi pour un pli personnel", "Not recorded for a personal envelope") : ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="departement" className="mb-1 block text-sm font-medium">{t("Département destinataire", "Recipient department")}</label>
          <select id="departement" name="departement" required value={departement} onChange={(e) => setDepartement(e.target.value)} className={champ}>
            <option value="" disabled>{t("Choisir…", "Choose…")}</option>
            {departements.map((d) => <option key={d} value={d}>{dep(d)}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="destinataire" className="mb-1 block text-sm font-medium">
            {t("Personne destinataire", "Recipient")}{" "}
            {personnel ? <span className="font-normal text-red-700">({t("obligatoire", "required")})</span> : facultatif}
          </label>
          <select id="destinataire" name="destinataire" required={personnel} disabled={!departement} className={champ} defaultValue="">
            <option value="">{personnel ? t("Choisir la personne…", "Choose the person…") : t("Aucune : adressé au département", "None: addressed to the department")}</option>
            {destinataires.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}
          </select>
        </div>
      </div>

      <button type="submit" className={boutonPrincipal}>{t("Enregistrer le courrier", "Register the mail")}</button>
    </form>
  );
}
