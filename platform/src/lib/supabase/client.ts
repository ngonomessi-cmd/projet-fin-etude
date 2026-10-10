import { createBrowserClient } from "@supabase/ssr";

// Client Supabase côté navigateur (Client Components). La clé "anon" est
// publique sans danger : la sécurité réelle est portée par les policies RLS
// (Row Level Security) côté base de données, pas par cette clé.
export function creerClientNavigateur() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
