"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Target, ListChecks, FolderKanban, Inbox } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import UpcomingEventsWidget from "@/components/dashboard/UpcomingEventsWidget";
import VisionWidget from "@/components/dashboard/VisionWidget";

export default function DashboardPage() {
  const tasks = useAppStore((s) => s.tasks);
  const inboxItems = useAppStore((s) => s.inboxItems);
  const objectives = useAppStore((s) => s.objectives);
  const projects = useAppStore((s) => s.projects);

  const [, setTick] = useState(0);
  const [googleTasks, setGoogleTasks] = useState<any[]>([]);
  const [googleLists, setGoogleLists] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    const refreshAll = () => {
      if (document.visibilityState !== "visible") return;
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
  const doneTodayLocal = filteredLocalTasks.filter(
    (t) =>
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
  const activeGoals = objectives.filter((o) => (o.progress ?? 0) < 1).length;
  const activeProjects = projects.filter((p) => p.status === "active").length;

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
