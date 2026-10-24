import { creerClientServeur } from "@/lib/supabase/server";
import type { Profil } from "@/lib/types";
import { type Lien } from "@/components/NavLinks";
import { PresenceMessagerie } from "@/components/PresenceMessagerie";
import { BarreLateraleResponsive } from "@/components/BarreLateraleResponsive";
import { SITE_PUBLIC_ACTIF } from "@/lib/organisation";
import { traductionServeur } from "@/lib/i18n/serveur";
import type { Traduire } from "@/lib/i18n/plateforme";

const liensNavigation = (t: Traduire): Lien[] => [
  { href: "/documents", label: "Documents", icone: "documents" },
  { href: "/messagerie", label: t("Messagerie", "Messaging"), icone: "messagerie" },
  { href: "/signatures", label: t("Signatures", "Signatures"), roles: ["redacteur", "validateur", "administrateur", "auditeur"], icone: "signatures" },
  { href: "/audit", label: t("Journal d'audit", "Audit log"), icone: "audit" },
  { href: "/admin/utilisateurs", label: t("Utilisateurs", "Users"), roles: ["administrateur"], icone: "utilisateurs" },
  { href: "/admin/modeles", label: t("Modèles", "Templates"), roles: ["administrateur"], icone: "modeles" },
  { href: "/admin/archivage", label: t("Archivage", "Archiving"), roles: ["administrateur"], icone: "archives" },
  // Gestion du site public : seulement sur un déploiement qui l'active
  // (la barre latérale de la démonstration KHS Bank reste inchangée).
  ...(SITE_PUBLIC_ACTIF
    ? ([
        { href: "/admin/actualites", label: t("Actualités", "News"), roles: ["administrateur"], icone: "actualites" },
        { href: "/admin/messages-contact", label: t("Messages reçus", "Inbox"), roles: ["administrateur"], icone: "contact" },
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

  const { t } = await traductionServeur();
  const liens = liensNavigation(t).map((lien) => (lien.href === "/messagerie" ? { ...lien, badge: messagesNonLus } : lien));

  return (
    <>
      {profil && <PresenceMessagerie />}
      <BarreLateraleResponsive liens={liens} profil={profil} />
    </>
  );
}
