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
  role: RoleUtilisateur;
  created_at: string;
};

export type Document = {
  id: string;
  titre: string;
  description: string | null;
  classification: ClassificationDocument;
  statut: StatutDocument;
  departement: string;
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
