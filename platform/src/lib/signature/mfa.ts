import type { SupabaseClient } from "@supabase/supabase-js";
import type { Traduire } from "@/lib/i18n/plateforme";

// Le code Google Authenticator est redemandé à chaque signature, en plus de
// la session ouverte : la personne est bien là au moment de signer.
// 5 codes faux en 15 minutes suspendent les signatures (migration 0028).
// Renvoie un message d'erreur, ou null si le code est bon.
export async function verifierCodeSignature(supabase: SupabaseClient, code: string, t: Traduire): Promise<string | null> {
  const { data: autorise } = await supabase.rpc("signature_essai_autorise");
  if (autorise !== true) {
    return t(
      "Trop de codes incorrects : signature suspendue pendant 15 minutes.",
      "Too many incorrect codes: signing is suspended for 15 minutes."
    );
  }
  if (!/^\d{6}$/.test(code)) {
    return t("Saisissez les 6 chiffres affichés par Google Authenticator.", "Enter the 6 digits shown by Google Authenticator.");
  }
  const { data: facteurs } = await supabase.auth.mfa.listFactors();
  const facteur = facteurs?.totp.find((f) => f.status === "verified");
  if (!facteur) {
    return t("Double authentification non configurée sur ce compte.", "Two-factor authentication is not set up on this account.");
  }
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: facteur.id, code });
  if (error) {
    await supabase.rpc("signature_echec");
    return t(
      "Code Google Authenticator incorrect ou expiré : saisissez le nouveau code.",
      "Incorrect or expired Google Authenticator code: enter the new code."
    );
  }
  return null;
}
