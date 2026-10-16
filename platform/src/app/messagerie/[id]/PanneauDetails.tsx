"use client";

import { useState } from "react";
import { LABEL_ROLE } from "@/lib/labels";
import type { Message, RoleUtilisateur, StatutMessage } from "@/lib/types";

type ParticipantAffiche = { profilId: string; nom: string; role: RoleUtilisateur };

export function PanneauDetails({
  participants,
  dernierMessagePropre,
  statuts,
  utilisateurId,
}: {
  participants: ParticipantAffiche[];
  dernierMessagePropre: Message | null;
  statuts: StatutMessage[];
  utilisateurId: string;
}) {
  const [ouvert, setOuvert] = useState(false);

  const statutsDernierMessage = dernierMessagePropre
    ? new Map(statuts.filter((s) => s.message_id === dernierMessagePropre.id).map((s) => [s.profil_id, s]))
    : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOuvert((v) => !v)}
        className="rounded-md border border-paper-200 px-3 py-1.5 text-sm text-paper-muted hover:bg-paper-50"
      >
        Détails
      </button>

      {ouvert && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOuvert(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-paper-200 bg-white p-4 shadow-lg">
            <h3 className="mb-2 font-serif text-sm font-semibold">Participants ({participants.length})</h3>
            <ul className="mb-3 max-h-48 space-y-1 overflow-y-auto text-sm">
              {participants.map((p) => (
                <li key={p.profilId} className="flex items-center justify-between">
                  <span className="text-[#1c2029]">{p.profilId === utilisateurId ? `${p.nom} (vous)` : p.nom}</span>
                  <span className="text-xs text-paper-soft">{LABEL_ROLE[p.role]}</span>
                </li>
              ))}
            </ul>

            {dernierMessagePropre && statutsDernierMessage && (
              <>
                <h3 className="mb-2 font-serif text-sm font-semibold">Accusés — votre dernier message</h3>
                <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
                  {participants
                    .filter((p) => p.profilId !== utilisateurId)
                    .map((p) => {
                      const statut = statutsDernierMessage.get(p.profilId);
                      const texte = statut?.lu_at
                        ? `Lu à ${new Date(statut.lu_at).toLocaleTimeString("fr-FR")}`
                        : statut?.recu_at
                          ? `Reçu à ${new Date(statut.recu_at).toLocaleTimeString("fr-FR")}`
                          : "Pas encore reçu";
                      return (
                        <li key={p.profilId} className="flex items-center justify-between">
                          <span className="text-[#1c2029]">{p.nom}</span>
                          <span className="text-xs text-paper-soft">{texte}</span>
                        </li>
                      );
                    })}
                </ul>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
