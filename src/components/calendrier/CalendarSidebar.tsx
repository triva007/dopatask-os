"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, GripVertical, ChevronDown, ChevronRight, ListChecks } from "lucide-react";
import MiniCalendar from "./MiniCalendar";
import type { CalendarInfo } from "./useCalendarEvents";
import { useAppStore } from "@/store/useAppStore";

interface CalendarSidebarProps {
  currentDate: Date;
  calendars: CalendarInfo[];
  hiddenCalendarIds: Set<string>;
  onSelectDate: (d: Date) => void;
  onToggleCalendar: (id: string) => void;
  googleTasks?: any[];
  googleLists?: any[];
}

const STATUS_LABELS: Record<string, string> = {
  today: "📌 Aujourd'hui",
  todo: "📋 À faire",
  in_progress: "🔧 En cours",
  inbox: "📥 Inbox",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

export default function CalendarSidebar({
  currentDate,
  calendars,
  hiddenCalendarIds,
  onSelectDate,
  onToggleCalendar,
  googleTasks = [],
  googleLists = [],
}: CalendarSidebarProps) {
  const tasks = useAppStore((s) => s.tasks);
  const projects = useAppStore((s) => s.projects);
  const [tasksOpen, setTasksOpen] = useState(true);

  // Combinaison des tâches locales et Google qui appartiennent à "Kill la task now" ou "CRM"
  const activeTasks = useMemo(() => {
    const killList = googleLists.find(l => l.title?.trim().toLowerCase() === "kill la task now");
    const crmList = googleLists.find(l => l.title?.trim().toLowerCase() === "crm");
    
    const filteredGTasks = googleTasks.filter(t => 
      (t.listId === killList?.id || t.listId === crmList?.id) && 
      t.status !== "completed"
    );
    
    const killProject = projects.find(p => p.name?.trim().toLowerCase() === "kill la task now");
    const filteredLocalTasks = tasks.filter(t => {
      const isKill = killProject && t.projectId === killProject.id;
      const isCrm = !!t.linkedProspectId;
      return (isKill || isCrm) && t.status !== "done" && t.status !== "completed";
    });
      
    // Format unifié pour l'affichage (avec un flag isGoogle pour l'emoji ou l'icône)
    const combined = [
      ...filteredLocalTasks.map(t => ({ 
        id: t.id, 
        text: t.text, 
        priority: t.priority, 
        projectId: t.projectId, 
        isGoogle: false,
        isCrm: !!t.linkedProspectId 
      })),
      ...filteredGTasks.map(t => ({ id: t.id, text: t.title, priority: "medium", projectId: undefined, isGoogle: true, isCrm: false }))
    ];
    return combined.slice(0, 100); 
  }, [tasks, projects, googleTasks, googleLists]);

  const getProjectEmoji = (projectId?: string, isCrm?: boolean) => {
    if (isCrm) return "💼 ";
    if (!projectId) return "";
    const p = projects.find((pr) => pr.id === projectId);
    return p ? p.emoji + " " : "";
  };

  return (
    <div
      className="shrink-0 w-[220px] h-full flex flex-col border-r overflow-y-auto"
      style={{ borderColor: "var(--border-primary)", background: "var(--surface-0)" }}
    >
      {/* Mini calendar */}
      <div className="px-3 pt-4 pb-3">
        <MiniCalendar currentDate={currentDate} onSelectDate={onSelectDate} />
      </div>

      {/* Divider */}
      <div className="mx-3 divider-soft" />

      {/* Calendar list */}
      <div className="px-3 pt-3 pb-3">
        <h3 className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-tertiary)] mb-2 px-1">
          Mes calendriers
        </h3>
        <div className="space-y-0.5">
          {calendars.map((cal) => {
            const hidden = hiddenCalendarIds.has(cal.id);
            return (
              <button
                key={cal.id}
                onClick={() => onToggleCalendar(cal.id)}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-[var(--surface-3)] transition-all text-left group"
              >
                <span
                  className="w-3 h-3 rounded shrink-0 transition-all"
                  style={{
                    background: hidden ? "transparent" : cal.backgroundColor,
                    border: hidden ? `2px solid var(--text-ghost)` : `2px solid ${cal.backgroundColor}`,
                  }}
                />
                <span
                  className={
                    "flex-1 text-[12px] truncate " +
                    (hidden ? "text-[var(--text-tertiary)] line-through" : "text-[var(--text-primary)]")
                  }
                >
                  {cal.summary}
                </span>
                <span className="opacity-0 group-hover:opacity-100 transition-all">
                  {hidden ? (
                    <EyeOff size={11} className="text-[var(--text-tertiary)]" />
                  ) : (
                    <Eye size={11} className="text-[var(--text-tertiary)]" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 divider-soft" />

      {/* Draggable Tasks Panel */}
      <div className="px-3 pt-3 pb-4 flex-1 min-h-0 flex flex-col">
        <button
          onClick={() => setTasksOpen(!tasksOpen)}
          className="flex items-center gap-1.5 mb-2 px-1 text-left w-full group"
        >
          {tasksOpen ? (
            <ChevronDown size={11} className="text-[var(--text-tertiary)]" />
          ) : (
            <ChevronRight size={11} className="text-[var(--text-tertiary)]" />
          )}
          <ListChecks size={12} className="text-[var(--accent-purple)]" />
          <h3 className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-tertiary)] flex-1">
            Tâches
          </h3>
          <span className="text-[10px] tabular-nums text-[var(--text-ghost)] font-semibold">
            {activeTasks.length}
          </span>
        </button>

        {tasksOpen && (
          <>
            {/* Tasks list */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-0.5">
              {activeTasks.length === 0 ? (
                <p className="text-[11px] text-[var(--text-ghost)] italic px-1 py-3 text-center">
                  Aucune tâche
                </p>
              ) : (
                activeTasks.map((task) => {
                  const priorityColor = PRIORITY_COLORS[task.priority || "medium"];
                  const emoji = task.isGoogle ? "📋 " : getProjectEmoji(task.projectId, task.isCrm);
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/dopatask-name", task.text);
                        e.dataTransfer.setData("text/plain", task.text);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      className="group flex items-center gap-1.5 px-1.5 py-1.5 rounded-lg hover:bg-[var(--surface-3)] cursor-grab active:cursor-grabbing transition-all border border-transparent hover:border-[var(--border-primary)]"
                      title={`Glisse sur le calendrier pour bloquer du temps\n${task.text}`}
                    >
                      <GripVertical size={10} className="text-[var(--text-ghost)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: priorityColor }}
                      />
                      <span className="text-[11px] text-[var(--text-primary)] truncate flex-1 leading-tight">
                        {emoji}{task.text}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Help text */}
            {activeTasks.length > 0 && (
              <p className="text-[9px] text-[var(--text-ghost)] text-center mt-2 px-1 leading-relaxed">
                Glisse une tâche sur la grille horaire pour créer un time block
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
