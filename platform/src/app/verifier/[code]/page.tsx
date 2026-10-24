import Link from "next/link";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { traductionServeur } from "@/lib/i18n/serveur";
import { SIGLE_ORGANISATION, nomOrganisation } from "@/lib/organisation";
import {
  dateHeureSignature,
  formaterCode,
  libelleNatureSignature,
  lignesQualite,
  normaliserCode,
  type NatureSignature,
  type StatutSignature,
} from "@/lib/signature/commun";
import { ComparerFichier } from "./ComparerFichier";

// Une révocation doit se voir aussitôt : jamais de cache.
export const dynamic = "force-dynamic";

type Resultat = {
  limite?: boolean;
  trouve?: boolean;
  organisation?: string;
  numero?: string;
  statut?: StatutSignature;
  nature?: NatureSignature;
  intitule?: string;
  intitule_en?: string;
  titre_delegataire?: string | null;
  signataire_nom?: string | null;
  cree_le?: string;
  signe_le?: string | null;
  original_depose_le?: string | null;
  revoquee_le?: string | null;
  empreinte_pdf?: string | null;
  empreinte_original?: string | null;
};

// Empreinte salée de l'adresse IP, pour le plafond de 60 vérifications par
// heure : l'adresse elle-même n'est jamais enregistrée.
async function empreinteIp(): Promise<string> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "inconnue";
  const sel = process.env.SIGNATURE_SEL_IP || process.env.SUPABASE_SERVICE_ROLE_KEY || "ged";
  return createHash("sha256").update(`${sel}:${ip}`).digest("hex");
}

