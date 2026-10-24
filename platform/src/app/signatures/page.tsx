import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { traductionServeur } from "@/lib/i18n/serveur";
import type { Profil } from "@/lib/types";
import {
  COULEUR_STATUT_SIGNATURE,
  intituleQualite,
  libelleNatureSignature,
  libelleStatutSignature,
  type QualiteDisponible,
  type Signature,
} from "@/lib/signature/commun";
import { EditeurSpecimen } from "./EditeurSpecimen";
import {
  ChoixTitulaire,
  FormulaireDelegation,
  RevocationDelegation,
  type Personne,
} from "./Gestion";

type Qualite = { code: string; intitule: string; intitule_en: string };
type Titulaire = { qualite: string; profil_id: string; depuis: string };
type Delegation = {
  id: string;
  qualite: string;
  delegant_id: string | null;
  delegataire_id: string | null;
  delegant_nom: string;
  delegataire_nom: string;
  titre_delegataire: string;
  debut: string;
  fin: string;
  objet: string | null;
  reference_acte: string | null;
  revoquee_le: string | null;
  motif_revocation: string | null;
};

const CARTE =
  "rounded-lg border border-paper-200 bg-white p-4 shadow-sm sm:p-5";

export default async function PageSignatures() {
  const supabase = await creerClientServeur();
  const { langue, t, dl } = await traductionServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profilData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();
  const profil = profilData as Profil;
  const admin = profil.role === "administrateur";

  const [
    { data: qualitesData },
    { data: titulairesData },
    { data: personnesData },
    { data: disponiblesData },
    { data: specimenData },
    { data: delegationsData },
    { data: registreData },
  ] = await Promise.all([
    supabase
      .from("qualites_signature")
      .select("code, intitule, intitule_en")
      .order("ordre"),
    supabase.from("titulaires_signature").select("qualite, profil_id, depuis"),
    supabase
      .from("profiles")
      .select("id, nom_complet, role, departement")
      .order("nom_complet"),
    supabase.rpc("qualites_signature_disponibles"),
    supabase
      .from("specimens_signature")
      .select("profil_id")
      .eq("profil_id", user!.id)
      .maybeSingle(),
    supabase
      .from("delegations_signature")
      .select("*")
      .order("cree_le", { ascending: false }),
    supabase
      .from("signatures")
      .select("*")
      .order("cree_le", { ascending: false })
      .limit(200),
  ]);
  const qualites = (qualitesData ?? []) as Qualite[];
  const titulaires = (titulairesData ?? []) as Titulaire[];
  const personnes = (personnesData ?? []) as Personne[];
  const disponibles = (disponiblesData ?? []) as QualiteDisponible[];
  const delegations = (delegationsData ?? []) as Delegation[];
  const registre = (registreData ?? []) as Signature[];

  const nom = (id: string | null) =>
    personnes.find((p) => p.id === id)?.nom_complet ?? "—";
  const qualitesTenues = titulaires
    .filter((x) => x.profil_id === user!.id)
    .map((x) => x.qualite);
  const maintenant = new Date();
  const delegationsAVenir = delegations.filter(
    (d) =>
      d.delegataire_id === user!.id &&
      !d.revoquee_le &&
      new Date(d.fin) > maintenant,
  );
  const estSignataire =
    disponibles.length > 0 ||
    qualitesTenues.length > 0 ||
    delegationsAVenir.length > 0;
  const voitToutesDelegations =
    admin || profil.role === "auditeur" || qualitesTenues.length > 0;
  const delegationsVisibles = voitToutesDelegations
    ? delegations
    : delegations.filter(
        (d) => d.delegataire_id === user!.id || d.delegant_id === user!.id,
      );
  const jour = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(dl, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";
  const libelleQualite = (code: string) => {
    const q = qualites.find((x) => x.code === code);
    return q ? intituleQualite(q, langue) : code;
  };

  function etatDelegation(d: Delegation): {
    texte: string;
    classe: string;
    active: boolean;
  } {
    if (d.revoquee_le)
      return {
        texte: t("Révoquée", "Revoked"),
        classe: "bg-red-50 text-red-700",
        active: false,
      };
    if (new Date(d.fin) <= maintenant)
      return {
        texte: t("Terminée", "Ended"),
        classe: "bg-paper-100 text-paper-muted",
        active: false,
      };
    if (new Date(d.debut) > maintenant)
      return {
        texte: t("À venir", "Upcoming"),
        classe: "bg-amber-50 text-amber-800",
        active: true,
      };
    return {
      texte: t("En cours", "Active"),
      classe: "bg-emerald-50 text-emerald-800",
      active: true,
    };
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <NavBar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <header>
            <h1 className="font-serif text-2xl font-semibold">
              {t("Signatures", "Signatures")}
            </h1>
            <p className="mt-1 text-sm text-paper-muted">
              {t(
                "Signature électronique ou manuscrite des documents validés, délégations et registre. Chaque document signé porte un numéro et un QR code vérifiables par tous sur la page publique de vérification.",
                "Electronic or handwritten signature of approved documents, delegations and register. Each signed document carries a number and a QR code anyone can check on the public verification page.",
              )}{" "}
              <Link
                href="/verifier"
                className="font-medium text-navy-950 underline"
              >
                {t("Vérifier un document", "Verify a document")}
              </Link>
            </p>
          </header>

          {estSignataire && (
            <section className={CARTE}>
              <h2 className="font-serif text-lg font-semibold">
                {t("Ma signature", "My signature")}
              </h2>
              <p className="mb-4 mt-1 text-sm text-paper-muted">
                {disponibles.length > 0
                  ? `${t("Vous signez en qualité de", "You sign as")} : ${disponibles
                      .map((q) =>
                        q.delegation_id
                          ? `${intituleQualite(q, langue)} (${t("par délégation, jusqu'au", "by delegation, until")} ${jour(q.fin)})`
                          : intituleQualite(q, langue),
                      )
                      .join(" · ")}.`
                  : t(
                      "Votre délégation de signature n'a pas encore commencé.",
                      "Your signature delegation has not started yet.",
                    )}
              </p>
              <EditeurSpecimen aSpecimen={Boolean(specimenData)} />
            </section>
          )}

          <section className={CARTE}>
            <h2 className="font-serif text-lg font-semibold">
              {t("Qualités de signature", "Signing capacities")}
            </h2>
            <p className="mb-4 mt-1 text-sm text-paper-muted">
              {t(
                "Seul le titulaire d'une qualité, ou la personne à qui il a délégué sa signature, peut signer à ce titre. Les autres qualités (directions, services…) seront ajoutées avec l'organigramme.",
                "Only the holder of a capacity, or the person they delegated their signature to, can sign in that capacity. Other capacities (departments, units…) will be added with the organisation chart.",
              )}
            </p>
            <ul className="divide-y divide-paper-200">
              {qualites.map((q) => {
                const titulaire = titulaires.find((x) => x.qualite === q.code);
                return (
                  <li
                    key={q.code}
                    className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1c2029]">
                        {intituleQualite(q, langue)}{" "}
                        <span className="font-mono text-xs text-paper-soft">
                          ({q.code})
                        </span>
                      </p>
                      <p className="text-sm text-paper-muted">
                        {titulaire
                          ? `${t("Titulaire", "Holder")} : ${nom(titulaire.profil_id)} — ${t("depuis le", "since")} ${jour(titulaire.depuis)}`
                          : t(
                              "Aucun titulaire désigné.",
                              "No holder appointed.",
                            )}
                      </p>
                    </div>
                    {admin && (
                      <ChoixTitulaire
                        qualite={q.code}
                        titulaireId={titulaire?.profil_id ?? null}
                        personnes={personnes}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          {(qualitesTenues.length > 0 || delegationsVisibles.length > 0) && (
            <section className={CARTE}>
              <h2 className="font-serif text-lg font-semibold">
                {t("Délégations de signature", "Signature delegations")}
              </h2>
              {qualitesTenues.map((code) => (
                <div
                  key={code}
                  className="mt-3 rounded-md border border-paper-200 bg-paper-50 p-3"
                >
                  <p className="mb-3 text-sm font-medium text-[#1c2029]">
                    {t("Déléguer ma signature", "Delegate my signature")} —{" "}
                    {libelleQualite(code)}
                  </p>
                  <FormulaireDelegation
                    qualite={code}
                    personnes={personnes}
                    moiId={user!.id}
                  />
                </div>
              ))}
              {delegationsVisibles.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="tableau-empilable w-full min-w-[640px] text-sm">
                    <thead className="bg-paper-50 text-left text-paper-muted">
                      <tr>
                        <th className="px-3 py-2 font-medium">
                          {t("Délégataire", "Delegate")}
                        </th>
                        <th className="px-3 py-2 font-medium">
                          {t("Qualité", "Capacity")}
                        </th>
                        <th className="px-3 py-2 font-medium">
                          {t("Période", "Period")}
                        </th>
                        <th className="px-3 py-2 font-medium">
                          {t("État", "Status")}
                        </th>
                        <th className="px-3 py-2 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {delegationsVisibles.map((d) => {
                        const etat = etatDelegation(d);
                        const peutRevoquer =
                          etat.active &&
                          (admin || qualitesTenues.includes(d.qualite));
                        return (
                          <tr
                            key={d.id}
                            className="border-t border-paper-200 align-top"
                          >
                            <td className="px-3 py-2">
                              <div className="min-w-0">
                                <p className="font-medium text-[#1c2029]">
                                  {d.delegataire_nom}
                                </p>
                                <p className="text-xs text-paper-muted">
                                  {d.titre_delegataire}
                                </p>
                                {(d.objet || d.reference_acte) && (
                                  <p className="text-xs text-paper-soft">
                                    {[d.objet, d.reference_acte]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td
                              data-label={t("Qualité", "Capacity")}
                              className="px-3 py-2 text-paper-muted"
                            >
                              <div className="min-w-0">
                                {libelleQualite(d.qualite)}
                                <span className="block text-xs text-paper-soft">
                                  {t("par", "by")} {d.delegant_nom}
                                </span>
                              </div>
                            </td>
                            <td
                              data-label={t("Période", "Period")}
                              className="whitespace-nowrap px-3 py-2 text-paper-muted"
                            >
                              <div className="min-w-0">
                                {jour(d.debut)} → {jour(d.fin)}
                              </div>
                            </td>
                            <td
                              data-label={t("État", "Status")}
                              className="px-3 py-2"
                            >
                              <div className="min-w-0">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${etat.classe}`}
                                >
                                  {etat.texte}
                                </span>
                                {d.motif_revocation && (
                                  <span className="mt-1 block text-xs text-paper-soft">
                                    {d.motif_revocation}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              {peutRevoquer && (
                                <RevocationDelegation delegationId={d.id} />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-3 text-sm text-paper-soft">
                  {t("Aucune délégation.", "No delegations.")}
                </p>
              )}
            </section>
          )}

          <section className={CARTE}>
            <h2 className="font-serif text-lg font-semibold">
              {t("Registre des signatures", "Signature register")}
            </h2>
            <p className="mb-3 mt-1 text-sm text-paper-muted">
              {t(
                "Toutes les signatures que vous pouvez consulter, y compris révoquées et abandonnées : aucune ligne n'est jamais effacée.",
                "Every signature you can view, including revoked and abandoned ones: no entry is ever deleted.",
              )}
            </p>
            {registre.length === 0 ? (
              <p className="text-sm text-paper-soft">
                {t("Aucune signature pour l'instant.", "No signatures yet.")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="tableau-empilable w-full min-w-[720px] text-sm">
                  <thead className="bg-paper-50 text-left text-paper-muted">
                    <tr>
                      <th className="px-3 py-2 font-medium">
                        {t("Numéro", "Number")}
                      </th>
                      <th className="px-3 py-2 font-medium">Document</th>
                      <th className="px-3 py-2 font-medium">
                        {t("Signataire", "Signatory")}
                      </th>
                      <th className="px-3 py-2 font-medium">
                        {t("État", "Status")}
                      </th>
                      <th className="px-3 py-2 font-medium">
                        {t("Fichiers", "Files")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {registre.map((s) => (
                      <tr
                        key={s.id}
                        className="border-t border-paper-200 align-top"
                      >
                        <td className="px-3 py-2">
                          <div className="min-w-0">
                            <span className="font-mono text-xs font-semibold text-navy-950">
                              {s.numero}
                            </span>
                            <span className="block text-xs text-paper-soft">
                              {jour(s.signe_le ?? s.cree_le)}
                            </span>
                          </div>
                        </td>
                        <td data-label="Document" className="px-3 py-2">
                          <div className="min-w-0">
                            {s.document_id ? (
                              <Link
                                href={`/documents/${s.document_id}`}
                                className="font-medium text-[#1c2029] hover:text-gold-600 hover:underline"
                              >
                                {s.titre_document}
                              </Link>
                            ) : (
                              <span className="text-[#1c2029]">
                                {s.titre_document}
                              </span>
                            )}
                            <span className="block font-mono text-[11px] text-paper-soft">
                              {s.reference_document}
                            </span>
                          </div>
                        </td>
                        <td
                          data-label={t("Signataire", "Signatory")}
                          className="px-3 py-2 text-paper-muted"
                        >
                          <div className="min-w-0">
                            {intituleQualite(s, langue)}
                            {s.titre_delegataire && (
                              <span className="block text-xs">
                                {t("par délégation", "by delegation")} :{" "}
                                {s.titre_delegataire}
                              </span>
                            )}
                            <span className="block text-xs text-paper-soft">
                              {libelleNatureSignature(s.nature, langue)}
                              {s.signataire_nom ? ` · ${s.signataire_nom}` : ""}
                            </span>
                          </div>
                        </td>
                        <td
                          data-label={t("État", "Status")}
                          className="px-3 py-2"
                        >
                          <div className="min-w-0">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${COULEUR_STATUT_SIGNATURE[s.statut]}`}
                            >
                              {libelleStatutSignature(s.statut, langue)}
                            </span>
                            {s.motif_revocation && (
                              <span className="mt-1 block text-xs text-paper-soft">
                                {s.motif_revocation}
                              </span>
                            )}
                          </div>
                        </td>
                        <td
                          data-label={t("Fichiers", "Files")}
                          className="px-3 py-2 text-xs"
                        >
                          <div className="min-w-0">
                            {s.chemin_pdf && (
                              <a
                                href={`/signatures/fichier/${s.id}?quoi=pdf`}
                                className="block text-navy-950 hover:underline"
                              >
                                ⬇{" "}
                                {s.nature === "electronique"
                                  ? t("PDF signé", "Signed PDF")
                                  : t("Bon à signer", "Print copy")}
                              </a>
                            )}
                            {s.chemin_original && (
                              <a
                                href={`/signatures/fichier/${s.id}?quoi=original`}
                                className="block text-navy-950 hover:underline"
                              >
                                ⬇ {t("Original signé", "Signed original")}
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
