import { NavBar } from "@/components/NavBar";
import { FormulaireDepot } from "./FormulaireDepot";

export default function PageNouveauDocument() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-xl">
          <h1 className="mb-1 font-serif text-xl font-semibold">Déposer un document</h1>
          <p className="mb-6 text-sm text-paper-muted">
            Étape « dépôt » du workflow. Le document est créé à l&apos;état « Brouillon » puis doit être
            soumis à la vérification depuis sa page de détail.
          </p>

          <FormulaireDepot />
        </div>
      </main>
    </div>
  );
}
