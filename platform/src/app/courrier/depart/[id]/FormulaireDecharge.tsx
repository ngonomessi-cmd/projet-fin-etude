"use client";

import { useEffect, useId, useState } from "react";
import { champ } from "@/components/courrier/Alerte";
import { useTraduction } from "@/components/i18n/Langue";
import { NumerisationCourrier } from "../../[id]/NumerisationCourrier";
import { enregistrerDecharge } from "../actions";

// Date et heure d'un instant à Douala (UTC+1 toute l'année), au format du champ « datetime-local » : « 2026-11-03T14:05 ».
function enHeureDeDouala(instant: Date): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Africa/Douala", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    .format(instant)
    .replace(" ", "T");
}

type Props = { departId: string; numero: string; destinataireId: string; destinataireNom: string; expedieLe: string | null; modeEnvoi: string };

/** Décharge d'un destinataire : le fichier rapporté par le coursier (scan ou photos), la date réelle de remise, qui a signé. */
export function FormulaireDecharge({ departId, numero, destinataireId, destinataireNom, expedieLe, modeEnvoi }: Props) {
  const { t } = useTraduction();
  const uid = useId().replace(/:/g, "");
  const [remisLe, setRemisLe] = useState("");
  const [maximum, setMaximum] = useState<string | undefined>(undefined);
  // Valeur initiale et borne choisies au montage seulement (l'heure du serveur et celle du navigateur ne coïncident pas au rendu).
  useEffect(() => {
    setRemisLe(enHeureDeDouala(new Date()));
    setMaximum(enHeureDeDouala(new Date(Date.now() + 5 * 60 * 1000)));
  }, []);

  const modes = [
    { valeur: "main", libelle: t("Remise en main propre", "Hand delivery") },
    { valeur: "coursier", libelle: t("Coursier", "Courier") },
    { valeur: "huissier", libelle: t("Huissier", "Bailiff") },
    { valeur: "poste", libelle: t("Poste", "Post") },
    { valeur: "autre", libelle: t("Autre", "Other") },
  ];

  return (
    <NumerisationCourrier
      compact
      id={departId}
      numero={`${numero}-decharge`}
      enregistrer={enregistrerDecharge}
      natures={[{ valeur: "decharge", libelle: t("Enregistrer la décharge", "Record the receipt") }]}
      titre={`${t("Décharge de", "Receipt from")} ${destinataireNom}`}
      aide={t(
        "Le document signé ou tamponné par le destinataire, rapporté par le coursier ou l'agent. Scanner de bureau : choisissez le PDF. Téléphone : photographiez chaque page, elles seront assemblées en un seul PDF.",
        "The document signed or stamped by the recipient, brought back by the courier or staff member. Desk scanner: choose the PDF. Phone: photograph each page; they will be assembled into a single PDF."
      )}
      messageSucces={t("Décharge enregistrée : le destinataire est accusé.", "Receipt recorded: the recipient is acknowledged.")}
      validerChamps={(extra) => (!extra.remis_le ? "decharge_date" : !extra.recu_par?.trim() ? "decharge_nom" : !extra.mode ? "decharge_mode" : null)}
      champs={
        <div className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="destinataire" value={destinataireId} />
          <div>
            <label htmlFor={`${uid}-remis`} className="mb-1 block text-sm font-medium">{t("Date et heure de remise (heure de Douala)", "Date and time of delivery (Douala time)")}</label>
            <input
              id={`${uid}-remis`} name="remis_le" type="datetime-local" required className={champ}
              value={remisLe} onChange={(e) => setRemisLe(e.target.value)}
              min={expedieLe ? enHeureDeDouala(new Date(expedieLe)) : undefined} max={maximum}
            />
            <p className="mt-1 text-xs text-paper-muted">{t("La date réelle de remise écrite sur la décharge, pas celle de la saisie.", "The actual delivery date written on the receipt, not the date of entry.")}</p>
          </div>
          <div>
            <label htmlFor={`${uid}-mode`} className="mb-1 block text-sm font-medium">{t("Mode de remise", "Delivery method")}</label>
            <select id={`${uid}-mode`} name="mode" required className={champ} defaultValue={modes.some((m) => m.valeur === modeEnvoi) ? modeEnvoi : "main"}>
              {modes.map((m) => <option key={m.valeur} value={m.valeur}>{m.libelle}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${uid}-par`} className="mb-1 block text-sm font-medium">{t("Nom de la personne qui a signé", "Name of the person who signed")}</label>
            <input id={`${uid}-par`} name="recu_par" required maxLength={200} className={champ} autoComplete="off" />
          </div>
          <div>
            <label htmlFor={`${uid}-qualite`} className="mb-1 block text-sm font-medium">{t("Qualité", "Position")} <span className="font-normal text-paper-soft">({t("facultative", "optional")})</span></label>
            <input id={`${uid}-qualite`} name="recu_qualite" maxLength={200} placeholder={t("ex. Chef du secrétariat", "e.g. Head of the secretariat")} className={champ} autoComplete="off" />
          </div>
        </div>
      }
    />
  );
}
