import Link from "next/link";
import { notFound } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { marquerConversationLueAction } from "../actions";
import { ConversationTempsReel } from "./ConversationTempsReel";
import { ArchiverBouton } from "./ArchiverBouton";
import { SourdineBouton } from "./SourdineBouton";
import { GererCanalBouton } from "./GererCanalBouton";
import { PanneauDetails } from "./PanneauDetails";
import { LABEL_TYPE_CONVERSATION } from "@/lib/labels";
import type { Conversation, Message, ParticipantConversation, PieceJointeMessage, Profil, StatutMessage } from "@/lib/types";

export default async function PageConversation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // RLS "conversations_lecture_participant" : null si l'utilisateur n'est pas
  // participant — on traite ça comme une conversation introuvable.
  const { data: conversationData } = await supabase.from("conversations").select("*").eq("id", id).maybeSingle();
  if (!conversationData) notFound();
  const conversation = conversationData as Conversation;

  const [{ data: profilData }, { data: participantsData }, { data: messagesData }, { data: ciblesData }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("conversation_participants")
      .select("*, profiles(id, nom_complet, role, departement)")
      .eq("conversation_id", id),
    supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true }),
    supabase
      .from("conversation_participants")
      .select("conversation_id, peut_publier, conversations(id, type, titre)")
      .eq("profil_id", user.id)
      .eq("peut_publier", true)
      .neq("conversation_id", id),
  ]);

  const profil = profilData as Profil;
  type ParticipantAvecProfil = ParticipantConversation & { profiles: Profil | null };
  const participants = (participantsData ?? []) as ParticipantAvecProfil[];
  const messages = (messagesData ?? []) as Message[];

  const maParticipation = participants.find((p) => p.profil_id === user.id);
  if (!maParticipation) notFound();

  const [{ data: piecesData }, { data: statutsData }] = await Promise.all([
    messages.length
      ? supabase
          .from("pieces_jointes_message")
          .select("*")
          .in(
            "message_id",
            messages.map((m) => m.id)
          )
      : Promise.resolve({ data: [] as PieceJointeMessage[] }),
    messages.length
      ? supabase
          .from("message_statuts")
          .select("*")
          .in(
            "message_id",
            messages.map((m) => m.id)
          )
      : Promise.resolve({ data: [] as StatutMessage[] }),
  ]);
  const pieces = (piecesData ?? []) as PieceJointeMessage[];
  const statuts = (statutsData ?? []) as StatutMessage[];

  const piecesAvecUrl = await Promise.all(
    pieces.map(async (piece) => {
      const { data } = await supabase.storage.from("messagerie-pieces-jointes").createSignedUrl(piece.storage_path, 60);
      return { ...piece, url: data?.signedUrl ?? null };
    })
  );

  // On marque la conversation comme lue dès l'ouverture de la page.
  await marquerConversationLueAction(id);

  const profilsParId = new Map(participants.map((p) => [p.profil_id, p.profiles]));
  // Un Server Component ne peut pas passer une fonction à un Client
  // Component (seules les Server Actions le peuvent) : on passe donc une
  // table de correspondance sérialisable plutôt qu'une closure "nomAuteur".
  const nomsParId: Record<string, string> = {};
  for (const p of participants) {
    if (p.profiles) nomsParId[p.profil_id] = p.profiles.nom_complet;
  }

  type ConversationAllegee = Pick<Conversation, "id" | "type" | "titre">;
  type Cible = { conversation_id: string; conversations: ConversationAllegee | ConversationAllegee[] | null };
  const conversationsCibles = ((ciblesData ?? []) as Cible[])
    .map((c) => (Array.isArray(c.conversations) ? c.conversations[0] : c.conversations))
    .filter((c): c is ConversationAllegee => c !== null && c !== undefined)
    .map((c) => ({
      id: c.id,
      nom: c.type === "privee" ? "Conversation privée" : (c.titre ?? LABEL_TYPE_CONVERSATION[c.type]),
    }));

  const titre =
    conversation.type === "privee"
      ? (participants.find((p) => p.profil_id !== user.id)?.profiles?.nom_complet ?? "Conversation privée")
      : (conversation.titre ?? LABEL_TYPE_CONVERSATION[conversation.type]);

  const initiales = titre
    .split(" ")
    .filter(Boolean)
    .map((mot) => mot[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <NavBar />
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-4 sm:px-8 sm:py-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-y-2 border-b border-paper-200 pb-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/messagerie"
                aria-label="Retour à la messagerie"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-paper-muted hover:bg-paper-50 hover:text-[#1c2029]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </Link>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5B5447] text-xs font-bold text-white">
                {initiales}
              </div>
              <div className="min-w-0">
                <h1 className="font-serif text-lg font-semibold">{titre}</h1>
                <p className="text-xs text-paper-muted">
                  {LABEL_TYPE_CONVERSATION[conversation.type]}
                  {conversation.type !== "privee" && ` · ${participants.length} participant${participants.length > 1 ? "s" : ""}`}
                  {conversation.type === "canal" &&
                    ` · publient : ${participants
                      .filter((p) => p.peut_publier)
                      .map((p) => p.profiles?.nom_complet)
                      .join(", ")}`}
                </p>
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <PanneauDetails
                participants={participants.map((p) => ({
                  profilId: p.profil_id,
                  nom: p.profiles?.nom_complet ?? "Agent",
                  role: p.profiles?.role ?? "lecteur",
                }))}
                dernierMessagePropre={[...messages].reverse().find((m) => m.auteur_id === user.id) ?? null}
                statuts={statuts}
                utilisateurId={user.id}
              />
              <SourdineBouton conversationId={id} sourdine={maParticipation.sourdine} />
              <ArchiverBouton conversationId={id} archivee={maParticipation.archivee} />
              {conversation.type === "canal" && profil.role === "administrateur" && (
                <GererCanalBouton conversationId={id} titreActuel={conversation.titre ?? titre} />
              )}
            </div>
          </div>

          <ConversationTempsReel
            conversationId={id}
            messagesInitiaux={messages.map((m) => ({
              ...m,
              pieces: piecesAvecUrl.filter((p) => p.message_id === m.id),
              statuts: statuts.filter((s) => s.message_id === m.id),
            }))}
            utilisateurId={user.id}
            peutPublier={maParticipation.peut_publier}
            peutUrgent={profil.role === "administrateur" || profil.role === "validateur"}
            nomsParId={nomsParId}
            nombreAutresParticipants={participants.length - 1}
            conversationsCibles={conversationsCibles}
          />
        </div>
      </main>
    </div>
  );
}
