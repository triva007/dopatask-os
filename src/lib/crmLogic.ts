// src/lib/crmLogic.ts
// Logique métier CRM : calculs stats, formatage feedback, règles archivage.
// Réplique la logique de l'Apps Script du Google Sheet d'Aaron.

import type { Prospect, Call, Revenu, ResultatAppel, StatutProspect } from "./crmTypes";
import { STATUTS_ARCHIVES } from "./crmLabels";

// ============================================================
// Calculs stats
// ============================================================

export function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export type StatsMois = {
  appelsTotal: number;
  rdvObtenus: number;
  sitesVendus: number;
  revenuTotal: number;
  tauxConversion: number; // RDV / appels %
  tauxClosing: number;    // ventes / RDV %
  appelsDuJour: number;   // appels "vrais" d'aujourd'hui
};

// Calcule les stats du mois en cours à partir de calls + revenus.
// Les appels "pas joignable" et "répondeur" comptent dans le total brut appels
// (aligné sur le sheet : on compte toute tentative).
// MAIS ne comptent pas dans la mission du jour (compte_mission=false).
export function computeStatsMois(calls: Call[], revenus: Revenu[]): StatsMois {
  const callsMois = calls.filter((c) => isThisMonth(c.date));
  const appelsTotal = callsMois.length;
  const rdvObtenus = callsMois.filter((c) => c.resultat === "RDV").length;

  const revenusMois = revenus.filter((r) => isThisMonth(r.date_signature));
  const sitesVendus = revenusMois.length;
  const revenuTotal = revenusMois.reduce((sum, r) => sum + Number(r.montant || 0), 0);

  const tauxConversion = appelsTotal > 0 ? Math.round((rdvObtenus / appelsTotal) * 100) : 0;
  const tauxClosing = rdvObtenus > 0 ? Math.round((sitesVendus / rdvObtenus) * 100) : 0;

  const appelsDuJour = calls.filter((c) => isToday(c.date) && c.compte_mission).length;

  return {
    appelsTotal,
    rdvObtenus,
    sitesVendus,
    revenuTotal,
    tauxConversion,
    tauxClosing,
    appelsDuJour,
  };
}

