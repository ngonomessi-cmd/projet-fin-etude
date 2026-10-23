import Link from "next/link";
import { LogoOrganisation } from "@/components/LogoOrganisation";
import { NOM_ORGANISATION } from "@/lib/organisation";

const LIENS_PUBLICS = [
  { href: "/", label: "Accueil" },
  { href: "/#missions", label: "Missions" },
  { href: "/#services", label: "Services aux investisseurs" },
  { href: "/actualites", label: "Actualités" },
];

export function EnTetePublic() {
  return (
    <header className="sticky top-0 z-40 border-b border-paper-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <LogoOrganisation taille="sm" />
          <span className="font-serif text-base font-semibold text-navy-950 sm:text-lg">{NOM_ORGANISATION}</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-[#1c2029]/80 md:flex">
          {LIENS_PUBLICS.map((lien) => (
            <Link key={lien.href} href={lien.href} className="hover:text-gold-600">
              {lien.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/login"
          className="shrink-0 rounded-md bg-navy-950 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-900 sm:px-4 sm:text-sm"
        >
          Espace sécurisé
        </Link>
      </div>
    </header>
  );
}
