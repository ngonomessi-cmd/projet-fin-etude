"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/Badge";
import { LABEL_TYPE_CONVERSATION } from "@/lib/labels";
import type { TypeConversation } from "@/lib/types";

export type ConversationAffichee = {
  id: string;
  type: TypeConversation;
  nom: string;
  dernierApercu: string | null;
  dernierEstMoi: boolean;
  nonLus: number;
  archivee: boolean;
  sourdine: boolean;
};

const AVATAR_PAR_TYPE: Record<TypeConversation, string> = {
  privee: "bg-[#5B5447]",
  groupe: "bg-gold-500 text-navy-950",
  canal: "bg-navy-950",
};

function initiales(nom: string) {
  return nom.split(" ").filter(Boolean).map((mot) => mot[0]).slice(0, 2).join("").toUpperCase();
}

type Filtre = "tout" | "non_lus" | "canaux" | "archivees";

const FILTRES: { cle: Filtre; label: string }[] = [
  { cle: "tout", label: "Tout" },
  { cle: "non_lus", label: "Non lus" },
  { cle: "canaux", label: "Canaux" },
  { cle: "archivees", label: "Archivées" },
];

function Ligne({ c }: { c: ConversationAffichee }) {
  return (
    <Link
      href={`/messagerie/${c.id}`}
      className="flex items-center gap-3 border-t border-paper-200 px-4 py-3 first:border-t-0 hover:bg-paper-50"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${AVATAR_PAR_TYPE[c.type]}`}>
        {initiales(c.nom)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-[#1c2029]">{c.nom}</span>
          {c.type !== "privee" && (
            <Badge texte={LABEL_TYPE_CONVERSATION[c.type]} classesCouleur="bg-paper-50 text-paper-muted border-paper-200" />
          )}
          {c.sourdine && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-paper-soft)" strokeWidth="2" aria-hidden="true">
              <path d="M11 5 6 9H2v6h4l5 4V5Z" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </div>
        {c.dernierApercu && (
          <p className="truncate text-sm text-paper-muted">
            {c.dernierEstMoi ? "Vous : " : ""}
            {c.dernierApercu}
          </p>
        )}
      </div>
      {c.nonLus > 0 && !c.sourdine && (
        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-700 px-1.5 text-xs font-semibold text-white">
          {c.nonLus}
        </span>
      )}
    </Link>
  );
}

export function ListeConversationsInteractive({ conversations }: { conversations: ConversationAffichee[] }) {
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<Filtre>("tout");
  const [canauxOuverts, setCanauxOuverts] = useState(false);

  const filtrees = useMemo(() => {
    const texte = recherche.trim().toLowerCase();
    return conversations.filter((c) => {
      if (texte && !c.nom.toLowerCase().includes(texte) && !(c.dernierApercu ?? "").toLowerCase().includes(texte)) return false;
      if (filtre === "archivees") return c.archivee;
      if (c.archivee) return false;
      if (filtre === "non_lus") return c.nonLus > 0;
      if (filtre === "canaux") return c.type === "canal";
      return true;
    });
  }, [conversations, recherche, filtre]);

  // Les canaux officiels (department + canal général) sont regroupés dans
  // une section repliable, séparée des conversations privées/groupes — cf.
  // maquette validée. Inutile de les distinguer sur l'onglet "Canaux" (déjà
  // filtré à 100% de canaux).
  const canaux = filtre === "canaux" ? [] : filtrees.filter((c) => c.type === "canal");
  const autres = filtre === "canaux" ? filtrees : filtrees.filter((c) => c.type !== "canal");

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-paper-200 bg-white px-3 py-2">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-paper-soft)" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher une conversation…"
          className="w-full border-0 text-sm outline-none"
        />
      </div>

      <div className="mb-4 flex gap-2">
        {FILTRES.map((f) => (
          <button
            key={f.cle}
            onClick={() => setFiltre(f.cle)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              filtre === f.cle ? "border-navy-950 bg-navy-950 text-white" : "border-paper-200 bg-white text-paper-muted"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtrees.length === 0 ? (
        <p className="rounded-lg border border-paper-200 bg-white p-6 text-sm text-paper-muted">
          {recherche ? "Aucune conversation ne correspond à votre recherche." : "Aucune conversation pour l'instant."}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {canaux.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-paper-200 bg-white shadow-sm">
              <button
                onClick={() => setCanauxOuverts((v) => !v)}
                className="flex w-full items-center gap-2.5 bg-paper-50 px-4 py-3 text-left"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0b1220" strokeWidth="2" aria-hidden="true">
                  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
                </svg>
                <span className="flex-1 text-sm font-bold text-[#1c2029]">Canaux officiels</span>
                <span className="rounded-full bg-paper-200 px-2 py-0.5 text-[11px] font-bold text-paper-muted">{canaux.length}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-paper-muted)"
                  strokeWidth="2.3"
                  aria-hidden="true"
                  style={{ transform: canauxOuverts ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 160ms ease" }}
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
              {canauxOuverts && (
                <div>
                  {canaux.map((c) => (
                    <Ligne key={c.id} c={c} />
                  ))}
                </div>
              )}
            </div>
          )}

          {autres.length > 0 && (
            <div>
              {canaux.length > 0 && (
                <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-paper-soft">Messages privés</p>
              )}
              <div className="overflow-hidden rounded-lg border border-paper-200 bg-white shadow-sm">
                {autres.map((c) => (
                  <Ligne key={c.id} c={c} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
