import { NextResponse } from "next/server";
import { creerClientServeur } from "@/lib/supabase/server";
import { creerClientAdmin } from "@/lib/supabase/admin";
import { traductionServeur } from "@/lib/i18n/serveur";
import { traduireErreur } from "@/lib/i18n/erreurs";
import { BUCKET_SIGNATURES } from "@/lib/signature/produire";

export const runtime = "nodejs";

// PDF signé / bon à signer (?quoi=pdf) ou original scanné (?quoi=original).
// Le bucket n'a aucune règle de lecture : consulter_signature vérifie les
// droits avec ceux de l'agent et trace la consultation, puis le serveur lit
// le fichier avec la clé de service.
export async function GET(requete: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quoi = new URL(requete.url).searchParams.get("quoi") === "original" ? "original" : "pdf";
  const supabase = await creerClientServeur();
  const { langue, t } = await traductionServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", requete.url));

  const { data: chemin, error } = await supabase.rpc("consulter_signature", { p_signature_id: id, p_quoi: quoi });
  if (error || typeof chemin !== "string") {
    return new NextResponse(traduireErreur(error?.message ?? t("Signature introuvable.", "Signature not found."), langue), { status: 404 });
  }
  const { data: numeroData } = await supabase.from("signatures").select("numero").eq("id", id).single();
  const { data: fichier, error: erreurLecture } = await creerClientAdmin().storage.from(BUCKET_SIGNATURES).download(chemin);
  if (erreurLecture || !fichier) return new NextResponse(t("Fichier introuvable.", "File not found."), { status: 404 });

  const numero = String(numeroData?.numero ?? "signature").replace(/[^0-9A-Za-z]+/g, "-");
  const prefixe = chemin.startsWith("bat/") ? (langue === "en" ? "print-for-signature" : "bon-a-signer") : quoi === "original" ? "original-signe" : "signe";
  return new NextResponse(new Uint8Array(await fichier.arrayBuffer()), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${prefixe}-${numero}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
