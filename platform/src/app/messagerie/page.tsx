import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { LABEL_TYPE_CONVERSATION } from "@/lib/labels";
import { ParametresRetention } from "./ParametresRetention";
import { ListeConversationsInteractive, type ConversationAffichee } from "./ListeConversationsInteractive";
import type { Conversation, Message, ParametresMessagerie, ParticipantConversation, Profil } from "@/lib/types";

type ParticipantAvecProfil = ParticipantConversation & { profiles: Pick<Profil, "id" | "nom_complet" | "role"> | null };

export default async function PageMessagerie() {
  const supabase = await creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const idUtilisateur = user.id;

  const { data: profilData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profil = profilData as Profil;

  const { data: parametresData } = await supabase.from("parametres_messagerie").select("*").single();
  const parametres = parametresData as ParametresMessagerie | null;

  // La liste visible est entièrement déterminée par la policy RLS
  // "conversations_lecture_participant" — on ne voit que ce dont on est membre.
  const { data: participationsData } = await supabase
    .from("conversation_participants")
    .select("*, conversations(*)")
    .eq("profil_id", user.id);

  type Participation = ParticipantConversation & { conversations: Conversation | null };
  const participations = (participationsData ?? []) as Participation[];
  const conversations = participations
    .map((p) => p.conversations)
    .filter((c): c is Conversation => c !== null);

  const idsConversations = conversations.map((c) => c.id);

  const [{ data: messagesData }, { data: participantsData }] = await Promise.all([
    idsConversations.length
      ? supabase
          .from("messages")
          .select("*")
          .in("conversation_id", idsConversations)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as Message[] }),
    idsConversations.length
      ? supabase
          .from("conversation_participants")
          .select("*, profiles(id, nom_complet, role)")
          .in("conversation_id", idsConversations)
      : Promise.resolve({ data: [] as ParticipantAvecProfil[] }),
  ]);

  const messages = (messagesData ?? []) as Message[];
  const participants = (participantsData ?? []) as ParticipantAvecProfil[];

  const mesParticipations = new Map(participations.map((p) => [p.conversation_id, p]));

  function dernierMessage(conversationId: string) {
    return messages.find((m) => m.conversation_id === conversationId) ?? null;
  }

  function nombreNonLus(conversationId: string) {
    const maParticipation = mesParticipations.get(conversationId);
    const seuil = maParticipation?.dernier_lu_at ?? "1970-01-01T00:00:00Z";
    return messages.filter(
      (m) => m.conversation_id === conversationId && m.auteur_id !== idUtilisateur && m.supprime_at === null && m.created_at > seuil
    ).length;
  }

  function nomAffiche(conversation: Conversation) {
    if (conversation.type === "privee") {
      const autre = participants.find((p) => p.conversation_id === conversation.id && p.profil_id !== idUtilisateur);
      return autre?.profiles?.nom_complet ?? "Conversation privée";
    }
    return conversation.titre ?? LABEL_TYPE_CONVERSATION[conversation.type];
  }

  const conversationsTriees = [...conversations].sort((a, b) => {
    const da = dernierMessage(a.id)?.created_at ?? a.created_at;
    const db = dernierMessage(b.id)?.created_at ?? b.created_at;
    return db.localeCompare(da);
  });

  const conversationsAffichees: ConversationAffichee[] = conversationsTriees.map((c) => {
    const dernier = dernierMessage(c.id);
    const maParticipation = mesParticipations.get(c.id);
    return {
      id: c.id,
      type: c.type,
      nom: nomAffiche(c),
      dernierApercu: dernier ? (dernier.supprime_at ? "Message supprimé par son auteur" : dernier.contenu) : null,
      dernierEstMoi: dernier?.auteur_id === idUtilisateur,
      nonLus: nombreNonLus(c.id),
      archivee: maParticipation?.archivee ?? false,
      sourdine: maParticipation?.sourdine ?? false,
    };
  });

  return (
    <div className="flex min-h-screen">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="font-serif text-2xl font-semibold">Messagerie</h1>
              <p className="text-sm text-paper-muted">
                Conversations privées, groupes de travail et canaux officiels — visibles uniquement par leurs
                participants.
              </p>
            </div>
            <Link
              href="/messagerie/nouvelle"
              className="flex shrink-0 items-center gap-2 rounded-md bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Nouvelle conversation
            </Link>
          </div>

          {profil.role === "administrateur" && parametres && <ParametresRetention dureeActuelle={parametres.duree_conservation_ans} />}

          <ListeConversationsInteractive conversations={conversationsAffichees} />
        </div>
      </main>
    </div>
  );
}

