"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { boutonDiscret, boutonPrincipal, carte } from "@/components/courrier/Alerte";
import { useTraduction } from "@/components/i18n/Langue";
import { en, MESSAGES_COURRIER_ERREUR, TAILLE_MAX_SCAN } from "@/lib/courrier/constantes";
import { nomSur } from "@/lib/courrier/format";
import { creerClientNavigateur } from "@/lib/supabase/client";
import type { EntreePiece } from "../actions";

// Numérisation : deux sources.
//  * Scanner de bureau : le fichier PDF est choisi et déposé tel quel.
//  * Téléphone : on photographie chaque page ; les photos sont réduites puis ASSEMBLÉES EN UN SEUL PDF
//    dans le navigateur (rien n'est envoyé avant l'assemblage). Dans les deux cas, le PDF part
//    directement vers l'archive privée ; le serveur le relit, le contrôle et en calcule l'empreinte.

const COTE_MAX = 2000;
const A4 = { l: 595.28, h: 841.89 };

type Page = { id: string; fichier: File; apercu: string };

async function imageEnJpeg(fichier: File): Promise<{ octets: Uint8Array; l: number; h: number }> {
  const bitmap = await createImageBitmap(fichier);
  const echelle = Math.min(1, COTE_MAX / Math.max(bitmap.width, bitmap.height));
  const l = Math.round(bitmap.width * echelle);
  const h = Math.round(bitmap.height * echelle);
  const toile = document.createElement("canvas");
  toile.width = l;
  toile.height = h;
  const contexte = toile.getContext("2d");
  if (!contexte) throw new Error("canvas");
  contexte.fillStyle = "#fff";
  contexte.fillRect(0, 0, l, h);
  contexte.drawImage(bitmap, 0, 0, l, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((ok) => toile.toBlob(ok, "image/jpeg", 0.85));
  if (!blob) throw new Error("jpeg");
  return { octets: new Uint8Array(await blob.arrayBuffer()), l, h };
}

async function assembler(pages: Page[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  for (const page of pages) {
    const { octets, l, h } = await imageEnJpeg(page.fichier);
    const image = await pdf.embedJpg(octets);
    const paysage = l > h;
    const cadre = paysage ? { l: A4.h, h: A4.l } : A4;
    const echelle = Math.min(cadre.l / l, cadre.h / h);
    const pageA4 = pdf.addPage([cadre.l, cadre.h]);
    pageA4.drawImage(image, { x: (cadre.l - l * echelle) / 2, y: (cadre.h - h * echelle) / 2, width: l * echelle, height: h * echelle });
  }
  return pdf.save();
}

type Nature = { valeur: string; libelle: string; infobulle?: string };
type Props = {
  id: string;
  numero: string;
  /** Action serveur qui enregistre le fichier déposé. */
  enregistrer: (entree: EntreePiece) => Promise<{ erreur?: string }>;
  /** Natures proposées : la première est le bouton principal, la seconde (facultative) le bouton secondaire. */
  natures: [Nature] | [Nature, Nature];
  titre: string;
  aide: string;
};

export function NumerisationCourrier({ id, numero, enregistrer, natures, titre, aide }: Props) {
  const routeur = useRouter();
  const { t, langue } = useTraduction();
  const [pages, setPages] = useState<Page[]>([]);
  const [message, setMessage] = useState<{ type: "ok" | "erreur"; texte: string } | null>(null);
  const [enCours, setEnCours] = useState(false);
  const entreePdf = useRef<HTMLInputElement>(null);

  const ajouterImages = (liste: FileList | null) => {
    if (!liste) return;
    const nouvelles = [...liste].filter((f) => f.type.startsWith("image/")).map((fichier) => ({ id: crypto.randomUUID(), fichier, apercu: URL.createObjectURL(fichier) }));
    setPages((p) => [...p, ...nouvelles]);
    setMessage(null);
  };
  const retirer = (pid: string) => setPages((p) => p.filter((x) => x.id !== pid));
  const deplacer = (pid: string, delta: -1 | 1) =>
    setPages((p) => {
      const i = p.findIndex((x) => x.id === pid);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= p.length) return p;
      const suite = [...p];
      [suite[i], suite[j]] = [suite[j], suite[i]];
      return suite;
    });

  const deposer = async (nom: string, blob: Blob, nature: string) => {
    if (blob.size > TAILLE_MAX_SCAN) throw new Error("fichier_gros");
    const chemin = `${id}/${crypto.randomUUID()}-${nomSur(nom) || "scan.pdf"}`;
    const { error } = await creerClientNavigateur().storage.from("courrier").upload(chemin, blob, { contentType: "application/pdf", upsert: false });
    if (error) throw new Error("depot");
    const resultat = await enregistrer({ id, chemin, nom, nature });
    if (resultat.erreur) throw new Error(resultat.erreur);
  };

  const envoyer = async (nature: string) => {
    const pdfs = [...(entreePdf.current?.files ?? [])].filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (pdfs.length === 0 && pages.length === 0) return setMessage({ type: "erreur", texte: en(MESSAGES_COURRIER_ERREUR.fichier_vide, langue) });
    setEnCours(true);
    setMessage(null);
    try {
      for (const f of pdfs) await deposer(f.name, f, nature);
      if (pages.length > 0) {
        const octets = await assembler(pages);
        await deposer(`${numero}-${nature}.pdf`, new Blob([octets as BlobPart], { type: "application/pdf" }), nature);
      }
      pages.forEach((p) => URL.revokeObjectURL(p.apercu));
      setPages([]);
      if (entreePdf.current) entreePdf.current.value = "";
      setMessage({ type: "ok", texte: t("Le scan est archivé avec son empreinte numérique.", "The scan is archived with its digital fingerprint.") });
      routeur.refresh();
    } catch (e) {
      const cle = e instanceof Error ? e.message : "generique";
      setMessage({ type: "erreur", texte: en(MESSAGES_COURRIER_ERREUR[cle] ?? MESSAGES_COURRIER_ERREUR.generique, langue) });
    } finally {
      setEnCours(false);
    }
  };

  return (
    <section className={`${carte} mt-6 p-5`} aria-labelledby="titre-numerisation">
      <h2 id="titre-numerisation" className="font-serif text-base font-semibold">{titre}</h2>
      <p className="mt-1 text-sm text-paper-muted">{aide}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`fichier-pdf-${id}`} className="mb-1.5 block text-sm font-medium">{t("Fichier du scanner (PDF)", "Scanner file (PDF)")}</label>
          <input ref={entreePdf} id={`fichier-pdf-${id}`} type="file" accept="application/pdf" multiple className="block w-full text-sm" />
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-medium">{t("Photos avec le téléphone", "Photos with a phone")}</span>
          <label htmlFor={`photo-${id}`} className={`${boutonDiscret} cursor-pointer`}>{t("Photographier une page", "Photograph a page")}</label>
          <input id={`photo-${id}`} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { ajouterImages(e.target.files); e.target.value = ""; }} />
          <label htmlFor={`galerie-${id}`} className="ml-2 cursor-pointer text-sm text-navy-900 underline underline-offset-4">{t("ou choisir des images", "or choose images")}</label>
          <input id={`galerie-${id}`} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { ajouterImages(e.target.files); e.target.value = ""; }} />
        </div>
      </div>

      {pages.length > 0 && (
        <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label={t("Pages à assembler", "Pages to assemble")}>
          {pages.map((p, i) => (
            <li key={p.id} className="rounded-md border border-paper-200 p-2 text-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.apercu} alt={`${t("Page", "Page")} ${i + 1}`} className="h-28 w-full rounded object-cover" />
              <div className="mt-1 flex items-center justify-between gap-1">
                <span>{t("Page", "Page")} {i + 1}</span>
                <span className="flex gap-1">
                  <button type="button" onClick={() => deplacer(p.id, -1)} disabled={i === 0} aria-label={`${t("Monter la page", "Move page up")} ${i + 1}`} className="px-1 disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => deplacer(p.id, 1)} disabled={i === pages.length - 1} aria-label={`${t("Descendre la page", "Move page down")} ${i + 1}`} className="px-1 disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => retirer(p.id)} aria-label={`${t("Retirer la page", "Remove page")} ${i + 1}`} className="px-1 text-red-700">✕</button>
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}

      {message && (
        <p className={`mt-4 rounded-md border-l-4 px-4 py-3 text-sm ${message.type === "ok" ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-red-600 bg-red-50 text-red-900"}`} role={message.type === "ok" ? "status" : "alert"}>
          {message.texte}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={boutonPrincipal} disabled={enCours} onClick={() => void envoyer(natures[0].valeur)}>{enCours ? t("Archivage…", "Archiving…") : natures[0].libelle}</button>
        {natures[1] && (
          <button type="button" className={boutonDiscret} disabled={enCours} onClick={() => void envoyer(natures[1]!.valeur)} title={natures[1].infobulle}>{natures[1].libelle}</button>
        )}
      </div>
    </section>
  );
}
