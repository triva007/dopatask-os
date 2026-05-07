"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { Target, ListChecks, FolderKanban, Inbox, Skull, FileText, Phone, ChevronRight, CheckCircle2, Circle, Trophy, RotateCw, Calendar } from "lucide-react";
import { useCrmStore } from "@/store/useCrmStore";
import { computeStatsMois, thermometreColor } from "@/lib/crmLogic";
import UpcomingEventsWidget from "@/components/dashboard/UpcomingEventsWidget";
import { getActiveProfileId } from "@/lib/supabaseStorage";
import TdahBadge, { getBadgeVariant } from "@/components/ui/TdahBadge";
import { celebrate } from "@/lib/dopamineFeedback";

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
  const prospects = useCrmStore((s) => s.prospects);
  const config = useCrmStore((s) => s.config);
  const loadCrm = useCrmStore((s) => s.loadAll);
  const crmLoaded = useCrmStore((s) => s.loaded);
  const toggleTaskStatus = useAppStore((s) => s.updateTaskStatus);
  const completeTask = useAppStore((s) => s.completeTask);

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

  const activeProfileId = getActiveProfileId();

  // Rappels CRM du jour
  const todayStr = new Date().toISOString().slice(0, 10);
  const rappelsDuJour = useMemo(() => {
    const activeProspects = prospects.filter((p) => !p.archived);
    const now = Date.now();
    const H24 = 24 * 60 * 60 * 1000;
    const lastCallTs = new Map<string, number>();
    for (const c of calls) {
      const ts = new Date(c.date).getTime();
      const prev = lastCallTs.get(c.prospect_id) ?? 0;
      if (ts > prev) lastCallTs.set(c.prospect_id, ts);
    }
    return activeProspects.filter((p) => {
      if (p.statut !== "REPONDEUR") return false;
      if (p.date_relance) return p.date_relance <= todayStr;
      return now - (lastCallTs.get(p.id) ?? 0) > H24;
    }).slice(0, 5);
  }, [prospects, calls, todayStr]);

  // Fusion des tâches "Kill la task NOW" pour le widget du dashboard
  const combinedKillTasks = useMemo(() => {
    const local = filteredLocalTasks.map(t => ({ ...t, isGoogle: false, displayTitle: t.text }));
    const google = filteredGTasks.map(t => ({ ...t, isGoogle: true, displayTitle: t.title }));
    return [...local, ...google];
  }, [filteredLocalTasks, filteredGTasks]);

  const handleToggleTask = async (task: any) => {
    if (task.isGoogle) {
      try {
        const r = await fetch("/api/google/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listId: task.listId, taskId: task.id, updates: { status: "completed" } }),
        });
        if (r.ok) {
          setGoogleTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: "completed" } : t));
          useAppStore.getState().addToast("Tâche Google complétée", "success");
          celebrate("task-complete");
        }
      } catch (e) { console.error(e); }
    } else {
      if (task.recurrence && task.recurrence !== "none") {
        useAppStore.getState().completeRecurring(task.id);
        celebrate("recurring-complete");
      } else {
        completeTask(task.id);
        celebrate("task-complete");
      }
    }
  };

  // --- TDAH TOUR DE CONTRÔLE LOGIC ---
  const todayDateStr = todayStr;
  const weeklyRoutine = useAppStore((s) => s.weeklyRoutine);
  const currentRoutine = weeklyRoutine.find((r) => r.dayIndex === new Date().getDay());

  // Trigger auto-promotion once on mount
  useEffect(() => {
    const promoted = useAppStore.getState().promoteOverdueTasks();
    if (promoted > 0) {
      useAppStore.getState().addToast(`${promoted} tâche(s) promue(s) pour aujourd'hui`, "info");
    }
  }, []);

  const tdahTasks = useMemo(() => {
    const maintenant: any[] = [];
    const recurrent: any[] = [];
    const bientot: any[] = [];

    // Add Google Kill tasks
    filteredGTasks.forEach(t => {
      const isRecurring = useAppStore.getState().googleTaskRecurrence[t.id];
      if (isRecurring) {
        recurrent.push({ ...t, isGoogle: true, displayTitle: t.title });
      } else {
        maintenant.push({ ...t, isGoogle: true, displayTitle: t.title });
      }
    });

    // Add Local Kill tasks
    filteredLocalTasks.forEach((t) => {
      const isRecurring = !!t.recurrence && t.recurrence !== "none";
      const isTodayOrOverdue = !t.dueDate || t.dueDate <= todayDateStr || t.status === "today";
      
      if (isRecurring) {
        recurrent.push({ ...t, isGoogle: false, displayTitle: t.text });
      } else if (isTodayOrOverdue) {
        maintenant.push({ ...t, isGoogle: false, displayTitle: t.text });
      } else {
        bientot.push({ ...t, isGoogle: false, displayTitle: t.text });
      }
    });

    const completedTodayLocal = killProject
      ? tasks.filter(
          (t) => t.projectId === killProject.id && (t.status === "done" || t.status === "completed") && t.completedAt && new Date(t.completedAt).toISOString().slice(0, 10) === todayDateStr
        )
      : [];
      
    const completedTodayGoogle = killList
      ? googleTasks.filter(
          (t) => t.listId === killList.id && t.status === "completed" && t.updated && new Date(t.updated).toISOString().slice(0, 10) === todayDateStr
        ).map(t => ({ ...t, isGoogle: true, text: t.title, id: t.id }))
      : [];

    const completedToday = [...completedTodayLocal, ...completedTodayGoogle];

    // Sort recurrent by date
    recurrent.sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));

    return { maintenant, recurrent, bientot, completedToday };
  }, [tasks, filteredGTasks, filteredLocalTasks, googleTasks, killProject, killList, todayDateStr]);

  const progressTotal = tdahTasks.maintenant.length + tdahTasks.completedToday.length;
  const progressCurrent = tdahTasks.completedToday.length;
  const progressPct = progressTotal === 0 ? 0 : Math.round((progressCurrent / progressTotal) * 100);

  // Trigger all-done celebration if just hit 100%
  const [hasCelebratedAllDone, setHasCelebratedAllDone] = useState(false);
  useEffect(() => {
    if (progressPct === 100 && progressTotal > 0 && !hasCelebratedAllDone) {
      celebrate("all-done-today");
      setHasCelebratedAllDone(true);
    } else if (progressPct < 100) {
      setHasCelebratedAllDone(false);
    }
  }, [progressPct, progressTotal, hasCelebratedAllDone]);

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
        {activeProfileId === 1 && (
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
        )}

        {/* ═══ Prochains événements Google ═══ */}
        <UpcomingEventsWidget />



        {/* ═══ PROGRESS BAR ═══ */}
        <div className="rounded-xl p-5 border bg-[var(--surface-1)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-bold text-[var(--text-primary)]">Progression du jour</h3>
            <span className="text-[13px] font-semibold tabular-nums" style={{ color: progressPct === 100 ? "var(--accent-green)" : "var(--text-secondary)" }}>
              {progressCurrent} / {progressTotal}
            </span>
          </div>
          <div className="relative h-[8px] rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: progressPct === 100 ? "var(--accent-green)" : "var(--brand-primary)" }}
            />
          </div>
          <p className="text-[11.5px] text-[var(--text-tertiary)] mt-3 italic text-center">
            {progressPct === 0 && "C'est parti ! Une tâche à la fois."}
            {progressPct > 0 && progressPct < 50 && "Beau début, on continue !"}
            {progressPct >= 50 && progressPct < 100 && "Plus de la moitié ! Lâche rien."}
            {progressPct === 100 && "TOUT EST FAIT ! Repos mérité 🏆"}
          </p>
        </div>

        {/* ═══ COLONNES TOUR DE CONTRÔLE ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* ⚡ MAINTENANT */}
          <div className="rounded-2xl p-5 border transition-all hover:border-[var(--brand-primary)]/30 bg-[var(--surface-1)] shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded flex items-center justify-center bg-[var(--brand-primary)] text-white">
                <ListChecks size={14} />
              </div>
              <h3 className="text-[15px] font-bold tracking-tight">Maintenant</h3>
            </div>
            {tdahTasks.maintenant.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-tertiary)] py-8">
                <CheckCircle2 size={32} className="mb-2 opacity-50 text-[var(--accent-green)]" />
                <p className="text-[13px] font-medium">Tout est clair !</p>
              </div>
            ) : (
              <ul className="space-y-2 flex-1">
                {tdahTasks.maintenant.map((t) => {
                  const variant = getBadgeVariant(t.dueDate, false, false);
                  return (
                    <motion.li layoutId={t.id} key={t.id} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-primary)] hover:border-[var(--brand-primary)]/40 transition-colors group">
                      <button onClick={() => handleToggleTask(t)} className="shrink-0 mt-0.5 text-[var(--text-tertiary)] group-hover:text-[var(--accent-green)] transition-colors">
                        <Circle size={16} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[var(--text-primary)] leading-tight">{t.displayTitle}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <TdahBadge variant={variant} />
                          {t.isGoogle && <TdahBadge variant="future" label="Google" size="sm" />}
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* 🔄 RÉCURRENT */}
          <div className="rounded-2xl p-5 border transition-all hover:border-[var(--accent-blue)]/30 bg-[var(--surface-1)] shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded flex items-center justify-center bg-[var(--accent-blue)] text-white">
                <RotateCw size={14} />
              </div>
              <h3 className="text-[15px] font-bold tracking-tight">Récurrent</h3>
            </div>
            {tdahTasks.recurrent.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[var(--text-tertiary)] py-8">
                <p className="text-[13px] italic">Aucune tâche récurrente.</p>
              </div>
            ) : (
              <ul className="space-y-2 flex-1">
                {tdahTasks.recurrent.map((t) => {
                  const variant = getBadgeVariant(t.dueDate, true, false);
                  return (
                    <motion.li layoutId={t.id} key={t.id} className={`flex items-start gap-3 p-3 rounded-xl bg-[var(--surface-2)] border transition-colors group ${variant === "today" || variant === "overdue" ? "border-[var(--accent-blue)]/30" : "border-[var(--border-primary)]"}`}>
                      <button onClick={() => handleToggleTask(t)} className="shrink-0 mt-0.5 text-[var(--text-tertiary)] group-hover:text-[var(--accent-blue)] transition-colors">
                        <Circle size={16} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-medium leading-tight ${variant !== "today" && variant !== "overdue" ? "text-[var(--text-secondary)] opacity-70" : "text-[var(--text-primary)]"}`}>
                          {t.displayTitle}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <TdahBadge variant={variant} />
                          <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{t.recurrence}</span>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* 📋 BIENTÔT & TERMINÉ */}
          <div className="flex flex-col gap-5">
            {/* BIENTÔT */}
            <div className="rounded-2xl p-5 border transition-all hover:border-[var(--text-tertiary)]/30 bg-[var(--surface-1)] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Calendar size={14} />
                  <h3 className="text-[14px] font-bold tracking-tight">Bientôt ({tdahTasks.bientot.length})</h3>
                </div>
              </div>
              <p className="text-[11px] text-[var(--text-tertiary)] italic mb-3">Pas pour maintenant. Garde tes œillères.</p>
              <ul className="space-y-1.5 max-h-[150px] overflow-y-auto pr-2 scrollbar-none opacity-60 hover:opacity-100 transition-opacity">
                {tdahTasks.bientot.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-primary)]">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-[var(--text-secondary)] truncate">{t.displayTitle}</p>
                      {t.dueDate && <p className="text-[9px] text-[var(--text-tertiary)] mt-0.5">{t.dueDate}</p>}
                    </div>
                  </li>
                ))}
                {tdahTasks.bientot.length > 5 && (
                  <li className="text-center text-[10px] font-medium text-[var(--text-tertiary)] pt-2">
                    + {tdahTasks.bientot.length - 5} autres
                  </li>
                )}
              </ul>
            </div>

            {/* TERMINÉ AUJOURD'HUI */}
            <div className="rounded-2xl p-5 border transition-all hover:border-[var(--accent-green)]/30 bg-[var(--surface-1)] shadow-sm flex-1">
              <div className="flex items-center justify-between mb-4 text-[var(--accent-green)]">
                <div className="flex items-center gap-2">
                  <Trophy size={14} />
                  <h3 className="text-[14px] font-bold tracking-tight">Terminé aujourd'hui</h3>
                </div>
                <span className="text-[12px] font-bold">{tdahTasks.completedToday.length}</span>
              </div>
              <ul className="space-y-1.5 max-h-[150px] overflow-y-auto pr-2 scrollbar-none">
                {tdahTasks.completedToday.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-primary)] opacity-60">
                    <CheckCircle2 size={12} className="text-[var(--accent-green)] shrink-0" />
                    <p className="text-[11px] text-[var(--text-secondary)] line-through truncate">{t.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
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
