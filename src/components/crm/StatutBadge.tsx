"use client";

import type { StatutProspect } from "@/lib/crmTypes";
import { STATUT_COLORS, STATUT_EMOJI, STATUT_LABEL } from "@/lib/crmLabels";

export default function StatutBadge({ statut, compact = false }: { statut: StatutProspect; compact?: boolean }) {
  // Couleur accent par statut — via opacity sur la couleur accent, lisible dark + light
  const accentMap: Record<StatutProspect, string> = {
    A_APPELER:      "var(--text-secondary)",
    REPONDEUR:      "var(--accent-orange)",
    REFUS:          "var(--accent-red)",
    EXISTE_PAS:     "var(--text-tertiary)",
    PAS_MA_CIBLE:   "#ca8a04",
    RDV_BOOKE:      "var(--accent-blue)",
    MAQUETTE_PRETE: "var(--accent-orange)",
    R1_EFFECTUE:    "var(--accent-purple)",
    VENDU:          "var(--accent-green)",
    PERDU:          "var(--text-tertiary)",
  };
  const accent = accentMap[statut];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold tabular-nums whitespace-nowrap ${
        compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]"
      }`}
      style={{
        color: accent,
        background: `color-mix(in srgb, ${accent} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${accent} 28%, transparent)`,
      }}
    >
      <span>{STATUT_EMOJI[statut]}</span>
      {!compact && <span>{STATUT_LABEL[statut].split(" (")[0]}</span>}
      {compact && <span>{STATUT_LABEL[statut].split(" ")[0]}</span>}
    </span>
  );
}
