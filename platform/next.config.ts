import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Bibliothèques de génération Word/Excel/PowerPoint/PDF : exécutées telles
  // quelles par Node côté serveur (polices et fichiers internes), sans passer
  // par le bundler.
  serverExternalPackages: ["pdfmake", "exceljs", "pptxgenjs", "docx"],
};

export default nextConfig;
