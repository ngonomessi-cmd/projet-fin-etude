import { NextRequest, NextResponse } from "next/server";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { LABEL_ROLE } from "@/lib/labels";
import type { RoleUtilisateur } from "@/lib/types";

// Route planifiée (Vercel Cron, cf. vercel.json à la racine de "platform/") :
// (1) purge les messages au-delà de la durée de conservation réglée par
//     l'administrateur, (2) envoie les alertes par courriel aux agents ayant
//     un message non lu, au plus une par heure et par conversation, jamais
//     pour un message déjà lu (règle portée par la fonction SQL
//     alertes_email_a_envoyer, cf. migration 0008).
//
// Protégée par CRON_SECRET (en-tête Authorization: Bearer <secret>, envoyé
// automatiquement par Vercel Cron lorsque la variable d'environnement du
// même nom est définie sur le projet). Sans RESEND_API_KEY configurée, la
// purge a quand même lieu mais aucun courriel n'est envoyé — limitation
// assumée de cet environnement de démonstration (pas de fournisseur de
// courriel réellement branché), à annoncer en soutenance comme les autres
// simplifications du projet.
export async function GET(requete: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && requete.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  }

  const supabase = creerClientAdmin();

  const { data: nombrePurges, error: erreurPurge } = await supabase.rpc("purger_messages_expires");
  if (erreurPurge) {
    return NextResponse.json({ erreur: erreurPurge.message }, { status: 500 });
  }

  const { data: alertes, error: erreurAlertes } = await supabase.rpc("alertes_email_a_envoyer");
  if (erreurAlertes) {
    return NextResponse.json({ erreur: erreurAlertes.message, messages_purges: nombrePurges }, { status: 500 });
  }

  let courrielsEnvoyes = 0;
  const cleResend = process.env.RESEND_API_KEY;
  const expediteur = process.env.RESEND_FROM_EMAIL;

  for (const alerte of alertes ?? []) {
    const { data: utilisateur } = await supabase.auth.admin.getUserById(alerte.destinataire_id);
    const email = utilisateur.user?.email;
    if (!email) continue;

    if (cleResend && expediteur) {
      const fonction = LABEL_ROLE[alerte.auteur_role as RoleUtilisateur] ?? alerte.auteur_role;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${cleResend}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: expediteur,
          to: email,
          subject: "GED KHS Bank — Nouveau message dans votre Espace Agents / New message in your Agent Space",
          html: `
            <p><strong>Nouveau message</strong> de ${alerte.auteur_nom} (${fonction}) dans « ${alerte.conversation_titre} ».
            Connectez-vous à la messagerie interne pour le lire.</p>
            <p><strong>New message</strong> from ${alerte.auteur_nom} (${fonction}) in "${alerte.conversation_titre}".
            Sign in to the internal messaging to read it.</p>
          `,
        }),
      }).catch(() => null);
      courrielsEnvoyes += 1;
    }

    await supabase.from("alertes_email_messagerie").insert({
      message_id: alerte.message_id,
      destinataire_id: alerte.destinataire_id,
      conversation_id: alerte.conversation_id,
    });
  }

  return NextResponse.json({
    messages_purges: nombrePurges,
    alertes_eligibles: alertes?.length ?? 0,
    courriels_envoyes: courrielsEnvoyes,
  });
}
