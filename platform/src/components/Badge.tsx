export function Badge({ texte, classesCouleur }: { texte: string; classesCouleur: string }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${classesCouleur}`}
    >
      {texte}
    </span>
  );
}
