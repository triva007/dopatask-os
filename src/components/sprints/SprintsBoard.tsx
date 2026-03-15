"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Layers, CheckCircle2, Circle, Trash2,
  ChevronRight, Play, CalendarDays, ArrowRight,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Task } from "@/store/useAppStore";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function SprintProgress({ tasks }: { tasks: Task[] }) {
  const done  = tasks.filter((t) => t.status === "completed" || t.status === "done").length;
  const total = tasks.length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: pct === 100 ? "#22c55e" : "#06b6d4" }}
        />
      </div>
      <span className="text-[10px] text-zinc-500 font-mono w-8 text-right">{pct}%</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SprintsBoard() {
  const {
    tasks, sprints, addSprint, deleteSprint,
    assignTaskToSprint, activateSprint, updateTaskStatus,
  } = useAppStore();

  const [creatingSprintName, setCreatingSprintName] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);

  // Backlog = tasks not in any sprint
  const sprintTaskIds = new Set(sprints.flatMap((sp) => sp.taskIds));
  const backlogTasks  = tasks.filter((t) => !sprintTaskIds.has(t.id) && t.status !== "done" && t.status !== "completed");

  const activeSprint  = sprints.find((sp) => sp.active) ?? sprints[0] ?? null;
  const viewedSprint  = selectedSprintId
    ? sprints.find((sp) => sp.id === selectedSprintId) ?? activeSprint
    : activeSprint;

  const sprintTasks   = viewedSprint
    ? tasks.filter((t) => viewedSprint.taskIds.includes(t.id))
    : [];

  const handleCreateSprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatingSprintName.trim()) return;
    const now   = Date.now();
    const week  = 7 * 24 * 3600 * 1000;
    addSprint(creatingSprintName.trim(), now, now + week);
    setCreatingSprintName("");
    setCreating(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 pt-5 pb-3 border-b border-zinc-900">
        <h1 className="text-lg font-bold text-zinc-100 tracking-tight">Sprints & Backlog</h1>
        <p className="text-xs text-zinc-600 mt-0.5">
          Organise tes tâches en sprints hebdomadaires · {sprints.length} sprint{sprints.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden divide-x divide-zinc-900">

        {/* ── Left panel: Sprint list + Backlog ── */}
        <div className="w-64 shrink-0 flex flex-col overflow-hidden">
          {/* Sprint list */}
          <div className="shrink-0 px-3 pt-3 pb-2 border-b border-zinc-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Sprints</span>
              <button
                onClick={() => setCreating(true)}
                className="text-zinc-600 hover:text-dopa-cyan transition-colors"
              >
                <Plus size={13} />
              </button>
            </div>

            <AnimatePresence>
              {creating && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreateSprint}
                  className="mb-2"
                >
                  <input
                    autoFocus
                    value={creatingSprintName}
                    onChange={(e) => setCreatingSprintName(e.target.value)}
                    onBlur={() => { if (!creatingSprintName.trim()) setCreating(false); }}
                    placeholder="Nom du sprint…"
                    className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 placeholder:text-zinc-700 focus:border-zinc-600 focus:outline-none"
                  />
                </motion.form>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
              {sprints.length === 0 && (
                <p className="text-[10px] text-zinc-700 px-1 py-2">Aucun sprint. Crée-en un !</p>
              )}
              {sprints.map((sp) => {
                const isSelected = (viewedSprint?.id === sp.id);
                return (
                  <button
                    key={sp.id}
                    onClick={() => setSelectedSprintId(sp.id)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all group"
                    style={{
                      background: isSelected ? "rgba(6,182,212,0.08)" : "transparent",
                      border: isSelected ? "1px solid rgba(6,182,212,0.15)" : "1px solid transparent",
                    }}
                  >
                    {sp.active
                      ? <Play size={9} className="text-dopa-cyan shrink-0" />
                      : <Layers size={9} className="text-zinc-600 shrink-0" />
                    }
                    <span className="text-[11px] text-zinc-400 flex-1 truncate">{sp.name}</span>
                    {sp.active && (
                      <span className="text-[8px] bg-dopa-cyan/10 text-dopa-cyan px-1 rounded font-semibold">ACTIF</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSprint(sp.id); }}
                      className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={9} />
                    </button>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Backlog */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-3 pt-3 pb-2">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Backlog · {backlogTasks.length}
            </span>
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
              {backlogTasks.length === 0 && (
                <p className="text-[10px] text-zinc-700 py-2">Backlog vide 🎉</p>
              )}
              {backlogTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/50 group"
                >
                  <Circle size={9} className="text-zinc-700 shrink-0" />
                  <span className="text-[11px] text-zinc-400 flex-1 min-w-0 truncate">{task.text}</span>
                  {viewedSprint && (
                    <button
                      onClick={() => assignTaskToSprint(task.id, viewedSprint.id)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-dopa-cyan transition-all"
                      title="Ajouter au sprint"
                    >
                      <ArrowRight size={9} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right panel: Active Sprint ── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {viewedSprint ? (
            <>
              {/* Sprint header */}
              <div className="shrink-0 px-5 pt-4 pb-3 border-b border-zinc-900">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-zinc-100">{viewedSprint.name}</h2>
                      {!viewedSprint.active && (
                        <button
                          onClick={() => activateSprint(viewedSprint.id)}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 hover:bg-dopa-cyan/10 hover:text-dopa-cyan transition-all"
                        >
                          Activer
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <CalendarDays size={9} className="text-zinc-600" />
                      <span className="text-[10px] text-zinc-600">
                        {formatDate(viewedSprint.startDate)} → {formatDate(viewedSprint.endDate)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-auto w-32">
                    <SprintProgress tasks={sprintTasks} />
                  </div>
                </div>
              </div>

              {/* Sprint tasks */}
              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3">
                {sprintTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <Layers size={28} className="text-zinc-800" />
                    <div>
                      <p className="text-sm text-zinc-600">Sprint vide</p>
                      <p className="text-xs text-zinc-700 mt-0.5">
                        Clique sur <ArrowRight size={10} className="inline" /> dans le backlog pour ajouter des tâches
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <AnimatePresence>
                      {sprintTasks.map((task) => {
                        const isDone = task.status === "completed" || task.status === "done";
                        return (
                          <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border group"
                            style={{
                              background: isDone ? "rgba(34,197,94,0.04)" : "#0f0f12",
                              borderColor: isDone ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.04)",
                            }}
                          >
                            <button
                              onClick={() =>
                                updateTaskStatus(task.id, isDone ? "todo" : "completed")
                              }
                              className="shrink-0"
                            >
                              {isDone
                                ? <CheckCircle2 size={14} className="text-dopa-green" />
                                : <Circle size={14} className="text-zinc-700 hover:text-zinc-500 transition-colors" />
                              }
                            </button>
                            <span
                              className="flex-1 text-xs"
                              style={{
                                color: isDone ? "#52525b" : "#d4d4d8",
                                textDecoration: isDone ? "line-through" : "none",
                              }}
                            >
                              {task.text}
                            </span>
                            {task.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                                style={{ color: "#06b6d4", background: "rgba(6,182,212,0.1)" }}
                              >
                                {tag}
                              </span>
                            ))}
                            <button
                              onClick={() => assignTaskToSprint(task.id, null)}
                              className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-zinc-500 transition-all"
                              title="Retirer du sprint"
                            >
                              <ChevronRight size={10} className="rotate-180" />
                            </button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
              <Layers size={36} className="text-zinc-800" />
              <div>
                <p className="text-sm font-semibold text-zinc-500">Aucun sprint créé</p>
                <p className="text-xs text-zinc-700 mt-1">
                  Clique sur <Plus size={10} className="inline" /> pour créer ton premier sprint
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
