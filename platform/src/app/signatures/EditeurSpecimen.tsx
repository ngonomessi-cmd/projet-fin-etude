"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTraduction } from "@/components/i18n/Langue";
import { definirSpecimenAction, type ResultatAction } from "./actions";

const LARGEUR = 1200;
const HAUTEUR = 450;

// Signature tracée au doigt / à la souris, ou photo / scan d'une signature
// sur papier blanc. L'image part au serveur, qui la nettoie (fond rendu
// transparent, recadrage) avant de l'enregistrer.
export function EditeurSpecimen({ aSpecimen }: { aSpecimen: boolean }) {
  const router = useRouter();
  const { t } = useTraduction();
  const toile = useRef<HTMLCanvasElement>(null);
  const trace = useRef<{ x: number; y: number } | null>(null);
  const [mode, setMode] = useState<"tracer" | "importer">("tracer");
  const [vide, setVide] = useState(true);
  const [photo, setPhoto] = useState(false);
  const [code, setCode] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState<ResultatAction | null>(null);
  const [version, setVersion] = useState(0);

  function effacer() {
    const ctx = toile.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, LARGEUR, HAUTEUR);
    setVide(true);
    setPhoto(false);
  }

  useEffect(effacer, []);

  function position(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * LARGEUR, y: ((e.clientY - r.top) / r.height) * HAUTEUR };
  }

  function debut(e: React.PointerEvent<HTMLCanvasElement>) {
    if (mode !== "tracer") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (photo) effacer();
    trace.current = position(e);
  }

  function deplacement(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = toile.current?.getContext("2d");
    if (!trace.current || !ctx) return;
    const p = position(e);
    ctx.strokeStyle = "#14213d";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(trace.current.x, trace.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    trace.current = p;
    setVide(false);
  }

  function importer(fichier: File | undefined) {
    if (!fichier) return;
    const url = URL.createObjectURL(fichier);
    const image = new Image();
    image.onload = () => {
      const ctx = toile.current?.getContext("2d");
      if (!ctx) return;
      effacer();
      const echelle = Math.min(LARGEUR / image.width, HAUTEUR / image.height, 1);
      const l = image.width * echelle;
      const h = image.height * echelle;
      ctx.drawImage(image, (LARGEUR - l) / 2, (HAUTEUR - h) / 2, l, h);
      URL.revokeObjectURL(url);
      setVide(false);
      setPhoto(true);
    };
    image.src = url;
  }

  async function enregistrer() {
    const canvas = toile.current;
    if (!canvas) return;
    setEnCours(true);
    setResultat(null);
    // Tracé : PNG (net, léger) ; photo : JPEG (bien plus léger qu'un PNG).
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, photo ? "image/jpeg" : "image/png", 0.92));
    if (!blob) {
      setEnCours(false);
      return;
    }
    const formulaire = new FormData();
    formulaire.set("image", blob, photo ? "signature.jpg" : "signature.png");
    formulaire.set("code", code);
    const r = await definirSpecimenAction(formulaire);
    setResultat(r);
    setEnCours(false);
    if (!r.erreur) {
      setCode("");
      effacer();
      setVersion((v) => v + 1);
      router.refresh();
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap gap-1 text-sm">
          {(
            [
              ["tracer", t("Tracer ma signature", "Draw my signature")],
              ["importer", t("Importer une photo ou un scan", "Import a photo or scan")],
            ] as const
          ).map(([valeur, libelle]) => (
            <button
              key={valeur}
              type="button"
              onClick={() => setMode(valeur)}
              className={`rounded-md px-3 py-1.5 font-medium ${mode === valeur ? "bg-navy-950 text-white" : "text-paper-muted hover:bg-paper-100"}`}
            >
              {libelle}
            </button>
          ))}
        </div>

        <canvas
          ref={toile}
          width={LARGEUR}
          height={HAUTEUR}
          onPointerDown={debut}
          onPointerMove={deplacement}
          onPointerUp={() => (trace.current = null)}
          onPointerLeave={() => (trace.current = null)}
          className={`block aspect-[8/3] w-full touch-none rounded-md border-2 border-dashed border-paper-200 bg-white ${mode === "tracer" ? "cursor-crosshair" : ""}`}
          aria-label={t("Zone de signature", "Signature area")}
        />
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          {mode === "importer" && (
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => importer(e.target.files?.[0])}
              className="min-w-0 text-sm file:mr-3 file:rounded-md file:border file:border-paper-200 file:bg-white file:px-3 file:py-1.5 file:text-sm"
            />
          )}
          <button type="button" onClick={effacer} className="text-paper-muted hover:text-[#1c2029] hover:underline">
            {t("Effacer", "Clear")}
          </button>
          <span className="text-xs text-paper-soft">
            {mode === "tracer"
              ? t("Signez dans le cadre avec la souris ou le doigt.", "Sign inside the frame with your mouse or finger.")
              : t("Signature à l'encre sombre sur papier blanc, bien éclairée.", "Dark ink signature on white paper, well lit.")}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="text-xs text-paper-muted">
            {t("Code Google Authenticator", "Google Authenticator code")}
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              className="mt-1 block w-full rounded-md border border-paper-200 px-3 py-2 text-center font-mono text-lg tracking-[0.4em] sm:w-44"
            />
          </label>
          <button
            type="button"
            onClick={enregistrer}
            disabled={enCours || vide || code.length !== 6}
            className="rounded-md bg-navy-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50"
          >
            {enCours ? t("Enregistrement…", "Saving…") : aSpecimen ? t("Remplacer ma signature", "Replace my signature") : t("Enregistrer ma signature", "Save my signature")}
          </button>
        </div>
        {resultat && (
          <p className={`mt-3 rounded-md px-3 py-2 text-sm ${resultat.erreur ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>
            {resultat.erreur ?? resultat.succes}
          </p>
        )}
      </div>

      <div className="min-w-0">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-paper-muted">{t("Signature enregistrée", "Saved signature")}</p>
        <div className="flex h-32 items-center justify-center rounded-md border border-paper-200 bg-white p-3">
          {aSpecimen ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/signatures/specimen?v=${version}`} alt={t("Votre signature", "Your signature")} className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-center text-xs text-paper-soft">{t("Aucune signature enregistrée.", "No signature saved yet.")}</span>
          )}
        </div>
        <p className="mt-2 text-xs text-paper-soft">
          {t(
            "Visible par vous seul. Elle n'est apposée que sur les documents que vous signez, après votre code Google Authenticator.",
            "Visible to you only. It is only added to documents you sign, after your Google Authenticator code."
          )}
        </p>
      </div>
    </div>
  );
}
