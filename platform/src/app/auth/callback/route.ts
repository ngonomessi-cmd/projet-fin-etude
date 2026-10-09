import { NextResponse } from "next/server";
import { creerClientServeur } from "@/lib/supabase/server";

// Échange le "code" transmis par le lien de confirmation d'e-mail (ou de
// connexion par lien magique) contre une session, puis redirige vers l'application.
export async function GET(requete: Request) {
  const url = new URL(requete.url);
  const code = url.searchParams.get("code");

  if (code) {
    const supabase = await creerClientServeur();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL("/documents", url.origin));
}
