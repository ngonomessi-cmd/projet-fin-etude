"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { basculerSourdineAction } from "../actions";

export function SourdineBouton({ conversationId, sourdine }: { conversationId: string; sourdine: boolean }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function basculer() {
    setEnCours(true);
    await basculerSourdineAction(conversationId, !sourdine);
    setEnCours(false);
    router.refresh();
  }

  return (
    <button
      onClick={basculer}
      disabled={enCours}
      title={sourdine ? "Réactiver les notifications" : "Mettre en sourdine"}
      className="rounded-md border border-paper-200 px-3 py-1.5 text-sm text-paper-muted hover:bg-paper-50 disabled:opacity-50"
    >
      {sourdine ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M11 5 6 9H2v6h4l5 4V5Z" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M11 5 6 9H2v6h4l5 4V5Z" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  );
}
