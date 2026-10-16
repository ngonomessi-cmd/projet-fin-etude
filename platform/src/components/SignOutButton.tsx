"use client";

import { useRouter } from "next/navigation";
import { creerClientNavigateur } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function deconnecter() {
    const supabase = creerClientNavigateur();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={deconnecter} className="text-xs text-white/55 hover:text-white/85">
      Déconnexion
    </button>
  );
}
