import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { DUREE_CONSERVATION_DEFAUT, NATURES, libelles } from "@/lib/labels";
import type { NatureDocument, Profil } from "@/lib/types";
import { TableauDocuments, type LigneDocument } from "@/app/documents/TableauDocuments";
import { FormulaireParametres } from "./FormulaireParametres";
import { traductionServeur } from "@/lib/i18n/serveur";

const COLONNES =
  "id, reference, titre, classification, statut, departement, nature, format_atelier, version, updated_at, publie_le, archive_le, fin_conservation";

type Ligne = LigneDocument & { fin_conservation: string | null };

export default async function PageArchivage() {
  const supabase = await creerClientServeur();
  const { langue, t } = await traductionServeur();
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

  const [{ data: parametres }, { data: publiesData }, { data: archivesData }] = await Promise.all([
    supabase.from("parametres_archivage").select("*").eq("organisation", profil.organisation).maybeSingle(),
    supabase.from("documents").select(COLONNES).eq("statut", "publie").is("archive_le", null).order("publie_le"),
    supabase.from("documents").select(COLONNES).not("archive_le", "is", null).order("fin_conservation"),
  ]);

  const delai: number = parametres?.delai_archivage_mois ?? 12;
  const dureesEnregistrees = (parametres?.durees_conservation ?? {}) as Partial<Record<NatureDocument, number>>;
  const durees = Object.fromEntries(
    NATURES.map((n) => [n, dureesEnregistrees[n] ?? DUREE_CONSERVATION_DEFAUT[n]])
  ) as Record<NatureDocument, number>;

  const publies = (publiesData ?? []) as unknown as Ligne[];
  const archives = (archivesData ?? []) as unknown as Ligne[];
  const limite = new Date();
  limite.setMonth(limite.getMonth() - delai);
  const prochainPassage = delai > 0 ? publies.filter((d) => d.publie_le && new Date(d.publie_le) < limite) : [];
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const echus = archives.filter((d) => d.fin_conservation && d.fin_conservation < aujourdhui);
  const nonClasses = [...publies, ...archives].filter((d) => !d.nature).length;

  const parNature = new Map<string, number>();
  for (const d of archives) parNature.set(d.nature ?? "", (parNature.get(d.nature ?? "") ?? 0) + 1);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <div>
            <h1 className="mb-1 font-serif text-2xl font-semibold">{t("Archivage", "Archiving")}</h1>
            <p className="text-sm text-paper-muted">
              {t(
                "Un document archivé est figé définitivement et scellé par une empreinte SHA-256. Seul un document validé et publié peut être archivé, par le validateur de son département, par un administrateur, ou automatiquement (chaque nuit) après le délai ci-dessous.",
                "An archived document is permanently frozen and sealed with a SHA-256 fingerprint. Only an approved, published document can be archived, by its department's approver, by an administrator, or automatically (every night) after the delay below."
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { libelle: t("En vigueur", "In force"), valeur: publies.length },
              { libelle: t("Archivés", "Archived"), valeur: archives.length },
              { libelle: t("Archivés cette nuit", "Archived tonight"), valeur: prochainPassage.length },
              { libelle: t("Conservation échue", "Retention expired"), valeur: echus.length },
            ].map((c) => (
              <div key={c.libelle} className="rounded-lg border border-paper-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-semibold text-[#1c2029]">{c.valeur}</p>
                <p className="text-xs text-paper-muted">{c.libelle}</p>
              </div>
            ))}
          </div>

          {nonClasses > 0 && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {t(
                `${nonClasses} document${nonClasses > 1 ? "s" : ""} publié${nonClasses > 1 ? "s" : ""} ou archivé${nonClasses > 1 ? "s" : ""} sans nature (créés avant la mise en place du classement) : ils suivent la durée « Autre document ». Vous pouvez classer les documents en vigueur depuis leur fiche.`,
                `${nonClasses} published or archived document${nonClasses > 1 ? "s" : ""} without a type (created before classification was introduced): they follow the "Other document" period. You can classify documents in force from their details page.`
              )}
            </p>
          )}

          <FormulaireParametres delai={delai} durees={durees} />

          <section className="overflow-hidden rounded-lg border border-paper-200 bg-white shadow-sm">
            <div className="border-b border-paper-200 bg-paper-50 px-4 py-3">
              <h2 className="text-sm font-bold text-[#1c2029]">{t("Seront archivés au prochain passage automatique", "To be archived at the next automatic run")}</h2>
              <p className="mt-0.5 text-xs text-paper-muted">
                {delai > 0
                  ? t(`Documents publiés depuis plus de ${delai} mois.`, `Documents published more than ${delai} months ago.`)
                  : t("Archivage automatique désactivé.", "Automatic archiving disabled.")}
              </p>
            </div>
            <TableauDocuments documents={prochainPassage} afficherDepartement colonneDate="publication" vide={t("Aucun document concerné.", "No documents concerned.")} />
          </section>

          <section className="overflow-hidden rounded-lg border border-paper-200 bg-white shadow-sm">
            <div className="border-b border-paper-200 bg-paper-50 px-4 py-3">
              <h2 className="text-sm font-bold text-[#1c2029]">{t("Durée de conservation échue", "Retention period expired")}</h2>
              <p className="mt-0.5 text-xs text-paper-muted">
                {t(
                  "Ces documents peuvent faire l'objet d'une procédure d'élimination réglementaire (visa du responsable, procès-verbal). La plateforme ne supprime jamais un document archivé.",
                  "These documents may go through a regulated disposal procedure (manager approval, official record). The platform never deletes an archived document."
                )}
              </p>
            </div>
            <TableauDocuments documents={echus} afficherDepartement colonneDate="publication" vide={t("Aucun document arrivé au terme de sa conservation.", "No document has reached the end of its retention period.")} />
          </section>

          {archives.length > 0 && (
            <section className="rounded-lg border border-paper-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-[#1c2029]">{t("Fonds d'archives par nature", "Archive holdings by type")}</h2>
              <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                {[...parNature.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([nature, nombre]) => (
                    <li key={nature} className="flex justify-between border-b border-paper-100 py-1">
                      <span className="text-paper-muted">{nature ? libelles(langue).nature[nature as NatureDocument] : libelles(langue).nonClasse}</span>
                      <span className="font-semibold">{nombre}</span>
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
