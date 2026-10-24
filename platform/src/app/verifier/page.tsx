import { redirect } from "next/navigation";
import { traductionServeur } from "@/lib/i18n/serveur";
import { normaliserCode } from "@/lib/signature/commun";

export const dynamic = "force-dynamic";

// Saisie manuelle du code imprimé sous le QR code (tirets, espaces et
// minuscules acceptés).
export default async function PageVerifier({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code: saisie } = await searchParams;
  const { t } = await traductionServeur();
  const code = normaliserCode(saisie);
  if (code) redirect(`/verifier/${code}`);

  return (
    <div className="rounded-lg border border-paper-200 bg-white p-6 shadow-sm">
      <h1 className="font-serif text-xl font-semibold">{t("Vérifier un document signé", "Verify a signed document")}</h1>
      <p className="mt-2 text-sm text-paper-muted">
        {t(
          "Scannez le QR code imprimé à côté de la signature, ou saisissez le code de vérification (12 caractères) inscrit juste en dessous.",
          "Scan the QR code printed next to the signature, or enter the verification code (12 characters) written just below it."
        )}
      </p>
      <form method="get" className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input
          name="code"
          defaultValue={saisie ?? ""}
          required
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="ABCD-EFGH-JKLM"
          aria-label={t("Code de vérification", "Verification code")}
          className="min-w-0 flex-1 rounded-md border border-paper-200 px-3 py-2.5 text-center font-mono text-lg uppercase tracking-widest"
        />
        <button type="submit" className="rounded-md bg-navy-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-900">
          {t("Vérifier", "Verify")}
        </button>
      </form>
      {saisie && (
        <p className="mt-3 text-sm text-red-700">
          {t("Code mal formé : 12 lettres et chiffres, par exemple ABCD-EFGH-JKLM.", "Malformed code: 12 letters and digits, e.g. ABCD-EFGH-JKLM.")}
        </p>
      )}
    </div>
  );
}
