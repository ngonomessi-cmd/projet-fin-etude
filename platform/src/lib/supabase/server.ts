import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client Supabase côté serveur (Server Components et Server Actions),
// reconstruit à chaque requête à partir des cookies de session HTTP-only.
export async function creerClientServeur() {
  const magasinCookies = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return magasinCookies.getAll();
        },
        setAll(cookiesAEcrire) {
          try {
            cookiesAEcrire.forEach(({ name, value, options }) => {
              magasinCookies.set(name, value, options);
            });
          } catch {
            // Appelé depuis un Server Component (lecture seule) : sans effet,
            // le rafraîchissement de session est de toute façon assuré par
            // le middleware sur chaque requête.
          }
        },
      },
    }
  );
}
