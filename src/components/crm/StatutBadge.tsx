"use client";

import type { StatutProspect } from "@/lib/crmTypes";
import { STATUT_COLORS, STATUT_EMOJI, STATUT_LABEL } from "@/lib/crmLabels";

export default function StatutBadge({ statut, compact = false }: { statut: StatutProspect; compact?: boolean }) {
  const c = STATUT_COLORS[statut];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold tabular-nums whitespace-nowrap ${
        compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]"
      }`}
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      <span>{STATUT_EMOJI[statut]}</span>
      <span>{STATUT_LABEL[statut]}</span>
    </span>
  );
}
