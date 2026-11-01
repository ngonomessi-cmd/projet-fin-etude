import Link from "next/link";
import { Alerte, carte } from "@/components/courrier/Alerte";
import { en, MESSAGES_DEPART_ERREUR, UUID } from "@/lib/courrier/constantes";
import { contexteCourrier, departementsOrganisation } from "@/lib/courrier/contexte";
import { traducteurDepartements, traductionServeur } from "@/lib/i18n/serveur";
import { creerClientServeur } from "@/lib/supabase/server";
import { FormulaireDepart } from "./FormulaireDepart";

type Props = { searchParams: Promise<{ document?: string; arrivee?: string; erreur?: string }> };

export default async function NouveauDepart({ searchParams }: Props) {
  const { document, arrivee, erreur } = await searchParams;
  const ctx = await contexteCourrier();
  if (!ctx) return null;
  const { t, langue } = await traductionServeur();
  const dep = await traducteurDepartements();
  const service = ctx.role != null;
  const supabase = await creerClientServeur();

  const { data: courriers } = await supabase.from("courriers").select("id, numero, expediteur, objet").order("recu_le", { ascending: false }).limit(50)
    .returns<{ id: string; numero: string; expediteur: string; objet: string | null }[]>();
  const arrivees = (courriers ?? []).map((c) => ({ id: c.id, libelle: `${c.numero} — ${c.expediteur}${c.objet ? ` : ${c.objet.slice(0, 40)}` : ""}` }));
  const arriveeInitiale = arrivee && UUID.test(arrivee) ? arrivee : undefined;

  const entete = (
    <>
      <Link href="/courrier/depart" className="text-sm text-paper-muted hover:text-[#1c2029]">← {service ? t("Registre des départs", "Outgoing register") : t("Mes envois", "My dispatches")}</Link>
      {erreur && (
        <div className="mt-4"><Alerte type="erreur">{en(MESSAGES_DEPART_ERREUR[erreur] ?? MESSAGES_DEPART_ERREUR.generique, langue)}</Alerte></div>
      )}
    </>
  );

  // Service du courrier : enregistrement direct d'une lettre signée sur papier.
  if (service) {
    const departements = await departementsOrganisation();
    return (
      <div className="max-w-3xl">
        {entete}
        <h2 className="mt-3 font-serif text-xl font-semibold">{t("Enregistrer un courrier départ", "Register outgoing mail")}</h2>
        <p className="mt-1 text-sm text-paper-muted">
          {t(
            "Pour une lettre déjà signée sur papier. Pour une lettre rédigée dans la plateforme, l'agent demande l'expédition depuis le document validé.",
            "For a letter already signed on paper. For a letter written in the platform, the staff member requests dispatch from the validated document."
          )}
        </p>
        <div className="mt-5">
          <FormulaireDepart usage="direct" objetInitial="" departements={departements.map((d) => ({ id: d, libelle: dep(d) }))} arrivees={arrivees} arriveeInitiale={arriveeInitiale} />
        </div>
      </div>
    );
  }

  // Agent : la demande part toujours d'un document validé.
  const { data: doc } = document && UUID.test(document)
    ? await supabase.from("documents").select("id, reference, titre, statut, classification").eq("id", document)
        .maybeSingle<{ id: string; reference: string; titre: string; statut: string; classification: string }>()
    : { data: null };
  if (!doc || !["valide", "publie"].includes(doc.statut)) {
    return (
      <div className="max-w-3xl">
        {entete}
        <h2 className="mt-3 font-serif text-xl font-semibold">{t("Transmettre une lettre au service du courrier", "Pass a letter to the mail service")}</h2>
        <p className={`${carte} mt-4 p-5 text-sm text-paper-muted`}>
          {t("Une demande d'expédition part d'un", "A dispatch request starts from a")} <strong className="font-medium text-[#1c2029]">{t("document validé", "validated document")}</strong>.{" "}
          {t("Ouvrez le document dans", "Open the document in")}{" "}
          <Link href="/documents" className="text-navy-900 underline underline-offset-4">Documents</Link>
          {t(", puis cliquez sur « Transmettre au service du courrier ». Si le document n'est pas encore validé, soumettez-le d'abord pour validation.", ", then click “Pass to the mail service”. If the document is not validated yet, submit it for validation first.")}
        </p>
      </div>
    );
  }
  const confidentiel = doc.classification === "confidentiel";

  return (
    <div className="max-w-3xl">
      {entete}
      <h2 className="mt-3 font-serif text-xl font-semibold">{t("Transmettre une lettre au service du courrier", "Pass a letter to the mail service")}</h2>
      <p className="mt-1 text-sm text-paper-muted">
        {t("Document", "Document")} : <span className="font-mono text-xs">{doc.reference}</span>{confidentiel ? "" : ` — ${doc.titre}`}
      </p>
      {confidentiel ? (
        <div className="mt-3">
          <Alerte type="erreur">
            {t(
              "Document confidentiel : sa version signée ne sera pas jointe, le service du courrier ne verra que l'enveloppe. Remettez-lui le pli fermé.",
              "Confidential document: its signed version will not be attached; the mail service will only see the envelope. Hand it the sealed envelope."
            )}
          </Alerte>
        </div>
      ) : (
        <p className="mt-2 text-xs text-paper-muted">{t("La version signée du document (PDF) sera jointe automatiquement à votre demande.", "The signed version of the document (PDF) will be attached to your request automatically.")}</p>
      )}
      <div className="mt-5">
        <FormulaireDepart usage="demande" document={doc.id} objetInitial={confidentiel ? "" : doc.titre} departements={[]} arrivees={arrivees} arriveeInitiale={arriveeInitiale} />
      </div>
    </div>
  );
}
