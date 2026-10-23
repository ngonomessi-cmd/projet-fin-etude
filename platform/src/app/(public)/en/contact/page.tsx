import { ContactContenu } from "@/components/site-public/contenu/ContactContenu";

export const metadata = { title: "Contact us" };

export default async function PageContactEn({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service } = await searchParams;
  return <ContactContenu locale="en" service={service} />;
}
