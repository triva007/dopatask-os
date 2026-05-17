"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ListChecks,
  Phone,
  Calendar,
  Trophy,
  Banknote,
  Loader2,
  CheckCircle2,
  Circle,
  Clock,
  ChevronRight,
  Skull,
  Zap,
  RotateCw,
} from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";
import { computeStatsMois, thermometreColor } from "@/lib/crmLogic";
import { getActiveProfileId } from "@/lib/supabaseStorage";
import { CALENDAR_CENSOR_REGEX } from "@/lib/constants";

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

function formatRelative(d: Date): string {
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 0) return "en cours";
  if (diffMin < 60) return "dans " + diffMin + " min";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOnly = new Date(d);
  dayOnly.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dayOnly.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0)
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1)
    return "demain " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

interface GEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

/* ───────────────────── Dashboard ───────────────────── */
export default function MobileDashboard() {
  const calls = useCrmStore((s) => s.calls);
  const revenus = useCrmStore((s) => s.revenus);
  const config = useCrmStore((s) => s.config);
  const prospects = useCrmStore((s) => s.prospects);
  const crmLoaded = useCrmStore((s) => s.loaded);
  const loadCrm = useCrmStore((s) => s.loadAll);

  const [googleTasks, setGoogleTasks] = useState<any[]>([]);
  const [googleLists, setGoogleLists] = useState<any[]>([]);
  const [calEvents, setCalEvents] = useState<GEvent[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    if (!crmLoaded) loadCrm();
  }, [crmLoaded, loadCrm]);

  // Fetch Google Tasks + Calendar events
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [tRes, eRes] = await Promise.all([
          fetch("/api/google/tasks").catch(() => null),
          fetch(
            "/api/google/calendar/events?timeMin=" +
              encodeURIComponent(new Date().toISOString())
          ).catch(() => null),
        ]);
        if (tRes?.ok) {
          const d = await tRes.json();
          setGoogleTasks(d.tasks || []);
          setGoogleLists(d.lists || []);
        }
        if (eRes?.ok) {
          const d = await eRes.json();
          const upcoming = (d.events || [])
            .filter((e: GEvent) => {
              const sum = e.summary || "";
              if (CALENDAR_CENSOR_REGEX.test(sum)) return false;
              const iso = e.start?.dateTime || e.start?.date;
              if (!iso) return false;
              return new Date(iso).getTime() >= Date.now() - 3600000;
            })
            .slice(0, 6);
          setCalEvents(upcoming);
        }
      } catch {}
      setLoadingTasks(false);
    };
    fetchAll();
    const id = setInterval(fetchAll, 60000);
    return () => clearInterval(id);
  }, []);

  // CRM stats
  const stats = useMemo(() => computeStatsMois(calls, revenus), [calls, revenus]);
  const objectif = config?.objectif_mensuel ?? 3000;
  const deadlineStr = config?.deadline_date ?? "2026-06-01";
  const deadline = useMemo(() => new Date(deadlineStr + "T00:00:00"), [deadlineStr]);
  const prixSite = config?.prix_site ?? 980;
  const joursOuvres = useMemo(() => businessDaysUntil(deadline), [deadline]);
  const pct = Math.min(100, Math.round((stats.revenuTotal / objectif) * 100));
  const thermoColor = thermometreColor(stats.revenuTotal, objectif);
  const manque = Math.max(0, objectif - stats.revenuTotal);
  const ventesNecessaires = Math.ceil(manque / prixSite);
  const activeProfileId = getActiveProfileId();

  // Kill la task now
  const killList = googleLists.find(
    (l: any) => l.title?.toLowerCase() === "kill la task now"
  );
  const killTasks = killList
    ? googleTasks.filter(
        (t: any) => t.listId === killList.id && t.status !== "completed"
      )
    : [];

  // Completed today
  const todayStr = new Date().toISOString().slice(0, 10);
  const completedToday = killList
    ? googleTasks.filter(
        (t: any) =>
          t.listId === killList.id &&
          t.status === "completed" &&
          t.updated &&
          new Date(t.updated).toISOString().slice(0, 10) === todayStr
      ).length
    : 0;
  const progressTotal = killTasks.length + completedToday;
  const progressPct =
    progressTotal === 0 ? 0 : Math.round((completedToday / progressTotal) * 100);

  // Prochains RDV CRM
  const today = new Date().toISOString().slice(0, 10);
  const prochainsRdv = useMemo(
    () =>
      prospects
        .filter((p) => p.date_rdv && p.date_rdv >= today && !p.archived)
        .sort((a, b) => (a.date_rdv! < b.date_rdv! ? -1 : 1))
        .slice(0, 3),
    [prospects, today]
  );

  if (loadingTasks && !crmLoaded) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-[var(--text-tertiary)]">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-[13px]">Chargement…</span>
      </div>
    );
  }

  return (
    <div className="px-4 pt-3 pb-6 space-y-4">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--text-tertiary)]">
          DopaTask Mobile
        </p>
        <h1 className="text-[22px] font-bold tracking-tight text-[var(--text-primary)] leading-tight">
          Tableau de bord
        </h1>
      </div>

      {/* Challenge compact */}
      {activeProfileId === 1 && (
        <div
          className="rounded-2xl p-4"
          style={{
            background: "var(--accent-red-light)",
            border: "1px solid color-mix(in srgb, var(--accent-red) 25%, transparent)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Skull size={12} style={{ color: "var(--accent-red)" }} />
            <span className="text-[9px] font-bold tracking-[0.14em] uppercase" style={{ color: "var(--accent-red)" }}>
              Challenge
            </span>
          </div>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[32px] font-extrabold leading-none tabular-nums" style={{ color: "var(--accent-red)" }}>
                {joursOuvres}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">jours restants</p>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-[var(--text-secondary)] font-semibold tabular-nums">
                  {stats.revenuTotal.toLocaleString("fr-FR")} €
                </span>
                <span className="font-bold tabular-nums" style={{ color: thermoColor }}>{pct}%</span>
              </div>
              <div className="h-[4px] rounded-full overflow-hidden" style={{ background: "color-mix(in srgb, var(--accent-red) 12%, transparent)" }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ background: thermoColor, width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Calendar Events */}
      {calEvents.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border-primary)" }}
        >
          <div className="flex items-center gap-1.5 mb-3">
            <Clock size={13} className="text-[var(--accent-blue)]" />
            <h2 className="text-[12px] font-bold tracking-tight">Prochains événements</h2>
          </div>
          <div className="space-y-1.5">
            {calEvents.slice(0, 4).map((e) => {
              const iso = e.start?.dateTime || e.start?.date;
              if (!iso) return null;
              const start = new Date(e.start?.dateTime ? iso : iso + "T00:00:00");
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[var(--surface-2)]"
                >
                  <div
                    className="w-1 h-8 rounded-full shrink-0"
                    style={{ background: "var(--accent-blue)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">
                      {e.summary || "(sans titre)"}
                    </p>
                    <p className="text-[10px] text-[var(--accent-blue)] font-medium mt-0.5">
                      {formatRelative(start)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kill la task NOW */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border-primary)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Zap size={13} className="text-[var(--accent-purple)]" />
            <h2 className="text-[12px] font-bold tracking-tight">Kill la task NOW</h2>
          </div>
          {progressTotal > 0 && (
            <span className="text-[10px] font-bold tabular-nums" style={{ color: progressPct === 100 ? "var(--accent-green)" : "var(--text-tertiary)" }}>
              {completedToday}/{progressTotal}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {progressTotal > 0 && (
          <div className="h-[3px] rounded-full overflow-hidden mb-3" style={{ background: "var(--surface-3)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: progressPct === 100 ? "var(--accent-green)" : "var(--accent-purple)",
              }}
            />
          </div>
        )}

        {killTasks.length === 0 ? (
          <div className="flex flex-col items-center py-4 text-[var(--text-tertiary)]">
            <CheckCircle2 size={28} className="mb-2 opacity-40 text-[var(--accent-green)]" />
            <p className="text-[12px]">Tout est clair !</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {killTasks.slice(0, 8).map((t: any) => (
              <li key={t.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[var(--surface-2)]">
                <Circle size={14} className="text-[var(--text-tertiary)] shrink-0" />
                <p className="text-[12px] font-medium text-[var(--text-primary)] truncate flex-1">
                  {t.title}
                </p>
              </li>
            ))}
            {killTasks.length > 8 && (
              <p className="text-center text-[10px] text-[var(--text-tertiary)] pt-1">
                + {killTasks.length - 8} autres
              </p>
            )}
          </ul>
        )}
      </div>

      {/* CRM mini recap */}
      <div className="grid grid-cols-2 gap-2">
        <MiniStat icon={<Phone size={12} />} label="À appeler" value={prospects.filter(p => !p.archived && (p.statut === "A_APPELER" || p.statut === "REPONDEUR")).length} accent="orange" />
        <MiniStat icon={<Calendar size={12} />} label="RDV" value={prospects.filter(p => !p.archived && ["RDV_BOOKE","MAQUETTE_PRETE","R1_EFFECTUE"].includes(p.statut)).length} accent="blue" />
        <MiniStat icon={<Trophy size={12} />} label="Vendus" value={prospects.filter(p => p.statut === "VENDU").length} accent="green" />
        <MiniStat icon={<Banknote size={12} />} label="Revenu" value={`${stats.revenuTotal.toLocaleString("fr-FR")} €`} accent="cyan" />
      </div>

      {/* Quick links */}
      <div className="space-y-2">
        <QuickLink href="/m/taches" icon={<ListChecks size={16} />} label="Toutes les tâches" sub={`${killTasks.length} en cours`} accent="purple" />
        <QuickLink href="/m/calendrier" icon={<Calendar size={16} />} label="Calendrier" sub="Voir l'agenda" accent="blue" />
        <QuickLink href="/m/crm" icon={<Phone size={16} />} label="CRM" sub="Cold calls & prospects" accent="orange" />
      </div>
    </div>
  );
}

/* ── Sub-components ── */
function MiniStat({ icon, label, value, accent }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  accent: "blue" | "green" | "purple" | "orange" | "cyan" | "red";
}) {
  const color = `var(--accent-${accent})`;
  return (
    <div className="rounded-xl p-3" style={{ background: "var(--surface-1)", border: "1px solid var(--border-primary)" }}>
      <div className="flex items-center gap-1.5 mb-1" style={{ color }}>
        {icon}
        <span className="text-[9px] font-bold tracking-[0.1em] uppercase">{label}</span>
      </div>
      <p className="text-[18px] font-extrabold tabular-nums leading-none text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function QuickLink({ href, icon, label, sub, accent }: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
  accent: "blue" | "green" | "purple" | "orange" | "cyan";
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-3.5 rounded-2xl active:scale-[0.98] transition-all"
      style={{ background: "var(--surface-1)", border: "1px solid var(--border-primary)" }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `var(--accent-${accent}-light)`, color: `var(--accent-${accent})` }}>
          {icon}
        </div>
        <div>
          <p className="text-[13px] font-bold text-[var(--text-primary)]">{label}</p>
          <p className="text-[10.5px] text-[var(--text-tertiary)]">{sub}</p>
        </div>
      </div>
      <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
    </Link>
  );
}
