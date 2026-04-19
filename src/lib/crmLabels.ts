// src/lib/crmLabels.ts
// Libellés FR + couleurs pour statuts et résultats appels.
// Aligné sur les couleurs du Google Sheet d'Aaron.

import type { StatutProspect, ResultatAppel } from "./crmTypes";

export const STATUT_LABEL: Record<StatutProspect, string> = {
  A_APPELER:      "À appeler",
  REPONDEUR:      "Répondeur / À relancer",
  REFUS:          "Refus / Pas intéressé",
  EXISTE_PAS:     "Existe pas",
  RDV_BOOKE:      "RDV Booké (Faire Maquette)",
  MAQUETTE_PRETE: "Maquette prête (Attente R1)",
  R1_EFFECTUE:    "R1 Effectué (En réflexion)",
  VENDU:          "VENDU",
  PERDU:          "PERDU",
};

export const STATUT_EMOJI: Record<StatutProspect, string> = {
  A_APPELER:      "📞",
  REPONDEUR:      "🟠",
  REFUS:          "🔴",
  EXISTE_PAS:     "⚪",
  RDV_BOOKE:      "📅",
  MAQUETTE_PRETE: "✨",
  R1_EFFECTUE:    "🟢",
  VENDU:          "✅",
  PERDU:          "❌",
};

// Couleurs adaptées fond sombre DopaTask (versions saturées du sheet).
export const STATUT_COLORS: Record<StatutProspect, { bg: string; text: string; border: string }> = {
  A_APPELER:      { bg: "#1e293b", text: "#94a3b8", border: "#334155" },
  REPONDEUR:      { bg: "#422006", text: "#fb923c", border: "#78350f" },
  REFUS:          { bg: "#450a0a", text: "#f87171", border: "#7f1d1d" },
  EXISTE_PAS:     { bg: "#0f172a", text: "#64748b", border: "#1e293b" },
  RDV_BOOKE:      { bg: "#1e3a8a", text: "#60a5fa", border: "#1e40af" },
  MAQUETTE_PRETE: { bg: "#422006", text: "#fde047", border: "#713f12" },
  R1_EFFECTUE:    { bg: "#312e81", text: "#a5b4fc", border: "#4338ca" },
  VENDU:          { bg: "#064e3b", text: "#34d399", border: "#059669" },
  PERDU:          { bg: "#1c1917", text: "#78716c", border: "#292524" },
};

export const STATUTS_ORDRE: StatutProspect[] = [
  "A_APPELER",
  "REPONDEUR",
  "RDV_BOOKE",
  "MAQUETTE_PRETE",
  "R1_EFFECTUE",
  "VENDU",
  "REFUS",
  "EXISTE_PAS",
  "PERDU",
];

// Statuts considérés comme "archivés" (disparaissent de la liste principale)
export const STATUTS_ARCHIVES: StatutProspect[] = ["REFUS", "EXISTE_PAS", "PERDU"];

// Statuts qui comptent comme un "vrai appel" dans la mission du jour
// (aligné avec isRealCall du sheet : exclut A_APPELER et REPONDEUR)
export const STATUTS_VRAI_APPEL: StatutProspect[] = [
  "REFUS",
  "EXISTE_PAS",
  "RDV_BOOKE",
  "MAQUETTE_PRETE",
  "R1_EFFECTUE",
  "VENDU",
  "PERDU",
];

export const RESULTAT_LABEL: Record<ResultatAppel, string> = {
  DECROCHE:      "Décroché",
  REPONDEUR:     "Répondeur",
  REFUS:         "Refus",
  EXISTE_PAS:    "N'existe pas",
  RDV:           "RDV pris",
  PAS_JOIGNABLE: "Pas joignable",
};

export const RESULTAT_EMOJI: Record<ResultatAppel, string> = {
  DECROCHE:      "🗣️",
  REPONDEUR:     "🟠",
  REFUS:         "🔴",
  EXISTE_PAS:    "⚪",
  RDV:           "📅",
  PAS_JOIGNABLE: "⏱️",
};
