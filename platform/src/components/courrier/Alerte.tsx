export function Alerte({ type, children }: { type: "ok" | "erreur"; children: React.ReactNode }) {
  return (
    <p
      role={type === "ok" ? "status" : "alert"}
      className={`rounded-md border-l-4 px-4 py-3 text-sm ${type === "ok" ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-red-600 bg-red-50 text-red-900"}`}
    >
      {children}
    </p>
  );
}

export function Puce({ classe, children }: { classe: string; children: React.ReactNode }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${classe}`}>{children}</span>;
}

export const champ =
  "w-full rounded-md border border-paper-200 bg-white px-3 py-2 text-sm text-[#1c2029] focus:border-navy-950 focus:outline-none disabled:bg-paper-50 disabled:text-paper-soft";
export const boutonPrincipal =
  "inline-flex items-center justify-center rounded-md bg-navy-950 px-4 py-2 text-sm font-medium text-white hover:bg-navy-900 disabled:opacity-50";
export const boutonDiscret =
  "inline-flex items-center justify-center rounded-md border border-paper-200 bg-white px-4 py-2 text-sm font-medium text-[#1c2029] hover:bg-paper-50 disabled:opacity-50";
export const carte = "rounded-lg border border-paper-200 bg-white shadow-sm";
