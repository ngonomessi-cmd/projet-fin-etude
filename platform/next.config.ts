import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
