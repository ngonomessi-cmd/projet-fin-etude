"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ModeleDocument } from "@/lib/types";
import { LABEL_FORMAT, normaliserPresentation, normaliserTableur, normaliserTexte } from "@/lib/atelier/contenus";
import { EditeurTexte } from "@/components/atelier/EditeurTexte";
import { EditeurTableur } from "@/components/atelier/EditeurTableur";
import { EditeurPresentation } from "@/components/atelier/EditeurPresentation";
import { enregistrerModeleAction, supprimerModeleAction } from "../actions";

export function EditeurModele({ modele, departements, organisation }: { modele: ModeleDocument; departements: string[]; organisation: string }) {
  const router = useRouter();
  const contenu = useRef<unknown>(modele.contenu);
  const [titre, setTitre] = useState(modele.titre);
  const [description, setDescription] = useState(modele.description ?? "");
  const [departement, setDepartement] = useState(modele.departement ?? "");
  const [etat, setEtat] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function enregistrer() {
    setEnCours(true);
    const r = await enregistrerModeleAction(modele.id, { titre, description, departement, contenu: contenu.current });
    setEnCours(false);
    setEtat(r.erreur ?? `Enregistré à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`);
    if (!r.erreur) router.refresh();
  }

  async function supprimer() {
    if (!window.confirm(`Supprimer le modèle « ${modele.titre} » ? Les documents déjà créés à partir de lui ne sont pas touchés.`)) return;
    const r = await supprimerModeleAction(modele.id);
    if (r?.erreur) setEtat(r.erreur);
  }

  const changer = (c: unknown) => {
    contenu.current = c;
    setEtat("Modifications non enregistrées");
  };

  return (
    <div className="space-y-4">
      <Link href="/admin/modeles" className="text-sm text-paper-muted hover:text-gold-600 hover:underline">
        ← Modèles
      </Link>
      <div className="grid gap-3 rounded-lg border border-paper-200 bg-white p-4 shadow-sm sm:grid-cols-[2fr_2fr_1fr]">
        <label className="text-sm">
          <span className="mb-1 block font-medium">Titre du modèle</span>
          <input value={titre} onChange={(e) => setTitre(e.target.value)} className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Description</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Proposé à</span>
          <select value={departement} onChange={(e) => setDepartement(e.target.value)} className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm">
            <option value="">Tous les départements</option>
            {departements.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-2 sm:col-span-3">
          <span className="text-xs text-paper-soft">{LABEL_FORMAT[modele.format]}</span>
          {etat && <span className="text-xs text-paper-muted">· {etat}</span>}
          <button type="button" onClick={supprimer} className="ml-auto rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">
            Supprimer
          </button>
          <button
            type="button"
            onClick={enregistrer}
            disabled={enCours}
            className="rounded-md bg-navy-950 px-4 py-1.5 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50"
          >
            {enCours ? "Enregistrement…" : "Enregistrer le modèle"}
          </button>
        </div>
      </div>

      {modele.format === "texte" && <EditeurTexte contenu={normaliserTexte(modele.contenu)} onChange={changer} />}
      {modele.format === "tableur" && <EditeurTableur contenu={normaliserTableur(modele.contenu)} onChange={changer} />}
      {modele.format === "presentation" && (
        <EditeurPresentation contenu={normaliserPresentation(modele.contenu)} organisation={organisation} onChange={changer} />
      )}
    </div>
  );
}
