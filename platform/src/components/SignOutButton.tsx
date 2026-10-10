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
    <button
      onClick={deconnecter}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
    >
      Déconnexion
    </button>
  );
}
