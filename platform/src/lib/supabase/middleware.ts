import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rafraîchit le jeton de session Supabase Auth à chaque requête et protège
// les pages applicatives : un utilisateur non connecté est redirigé vers
// /login, un utilisateur connecté qui n'a pas encore saisi son code Google
// Authenticator (session « aal1 ») vers /mfa. La base de données applique la
// même règle de son côté (migration 0027).
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
    requete.nextUrl.pathname === "/" ||
    requete.nextUrl.pathname.startsWith("/login") ||
    requete.nextUrl.pathname.startsWith("/auth") ||
    // Routes API : protégées par leur propre secret (ex. tâche planifiée).
    requete.nextUrl.pathname.startsWith("/api/") ||
    requete.nextUrl.pathname.startsWith("/actualites") ||
    requete.nextUrl.pathname.startsWith("/missions") ||
    requete.nextUrl.pathname.startsWith("/services") ||
    requete.nextUrl.pathname.startsWith("/contact") ||
    requete.nextUrl.pathname.startsWith("/en");

  if (!user && !cheminPublic) {
    const urlConnexion = requete.nextUrl.clone();
    const cheminDemande = urlConnexion.pathname + urlConnexion.search;
    urlConnexion.pathname = "/login";
    urlConnexion.search = "";
    if (cheminDemande !== "/") urlConnexion.searchParams.set("redirect", cheminDemande);
    return NextResponse.redirect(urlConnexion);
  }

  // Double authentification obligatoire pour tout l'espace GED.
  const pageMfa = requete.nextUrl.pathname.startsWith("/mfa");
  if (user && !cheminPublic && !pageMfa) {
    const { data: niveau } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (niveau?.currentLevel !== "aal2") {
      const urlMfa = requete.nextUrl.clone();
      const cheminDemande = urlMfa.pathname + urlMfa.search;
      urlMfa.pathname = "/mfa";
      urlMfa.search = "";
      urlMfa.searchParams.set("redirect", cheminDemande);
      return NextResponse.redirect(urlMfa);
    }
  }
  if (!user && pageMfa) {
    const urlConnexion = requete.nextUrl.clone();
    urlConnexion.pathname = "/login";
    urlConnexion.search = "";
    return NextResponse.redirect(urlConnexion);
  }

  return reponse;
}
