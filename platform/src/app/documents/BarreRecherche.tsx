import Link from "next/link";
import { NATURES, libelles } from "@/lib/labels";
import { traducteur, type Langue } from "@/lib/i18n/plateforme";

export type FiltresRecherche = {
  q: string;
  departement: string;
  nature: string;
  statut: string;
  auteur: string;
  format: string;
  du: string;
  au: string;
};

const CHAMP = "w-full rounded-md border border-paper-200 bg-white px-3 py-2 text-sm";

// Formulaire GET : la recherche fonctionne sans JavaScript, et chaque
// recherche a sa propre adresse (partageable, bouton « retour » du navigateur).
export function BarreRecherche({
  filtres,
  vue,
  langue,
  departements,
  auteurs,
}: {
  filtres: FiltresRecherche;
  vue: string;
  langue: Langue;
  departements: string[];
  auteurs: { id: string; nom: string }[];
}) {
  const filtresAvances = Boolean(
    filtres.departement || filtres.nature || filtres.statut || filtres.auteur || filtres.format || filtres.du || filtres.au
  );
  const actif = filtresAvances || Boolean(filtres.q);
  const t = traducteur(langue);
  const L = libelles(langue);

  return (
    <form action="/documents" method="get" className="mb-5 rounded-lg border border-paper-200 bg-white p-3 shadow-sm">
      <div className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">{t("Rechercher un document", "Search for a document")}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-paper-soft)"
            strokeWidth="2"
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            name="q"
            type="search"
            defaultValue={filtres.q}
            placeholder={t("Rechercher : titre, référence (ex. API-2026-000012), mot du texte…", "Search: title, reference (e.g. API-2026-000012), word in the text…")}
            className={`${CHAMP} pl-9`}
          />
        </label>
        <button type="submit" className="shrink-0 rounded-md bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900">
          {t("Rechercher", "Search")}
        </button>
      </div>

      <details open={filtresAvances} className="mt-2">
        <summary className="cursor-pointer select-none text-xs font-medium text-paper-muted hover:text-[#1c2029]">
          {t("Filtres avancés", "Advanced filters")}
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-paper-muted">
            {t("Département", "Department")}
            <select name="departement" defaultValue={filtres.departement} className={`${CHAMP} mt-1`}>
              <option value="">{t("Tous", "All")}</option>
              {departements.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-paper-muted">
            {t("Nature", "Document type")}
            <select name="nature" defaultValue={filtres.nature} className={`${CHAMP} mt-1`}>
              <option value="">{t("Toutes", "All")}</option>
              {NATURES.map((n) => (
                <option key={n} value={n}>
                  {L.nature[n]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-paper-muted">
            {t("Statut", "Status")}
            <select name="statut" defaultValue={filtres.statut} className={`${CHAMP} mt-1`}>
              <option value="">{t("Tous", "All")}</option>
              <option value="brouillon">{L.statut.brouillon}</option>
              <option value="en_verification">{L.statut.en_verification}</option>
              <option value="valide">{L.statut.valide}</option>
              <option value="rejete">{L.statut.rejete}</option>
              <option value="publie">{t("En vigueur (publié)", "In force (published)")}</option>
              <option value="archive">{L.archive}</option>
            </select>
          </label>
          <label className="text-xs text-paper-muted">
            {t("Format", "Format")}
            <select name="format" defaultValue={filtres.format} className={`${CHAMP} mt-1`}>
              <option value="">{t("Tous", "All")}</option>
              <option value="texte">{t("Texte (Word)", "Text (Word)")}</option>
              <option value="tableur">{t("Classeur (Excel)", "Spreadsheet (Excel)")}</option>
              <option value="presentation">{t("Présentation (PowerPoint)", "Presentation (PowerPoint)")}</option>
              <option value="fichier">{t("Fichier déposé", "Uploaded file")}</option>
            </select>
          </label>
          <label className="text-xs text-paper-muted">
            {t("Auteur", "Author")}
            <select name="auteur" defaultValue={filtres.auteur} className={`${CHAMP} mt-1`}>
              <option value="">{t("Tous", "All")}</option>
              {auteurs.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-paper-muted">
            {t("Publié / créé à partir du", "Published / created from")}
            <input type="date" name="du" defaultValue={filtres.du} className={`${CHAMP} mt-1`} />
          </label>
          <label className="text-xs text-paper-muted">
            {t("Jusqu'au", "Until")}
            <input type="date" name="au" defaultValue={filtres.au} className={`${CHAMP} mt-1`} />
          </label>
        </div>
      </details>

      {actif && (
        <p className="mt-2 text-xs">
          <Link href={`/documents?vue=${vue}`} className="text-paper-muted hover:text-gold-600 hover:underline">
            ✕ {t("Effacer la recherche", "Clear search")}
          </Link>
        </p>
      )}
    </form>
  );
}
