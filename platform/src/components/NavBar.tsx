import Link from "next/link";
import { creerClientServeur } from "@/lib/supabase/server";
import { LABEL_ROLE } from "@/lib/labels";
import type { Profil, RoleUtilisateur } from "@/lib/types";
import { SignOutButton } from "@/components/SignOutButton";

const LIENS: { href: string; label: string; roles?: RoleUtilisateur[] }[] = [
  { href: "/documents", label: "Documents" },
  { href: "/audit", label: "Journal d'audit" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", roles: ["administrateur"] },
];

export async function NavBar() {
  const supabase = await creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profil: Profil | null = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profil = data as Profil | null;
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/documents" className="font-semibold text-slate-900">
            GED KHS Bank
          </Link>
          <nav className="flex gap-4 text-sm">
            {LIENS.filter((lien) => !lien.roles || (profil && lien.roles.includes(profil.role))).map(
              (lien) => (
                <Link key={lien.href} href={lien.href} className="text-slate-600 hover:text-slate-900">
                  {lien.label}
                </Link>
              )
            )}
          </nav>
        </div>
        {profil && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-700">
              {profil.nom_complet} ·{" "}
              <span className="font-medium text-slate-900">{LABEL_ROLE[profil.role]}</span> ·{" "}
              {profil.departement}
            </span>
            <SignOutButton />
          </div>
        )}
      </div>
    </header>
  );
}
