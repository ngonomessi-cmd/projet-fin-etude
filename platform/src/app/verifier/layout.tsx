import Link from "next/link";
import { CoqueLangue } from "@/components/i18n/CoqueLangue";
import { LogoOrganisation } from "@/components/LogoOrganisation";
import { SITE_PUBLIC_ACTIF, nomOrganisation } from "@/lib/organisation";
import { traductionServeur } from "@/lib/i18n/serveur";

export const metadata = { title: "Vérification d'un document signé", robots: { index: false, follow: false } };

// Page publique : accessible sans compte, à partir du QR code ou du numéro
// imprimé sur un document signé.
export default async function Layout({ children }: { children: React.ReactNode }) {
  const { langue, t } = await traductionServeur();
  return (
    <CoqueLangue toujoursVisible>
      <div className="min-h-screen bg-paper-50 px-4 py-10 sm:py-16">
        <div className="mx-auto w-full max-w-xl">
          <Link href={SITE_PUBLIC_ACTIF ? "/" : "/login"} className="mb-8 flex items-center gap-2.5 pr-24">
            <LogoOrganisation taille="sm" />
            <span className="min-w-0">
              <span className="block font-serif text-sm font-semibold leading-tight text-[#1c2029]">{nomOrganisation(langue)}</span>
              <span className="block text-[10px] uppercase tracking-wide text-paper-muted">{t("Vérification des documents signés", "Signed document verification")}</span>
            </span>
          </Link>
          {children}
        </div>
      </div>
    </CoqueLangue>
  );
}
