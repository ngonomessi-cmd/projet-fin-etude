"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { connecterAction, inscrireAction } from "./actions";

export default function PageConnexion() {
  const router = useRouter();
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(formData: FormData) {
    setEnCours(true);
    setErreur(null);
    const resultat = mode === "connexion" ? await connecterAction(formData) : await inscrireAction(formData);
    setEnCours(false);

    if (resultat.erreur) {
      setErreur(resultat.erreur);
      return;
    }

    if (mode === "inscription") {
      setErreur(
        "Compte créé. Si la confirmation par e-mail est activée sur le projet Supabase, vérifiez votre boîte mail avant de vous connecter."
      );
      setMode("connexion");
      return;
    }

    router.push("/documents");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">GED sécurisée — KHS Bank</h1>
      <p className="mb-6 text-sm text-slate-600">
        Gestion Électronique de Documents sécurisée : démonstration du Lot F (classification, RBAC —
        contrôle d&apos;accès basé sur les rôles —, workflow de validation, journal d&apos;audit).
      </p>

      <form action={soumettre} className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
        {mode === "inscription" && (
          <>
            <Champ nom="nom_complet" libelle="Nom complet" requis />
            <Champ nom="departement" libelle="Département" requis placeholder="ex. Conformité, Crédit, Audit" />
          </>
        )}
        <Champ nom="email" libelle="E-mail" type="email" requis />
        <Champ nom="mot_de_passe" libelle="Mot de passe" type="password" requis />

        {erreur && <p className="text-sm text-red-600">{erreur}</p>}

        <button
          type="submit"
          disabled={enCours}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {mode === "connexion" ? "Se connecter" : "Créer le compte"}
        </button>
      </form>

      <button
        onClick={() => {
          setErreur(null);
          setMode(mode === "connexion" ? "inscription" : "connexion");
        }}
        className="mt-4 text-sm text-slate-600 underline"
      >
        {mode === "connexion" ? "Pas encore de compte ? Créer un compte" : "Déjà un compte ? Se connecter"}
      </button>

      <p className="mt-6 text-xs text-slate-400">
        Nouveau compte créé avec le rôle « Lecteur » par défaut (principe du moindre privilège) ; un
        administrateur doit ensuite vous attribuer le rôle adapté dans « Utilisateurs ».
      </p>
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
      <span className="mb-1 block font-medium text-slate-700">{libelle}</span>
      <input
        name={nom}
        type={type}
        required={requis}
        placeholder={placeholder}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
      />
    </label>
  );
}
