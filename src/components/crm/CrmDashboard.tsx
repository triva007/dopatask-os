"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Phone, Target, ListChecks, FolderKanban, Inbox,
  Skull, AlertTriangle, Loader2, ArrowRight, Flame, Calendar,
  TrendingUp, Trophy, Banknote, Zap,
} from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";
import { useAppStore } from "@/store/useAppStore";
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
  const diff = day === 0 ? -6 : 1 - day; // semaine commence lundi
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() + diff);
  return out;
}

/* ───────────────────── Dashboard ───────────────────── */
export default function CrmDashboard() {
  const loaded = useCrmStore((s) => s.loaded);
  const loading = useCrmStore((s) => s.loading);
  const error = useCrmStore((s) => s.error);
  const calls = useCrmStore((s) => s.calls);
  const revenus = useCrmStore((s) => s.revenus);
  const config = useCrmStore((s) => s.config);
  const prospects = useCrmStore((s) => s.prospects);
  const loadAll = useCrmStore((s) => s.loadAll);

  const tasks = useAppStore((s) => s.tasks);
  const inboxItems = useAppStore((s) => s.inboxItems);
  const objectives = useAppStore((s) => s.objectives);
  const projects = useAppStore((s) => s.projects);

  useEffect(() => {
    if (!loaded) loadAll();
  }, [loaded, loadAll]);

  const [, setTick] = useState(0);

  useEffect(() => {
    const refreshAll = () => {
      if (document.visibilityState !== "visible") return;
      loadAll();
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
    refreshAll();
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refreshAll);
      window.removeEventListener("focus", refreshAll);
      window.removeEventListener("storage", onStorage);
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
  const callsParJourPourTenir = joursOuvres > 0 ? Math.ceil((ventesNecessaires * 100) / Math.max(1, stats.tauxClosing || 8) / Math.max(1, stats.tauxConversion || 10) * 100 / joursOuvres) : 0;

  // Focus du jour
  const aAppelerCount = prospects.filter(
    (p) => !p.archived && (p.statut === "A_APPELER" || p.statut === "REPONDEUR")
  ).length;
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

  // Prochains RDV (3)
  const today = new Date().toISOString().slice(0, 10);
  const prochainsRdv = useMemo(
    () =>
      prospects
        .filter((p) => p.date_rdv && p.date_rdv >= today && !p.archived)
        .sort((a, b) => (a.date_rdv! < b.date_rdv! ? -1 : 1))
        .slice(0, 3),
    [prospects, today]
  );

  // Compteurs visu globale
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
      <div className="max-w-[1700px] mx-auto px-10 py-8 space-y-6">

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
        </div>

        {/* ═══ CHALLENGE RASAGE — compact ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--accent-red-light)",
            border: "1px solid color-mix(in srgb, var(--accent-red) 30%, transparent)",
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-0">
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Skull size={13} style={{ color: "var(--accent-red)" }} />
                <span className="text-[10px] font-semibold tracking-[0.18em] uppercase"
                  style={{ color: "var(--accent-red)" }}>
                  Challenge · enjeu personnel
                </span>
              </div>

              <h2 className="text-[22px] font-semibold leading-tight text-[var(--text-primary)]">
                Si le 1<sup className="text-[14px]">er</sup> juin je n&apos;ai pas fait{" "}
                <span style={{ color: "var(--accent-red)" }}>3 000 € / mois</span>, je me rase la tête.
              </h2>

              <div className="flex items-end gap-6 flex-wrap">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[var(--text-tertiary)] mb-1">
                    Jours ouvrés restants
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[48px] font-bold leading-none tabular-nums tracking-tight"
                      style={{ color: "var(--accent-red)" }}>
                      {joursOuvres}
                    </span>
                    <span className="text-[12px] font-medium text-[var(--text-secondary)]">jours</span>
                  </div>
                  <p className="text-[10.5px] text-[var(--text-tertiary)] mt-1">
                    deadline · 1<sup>er</sup> juin 2026
                  </p>
                </div>

                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center justify-between mb-1.5 text-[12px]">
                    <span className="text-[var(--text-secondary)] font-semibold tabular-nums">
                      {stats.revenuTotal.toLocaleString("fr-FR")} €
                      <span className="text-[var(--text-tertiary)] font-normal"> / {objectif.toLocaleString("fr-FR")} €</span>
                    </span>
                    <span className="font-semibold tabular-nums" style={{ color: thermoColor }}>{pct}%</span>
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
                      </span>
                      {" "}·{" "}
                      <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                        {ventesNecessaires}
                      </span>{" "}
                      vente{ventesNecessaires > 1 ? "s" : ""} à {prixSite}€
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="relative w-full lg:w-[260px] h-[180px] lg:h-auto"
              style={{ background: "color-mix(in srgb, var(--accent-red) 8%, transparent)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://i.postimg.cc/PqtQLZDj/Whats-App-Image-2026-04-20-at-17-02-51.jpg"
                alt="Aaron chauve — motivation"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: "grayscale(0.05) contrast(1.02)" }}
              />
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(90deg, var(--accent-red-light) 0%, transparent 30%)" }} />
              <div className="absolute bottom-3 right-3 px-2 py-[3px] rounded-md text-[10px] font-semibold tracking-wide uppercase"
                style={{ background: "rgba(0,0,0,0.55)", color: "#fff", backdropFilter: "blur(4px)" }}>
                si t&apos;échoues
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ FOCUS DU JOUR + PROCHAINS RDV ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Focus du jour — 2 colonnes */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-2 rounded-xl p-5"
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--border-primary)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-[var(--accent-blue)]" />
                <h3 className="text-[13px] font-semibold tracking-tight">Focus du jour</h3>
              </div>
              {streak > 0 && (
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded"
                  style={{ background: "var(--accent-orange-light)", color: "var(--accent-orange)" }}>
                  <Flame size={11} />
                  Streak {streak}j
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-tertiary)] mb-1">
                  Appels du jour
                </p>
                <p className="text-[32px] font-bold tabular-nums leading-none"
                  style={{ color: stats.appelsDuJour >= dailyTarget ? "var(--accent-green)" : "var(--text-primary)" }}>
                  {stats.appelsDuJour}
                  <span className="text-[14px] font-medium text-[var(--text-tertiary)]"> / {dailyTarget}</span>
                </p>
                <div className="mt-2 h-[3px] rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${dailyPct}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full"
                    style={{ background: stats.appelsDuJour >= dailyTarget ? "var(--accent-green)" : "var(--accent-blue)" }}
                  />
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-tertiary)] mb-1">
                  À appeler en stock
                </p>
                <p className="text-[32px] font-bold tabular-nums leading-none text-[var(--text-primary)]">
                  {aAppelerCount}
                </p>
                <p className="text-[10.5px] text-[var(--text-tertiary)] mt-2">
                  prospects à contacter
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-tertiary)] mb-1">
                  Rythme requis
                </p>
                <p className="text-[32px] font-bold tabular-nums leading-none"
                  style={{ color: callsParJourPourTenir > dailyTarget ? "var(--accent-red)" : "var(--accent-green)" }}>
                  {callsParJourPourTenir || "—"}
                </p>
                <p className="text-[10.5px] text-[var(--text-tertiary)] mt-2">
                  appels/jour pour tenir
                </p>
              </div>
            </div>

            <Link
              href="/crm"
              className="group flex items-center justify-between p-3.5 rounded-lg transition-all"
              style={{
                background: restantAppels > 0 ? "var(--accent-blue-light)" : "var(--accent-green-light)",
                border: `1px solid color-mix(in srgb, var(--accent-${restantAppels > 0 ? "blue" : "green"}) 25%, transparent)`,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `var(--accent-${restantAppels > 0 ? "blue" : "green"})`, color: "#fff" }}>
                  <Phone size={15} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-[13.5px] font-semibold leading-tight"
                    style={{ color: `var(--accent-${restantAppels > 0 ? "blue" : "green"})` }}>
                    {restantAppels > 0
                      ? `Encore ${restantAppels} appel${restantAppels > 1 ? "s" : ""} pour finir ta mission`
                      : "Mission du jour accomplie. Bonus ?"}
                  </p>
                  <p className="text-[11.5px] mt-0.5"
                    style={{ color: `color-mix(in srgb, var(--accent-${restantAppels > 0 ? "blue" : "green"}) 70%, var(--text-secondary))` }}>
                    Lance la session cold-call
                  </p>
                </div>
              </div>
              <ArrowRight size={16}
                className="transition-transform group-hover:translate-x-1"
                style={{ color: `var(--accent-${restantAppels > 0 ? "blue" : "green"})` }} />
            </Link>
          </motion.div>

          {/* Prochains RDV — 1 colonne */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl p-5"
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--border-primary)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-[var(--accent-blue)]" />
                <h3 className="text-[13px] font-semibold tracking-tight">Prochains RDV</h3>
              </div>
              <span className="text-[10.5px] tabular-nums text-[var(--text-tertiary)]">
                {prochainsRdv.length}
              </span>
            </div>
            {prochainsRdv.length === 0 ? (
              <p className="text-[12px] text-[var(--text-tertiary)] italic py-4">
                Aucun RDV en stock. Décroche, propose, book.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {prochainsRdv.map((p) => {
                  const d = new Date(p.date_rdv!);
                  const days = Math.floor((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const dayLabel = days === 0 ? "Aujourd'hui" : days === 1 ? "Demain" : `Dans ${days}j`;
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/prospects?p=${p.id}`}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[12.5px] font-semibold text-[var(--text-primary)] truncate leading-tight">
                            {p.entreprise}
                          </p>
                          <p className="text-[10.5px] text-[var(--accent-blue)] tabular-nums font-medium mt-0.5">
                            {dayLabel} · {d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                          </p>
                        </div>
                        <ArrowRight size={12} className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] shrink-0" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        </div>

        {/* ═══ CETTE SEMAINE — bandeau vélocité ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl p-5"
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--border-primary)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-[var(--accent-purple)]" />
              <h3 className="text-[13px] font-semibold tracking-tight">Cette semaine</h3>
            </div>
            <p className="text-[10.5px] text-[var(--text-tertiary)]">
              du {weekStart.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} à aujourd&apos;hui
            </p>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <WeekStat icon={<Phone size={13} />} label="Appels" value={callsSemaine.length} accent="blue" />
            <WeekStat icon={<Calendar size={13} />} label="RDV pris" value={rdvSemaine} accent="purple" />
            <WeekStat icon={<Trophy size={13} />} label="Ventes" value={revenusSemaine.length} accent="green" />
            <WeekStat icon={<Banknote size={13} />} label="€ encaissés" value={`${eurosSemaine.toLocaleString("fr-FR")}`} suffix="€" accent="cyan" />
          </div>
        </motion.div>

        {/* ═══ KPI grid (productivité globale) ═══ */}
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

function WeekStat({
  icon, label, value, suffix, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  suffix?: string;
  accent: "green" | "orange" | "purple" | "cyan" | "blue" | "red";
}) {
  const color = `var(--accent-${accent})`;
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2" style={{ color }}>
        {icon}
        <p className="text-[10px] font-semibold tracking-[0.12em] uppercase">{label}</p>
      </div>
      <p className="text-[24px] font-bold tabular-nums leading-none text-[var(--text-primary)] flex items-baseline gap-1">
        {value}
        {suffix && <span className="text-[12px] text-[var(--text-tertiary)] font-medium">{suffix}</span>}
      </p>
    </div>
  );
}
