"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NATURES, libelles } from "@/lib/labels";
import { useTraduction } from "@/components/i18n/Langue";
import type { NatureDocument } from "@/lib/types";
import { archiverAction, classerAction, nouvelleVersionAction, verifierIntegriteAction } from "./actions";

const BOUTON_SECONDAIRE =
  "rounded-md border border-paper-200 px-4 py-2 text-sm font-medium text-[#1c2029] hover:bg-paper-50 disabled:opacity-50";

// Changement de nature (plan de classement), tant que le document n'est pas archivé.
export function ChoixNature({ documentId, nature }: { documentId: string; nature: NatureDocument | null }) {
  const router = useRouter();
  const { t, langue } = useTraduction();
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
            {t("Non classé — choisir…", "Unclassified — choose…")}
          </option>
        )}
        {NATURES.map((n) => (
          <option key={n} value={n}>
            {libelles(langue).nature[n]}
          </option>
        ))}
      </select>
      {erreur && <span className="text-xs text-red-600">{erreur}</span>}
    </span>
  );
}

export function ControleIntegrite({ documentId, empreinte }: { documentId: string; empreinte: string }) {
  const [resultat, setResultat] = useState<{ conforme?: boolean; erreur: string | null } | null>(null);
  const { t } = useTraduction();
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
          {enCours ? t("Vérification…", "Checking…") : t("Vérifier l'intégrité", "Check integrity")}
        </button>
        {resultat?.erreur && <span className="text-xs text-red-600">{resultat.erreur}</span>}
        {resultat && !resultat.erreur && (
          <span className={`text-xs font-semibold ${resultat.conforme ? "text-emerald-700" : "text-red-700"}`}>
            {resultat.conforme
              ? t("✓ Conforme : le document n'a pas été altéré depuis son archivage.", "✓ Intact: the document has not been altered since it was archived.")
              : t("✗ Non conforme : le contenu ou le fichier diffère de l'état scellé.", "✗ Altered: the content or file differs from the sealed state.")}
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
  const { t } = useTraduction();
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
      setErreur(resultat.erreur ?? t("Création impossible.", "Could not create it."));
      return;
    }
    router.push(`/documents/${resultat.id}`);
  }

  return (
    <div className="mt-4 space-y-3 border-t border-paper-200 pt-4">
      <div className="flex flex-wrap gap-2">
        {peutReviser && (
          <button onClick={reviser} disabled={enCours} className={BOUTON_SECONDAIRE}>
            {t("Créer une nouvelle version", "Create a new version")}
          </button>
        )}
        {peutArchiver && !confirmer && (
          <button
            onClick={() => setConfirmer(true)}
            disabled={enCours}
            className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
          >
            {t("Archiver", "Archive")}
          </button>
        )}
      </div>

      {peutReviser && (
        <p className="text-xs text-paper-soft">
          {archive
            ? t(
                "Ce document est figé. Une nouvelle version en reprend le contenu dans un brouillon, qui suivra à nouveau le circuit de validation.",
                "This document is frozen. A new version copies its content into a draft, which goes through the approval workflow again."
              )
            : t(
                "Une nouvelle version reprend ce contenu dans un brouillon ; la version actuelle reste en vigueur jusqu'à la publication de la suivante.",
                "A new version copies this content into a draft; the current version stays in force until the next one is published."
              )}
        </p>
      )}

      {confirmer && (
        <div className="rounded-md border border-indigo-200 bg-indigo-50 p-3 text-sm">
          <p className="mb-2 font-semibold text-indigo-900">{t("Archiver définitivement ce document ?", "Permanently archive this document?")}</p>
          <p className="mb-2 text-indigo-900/80">
            {t(
              "Il deviendra non modifiable pour tout le monde, administrateur compris, et sera scellé par une empreinte numérique. Il restera consultable par les mêmes personnes, et pourra encore donner lieu à une nouvelle version.",
              "It will become uneditable for everyone, administrators included, and will be sealed with a digital fingerprint. The same people will still be able to read it, and it can still lead to a new version."
            )}
          </p>
          <input
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder={t("Motif (facultatif) : dossier clos, remplacé par…", "Reason (optional): case closed, replaced by…")}
            className="mb-2 w-full rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={archiver}
              disabled={enCours}
              className="rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-50"
            >
              {enCours ? t("Archivage…", "Archiving…") : t("Confirmer l'archivage", "Confirm archiving")}
            </button>
            <button onClick={() => setConfirmer(false)} disabled={enCours} className={BOUTON_SECONDAIRE}>
              {t("Annuler", "Cancel")}
            </button>
          </div>
        </div>
      )}

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
    </div>
  );
}
