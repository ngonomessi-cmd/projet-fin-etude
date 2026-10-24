"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTraduction } from "@/components/i18n/Langue";
import { enregistrerNomsDepartementsEnAction } from "./actions";

// Nom anglais de chaque département, affiché quand l'interface est en anglais
// (sinon le nom français est repris tel quel).
export function NomsDepartementsEn({ lignes }: { lignes: { departement: string; nomEn: string }[] }) {
  const router = useRouter();
  const { t } = useTraduction();
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function enregistrer(formData: FormData) {
    setEnCours(true);
    setMessage(null);
    const r = await enregistrerNomsDepartementsEnAction(formData);
    setEnCours(false);
    setMessage(r.erreur ? { ok: false, texte: r.erreur } : { ok: true, texte: t("Noms enregistrés.", "Names saved.") });
    if (!r.erreur) router.refresh();
  }

  return (
    <section className="mt-6 rounded-lg border border-paper-200 bg-white p-4 shadow-sm">
      <h2 className="mb-1 font-serif text-base font-semibold">{t("Départements en anglais", "Departments in English")}</h2>
      <p className="mb-3 text-xs text-paper-muted">
        {t(
          "Nom affiché quand l'interface est en anglais. Laissé vide, le nom français est repris.",
          "Name shown when the interface is in English. Left empty, the French name is used."
        )}
      </p>
      {lignes.length === 0 ? (
        <p className="text-sm text-paper-muted">{t("Aucun département pour l'instant.", "No departments yet.")}</p>
      ) : (
        <form action={enregistrer} className="space-y-2">
          {lignes.map((l) => (
            <label key={l.departement} className="grid items-center gap-2 text-sm sm:grid-cols-[1fr_1fr]">
              <span className="text-[#1c2029]">{l.departement}</span>
              <input type="hidden" name="departement" value={l.departement} />
              <input
                name="nom_en"
                defaultValue={l.nomEn}
                placeholder={t("Nom en anglais", "English name")}
                className="rounded-md border border-paper-200 px-3 py-1.5 text-sm"
              />
            </label>
          ))}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={enCours}
              className="rounded-md bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50"
            >
              {enCours ? t("Enregistrement…", "Saving…") : t("Enregistrer", "Save")}
            </button>
            {message && <span className={`text-sm ${message.ok ? "text-emerald-700" : "text-red-600"}`}>{message.texte}</span>}
          </div>
        </form>
      )}
    </section>
  );
}
