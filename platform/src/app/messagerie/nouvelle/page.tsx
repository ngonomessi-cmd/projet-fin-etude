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
    <>
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-1 text-xl font-semibold text-slate-900">Nouvelle conversation</h1>

        {profil.role === "auditeur" ? (
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            En tant qu&apos;auditeur, vous ne pouvez pas démarrer de conversation — vous pouvez seulement
            répondre à celles où un autre agent vous invite.
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-500">
              Une conversation privée déjà existante avec la même personne sera reprise automatiquement.
            </p>
            <FormulaireNouvelleConversation profils={autresProfils} />
          </>
        )}
      </main>
    </>
  );
}
