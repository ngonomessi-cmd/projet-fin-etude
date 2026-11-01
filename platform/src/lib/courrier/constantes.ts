import type { Langue } from "@/lib/i18n/plateforme";

// Libellés et messages du service du courrier, en français et en anglais.
// Les messages d'erreur et de succès passent dans l'adresse sous forme de
// CLÉS (jamais du texte libre) : cela empêche d'afficher un message forgé.

export type Paire = readonly [string, string];
export const en = (p: Paire, langue: Langue): string => p[langue === "en" ? 1 : 0];

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const FUSEAU = "Africa/Douala";
export const TAILLE_MAX_SCAN = 25 * 1024 * 1024;

export const MODES: Record<string, Paire> = {
  depot: ["Dépôt direct", "Hand delivery"],
  poste: ["Poste", "Post"],
  coursier: ["Coursier", "Courier"],
  huissier: ["Huissier", "Bailiff"],
  autre: ["Autre", "Other"],
};

export const NATURES: Record<string, Paire> = {
  lettre: ["Lettre", "Letter"],
  pli: ["Pli", "Envelope"],
  colis: ["Colis", "Parcel"],
  recommande: ["Recommandé", "Registered mail"],
  autre: ["Autre", "Other"],
};

export const CARACTERES: Record<string, { libelle: Paire; aide: Paire; classe: string }> = {
  ordinaire: {
    libelle: ["Ordinaire", "Ordinary"],
    aide: ["Courrier courant adressé à un département.", "Routine mail addressed to a department."],
    classe: "bg-slate-100 text-slate-700",
  },
  urgent: {
    libelle: ["Urgent", "Urgent"],
    aide: ["À remettre sans délai.", "To be delivered without delay."],
    classe: "bg-amber-100 text-amber-900",
  },
  personnel: {
    libelle: ["Personnel / confidentiel", "Personal / confidential"],
    aide: [
      "Pli remis fermé à une personne nommée. Le service n'en note ni l'objet ni le contenu et ne le numérise pas.",
      "Sealed envelope handed to a named person. The service records neither its subject nor its content and does not scan it.",
    ],
    classe: "bg-red-100 text-red-900",
  },
};

export const STATUTS_COURRIER: Record<string, { libelle: Paire; classe: string }> = {
  recu: { libelle: ["Reçu", "Received"], classe: "bg-amber-100 text-amber-900" },
  remis: { libelle: ["Remis", "Delivered"], classe: "bg-sky-100 text-sky-900" },
  traite: { libelle: ["Traité", "Handled"], classe: "bg-emerald-100 text-emerald-900" },
  classe: { libelle: ["Classé", "Filed"], classe: "bg-slate-100 text-slate-600" },
  annule: { libelle: ["Annulé", "Cancelled"], classe: "bg-red-100 text-red-900" },
};

export const MOUVEMENTS: Record<string, Paire> = {
  enregistre: ["Enregistré", "Registered"],
  numerise: ["Numérisé", "Scanned"],
  decharge_scannee: ["Décharge papier numérisée", "Paper receipt scanned"],
  remise_declaree: ["Remise déclarée par le service du courrier", "Delivery declared by the mail service"],
  decharge: ["Décharge (réception accusée)", "Receipt acknowledged"],
  impute: ["Imputé", "Assigned"],
  traite: ["Marqué traité", "Marked as handled"],
  classe: ["Classé", "Filed"],
  annule: ["Annulé", "Cancelled"],
  corrige: ["Corrigé", "Corrected"],
};

