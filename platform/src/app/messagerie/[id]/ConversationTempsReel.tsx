"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { creerClientNavigateur } from "@/lib/supabase/client";
import {
  envoyerMessageAction,
  modifierMessageAction,
  supprimerMessageAction,
  marquerConversationLueAction,
  transfererMessageAction,
} from "../actions";
import type { Message, PieceJointeMessage, StatutMessage } from "@/lib/types";
import { useTraduction } from "@/components/i18n/Langue";

type MessageAffiche = Message & { pieces: (PieceJointeMessage & { url: string | null })[]; statuts: StatutMessage[] };
type ConversationCible = { id: string; nom: string };

const FENETRE_CORRECTION_MS = 15 * 60 * 1000;
const INTERVALLE_RELECTURE_MS = 4000;

export function ConversationTempsReel({
  conversationId,
  messagesInitiaux,
  utilisateurId,
  peutPublier,
  peutUrgent,
  nomsParId,
  nombreAutresParticipants,
  conversationsCibles,
}: {
  conversationId: string;
  messagesInitiaux: MessageAffiche[];
  utilisateurId: string;
  peutPublier: boolean;
  peutUrgent: boolean;
  nomsParId: Record<string, string>;
  nombreAutresParticipants: number;
  conversationsCibles: ConversationCible[];
}) {
  const { t } = useTraduction();
  const [messages, setMessages] = useState<MessageAffiche[]>(messagesInitiaux);
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [nomFichierChoisi, setNomFichierChoisi] = useState<string | null>(null);
  const supabaseRef = useRef(creerClientNavigateur());
  const formRef = useRef<HTMLFormElement>(null);
  const finRef = useRef<HTMLDivElement>(null);
  const fichierRef = useRef<HTMLInputElement>(null);

  function nomAuteur(auteurId: string) {
    return auteurId === utilisateurId ? t("Vous", "You") : (nomsParId[auteurId] ?? t("Agent", "Member"));
  }

  useEffect(() => {
    const supabase = supabaseRef.current;
    const canal = supabase
      .channel(`messagerie-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const nouveau = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === nouveau.id) ? prev : [...prev, { ...nouveau, pieces: [], statuts: [] }]));
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
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "message_statuts" }, (payload) => {
        const statut = payload.new as StatutMessage;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === statut.message_id
              ? { ...m, statuts: [...m.statuts.filter((s) => s.profil_id !== statut.profil_id), statut] }
              : m
          )
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [conversationId]);

  // Relecture de secours (3-5 s) : au cas où un évènement Realtime serait
  // manqué, on revient chercher les accusés des messages affichés.
  useEffect(() => {
    const idsMessages = messages.map((m) => m.id);
    if (idsMessages.length === 0) return;

    const intervalle = setInterval(async () => {
      const { data } = await supabaseRef.current.from("message_statuts").select("*").in("message_id", idsMessages);
      if (!data) return;
      const parMessage = new Map<string, StatutMessage[]>();
      for (const s of data as StatutMessage[]) {
        parMessage.set(s.message_id, [...(parMessage.get(s.message_id) ?? []), s]);
      }
      setMessages((prev) => prev.map((m) => (parMessage.has(m.id) ? { ...m, statuts: parMessage.get(m.id)! } : m)));
    }, INTERVALLE_RELECTURE_MS);

    return () => clearInterval(intervalle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // Marque la conversation comme lue dès qu'elle est affichée et que
  // l'onglet est visible, et à chaque nouveau message tant que c'est le cas.
  useEffect(() => {
    function marquerSiVisible() {
      if (document.visibilityState === "visible") {
        marquerConversationLueAction(conversationId);
      }
    }
    marquerSiVisible();
    document.addEventListener("visibilitychange", marquerSiVisible);
    return () => document.removeEventListener("visibilitychange", marquerSiVisible);
  }, [conversationId, messages.length]);

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
    setNomFichierChoisi(null);
  }

  function surToucheTextarea(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto py-4">
        {messages.length === 0 && <p className="text-center text-sm text-paper-soft">{t("Aucun message pour l'instant.", "No messages yet.")}</p>}
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            estAuteur={message.auteur_id === utilisateurId}
            nomAuteur={nomAuteur(message.auteur_id)}
            nombreAutresParticipants={nombreAutresParticipants}
            conversationsCibles={conversationsCibles}
            nomMessageOrigine={message.transfere_de_message_id ? "transfere" : null}
          />
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
              placeholder={t(
                "Écrire un message… (Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne)",
                "Write a message… (Enter to send, Shift+Enter for a new line)"
              )}
              onKeyDown={surToucheTextarea}
              className="w-full resize-none border-0 text-sm outline-none"
            />
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-1.5 text-paper-muted">
                  <input
                    ref={fichierRef}
                    name="fichier"
                    type="file"
                    className="hidden"
                    onChange={(e) => setNomFichierChoisi(e.target.files?.[0]?.name ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => fichierRef.current?.click()}
                    className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border-0 bg-paper-100 px-2 py-1 text-xs font-medium text-[#1c2029] hover:bg-paper-200"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M21.44 11.05 12.25 20.24a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95L10.1 17.15a2 2 0 0 1-2.83-2.83l8.49-8.49" />
                    </svg>
                    {t("Joindre un fichier", "Attach a file")}
                  </button>
                  {nomFichierChoisi && <span className="max-w-32 truncate text-xs">{nomFichierChoisi}</span>}
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
                {enCours ? t("Envoi…", "Sending…") : t("Envoyer", "Send")}
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
          {t("Vous êtes membre de ce canal mais ne pouvez pas y publier.", "You are a member of this channel but cannot post in it.")}
        </p>
      )}
    </div>
  );
}

function Coches({ statuts, nombreAutresParticipants }: { statuts: StatutMessage[]; nombreAutresParticipants: number }) {
  if (nombreAutresParticipants <= 0) return null;
  const tousLus = statuts.filter((s) => s.lu_at).length >= nombreAutresParticipants;
  const tousRecus = statuts.filter((s) => s.recu_at).length >= nombreAutresParticipants;

  const couleur = tousLus ? "#2563EB" : "currentColor";
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke={couleur} strokeWidth="1.6" aria-hidden="true" className="inline-block align-middle">
      <path d="m1 5.5 2.8 3L9 2" />
      {(tousRecus || tousLus) && <path d="m6.5 5.5 2.8 3L15 2" />}
    </svg>
  );
}

function MessageItem({
  message,
  estAuteur,
  nomAuteur,
  nombreAutresParticipants,
  conversationsCibles,
  nomMessageOrigine,
}: {
  message: MessageAffiche;
  estAuteur: boolean;
  nomAuteur: string;
  nombreAutresParticipants: number;
  conversationsCibles: ConversationCible[];
  nomMessageOrigine: string | null;
}) {
  const { t, dl } = useTraduction();
  const [enEdition, setEnEdition] = useState(false);
  const [brouillon, setBrouillon] = useState(message.contenu);
  const [erreur, setErreur] = useState<string | null>(null);
  const [menuOuvert, setMenuOuvert] = useState<"infos" | "transferer" | null>(null);
  const [transfertEnCours, setTransfertEnCours] = useState(false);

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

  async function transferer(conversationCibleId: string) {
    setTransfertEnCours(true);
    await transfererMessageAction(message.id, conversationCibleId);
    setTransfertEnCours(false);
    setMenuOuvert(null);
  }

  return (
    <div className={`group flex ${estAuteur ? "justify-end" : "justify-start"}`}>
      <div className="flex max-w-[75%] items-end gap-1.5">
        {estAuteur && (
          <div className="relative mb-1 hidden shrink-0 gap-1 group-hover:flex">
            <BoutonAction titre={t("Infos", "Info")} onClick={() => setMenuOuvert(menuOuvert === "infos" ? null : "infos")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </BoutonAction>
            {menuOuvert === "infos" && (
              <PopoverInfos statuts={message.statuts} onFermer={() => setMenuOuvert(null)} />
            )}
          </div>
        )}

        <div className={`px-3.5 py-2.5 text-sm ${bulleClasses(message, estAuteur)}`}>
          <div className={`mb-1 flex items-center gap-2 text-xs ${estAuteur && !message.urgent ? "text-white/60" : "text-paper-muted"}`}>
            <span className={`font-semibold ${estAuteur && !message.urgent ? "text-white/80" : "text-[#1c2029]"}`}>{nomAuteur}</span>
            <span>{new Date(message.created_at).toLocaleString(dl)}</span>
            {message.urgent && <span className="font-bold tracking-wide text-red-700">URGENT</span>}
            {message.modifie_at && !message.supprime_at && <span>({t("modifié", "edited")})</span>}
          </div>

          {nomMessageOrigine && !message.supprime_at && (
            <p className={`mb-1 text-xs italic ${estAuteur && !message.urgent ? "text-white/60" : "text-paper-soft"}`}>↪ {t("Transféré", "Forwarded")}</p>
          )}

          {message.supprime_at ? (
            <p className={`italic ${estAuteur ? "text-white/50" : "text-paper-soft"}`}>{t("Message supprimé par son auteur", "Message deleted by its author")}</p>
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
                  {t("Enregistrer", "Save")}
                </button>
                <button onClick={() => setEnEdition(false)} className="rounded border border-paper-200 px-2 py-1 text-[#1c2029]">
                  {t("Annuler", "Cancel")}
                </button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{avecLiensDocuments(message.contenu, t("Ouvrir le document", "Open the document"))}</p>
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
                    <span className="text-xs text-paper-soft">{piece.nom_fichier} ({t("lien expiré, rechargez la page", "link expired, reload the page")})</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-1.5 flex items-center justify-between gap-3">
            {peutCorriger && !enEdition ? (
              <div className={`flex gap-3 text-xs ${estAuteur && !message.urgent ? "text-white/50" : "text-paper-soft"}`}>
                <button onClick={() => setEnEdition(true)} className="hover:underline">
                  {t("Modifier", "Edit")}
                </button>
                <button onClick={supprimer} className="hover:text-red-500 hover:underline">
                  {t("Supprimer", "Delete")}
                </button>
              </div>
            ) : (
              <span />
            )}
            {estAuteur && !message.supprime_at && <Coches statuts={message.statuts} nombreAutresParticipants={nombreAutresParticipants} />}
          </div>
        </div>

        {!message.supprime_at && (
          <div className="relative mb-1 hidden shrink-0 gap-1 group-hover:flex">
            <BoutonAction titre={t("Transférer", "Forward")} onClick={() => setMenuOuvert(menuOuvert === "transferer" ? null : "transferer")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="m17 1 4 4-4 4" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <path d="m7 23-4-4 4-4" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            </BoutonAction>
            {menuOuvert === "transferer" && (
              <div className="absolute top-6 z-20 w-56 rounded-lg border border-paper-200 bg-white p-2 shadow-lg">
                <p className="mb-1 px-1 text-xs font-semibold text-paper-muted">{t("Transférer vers…", "Forward to…")}</p>
                {conversationsCibles.length === 0 ? (
                  <p className="px-1 py-1 text-xs text-paper-soft">{t("Aucune autre conversation disponible.", "No other conversation available.")}</p>
                ) : (
                  <ul className="max-h-48 overflow-y-auto">
                    {conversationsCibles.map((c) => (
                      <li key={c.id}>
                        <button
                          disabled={transfertEnCours}
                          onClick={() => transferer(c.id)}
                          className="w-full rounded px-2 py-1.5 text-left text-sm text-[#1c2029] hover:bg-paper-50 disabled:opacity-50"
                        >
                          {c.nom}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function bulleClasses(message: MessageAffiche, estAuteur: boolean) {
  if (message.urgent) return "border border-[#E7C9C4] border-l-[3px] border-l-red-700 bg-red-50 rounded-xl rounded-bl-sm";
  if (estAuteur) return "bg-navy-950 text-white rounded-xl rounded-br-sm";
  return "border border-paper-200 bg-white rounded-xl rounded-bl-sm";
}

function BoutonAction({ titre, onClick, children }: { titre: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      title={titre}
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center rounded-full border border-paper-200 bg-white text-paper-muted hover:bg-paper-50"
    >
      {children}
    </button>
  );
}

function PopoverInfos({ statuts, onFermer }: { statuts: StatutMessage[]; onFermer: () => void }) {
  const { t, dl } = useTraduction();
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onFermer} />
      <div className="absolute top-6 right-0 z-20 w-56 rounded-lg border border-paper-200 bg-white p-2 shadow-lg">
        <p className="mb-1 px-1 text-xs font-semibold text-paper-muted">{t("Réception / lecture", "Delivery / read")}</p>
        {statuts.length === 0 ? (
          <p className="px-1 py-1 text-xs text-paper-soft">{t("Pas encore reçu.", "Not received yet.")}</p>
        ) : (
          <ul className="space-y-1 px-1 py-1 text-xs text-[#1c2029]">
            {statuts.map((s) => (
              <li key={s.profil_id}>
                {s.lu_at
                  ? `${t("Lu à", "Read at")} ${new Date(s.lu_at).toLocaleTimeString(dl)}`
                  : s.recu_at
                    ? `${t("Reçu à", "Received at")} ${new Date(s.recu_at).toLocaleTimeString(dl)}`
                    : t("Pas encore reçu", "Not received yet")}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

// Les partages de documents insèrent « /documents/<id> » dans le message :
// rendu comme un lien interne (l'accès reste contrôlé par la fiche du document).
function avecLiensDocuments(texte: string, libelleLien: string) {
  return texte.split(/(\/documents\/[0-9a-f-]{36})/g).map((morceau, i) =>
    /^\/documents\/[0-9a-f-]{36}$/.test(morceau) ? (
      <Link key={i} href={morceau} className="font-medium underline underline-offset-2 hover:opacity-80">
        {libelleLien}
      </Link>
    ) : (
      morceau
    )
  );
}
