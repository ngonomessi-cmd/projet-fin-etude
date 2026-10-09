import { type NextRequest } from "next/server";
import { mettreAJourSession } from "@/lib/supabase/middleware";

export async function proxy(requete: NextRequest) {
  return mettreAJourSession(requete);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
