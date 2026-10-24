"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PartageDocument } from "@/lib/types";
import { LABEL_ROLE } from "@/lib/labels";
import type { RoleUtilisateur } from "@/lib/types";
import { partagerDocumentAction, retirerPartageAction } from "./partage-actions";

export type PersonneContactable = { id: string; nom_complet: string; departement: string; role: RoleUtilisateur };
export type ConversationPubliable = { id: string; libelle: string };

const TYPE_CIBLE: Record<PartageDocument["type_cible"], string> = {
  personne: "Personne",
  groupe: "Groupe",
  canal: "Canal",
  privee: "Conversation",
};

export function PanneauPartage({
  documentId,
  peutPartager,
  peutJoindrePdf,
  lectureSeule,
  confidentiel,
  personnes,
  conversations,
  partages,
}: {
  documentId: string;
  peutPartager: boolean;
  peutJoindrePdf: boolean;
  // Co-édition proposée seulement tant que le document est modifiable
  // (brouillon ou rejeté) ; jamais pour un document archivé.
  lectureSeule: boolean;
  confidentiel: boolean;
  personnes: PersonneContactable[];
  conversations: ConversationPubliable[];
  partages: PartageDocument[];
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [choisis, setChoisis] = useState<Set<string>>(new Set());
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return personnes.filter((p) => !q || p.nom_complet.toLowerCase().includes(q) || p.departement.toLowerCase().includes(q));
  }, [personnes, recherche]);

  async function soumettre(formData: FormData) {
    setEnCours(true);
    setErreur(null);
    setSucces(null);
    for (const id of choisis) formData.append("profils", id);
    const r = await partagerDocumentAction(documentId, formData);
    setEnCours(false);
    if (r.erreur) {
      setErreur(r.erreur);
      return;
    }
    setSucces(r.succes ?? "Document partagé.");
    setChoisis(new Set());
    setOuvert(false);
    router.refresh();
  }

  async function retirer(id: string) {
    const r = await retirerPartageAction(id, documentId);
    if (r.erreur) setErreur(r.erreur);
    else router.refresh();
  }

  return (
    <section className="mt-6 rounded-lg border border-paper-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-base font-semibold">Partage</h2>
          <p className="text-xs text-paper-muted">
            Avec les personnes que vous pouvez contacter dans la messagerie, ou une conversation où vous publiez.
            {confidentiel && " Document confidentiel : partage limité à son département."}
          </p>
        </div>
        {peutPartager && !ouvert && (
          <button
            type="button"
            onClick={() => setOuvert(true)}
            className="rounded-md bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900"
          >
            Partager…
          </button>
        )}
      </div>

      {succes && <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{succes}</p>}
      {erreur && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erreur}</p>}

      {ouvert && (
        <form action={soumettre} className="mt-4 space-y-4 border-t border-paper-200 pt-4">
          <div>
            <p className="mb-1.5 text-sm font-medium">Personnes</p>
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un nom ou un département…"
              className="mb-2 w-full rounded-md border border-paper-200 px-3 py-2 text-sm"
            />
            <div className="max-h-52 overflow-y-auto rounded-md border border-paper-200">
              {filtrees.length === 0 ? (
                <p className="p-3 text-xs text-paper-soft">Aucune personne disponible.</p>
              ) : (
                filtrees.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-center gap-3 border-b border-paper-100 px-3 py-2 text-sm last:border-b-0 hover:bg-paper-50">
                    <input
                      type="checkbox"
                      checked={choisis.has(p.id)}
                      onChange={(e) => {
                        const s = new Set(choisis);
                        if (e.target.checked) s.add(p.id);
                        else s.delete(p.id);
                        setChoisis(s);
                      }}
                    />
                    <span className="flex-1">{p.nom_complet}</span>
                    <span className="text-xs text-paper-soft">
                      {p.departement} · {LABEL_ROLE[p.role]}
                    </span>
                  </label>
                ))
              )}
            </div>
            {choisis.size > 0 && <p className="mt-1 text-xs text-paper-muted">{choisis.size} personne(s) sélectionnée(s)</p>}
          </div>

          {conversations.length > 0 && (
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">… et/ou une conversation (groupe ou canal)</span>
              <select name="conversation_id" defaultValue="" className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm">
                <option value="">Aucune</option>
                {conversations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.libelle}
                  </option>
                ))}
              </select>
            </label>
          )}

          <fieldset className="text-sm">
            <legend className="mb-1.5 font-medium">Droit accordé</legend>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="droit" value="lecture" defaultChecked /> Lecture
              </label>
              {lectureSeule ? (
                <span className="text-xs text-paper-soft">Document non modifiable : partage en lecture uniquement.</span>
              ) : (
                <label className="flex items-center gap-2">
                  <input type="radio" name="droit" value="edition" /> Lecture et modification (co-édition)
                </label>
              )}
            </div>
          </fieldset>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">
              Message <span className="font-normal text-paper-soft">(facultatif)</span>
            </span>
            <textarea name="message" rows={2} maxLength={1000} className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm" />
          </label>

          {peutJoindrePdf && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="joindre_pdf" defaultChecked />
              Joindre une copie PDF au message
            </label>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={enCours}
              className="rounded-md bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50"
            >
              {enCours ? "Partage en cours…" : "Partager et prévenir par la messagerie"}
            </button>
            <button type="button" onClick={() => setOuvert(false)} className="rounded-md border border-paper-200 px-4 py-2 text-sm">
              Annuler
            </button>
          </div>
        </form>
      )}

      {partages.length > 0 && (
        <ul className="mt-4 divide-y divide-paper-100 rounded-md border border-paper-200 text-sm">
          {partages.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
              <span className="rounded bg-paper-100 px-1.5 py-0.5 text-[11px] text-paper-muted">{TYPE_CIBLE[s.type_cible]}</span>
              <span className="font-medium">{s.cible}</span>
              <span className={`text-xs ${s.droit === "edition" ? "text-gold-600" : "text-paper-muted"}`}>
                {s.droit === "edition" ? "co-édition" : "lecture"}
              </span>
              <span className="ml-auto text-xs text-paper-soft">
                par {s.partage_par}, le {new Date(s.created_at).toLocaleDateString("fr-FR")}
              </span>
              {s.retirable && (
                <button type="button" onClick={() => retirer(s.id)} className="text-xs text-red-700 hover:underline">
                  Retirer
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
