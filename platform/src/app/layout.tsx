import type { Metadata } from "next";
import "./globals.css";
import { NOM_ORGANISATION } from "@/lib/organisation";

export const metadata: Metadata = {
  title: `GED sécurisée — ${NOM_ORGANISATION}`,
  description:
    "Gestion Électronique de Documents sécurisée (démonstration du Lot F) — classification, RBAC, workflow de validation et journal d'audit immuable, via Supabase RLS.",
};

export default function LayoutRacine({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
