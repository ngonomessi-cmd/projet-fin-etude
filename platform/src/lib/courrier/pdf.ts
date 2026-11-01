import type { Content, TableCell } from "pdfmake/interfaces";
import { chargerLogo } from "@/lib/atelier/logo";
import { COULEUR_MARINE, genererPdf } from "@/lib/atelier/pdf";
import type { Langue } from "@/lib/i18n/plateforme";
import { nomOrganisation } from "@/lib/organisation";
import { CARACTERES, en, MODES, MODES_ENVOI, NATURES, STATUTS_COURRIER, STATUTS_DEPART } from "./constantes";
import { formaterDate, formaterDateHeure } from "./format";

// Documents PDF du service du courrier, dans l'en-tête commun de la plateforme (logo, organisation, mention).
// Aucune donnée n'est lue ici : les routes passent des lignes déjà filtrées par la base (RLS / fonctions).

const GRIS = "#6b7280";
const FOND_ENTETE = "#eef1f7";
const MISE_EN_PAGE = {
  hLineColor: () => "#d9dde7",
  vLineColor: () => "#d9dde7",
  paddingTop: () => 3,
  paddingBottom: () => 3,
  paddingLeft: () => 4,
  paddingRight: () => 4,
};

async function entete(titre: string, langue: Langue, paysage = false) {
  return { titre, organisation: nomOrganisation(langue), classification: langue === "en" ? "Mail service" : "Service du courrier", paysage, logo: await chargerLogo() };
}

const titreDocument = (texte: string): Content => ({ text: texte, fontSize: 16, bold: true, color: COULEUR_MARINE, alignment: "center", margin: [0, 6, 0, 16] });
const ligneInfo = (libelle: string, valeur: string): [Content, Content] => [{ text: libelle, bold: true, color: GRIS, fontSize: 9.5 }, { text: valeur, fontSize: 10.5 }];
const tableInfo = (lignes: [Content, Content][]): Content => ({ table: { widths: [140, "*"], body: lignes }, layout: { hLineColor: () => "#d9dde7", vLineWidth: () => 0, paddingTop: () => 6, paddingBottom: () => 6 } });
const entetesTableau = (titres: string[]): TableCell[] => titres.map((x) => ({ text: x, bold: true, fontSize: 8, color: COULEUR_MARINE, fillColor: FOND_ENTETE }));
const pluriel = (n: number, un: string, plusieurs: string) => (n > 1 ? plusieurs : un);

// --- Récépissé de dépôt (arrivée) ---------------------------------------------------------------------------

export type DonneesRecepisse = {
  numero: string; codeSuivi: string; recuLe: string; expediteur: string; reference: string | null; nature: string; mode: string;
  nbPieces: number; departement: string; destinataire: string | null; caractere: string; agent: string;
};

