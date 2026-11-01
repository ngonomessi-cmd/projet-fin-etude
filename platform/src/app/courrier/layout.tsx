import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { CoqueLangue } from "@/components/i18n/CoqueLangue";
import { COURRIER_ACTIF } from "@/lib/organisation";
import { contexteCourrier } from "@/lib/courrier/contexte";
import { traductionServeur } from "@/lib/i18n/serveur";
import { OngletsCourrier } from "./OngletsCourrier";

export const metadata: Metadata = { title: "Courrier" };

export default async function CourrierLayout({ children }: { children: React.ReactNode }) {
  if (!COURRIER_ACTIF) notFound();
  const ctx = await contexteCourrier();
  const { t } = await traductionServeur();
  return (
    <CoqueLangue>
    <div className="flex min-h-screen flex-col lg:flex-row">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-serif text-2xl font-semibold">{t("Courrier", "Mail")}</h1>
          <p className="mb-4 text-sm text-paper-muted">
            {t(
              "Courrier physique arrivée et départ : enregistrement, numérisation, remise, registres et conservation.",
              "Physical incoming and outgoing mail: registration, scanning, delivery, registers and retention."
            )}
          </p>
          <OngletsCourrier service={ctx?.role != null} chef={ctx?.role === "chef"} />
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
    </CoqueLangue>
  );
}
