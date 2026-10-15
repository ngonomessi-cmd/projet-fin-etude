"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { archiverConversationAction } from "../actions";

export function ArchiverBouton({ conversationId, archivee }: { conversationId: string; archivee: boolean }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function basculer() {
    setEnCours(true);
    await archiverConversationAction(conversationId, !archivee);
    setEnCours(false);
    router.refresh();
  }

  return (
    <button
      onClick={basculer}
      disabled={enCours}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
    >
      {archivee ? "Désarchiver" : "Archiver"}
    </button>
  );
}
