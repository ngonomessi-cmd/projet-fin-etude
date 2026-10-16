import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rafraîchit le jeton de session Supabase Auth à chaque requête et protège
// les pages applicatives : un utilisateur non connecté est redirigé vers /login.
export async function mettreAJourSession(requete: NextRequest) {
  let reponse = NextResponse.next({ request: requete });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return requete.cookies.getAll();
        },
        setAll(cookiesAEcrire) {
          cookiesAEcrire.forEach(({ name, value }) => requete.cookies.set(name, value));
          reponse = NextResponse.next({ request: requete });
          cookiesAEcrire.forEach(({ name, value, options }) => {
            reponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cheminPublic =
    requete.nextUrl.pathname.startsWith("/login") ||
    requete.nextUrl.pathname.startsWith("/auth");

  if (!user && !cheminPublic) {
    const urlConnexion = requete.nextUrl.clone();
    const cheminDemande = urlConnexion.pathname + urlConnexion.search;
    urlConnexion.pathname = "/login";
    urlConnexion.search = "";
    if (cheminDemande !== "/") urlConnexion.searchParams.set("redirect", cheminDemande);
    return NextResponse.redirect(urlConnexion);
  }

  return reponse;
}