export const MESSAGES_COURRIER_OK: Record<string, Paire> = {
  enregistre: [
    "Courrier enregistré. Imprimez le récépissé pour le déposant, puis numérisez le courrier s'il est ouvrable.",
    "Mail registered. Print the receipt for the person who dropped it off, then scan the mail if it can be opened.",
  ],
  numerise: ["Le scan est archivé avec son empreinte numérique.", "The scan is archived with its digital fingerprint."],
  remise: ["Remise déclarée : le destinataire est invité à accuser réception.", "Delivery declared: the recipient is asked to acknowledge receipt."],
  decharge: ["Réception enregistrée.", "Receipt recorded."],
  impute: ["Le courrier est imputé.", "The mail has been assigned."],
  traite: ["Le courrier est marqué comme traité.", "The mail is marked as handled."],
  classe: ["Le courrier est classé.", "The mail is filed."],
  annule: ["Le courrier est annulé (il reste visible dans le registre).", "The mail is cancelled (it stays visible in the register)."],
  corrige: [
    "La correction est enregistrée, les valeurs précédentes sont conservées dans l'historique.",
    "The correction is saved; the previous values are kept in the history.",
  ],
};

export const MESSAGES_COURRIER_ERREUR: Record<string, Paire> = {
  expediteur: ["Indiquez l'expéditeur.", "Enter the sender."],
  personnel: ["Un pli personnel doit avoir un destinataire nommé.", "A personal envelope must have a named recipient."],
  motif: ["Indiquez le motif (5 caractères au moins).", "Enter the reason (at least 5 characters)."],
  departement: ["Choisissez le département destinataire.", "Choose the recipient department."],
  invalide: ["Une valeur n'est pas acceptée : vérifiez le formulaire.", "A value is not accepted: check the form."],
  fichier_vide: ["Choisissez au moins un fichier ou une photo.", "Choose at least one file or photo."],
  fichier_gros: ["Le fichier dépasse la taille maximale de 25 Mo.", "The file exceeds the maximum size of 25 MB."],
  fichier_type: ["Seuls les fichiers PDF et les photos sont acceptés.", "Only PDF files and photos are accepted."],
  fichier_suspect: [
    "Le fichier contient des éléments actifs (script, lancement) : il est refusé.",
    "The file contains active elements (script, launch action): it is rejected.",
  ],
  depot: ["Le dépôt du fichier a échoué. Réessayez.", "The file upload failed. Try again."],
  refus: ["Action non autorisée, ou le courrier n'est plus dans l'état attendu.", "Action not allowed, or the mail is no longer in the expected state."],
  generique: ["L'opération a échoué. Réessayez ou contactez l'administrateur.", "The operation failed. Try again or contact the administrator."],
};

// --- Courrier départ -----------------------------------------------------------------------------

export const MODES_ENVOI: Record<string, Paire> = {
  main: ["Remise en main propre", "Hand delivery"],
  poste: ["Poste", "Post"],
  coursier: ["Coursier", "Courier"],
  huissier: ["Huissier", "Bailiff"],
  email: ["E-mail", "Email"],
  autre: ["Autre", "Other"],
};

export const STATUTS_DEPART: Record<string, { libelle: Paire; classe: string }> = {
  demande: { libelle: ["Demande en attente", "Request pending"], classe: "bg-amber-100 text-amber-900" },
  enregistre: { libelle: ["À expédier", "To be sent"], classe: "bg-sky-100 text-sky-900" },
  expedie: { libelle: ["Expédié", "Sent"], classe: "bg-violet-100 text-violet-900" },
  accuse: { libelle: ["Accusé reçu", "Receipt acknowledged"], classe: "bg-emerald-100 text-emerald-900" },
  refuse: { libelle: ["Renvoyé", "Returned"], classe: "bg-red-100 text-red-900" },
  annule: { libelle: ["Annulé", "Cancelled"], classe: "bg-red-100 text-red-900" },
};

export const MOUVEMENTS_DEPART: Record<string, Paire> = {
  demande: ["Demande d'expédition", "Dispatch request"],
  enregistre: ["Enregistré au départ", "Registered for dispatch"],
  refuse: ["Demande renvoyée", "Request returned"],
  expedie: ["Expédié", "Sent"],
  accuse: ["Accusé de réception enregistré", "Acknowledgement of receipt recorded"],
  accuse_scanne: ["Accusé de réception numérisé", "Acknowledgement of receipt scanned"],
  piece: ["Pièce jointe", "Attachment"],
  annule: ["Annulé", "Cancelled"],
};

