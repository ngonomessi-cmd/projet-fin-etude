import { ActualiteDetailContenu } from "@/components/site-public/contenu/ActualiteDetailContenu";

export default async function PageActualitePublique({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ActualiteDetailContenu slug={slug} locale="fr" />;
}
