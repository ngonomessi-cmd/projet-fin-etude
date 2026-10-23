import { RUBAN_COULEURS } from "@/lib/organisation";

// Liseré tricolore optionnel (ex. couleurs du drapeau national, reprises du
// logo) — ne s'affiche que si NEXT_PUBLIC_ORG_COULEUR_RUBAN est configurée ;
// rien n'est rendu sinon (déploiement KHS Bank inchangé).
export function RubanOrganisation({ className = "" }: { className?: string }) {
  if (RUBAN_COULEURS.length < 2) return null;

  return (
    <div className={`flex h-[3px] overflow-hidden rounded-full ${className}`} aria-hidden="true">
      {RUBAN_COULEURS.map((couleur, index) => (
        <div key={index} className="flex-1" style={{ backgroundColor: couleur }} />
      ))}
    </div>
  );
}