// Streak : jours consécutifs avec ≥1 "vrai appel" (compte_mission=true)
// en remontant depuis aujourd'hui. Stop au premier jour à 0.
export function computeStreak(calls: Call[]): number {
  const missionCalls = calls.filter((c) => c.compte_mission);
  const daysWithCall = new Set(
    missionCalls.map((c) => new Date(c.date).toISOString().slice(0, 10))
  );
  let streak = 0;
  const cursor = new Date();
  // On tolère que today soit 0 (pas encore appelé) : on commence à compter depuis hier
  // si aujourd'hui=0. Si aujourd'hui≥1, on commence à aujourd'hui.
  const todayStr = cursor.toISOString().slice(0, 10);
  if (!daysWithCall.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (daysWithCall.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// ============================================================
// J-X (days until deadline)
// ============================================================
export function joursAvantDeadline(deadline: string): number {
  const now = new Date();
  const d = new Date(deadline);
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ============================================================
// Message motivation (réplique exacte du sheet)
// ============================================================
export function motivationMessage(params: {
  appelsDuJour: number;
  dailyTarget: number;
  rdvObtenus: number;
  sitesVendus: number;
  revenuTotal: number;
  objectifMensuel: number;
  motivationDefault: string;
}): string {
  const {
    appelsDuJour,
    dailyTarget,
    rdvObtenus,
    sitesVendus,
    revenuTotal,
    objectifMensuel,
    motivationDefault,
  } = params;

  if (revenuTotal >= objectifMensuel) {
    return "OBJECTIF 3000€ EXPLOSÉ. Prends ta soirée, tu l'as mérité.";
  }
  if (rdvObtenus > 0 && sitesVendus === 0 && appelsDuJour >= dailyTarget) {
    return `Quota atteint. Tu as ${rdvObtenus} RDV en stock. Prépare ta maquette IA, c'est ta priorité.`;
  }
  if (appelsDuJour >= dailyTarget) {
    return "MISSION QUOTIDIENNE ACCOMPLIE. Reste fier de toi. La suite c'est du bonus.";
  }
  if (appelsDuJour > 0 && appelsDuJour < dailyTarget) {
    return `Tu es dans l'élan. Plus que ${dailyTarget - appelsDuJour} appels.`;
  }
  return motivationDefault;
}

// ============================================================
// Feedback auto (style sheet: "(Appel n°3) RDV pris le 22 avr. à 11h34")
// ============================================================
const MOIS_FR = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

export function formatDateFR(date: Date = new Date()): string {
  const day = date.getDate();
  const month = MOIS_FR[date.getMonth()];
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month} à ${h}h${m}`;
}

export function buildFeedbackLine(params: {
  oldFeedback: string | null;
  resultat: ResultatAppel;
  date?: Date;
}): string {
  const { oldFeedback, resultat } = params;
  const date = params.date ?? new Date();
  const dateStr = formatDateFR(date);

  // Extrait le compteur d'appel précédent si présent
  let callCount = 1;
  const match = oldFeedback?.match(/Appel n°(\d+)/);
  if (match) callCount = parseInt(match[1], 10);

  switch (resultat) {
    case "REPONDEUR":
      // +1 seulement si le statut précédent n'était pas déjà "répondeur"
      if (match) callCount += 1;
      return `(Appel n°${callCount}) Répondeur le ${dateStr}`;
    case "REFUS": {
      const prefix = match ? `(Appel n°${callCount}) ` : "";
      return `${prefix}Refus le ${dateStr}`;
    }
    case "EXISTE_PAS": {
      const prefix = match ? `(Appel n°${callCount}) ` : "";
      return `${prefix}N'existe plus le ${dateStr}`;
    }
    case "RDV": {
      const prefix = match ? `(Appel n°${callCount}) ` : "";
      return `${prefix}RDV pris le ${dateStr}`;
    }
    case "PAS_JOIGNABLE": {
      const prefix = match ? `(Appel n°${callCount}) ` : "";
      return `${prefix}Pas joignable le ${dateStr}`;
    }
    case "DECROCHE":
    default: {
      const prefix = match ? `(Appel n°${callCount}) ` : "";
      return `${prefix}Décroché le ${dateStr}`;
    }
  }
}

// ============================================================
// Table de correspondance Résultat → Statut + règle archivage
// ============================================================
export function statutFromResultat(
  resultat: ResultatAppel,
  currentStatut: StatutProspect
): StatutProspect {
  switch (resultat) {
    case "RDV":
      return "RDV_BOOKE";
    case "REFUS":
      return "REFUS";
    case "EXISTE_PAS":
      return "EXISTE_PAS";
    case "REPONDEUR":
      return "REPONDEUR";
    case "PAS_JOIGNABLE":
      // Pas joignable = on peut rappeler plus tard, on garde en REPONDEUR
      return "REPONDEUR";
    case "DECROCHE":
    default:
      // Décroché sans action claire : on garde le statut actuel
      return currentStatut;
  }
}

export function shouldArchive(statut: StatutProspect): boolean {
  return STATUTS_ARCHIVES.includes(statut);
}

export function resultatCompteMission(resultat: ResultatAppel): boolean {
  // Aligné sur isRealCall() du sheet : REPONDEUR et PAS_JOIGNABLE ne comptent pas
  return resultat !== "REPONDEUR" && resultat !== "PAS_JOIGNABLE";
}

// ============================================================
// Thermomètre : paliers et couleurs (aligné sheet)
// ============================================================
export function thermometreColor(revenuTotal: number, objectif: number): string {
  if (revenuTotal >= objectif) return "#059669";  // vert foncé
  if (revenuTotal >= objectif * 0.66) return "#10b981"; // vert
  if (revenuTotal > 0) return "#34d399";          // vert clair
  return "#64748b";                                // gris
}

// Paliers achievement à déclencher (celebrate) quand le total monte dessus
export const THERMO_PALIERS = [500, 1000, 1500, 2000, 3000];
