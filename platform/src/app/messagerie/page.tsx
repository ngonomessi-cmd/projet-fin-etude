import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { Badge } from "@/components/Badge";
import { LABEL_TYPE_CONVERSATION } from "@/lib/labels";
import { ParametresRetention } from "./ParametresRetention";
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

  const actives = conversationsTriees.filter((c) => !mesParticipations.get(c.id)?.archivee);
  const archivees = conversationsTriees.filter((c) => mesParticipations.get(c.id)?.archivee);

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Messagerie interne</h1>
            <p className="text-sm text-slate-500">
              Conversations privées, groupes de travail et canaux officiels — visibles uniquement par leurs
              participants.
            </p>
          </div>
          <Link
            href="/messagerie/nouvelle"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Nouvelle conversation
          </Link>
        </div>

        {profil.role === "administrateur" && parametres && <ParametresRetention dureeActuelle={parametres.duree_conservation_ans} />}

        <ListeConversations
          conversations={actives}
          nomAffiche={nomAffiche}
          dernierMessage={dernierMessage}
          nombreNonLus={nombreNonLus}
          utilisateurId={user.id}
        />

        {archivees.length > 0 && (
          <details className="mt-6">
            <summary className="cursor-pointer text-sm font-medium text-slate-500">
              Archivées ({archivees.length})
            </summary>
            <div className="mt-2">
              <ListeConversations
                conversations={archivees}
                nomAffiche={nomAffiche}
                dernierMessage={dernierMessage}
                nombreNonLus={nombreNonLus}
                utilisateurId={user.id}
              />
            </div>
          </details>
        )}
      </main>
    </>
  );
}

function ListeConversations({
  conversations,
  nomAffiche,
  dernierMessage,
  nombreNonLus,
  utilisateurId,
}: {
  conversations: Conversation[];
  nomAffiche: (c: Conversation) => string;
  dernierMessage: (id: string) => Message | null;
  nombreNonLus: (id: string) => number;
  utilisateurId: string;
}) {
  if (conversations.length === 0) {
    return (
      <p className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Aucune conversation pour l&apos;instant.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
      {conversations.map((conversation) => {
        const dernier = dernierMessage(conversation.id);
        const nonLus = nombreNonLus(conversation.id);
        return (
          <Link
            key={conversation.id}
            href={`/messagerie/${conversation.id}`}
            className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 first:border-t-0 hover:bg-slate-50"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-slate-900">{nomAffiche(conversation)}</span>
                {conversation.type !== "privee" && (
                  <Badge texte={LABEL_TYPE_CONVERSATION[conversation.type]} classesCouleur="bg-slate-100 text-slate-600 border-slate-300" />
                )}
              </div>
              {dernier && (
                <p className="truncate text-sm text-slate-500">
                  {dernier.auteur_id === utilisateurId ? "Vous : " : ""}
                  {dernier.supprime_at ? "Message supprimé par son auteur" : dernier.contenu}
                </p>
              )}
            </div>
            {nonLus > 0 && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white">
                {nonLus}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
