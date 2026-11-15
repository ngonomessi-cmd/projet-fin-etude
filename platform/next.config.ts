import type { NextConfig } from "next";

// En-têtes de sécurité HTTP appliqués à toutes les réponses. Pas de CSP stricte :
// elle casserait les scripts en ligne de Next.js et l'aperçu des PDF signés.
const ENTETES_SECURITE = [
  // Interdit au navigateur de « deviner » le type d'un fichier téléversé.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Aucune page de la plateforme n'est affichable dans le cadre d'un autre site.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Seul l'appareil photo est utile (numérisation du courrier par téléphone).
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: ENTETES_SECURITE }];
  },
  // Bibliothèques de génération Word/Excel/PowerPoint/PDF : exécutées telles
  // quelles par Node côté serveur (polices et fichiers internes), sans passer
  // par le bundler.
  serverExternalPackages: ["pdfmake", "exceljs", "pptxgenjs", "docx", "pdf-lib", "sharp"],
  // Le logo de l'organisation (public/logos) est relu côté serveur pour
  // l'en-tête des fichiers générés : il doit accompagner les fonctions.
  outputFileTracingIncludes: { "/**": ["./public/logos/**"] },
  experimental: {
    // Image de signature envoyée au serveur pour être nettoyée (2 Mo au plus).
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