export async function genererRecepisse(d: DonneesRecepisse, langue: Langue): Promise<Buffer> {
  const t = (fr: string, e: string) => (langue === "en" ? e : fr);
  const lignes: [Content, Content][] = [
    ligneInfo(t("Numéro d'ordre", "Sequence number"), d.numero),
    ligneInfo(t("Reçu le", "Received on"), `${formaterDateHeure(d.recuLe, langue)} (${t("heure de Douala", "Douala time")})`),
    ligneInfo(t("Expéditeur", "Sender"), d.expediteur),
    ...(d.reference ? [ligneInfo(t("Votre référence", "Your reference"), d.reference)] : []),
    ligneInfo(t("Nature", "Type"), `${d.nature} — ${d.nbPieces} ${pluriel(d.nbPieces, t("pièce", "item"), t("pièces", "items"))} — ${d.mode}`),
    ligneInfo(t("Adressé à", "Addressed to"), d.destinataire ? `${d.destinataire} (${d.departement})` : d.departement),
    ...(d.caractere === "personnel"
      ? [ligneInfo(t("Caractère", "Type"), t("Pli personnel : remis fermé à son destinataire", "Personal envelope: handed over sealed to its recipient"))]
      : d.caractere === "urgent"
        ? [ligneInfo(t("Caractère", "Type"), t("Urgent", "Urgent"))]
        : []),
    ligneInfo(t("Code de suivi", "Tracking code"), d.codeSuivi),
    ligneInfo(t("Enregistré par", "Registered by"), d.agent),
  ];
  return genererPdf(await entete(`${t("Récépissé", "Receipt")} ${d.numero}`, langue), [
    titreDocument(t("RÉCÉPISSÉ DE DÉPÔT DE COURRIER", "MAIL DEPOSIT RECEIPT")),
    tableInfo(lignes),
    {
      text: t(
        "Ce récépissé atteste l'enregistrement du courrier. Il n'engage pas l'organisation sur son contenu, que le service du courrier n'a pas ouvert. Conservez-le pour tout suivi auprès du service du courrier, en rappelant le numéro d'ordre et le code de suivi.",
        "This receipt certifies that the mail was registered. It does not commit the organisation on its content, which the mail service has not opened. Keep it for any follow-up with the mail service, quoting the sequence number and tracking code."
      ),
      fontSize: 9, color: GRIS, margin: [0, 22, 0, 0],
    },
    { text: t("Cachet et signature du service du courrier", "Stamp and signature of the mail service"), fontSize: 9, color: GRIS, margin: [0, 40, 0, 0] },
  ]);
}

// --- Registre des arrivées ----------------------------------------------------------------------------------

export type LigneRegistre = {
  numero: string; recu_le: string; expediteur: string; reference_expediteur: string | null; date_lettre: string | null;
  mode_reception: string; nature: string; nb_pieces: number; objet: string | null; caractere: string;
  departement: string; destinataire: string | null; statut: string; decharge_le: string | null; decharge_mode: string | null;
};

export async function genererRegistrePdf(lignes: LigneRegistre[], titre: string, auteur: string, langue: Langue, dep: (n: string) => string): Promise<Buffer> {
  const t = (fr: string, e: string) => (langue === "en" ? e : fr);
  const titres = [t("N° d'ordre", "Seq. no."), t("Reçu le", "Received"), t("Expéditeur", "Sender"), t("Objet", "Subject"), t("Destinataire", "Recipient"), t("Caractère", "Type"), t("Statut", "Status"), t("Décharge", "Receipt")];
  const corps: TableCell[][] = lignes.map((l): TableCell[] => [
    { text: l.numero, fontSize: 8, noWrap: true },
    { text: formaterDate(l.recu_le, langue), fontSize: 8, noWrap: true },
    { stack: [
      { text: l.expediteur, fontSize: 8 },
      ...(l.reference_expediteur ? [{ text: `${t("Réf.", "Ref.")} ${l.reference_expediteur}${l.date_lettre ? ` ${t("du", "dated")} ${formaterDate(l.date_lettre, langue)}` : ""}`, fontSize: 7, color: GRIS }] : []),
      { text: `${en(NATURES[l.nature] ?? [l.nature, l.nature], langue)} · ${en(MODES[l.mode_reception] ?? [l.mode_reception, l.mode_reception], langue)} · ${l.nb_pieces} p.`, fontSize: 7, color: GRIS },
    ] },
    { text: l.objet || (l.caractere === "personnel" ? t("Pli personnel", "Personal envelope") : "—"), fontSize: 8, italics: !l.objet },
    { stack: [{ text: dep(l.departement), fontSize: 8 }, ...(l.destinataire ? [{ text: l.destinataire, fontSize: 7, color: GRIS }] : [])] },
    { text: en(CARACTERES[l.caractere]?.libelle ?? [l.caractere, l.caractere], langue), fontSize: 8 },
    { text: en(STATUTS_COURRIER[l.statut]?.libelle ?? [l.statut, l.statut], langue), fontSize: 8, bold: l.statut === "annule" },
    { text: l.decharge_le ? `${formaterDate(l.decharge_le, langue)} (${l.decharge_mode === "papier" ? t("papier", "paper") : t("appli", "app")})` : "", fontSize: 8 },
  ]);
  return genererPdf(await entete(titre, langue, true), [
    { text: titre, fontSize: 14, bold: true, color: COULEUR_MARINE, margin: [0, 4, 0, 10] },
    lignes.length === 0
      ? { text: t("Aucun courrier sur la période.", "No mail in the period."), italics: true, color: GRIS }
      : { table: { headerRows: 1, dontBreakRows: true, widths: [74, 46, "*", "*", "*", 62, 44, 70], body: [entetesTableau(titres), ...corps] }, layout: MISE_EN_PAGE },
    { text: `${lignes.length} ${pluriel(lignes.length, t("courrier", "item"), t("courriers", "items"))} — ${t("édité le", "issued on")} ${formaterDate(new Date().toISOString(), langue)} ${t("par", "by")} ${auteur}`, fontSize: 8, color: GRIS, margin: [0, 10, 0, 0] },
  ]);
}

