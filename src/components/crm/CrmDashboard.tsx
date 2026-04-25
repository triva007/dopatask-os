"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Phone, Target, ListChecks, FolderKanban, Inbox,
  AlertTriangle, Loader2, ArrowRight,
} from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";
import { useAppStore } from "@/store/useAppStore";
import { computeStatsMois, thermometreColor } from "@/lib/crmLogic";

/* ───────────────────── Utils ───────────────────── */
// Jours ouvrés RESTANTS jusqu'à target, sans compter aujourd'hui (on commence demain).
function businessDaysUntil(target: Date, from: Date = new Date()): number {
  let count = 0;
  const cur = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  cur.setDate(cur.getDate() + 1); // exclure aujourd'hui
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  while (cur < end) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/* ───────────────────── Dashboard ───────────────────── */
export default function CrmDashboard() {
  // CRM store
  const loaded = useCrmStore((s) => s.loaded);
  const loading = useCrmStore((s) => s.loading);
  const error = useCrmStore((s) => s.error);
  const calls = useCrmStore((s) => s.calls);
  const revenus = useCrmStore((s) => s.revenus);
  const config = useCrmStore((s) => s.config);
  const prospects = useCrmStore((s) => s.prospects);
  const loadAll = useCrmStore((s) => s.loadAll);

  // App store (tâches, inbox, objectifs, projets)
  const tasks = useAppStore((s) => s.tasks);
  const inboxItems = useAppStore((s) => s.inboxItems);
  const objectives = useAppStore((s) => s.objectives);
  const projects = useAppStore((s) => s.projects);

  useEffect(() => {
    if (!loaded) loadAll();
  }, [loaded, loadAll]);

  // Tick interne (force un re-render toutes les 15s pour recalculer les stats
  // qui dépendent de Date.now() — ex: doneToday quand on passe minuit)
  const [, setTick] = useState(0);

  // Auto-refresh :
  // - CRM store rechargé depuis Supabase toutes les 15s + au retour de tab
  // - useAppStore (persist localStorage) re-hydraté si modifié dans un autre onglet
  // - tick forcé pour re-render même sans nouvelle donnée
  useEffect(() => {
    const refreshAll = () => {
      if (document.visibilityState !== "visible") return;
      loadAll();
      // Re-hydrate le store zustand persist (au cas où un autre onglet a écrit)
      try {
        // @ts-expect-error zustand persist API
        if (useAppStore.persist?.rehydrate) useAppStore.persist.rehydrate();
      } catch {}
      setTick((t) => t + 1);
    };
    const id = window.setInterval(refreshAll, 15000);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "dopatask-storage") {
        try {
          // @ts-expect-error zustand persist API
          if (useAppStore.persist?.rehydrate) useAppStore.persist.rehydrate();
        } catch {}
        setTick((t) => t + 1);
      }
    };
    document.addEventListener("visibilitychange", refreshAll);
    window.addEventListener("focus", refreshAll);
    window.addEventListener("storage", onStorage);
    // Refresh au montage
    refreshAll();
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refreshAll);
      window.removeEventListener("focus", refreshAll);
      window.removeEventListener("storage", onStorage);
    };
  }, [loadAll]);

  const stats = useMemo(() => computeStatsMois(calls, revenus), [calls, revenus]);

  const objectif = config?.objectif_mensuel ?? 3000;
  const deadlineStr = config?.deadline_date ?? "2026-06-01";
  const deadline = useMemo(() => new Date(deadlineStr + "T00:00:00"), [deadlineStr]);

  const joursOuvres = useMemo(() => businessDaysUntil(deadline), [deadline]);
  const pct = Math.min(100, Math.round((stats.revenuTotal / objectif) * 100));
  const thermoColor = thermometreColor(stats.revenuTotal, objectif);
  // Compteurs visu globale — alignés sur la vue /taches qui affiche todo + in_progress
  const pendingTasks = tasks.filter((t) => ["todo", "in_progress"].includes(t.status)).length;
  const doneToday = tasks.filter(
    (t) =>
      (t.status === "done" || t.status === "completed") &&
      t.completedAt &&
      new Date(t.completedAt).toDateString() === new Date().toDateString()
  ).length;
  const inboxCount = inboxItems.filter((i) => !i.processed).length;
  const activeGoals = objectives.filter((o) => (o.progress ?? 0) < 1).length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const prospectsToCall = prospects.filter(
    (p) => !p.archived && (p.statut === "A_APPELER" || p.statut === "REPONDEUR")
  ).length;

  if (!loaded && loading) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--text-tertiary)] gap-2">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-[13px]">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1600px] mx-auto px-10 py-10 space-y-8">

        {error && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[12.5px]"
            style={{ background: "var(--accent-red-light)", color: "var(--accent-red)", border: "1px solid color-mix(in srgb, var(--accent-red) 25%, transparent)" }}>
            <AlertTriangle size={13} />
            {error}
          </div>
        )}

        {/* ═══ HEADER + progression sobre ═══ */}
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-2">
              Aaron-OS
            </p>
            <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight leading-none">
              Vue d&apos;ensemble
            </h1>
          </div>

          {/* Mini-bandeau objectif : just la barre + chiffres essentiels */}
          <div className="min-w-[280px] flex-1 max-w-[480px]">
            <div className="flex items-center justify-between text-[11.5px] mb-1.5">
              <span className="text-[var(--text-secondary)] font-semibold tabular-nums">
                {stats.revenuTotal.toLocaleString("fr-FR")} €
                <span className="text-[var(--text-tertiary)] font-normal"> / {objectif.toLocaleString("fr-FR")} €</span>
              </span>
              <span className="font-semibold tabular-nums" style={{ color: thermoColor }}>
                {pct}% · {joursOuvres}j
              </span>
            </div>
            <div className="relative h-[4px] rounded-full overflow-hidden"
              style={{ background: "var(--surface-2)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: thermoColor }}
              />
            </div>
          </div>
        </div>

        {/* ═══ CTA CRM unique ═══ */}
        <Link
          href="/crm"
          className="group flex items-center justify-between p-5 rounded-xl transition-all"
          style={{
            background: "var(--accent-blue-light)",
            border: "1px solid color-mix(in srgb, var(--accent-blue) 25%, transparent)",
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--accent-blue)", color: "#fff" }}>
              <Phone size={18} strokeWidth={2} />
            </div>
            <div>
              <p className="text-[15px] font-semibold leading-tight" style={{ color: "var(--accent-blue)" }}>
                {prospectsToCall > 0
                  ? `${prospectsToCall} prospect${prospectsToCall > 1 ? "s" : ""} à appeler maintenant`
                  : "Ouvrir le CRM"}
              </p>
              <p className="text-[12.5px] mt-0.5" style={{ color: "color-mix(in srgb, var(--accent-blue) 80%, var(--text-secondary))" }}>
                Pipeline · rituel d&apos;appels · fiches prospects
              </p>
            </div>
          </div>
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-1"
            style={{ color: "var(--accent-blue)" }} />
        </Link>

        {/* ═══ VISU GLOBALE — KPI grid ═══ */}
        <div className="grid grid-cols-4 gap-3">
          <MiniStat href="/taches" icon={<ListChecks size={14} />} label="À faire"
            value={pendingTasks} sub={`${doneToday} faites`} accent="green" />
          <MiniStat href="/inbox" icon={<Inbox size={14} />} label="Inbox"
            value={inboxCount} sub="à traiter" accent="orange" />
          <MiniStat href="/objectifs" icon={<Target size={14} />} label="Objectifs"
            value={activeGoals} sub="en cours" accent="purple" />
          <MiniStat href="/projets" icon={<FolderKanban size={14} />} label="Projets"
            value={activeProjects} sub="actifs" accent="cyan" />
        </div>

      </div>
    </div>
  );
}

/* ───────────────────── Sub-components ───────────────────── */
function MiniStat({
  href, icon, label, value, sub, accent,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub: string;
  accent: "green" | "orange" | "purple" | "cyan" | "blue" | "red";
}) {
  const color = `var(--accent-${accent})`;
  const colorLight = `var(--accent-${accent}-light)`;

  const body = (
    <div className="p-4 rounded-lg transition-colors h-full"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border-primary)",
      }}>
      <div className="flex items-center gap-1.5 mb-2.5" style={{ color }}>
        <div className="w-5 h-5 rounded-md flex items-center justify-center"
          style={{ background: colorLight }}>
          {icon}
        </div>
        <p className="text-[10px] font-semibold tracking-[0.12em] uppercase">{label}</p>
      </div>
      <p className="text-[22px] font-bold tabular-nums leading-none text-[var(--text-primary)]">
        {value}
      </p>
      <p className="text-[11px] text-[var(--text-tertiary)] mt-1.5">{sub}</p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        <div className="h-full transition-all group-hover:translate-y-[-1px]">{body}</div>
      </Link>
    );
  }
  return body;
}
