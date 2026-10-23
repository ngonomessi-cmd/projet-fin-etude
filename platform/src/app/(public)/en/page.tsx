import { redirect } from "next/navigation";
import { SITE_PUBLIC_ACTIF } from "@/lib/organisation";
import { AccueilContenu } from "@/components/site-public/contenu/AccueilContenu";

export default function PageAccueilEn() {
  if (!SITE_PUBLIC_ACTIF) redirect("/documents");
  return <AccueilContenu locale="en" />;
}
