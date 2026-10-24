"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormatAtelier, ModeleDocument } from "@/lib/types";
import { LABEL_FORMAT } from "@/lib/atelier/contenus";
import { basculerActifModeleAction, creerModeleAction } from "./actions";

const PASTILLE: Record<FormatAtelier, string> = {
  texte: "bg-[#2b579a]",
  tableur: "bg-[#217346]",
  presentation: "bg-[#c43e1c]",
};
const LETTRE: Record<FormatAtelier, string> = { texte: "W", tableur: "X", presentation: "P" };

export function ListeModeles({ modeles }: { modeles: ModeleDocument[] }) {
  const router = useRouter();
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
        <p className={`text-sm font-medium ${m.actif ? "" : "text-paper-soft line-through"}`}>{m.titre}</p>
        <p className="truncate text-xs text-paper-muted">
          {LABEL_FORMAT[m.format]}
          {m.departement ? ` · réservé au département ${m.departement}` : " · tous départements"}
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
          <span className="mb-1 block font-medium">Nouveau modèle</span>
          <input name="titre" required placeholder="ex. Fiche d'instruction d'agrément" className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Type</span>
          <select name="format" defaultValue="texte" className="rounded-md border border-paper-200 px-3 py-2 text-sm">
            <option value="texte">Word</option>
            <option value="tableur">Excel</option>
            <option value="presentation">PowerPoint</option>
          </select>
        </label>
        <button type="submit" disabled={enCours} className="rounded-md bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50">
          Créer
        </button>
      </form>
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}

      <section>
        <h2 className="mb-2 font-serif text-base font-semibold">Modèles de l&apos;organisation</h2>
        {propres.length === 0 ? (
          <p className="rounded-lg border border-paper-200 bg-white p-4 text-sm text-paper-muted">
            Aucun modèle propre pour l&apos;instant : créez-en un, ou adaptez un modèle commun ci-dessous.
          </p>
        ) : (
          <ul className="divide-y divide-paper-100 rounded-lg border border-paper-200 bg-white shadow-sm">
            {propres.map((m) =>
              ligne(
                m,
                <>
                  <Link href={`/admin/modeles/${m.id}`} className="rounded border border-paper-200 px-2.5 py-1 hover:bg-paper-50">
                    Modifier
                  </Link>
                  <button type="button" onClick={() => basculer(m)} className="rounded border border-paper-200 px-2.5 py-1 hover:bg-paper-50">
                    {m.actif ? "Désactiver" : "Activer"}
                  </button>
                </>
              )
            )}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-1 font-serif text-base font-semibold">Modèles communs</h2>
        <p className="mb-2 text-xs text-paper-muted">Fournis avec la plateforme et proposés à tous. « Adapter » en crée une copie modifiable pour votre organisation.</p>
        <ul className="divide-y divide-paper-100 rounded-lg border border-paper-200 bg-white shadow-sm">
          {communs.map((m) =>
            ligne(
              m,
              <button type="button" disabled={enCours} onClick={() => adapter(m)} className="rounded border border-paper-200 px-2.5 py-1 hover:bg-paper-50">
                Adapter
              </button>
            )
          )}
        </ul>
      </section>
    </div>
  );
}
