import { langueServeur } from "@/lib/i18n/serveur";
import { ChoixLangue, FournisseurLangue } from "@/components/i18n/Langue";

// Enveloppe de chaque espace connecté (layout.tsx de /documents, /messagerie,
// /audit, /admin, /login) : fournit la langue aux composants client et place
// le sélecteur FR | EN en haut à droite (dans la barre mobile sur petit écran).
export async function CoqueLangue({ children, toujoursVisible = false }: { children: React.ReactNode; toujoursVisible?: boolean }) {
  const langue = await langueServeur();
  return (
    <FournisseurLangue langue={langue}>
      <ChoixLangue className={`fixed right-4 top-4 z-30 ${toujoursVisible ? "" : "hidden lg:inline-flex"}`} />
      {children}
    </FournisseurLangue>
  );
}