// --- Départ : récépissé d'envoi, bordereau, registre --------------------------------------------------------

export type DonneesRecepisseDepart = {
  numero: string | null; objet: string; departement: string; demandeur: string; mode: string; nbPieces: number; urgent: boolean;
  demandeLe: string; enregistreLe: string | null; expedieLe: string | null; statut: string; signature: string | null; reponseA: string | null;
  destinataires: { nom: string; adresse: string | null; role: string; statut: string; accuseLe: string | null }[];
};

export async function genererRecepisseDepart(d: DonneesRecepisseDepart, langue: Langue, dep: (n: string) => string): Promise<Buffer> {
  const t = (fr: string, e: string) => (langue === "en" ? e : fr);
  const reference = d.numero ?? t("DEMANDE", "REQUEST");
  const lignes: [Content, Content][] = [
    ligneInfo(t("Numéro de départ", "Outgoing number"), d.numero ?? t("Pas encore attribué (demande en attente du service du courrier)", "Not yet assigned (request waiting for the mail service)")),
    ligneInfo(t("Objet", "Subject"), d.objet),
    ligneInfo(t("Département émetteur", "Sending department"), dep(d.departement)),
    ligneInfo(t("Demandé par", "Requested by"), d.demandeur),
    ligneInfo(t("Demande transmise le", "Request sent on"), `${formaterDateHeure(d.demandeLe, langue)} (${t("heure de Douala", "Douala time")})`),
    ...(d.enregistreLe ? [ligneInfo(t("Enregistré le", "Registered on"), formaterDateHeure(d.enregistreLe, langue))] : []),
    ...(d.expedieLe ? [ligneInfo(t("Expédié le", "Sent on"), formaterDateHeure(d.expedieLe, langue))] : []),
    ligneInfo(t("Mode d'envoi", "Delivery method"), `${en(MODES_ENVOI[d.mode] ?? [d.mode, d.mode], langue)} — ${d.nbPieces} ${pluriel(d.nbPieces, t("pièce", "item"), t("pièces", "items"))}${d.urgent ? ` — ${t("URGENT", "URGENT")}` : ""}`),
    ligneInfo(t("Statut", "Status"), en(STATUTS_DEPART[d.statut]?.libelle ?? [d.statut, d.statut], langue)),
    ...(d.signature ? [ligneInfo(t("Signature électronique", "Electronic signature"), d.signature)] : []),
    ...(d.reponseA ? [ligneInfo(t("En réponse au courrier", "In reply to mail"), d.reponseA)] : []),
  ];
  const destinataires: Content = {
    table: {
      headerRows: 1, widths: ["*", "*", 70, 80],
      body: [
        [t("Destinataire", "Recipient"), t("Adresse", "Address"), t("Rôle", "Role"), t("Accusé de réception", "Acknowledgement")].map((x): TableCell => ({ text: x, bold: true, fontSize: 9, fillColor: FOND_ENTETE })),
        ...d.destinataires.map((x): TableCell[] => [
          { text: x.nom, fontSize: 9.5 },
          { text: x.adresse ?? "—", fontSize: 9 },
          { text: x.role === "ampliation" ? t("Ampliation", "Copy") : t("Destinataire", "Recipient"), fontSize: 9 },
          { text: x.accuseLe ? formaterDate(x.accuseLe, langue) : x.role === "ampliation" ? "—" : t("En attente", "Pending"), fontSize: 9 },
        ]),
      ],
    },
    layout: MISE_EN_PAGE, margin: [0, 16, 0, 0],
  };
  return genererPdf(await entete(`${t("Récépissé d'envoi", "Dispatch receipt")} ${reference}`, langue), [
    titreDocument(t("RÉCÉPISSÉ D'ENVOI DE COURRIER", "MAIL DISPATCH RECEIPT")),
    tableInfo(lignes),
    destinataires,
    {
      text: t(
        "Ce récépissé atteste la prise en charge du courrier par le service du courrier. Il n'établit pas la réception par le destinataire : seul l'accusé de réception le fait.",
        "This receipt certifies that the mail service has taken charge of the mail. It does not prove receipt by the recipient: only the acknowledgement of receipt does."
      ),
      fontSize: 9, color: GRIS, margin: [0, 18, 0, 0],
    },
    { text: t("Cachet et signature du service du courrier", "Stamp and signature of the mail service"), fontSize: 9, color: GRIS, margin: [0, 36, 0, 0] },
  ]);
}

