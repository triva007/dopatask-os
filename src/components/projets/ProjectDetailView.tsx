"use client";

import { useAppStore } from "@/store/useAppStore";
import { ArrowLeft, CheckCircle2, Circle, FileText, CalendarDays, Loader2, Calendar, Layout, ListChecks } from "lucide-react";
import type { Project } from "@/store/useAppStore";
import { useEffect, useState, useMemo } from "react";

export default function ProjectDetailView({ project, onBack }: { project: Project; onBack: () => void }) {
  const localTasks = useAppStore(s => (s.tasks || []).filter(t => t && t.projectId === project?.id));
  const notes = useAppStore(s => (s.notes || []).filter(n => n && n.projectId === project?.id));
  const toggleTask = useAppStore(s => s.updateTaskStatus);
  const googleEventProjects = useAppStore(s => s.googleEventProjects || {});
  const googleTaskProjects = useAppStore(s => s.googleTaskProjects || {});

  const [googleTasks, setGoogleTasks] = useState<any[]>([]);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      if (!project?.id) return;
      setLoadingGoogle(true);
      try {
        const [tRes, eRes] = await Promise.all([
          fetch("/api/google/tasks"),
          fetch("/api/google/calendar/events?calendarIds=primary"),
        ]);
        if (cancelled) return;
        if (tRes.ok) {
          const d = await tRes.json();
          setGoogleTasks(d.tasks || []);
        }
        if (eRes.ok) {
          const d = await eRes.json();
          setGoogleEvents(d.events || []);
        }
      } catch (e) {
        console.error("ProjectDetailView fetch error:", e);
      } finally {
        if (!cancelled) setLoadingGoogle(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [project?.id]);

  const linkedGoogleTasks = useMemo(
    () =>
      (googleTasks || []).filter(t => {
        if (!t?.id || !project?.id) return false;
        const pid = googleTaskProjects[t.id] || googleTaskProjects[`task-${t.id}`];
        return pid === project.id;
      }),
    [googleTasks, googleTaskProjects, project?.id],
  );

  const linkedGoogleEvents = useMemo(
    () =>
      (googleEvents || []).filter(
        e => e?.id && project?.id && googleEventProjects[e.id] === project.id,
      ),
    [googleEvents, googleEventProjects, project?.id],
  );

  const activeLocalTasks = (localTasks || []).filter(
    t => t && t.status !== "done" && t.status !== "completed",
  );
  const completedLocalTasks = (localTasks || []).filter(
    t => t && (t.status === "done" || t.status === "completed"),
  );

  if (!project) {
    return (
      <div className="p-8 text-center bg-[var(--card-bg)] h-full">
        <p className="text-[var(--text-tertiary)]">Chargement du projet...</p>
        <button onClick={onBack} className="mt-4 text-[var(--accent-blue)] underline">
          Retour aux projets
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--card-bg)]">
      {/* Header */}
      <div className="shrink-0 px-8 pt-8 pb-5 border-b border-[var(--border-primary)] bg-[var(--surface-1)]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
        >
          <ArrowLeft size={14} /> Retour aux projets
        </button>
        <div className="flex items-center gap-4">
          <span className="text-4xl drop-shadow-sm">{project.emoji || "📁"}</span>
          <div>
            <h1 className="text-[32px] font-bold text-[var(--text-primary)] tracking-tight leading-none">
              {project.name || "Projet sans nom"}
            </h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-1.5 flex items-center gap-1.5 font-medium">
              <Layout size={13} className="text-[var(--text-tertiary)]" />
              Espace projet consolidé
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8 space-y-10 custom-scrollbar">
        {/* Résumé */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-primary)] shadow-sm">
            <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Tâches DopaTask</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{activeLocalTasks.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-primary)] shadow-sm">
            <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Google Tasks</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{linkedGoogleTasks.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-primary)] shadow-sm">
            <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Agenda</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{linkedGoogleEvents.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-primary)] shadow-sm">
            <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Notes</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{notes.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-10">
            {/* Tâches Locales */}
            <section>
              <h2 className="text-[15px] font-bold text-[var(--text-primary)] mb-5 flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-[var(--accent-blue)]" />
                Tâches Locales ({activeLocalTasks.length})
              </h2>
              {activeLocalTasks.length > 0 ? (
                <div className="space-y-2.5">
                  {activeLocalTasks.map(task => (
                    <div
                      key={task?.id || Math.random().toString()}
                      className="flex items-start gap-3 p-4 rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-1)] shadow-sm"
                    >
                      <button
                        onClick={() => task?.id && toggleTask(task.id, "completed")}
                        className="mt-0.5 text-[var(--text-tertiary)] hover:text-[var(--accent-blue)] transition-colors"
                      >
                        <Circle size={18} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14.5px] font-medium text-[var(--text-primary)] break-words">
                          {task?.text || "Sans titre"}
                        </p>
                        {task?.description && (
                          <p className="text-[12px] text-[var(--text-tertiary)] mt-1 line-clamp-1 break-words">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center rounded-2xl border border-dashed border-[var(--border-primary)]">
                  <p className="text-[13px] text-[var(--text-tertiary)] italic">Aucune tâche locale liée.</p>
                </div>
              )}

              {completedLocalTasks.length > 0 && (
                <div className="mt-6">
                  <p className="text-[12px] font-semibold text-[var(--text-tertiary)] mb-3 flex items-center gap-2">
                    <CheckCircle2 size={12} /> Terminées ({completedLocalTasks.length})
                  </p>
                  <div className="space-y-2 opacity-50">
                    {completedLocalTasks.map(task => (
                      <div
                        key={task?.id || Math.random().toString()}
                        className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-2)]"
                      >
                        <CheckCircle2 size={16} className="text-[var(--accent-green)] mt-0.5" />
                        <span className="text-[13.5px] text-[var(--text-primary)] line-through">
                          {task?.text || "Sans titre"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Google Tasks */}
            <section>
              <h2 className="text-[15px] font-bold text-[var(--text-primary)] mb-5 flex items-center gap-2.5">
                <ListChecks size={18} className="text-[var(--accent-cyan)]" />
                Google Tasks ({linkedGoogleTasks.length})
              </h2>
              {loadingGoogle ? (
                <div className="flex items-center gap-2 text-[13px] text-[var(--text-tertiary)] py-4">
                  <Loader2 size={14} className="animate-spin" /> Chargement...
                </div>
              ) : linkedGoogleTasks.length > 0 ? (
                <div className="space-y-2.5">
                  {linkedGoogleTasks.map(task => (
                    <div
                      key={task?.id || Math.random().toString()}
                      className="flex items-start gap-3 p-4 rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-1)] shadow-sm"
                    >
                      <div className="mt-1 w-4 h-4 rounded-full border-2 border-[var(--accent-cyan)] opacity-50" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14.5px] font-medium text-[var(--text-primary)] break-words">
                          {task?.title || "(sans titre)"}
                        </p>
                        {task?.notes && (
                          <p className="text-[12px] text-[var(--text-tertiary)] mt-1 line-clamp-1 break-words">
                            {task.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center rounded-2xl border border-dashed border-[var(--border-primary)]">
                  <p className="text-[13px] text-[var(--text-tertiary)] italic">Aucune tâche Google liée.</p>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-10">
            {/* Calendar Events */}
            <section>
              <h2 className="text-[15px] font-bold text-[var(--text-primary)] mb-5 flex items-center gap-2.5">
                <CalendarDays size={18} className="text-[var(--accent-red)]" />
                Événements ({linkedGoogleEvents.length})
              </h2>
              {loadingGoogle ? (
                <div className="flex items-center gap-2 text-[13px] text-[var(--text-tertiary)] py-4">
                  <Loader2 size={14} className="animate-spin" /> Chargement...
                </div>
              ) : linkedGoogleEvents.length > 0 ? (
                <div className="space-y-3">
                  {linkedGoogleEvents.map(event => {
                    let start: Date | null = null;
                    try {
                      if (event?.start?.dateTime) start = new Date(event.start.dateTime);
                      else if (event?.start?.date) start = new Date(event.start.date);
                    } catch (_e) {
                      /* ignore */
                    }

                    return (
                      <div
                        key={event?.id || Math.random().toString()}
                        className="p-4 rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-1)] shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[14.5px] font-bold text-[var(--text-primary)] break-words">
                            {event?.summary || "(sans titre)"}
                          </p>
                          {start && !isNaN(start.getTime()) && (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[var(--accent-red-light)] text-[var(--accent-red)] uppercase tracking-tight">
                              {start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
                          <Calendar size={12} className="text-[var(--text-tertiary)]" />
                          {start && !isNaN(start.getTime())
                            ? start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
                            : "Toute la journée"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center rounded-2xl border border-dashed border-[var(--border-primary)]">
                  <p className="text-[13px] text-[var(--text-tertiary)] italic">Aucun événement lié.</p>
                </div>
              )}
            </section>

            {/* Notes */}
            <section>
              <h2 className="text-[15px] font-bold text-[var(--text-primary)] mb-5 flex items-center gap-2.5">
                <FileText size={18} className="text-[var(--accent-purple)]" />
                Notes ({notes.length})
              </h2>
              {notes.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {notes.map(note => {
                    let noteDate = "";
                    try {
                      if (note?.createdAt) noteDate = new Date(note.createdAt).toLocaleDateString("fr-FR");
                    } catch (_e) {
                      /* ignore */
                    }

                    return (
                      <div
                        key={note?.id || Math.random().toString()}
                        className="p-5 rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-1)] shadow-sm"
                      >
                        <h3 className="text-[15px] font-bold text-[var(--text-primary)] mb-2.5 break-words">
                          {note?.title || "Note sans titre"}
                        </h3>
                        <p className="text-[13px] text-[var(--text-secondary)] line-clamp-4 leading-relaxed break-words">
                          {note?.content || ""}
                        </p>
                        <div className="mt-4 pt-4 border-t border-[var(--border-primary)] flex items-center justify-between">
                          <span className="text-[11px] text-[var(--text-tertiary)]">
                            {noteDate ? `Modifié le ${noteDate}` : "Date inconnue"}
                          </span>
                          <button className="text-[11px] font-bold text-[var(--accent-blue)] hover:underline">
                            Ouvrir
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center rounded-2xl border border-dashed border-[var(--border-primary)]">
                  <p className="text-[13px] text-[var(--text-tertiary)] italic">Aucune note liée.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
