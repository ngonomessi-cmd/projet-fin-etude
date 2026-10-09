import { NavBar } from "@/components/NavBar";
import { FormulaireDepot } from "./FormulaireDepot";

export default function PageNouveauDocument() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-xl px-4 py-6">
        <h1 className="mb-1 text-xl font-semibold text-slate-900">Déposer un document</h1>
        <p className="mb-6 text-sm text-slate-500">
          Étape « dépôt » du workflow. Le document est créé à l&apos;état « Brouillon » puis doit être
          soumis à la vérification depuis sa page de détail.
        </p>

        <FormulaireDepot />
      </main>
    </>
  );
}
