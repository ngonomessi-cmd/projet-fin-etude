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
      <div className="flex-1 space-y-4 overflow-y-auto py-4">
        {messages.length === 0 && <p className="text-center text-sm text-paper-soft">Aucun message pour l&apos;instant.</p>}
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} estAuteur={message.auteur_id === utilisateurId} nomAuteur={nomAuteur(message.auteur_id)} />
        ))}
        <div ref={finRef} />
      </div>

      {peutPublier ? (
        <form ref={formRef} action={envoyer} className="border-t border-paper-200 pt-4 pb-1">
          <div className="rounded-xl border border-paper-200 bg-white p-3">
            <textarea
              name="contenu"
              required
              rows={2}
              maxLength={10000}
              placeholder="Écrire un message…"
              className="w-full resize-none border-0 text-sm outline-none"
            />
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-paper-muted">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M21.44 11.05 12.25 20.24a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95L10.1 17.15a2 2 0 0 1-2.83-2.83l8.49-8.49" />
                  </svg>
                  <input
                    name="fichier"
                    type="file"
                    className="max-w-40 text-xs text-paper-muted file:mr-2 file:rounded file:border-0 file:bg-paper-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-[#1c2029] hover:file:bg-paper-200"
                  />
                </div>
                {peutUrgent && (
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-red-700">
                    <input type="checkbox" name="urgent" className="accent-red-700" />
                    Urgent
                  </label>
                )}
              </div>
              <button
                type="submit"
                disabled={enCours}
                className="flex items-center gap-2 rounded-md bg-gold-500 px-4 py-1.5 text-sm font-bold text-navy-950 hover:bg-gold-600 hover:text-white disabled:opacity-50"
              >
                {enCours ? "Envoi…" : "Envoyer"}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <path d="M22 2 11 13" />
                  <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
                </svg>
              </button>
            </div>
          </div>
          {erreurEnvoi && <p className="mt-1.5 text-sm text-red-600">{erreurEnvoi}</p>}
        </form>
      ) : (
        <p className="border-t border-paper-200 pt-3 text-center text-sm text-paper-soft">
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

  const classesBulle = message.urgent
    ? "border border-[#E7C9C4] border-l-[3px] border-l-red-700 bg-red-50 rounded-xl rounded-bl-sm"
    : estAuteur
      ? "bg-navy-950 text-white rounded-xl rounded-br-sm"
      : "border border-paper-200 bg-white rounded-xl rounded-bl-sm";

  return (
    <div className={`flex ${estAuteur ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] px-3.5 py-2.5 text-sm ${classesBulle}`}>
        <div className={`mb-1 flex items-center gap-2 text-xs ${estAuteur && !message.urgent ? "text-white/60" : "text-paper-muted"}`}>
          <span className={`font-semibold ${estAuteur && !message.urgent ? "text-white/80" : "text-[#1c2029]"}`}>{nomAuteur}</span>
          <span>{new Date(message.created_at).toLocaleString("fr-FR")}</span>
          {message.urgent && <span className="font-bold tracking-wide text-red-700">URGENT</span>}
          {message.modifie_at && !message.supprime_at && <span>(modifié)</span>}
        </div>

        {message.supprime_at ? (
          <p className={`italic ${estAuteur ? "text-white/50" : "text-paper-soft"}`}>Message supprimé par son auteur</p>
        ) : enEdition ? (
          <div className="space-y-1.5">
            <textarea
              value={brouillon}
              onChange={(e) => setBrouillon(e.target.value)}
              rows={2}
              maxLength={10000}
              className="w-full resize-none rounded border border-paper-200 px-2 py-1 text-sm text-[#1c2029]"
            />
            {erreur && <p className="text-xs text-red-600">{erreur}</p>}
            <div className="flex gap-2 text-xs">
              <button onClick={enregistrer} className="rounded bg-navy-950 px-2 py-1 text-white">
                Enregistrer
              </button>
              <button onClick={() => setEnEdition(false)} className="rounded border border-paper-200 px-2 py-1 text-[#1c2029]">
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{message.contenu}</p>
        )}

        {message.pieces.length > 0 && !message.supprime_at && (
          <ul className="mt-2 space-y-1">
            {message.pieces.map((piece) => (
              <li key={piece.id}>
                {piece.url ? (
                  <a
                    href={piece.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${estAuteur && !message.urgent ? "border-white/20 bg-white/10 text-white" : "border-paper-200 bg-paper-50 text-[#1c2029]"}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M21.44 11.05 12.25 20.24a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95L10.1 17.15a2 2 0 0 1-2.83-2.83l8.49-8.49" />
                    </svg>
                    {piece.nom_fichier}
                  </a>
                ) : (
                  <span className="text-xs text-paper-soft">{piece.nom_fichier} (lien expiré, rechargez la page)</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {peutCorriger && !enEdition && (
          <div className={`mt-1.5 flex gap-3 text-xs ${estAuteur && !message.urgent ? "text-white/50" : "text-paper-soft"}`}>
            <button onClick={() => setEnEdition(true)} className="hover:underline">
              Modifier
            </button>
            <button onClick={supprimer} className="hover:text-red-500 hover:underline">
              Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
