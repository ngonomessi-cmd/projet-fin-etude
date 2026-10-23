import Link from "next/link";
import { redirect } from "next/navigation";
import { creerClientServeur } from "@/lib/supabase/server";
import { NOM_ORGANISATION, SIGLE_ORGANISATION, SITE_PUBLIC_ACTIF } from "@/lib/organisation";
import type { ActualitePublique } from "@/lib/types";

const MISSIONS = [
  {
    titre: "Guichet unique de l'investissement",
    description:
      "Un point d'entrée unique qui centralise l'information, les formalités et les démarches administratives liées à l'investissement, pour réduire les délais et simplifier le parcours de l'investisseur.",
  },
  {
    titre: "Promotion de l'image du pays",
    description:
      "Valoriser les opportunités d'investissement et l'attractivité du territoire auprès des investisseurs nationaux et internationaux, à travers l'information économique et la représentation lors d'évènements dédiés.",
  },
  {
    titre: "Accompagnement des dossiers d'agrément",
    description:
      "Assister les porteurs de projets dans la constitution et l'instruction de leurs demandes d'agrément aux régimes incitatifs prévus par la législation en vigueur.",
  },
  {
    titre: "Mise en relation avec les administrations",
    description:
      "Faciliter le dialogue entre les investisseurs et les administrations compétentes, afin de lever les obstacles rencontrés au cours de la réalisation des projets.",
  },
  {
    titre: "Suivi des engagements",
    description:
      "Assurer le suivi des engagements pris par les investisseurs agréés et des administrations concernées, dans une logique de partenariat durable.",
  },
];

const SERVICES = [
  "Information économique et réglementaire sur l'investissement",
  "Pré-diagnostic et orientation des projets d'investissement",
  "Constitution et instruction des dossiers d'agrément aux régimes incitatifs",
  "Mise en relation avec les administrations et partenaires institutionnels",
  "Suivi-accompagnement des projets agréés jusqu'à leur réalisation",
];

export default async function PageAccueil() {
  if (!SITE_PUBLIC_ACTIF) {
    redirect("/documents");
  }

  const supabase = await creerClientServeur();
  const { data } = await supabase
    .from("actualites_publiques")
    .select("*")
    .eq("organisation", SIGLE_ORGANISATION)
    .eq("statut", "publie")
    .order("publie_at", { ascending: false })
    .limit(3);
  const actualites = (data ?? []) as ActualitePublique[];

  return (
    <>
      <section className="bg-navy-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-wider text-gold-500">{NOM_ORGANISATION}</p>
          <h1 className="mt-3 max-w-3xl font-serif text-3xl font-semibold leading-tight sm:text-5xl">
            Le guichet unique de la promotion des investissements
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
            Information, accompagnement des dossiers d&apos;agrément et mise en relation avec les administrations
            compétentes : nous facilitons chaque étape du parcours de l&apos;investisseur.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="#missions"
              className="rounded-md bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-gold-600"
            >
              Découvrir nos missions
            </Link>
            <Link
              href="/actualites"
              className="rounded-md border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Voir les actualités
            </Link>
          </div>
        </div>
      </section>

      <section id="missions" className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
        <h2 className="font-serif text-2xl font-semibold text-navy-950 sm:text-3xl">Nos missions</h2>
        <p className="mt-2 max-w-2xl text-sm text-paper-muted">
          Un mandat centré sur l&apos;investisseur, de la première information jusqu&apos;au suivi des engagements.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {MISSIONS.map((mission) => (
            <div key={mission.titre} className="rounded-lg border border-paper-200 p-5">
              <h3 className="font-serif text-lg font-semibold text-navy-950">{mission.titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper-muted">{mission.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="bg-paper-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
          <h2 className="font-serif text-2xl font-semibold text-navy-950 sm:text-3xl">Services aux investisseurs</h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {SERVICES.map((service) => (
              <li key={service} className="flex items-start gap-3 rounded-lg border border-paper-200 bg-white p-4 text-sm">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" aria-hidden="true" />
                {service}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {actualites.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif text-2xl font-semibold text-navy-950 sm:text-3xl">Actualités récentes</h2>
            <Link href="/actualites" className="text-sm font-medium text-gold-600 hover:underline">
              Toutes les actualités →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {actualites.map((actualite) => (
              <Link
                key={actualite.id}
                href={`/actualites/${actualite.slug}`}
                className="rounded-lg border border-paper-200 p-5 hover:border-gold-500"
              >
                {actualite.publie_at && (
                  <p className="text-xs font-medium uppercase tracking-wide text-paper-soft">
                    {new Date(actualite.publie_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
                <h3 className="mt-2 font-serif text-base font-semibold text-navy-950">{actualite.titre}</h3>
                {actualite.extrait && (
                  <p className="mt-2 text-sm leading-relaxed text-paper-muted line-clamp-3">{actualite.extrait}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
