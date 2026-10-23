// Types alignés manuellement sur supabase/migrations/0001_init.sql.
// (Pas de génération automatique ici : aucun accès à l'API Supabase CLI
// depuis cet environnement de développement — à régénérer avec
// `supabase gen types typescript` une fois le projet Supabase créé.)

export type RoleUtilisateur = "lecteur" | "redacteur" | "validateur" | "administrateur" | "auditeur";

export type ClassificationDocument = "public_interne" | "restreint" | "confidentiel";

export type StatutDocument = "brouillon" | "en_verification" | "valide" | "rejete" | "publie";

export type Profil = {
  id: string;
  nom_complet: string;
  departement: string;
  organisation: string;
  role: RoleUtilisateur;
  created_at: string;
  derniere_activite_at?: string | null;
  email?: string | null;
};

export type Document = {
  id: string;
  titre: string;
  description: string | null;
  classification: ClassificationDocument;
  statut: StatutDocument;
  departement: string;
  organisation: string;
  storage_path: string | null;
  owner_id: string;
  validated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type EntreeAudit = {
  id: number;
  document_id: string | null;
  acteur_id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
};

// --- Messagerie interne (migration 0008_messagerie_interne.sql) -----------

export type TypeConversation = "privee" | "groupe" | "canal";

export type Conversation = {
  id: string;
  type: TypeConversation;
  titre: string | null;
  departement: string | null;
  organisation: string;
  canal_general: boolean;
  created_by: string;
  created_at: string;
};

export type ParticipantConversation = {
  conversation_id: string;
  profil_id: string;
  peut_publier: boolean;
  archivee: boolean;
  sourdine: boolean;
  dernier_lu_at: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  auteur_id: string;
  contenu: string;
  urgent: boolean;
  modifie_at: string | null;
  supprime_at: string | null;
  transfere_de_message_id: string | null;
  created_at: string;
};

// migration 0010_messagerie_fonctionnalites_avancees.sql
export type StatutMessage = {
  message_id: string;
  profil_id: string;
  recu_at: string | null;
  lu_at: string | null;
};

export type StatutAnalysePieceJointe = "non_analyse" | "propre" | "infecte";

export type PieceJointeMessage = {
  id: string;
  message_id: string;
  storage_path: string;
  nom_fichier: string;
  taille_octets: number;
  type_mime: string;
  statut_analyse: StatutAnalysePieceJointe;
  created_at: string;
};

export type ParametresMessagerie = {
  organisation: string;
  duree_conservation_ans: number;
  modifie_par: string | null;
  modifie_at: string;
};

export type StatutActualite = "brouillon" | "publie";

export type ActualitePublique = {
  id: string;
  organisation: string;
  titre: string;
  titre_en: string | null;
  slug: string;
  extrait: string | null;
  extrait_en: string | null;
  contenu: string;
  contenu_en: string | null;
  statut: StatutActualite;
  auteur_id: string;
  publie_at: string | null;
  created_at: string;
  updated_at: string;
};
