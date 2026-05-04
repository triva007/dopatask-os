// src/lib/crmTypes.ts
// Types & helpers pour le CRM

export type StatutProspect =
  | "A_APPELER"
  | "REPONDEUR"
  | "REFUS"
  | "EXISTE_PAS"
  | "PAS_MA_CIBLE"
  | "RDV_BOOKE"
  | "MAQUETTE_PRETE"
  | "R1_EFFECTUE"
  | "VENDU"
  | "PERDU";

export type ResultatAppel =
  | "REPONDEUR"
  | "RAPPEL_PLUS_TARD"
  | "REFUS"
  | "EXISTE_PAS"
  | "PAS_MA_CIBLE"
  | "RDV";

export type Prospect = {
  id: string;
  entreprise: string;
  telephone: string | null;
  gmb_url: string | null;
  site_url: string | null;
  statut: StatutProspect;
  date_rdv: string | null;
  date_relance: string | null; // date à partir de laquelle relancer (RAPPEL_PLUS_TARD)
  lien_maquette: string | null;
  feedback: string | null;
  notes: string | null;
  niche: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

export type Call = {
  id: string;
  prospect_id: string;
  date: string;
  duree_s: number | null;
  resultat: ResultatAppel;
  notes: string | null;
  compte_mission: boolean;
};

export type Revenu = {
  id: string;
  prospect_id: string | null;
  montant: number;
  date_signature: string;
  notes: string | null;
  created_at: string;
};

export type Config = {
  id: number;
  objectif_mensuel: number;
  deadline_date: string;
  prix_site: number;
  mission_daily_target: number;
  script_actif_id: string | null;
  motivation_default: string;
  boule_a_z_message: string;
};

export type ObjectionQA = { question: string; reponse: string };

export type Script = {
  id: string;
  nom: string;
  niche: string | null;
  ouverture: string | null;
  corps: string | null;
  objections: ObjectionQA[];
  cloture: string | null;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