export default async function PageVerification({ params }: { params: Promise<{ code: string }> }) {
  const { code: brut } = await params;
  const { langue, t } = await traductionServeur();
  const code = normaliserCode(decodeURIComponent(brut));
  if (!code) redirect(`/verifier?code=${encodeURIComponent(brut)}`);
  if (code !== brut) redirect(`/verifier/${code}`);

  const { data, error } = await creerClientAdmin().rpc("verifier_signature", { p_code: code, p_ip_hash: await empreinteIp() });
  const r = (data ?? {}) as Resultat;
  const quand = (iso: string | null | undefined) => {
    if (!iso) return "—";
    const d = dateHeureSignature(iso, langue);
    return langue === "en" ? `${d.date} at ${d.heure} (${d.ville} time)` : `${d.date} à ${d.heure.replace(":", " h ")} (heure de ${d.ville})`;
  };

  let etat: { titre: string; texte: string; classe: string; icone: string };
  if (error) {
    etat = {
      titre: t("Vérification indisponible", "Verification unavailable"),
      texte: t("Le service de vérification ne répond pas. Réessayez dans quelques instants.", "The verification service is not responding. Try again shortly."),
      classe: "border-paper-200 bg-paper-50 text-paper-muted",
      icone: "…",
    };
  } else if (r.limite) {
    etat = {
      titre: t("Trop de vérifications", "Too many checks"),
      texte: t("Trop de vérifications depuis votre connexion : réessayez dans une heure.", "Too many checks from your connection: try again in an hour."),
      classe: "border-amber-200 bg-amber-50 text-amber-900",
      icone: "!",
    };
  } else if (!r.trouve) {
    etat = {
      titre: t("Code inconnu", "Unknown code"),
      texte: t(
        "Aucun document signé ne correspond à ce code. Vérifiez la saisie ; si elle est exacte, le document n'a pas été signé par notre plateforme.",
        "No signed document matches this code. Check what you typed; if it is correct, the document was not signed through our platform."
      ),
      classe: "border-red-200 bg-red-50 text-red-800",
      icone: "✗",
    };
  } else if (r.statut === "valide") {
    etat = {
      titre: t("Signature authentique", "Authentic signature"),
      texte: t("Ce numéro correspond à une signature valide, enregistrée au registre.", "This number matches a valid signature, recorded in the register."),
      classe: "border-emerald-200 bg-emerald-50 text-emerald-900",
      icone: "✓",
    };
  } else if (r.statut === "revoquee") {
    etat = {
      titre: t("Signature révoquée", "Signature revoked"),
      texte: t(
        `Cette signature a été révoquée le ${quand(r.revoquee_le)} : le document ne doit plus être considéré comme signé.`,
        `This signature was revoked on ${quand(r.revoquee_le)}: the document must no longer be considered signed.`
      ),
      classe: "border-red-200 bg-red-50 text-red-800",
      icone: "✗",
    };
  } else if (r.statut === "attente_original") {
    etat = {
      titre: t("En attente de l'original signé", "Awaiting the signed original"),
      texte: t(
        "Le document a été préparé pour la signature, mais l'original signé et cacheté n'a pas encore été enregistré. Il n'est pas encore officiel.",
        "The document was prepared for signature, but the signed and stamped original has not been recorded yet. It is not official yet."
      ),
      classe: "border-amber-200 bg-amber-50 text-amber-900",
      icone: "…",
    };
  } else {
    etat = {
      titre: t("Numéro abandonné", "Abandoned number"),
      texte: t("Aucun document n'a été signé sous ce numéro.", "No document was signed under this number."),
      classe: "border-red-200 bg-red-50 text-red-800",
      icone: "✗",
    };
  }

  const organisation = r.organisation === SIGLE_ORGANISATION ? nomOrganisation(langue) : r.organisation;
  const empreintes = [r.empreinte_pdf, r.empreinte_original].filter((e): e is string => Boolean(e));

  return (
    <div className="rounded-lg border border-paper-200 bg-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-paper-muted">{t("Code vérifié", "Code checked")}</p>
      <p className="font-mono text-lg font-semibold text-[#1c2029]">{formaterCode(code)}</p>

      <div className={`mt-4 flex gap-3 rounded-md border p-4 ${etat.classe}`}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70 text-lg font-bold" aria-hidden="true">
          {etat.icone}
        </span>
        <div>
          <p className="font-semibold">{etat.titre}</p>
          <p className="mt-0.5 text-sm">{etat.texte}</p>
        </div>
      </div>

      {r.trouve && r.statut !== "abandonnee" && (
        <dl className="mt-5 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-y-2 [&>dd]:mb-2 sm:[&>dd]:mb-0 [&>dt]:text-paper-muted">
          <dt>{t("Numéro", "Number")}</dt>
          <dd className="font-mono font-semibold">{r.numero}</dd>
          <dt>{t("Organisation", "Organisation")}</dt>
          <dd>{organisation}</dd>
          <dt>{t("Signataire", "Signatory")}</dt>
          <dd>
            {lignesQualite({ intitule: r.intitule ?? "", intitule_en: r.intitule_en ?? "", titre_delegataire: r.titre_delegataire ?? null }, langue).join(" ")}
            {r.signataire_nom && <span className="block font-semibold">{r.signataire_nom}</span>}
          </dd>
          <dt>{t("Nature", "Type")}</dt>
          <dd>{libelleNatureSignature(r.nature ?? "electronique", langue)}</dd>
          {r.signe_le && (
            <>
              <dt>{r.nature === "electronique" ? t("Signé le", "Signed on") : t("Original enregistré le", "Original recorded on")}</dt>
              <dd>{quand(r.nature === "electronique" ? r.signe_le : (r.original_depose_le ?? r.signe_le))}</dd>
            </>
          )}
          {r.statut === "attente_original" && (
            <>
              <dt>{t("Préparé le", "Prepared on")}</dt>
              <dd>{quand(r.cree_le)}</dd>
            </>
          )}
        </dl>
      )}

      {r.trouve && (r.statut === "valide" || r.statut === "revoquee") && empreintes.length > 0 && <ComparerFichier empreintes={empreintes} />}

      <p className="mt-6 text-xs text-paper-soft">
        {t(
          "Pour protéger les informations, cette page n'affiche jamais le titre ni le contenu du document : comparez le numéro ci-dessus avec celui imprimé sur votre document.",
          "To protect information, this page never shows the document's title or content: compare the number above with the one printed on your document."
        )}
      </p>
      <p className="mt-4 text-sm">
        <Link href="/verifier" className="font-medium text-navy-950 underline">
          {t("Vérifier un autre code", "Check another code")}
        </Link>
      </p>
    </div>
  );
}