export const MESSAGES_DEPART_OK: Record<string, Paire> = {
  demande: [
    "Votre demande est transmise au service du courrier, qui l'enregistrera et l'expédiera.",
    "Your request has been passed to the mail service, which will register and send it.",
  ],
  demande_sans_lettre: [
    "Demande transmise. La lettre n'a pas pu être jointe automatiquement : remettez-la au service du courrier.",
    "Request sent. The letter could not be attached automatically: hand it to the mail service.",
  ],
  enregistre: ["Départ enregistré avec son numéro d'ordre.", "Outgoing mail registered with its sequence number."],
  accepte: ["Demande acceptée : le départ porte désormais son numéro d'ordre.", "Request accepted: the outgoing mail now has its sequence number."],
  refuse: ["La demande est renvoyée au demandeur avec votre motif.", "The request has been returned to the requester with your reason."],
  expedie: ["Départ marqué comme expédié.", "Outgoing mail marked as sent."],
  accuse: ["Accusé de réception enregistré.", "Acknowledgement of receipt recorded."],
  annule: ["Le départ est annulé (il reste visible dans le registre).", "The outgoing mail is cancelled (it stays visible in the register)."],
  piece: ["Le fichier est archivé avec son empreinte numérique.", "The file is archived with its digital fingerprint."],
};

export const MESSAGES_DEPART_ERREUR: Record<string, Paire> = {
  objet: ["Indiquez l'objet de la lettre.", "Enter the subject of the letter."],
  destinataire: [
    "Indiquez au moins un destinataire (des ampliations seules ne suffisent pas).",
    "Enter at least one recipient (copies alone are not enough).",
  ],
  document: ["Choisissez un document validé auquel vous avez accès.", "Choose a validated document you have access to."],
  departement: ["Choisissez le département émetteur.", "Choose the sending department."],
  motif: MESSAGES_COURRIER_ERREUR.motif,
  invalide: MESSAGES_COURRIER_ERREUR.invalide,
  refus: ["Action non autorisée, ou le départ n'est plus dans l'état attendu.", "Action not allowed, or the outgoing mail is no longer in the expected state."],
  generique: MESSAGES_COURRIER_ERREUR.generique,
};

// --- Conservation -----------------------------------------------------------------------------------------

export const MESSAGES_CONSERVATION_OK: Record<string, Paire> = {
  conservation_classee: ["Le classement de conservation est enregistré.", "The retention classification is saved."],
  conservation_gelee: [
    "L'élément est gelé : rien ne pourra en être détruit tant qu'il le reste.",
    "The item is frozen: nothing can be destroyed while it stays frozen.",
  ],
  conservation_degelee: ["Le gel est levé.", "The freeze is lifted."],
  detruit: [
    "La décision est enregistrée : les scans sont détruits, la ligne du registre est conservée.",
    "The decision is recorded: the scans are destroyed, the register line is kept.",
  ],
  verse: ["Le versement aux archives est enregistré.", "The transfer to the archives is recorded."],
};

export const MESSAGES_CONSERVATION_ERREUR: Record<string, Paire> = {
  duree: [
    "Cette catégorie exige une durée de conservation, en années (de 1 à 100).",
    "This category requires a retention period in years (1 to 100).",
  ],
  motif: [
    "Indiquez le motif ou la décision (5 caractères au moins), par exemple la référence du procès-verbal.",
    "Enter the reason or decision (at least 5 characters), for example the minutes reference.",
  ],
  choix: ["Cochez au moins un élément.", "Tick at least one item."],
  echeance: [
    "Un des éléments n'est pas arrivé à échéance, ou il est gelé : la liste a changé. Actualisez la page.",
    "One of the items has not reached its deadline, or is frozen: the list has changed. Refresh the page.",
  ],
  refus: ["Action non autorisée.", "Action not allowed."],
  generique: MESSAGES_COURRIER_ERREUR.generique,
};

export type CategorieConservation = {
  code: string;
  libelle: string;
  duree_annees: number | null;
  duree_propre: boolean;
  sort_final: "destruction" | "versement";
};
