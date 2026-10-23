import { ContactContenu } from "@/components/site-public/contenu/ContactContenu";

export const metadata = { title: "Nous contacter" };

export default async function PageContact({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service } = await searchParams;
  return <ContactContenu locale="fr" service={service} />;
}
