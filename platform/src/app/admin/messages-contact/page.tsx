import { creerClientServeur } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import type { MessageContact, Profil } from "@/lib/types";
import { ActionsMessage } from "./ActionsMessage";

export default async function PageMessagesContact() {
  const supabase = await creerClientServeur();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profilData } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  const profil = profilData as Profil;

  if (profil.role !== "administrateur") {
    return (
      <div className="flex min-h-screen flex-col lg:flex-row">
        <NavBar />
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-3xl">
            <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Accès réservé au rôle Administrateur.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const { data } = await supabase
    .from("messages_contact")
    .select("*")
    .order("traite", { ascending: true })
    .order("created_at", { ascending: false });
  const messages = (data ?? []) as MessageContact[];
  const nonTraites = messages.filter((m) => !m.traite).length;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <NavBar />
      <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-1 font-serif text-2xl font-semibold">Messages reçus</h1>
          <p className="mb-6 text-sm text-paper-muted">
            Demandes envoyées depuis le formulaire « Nous contacter » du site public
            {nonTraites > 0 ? ` — ${nonTraites} à traiter.` : "."}
          </p>

          {messages.length === 0 ? (
            <p className="rounded-lg border border-paper-200 bg-white p-6 text-sm text-paper-muted">
              Aucun message pour l&apos;instant.
            </p>
          ) : (
            <ul className="space-y-4">
              {messages.map((m) => (
                <li
                  key={m.id}
                  className={`rounded-lg border bg-white p-5 shadow-sm ${m.traite ? "border-paper-200 opacity-70" : "border-gold-500/60"}`}
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-[#1c2029]">{m.sujet}</p>
                      <p className="mt-0.5 text-sm text-paper-muted">
                        {m.nom}
                        {m.entreprise ? ` · ${m.entreprise}` : ""} ·{" "}
                        <a href={`mailto:${m.email}`} className="text-gold-600 hover:underline">
                          {m.email}
                        </a>
                        {m.telephone ? ` · ${m.telephone}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs text-paper-soft">
                      {!m.traite && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">À traiter</span>
                      )}
                      {new Date(m.created_at).toLocaleString("fr-FR")}
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#1c2029]">{m.message}</p>
                  <div className="mt-4">
                    <ActionsMessage id={m.id} traite={m.traite} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