export type LigneBordereau = { numero: string; objet: string; destinataire: string; adresse: string | null; mode: string; nbPieces: number; urgent: boolean };

export async function genererBordereau(lignes: LigneBordereau[], titre: string, auteur: string, langue: Langue): Promise<Buffer> {
  const t = (fr: string, e: string) => (langue === "en" ? e : fr);
  const titres = [t("N° de départ", "Outgoing no."), t("Destinataire et adresse", "Recipient and address"), t("Objet", "Subject"), t("Mode", "Method"), t("Pièces", "Items"), t("Remis le (date, heure)", "Handed over (date, time)"), t("Nom et signature", "Name and signature")];
  const corps: TableCell[][] = lignes.map((l): TableCell[] => [
    { text: l.numero, fontSize: 8, noWrap: true, bold: l.urgent },
    { stack: [{ text: l.destinataire, fontSize: 8.5 }, ...(l.adresse ? [{ text: l.adresse, fontSize: 7.5, color: GRIS }] : [])] },
    { text: l.objet, fontSize: 8 },
    { text: en(MODES_ENVOI[l.mode] ?? [l.mode, l.mode], langue), fontSize: 8 },
    { text: String(l.nbPieces), fontSize: 8, alignment: "center" },
    { text: "\n\n", fontSize: 8 },
    { text: "", fontSize: 8 },
  ]);
  return genererPdf(await entete(titre, langue, true), [
    { text: titre, fontSize: 14, bold: true, color: COULEUR_MARINE, margin: [0, 4, 0, 10] },
    lignes.length === 0
      ? { text: t("Aucun pli sélectionné.", "No item selected."), italics: true, color: GRIS }
      : { table: { headerRows: 1, dontBreakRows: true, widths: [70, "*", "*", 50, 34, 100, 100], body: [entetesTableau(titres), ...corps] }, layout: MISE_EN_PAGE },
    {
      text: t(
        "Le porteur ou le destinataire reconnaît avoir reçu les plis listés ci-dessus, dans l'état où ils lui sont remis. Cette feuille ne remplace pas l'accusé de réception du destinataire final.",
        "The carrier or recipient acknowledges having received the items listed above, in the condition in which they are handed over. This sheet does not replace the final recipient's acknowledgement of receipt."
      ),
      fontSize: 8, color: GRIS, margin: [0, 10, 0, 0],
    },
    { text: `${lignes.length} ${pluriel(lignes.length, t("pli", "item"), t("plis", "items"))} — ${t("édité le", "issued on")} ${formaterDate(new Date().toISOString(), langue)} ${t("par", "by")} ${auteur}`, fontSize: 8, color: GRIS, margin: [0, 4, 0, 0] },
  ]);
}

