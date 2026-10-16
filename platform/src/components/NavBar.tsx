import { creerClientServeur } from "@/lib/supabase/server";
import { LABEL_ROLE } from "@/lib/labels";
import type { Profil } from "@/lib/types";
import { SignOutButton } from "@/components/SignOutButton";
import { NavLinks, type Lien } from "@/components/NavLinks";

const LIENS: Lien[] = [
  { href: "/documents", label: "Documents", icone: "documents" },
  { href: "/messagerie", label: "Messagerie", icone: "messagerie" },
  { href: "/audit", label: "Journal d'audit", icone: "audit" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", roles: ["administrateur"], icone: "utilisateurs" },
];

function initiales(nomComplet: string) {
  return nomComplet
    .split(" ")
    .filter(Boolean)
    .map((mot) => mot[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export async function NavBar() {
  const supabase = await creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profil: Profil | null = null;
  let messagesNonLus = 0;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profil = data as Profil | null;
    const { data: compteur } = await supabase.rpc("compter_messages_non_lus");
    messagesNonLus = compteur ?? 0;
  }

  const liens = LIENS.map((lien) => (lien.href === "/messagerie" ? { ...lien, badge: messagesNonLus } : lien));

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-navy-950 px-4 py-7 text-white">
      <div className="mb-5 flex items-center gap-2.5 border-b border-navy-line px-1.5 pb-8">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-gold-500">
          <span className="font-serif text-lg font-bold text-navy-950">K</span>
        </div>
        <div className="min-w-0">
          <div className="whitespace-nowrap font-serif text-base leading-tight font-semibold">KHS Bank</div>
          <div className="text-[11px] tracking-wide text-white/50 uppercase">GED sécurisée</div>
        </div>
      </div>

      <NavLinks liens={liens} role={profil?.role ?? null} />

      {profil && (
        <div className="mt-auto border-t border-navy-line pt-4">
          <div className="flex items-center gap-2.5 px-1.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
              {initiales(profil.nom_complet)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold">{profil.nom_complet}</div>
              <div className="text-[11px] text-white/55">
                {LABEL_ROLE[profil.role]} · {profil.departement}
              </div>
            </div>
          </div>
          <div className="mt-2.5 px-1.5">
            <SignOutButton />
          </div>
        </div>
      )}
    </aside>
  );
}
