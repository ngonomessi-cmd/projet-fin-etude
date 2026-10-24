import { NextRequest, NextResponse } from "next/server";
import { creerClientAdmin } from "@/lib/supabase/admin";

// Route planifiée (Vercel Cron, cf. vercel.json à la racine de "platform/") :
// purge les messages au-delà de la durée de conservation réglée par
// l'administrateur (3 ans par défaut, migration 0010), une fois par nuit à
// 3h30. Les alertes e-mail, elles, ne passent plus par cette route : elles
// sont déclenchées directement à l'envoi de chaque message (cf.
// lib/messagerie/alertes.ts, appelée depuis envoyerMessageAction) pour
// rester proches du temps réel — le plan gratuit Vercel limite les tâches
// planifiées à une exécution par jour, incompatible avec un contrôle "hors
// ligne depuis plus de 2 minutes" si celui-ci dépendait du cron.
//
// Protégée par CRON_SECRET (en-tête Authorization: Bearer <secret>, envoyé
// automatiquement par Vercel Cron lorsque la variable d'environnement du
// même nom est définie sur le projet).
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

  // Même passage nocturne (une seule tâche planifiée sur le plan gratuit) :
  // archivage automatique des documents publiés depuis plus du délai réglé
  // par chaque organisation (Admin › Archivage, migration 0024).
  const { data: nombreArchives, error: erreurArchivage } = await supabase.rpc("archiver_documents_echus");
  if (erreurArchivage) {
    return NextResponse.json({ messages_purges: nombrePurges, erreur: erreurArchivage.message }, { status: 500 });
  }

  return NextResponse.json({ messages_purges: nombrePurges, documents_archives: nombreArchives });
}
