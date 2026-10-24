"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { creerClientNavigateur } from "@/lib/supabase/client";
import { LogoOrganisation } from "@/components/LogoOrganisation";
import { useTraduction } from "@/components/i18n/Langue";
import { SIGLE_ORGANISATION, nomOrganisation } from "@/lib/organisation";

export default function PageMfa() {
  return (
    <Suspense fallback={null}>
      <DoubleAuthentification />
    </Suspense>
  );
}

type Etape = "chargement" | "inscription" | "verification" | "erreur";

// Seule une adresse interne est acceptée comme destination après validation.
function destinationSure(valeur: string | null): string {
  return valeur && valeur.startsWith("/") && !valeur.startsWith("//") ? valeur : "/documents";
}

// Double authentification obligatoire (Google Authenticator, TOTP) :
// configuration à la première connexion, puis code à 6 chiffres à chaque
// connexion. La session ne passe au niveau « aal2 » — seul niveau accepté
// par l'application et par la base (migration 0027) — qu'après un code valide.
function DoubleAuthentification() {
  const router = useRouter();
  const parametres = useSearchParams();
  const { t, langue } = useTraduction();
  const supabase = useRef(creerClientNavigateur()).current;
  const destination = destinationSure(parametres.get("redirect"));

  const [etape, setEtape] = useState<Etape>("chargement");
  const [facteurId, setFacteurId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const champ = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let actif = true;
    (async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (!actif) return;
      if (error || !data) {
        setErreur(error?.message ?? null);
        setEtape("erreur");
        return;
      }
      const verifie = data.totp.find((f) => f.status === "verified");
      if (verifie) {
        setFacteurId(verifie.id);
        setEtape("verification");
        return;
      }
      // Configuration interrompue lors d'une visite précédente : on repart de zéro.
      for (const f of data.all.filter((f) => f.status !== "verified")) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data: inscription, error: erreurInscription } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Google Authenticator ${new Date().toISOString().slice(0, 19)}`,
        issuer: `GED ${SIGLE_ORGANISATION}`,
      });
      if (!actif) return;
      if (erreurInscription || !inscription) {
        setErreur(erreurInscription?.message ?? null);
        setEtape("erreur");
        return;
      }
      setFacteurId(inscription.id);
      // QR code généré ici depuis le lien otpauth:// (format standard lu par
      // Google Authenticator), plutôt que l'image fournie par le serveur.
      const image = await QRCode.toDataURL(inscription.totp.uri, { margin: 1, width: 384, errorCorrectionLevel: "M" }).catch(
        () => inscription.totp.qr_code
      );
      if (!actif) return;
      setQrCode(image);
      setSecret(inscription.totp.secret);
      setEtape("inscription");
    })();
    return () => {
      actif = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (etape === "verification" || etape === "inscription") champ.current?.focus();
  }, [etape]);

  async function valider(e: React.FormEvent) {
    e.preventDefault();
    if (!facteurId || !/^\d{6}$/.test(code)) {
      setErreur(t("Saisissez les 6 chiffres affichés par Google Authenticator.", "Enter the 6 digits shown by Google Authenticator."));
      return;
    }
    setEnCours(true);
    setErreur(null);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: facteurId, code });
    if (error) {
      setEnCours(false);
      setCode("");
      setErreur(
        t(
          "Code incorrect ou expiré. Vérifiez que l'heure de votre téléphone est automatique, puis saisissez le nouveau code.",
          "Incorrect or expired code. Make sure your phone's time is set automatically, then enter the new code."
        )
      );
      return;
    }
    router.replace(destination);
    router.refresh();
  }

  async function seDeconnecter() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const secretLisible = secret?.replace(/(.{4})/g, "$1 ").trim();

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper-50 px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2.5">
          <LogoOrganisation taille="sm" />
          <div className="min-w-0">
            <div className="font-serif text-sm font-semibold leading-tight">{nomOrganisation(langue)}</div>
            <div className="text-[10px] uppercase tracking-wide text-paper-muted">{t("GED sécurisée", "Secure EDMS")}</div>
          </div>
        </div>

        <div className="rounded-lg border border-paper-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-950 text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </span>
            <div>
              <h1 className="font-serif text-xl font-semibold">{t("Double authentification", "Two-factor authentication")}</h1>
              <p className="text-xs text-paper-muted">{t("Obligatoire pour accéder à la GED", "Required to access the EDMS")}</p>
            </div>
          </div>

          {etape === "chargement" && <p className="py-6 text-center text-sm text-paper-muted">{t("Chargement…", "Loading…")}</p>}

          {etape === "erreur" && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {t(
                "La double authentification n'a pas pu être préparée. Rechargez la page ; si le problème persiste, contactez l'administrateur.",
                "Two-factor authentication could not be set up. Reload the page; if the problem persists, contact the administrator."
              )}
              {erreur && <span className="mt-1 block text-xs opacity-75">{erreur}</span>}
            </p>
          )}

          {etape === "inscription" && (
            <ol className="mb-5 space-y-4 text-sm text-[#1c2029]">
              <li>
                <span className="font-semibold">1. </span>
                {t(
                  "Installez Google Authenticator sur votre téléphone (Play Store ou App Store).",
                  "Install Google Authenticator on your phone (Play Store or App Store)."
                )}
              </li>
              <li>
                <span className="font-semibold">2. </span>
                {t("Dans l'application, touchez « + » puis « Scanner un code QR » :", "In the app, tap \"+\" then \"Scan a QR code\":")}
                {qrCode && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrCode} alt={t("Code QR à scanner", "QR code to scan")} className="mx-auto mt-3 h-48 w-48 rounded-md border border-paper-200 bg-white p-2" />
                )}
                {secretLisible && (
                  <span className="mt-2 block text-center text-xs text-paper-muted">
                    {t("Impossible de scanner ? Saisissez cette clé :", "Can't scan? Enter this key:")}
                    <code className="mt-1 block select-all break-all font-mono text-[13px] tracking-wide text-[#1c2029]">{secretLisible}</code>
                  </span>
                )}
              </li>
              <li>
                <span className="font-semibold">3. </span>
                {t("Saisissez le code à 6 chiffres affiché par l'application :", "Enter the 6-digit code shown by the app:")}
              </li>
            </ol>
          )}

          {etape === "verification" && (
            <p className="mb-5 text-sm text-paper-muted">
              {t(
                "Ouvrez Google Authenticator sur votre téléphone et saisissez le code à 6 chiffres affiché pour cette plateforme.",
                "Open Google Authenticator on your phone and enter the 6-digit code shown for this platform."
              )}
            </p>
          )}

          {(etape === "inscription" || etape === "verification") && (
            <form onSubmit={valider} className="space-y-3">
              <label className="block text-sm">
                <span className="sr-only">{t("Code à 6 chiffres", "6-digit code")}</span>
                <input
                  ref={champ}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  aria-label={t("Code à 6 chiffres", "6-digit code")}
                  className="w-full rounded-md border border-paper-200 px-3 py-3 text-center font-mono text-2xl tracking-[0.5em] focus:border-gold-500 focus:outline-none"
                />
              </label>
              {erreur && <p className="text-sm text-red-600">{erreur}</p>}
              <button
                type="submit"
                disabled={enCours || code.length !== 6}
                className="w-full rounded-md bg-navy-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50"
              >
                {enCours
                  ? t("Vérification…", "Verifying…")
                  : etape === "inscription"
                    ? t("Activer et continuer", "Activate and continue")
                    : t("Valider", "Verify")}
              </button>
            </form>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <button type="button" onClick={seDeconnecter} className="text-paper-muted hover:text-[#1c2029] hover:underline">
            {t("Se déconnecter", "Sign out")}
          </button>
          {etape === "verification" && (
            <span className="text-xs text-paper-soft">
              {t("Téléphone perdu ? Demandez une réinitialisation à l'administrateur.", "Lost your phone? Ask the administrator for a reset.")}
            </span>
          )}
        </div>
      </div>
    </main>
  );
}