export type LigneRegistreDepart = {
  numero: string; enregistre_le: string; expedie_le: string | null; objet: string; departement: string; demandeur: string;
  mode_envoi: string; nb_pieces: number; urgent: boolean; destinataires: string | null; ampliations: string | null; statut: string;
  ar_demande: boolean; accuses: string | null; reponse_a: string | null; signature_numero: string | null;
};

export async function genererRegistreDepartPdf(lignes: LigneRegistreDepart[], titre: string, auteur: string, langue: Langue, dep: (n: string) => string): Promise<Buffer> {
  const t = (fr: string, e: string) => (langue === "en" ? e : fr);
  const titres = [t("N° de départ", "Outgoing no."), t("Enregistré le", "Registered"), t("Destinataire(s)", "Recipient(s)"), t("Objet", "Subject"), t("Département", "Department"), t("Mode", "Method"), t("Expédié le", "Sent"), t("Statut", "Status"), t("Accusés", "Acks")];
  const corps: TableCell[][] = lignes.map((l): TableCell[] => [
    { text: l.numero, fontSize: 8, noWrap: true },
    { text: formaterDate(l.enregistre_le, langue), fontSize: 8, noWrap: true },
    { stack: [{ text: l.destinataires ?? "—", fontSize: 8 }, ...(l.ampliations ? [{ text: `${t("Ampliation", "Copy")} : ${l.ampliations}`, fontSize: 7, color: GRIS }] : [])] },
    { stack: [
      { text: l.objet, fontSize: 8 },
      ...(l.reponse_a ? [{ text: `${t("En réponse à", "In reply to")} ${l.reponse_a}`, fontSize: 7, color: GRIS }] : []),
      ...(l.signature_numero ? [{ text: `${t("Signé", "Signed")} : ${l.signature_numero}`, fontSize: 7, color: GRIS }] : []),
    ] },
    { stack: [{ text: dep(l.departement), fontSize: 8 }, { text: l.demandeur, fontSize: 7, color: GRIS }] },
    { text: `${en(MODES_ENVOI[l.mode_envoi] ?? [l.mode_envoi, l.mode_envoi], langue)}${l.urgent ? ` · ${t("urgent", "urgent")}` : ""} · ${l.nb_pieces} p.`, fontSize: 8 },
    { text: formaterDate(l.expedie_le, langue), fontSize: 8, noWrap: true },
    { text: en(STATUTS_DEPART[l.statut]?.libelle ?? [l.statut, l.statut], langue), fontSize: 8, bold: l.statut === "annule" },
    { text: l.ar_demande ? (l.accuses ?? "") : "—", fontSize: 8, alignment: "center" },
  ]);
  return genererPdf(await entete(titre, langue, true), [
    { text: titre, fontSize: 14, bold: true, color: COULEUR_MARINE, margin: [0, 4, 0, 10] },
    lignes.length === 0
      ? { text: t("Aucun départ sur la période.", "No outgoing mail in the period."), italics: true, color: GRIS }
      : { table: { headerRows: 1, dontBreakRows: true, widths: [74, 46, "*", "*", 90, 70, 46, 50, 38], body: [entetesTableau(titres), ...corps] }, layout: MISE_EN_PAGE },
    { text: `${lignes.length} ${pluriel(lignes.length, t("départ", "item"), t("départs", "items"))} — ${t("édité le", "issued on")} ${formaterDate(new Date().toISOString(), langue)} ${t("par", "by")} ${auteur}`, fontSize: 8, color: GRIS, margin: [0, 10, 0, 0] },
  ]);
}
