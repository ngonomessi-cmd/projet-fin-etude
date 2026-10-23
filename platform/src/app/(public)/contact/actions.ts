"use server";

import { creerClientServeur } from "@/lib/supabase/server";
import { SIGLE_ORGANISATION } from "@/lib/organisation";
import { DICTIONNAIRE, type Locale } from "@/lib/i18n/dictionnaire";

export type ResultatContact = { ok: boolean; erreur: string | null };

const EMAIL_VALIDE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function champ(formData: FormData, nom: string, max: number): string {
  return String(formData.get(nom) ?? "").trim().slice(0, max);
}

export async function envoyerMessageContactAction(locale: Locale, formData: FormData): Promise<ResultatContact> {
  const erreurs = DICTIONNAIRE[locale].erreursContact;

  // Champ piège invisible pour les humains : rempli = robot, on simule un
  // succès sans rien enregistrer.
  if (champ(formData, "site_web", 200)) return { ok: true, erreur: null };

  const nom = champ(formData, "nom", 120);
  const email = champ(formData, "email", 200);
  const telephone = champ(formData, "telephone", 40);
  const entreprise = champ(formData, "entreprise", 160);
  const sujet = champ(formData, "sujet", 160);
  const message = champ(formData, "message", 5000);

  if (nom.length < 2 || !EMAIL_VALIDE.test(email) || sujet.length < 2 || message.length < 10) {
    return { ok: false, erreur: erreurs.champs };
  }

  const supabase = await creerClientServeur();
  const { error } = await supabase.from("messages_contact").insert({
    organisation: SIGLE_ORGANISATION,
    nom,
    email,
    telephone: telephone || null,
    entreprise: entreprise || null,
    sujet,
    message,
  });

  if (error) return { ok: false, erreur: erreurs.envoi };
  return { ok: true, erreur: null };
}
