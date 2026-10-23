import { redirect } from "next/navigation";
import { SITE_PUBLIC_ACTIF } from "@/lib/organisation";
import { AccueilContenu } from "@/components/site-public/contenu/AccueilContenu";

export default function PageAccueil() {
  if (!SITE_PUBLIC_ACTIF) redirect("/documents");
  return <AccueilContenu locale="fr" />;
}
