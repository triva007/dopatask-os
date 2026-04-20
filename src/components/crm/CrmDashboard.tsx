"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Phone, Target, CheckCircle2, ListChecks, FolderKanban, Inbox,
  Skull, AlertTriangle, Loader2, ArrowRight, Flame, Banknote,
} from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";
import { useAppStore } from "@/store/useAppStore";
import { computeStatsMois, thermometreColor } from "@/lib/crmLogic";

/* ───────────────────── Utils ───────────────────── */
function businessDaysUntil(target: Date, from: Date = new Date()): number {
  let count = 0;
  const cur = new Date(from.getFullYear(), from.getMonth(), from.getDate());
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

  const stats = useMemo(() => computeStatsMois(calls, revenus), [calls, revenus]);

  const objectif = config?.objectif_mensuel ?? 3000;
  const deadlineStr = config?.deadline_date ?? "2026-06-01";
  const deadline = useMemo(() => new Date(deadlineStr + "T00:00:00"), [deadlineStr]);

  const joursOuvres = useMemo(() => businessDaysUntil(deadline), [deadline]);
  const pct = Math.min(100, Math.round((stats.revenuTotal / objectif) * 100));
  const thermoColor = thermometreColor(stats.revenuTotal, objectif);
  const manque = Math.max(0, objectif - stats.revenuTotal);

  // Compteurs visu globale
  const todayTasks = tasks.filter((t) => t.status === "today").length;
  const pendingTasks = tasks.filter((t) => ["todo", "in_progress"].includes(t.status)).length;
  const doneToday = tasks.filter(
    (t) =>
      t.status === "done" &&
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
      <div className="max-w-[1100px] mx-auto px-10 py-12 space-y-10">

        {error && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[12.5px]"
            style={{ background: "var(--accent-red-light)", color: "var(--accent-red)", border: "1px solid color-mix(in srgb, var(--accent-red) 25%, transparent)" }}>
            <AlertTriangle size={13} />
            {error}
          </div>
        )}

        {/* ═══ HEADER ═══ */}
        <div>
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[var(--text-tertiary)] mb-2">
            Aaron-OS
          </p>
          <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight leading-none">
            Vue d&apos;ensemble
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-2">
            Tout ce qui compte, en un écran.
          </p>
        </div>

        {/* ═══ CHALLENGE RASAGE — hero stakes ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--accent-red-light)",
            border: "1px solid color-mix(in srgb, var(--accent-red) 30%, transparent)",
          }}
        >
          <div className="grid grid-cols-[1fr_auto] gap-0">

            {/* ─ Left : stakes + counter ─ */}
            <div className="p-7 flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <Skull size={14} style={{ color: "var(--accent-red)" }} />
                <span className="text-[10px] font-semibold tracking-[0.18em] uppercase"
                  style={{ color: "var(--accent-red)" }}>
                  Challenge · enjeu personnel
                </span>
              </div>

              <h2 className="text-[26px] font-semibold leading-tight text-[var(--text-primary)]">
                Si le 1<sup className="text-[16px]">er</sup> juin je n&apos;ai pas fait{" "}
                <span style={{ color: "var(--accent-red)" }}>3 000 € / mois</span>,
                <br />
                je me rase la tête.
              </h2>

              {/* Compteur jours ouvrés */}
              <div className="flex items-end gap-5">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[var(--text-tertiary)] mb-1.5">
                    Jours ouvrés restants
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[56px] font-bold leading-none tabular-nums tracking-tight"
                      style={{ color: "var(--accent-red)" }}>
                      {joursOuvres}
                    </span>
                    <span className="text-[14px] font-medium text-[var(--text-secondary)]">
                      jours
                    </span>
                  </div>
                </div>
                <div className="pb-1.5">
                  <p className="text-[11px] text-[var(--text-tertiary)] leading-snug">
                    deadline · lundi 1<sup>er</sup> juin 2026
                    <br />
                    <span className="text-[var(--text-secondary)]">week-ends exclus</span>
                  </p>
                </div>
              </div>

              {/* Progress vers 3k */}
              <div>
                <div className="flex items-center justify-between mb-2 text-[12px]">
                  <span className="text-[var(--text-secondary)] font-medium tabular-nums">
                    {stats.revenuTotal.toLocaleString("fr-FR")} €{" "}
                    <span className="text-[var(--text-tertiary)] font-normal">/ {objectif.toLocaleString("fr-FR")} €</span>
                  </span>
                  <span className="font-semibold tabular-nums" style={{ color: thermoColor }}>
                    {pct}%
                  </span>
                </div>
                <div className="relative h-[5px] rounded-full overflow-hidden"
                  style={{ background: "color-mix(in srgb, var(--accent-red) 12%, transparent)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: thermoColor }}
                  />
                </div>
                {manque > 0 && (
                  <p className="mt-2 text-[11.5px] text-[var(--text-secondary)]">
                    Manque{" "}
                    <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                      {manque.toLocaleString("fr-FR")} €
                    </span>{" "}
                    · soit ~{joursOuvres > 0 ? Math.ceil(manque / joursOuvres).toLocaleString("fr-FR") : "—"} € / jour ouvré.
                  </p>
                )}
              </div>
            </div>

            {/* ─ Right : chauve photo ─ */}
            <div className="relative w-[280px] hidden md:block"
              style={{ background: "color-mix(in srgb, var(--accent-red) 8%, transparent)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://i.postimg.cc/PqtQLZDj/Whats-App-Image-2026-04-20-at-17-02-51.jpg"
                alt="Aaron chauve — motivation"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: "grayscale(0.05) contrast(1.02)" }}
              />
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(90deg, var(--accent-red-light) 0%, transparent 25%)" }} />
              <div className="absolute bottom-3 right-3 px-2 py-[3px] rounded-md text-[10px] font-semibold tracking-wide uppercase"
                style={{ background: "rgba(0,0,0,0.55)", color: "#fff", backdropFilter: "blur(4px)" }}>
                si t&apos;échoues
              </div>
            </div>
          </div>
        </motion.div>

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
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[var(--text-tertiary)] mb-4">
            Mouvement aujourd&apos;hui
          </p>
          <div className="grid grid-cols-4 gap-3">
            <MiniStat href="/taches" icon={<ListChecks size={14} />} label="À faire"
              value={todayTasks} sub={`${doneToday} faites`} accent="green" />
            <MiniStat href="/inbox" icon={<Inbox size={14} />} label="Inbox"
              value={inboxCount} sub="à traiter" accent="orange" />
            <MiniStat href="/objectifs" icon={<Target size={14} />} label="Objectifs"
              value={activeGoals} sub="en cours" accent="purple" />
            <MiniStat href="/projets" icon={<FolderKanban size={14} />} label="Projets"
              value={activeProjects} sub="actifs" accent="cyan" />
          </div>
        </div>

        {/* ═══ CRM — résumé chiffres clés ═══ */}
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[var(--text-tertiary)] mb-4">
            CRM · mois en cours
          </p>
          <div className="grid grid-cols-4 gap-3">
            <MiniStat icon={<Phone size={14} />} label="Appels" value={stats.appelsTotal} sub="ce mois" accent="orange" />
            <MiniStat icon={<Flame size={14} />} label="RDV" value={stats.rdvObtenus} sub="obtenus" accent="blue" />
            <MiniStat icon={<CheckCircle2 size={14} />} label="Vendus" value={stats.sitesVendus} sub="sites" accent="purple" />
            <MiniStat icon={<Banknote size={14} />} label="Revenu"
              value={`${stats.revenuTotal.toLocaleString("fr-FR")} €`} sub={`/ ${objectif.toLocaleString("fr-FR")} €`}
              accent="green" />
          </div>
        </div>

        {/* Tasks du jour en cours (si pending) */}
        {pendingTasks > 0 && (
          <div className="flex items-center justify-between px-4 py-3 rounded-lg"
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--border-primary)",
            }}>
            <div className="flex items-center gap-2 text-[12.5px] text-[var(--text-secondary)]">
              <ListChecks size={13} className="text-[var(--text-tertiary)]" />
              <span>
                <span className="text-[var(--text-primary)] font-semibold tabular-nums">{pendingTasks}</span>{" "}
                tâche{pendingTasks > 1 ? "s" : ""} en attente au total
              </span>
            </div>
            <Link href="/taches"
              className="text-[12px] font-medium px-2.5 py-1 rounded-md transition-colors"
              style={{ color: "var(--text-secondary)", border: "1px solid var(--border-primary)" }}>
              Voir toutes →
            </Link>
          </div>
        )}

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
