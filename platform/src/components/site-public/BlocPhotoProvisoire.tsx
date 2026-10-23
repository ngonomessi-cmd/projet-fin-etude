// Espace réservé neutre à la place d'une photo réelle non encore reçue
// comme fichier exploitable (cf. échanges avec l'utilisateur) — à
// remplacer par un <Image> dès que les fichiers sont fournis.
export function BlocPhotoProvisoire({ className = "" }: { className?: string }) {
  return <div className={`bg-gradient-to-br from-navy-800 to-navy-950 ${className}`} aria-hidden="true" />;
}
