import { createClient } from "@supabase/supabase-js";

// Client Supabase avec la clé "service_role" : contourne entièrement RLS
// (Row Level Security). Réservé aux routes serveur protégées par un secret
// (cf. src/app/api/cron/messagerie/route.ts) — ne jamais l'exposer au
// navigateur ni l'utiliser dans un Server Action appelé directement par
// l'utilisateur (ce rôle existe précisément pour les tâches planifiées qui
// doivent traverser toutes les conversations, pas seulement les siennes).
export function creerClientAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
