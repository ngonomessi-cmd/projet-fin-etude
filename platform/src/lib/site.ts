import { headers } from "next/headers";

// Adresse publique du déploiement qui reçoit la demande. Les deux
// organisations partagent un seul projet Supabase (donc une seule « Site
// URL ») : sans adresse explicite, on reprend celle de la requête.
export async function origineDuSite(): Promise<string> {
  const configuree = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (configuree) return configuree;

  const h = await headers();
  const origine = h.get("origin");
  if (origine) return origine;
  const hote = h.get("x-forwarded-host") ?? h.get("host");
  const protocole = h.get("x-forwarded-proto") ?? "https";
  return `${protocole}://${hote}`;
}
