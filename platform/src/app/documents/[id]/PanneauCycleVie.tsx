"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LABEL_NATURE, NATURES } from "@/lib/labels";
import type { NatureDocument } from "@/lib/types";
import { archiverAction, classerAction, nouvelleVersionAction, verifierIntegriteAction } from "./actions";

const BOUTON_SECONDAIRE =
  "rounded-md border border-paper-200 px-4 py-2 text-sm font-medium text-[#1c2029] hover:bg-paper-50 disabled:opacity-50";

// Changement de nature (plan de classement), tant que le document n'est pas archivé.
export function ChoixNature({ documentId, nature }: { documentId: string; nature: NatureDocument | null }) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function changer(nouvelle: string) {
    setEnCours(true);
    setErreur(null);
    const resultat = await classerAction(documentId, nouvelle);
    setEnCours(false);
    if (resultat.erreur) setErreur(resultat.erreur);
    else router.refresh();
  }

  return (
    <span className="flex flex-col gap-1">
      <select
        value={nature ?? ""}
        disabled={enCours}
        onChange={(e) => changer(e.target.value)}
        className="w-full max-w-xs rounded-md border border-paper-200 bg-white px-2 py-1 text-sm"
      >
        {!nature && (
          <option value="" disabled>
            Non classé — choisir…
          </option>
        )}
        {NATURES.map((n) => (
          <option key={n} value={n}>
            {LABEL_NATURE[n]}
          </option>
        ))}
      </select>
      {erreur && <span className="text-xs text-red-600">{erreur}</span>}
    </span>
  );
}

export function ControleIntegrite({ documentId, empreinte }: { documentId: string; empreinte: string }) {
  const [resultat, setResultat] = useState<{ conforme?: boolean; erreur: string | null } | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function verifier() {
    setEnCours(true);
    setResultat(await verifierIntegriteAction(documentId));
    setEnCours(false);
  }

  return (
    <span className="flex flex-col gap-1.5">
      <code className="break-all text-[11px] text-paper-muted">{empreinte}</code>
      <span className="flex flex-wrap items-center gap-2">
        <button onClick={verifier} disabled={enCours} className="rounded border border-paper-200 px-2 py-0.5 text-xs hover:bg-paper-50 disabled:opacity-50">
          {enCours ? "Vérification…" : "Vérifier l'intégrité"}
        </button>
        {resultat?.erreur && <span className="text-xs text-red-600">{resultat.erreur}</span>}
        {resultat && !resultat.erreur && (
          <span className={`text-xs font-semibold ${resultat.conforme ? "text-emerald-700" : "text-red-700"}`}>
            {resultat.conforme
              ? "✓ Conforme : le document n'a pas été altéré depuis son archivage."
              : "✗ Non conforme : le contenu ou le fichier diffère de l'état scellé."}
          </span>
        )}
      </span>
    </span>
  );
}

export function ActionsCycleVie({
  documentId,
  peutArchiver,
  peutReviser,
  archive,
}: {
  documentId: string;
  peutArchiver: boolean;
  peutReviser: boolean;
  archive: boolean;
}) {
  const router = useRouter();
  const [confirmer, setConfirmer] = useState(false);
  const [motif, setMotif] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  if (!peutArchiver && !peutReviser) return null;

  async function archiver() {
    setEnCours(true);
    setErreur(null);
    const resultat = await archiverAction(documentId, motif.trim());
    setEnCours(false);
    if (resultat.erreur) {
      setErreur(resultat.erreur);
      return;
    }
    setConfirmer(false);
    router.refresh();
  }

  async function reviser() {
    setEnCours(true);
    setErreur(null);
    const resultat = await nouvelleVersionAction(documentId);
    setEnCours(false);
    if (resultat.erreur || !resultat.id) {
      setErreur(resultat.erreur ?? "Création impossible.");
      return;
    }
    router.push(`/documents/${resultat.id}`);
  }

  return (
    <div className="mt-4 space-y-3 border-t border-paper-200 pt-4">
      <div className="flex flex-wrap gap-2">
        {peutReviser && (
          <button onClick={reviser} disabled={enCours} className={BOUTON_SECONDAIRE}>
            Créer une nouvelle version
          </button>
        )}
        {peutArchiver && !confirmer && (
          <button
            onClick={() => setConfirmer(true)}
            disabled={enCours}
            className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
          >
            Archiver
          </button>
        )}
      </div>

      {peutReviser && (
        <p className="text-xs text-paper-soft">
          {archive
            ? "Ce document est figé. Une nouvelle version en reprend le contenu dans un brouillon, qui suivra à nouveau le circuit de validation."
            : "Une nouvelle version reprend ce contenu dans un brouillon ; la version actuelle reste en vigueur jusqu'à la publication de la suivante."}
        </p>
      )}

      {confirmer && (
        <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3 text-sm">
          <p className="mb-2 font-semibold text-indigo-900">Archiver définitivement ce document ?</p>
          <p className="mb-2 text-indigo-900/80">
            Il deviendra non modifiable pour tout le monde, administrateur compris, et sera scellé par une empreinte
            numérique. Il restera consultable par les mêmes personnes, et pourra encore donner lieu à une nouvelle version.
          </p>
          <input
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Motif (facultatif) : dossier clos, remplacé par…"
            className="mb-2 w-full rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={archiver}
              disabled={enCours}
              className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
            >
              {enCours ? "Archivage…" : "Confirmer l'archivage"}
            </button>
            <button onClick={() => setConfirmer(false)} disabled={enCours} className={BOUTON_SECONDAIRE}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
    </div>
  );
}
