import { notFound } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { marquerConversationLueAction } from "../actions";
import { ConversationTempsReel } from "./ConversationTempsReel";
import { ArchiverBouton } from "./ArchiverBouton";
import { LABEL_TYPE_CONVERSATION } from "@/lib/labels";
import type { Conversation, Message, ParticipantConversation, PieceJointeMessage, Profil } from "@/lib/types";

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

  const [{ data: profilData }, { data: participantsData }, { data: messagesData }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("conversation_participants")
      .select("*, profiles(id, nom_complet, role, departement)")
      .eq("conversation_id", id),
    supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true }),
  ]);

  const profil = profilData as Profil;
  type ParticipantAvecProfil = ParticipantConversation & { profiles: Profil | null };
  const participants = (participantsData ?? []) as ParticipantAvecProfil[];
  const messages = (messagesData ?? []) as Message[];

  const maParticipation = participants.find((p) => p.profil_id === user.id);
  if (!maParticipation) notFound();

  const { data: piecesData } = messages.length
    ? await supabase
        .from("pieces_jointes_message")
        .select("*")
        .in(
          "message_id",
          messages.map((m) => m.id)
        )
    : { data: [] as PieceJointeMessage[] };
  const pieces = (piecesData ?? []) as PieceJointeMessage[];

  const piecesAvecUrl = await Promise.all(
    pieces.map(async (piece) => {
      const { data } = await supabase.storage.from("messagerie-pieces-jointes").createSignedUrl(piece.storage_path, 60);
      return { ...piece, url: data?.signedUrl ?? null };
    })
  );

  // On marque la conversation comme lue dès l'ouverture de la page.
  await marquerConversationLueAction(id);

  const profilsParId = new Map(participants.map((p) => [p.profil_id, p.profiles]));

  const titre =
    conversation.type === "privee"
      ? (participants.find((p) => p.profil_id !== user.id)?.profiles?.nom_complet ?? "Conversation privée")
      : (conversation.titre ?? LABEL_TYPE_CONVERSATION[conversation.type]);

  return (
    <>
      <NavBar />
      <main className="mx-auto flex h-[calc(100vh-57px)] max-w-3xl flex-col px-4 py-6">
        <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{titre}</h1>
            <p className="text-xs text-slate-500">
              {LABEL_TYPE_CONVERSATION[conversation.type]}
              {conversation.type !== "privee" && ` · ${participants.length} participant${participants.length > 1 ? "s" : ""}`}
              {conversation.type === "canal" &&
                ` · publient : ${participants
                  .filter((p) => p.peut_publier)
                  .map((p) => p.profiles?.nom_complet)
                  .join(", ")}`}
            </p>
          </div>
          <ArchiverBouton conversationId={id} archivee={maParticipation.archivee} />
        </div>

        <ConversationTempsReel
          conversationId={id}
          messagesInitiaux={messages.map((m) => ({ ...m, pieces: piecesAvecUrl.filter((p) => p.message_id === m.id) }))}
          utilisateurId={user.id}
          peutPublier={maParticipation.peut_publier}
          peutUrgent={profil.role === "administrateur" || profil.role === "validateur"}
          nomAuteur={(auteurId) => (auteurId === user.id ? "Vous" : (profilsParId.get(auteurId)?.nom_complet ?? "Agent"))}
        />
      </main>
    </>
  );
}
