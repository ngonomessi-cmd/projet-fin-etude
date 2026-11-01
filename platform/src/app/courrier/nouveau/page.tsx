import Link from "next/link";
import { notFound } from "next/navigation";
import { Alerte } from "@/components/courrier/Alerte";
import { en, MESSAGES_COURRIER_ERREUR } from "@/lib/courrier/constantes";
import { contexteCourrier, departementsOrganisation } from "@/lib/courrier/contexte";
import { traductionServeur } from "@/lib/i18n/serveur";
import { creerClientServeur } from "@/lib/supabase/server";
import { FormulaireCourrier } from "./FormulaireCourrier";

type Props = { searchParams: Promise<{ erreur?: string }> };

export default async function NouveauCourrier({ searchParams }: Props) {
  const { erreur } = await searchParams;
  const ctx = await contexteCourrier();
  if (!ctx?.role) notFound();
  const { t, langue } = await traductionServeur();
  const supabase = await creerClientServeur();
  const [departements, agents] = await Promise.all([
    departementsOrganisation(),
    supabase.from("profiles").select("id, nom_complet, departement").order("nom_complet").returns<{ id: string; nom_complet: string; departement: string }[]>(),
  ]);

  return (
    <div className="max-w-3xl">
      <Link href="/courrier/registre" className="text-sm text-paper-muted hover:text-[#1c2029]">
        ← {t("Registre des arrivées", "Incoming register")}
      </Link>
      <h2 className="mt-3 font-serif text-xl font-semibold">{t("Enregistrer un courrier arrivé", "Register incoming mail")}</h2>
      <p className="mt-1 text-sm text-paper-muted">
        {t(
          "Le courrier n'est pas ouvert : notez uniquement ce qui se lit à l'extérieur du pli.",
          "The mail is not opened: only record what can be read on the outside of the envelope."
        )}
      </p>
      {erreur && (
        <div className="mt-4">
          <Alerte type="erreur">{en(MESSAGES_COURRIER_ERREUR[erreur] ?? MESSAGES_COURRIER_ERREUR.generique, langue)}</Alerte>
        </div>
      )}
      <div className="mt-5">
        <FormulaireCourrier departements={departements} agents={(agents.data ?? []).map((a) => ({ id: a.id, nom: a.nom_complet, departement: a.departement }))} />
      </div>
    </div>
  );
}
