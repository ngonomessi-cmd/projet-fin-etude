import { redirect } from "next/navigation";
import { SITE_PUBLIC_ACTIF } from "@/lib/organisation";
import { EnTetePublic } from "@/components/site-public/EnTetePublic";
import { PiedDePagePublic } from "@/components/site-public/PiedDePagePublic";

export default function LayoutPublic({ children }: { children: React.ReactNode }) {
  // Déploiement sans site public (démonstration KHS Bank) : aucune page
  // vitrine n'est servie, l'accès mène directement à la GED.
  if (!SITE_PUBLIC_ACTIF) redirect("/documents");

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1c2029]">
      <EnTetePublic />
      <main className="flex-1">{children}</main>
      <PiedDePagePublic />
    </div>
  );
}
