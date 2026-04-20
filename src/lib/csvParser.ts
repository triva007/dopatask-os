// src/lib/csvParser.ts
// Helpers de parsing CSV : normalisation des statuts, detection colonnes.

import type { StatutProspect } from "./crmTypes";

// Mappe toute string "humaine" ou CSV export vers un StatutProspect.
// Retourne null si non reconnu.
export function normalizeStatut(raw: unknown): StatutProspect | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  // Accents stripped + lowercase
  const v = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Formes canoniques (exact match enum)
  if (["a_appeler","repondeur","refus","existe_pas","rdv_booke","maquette_prete","r1_effectue","vendu","perdu"].includes(v)) {
    return v.toUpperCase() as StatutProspect;
  }

  // Fuzzy FR/humain
  if (v.includes("vendu") || v.includes("signe") || v === "signed" || v.includes("gagne")) return "VENDU";
  if (v.includes("perdu") || v === "lost") return "PERDU";
  if (v.includes("maquette") && !v.includes("faire")) return "MAQUETTE_PRETE";
  if (v.includes("r1") || v.includes("reflexion") || v.includes("apres r1")) return "R1_EFFECTUE";
  if (v.includes("rdv") || v.includes("rendez-vous") || v.includes("booke")) return "RDV_BOOKE";
  if (v.includes("refus") || v.includes("pas interess") || v.includes("non merci") || v === "no") return "REFUS";
  if (v.includes("existe pas") || v.includes("n'existe") || v.includes("numero invalide") || v.includes("faux numero")) return "EXISTE_PAS";
  if (v.includes("repondeur") || v.includes("messagerie") || v.includes("a relancer") || v.includes("relancer") || v.includes("rappeler plus tard")) return "REPONDEUR";
  if (v.includes("appeler") || v.includes("a_faire") || v.includes("a faire") || v.includes("todo") || v === "nouveau" || v === "new") return "A_APPELER";
  return null;
}

// Essaye d'extraire un statut present au debut de la string "notes".
// Exemple: "RDV Booke - discute prix site en mai" => { statut: "RDV_BOOKE", notes: "discute prix site en mai" }
// Si rien detecte, renvoie { statut: null, notes: original }.
export function extractStatutFromNotes(raw: string | null | undefined): { statut: StatutProspect | null; notes: string | null } {
  if (!raw) return { statut: null, notes: null };
  const trimmed = raw.trim();
  if (!trimmed) return { statut: null, notes: null };

  // On coupe sur : tiret, pipe, slash, deux-points ou saut de ligne
  const parts = trimmed.split(/\s*(?:[-|/:]|\n)\s*/);
  const head = parts[0] || "";
  const found = normalizeStatut(head);
  if (found) {
    const rest = parts.slice(1).join(" - ").trim();
    return { statut: found, notes: rest || null };
  }

  // Sinon on check si la string ENTIERE est juste un statut
  const whole = normalizeStatut(trimmed);
  if (whole) return { statut: whole, notes: null };

  return { statut: null, notes: trimmed };
}

// Normalise un header CSV : trim, lowercase, espace->_, accents strip.
export function normalizeHeader(h: string): string {
  return h
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

// Detecte le separateur le plus probable (`,` vs `;` vs tab).
export function detectSeparator(text: string): string {
  const first = text.split(/\r?\n/)[0] || "";
  const counts = [
    { s: ",", n: (first.match(/,/g) || []).length },
    { s: ";", n: (first.match(/;/g) || []).length },
    { s: "\t", n: (first.match(/\t/g) || []).length },
  ];
  counts.sort((a, b) => b.n - a.n);
  return counts[0].n > 0 ? counts[0].s : ",";
}

// Mappe une ligne parsee (headers normalises -> valeurs) vers les champs Prospect.
export type MappedRow = {
  entreprise: string;
  telephone: string | null;
  gmb_url: string | null;
  site_url: string | null;
  notes: string | null;
  statut: StatutProspect | null;
  niche: string | null;
};

export function mapRow(r: Record<string, string>): MappedRow | null {
  const get = (keys: string[]): string | null => {
    for (const k of keys) {
      const v = r[k];
      if (v != null && String(v).trim()) return String(v).trim();
    }
    return null;
  };

  const entreprise = get([
    "entreprise","company","nom","raison_sociale","societe","name","business",
  ]);
  if (!entreprise) return null;

  const telephone = get([
    "telephone","tel","phone","mobile","numero","num","tel_portable","portable",
  ]);
  const gmb_url = get([
    "gmb_url","gmb","google_maps","maps","google_maps_url","fiche_gmb","lien_gmb","url_gmb",
  ]);
  const site_url = get([
    "site_url","site","website","url","site_web","web","lien_site",
  ]);
  const notesRaw = get(["notes","note","commentaire","remarque","remarques","memo","comment"]);
  const statutRaw = get(["statut","status","etat","stage","pipeline_stage"]);
  const niche = get(["niche","metier","secteur","profession","categorie","industry"]);

  // Si une colonne "statut" explicite existe : on l'utilise directement,
  // on ne touche PAS aux notes.
  let statut: StatutProspect | null = null;
  let notes: string | null = notesRaw;
  if (statutRaw) {
    statut = normalizeStatut(statutRaw);
  } else if (notesRaw) {
    // Pas de colonne statut : on tente d'extraire un statut prefixant les notes
    const { statut: s, notes: n } = extractStatutFromNotes(notesRaw);
    if (s) {
      statut = s;
      notes = n;
    }
  }

  return { entreprise, telephone, gmb_url, site_url, notes, statut, niche };
}
