import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { FormulaireNouvelleConversation } from "./FormulaireNouvelleConversation";
import type { Profil } from "@/lib/types";

export default async function PageNouvelleConversation() {
  const supabase = await creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profilData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profil = profilData as Profil;

  const { data: profilsData } = await supabase
    .from("profiles")
    .select("id, nom_complet, departement, role")
    .neq("id", user.id)
    .order("nom_complet");
  const autresProfils = (profilsData ?? []) as Pick<Profil, "id" | "nom_complet" | "departement" | "role">[];

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-8 py-12">
        <div className="mx-auto max-w-xl">
          <Link href="/messagerie" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-paper-muted hover:text-gold-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Messagerie
          </Link>

          <h1 className="mb-1 font-serif text-2xl font-semibold">Nouvelle conversation</h1>

          {profil.role === "auditeur" ? (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              En tant qu&apos;auditeur, vous ne pouvez pas démarrer de conversation — vous pouvez seulement
              répondre à celles où un autre agent vous invite.
            </p>
          ) : (
            <>
              <p className="mb-5 text-sm text-paper-muted">
                Une conversation privée déjà existante avec la même personne sera reprise automatiquement.
              </p>
              <FormulaireNouvelleConversation profils={autresProfils} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
