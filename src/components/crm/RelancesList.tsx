"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft, Phone, AlertTriangle, Clock, CalendarClock,
  ChevronRight, Loader2, Flame,
} from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";
import type { Prospect } from "@/lib/crmTypes";
import StatutBadge from "./StatutBadge";

// ─── Helpers dates ─────────────────────────────────────────────
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function inDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatRelance(iso: string): string {
  const d = new Date(iso);
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - t.getTime()) / 86400000);
  if (diff < 0) return `en retard de ${Math.abs(diff)}j`;
  if (diff === 0) return "aujourd'hui";
  if (diff === 1) return "demain";
  if (diff <= 7) return `dans ${diff}j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ─── Composant ────────────────────────────────────────────────
export default function RelancesList() {
  const loaded = useCrmStore((s) => s.loaded);
  const loading = useCrmStore((s) => s.loading);
  const prospects = useCrmStore((s) => s.prospects);
  const loadAll = useCrmStore((s) => s.loadAll);

  useEffect(() => {
    if (!loaded) loadAll();
  }, [loaded, loadAll]);

  const { retard, aujourdhui, semaine, plusTard, total } = useMemo(() => {
    const today = todayISO();
    const weekEnd = inDaysISO(7);
    const actifs = prospects.filter((p) => !p.archived && p.date_relance);

    const retard: Prospect[] = [];
    const aujourdhui: Prospect[] = [];
    const semaine: Prospect[] = [];
    const plusTard: Prospect[] = [];

    for (const p of actifs) {
      const dr = p.date_relance!;
      if (dr < today) retard.push(p);
      else if (dr === today) aujourdhui.push(p);
      else if (dr <= weekEnd) semaine.push(p);
      else plusTard.push(p);
    }

    const byDate = (a: Prospect, b: Prospect) => (a.date_relance! < b.date_relance! ? -1 : 1);
    retard.sort(byDate);
    aujourdhui.sort(byDate);
    semaine.sort(byDate);
    plusTard.sort(byDate);

    return {
      retard, aujourdhui, semaine, plusTard,
      total: retard.length + aujourdhui.length + semaine.length + plusTard.length,
    };
  }, [prospects]);

  if (!loaded && loading) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--text-tertiary)] gap-2">
        <Loader2 size={16} className="animate-spin" />
        <span>Chargement des relances...</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1100px] mx-auto px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/crm"
            className="p-2 hover:bg-[var(--surface-2)] rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1">
            <h1 className="text-[26px] font-bold tracking-tight flex items-center gap-2">
              <CalendarClock size={22} className="text-dopa-cyan" />
              Relances
            </h1>
            <p className="text-[12.5px] text-t-tertiary mt-1">
              {total === 0
                ? "Aucune relance planifiée. Pose une date_relance sur tes prospects chauds."
                : `${total} prospect(s) à rappeler · ${retard.length} en retard · ${aujourdhui.length} aujourd'hui`}
            </p>
          </div>
        </div>

        {/* Sections */}
        {retard.length > 0 && (
          <Section
            title="En retard"
            count={retard.length}
            icon={<AlertTriangle size={15} />}
            color="#ef4444"
            urgent
            list={retard}
          />
        )}

        <Section
          title="Aujourd'hui"
          count={aujourdhui.length}
          icon={<Flame size={15} />}
          color="#f97316"
          list={aujourdhui}
          emptyText="Rien de prévu aujourd'hui."
        />

        <Section
          title="Cette semaine"
          count={semaine.length}
          icon={<Clock size={15} />}
          color="#22d3ee"
          list={semaine}
          emptyText="Rien pour les 7 prochains jours."
        />

        {plusTard.length > 0 && (
          <Section
            title="Plus tard"
            count={plusTard.length}
            icon={<CalendarClock size={15} />}
            color="#64748b"
            list={plusTard}
            collapseByDefault
          />
        )}

        {total === 0 && (
          <div className="rounded-2xl border border-dashed border-surface-3 bg-surface-1/50 p-10 text-center">
            <div className="text-[42px] mb-3">📅</div>
            <p className="text-[14px] font-semibold mb-1">Aucune relance planifiée</p>
            <p className="text-[12.5px] text-t-tertiary">
              Ouvre un prospect → pose une date_relance (J+3, J+7, lundi).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section ────────────────────────────────────────────────
function Section({
  title, count, icon, color, list, urgent, emptyText, collapseByDefault,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  list: Prospect[];
  urgent?: boolean;
  emptyText?: string;
  collapseByDefault?: boolean;
}) {
  if (count === 0 && !emptyText) return null;

  return (
    <div
      className={`rounded-2xl border bg-surface-1 p-5 ${urgent ? "ring-1 ring-dopa-red/30" : ""}`}
      style={{ borderColor: `${color}40` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2" style={{ color }}>
          {icon}
          <h2 className="text-[14px] font-semibold tracking-tight">
            {title}
            <span className="ml-2 text-[11.5px] tabular-nums text-t-tertiary font-normal">
              {count}
            </span>
          </h2>
        </div>
      </div>

      {count === 0 ? (
        <p className="text-[12.5px] text-t-tertiary italic py-2">{emptyText}</p>
      ) : collapseByDefault && count > 10 ? (
        <details>
          <summary className="text-[12px] text-dopa-cyan cursor-pointer hover:underline mb-2">
            Afficher les {count} prospect(s)
          </summary>
          <RelanceItems list={list} />
        </details>
      ) : (
        <RelanceItems list={list} />
      )}
    </div>
  );
}

function RelanceItems({ list }: { list: Prospect[] }) {
  return (
    <ul className="divide-y divide-surface-3">
      {list.map((p) => (
        <li key={p.id}>
          <Link
            href={`/prospects/${p.id}`}
            className="flex items-center justify-between gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-surface-2 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-t-primary truncate">
                {p.entreprise}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-t-tertiary">
                <span className="tabular-nums font-semibold" style={{ color: isOverdue(p.date_relance) ? "#ef4444" : undefined }}>
                  {formatRelance(p.date_relance!)}
                </span>
                {p.telephone && (
                  <>
                    <span className="text-t-tertiary/50">·</span>
                    <span className="tabular-nums">{p.telephone}</span>
                  </>
                )}
              </div>
            </div>
            <StatutBadge statut={p.statut} compact />
            {p.telephone && (
              <a
                href={`tel:${p.telephone}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center w-8 h-8 bg-[var(--accent-green-light)] text-[var(--accent-green)] rounded-lg hover:bg-[var(--surface-2)]"
                title="Appeler"
              >
                <Phone size={13} />
              </a>
            )}
            <ChevronRight size={13} className="text-t-tertiary group-hover:text-t-primary" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function isOverdue(iso: string | null): boolean {
  if (!iso) return false;
  return iso < todayISO();
}
