"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Target, ListChecks, FolderKanban, Inbox, Skull } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useCrmStore } from "@/store/useCrmStore";
import { computeStatsMois, thermometreColor } from "@/lib/crmLogic";
import UpcomingEventsWidget from "@/components/dashboard/UpcomingEventsWidget";
import VisionWidget from "@/components/dashboard/VisionWidget";

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

export default function DashboardPage() {
  const tasks = useAppStore((s) => s.tasks);
  const inboxItems = useAppStore((s) => s.inboxItems);
  const objectives = useAppStore((s) => s.objectives);
  const projects = useAppStore((s) => s.projects);

  const calls = useCrmStore((s) => s.calls);
  const revenus = useCrmStore((s) => s.revenus);
  const config = useCrmStore((s) => s.config);
  const loadCrm = useCrmStore((s) => s.loadAll);
  const crmLoaded = useCrmStore((s) => s.loaded);

  const [, setTick] = useState(0);
  const [googleTasks, setGoogleTasks] = useState<any[]>([]);
  const [googleLists, setGoogleLists] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    if (!crmLoaded) loadCrm();
  }, [crmLoaded, loadCrm]);

  useEffect(() => {
    const refreshAll = () => {
      if (document.visibilityState !== "visible") return;
      loadCrm();
      try {
        if ((useAppStore as any).persist?.rehydrate) (useAppStore as any).persist.rehydrate();
      } catch {}
      setTick((t) => t + 1);
    };
    const id = window.setInterval(refreshAll, 15000);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "dopatask-storage") {
        try {
          if ((useAppStore as any).persist?.rehydrate) (useAppStore as any).persist.rehydrate();
        } catch {}
        setTick((t) => t + 1);
      }
    };
    const fetchGTasks = async () => {
      try {
        const r = await fetch("/api/google/tasks");
        if (r.ok) {
          const d = await r.json();
          setGoogleTasks(d.tasks || []);
          setGoogleLists(d.lists || []);
        }
      } catch (e) { console.error(e); } finally { setLoadingTasks(false); }
    };

    document.addEventListener("visibilitychange", refreshAll);
    window.addEventListener("focus", refreshAll);
    window.addEventListener("storage", onStorage);
    refreshAll();
    fetchGTasks();
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refreshAll);
      window.removeEventListener("focus", refreshAll);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Compteurs visu globale
  // Filtrage spécifique demandé par le USER: seulement la liste "Kill la task NOW" (insensible à la casse)
  const killList = googleLists.find(l => l.title?.toLowerCase() === "kill la task now");
  const filteredGTasks = killList 
    ? googleTasks.filter(t => t.listId === killList.id && t.status !== "completed")
    : [];
  
  // On inclut aussi les tâches locales qui pourraient appartenir à un projet du même nom
  const killProject = projects.find(p => p.name?.toLowerCase() === "kill la task now");
  const filteredLocalTasks = killProject
    ? tasks.filter(t => t.projectId === killProject.id && t.status !== "done" && t.status !== "completed")
    : [];
  
  const pendingTasks = filteredGTasks.length + filteredLocalTasks.length;
  
  // Stats pour le sous-texte (uniquement la liste prioritaire)
  const doneTodayLocal = tasks.filter(
    (t) =>
      (!killProject || t.projectId === killProject.id) &&
      (t.status === "done" || t.status === "completed") &&
      t.completedAt &&
      new Date(t.completedAt).toDateString() === new Date().toDateString()
  ).length;

  const doneTodayGoogle = googleTasks.filter(
    (t) =>
      t.listId === killList?.id &&
      t.status === "completed" &&
      t.updated &&
      new Date(t.updated).toDateString() === new Date().toDateString()
  ).length;

  const doneToday = doneTodayLocal + doneTodayGoogle;

  const inboxCount = inboxItems.filter((i) => !i.processed).length;
  const activeGoals = objectives.filter((o) => (o.progress ?? 0) < 100).length;
  const activeProjects = projects.filter((p) => p.status === "active").length;

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

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1700px] mx-auto px-10 py-8 space-y-6">
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

        {/* ═══ Prochains événements Google ═══ */}
        <UpcomingEventsWidget />

        {/* ═══ VISION LONG TERME (Time Stripe style) ═══ */}
        <VisionWidget />

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

        {/* ═══ SYNERGIE PROJETS DE VIE ═══ */}
        {projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-5"
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--border-primary)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <FolderKanban size={14} className="text-[var(--accent-blue)]" />
              <h3 className="text-[13px] font-semibold tracking-tight">Projets de Vie</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.filter(p => p.status === "active").slice(0, 3).map((project) => {
                const projectTasks = tasks.filter((t) => t.projectId === project.id);
                const doneTasks = projectTasks.filter((t) => t.status === "done" || t.status === "completed").length;
                const pct = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0;
                
                return (
                  <Link href="/projets" key={project.id} className="block group">
                    <div className="p-4 rounded-xl border transition-all group-hover:bg-[var(--surface-2)]" style={{ borderColor: "var(--border-primary)", background: "var(--card-bg)" }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[18px] leading-none">{project.emoji}</span>
                          <span className="text-[14px] font-semibold text-[var(--text-primary)] leading-none">{project.name}</span>
                        </div>
                        <span className="text-[11px] font-bold tabular-nums" style={{ color: project.color }}>{pct}%</span>
                      </div>
                      <div className="h-[4px] rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: project.color }} />
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-[11px] text-[var(--text-tertiary)]">{projectTasks.length} tâches totales</p>
                        <p className="text-[11px] font-medium" style={{ color: project.color }}>{doneTasks} complétées</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

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
