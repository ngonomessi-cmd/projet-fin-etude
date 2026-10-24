"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormatAtelier, ModeleDocument } from "@/lib/types";
import { libelleFormat } from "@/lib/atelier/contenus";
import { PLATEFORME_BILINGUE } from "@/lib/i18n/plateforme";
import { basculerActifModeleAction, creerModeleAction } from "./actions";
import { useTraduction } from "@/components/i18n/Langue";

const PASTILLE: Record<FormatAtelier, string> = {
  texte: "bg-[#2b579a]",
  tableur: "bg-[#217346]",
  presentation: "bg-[#c43e1c]",
};
const LETTRE: Record<FormatAtelier, string> = { texte: "W", tableur: "X", presentation: "P" };

export function ListeModeles({ modeles }: { modeles: ModeleDocument[] }) {
  const router = useRouter();
  const { t, langue } = useTraduction();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const communs = modeles.filter((m) => m.organisation === null);
  const propres = modeles.filter((m) => m.organisation !== null);

  async function creer(formData: FormData) {
    setEnCours(true);
    setErreur(null);
    const r = await creerModeleAction(formData);
    setEnCours(false);
    if (r?.erreur) setErreur(r.erreur);
  }

  async function adapter(m: ModeleDocument) {
    const fd = new FormData();
    fd.set("titre", m.titre);
    fd.set("format", m.format);
    fd.set("depuis", m.id);
    await creer(fd);
  }

  async function basculer(m: ModeleDocument) {
    const r = await basculerActifModeleAction(m.id, !m.actif);
    if (r.erreur) setErreur(r.erreur);
    else router.refresh();
  }

  const ligne = (m: ModeleDocument, actions: React.ReactNode) => (
    <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-bold text-white ${PASTILLE[m.format]}`}>
        {LETTRE[m.format]}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`flex items-center gap-2 text-sm font-medium ${m.actif ? "" : "text-paper-soft line-through"}`}>
          {m.titre}
          {PLATEFORME_BILINGUE && (
            <span className="rounded border border-paper-200 px-1 text-[10px] font-semibold uppercase text-paper-muted">{m.langue ?? "fr"}</span>
          )}
        </p>
        <p className="truncate text-xs text-paper-muted">
          {libelleFormat(m.format, langue)}
          {m.departement
            ? ` · ${t("réservé au département", "restricted to the department")} ${m.departement}`
            : ` · ${t("tous départements", "all departments")}`}
          {m.description ? ` · ${m.description}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 gap-2 text-xs">{actions}</div>
    </li>
  );

  return (
    <div className="space-y-6">
      <form action={creer} className="flex flex-col gap-3 rounded-lg border border-paper-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <label className="flex-1 text-sm">
          <span className="mb-1 block font-medium">{t("Nouveau modèle", "New template")}</span>
          <input name="titre" required placeholder={t("ex. Fiche d'instruction d'agrément", "e.g. Approval review form")} className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Format</span>
          <select name="format" defaultValue="texte" className="rounded-md border border-paper-200 px-3 py-2 text-sm">
            <option value="texte">Word</option>
            <option value="tableur">Excel</option>
            <option value="presentation">PowerPoint</option>
          </select>
        </label>
        {PLATEFORME_BILINGUE && (
          <label className="text-sm">
            <span className="mb-1 block font-medium">{t("Langue", "Language")}</span>
            <select name="langue" defaultValue={langue} className="rounded-md border border-paper-200 px-3 py-2 text-sm">
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </label>
        )}
        <button type="submit" disabled={enCours} className="rounded-md bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50">
          {t("Créer", "Create")}
        </button>
      </form>
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <section>
        <h2 className="mb-2 font-serif text-base font-semibold">{t("Modèles de l'organisation", "Organisation templates")}</h2>
        {propres.length === 0 ? (
          <p className="rounded-lg border border-paper-200 bg-white p-4 text-sm text-paper-muted">
            {t(
              "Aucun modèle propre pour l'instant : créez-en un, ou adaptez un modèle commun ci-dessous.",
              "No templates of your own yet: create one, or adapt a common template below."
            )}
          </p>
        ) : (
          <ul className="divide-y divide-paper-100 rounded-lg border border-paper-200 bg-white shadow-sm">
            {propres.map((m) =>
              ligne(
                m,
                <>
                  <Link href={`/admin/modeles/${m.id}`} className="rounded border border-paper-200 px-2.5 py-1 hover:bg-paper-50">
                    {t("Modifier", "Edit")}
                  </Link>
                  <button type="button" onClick={() => basculer(m)} className="rounded border border-paper-200 px-2.5 py-1 hover:bg-paper-50">
                    {m.actif ? t("Désactiver", "Deactivate") : t("Activer", "Activate")}
                  </button>
                </>
              )
            )}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-1 font-serif text-base font-semibold">{t("Modèles communs", "Common templates")}</h2>
        <p className="mb-2 text-xs text-paper-muted">
          {t(
            "Fournis avec la plateforme et proposés à tous. « Adapter » en crée une copie modifiable pour votre organisation.",
            "Provided with the platform and offered to everyone. \"Adapt\" creates an editable copy for your organisation."
          )}
        </p>
        <ul className="divide-y divide-paper-100 rounded-lg border border-paper-200 bg-white shadow-sm">
          {communs.map((m) =>
            ligne(
              m,
              <button type="button" disabled={enCours} onClick={() => adapter(m)} className="rounded border border-paper-200 px-2.5 py-1 hover:bg-paper-50">
                {t("Adapter", "Adapt")}
              </button>
            )
          )}
        </ul>
      </section>
    </div>
  );
}
