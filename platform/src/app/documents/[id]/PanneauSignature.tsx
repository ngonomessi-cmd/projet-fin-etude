"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { useTraduction } from "@/components/i18n/Langue";
import {
  COULEUR_STATUT_SIGNATURE,
  formaterCode,
  intituleQualite,
  libelleNatureSignature,
  libelleStatutSignature,
  lignesQualite,
  type QualiteDisponible,
  type Signature,
} from "@/lib/signature/commun";
import {
  enregistrerOriginalAction,
  preparerBonASignerAction,
  revoquerSignatureAction,
  signerElectroniquementAction,
  type ResultatSignature,
} from "./signature-actions";

const BOUTON_PRINCIPAL = "rounded-md bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50";
const BOUTON_SECONDAIRE =
  "rounded-md border border-paper-200 bg-white px-4 py-2 text-sm font-medium text-[#1c2029] hover:bg-paper-50 disabled:opacity-50";
const CHAMP = "rounded-md border border-paper-200 bg-white px-3 py-2 text-sm";

export type QualiteBat = { qualite: string; intitule: string; intitule_en: string };

export function PanneauSignature({
  documentId,
  signatures,
  peutSigner,
  raisonNonSignable,
  qualitesSignataire,
  qualitesBat,
  aSpecimen,
  peutDeposerOriginal,
  peutRevoquer,
}: {
  documentId: string;
  signatures: Signature[];
  peutSigner: boolean;
  raisonNonSignable: string | null;
  qualitesSignataire: QualiteDisponible[];
  qualitesBat: QualiteBat[];
  aSpecimen: boolean;
  peutDeposerOriginal: boolean;
  peutRevoquer: boolean;
}) {
  const router = useRouter();
  const { t, langue, dl } = useTraduction();
  const [resultat, setResultat] = useState<ResultatSignature | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [code, setCode] = useState("");
  const [qualite, setQualite] = useState(qualitesSignataire[0]?.qualite ?? "");
  const [qualiteBat, setQualiteBat] = useState(qualitesBat[0]?.qualite ?? "");
  const [fichier, setFichier] = useState<File | null>(null);
  const [motif, setMotif] = useState("");
  const [motifRevocation, setMotifRevocation] = useState("");

  const vivante = signatures.find((s) => ["en_preparation", "attente_original", "valide"].includes(s.statut)) ?? null;
  const historique = signatures.filter((s) => s !== vivante);
  const date = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString(dl, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  async function executer(action: () => Promise<ResultatSignature>) {
    setEnCours(true);
    setResultat(null);
    const r = await action();
    setResultat(r);
    setEnCours(false);
    if (!r.erreur) {
      setCode("");
      setFichier(null);
      setMotif("");
      setMotifRevocation("");
      router.refresh();
    }
  }

  async function deposerOriginal(signatureId: string) {
    if (!fichier) return;
    await executer(async () => {
      if (fichier.type !== "application/pdf" && !fichier.name.toLowerCase().endsWith(".pdf")) {
        return { erreur: t("Le scan doit être un fichier PDF.", "The scan must be a PDF file.") };
      }
      if (fichier.size > 15 * 1024 * 1024) return { erreur: t("Fichier trop volumineux (15 Mo au plus).", "File too large (15 MB at most).") };
      const chemin = `originaux/${signatureId}/${crypto.randomUUID()}.pdf`;
      const { error } = await creerClientNavigateur()
        .storage.from("signatures")
        .upload(chemin, fichier, { contentType: "application/pdf", upsert: false });
      if (error) return { erreur: t("Dépôt du fichier impossible.", "Could not upload the file.") + ` (${error.message})` };
      return enregistrerOriginalAction(documentId, signatureId, chemin, motif);
    });
  }

  const libelleQualiteDispo = (q: QualiteDisponible) =>
    q.delegation_id
      ? `${lignesQualite(q, langue)[0].replace(/,$/, "")}, ${t("par délégation", "by delegation")} (${t("jusqu'au", "until")} ${new Date(q.fin!).toLocaleDateString(dl)})`
      : intituleQualite(q, langue);

  return (
    <section className="mt-6 rounded-lg border border-paper-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-3 flex items-center gap-2 font-serif text-base font-semibold">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M3 17c2.5-4 4.5-9 6-9s-1 8 1 8 3-5 4.5-5S15 15 17 15s2-2 4-2" />
          <path d="M3 21h18" />
        </svg>
        {t("Signature", "Signature")}
      </h2>

      {vivante && (
        <div className="rounded-md border border-paper-200 bg-paper-50 p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-navy-950">{t("N°", "No.")} {vivante.numero}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${COULEUR_STATUT_SIGNATURE[vivante.statut]}`}>
              {libelleStatutSignature(vivante.statut, langue)}
            </span>
            <span className="text-xs text-paper-muted">{libelleNatureSignature(vivante.nature, langue)}</span>
          </div>
          <p className="mt-1.5 text-paper-muted">
            {vivante.titre_delegataire
              ? t(`${intituleQualite(vivante, "fr")} — par délégation : ${vivante.titre_delegataire}`, `${intituleQualite(vivante, "en")} — by delegation: ${vivante.titre_delegataire}`)
              : intituleQualite(vivante, langue)}
            {vivante.nature === "electronique" && vivante.signataire_nom && (
              <>
                {" · "}
                {t("signé par", "signed by")} <strong className="text-[#1c2029]">{vivante.signataire_nom}</strong> {t("le", "on")} {date(vivante.signe_le)}
              </>
            )}
            {vivante.nature === "manuscrite" && (
              <>
                {" · "}
                {t("bon à signer préparé par", "print-for-signature copy prepared by")} {vivante.cree_par_nom ?? "—"} {t("le", "on")} {date(vivante.cree_le)}
                {vivante.original_depose_le && (
                  <>
                    {" · "}
                    {t("original déposé le", "original uploaded on")} {date(vivante.original_depose_le)}
                  </>
                )}
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-paper-soft">
            {t("Code de vérification", "Verification code")} : <span className="font-mono">{formaterCode(vivante.code)}</span>
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {vivante.chemin_pdf && (
              <a href={`/signatures/fichier/${vivante.id}?quoi=pdf`} className={BOUTON_SECONDAIRE}>
                ⬇ {vivante.nature === "electronique" ? t("PDF signé", "Signed PDF") : t("Bon à signer (à imprimer)", "Print-for-signature copy")}
              </a>
            )}
            {vivante.chemin_original && (
              <a href={`/signatures/fichier/${vivante.id}?quoi=original`} className={BOUTON_SECONDAIRE}>
                ⬇ {t("Original signé (scan)", "Signed original (scan)")}
              </a>
            )}
            <a href={`/verifier/${vivante.code}`} target="_blank" rel="noopener noreferrer" className={BOUTON_SECONDAIRE}>
              {t("Page de vérification ↗", "Verification page ↗")}
            </a>
          </div>

          {peutDeposerOriginal && vivante.nature === "manuscrite" && (
            <div className="mt-4 border-t border-paper-200 pt-3">
              <p className="mb-2 text-sm font-medium text-[#1c2029]">
                {vivante.chemin_original
                  ? t("Remplacer l'original signé", "Replace the signed original")
                  : t("Déposer l'original signé et cacheté (scan PDF)", "Upload the signed and stamped original (PDF scan)")}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
                  className="min-w-0 text-sm file:mr-3 file:rounded-md file:border file:border-paper-200 file:bg-white file:px-3 file:py-1.5 file:text-sm"
                />
                {vivante.chemin_original && (
                  <input
                    value={motif}
                    onChange={(e) => setMotif(e.target.value)}
                    placeholder={t("Motif du remplacement (obligatoire)", "Reason for replacement (required)")}
                    className={`${CHAMP} min-w-0 flex-1`}
                  />
                )}
                <button
                  type="button"
                  disabled={enCours || !fichier || (Boolean(vivante.chemin_original) && motif.trim().length < 3)}
                  onClick={() => deposerOriginal(vivante.id)}
                  className={BOUTON_PRINCIPAL}
                >
                  {enCours ? t("Contrôle du fichier…", "Checking the file…") : t("Déposer", "Upload")}
                </button>
              </div>
            </div>
          )}

          {peutRevoquer && vivante.statut !== "en_preparation" && (
            <details className="mt-4 border-t border-paper-200 pt-3">
              <summary className="cursor-pointer text-sm font-medium text-red-700">
                {vivante.statut === "attente_original" ? t("Annuler ce bon à signer", "Cancel this print-for-signature copy") : t("Révoquer la signature", "Revoke the signature")}
              </summary>
              <p className="mt-2 text-xs text-paper-muted">
                {t(
                  "La signature restera au registre avec la mention « révoquée » ; la page de vérification l'indiquera aussitôt. Le document pourra ensuite être signé de nouveau.",
                  "The signature stays in the register marked \"revoked\"; the verification page shows it at once. The document can then be signed again."
                )}
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  value={motifRevocation}
                  onChange={(e) => setMotifRevocation(e.target.value)}
                  placeholder={t("Motif (obligatoire)", "Reason (required)")}
                  className={`${CHAMP} min-w-0 flex-1`}
                />
                <button
                  type="button"
                  disabled={enCours || motifRevocation.trim().length < 5}
                  onClick={() => executer(() => revoquerSignatureAction(documentId, vivante.id, motifRevocation))}
                  className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
                >
                  {t("Confirmer", "Confirm")}
                </button>
              </div>
            </details>
          )}
        </div>
      )}

      {!vivante && !peutSigner && raisonNonSignable && <p className="text-sm text-paper-muted">{raisonNonSignable}</p>}

      {!vivante && peutSigner && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {qualitesSignataire.length > 0 && (
            <div className="min-w-0 rounded-md border border-paper-200 p-3">
              <h3 className="text-sm font-semibold text-[#1c2029]">{t("Signature électronique", "Electronic signature")}</h3>
              <p className="mt-1 text-xs text-paper-muted">
                {t(
                  "Votre signature, votre nom, la date, un numéro et un QR code de vérification sont apposés sur le PDF du document.",
                  "Your signature, name, the date, a number and a verification QR code are added to the document's PDF."
                )}
              </p>
              {!aSpecimen ? (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {t("Enregistrez d'abord l'image de votre signature : ", "First record the image of your signature: ")}
                  <Link href="/signatures" className="font-semibold underline">
                    {t("page Signatures", "Signatures page")}
                  </Link>
                  .
                </p>
              ) : (
                <form
                  className="mt-3 flex flex-col gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    executer(() => signerElectroniquementAction(documentId, qualite, code));
                  }}
                >
                  {qualitesSignataire.length > 1 ? (
                    <select value={qualite} onChange={(e) => setQualite(e.target.value)} className={CHAMP}>
                      {qualitesSignataire.map((q) => (
                        <option key={q.qualite + (q.delegation_id ?? "")} value={q.qualite}>
                          {libelleQualiteDispo(q)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-[#1c2029]">
                      {t("Signer en qualité de", "Sign as")} : <strong>{libelleQualiteDispo(qualitesSignataire[0])}</strong>
                    </p>
                  )}
                  <label className="text-xs text-paper-muted">
                    {t("Code Google Authenticator (redemandé à chaque signature)", "Google Authenticator code (asked for each signature)")}
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      className="mt-1 block w-full rounded-md border border-paper-200 px-3 py-2 text-center font-mono text-lg tracking-[0.4em]"
                    />
                  </label>
                  <button type="submit" disabled={enCours || code.length !== 6} className={BOUTON_PRINCIPAL}>
                    {enCours ? t("Signature en cours…", "Signing…") : t("Signer le document", "Sign the document")}
                  </button>
                </form>
              )}
            </div>
          )}

          {qualitesBat.length > 0 && (
            <div className="min-w-0 rounded-md border border-paper-200 p-3">
              <h3 className="text-sm font-semibold text-[#1c2029]">{t("Signature manuscrite et cachet", "Handwritten signature and stamp")}</h3>
              <p className="mt-1 text-xs text-paper-muted">
                {t(
                  "Pour les documents officiels : un bon à signer numéroté, avec QR code et zone « Signature et cachet », est produit. Imprimez-le, faites-le signer et cacheter, puis déposez le scan ici.",
                  "For official documents: a numbered print-for-signature copy, with QR code and a \"Signature and stamp\" box, is produced. Print it, have it signed and stamped, then upload the scan here."
                )}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {qualitesBat.length > 1 && (
                  <select value={qualiteBat} onChange={(e) => setQualiteBat(e.target.value)} className={CHAMP}>
                    {qualitesBat.map((q) => (
                      <option key={q.qualite} value={q.qualite}>
                        {intituleQualite(q, langue)}
                      </option>
                    ))}
                  </select>
                )}
                {qualitesBat.length === 1 && (
                  <p className="text-sm text-[#1c2029]">
                    {t("Signataire", "Signatory")} : <strong>{intituleQualite(qualitesBat[0], langue)}</strong>
                  </p>
                )}
                <button
                  type="button"
                  disabled={enCours || !qualiteBat}
                  onClick={() => executer(() => preparerBonASignerAction(documentId, qualiteBat))}
                  className={BOUTON_SECONDAIRE}
                >
                  {enCours ? t("Préparation…", "Preparing…") : t("Préparer le bon à signer", "Prepare the print-for-signature copy")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {resultat && (
        <p className={`mt-3 rounded-md px-3 py-2 text-sm ${resultat.erreur ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>
          {resultat.erreur ?? resultat.succes}
        </p>
      )}

      {historique.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-medium text-paper-muted">
            {t("Signatures précédentes", "Previous signatures")} ({historique.length})
          </summary>
          <ul className="mt-2 space-y-1 text-xs text-paper-muted">
            {historique.map((s) => (
              <li key={s.id}>
                <span className="font-mono">{s.numero}</span> — {libelleStatutSignature(s.statut, langue)}
                {s.revoquee_le && ` ${t("le", "on")} ${date(s.revoquee_le)}`}
                {s.motif_revocation && ` (${s.motif_revocation})`}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
