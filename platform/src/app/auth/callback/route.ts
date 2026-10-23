import { NextResponse } from "next/server";
import { creerClientServeur } from "@/lib/supabase/server";

// Échange le "code" transmis par le lien de confirmation d'e-mail (ou de
// connexion par lien magique) contre une session, puis redirige vers l'application.
export async function GET(requete: Request) {
  const url = new URL(requete.url);
  const code = url.searchParams.get("code");

  // Lien expiré ou déjà utilisé : Supabase revient ici avec un paramètre d'erreur.
  if (url.searchParams.get("error") || url.searchParams.get("error_description")) {
    return NextResponse.redirect(new URL("/login?lien=invalide", url.origin));
  }

  if (code) {
    const supabase = await creerClientServeur();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    // L'adresse est déjà confirmée par Supabase à ce stade ; l'échange échoue
    // seulement si le lien est ouvert dans un autre navigateur que celui de
    // l'inscription (ex. e-mail lu sur téléphone) — il suffit alors de se connecter.
    if (error) return NextResponse.redirect(new URL("/login?confirme=1", url.origin));
  }

  return NextResponse.redirect(new URL("/documents", url.origin));
}
