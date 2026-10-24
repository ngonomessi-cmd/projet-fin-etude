"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormatAtelier } from "@/lib/types";
import {
  LABEL_FORMAT_COURT,
  normaliserPresentation,
  normaliserTableur,
  normaliserTexte,
} from "@/lib/atelier/contenus";
import { EditeurTexte } from "@/components/atelier/EditeurTexte";
import { EditeurTableur } from "@/components/atelier/EditeurTableur";
import { EditeurPresentation } from "@/components/atelier/EditeurPresentation";
import { enregistrerContenuAction, libererVerrouAction, prendreVerrouAction } from "./actions";
import { useTraduction } from "@/components/i18n/Langue";

type Statut = "pret" | "modifie" | "enregistrement" | "enregistre" | "erreur";

const DELAI_SAUVEGARDE_MS = 2500;
const RENOUVELLEMENT_VERROU_MS = 60_000;

export function AtelierDocument({
  documentId,
  titreInitial,
  format,
  contenuInitial,
  peutEditer,
  archive = false,
  classification,
  organisation,
}: {
  documentId: string;
  titreInitial: string;
  format: FormatAtelier;
  contenuInitial: unknown;
  peutEditer: boolean;
  archive?: boolean;
  classification?: string;
  organisation: string;
}) {
  const router = useRouter();
  const { t, dl } = useTraduction();
  const [titre, setTitre] = useState(titreInitial);
  const [modeEdition, setModeEdition] = useState(false);
  const [verrouAutre, setVerrouAutre] = useState<string | null>(null);
  const [statut, setStatut] = useState<Statut>("pret");
  const [message, setMessage] = useState<string | null>(null);
  const contenu = useRef<unknown>(contenuInitial);
  const titreRef = useRef(titreInitial);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enAttente = useRef(false);

  // Prise du verrou à l'ouverture, renouvelé tant que l'éditeur reste ouvert.
  useEffect(() => {
    if (!peutEditer) return;
    let actif = true;
    const prendre = async () => {
      const etat = await prendreVerrouAction(documentId);
      if (!actif) return;
      if (etat.ok) {
        setModeEdition(true);
        setVerrouAutre(null);
      } else if (etat.motif === "verrouille") {
        setModeEdition(false);
        setVerrouAutre(etat.par ?? t("une autre personne", "someone else"));
      } else {
        setModeEdition(false);
      }
    };
    prendre();
    const intervalle = setInterval(prendre, RENOUVELLEMENT_VERROU_MS);
    return () => {
      actif = false;
      clearInterval(intervalle);
      libererVerrouAction(documentId);
    };
  }, [documentId, peutEditer, t]);

  const enregistrer = useCallback(async () => {
    if (minuteur.current) clearTimeout(minuteur.current);
    if (!enAttente.current) return true;
    enAttente.current = false;
    setStatut("enregistrement");
    const r = await enregistrerContenuAction(documentId, contenu.current, titreRef.current);
    if (r.erreur) {
      enAttente.current = true;
      setStatut("erreur");
      setMessage(r.erreur);
      return false;
    }
    setStatut("enregistre");
    setMessage(r.enregistreLe ? new Date(r.enregistreLe).toLocaleTimeString(dl, { hour: "2-digit", minute: "2-digit" }) : null);
    return true;
  }, [documentId, dl]);

  const signalerModification = useCallback(() => {
    enAttente.current = true;
    setStatut("modifie");
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(enregistrer, DELAI_SAUVEGARDE_MS);
  }, [enregistrer]);

  useEffect(() => {
    const avantDepart = (e: BeforeUnloadEvent) => {
      if (enAttente.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", avantDepart);
    return () => window.removeEventListener("beforeunload", avantDepart);
  }, []);

  async function telecharger(cible: "natif" | "pdf") {
    if (!(await enregistrer())) return;
    window.location.href = `/documents/${documentId}/export?format=${cible}`;
  }

  async function terminer() {
    if (!(await enregistrer())) return;
    await libererVerrouAction(documentId);
    router.push(`/documents/${documentId}`);
    router.refresh();
  }

  const lectureSeule = !modeEdition;
  const libelleStatut: Record<Statut, string> = {
    pret: modeEdition ? t("Prêt", "Ready") : t("Lecture seule", "Read-only"),
    modifie: t("Modifications non enregistrées…", "Unsaved changes…"),
    enregistrement: t("Enregistrement…", "Saving…"),
    enregistre: message ? t(`Enregistré à ${message}`, `Saved at ${message}`) : t("Enregistré", "Saved"),
    erreur: `${t("Échec de l'enregistrement", "Save failed")} : ${message ?? ""}`,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <Link href={`/documents/${documentId}`} className="text-sm text-paper-muted hover:text-gold-600 hover:underline">
            ← {t("Fiche du document", "Document details")}
          </Link>
          <input
            value={titre}
            readOnly={lectureSeule}
            onChange={(e) => {
              setTitre(e.target.value);
              titreRef.current = e.target.value;
              signalerModification();
            }}
            className="mt-1 block w-full truncate rounded-md border border-transparent bg-transparent px-1 py-0.5 font-serif text-2xl font-semibold hover:border-paper-200 focus:border-paper-200 focus:bg-white focus:outline-none read-only:hover:border-transparent"
            aria-label={t("Titre du document", "Document title")}
          />
          <p className={`px-1 text-xs ${statut === "erreur" ? "text-red-600" : "text-paper-soft"}`}>{libelleStatut[statut]}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => telecharger("natif")}
            className="rounded-md border border-paper-200 bg-white px-3 py-2 text-sm font-medium hover:bg-paper-50"
          >
            ⬇ {LABEL_FORMAT_COURT[format]}
          </button>
          <button
            type="button"
            onClick={() => telecharger("pdf")}
            className="rounded-md border border-paper-200 bg-white px-3 py-2 text-sm font-medium hover:bg-paper-50"
          >
            ⬇ PDF
          </button>
          {modeEdition && (
            <button
              type="button"
              onClick={terminer}
              className="rounded-md bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900"
            >
              {t("Enregistrer et fermer", "Save and close")}
            </button>
          )}
        </div>
      </div>

      {verrouAutre && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          {verrouAutre}
          {t(
            " est en train de modifier ce document : il s'affiche en lecture seule. Vous pourrez le modifier dès qu'il ou elle l'aura fermé (vérification automatique chaque minute).",
            " is editing this document: it is shown read-only. You can edit it as soon as they close it (checked automatically every minute)."
          )}
        </p>
      )}
      {!peutEditer && (
        <p
          className={`rounded-md border px-4 py-2.5 text-sm ${
            archive ? "border-indigo-200 bg-indigo-50 text-indigo-900" : "border-paper-200 bg-paper-50 text-paper-muted"
          }`}
        >
          {archive
            ? t(
                "Document archivé : lecture seule définitive. Pour le faire évoluer, créez une nouvelle version depuis sa fiche.",
                "Archived document: permanently read-only. To change it, create a new version from its details page."
              )
            : t(
                "Lecture seule : seuls l'auteur et les co-éditeurs peuvent modifier ce document, tant qu'il n'a pas été soumis à validation.",
                "Read-only: only the author and co-editors can edit this document, until it is submitted for approval."
              )}
        </p>
      )}

      {format === "texte" && (
        <EditeurTexte
          key={String(lectureSeule)}
          contenu={normaliserTexte(contenu.current)}
          lectureSeule={lectureSeule}
          classification={classification}
          onChange={(c) => {
            contenu.current = c;
            signalerModification();
          }}
        />
      )}
      {format === "tableur" && (
        <EditeurTableur
          key={String(lectureSeule)}
          contenu={normaliserTableur(contenu.current)}
          lectureSeule={lectureSeule}
          onChange={(c) => {
            contenu.current = c;
            signalerModification();
          }}
        />
      )}
      {format === "presentation" && (
        <EditeurPresentation
          key={String(lectureSeule)}
          contenu={normaliserPresentation(contenu.current)}
          organisation={organisation}
          lectureSeule={lectureSeule}
          onChange={(c) => {
            contenu.current = c;
            signalerModification();
          }}
        />
      )}
    </div>
  );
}
