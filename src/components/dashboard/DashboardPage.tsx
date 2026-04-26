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
    refreshAll();
    fetchGTasks();
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refreshAll);
      window.removeEventListener("focus", refreshAll);
    };
  }, []);

  const killList = googleLists.find(l => l.title?.toLowerCase() === "kill la task now");
  const filteredGTasks = killList ? googleTasks.filter(t => t.listId === killList.id && t.status !== "completed") : [];
  const killProject = projects.find(p => p.name?.toLowerCase() === "kill la task now");
  const filteredLocalTasks = killProject ? tasks.filter(t => t.projectId === killProject.id && t.status !== "done") : [];
  const pendingTasks = filteredGTasks.length + filteredLocalTasks.length;
  
  const doneTodayLocal = filteredLocalTasks.filter(t => t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()).length;
  const doneTodayGoogle = googleTasks.filter(t => t.listId === killList?.id && t.status === "completed" && t.updated && new Date(t.updated).toDateString() === new Date().toDateString()).length;
  const doneToday = doneTodayLocal + doneTodayGoogle;

  const inboxCount = inboxItems.filter((i) => !i.processed).length;
  const activeGoals = objectives.filter((o) => (o.progress ?? 0) < 1).length;
  const activeProjects = projects.filter((p) => p.status === "active").length;

  return (
    <div className="h-full overflow-auto bg-[var(--surface-0)]">
      <div className="max-w-[1800px] mx-auto px-12 py-12 space-y-12">
        {/* ═══ HEADER ═══ */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[12px] font-bold tracking-[0.3em] uppercase text-[var(--accent-purple)] mb-4">
              Aaron Operating System · v5.0
            </p>
            <h1 className="text-[42px] font-bold text-white tracking-tight leading-none">
              Vue d&apos;ensemble
            </h1>
          </div>
          <div className="text-right hidden xl:block">
             <p className="text-[13px] text-[var(--text-tertiary)] font-medium">Performance globale</p>
             <p className="text-[20px] font-bold text-white mt-1">Optimisé PC 1080p</p>
          </div>
        </div>

        {/* ═══ Prochains événements Google ═══ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
           <div className="xl:col-span-2">
              <UpcomingEventsWidget />
           </div>
           <div className="h-full">
              {/* Optional Sidebar for Dashboard widgets if needed */}
              <div className="h-full rounded-2xl border border-white/5 bg-[var(--surface-1)] p-6 flex flex-col justify-center items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--accent-blue-light)] flex items-center justify-center mb-4">
                    <ListChecks size={32} className="text-[var(--accent-blue)]" />
                  </div>
                  <h4 className="text-[18px] font-bold text-white mb-2">Focus du Jour</h4>
                  <p className="text-[14px] text-[var(--text-secondary)]">Tu as {pendingTasks} tâches prioritaires aujourd&apos;hui.</p>
              </div>
           </div>
        </div>

        {/* ═══ VISION LONG TERME ═══ */}
        <VisionWidget />

        {/* ═══ KPI grid (productivité globale) ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MiniStat href="/taches" icon={<ListChecks size={18} />} label="À faire" value={pendingTasks} sub={`${doneToday} faites aujourd'hui`} accent="green" />
          <MiniStat href="/inbox" icon={<Inbox size={18} />} label="Inbox" value={inboxCount} sub="éléments à traiter" accent="orange" />
          <MiniStat href="/objectifs" icon={<Target size={18} />} label="Objectifs" value={activeGoals} sub="horizons en cours" accent="purple" />
          <MiniStat href="/projets" icon={<FolderKanban size={18} />} label="Projets" value={activeProjects} sub="systèmes actifs" accent="cyan" />
        </div>

        {/* ═══ SYNERGIE PROJETS DE VIE ═══ */}
        {projects.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-[var(--accent-blue)] rounded-full" />
              <h3 className="text-[20px] font-bold tracking-tight text-white">Projets de Vie</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.filter(p => p.status === "active").map((project) => {
                const projectTasks = tasks.filter((t) => t.projectId === project.id);
                const doneTasks = projectTasks.filter((t) => t.status === "done" || t.status === "completed").length;
                const pct = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0;
                
                return (
                  <Link href="/projets" key={project.id} className="group block h-full">
                    <div className="p-6 rounded-[24px] border border-white/5 bg-[var(--surface-1)] transition-all hover:bg-[var(--surface-2)] hover:border-white/10 shadow-lg h-full flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <span className="text-[28px]">{project.emoji}</span>
                          <span className="text-[16px] font-bold text-white group-hover:text-[var(--accent-blue)] transition-colors">{project.name}</span>
                        </div>
                        <span className="text-[13px] font-bold tabular-nums px-2.5 py-1 rounded-full bg-white/5" style={{ color: project.color }}>{pct}%</span>
                      </div>
                      <div className="flex-1">
                        <div className="h-[6px] rounded-full bg-white/5 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} className="h-full rounded-full shadow-[0_0_12px_rgba(0,0,0,0.5)]" style={{ background: project.color }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-6">
                        <p className="text-[13px] text-[var(--text-tertiary)] font-medium">{projectTasks.length} tâches</p>
                        <p className="text-[13px] font-bold" style={{ color: project.color }}>{doneTasks} OK</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ href, icon, label, value, sub, accent }: any) {
  const color = `var(--accent-${accent})`;
  const colorLight = `var(--accent-${accent}-light)`;

  const body = (
    <div className="p-8 rounded-[28px] bg-[var(--surface-1)] border border-white/5 transition-all shadow-xl h-full flex flex-col justify-center">
      <div className="flex items-center gap-3 mb-6" style={{ color }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5" style={{ background: colorLight }}>
          {icon}
        </div>
        <p className="text-[12px] font-bold tracking-[0.2em] uppercase opacity-70">{label}</p>
      </div>
      <p className="text-[42px] font-bold tabular-nums leading-none text-white tracking-tighter">
        {value}
      </p>
      <p className="text-[14px] text-[var(--text-tertiary)] mt-4 font-medium">{sub}</p>
    </div>
  );

  return href ? (
    <Link href={href} className="group block h-full">
      <div className="h-full transition-all group-hover:scale-[1.02] active:scale-[0.98]">{body}</div>
    </Link>
  ) : body;
}
