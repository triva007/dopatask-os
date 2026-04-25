"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft, Phone, Calendar, DollarSign, TrendingUp, TrendingDown,
  Clock, Loader2, Percent, Target,
} from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";
import type { Call } from "@/lib/crmTypes";

// ═══════════════════════════════════════════════════════════════
// Helpers date
// ═══════════════════════════════════════════════════════════════
const JOURS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
}

function startOfMonth(d: Date): Date {
  const n = new Date(d);
  n.setDate(1);
  n.setHours(0, 0, 0, 0);
  return n;
}

function endOfMonth(d: Date): Date {
  const n = startOfMonth(d);
  n.setMonth(n.getMonth() + 1);
  n.setDate(0);
  n.setHours(23, 59, 59, 999);
  return n;
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("fr-FR", { month: "long" });
}

// ═══════════════════════════════════════════════════════════════
// Composant principal
// ═══════════════════════════════════════════════════════════════
export default function AnalyticsPanel() {
  const loaded = useCrmStore((s) => s.loaded);
  const loading = useCrmStore((s) => s.loading);
  const loadAll = useCrmStore((s) => s.loadAll);
  const calls = useCrmStore((s) => s.calls);
  const revenus = useCrmStore((s) => s.revenus);

  useEffect(() => {
    if (!loaded) loadAll();
  }, [loaded, loadAll]);

  // ─────── Mois courant vs mois précédent ───────
  const now = new Date();
  const moisCourantStart = startOfMonth(now);
  const moisCourantEnd = endOfMonth(now);
  const moisPrecStart = startOfMonth(addDays(moisCourantStart, -1));
  const moisPrecEnd = endOfMonth(moisPrecStart);

  const statsMois = useMemo(() => computeStats(calls, revenus, moisCourantStart, moisCourantEnd), [calls, revenus, moisCourantStart, moisCourantEnd]);
  const statsMoisPrec = useMemo(() => computeStats(calls, revenus, moisPrecStart, moisPrecEnd), [calls, revenus, moisPrecStart, moisPrecEnd]);

  // ─────── 30 derniers jours : appels par jour ───────
  const dailyData = useMemo(() => {
    const map = new Map<string, number>();
    const start = addDays(now, -29);
    for (let i = 0; i < 30; i++) {
      map.set(isoDay(addDays(start, i)), 0);
    }
    for (const c of calls) {
      if (!c.compte_mission) continue;
      const key = c.date.slice(0, 10);
      if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries()).map(([iso, count]) => ({ iso, count }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calls]);

  const maxDaily = Math.max(...dailyData.map((d) => d.count), 1);
  const avgDaily = Math.round(dailyData.reduce((sum, d) => sum + d.count, 0) / dailyData.length);

  // ─────── Heatmap créneaux horaires : jour×heure ───────
  const heatmap = useMemo(() => heatmapData(calls), [calls]);

  // ─────── Top créneaux (décroché) ───────
  const topSlots = useMemo(() => topCreneaux(calls), [calls]);

  if (!loaded || loading) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--text-tertiary)] gap-2">
        <Loader2 size={18} className="animate-spin" />
        <span>Chargement des données…</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border-primary)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/crm"
            className="p-2 hover:bg-[var(--surface-2)] rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-[20px] font-bold tracking-tight">Analytique des appels</h1>
            <p className="text-[12px] text-[var(--text-tertiary)]">
              {calls.length} appels tout-temps · {dailyData.reduce((s, d) => s + d.count, 0)} sur 30j
            </p>
          </div>
        </div>
      </div>

      {/* Body scrollable */}
      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* ─── KPIs mois courant vs précédent ─── */}
        <section>
          <h2 className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold mb-3">
            {monthLabel(now)} vs {monthLabel(moisPrecStart)}
          </h2>
          <div className="grid grid-cols-4 gap-3">
            <KpiCard
              icon={<Phone size={14} />}
              label="Appels"
              value={statsMois.total}
              prev={statsMoisPrec.total}
              color="cyan"
            />
            <KpiCard
              icon={<Percent size={14} />}
              label="Taux décroché"
              value={`${statsMois.tauxDecroche}%`}
              prev={statsMoisPrec.tauxDecroche}
              valueNum={statsMois.tauxDecroche}
              color="orange"
              suffix="%"
            />
            <KpiCard
              icon={<Calendar size={14} />}
              label="RDV Bookés"
              value={statsMois.rdv}
              prev={statsMoisPrec.rdv}
              color="blue"
            />
            <KpiCard
              icon={<DollarSign size={14} />}
              label="Revenu"
              value={`${statsMois.revenu} €`}
              prev={statsMoisPrec.revenu}
              valueNum={statsMois.revenu}
              color="green"
              suffix=" €"
            />
          </div>
        </section>

        {/* ─── Ratios du funnel ─── */}
        <section>
          <h2 className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold mb-3">
            Funnel ({monthLabel(now)})
          </h2>
          <div className="bg-[var(--surface-1)] border border-[var(--border-primary)] rounded-xl p-5">
            <div className="grid grid-cols-4 gap-4">
              <FunnelStep label="Appels" value={statsMois.total} color="cyan" />
              <FunnelStep label="Décrochés" value={statsMois.decroche} color="orange" ratio={statsMois.tauxDecroche} ratioLabel="décroché" />
              <FunnelStep label="RDV" value={statsMois.rdv} color="blue" ratio={statsMois.tauxRdvDecroche} ratioLabel="RDV / décroché" />
              <FunnelStep label="Ventes" value={statsMois.ventes} color="green" ratio={statsMois.tauxClosing} ratioLabel="closing" />
            </div>
          </div>
        </section>

        {/* ─── Graphique appels par jour (30j) ─── */}
        <section>
          <h2 className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold mb-3 flex items-center justify-between">
            <span>Appels par jour (30 derniers jours)</span>
            <span className="text-[var(--text-secondary)] normal-case tracking-normal">
              Moyenne : <strong className="text-[var(--text-primary)]">{avgDaily}</strong> / jour
            </span>
          </h2>
          <div className="bg-[var(--surface-1)] border border-[var(--border-primary)] rounded-xl p-5">
            <DailyChart data={dailyData} max={maxDaily} />
          </div>
        </section>

        {/* ─── Heatmap créneaux horaires ─── */}
        <section>
          <h2 className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold mb-3">
            Meilleurs créneaux (décrochés par jour × heure)
          </h2>
          <div className="bg-[var(--surface-1)] border border-[var(--border-primary)] rounded-xl p-5">
            <Heatmap data={heatmap} />
            <p className="text-[10.5px] text-[var(--text-tertiary)] mt-3">
              Plus la cellule est saturée, plus tu as eu de décrochés sur ce créneau (tous mois confondus).
            </p>
          </div>
        </section>

        {/* ─── Top créneaux ─── */}
        <section>
          <h2 className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold mb-3">
            Top 5 créneaux rentables
          </h2>
          <div className="bg-[var(--surface-1)] border border-[var(--border-primary)] rounded-xl p-5">
            {topSlots.length === 0 ? (
              <p className="text-[12px] text-[var(--text-tertiary)] text-center py-4">
                Pas encore assez de données. Continue d&apos;appeler.
              </p>
            ) : (
              <ul className="space-y-2">
                {topSlots.map((s, idx) => (
                  <li key={`${s.day}-${s.hour}`} className="flex items-center gap-3 text-[13px]">
                    <span className="w-6 text-center font-bold text-[var(--accent-cyan)] tabular-nums">
                      #{idx + 1}
                    </span>
                    <Clock size={13} className="text-[var(--text-tertiary)]" />
                    <span className="font-semibold text-[var(--text-primary)] w-28">
                      {JOURS[s.day]} {String(s.hour).padStart(2, "0")}h–{String(s.hour + 1).padStart(2, "0")}h
                    </span>
                    <span className="flex-1 text-[var(--text-secondary)]">
                      {s.decroche} décroché{s.decroche > 1 ? "s" : ""} sur {s.total} appels
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-[var(--accent-green-light)] text-[var(--accent-green)] font-bold text-[11px] tabular-nums">
                      {Math.round((s.decroche / s.total) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Stats compute
// ═══════════════════════════════════════════════════════════════
type PeriodStats = {
  total: number;
  decroche: number;
  rdv: number;
  ventes: number;
  revenu: number;
  tauxDecroche: number;
  tauxRdvDecroche: number;
  tauxClosing: number;
};

function computeStats(
  calls: ReturnType<typeof useCrmStore.getState>["calls"],
  revenus: ReturnType<typeof useCrmStore.getState>["revenus"],
  start: Date,
  end: Date
): PeriodStats {
  const inRange = calls.filter((c) => {
    const d = new Date(c.date).getTime();
    return d >= start.getTime() && d <= end.getTime();
  });
  const total = inRange.length;
  const decroche = inRange.filter((c) => c.resultat === "DECROCHE" || c.resultat === "RDV" || c.resultat === "REFUS").length;
  const rdv = inRange.filter((c) => c.resultat === "RDV").length;
  const revsInRange = revenus.filter((r) => {
    const d = new Date(r.date_signature).getTime();
    return d >= start.getTime() && d <= end.getTime();
  });
  const ventes = revsInRange.length;
  const revenu = revsInRange.reduce((sum, r) => sum + Number(r.montant || 0), 0);
  return {
    total,
    decroche,
    rdv,
    ventes,
    revenu,
    tauxDecroche: total > 0 ? Math.round((decroche / total) * 100) : 0,
    tauxRdvDecroche: decroche > 0 ? Math.round((rdv / decroche) * 100) : 0,
    tauxClosing: rdv > 0 ? Math.round((ventes / rdv) * 100) : 0,
  };
}

// ═══════════════════════════════════════════════════════════════
// Heatmap data : matrice 7 × 24 (jour × heure) → count décrochés
// ═══════════════════════════════════════════════════════════════
function heatmapData(calls: Call[]): number[][] {
  const matrix: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const c of calls) {
    if (c.resultat !== "DECROCHE" && c.resultat !== "RDV") continue;
    const d = new Date(c.date);
    matrix[d.getDay()][d.getHours()] += 1;
  }
  return matrix;
}

function topCreneaux(calls: Call[]): { day: number; hour: number; decroche: number; total: number }[] {
  const bucket = new Map<string, { day: number; hour: number; decroche: number; total: number }>();
  for (const c of calls) {
    const d = new Date(c.date);
    const day = d.getDay();
    const hour = d.getHours();
    const key = `${day}-${hour}`;
    const b = bucket.get(key) || { day, hour, decroche: 0, total: 0 };
    b.total += 1;
    if (c.resultat === "DECROCHE" || c.resultat === "RDV") b.decroche += 1;
    bucket.set(key, b);
  }
  return Array.from(bucket.values())
    .filter((b) => b.total >= 3) // min 3 appels pour stat significative
    .sort((a, b) => b.decroche / b.total - a.decroche / a.total)
    .slice(0, 5);
}

// ═══════════════════════════════════════════════════════════════
// Sous-composants
// ═══════════════════════════════════════════════════════════════
type KpiColor = "cyan" | "orange" | "blue" | "green";
const KPI_BG: Record<KpiColor, string> = {
  cyan: "bg-[var(--accent-cyan-light)] text-[var(--accent-cyan)]",
  orange: "bg-[#422006]/80 text-[#fb923c]",
  blue: "bg-dopa-blue/10 text-dopa-blue",
  green: "bg-[var(--accent-green-light)] text-[var(--accent-green)]",
};

function KpiCard({
  icon, label, value, prev, valueNum, color, suffix = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  prev: number;
  valueNum?: number;
  color: KpiColor;
  suffix?: string;
}) {
  const current = typeof value === "number" ? value : (valueNum ?? 0);
  const delta = current - prev;
  const pct = prev > 0 ? Math.round((delta / prev) * 100) : null;
  const up = delta > 0;
  const neutral = delta === 0;

  return (
    <div className="bg-[var(--surface-1)] border border-[var(--border-primary)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${KPI_BG[color]}`}>
          {icon}
        </span>
        {!neutral && pct !== null && (
          <span className={`inline-flex items-center gap-0.5 text-[10.5px] font-bold ${up ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}`}>
            {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {up ? "+" : ""}{pct}%
          </span>
        )}
      </div>
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
        {label}
      </p>
      <p className="text-[22px] font-bold text-[var(--text-primary)] tabular-nums mt-0.5">
        {value}
      </p>
      <p className="text-[10.5px] text-[var(--text-tertiary)] mt-1">
        Mois dernier : <span className="tabular-nums">{prev}{suffix}</span>
      </p>
    </div>
  );
}

function FunnelStep({
  label, value, color, ratio, ratioLabel,
}: {
  label: string;
  value: number;
  color: KpiColor;
  ratio?: number;
  ratioLabel?: string;
}) {
  return (
    <div className="text-center">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2 ${KPI_BG[color]}`}>
        <Target size={16} />
      </div>
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
        {label}
      </p>
      <p className="text-[26px] font-bold text-[var(--text-primary)] tabular-nums">
        {value}
      </p>
      {ratio !== undefined && (
        <p className="text-[10.5px] text-[var(--text-secondary)] mt-1">
          <span className="font-semibold text-[var(--text-primary)]">{ratio}%</span>{" "}
          <span className="text-[var(--text-tertiary)]">{ratioLabel}</span>
        </p>
      )}
    </div>
  );
}

function DailyChart({ data, max }: { data: { iso: string; count: number }[]; max: number }) {
  const barW = 100 / data.length;
  return (
    <div>
      <div className="h-[180px] flex items-end gap-[2px]">
        {data.map((d) => {
          const h = max > 0 ? (d.count / max) * 100 : 0;
          const date = new Date(d.iso);
          const isToday = d.iso === new Date().toISOString().slice(0, 10);
          return (
            <div
              key={d.iso}
              className="flex-1 flex flex-col justify-end items-center group relative"
              style={{ minWidth: `${barW}%` }}
              title={`${date.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })} — ${d.count} appel${d.count > 1 ? "s" : ""}`}
            >
              <div
                className={`w-full rounded-t transition-all ${
                  isToday
                    ? "bg-[var(--accent-cyan)]"
                    : d.count === 0
                    ? "bg-[var(--surface-2)]"
                    : "bg-[var(--accent-cyan)]/40 group-hover:bg-[var(--accent-cyan)]/70"
                }`}
                style={{ height: `${Math.max(h, d.count > 0 ? 3 : 0)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[9.5px] text-[var(--text-tertiary)] tabular-nums">
        <span>{new Date(data[0].iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span>
        <span>{new Date(data[Math.floor(data.length / 2)].iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span>
        <span className="font-semibold text-[var(--accent-cyan)]">Aujourd&apos;hui</span>
      </div>
    </div>
  );
}

function Heatmap({ data }: { data: number[][] }) {
  const max = Math.max(...data.flat(), 1);
  // Heures affichées : 8h à 20h (créneaux d'appels réalistes)
  const heuresAffichees = Array.from({ length: 13 }, (_, i) => i + 8);

  return (
    <div className="overflow-x-auto">
      <table className="text-[10px] tabular-nums">
        <thead>
          <tr>
            <th className="pr-2"></th>
            {heuresAffichees.map((h) => (
              <th key={h} className="px-[3px] py-1 text-[var(--text-tertiary)] font-normal w-[26px]">
                {h}h
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => (
            <tr key={dayIdx}>
              <td className="pr-2 text-[var(--text-tertiary)] uppercase tracking-wider font-semibold text-[9.5px] whitespace-nowrap">
                {JOURS[dayIdx]}
              </td>
              {heuresAffichees.map((h) => {
                const v = data[dayIdx][h];
                const intensity = max > 0 ? v / max : 0;
                return (
                  <td key={h} className="p-[2px]">
                    <div
                      className="w-[26px] h-[26px] rounded flex items-center justify-center text-[9px] font-semibold"
                      style={{
                        backgroundColor: v === 0 ? "var(--surface-2)" : `rgba(34, 211, 238, ${0.15 + intensity * 0.75})`,
                        color: v > 0 ? (intensity > 0.4 ? "#000" : "var(--text-primary)") : "var(--text-tertiary)",
                      }}
                      title={`${JOURS[dayIdx]} ${h}h : ${v} décroché${v > 1 ? "s" : ""}`}
                    >
                      {v > 0 ? v : ""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
