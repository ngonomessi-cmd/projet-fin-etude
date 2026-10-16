"use client";

import { useEffect, useRef } from "react";
import { creerClientNavigateur } from "@/lib/supabase/client";

// Monté une seule fois dans NavBar (donc sur toute page authentifiée) :
// (1) signale la présence toutes les 30 s tant que l'onglet est visible —
//     sert à la fois à l'alerte e-mail ("hors ligne depuis plus de 2
//     minutes") et, de façon approchée, au statut "reçu" ;
// (2) écoute Realtime globale (toute la messagerie, pas seulement la
//     conversation ouverte) pour marquer "reçu" dès qu'un nouveau message
//     arrive ailleurs sur le site — RLS s'applique au flux Realtime comme à
//     une requête normale, cet abonnement sans filtre ne reçoit donc que les
//     messages des conversations dont l'utilisateur est déjà participant.
export function PresenceMessagerie() {
  const supabaseRef = useRef(creerClientNavigateur());

  useEffect(() => {
    const supabase = supabaseRef.current;

    function signaler() {
      if (document.visibilityState === "visible") {
        supabase.rpc("signaler_activite");
      }
    }

    signaler();
    const intervalle = setInterval(signaler, 30_000);
    document.addEventListener("visibilitychange", signaler);

    const canal = supabase
      .channel("presence-messagerie-globale")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const message = payload.new as { id: string };
        supabase.rpc("marquer_message_recu", { p_message_id: message.id });
      })
      .subscribe();

    return () => {
      clearInterval(intervalle);
      document.removeEventListener("visibilitychange", signaler);
      supabase.removeChannel(canal);
    };
  }, []);

  return null;
}
