"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Phone,
  Flame,
  Calendar,
  TrendingUp,
  Trophy,
  Banknote,
  Zap,
  ArrowRight,
  Loader2,
  Users,
  ChevronRight,
  Target,
  Skull,
} from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";
import { computeStatsMois, computeStreak, thermometreColor } from "@/lib/crmLogic";

/* ───────────────────── Utils ───────────────────── */
function businessDaysUntil(target: Date, from: Date = new Date()): number {
  let count = 0;
  const cur = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  cur.setDate(cur.getDate() + 1);
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  while (cur < end) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function startOfWeek(d: Date = new Date()): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() + diff);
  return out;
}

/* ───────────────────── Dashboard ───────────────────── */
export default function MobileCrmDashboard() {
  const loaded = useCrmStore((s) => s.loaded);
  const loading = useCrmStore((s) => s.loading);
  const calls = useCrmStore((s) => s.calls);
  const revenus = useCrmStore((s) => s.revenus);
  const config = useCrmStore((s) => s.config);
  const prospects = useCrmStore((s) => s.prospects);
  const loadAll = useCrmStore((s) => s.loadAll);

  useEffect(() => {
    if (!loaded) loadAll();
  }, [loaded, loadAll]);

  // Auto-refresh
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") loadAll();
    };
    const id = window.setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadAll]);

  const stats = useMemo(() => computeStatsMois(calls, revenus), [calls, revenus]);
  const streak = useMemo(() => computeStreak(calls), [calls]);

  const objectif = config?.objectif_mensuel ?? 3000;
  const deadlineStr = config?.deadline_date ?? "2026-06-01";
  const deadline = useMemo(() => new Date(deadlineStr + "T00:00:00"), [deadlineStr]);
  const dailyTarget = config?.mission_daily_target ?? 30;
  const prixSite = config?.prix_site ?? 980;

  const joursOuvres = useMemo(() => businessDaysUntil(deadline), [deadline]);
  const pct = Math.min(100, Math.round((stats.revenuTotal / objectif) * 100));
  const thermoColor = thermometreColor(stats.revenuTotal, objectif);
  const manque = Math.max(0, objectif - stats.revenuTotal);
  const ventesNecessaires = Math.ceil(manque / prixSite);

  const todayTs = Date.now();
  const aAppelerCount = prospects.filter((p) => {
    if (p.archived) return false;
    if (p.statut === "A_APPELER") return true;
    if (p.statut === "REPONDEUR") {
      if (p.date_relance) {
        return new Date(p.date_relance + "T00:00:00").getTime() <= todayTs;
      }
      return true;
    }
    return false;
  }).length;
  const restantAppels = Math.max(0, dailyTarget - stats.appelsDuJour);
  const dailyPct = Math.min(100, Math.round((stats.appelsDuJour / dailyTarget) * 100));

  // Cette semaine
  const weekStart = useMemo(() => startOfWeek(), []);
  const callsSemaine = useMemo(
    () => calls.filter((c) => new Date(c.date) >= weekStart && c.compte_mission),
    [calls, weekStart]
  );
  const rdvSemaine = useMemo(
    () => calls.filter((c) => new Date(c.date) >= weekStart && c.resultat === "RDV").length,
    [calls, weekStart]
  );
  const revenusSemaine = useMemo(
    () => revenus.filter((r) => new Date(r.date_signature) >= weekStart),
    [revenus, weekStart]
  );
  const eurosSemaine = revenusSemaine.reduce((s, r) => s + Number(r.montant || 0), 0);

  // Prochains RDV
  const today = new Date().toISOString().slice(0, 10);
  const prochainsRdv = useMemo(
    () =>
      prospects
        .filter((p) => p.date_rdv && p.date_rdv >= today && !p.archived)
        .sort((a, b) => (a.date_rdv! < b.date_rdv! ? -1 : 1))
        .slice(0, 5),
    [prospects, today]
  );

  if (!loaded && loading) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-[var(--text-tertiary)]">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-[13px]">Chargement…</span>
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 pb-6 space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--text-tertiary)]">
            DopaTask Mobile
          </p>
          <h1 className="text-[22px] font-bold tracking-tight text-[var(--text-primary)] leading-tight">
            CRM
          </h1>
        </div>
        {streak > 0 && (
          <div
            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{
              background: "var(--accent-orange-light)",
              color: "var(--accent-orange)",
            }}
          >
            <Flame size={12} />
            {streak}j
          </div>
        )}
      </div>

      {/* ── Challenge compact ── */}
      <div
        className="rounded-2xl p-4 relative overflow-hidden"
        style={{
          background: "var(--accent-red-light)",
          border: "1px solid color-mix(in srgb, var(--accent-red) 25%, transparent)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Skull size={13} style={{ color: "var(--accent-red)" }} />
          <span
            className="text-[9px] font-bold tracking-[0.16em] uppercase"
            style={{ color: "var(--accent-red)" }}
          >
            Challenge
          </span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[36px] font-extrabold leading-none tabular-nums" style={{ color: "var(--accent-red)" }}>
              {joursOuvres}
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">jours ouvrés restants</p>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1 text-[11px]">
              <span className="text-[var(--text-secondary)] font-semibold tabular-nums">
                {stats.revenuTotal.toLocaleString("fr-FR")} €
              </span>
              <span className="font-bold tabular-nums" style={{ color: thermoColor }}>
                {pct}%
              </span>
            </div>
            <div
              className="relative h-[5px] rounded-full overflow-hidden"
              style={{ background: "color-mix(in srgb, var(--accent-red) 12%, transparent)" }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                style={{ background: thermoColor, width: `${pct}%` }}
              />
            </div>
            {manque > 0 && (
              <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                Reste{" "}
                <span className="font-semibold text-[var(--text-secondary)]">
                  {manque.toLocaleString("fr-FR")} €
                </span>{" "}
                · {ventesNecessaires} vente{ventesNecessaires > 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Focus du jour ── */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--border-primary)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-[var(--accent-blue)]" />
            <h2 className="text-[13px] font-bold tracking-tight">Focus du jour</h2>
          </div>
        </div>

        {/* Daily progress — big ring style */}
        <div className="flex items-center gap-4 mb-4">
          {/* Circular progress */}
          <div className="relative w-[72px] h-[72px] shrink-0">
            <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
              <circle
                cx="36"
                cy="36"
                r="30"
                fill="none"
                stroke="var(--surface-2)"
                strokeWidth="6"
              />
              <circle
                cx="36"
                cy="36"
                r="30"
                fill="none"
                stroke={stats.appelsDuJour >= dailyTarget ? "var(--accent-green)" : "var(--accent-blue)"}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(dailyPct / 100) * 188.5} 188.5`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[18px] font-extrabold tabular-nums text-[var(--text-primary)]">
                {stats.appelsDuJour}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-[12px] font-semibold text-[var(--text-primary)]">
              {restantAppels > 0
                ? `Encore ${restantAppels} appel${restantAppels > 1 ? "s" : ""}`
                : "Mission accomplie 🎉"}
            </p>
            <p className="text-[10.5px] text-[var(--text-tertiary)]">
              Objectif : {dailyTarget} / jour
            </p>
          </div>
        </div>

        {/* Mini stats row */}
        <div className="grid grid-cols-2 gap-2">
          <MiniCard
            icon={<Users size={13} />}
            label="En stock"
            value={aAppelerCount}
            accent="purple"
          />
          <MiniCard
            icon={<Target size={13} />}
            label="RDV ce mois"
            value={stats.rdvObtenus}
            accent="blue"
          />
        </div>
      </div>

      {/* ── CTA — Lancer appels ── */}
      <Link
        href="/m/crm/session"
        className="flex items-center justify-between p-4 rounded-2xl group transition-all active:scale-[0.98]"
        style={{
          background: restantAppels > 0 ? "var(--accent-blue-light)" : "var(--accent-green-light)",
          border: `1px solid color-mix(in srgb, var(--accent-${restantAppels > 0 ? "blue" : "green"}) 25%, transparent)`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: `var(--accent-${restantAppels > 0 ? "blue" : "green"})`,
              color: "#fff",
            }}
          >
            <Phone size={18} strokeWidth={2.2} />
          </div>
          <div>
            <p
              className="text-[13px] font-bold leading-tight"
              style={{ color: `var(--accent-${restantAppels > 0 ? "blue" : "green"})` }}
            >
              Lancer la session cold-call
            </p>
            <p
              className="text-[11px] mt-0.5"
              style={{
                color: `color-mix(in srgb, var(--accent-${restantAppels > 0 ? "blue" : "green"}) 70%, var(--text-secondary))`,
              }}
            >
              Mode Focus (Optimisé Mobile)
            </p>
          </div>
        </div>
        <ArrowRight
          size={16}
          className="transition-transform group-hover:translate-x-1"
          style={{ color: `var(--accent-${restantAppels > 0 ? "blue" : "green"})` }}
        />
      </Link>

      {/* ── Cette semaine ── */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--border-primary)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={14} className="text-[var(--accent-purple)]" />
            <h2 className="text-[13px] font-bold tracking-tight">Cette semaine</h2>
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)]">
            depuis {weekStart.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <WeekStat icon={<Phone size={12} />} label="Appels" value={callsSemaine.length} accent="blue" />
          <WeekStat icon={<Calendar size={12} />} label="RDV" value={rdvSemaine} accent="purple" />
          <WeekStat icon={<Trophy size={12} />} label="Ventes" value={revenusSemaine.length} accent="green" />
          <WeekStat
            icon={<Banknote size={12} />}
            label="CA"
            value={`${eurosSemaine > 0 ? eurosSemaine.toLocaleString("fr-FR") : "0"}`}
            suffix="€"
            accent="cyan"
          />
        </div>
      </div>

      {/* ── Prochains RDV ── */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--border-primary)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-[var(--accent-blue)]" />
            <h2 className="text-[13px] font-bold tracking-tight">Prochains RDV</h2>
          </div>
          <span className="text-[10px] tabular-nums text-[var(--text-tertiary)]">
            {prochainsRdv.length}
          </span>
        </div>
        {prochainsRdv.length === 0 ? (
          <p className="text-[12px] text-[var(--text-tertiary)] italic py-3">
            Aucun RDV. Décroche, propose, book.
          </p>
        ) : (
          <ul className="space-y-1">
            {prochainsRdv.map((p) => {
              const d = new Date(p.date_rdv!);
              const days = Math.floor(
                (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              const dayLabel =
                days === 0 ? "Aujourd'hui" : days === 1 ? "Demain" : `Dans ${days}j`;
              return (
                <li key={p.id}>
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-[var(--surface-2)] active:bg-[var(--surface-3)] transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-semibold text-[var(--text-primary)] truncate leading-tight">
                        {p.entreprise}
                      </p>
                      <p className="text-[10px] text-[var(--accent-blue)] tabular-nums font-medium mt-0.5">
                        {dayLabel} ·{" "}
                        {d.toLocaleDateString("fr-FR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                    {p.telephone && (
                      <a
                        href={`tel:${p.telephone}`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: "var(--accent-green-light)",
                          color: "var(--accent-green)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone size={14} />
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Quick link to prospects ── */}
      <Link
        href="/m/prospects"
        className="flex items-center justify-between p-4 rounded-2xl active:scale-[0.98] transition-all"
        style={{
          background: "var(--surface-1)",
          border: "1px solid var(--border-primary)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "var(--accent-purple-light)",
              color: "var(--accent-purple)",
            }}
          >
            <Users size={16} />
          </div>
          <div>
            <p className="text-[13px] font-bold text-[var(--text-primary)]">
              Voir tous les prospects
            </p>
            <p className="text-[10.5px] text-[var(--text-tertiary)]">
              {prospects.filter((p) => !p.archived).length} actifs
            </p>
          </div>
        </div>
        <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
      </Link>
    </div>
  );
}

/* ── Sub-components ── */
function MiniCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent: "blue" | "green" | "purple" | "orange" | "red" | "cyan";
}) {
  const color = `var(--accent-${accent})`;
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border-primary)",
      }}
    >
      <div className="flex items-center gap-1.5 mb-1.5" style={{ color }}>
        {icon}
        <span className="text-[9px] font-bold tracking-[0.1em] uppercase">{label}</span>
      </div>
      <p className="text-[20px] font-extrabold tabular-nums leading-none text-[var(--text-primary)]">
        {value}
      </p>
    </div>
  );
}

function WeekStat({
  icon,
  label,
  value,
  suffix,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  suffix?: string;
  accent: "green" | "orange" | "purple" | "cyan" | "blue" | "red";
}) {
  const color = `var(--accent-${accent})`;
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-1" style={{ color }}>
        {icon}
      </div>
      <p className="text-[16px] font-extrabold tabular-nums leading-none text-[var(--text-primary)]">
        {value}
        {suffix && (
          <span className="text-[9px] text-[var(--text-tertiary)] font-medium ml-0.5">
            {suffix}
          </span>
        )}
      </p>
      <p className="text-[8px] font-semibold tracking-[0.08em] uppercase text-[var(--text-tertiary)] mt-0.5">
        {label}
      </p>
    </div>
  );
}
