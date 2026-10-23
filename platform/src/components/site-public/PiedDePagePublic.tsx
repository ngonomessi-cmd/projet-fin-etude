import Link from "next/link";
import { RubanOrganisation } from "@/components/RubanOrganisation";
import { NOM_ORGANISATION } from "@/lib/organisation";

export function PiedDePagePublic() {
  return (
    <footer className="border-t border-navy-line bg-navy-950 text-white/70">
      <RubanOrganisation />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-8">
        <div>
          <p className="font-serif text-lg font-semibold text-white">{NOM_ORGANISATION}</p>
          <p className="mt-2 text-sm leading-relaxed">
            Guichet unique de la promotion des investissements : information, accompagnement des dossiers d&apos;agrément et
            mise en relation avec les administrations compétentes.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white/50">Navigation</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/#missions" className="hover:text-gold-500 hover:underline">
                Nos missions
              </Link>
            </li>
            <li>
              <Link href="/#services" className="hover:text-gold-500 hover:underline">
                Services aux investisseurs
              </Link>
            </li>
            <li>
              <Link href="/actualites" className="hover:text-gold-500 hover:underline">
                Actualités
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white/50">Accès</p>
          <p className="mt-3 text-sm leading-relaxed">
            Agents et partenaires habilités : accédez à la gestion électronique de documents sécurisée de l&apos;agence.
          </p>
          <Link
            href="/login"
            className="mt-3 inline-block rounded-md bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-600"
          >
            Accéder à la plateforme GED →
          </Link>
        </div>
      </div>

      <div className="border-t border-navy-line px-4 py-4 text-center text-xs text-white/40 sm:px-8">
        © {new Date().getFullYear()} {NOM_ORGANISATION}. Tous droits réservés.
      </div>
    </footer>
  );
}
