"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { archiverConversationAction } from "../actions";
import { useTraduction } from "@/components/i18n/Langue";

export function ArchiverBouton({ conversationId, archivee }: { conversationId: string; archivee: boolean }) {
  const { t } = useTraduction();
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
      className="rounded-md border border-paper-200 px-3 py-1.5 text-sm font-medium text-paper-muted hover:bg-paper-50 disabled:opacity-50"
    >
      {archivee ? t("Désarchiver", "Unarchive") : t("Archiver", "Archive")}
    </button>
  );
}
