"use client";

import { useEffect, useRef, useState } from "react";
import { creerClientNavigateur } from "@/lib/supabase/client";
import {
  envoyerMessageAction,
  modifierMessageAction,
  supprimerMessageAction,
  marquerConversationLueAction,
} from "../actions";
import type { Message, PieceJointeMessage } from "@/lib/types";

type MessageAffiche = Message & { pieces: (PieceJointeMessage & { url: string | null })[] };

const FENETRE_CORRECTION_MS = 15 * 60 * 1000;

export function ConversationTempsReel({
  conversationId,
  messagesInitiaux,
  utilisateurId,
  peutPublier,
  peutUrgent,
  nomAuteur,
}: {
  conversationId: string;
  messagesInitiaux: MessageAffiche[];
  utilisateurId: string;
  peutPublier: boolean;
  peutUrgent: boolean;
  nomAuteur: (auteurId: string) => string;
}) {
  const [messages, setMessages] = useState<MessageAffiche[]>(messagesInitiaux);
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const supabaseRef = useRef(creerClientNavigateur());
  const formRef = useRef<HTMLFormElement>(null);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = supabaseRef.current;
    const canal = supabase
      .channel(`messagerie-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const nouveau = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === nouveau.id) ? prev : [...prev, { ...nouveau, pieces: [] }]));
          if (nouveau.auteur_id !== utilisateurId) {
            marquerConversationLueAction(conversationId);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const maj = payload.new as Message;
          setMessages((prev) => prev.map((m) => (m.id === maj.id ? { ...m, ...maj } : m)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [conversationId, utilisateurId]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function envoyer(formData: FormData) {
    setEnCours(true);
    setErreurEnvoi(null);
    const resultat = await envoyerMessageAction(conversationId, formData);
    setEnCours(false);
    if (resultat?.erreur) {
      setErreurEnvoi(resultat.erreur);
      return;
    }
    formRef.current?.reset();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto py-3">
        {messages.length === 0 && <p className="text-center text-sm text-slate-400">Aucun message pour l&apos;instant.</p>}
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} estAuteur={message.auteur_id === utilisateurId} nomAuteur={nomAuteur(message.auteur_id)} />
        ))}
        <div ref={finRef} />
      </div>

      {peutPublier ? (
        <form ref={formRef} action={envoyer} className="space-y-2 border-t border-slate-200 pt-3">
          <textarea
            name="contenu"
            required
            rows={2}
            maxLength={10000}
            placeholder="Écrire un message…"
            className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <input
                name="fichier"
                type="file"
                className="text-xs text-slate-500 file:mr-2 file:rounded file:border-0 file:bg-slate-200 file:px-2 file:py-1 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-300"
              />
              {peutUrgent && (
                <label className="flex items-center gap-1 text-xs text-red-700">
                  <input type="checkbox" name="urgent" className="rounded border-slate-300" />
                  Urgent
                </label>
              )}
            </div>
            <button
              type="submit"
              disabled={enCours}
              className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {enCours ? "Envoi…" : "Envoyer"}
            </button>
          </div>
          {erreurEnvoi && <p className="text-sm text-red-600">{erreurEnvoi}</p>}
        </form>
      ) : (
        <p className="border-t border-slate-200 pt-3 text-center text-sm text-slate-400">
          Vous êtes membre de ce canal mais ne pouvez pas y publier.
        </p>
      )}
    </div>
  );
}

function MessageItem({ message, estAuteur, nomAuteur }: { message: MessageAffiche; estAuteur: boolean; nomAuteur: string }) {
  const [enEdition, setEnEdition] = useState(false);
  const [brouillon, setBrouillon] = useState(message.contenu);
  const [erreur, setErreur] = useState<string | null>(null);

  const peutCorriger = estAuteur && !message.supprime_at && Date.now() - new Date(message.created_at).getTime() < FENETRE_CORRECTION_MS;

  async function enregistrer() {
    const resultat = await modifierMessageAction(message.id, brouillon);
    if (resultat?.erreur) {
      setErreur(resultat.erreur);
      return;
    }
    setEnEdition(false);
    setErreur(null);
  }

  async function supprimer() {
    await supprimerMessageAction(message.id);
  }

  return (
    <div className={`flex ${estAuteur ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-lg border px-3 py-2 text-sm ${message.urgent ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"}`}>
        <div className="mb-0.5 flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium text-slate-700">{nomAuteur}</span>
          <span>{new Date(message.created_at).toLocaleString("fr-FR")}</span>
          {message.urgent && <span className="font-semibold text-red-700">URGENT</span>}
          {message.modifie_at && !message.supprime_at && <span>(modifié)</span>}
        </div>

        {message.supprime_at ? (
          <p className="italic text-slate-400">Message supprimé par son auteur</p>
        ) : enEdition ? (
          <div className="space-y-1">
            <textarea
              value={brouillon}
              onChange={(e) => setBrouillon(e.target.value)}
              rows={2}
              maxLength={10000}
              className="w-full resize-none rounded border border-slate-300 px-2 py-1 text-sm"
            />
            {erreur && <p className="text-xs text-red-600">{erreur}</p>}
            <div className="flex gap-2 text-xs">
              <button onClick={enregistrer} className="rounded bg-slate-900 px-2 py-1 text-white">
                Enregistrer
              </button>
              <button onClick={() => setEnEdition(false)} className="rounded border border-slate-300 px-2 py-1">
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-slate-900">{message.contenu}</p>
        )}

        {message.pieces.length > 0 && !message.supprime_at && (
          <ul className="mt-1 space-y-0.5">
            {message.pieces.map((piece) => (
              <li key={piece.id}>
                {piece.url ? (
                  <a href={piece.url} className="text-xs text-blue-600 underline" target="_blank" rel="noreferrer">
                    📎 {piece.nom_fichier}
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">📎 {piece.nom_fichier} (lien expiré, rechargez la page)</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {peutCorriger && !enEdition && (
          <div className="mt-1 flex gap-2 text-xs text-slate-400">
            <button onClick={() => setEnEdition(true)} className="hover:text-slate-700 hover:underline">
              Modifier
            </button>
            <button onClick={supprimer} className="hover:text-red-700 hover:underline">
              Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
