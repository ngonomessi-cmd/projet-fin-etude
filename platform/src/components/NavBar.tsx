import { creerClientServeur } from "@/lib/supabase/server";
import type { Profil } from "@/lib/types";
import { type Lien } from "@/components/NavLinks";
import { PresenceMessagerie } from "@/components/PresenceMessagerie";
import { BarreLateraleResponsive } from "@/components/BarreLateraleResponsive";
import { SITE_PUBLIC_ACTIF } from "@/lib/organisation";

const LIENS: Lien[] = [
  { href: "/documents", label: "Documents", icone: "documents" },
  { href: "/messagerie", label: "Messagerie", icone: "messagerie" },
  { href: "/audit", label: "Journal d'audit", icone: "audit" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", roles: ["administrateur"], icone: "utilisateurs" },
  { href: "/admin/modeles", label: "Modèles", roles: ["administrateur"], icone: "modeles" },
  // Gestion du site public : seulement sur un déploiement qui l'active
  // (la barre latérale de la démonstration KHS Bank reste inchangée).
  ...(SITE_PUBLIC_ACTIF
    ? ([
        { href: "/admin/actualites", label: "Actualités", roles: ["administrateur"], icone: "actualites" },
        { href: "/admin/messages-contact", label: "Messages reçus", roles: ["administrateur"], icone: "contact" },
      ] satisfies Lien[])
    : []),
];

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
    <>
      {profil && <PresenceMessagerie />}
      <BarreLateraleResponsive liens={liens} profil={profil} />
    </>
  );
}
