"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { connecterAction, inscrireAction } from "./actions";
import { LogoOrganisation } from "@/components/LogoOrganisation";
import { RubanOrganisation } from "@/components/RubanOrganisation";
import { MENTION_CONNEXION, NOM_ORGANISATION } from "@/lib/organisation";

export default function PageConnexion() {
  return (
    <Suspense fallback={null}>
      <FormulaireConnexion />
    </Suspense>
  );
}

function FormulaireConnexion() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Lien profond depuis une alerte e-mail de la messagerie (cf.
  // lib/messagerie/alertes.ts) : .../login?redirect=/messagerie/<id> — on
  // y retourne après connexion au lieu de l'accueil par défaut.
  const redirection = searchParams.get("redirect") || "/documents";
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [erreur, setErreur] = useState<string | null>(
    searchParams.get("lien") === "invalide"
      ? "Ce lien de confirmation a expiré ou a déjà été utilisé. Essayez de vous connecter, ou recréez votre compte."
      : null
  );
  const [info, setInfo] = useState<string | null>(
    searchParams.get("confirme") ? "Adresse e-mail confirmée. Vous pouvez maintenant vous connecter." : null
  );
  const [enCours, setEnCours] = useState(false);

  async function soumettre(formData: FormData) {
    setEnCours(true);
    setErreur(null);
    setInfo(null);
    const resultat = mode === "connexion" ? await connecterAction(formData) : await inscrireAction(formData);
    setEnCours(false);

    if (resultat.erreur) {
      setErreur(resultat.erreur);
      return;
    }

    if (mode === "inscription") {
      setInfo(
        "Compte créé. Un e-mail de confirmation vient de vous être envoyé — cliquez sur le lien qu'il contient (pensez à vérifier les courriers indésirables), puis connectez-vous."
      );
      setMode("connexion");
      return;
    }

    router.push(redirection);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen">
      <div className="hidden w-[42%] shrink-0 flex-col justify-between bg-navy-950 p-12 text-white lg:flex">
        <div>
          <div className="flex items-start gap-2.5">
            <LogoOrganisation taille="lg" />
            <div className="min-w-0">
              <div className="font-serif text-base leading-tight font-semibold break-words">{NOM_ORGANISATION}</div>
              <div className="text-[11px] tracking-wide text-white/50 uppercase">GED sécurisée</div>
            </div>
          </div>
          <RubanOrganisation className="mt-4" />
        </div>
        <div>
          <h1 className="mb-3 font-serif text-3xl leading-tight font-semibold">
            Gestion électronique des documents, sous contrôle.
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-white/60">
            Classification, RBAC (contrôle d&apos;accès basé sur les rôles), workflow de validation et
            journal d&apos;audit immuable — entièrement portés par les policies RLS (Row Level Security)
            de la base de données.
          </p>
        </div>
        <p className="text-xs text-white/35">{MENTION_CONNEXION}</p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-6 flex items-start gap-2.5 lg:hidden">
            <LogoOrganisation taille="sm" />
            <div className="min-w-0">
              <div className="font-serif text-sm leading-tight font-semibold break-words">{NOM_ORGANISATION}</div>
              <div className="text-[10px] tracking-wide text-paper-muted uppercase">GED sécurisée</div>
            </div>
          </div>

          <h2 className="mb-1 font-serif text-xl font-semibold">
            {mode === "connexion" ? "Connexion à l'Espace Agents" : "Créer un compte"}
          </h2>
          <p className="mb-6 text-sm text-paper-muted">
            {mode === "connexion"
              ? "Accédez à vos documents, à la messagerie interne et au journal d'audit."
              : "Nouveau compte créé avec le rôle « Lecteur » par défaut, promu ensuite par un administrateur."}
          </p>

          <form action={soumettre} className="space-y-3 rounded-lg border border-paper-200 bg-white p-5 shadow-sm">
            {mode === "inscription" && (
              <>
                <Champ nom="nom_complet" libelle="Nom complet" requis />
                <Champ nom="departement" libelle="Département" requis placeholder="ex. Conformité, Crédit, Audit" />
              </>
            )}
            <Champ nom="email" libelle="E-mail" type="email" requis />
            <Champ nom="mot_de_passe" libelle="Mot de passe" type="password" requis />

            {erreur && <p className="text-sm text-red-600">{erreur}</p>}
            {info && (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{info}</p>
            )}

            <button
              type="submit"
              disabled={enCours}
              className="w-full rounded-md bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50"
            >
              {mode === "connexion" ? "Se connecter" : "Créer le compte"}
            </button>
          </form>

          <button
            onClick={() => {
              setErreur(null);
              setInfo(null);
              setMode(mode === "connexion" ? "inscription" : "connexion");
            }}
            className="mt-4 text-sm text-gold-600 hover:underline"
          >
            {mode === "connexion" ? "Pas encore de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
          </button>

          <p className="mt-6 text-xs text-paper-soft">
            Nouveau compte créé avec le rôle « Lecteur » par défaut (principe du moindre privilège) ; un
            administrateur doit ensuite vous attribuer le rôle adapté dans « Utilisateurs ».
          </p>
        </div>
      </div>
    </main>
  );
}

function Champ({
  nom,
  libelle,
  type = "text",
  requis = false,
  placeholder,
}: {
  nom: string;
  libelle: string;
  type?: string;
  requis?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-[#1c2029]">{libelle}</span>
      <input
        name={nom}
        type={type}
        required={requis}
        placeholder={placeholder}
        className="w-full rounded-md border border-paper-200 px-3 py-2 text-sm focus:border-gold-500 focus:outline-none"
      />
    </label>
  );
}
