import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import type { ModeleDocument, Profil } from "@/lib/types";
import { ListeModeles } from "./ListeModeles";
import { traductionServeur } from "@/lib/i18n/serveur";
import { PLATEFORME_BILINGUE } from "@/lib/i18n/plateforme";

export default async function PageModeles() {
  const supabase = await creerClientServeur();
  const { t } = await traductionServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profilData } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const profil = profilData as Profil;

  if (profil.role !== "administrateur") {
    return (
      <div className="flex min-h-screen flex-col lg:flex-row">
        <NavBar />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <p className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {t("Accès réservé au rôle Administrateur.", "Administrators only.")}
          </p>
        </main>
      </div>
    );
  }

  // Sur un déploiement non bilingue (KHS Bank), seuls les modèles français.
  const requete = supabase.from("modeles_documents").select("*").order("titre");
  const { data } = await (PLATEFORME_BILINGUE ? requete : requete.eq("langue", "fr"));

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-1 font-serif text-2xl font-semibold">{t("Modèles de documents", "Document templates")}</h1>
          <p className="mb-6 text-sm text-paper-muted">
            {t(
              "Points de départ proposés lors de la création d'un document (Word, Excel, PowerPoint). Un modèle peut être réservé à un département.",
              "Starting points offered when creating a document (Word, Excel, PowerPoint). A template can be restricted to one department."
            )}
          </p>
          <ListeModeles modeles={(data ?? []) as ModeleDocument[]} />
        </div>
      </main>
    </div>
  );
}
