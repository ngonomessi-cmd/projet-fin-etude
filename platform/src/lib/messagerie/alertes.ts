import { creerClientAdmin } from "@/lib/supabase/admin";
import { LABEL_ROLE } from "@/lib/labels";
import type { RoleUtilisateur } from "@/lib/types";

// Déclenchée depuis envoyerMessageAction juste après l'insertion réussie
// d'un message — pas seulement par une tâche planifiée : "envoyées
// seulement si le destinataire est hors ligne depuis plus de 2 minutes, et
// au plus 1 par heure et par conversation" (cf. fonction SQL
// alertes_email_a_envoyer, migration 0010). Utilise la clé service_role
// (seule à pouvoir lire l'adresse e-mail via auth.admin.getUserById), donc
// un client admin dédié plutôt que le client de session de l'appelant.
//
// Chaque appel RPC/fetch ci-dessous est attendu (await) : dans une Server
// Action, une promesse non attendue est annulée dès la fin de la fonction et
// sa requête n'arrive jamais à destination.
export async function envoyerAlertesPourMessage(messageId: string): Promise<void> {
  const cleResend = process.env.RESEND_API_KEY;
  const expediteur = process.env.RESEND_FROM_EMAIL;
  const supabase = creerClientAdmin();

  const { data: alertes, error } = await supabase.rpc("alertes_email_a_envoyer", { p_message_id: messageId });
  if (error || !alertes) return;

  for (const alerte of alertes) {
    const { data: utilisateur } = await supabase.auth.admin.getUserById(alerte.destinataire_id);
    const email = utilisateur.user?.email;
    if (!email) continue;

    if (cleResend && expediteur) {
      const fonction = LABEL_ROLE[alerte.auteur_role as RoleUtilisateur] ?? alerte.auteur_role;
      // Lien direct vers la conversation : si l'agent n'est pas connecté, le
      // middleware (cf. lib/supabase/middleware.ts) le renvoie vers
      // /login?redirect=... puis le ramène ici une fois connecté — "ouvre
      // directement la conversation, y compris après une connexion".
      const urlBase = process.env.NEXT_PUBLIC_SITE_URL ?? "";
      const lienConversation = `${urlBase}/messagerie/${alerte.conversation_id}`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${cleResend}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: expediteur,
          to: email,
          subject: "GED KHS Bank — Nouveau message dans votre messagerie interne / New message in your internal messaging",
          html: `
            <p><strong>Nouveau message</strong> de ${alerte.auteur_nom} (${fonction}) dans « ${alerte.conversation_titre} ».</p>
            <p><a href="${lienConversation}">Ouvrir le message</a></p>
            <p><strong>New message</strong> from ${alerte.auteur_nom} (${fonction}) in "${alerte.conversation_titre}".</p>
            <p><a href="${lienConversation}">Open the message</a></p>
          `,
        }),
      }).catch(() => null);
    }

    await supabase.from("alertes_email_messagerie").insert({
      message_id: alerte.message_id,
      destinataire_id: alerte.destinataire_id,
      conversation_id: alerte.conversation_id,
    });
  }
}
