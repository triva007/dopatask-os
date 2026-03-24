"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, GripVertical, Check, Clock, Bookmark,
  ChevronDown, ChevronRight, X, Trash2,
  Sparkles, Timer,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Task, TaskStatus, IncupTag } from "@/store/useAppStore";
import TaskDetailModal from "./TaskDetailModal";

interface KanbanColumn {
  id: TaskStatus;
  label: string;
  dotColor: string;
  Icon: typeof Clock;
}

const COLUMNS: KanbanColumn[] = [
  { id: "todo",        label: "To Do",      dotColor: "#fca5a5", Icon: Plus     },
  { id: "in_progress", label: "En cours",   dotColor: "#93c5fd", Icon: Clock    },
  { id: "completed",   label: "Terminé",    dotColor: "#4ade80", Icon: Check    },
  { id: "saved",       label: "Sauvegarde", dotColor: "#fbbf24", Icon: Bookmark },
];

const INCUP_TAGS: { tag: IncupTag; color: string }[] = [
  { tag: "Intérêt",   color: "#67e8f9" },
  { tag: "Nouveauté", color: "#a78bfa" },
  { tag: "Challenge", color: "#fbbf24" },
  { tag: "Urgence",   color: "#fca5a5" },
  { tag: "Passion",   color: "#4ade80" },
];

/* ─── AI Magic Breakup Placeholder ─────────────────────────────────── */
function generateMicroSteps(taskText: string): { id: string; text: string; done: boolean }[] {
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
  const lower = taskText.toLowerCase();

  if (lower.includes("ranger") || lower.includes("nettoyer") || lower.includes("ménage")) {
    return [
      { id: uid(), text: "Rassembler tout ce qui traîne (2 min)", done: false },
      { id: uid(), text: "Jeter les déchets évidents (2 min)", done: false },
      { id: uid(), text: "Ranger les objets à leur place (3 min)", done: false },
      { id: uid(), text: "Passer un coup de chiffon (2 min)", done: false },
    ];
  }
  if (lower.includes("email") || lower.includes("mail") || lower.includes("répondre")) {
    return [
      { id: uid(), text: "Ouvrir la boîte mail (1 min)", done: false },
      { id: uid(), text: "Trier : urgents vs plus tard (2 min)", done: false },
      { id: uid(), text: "Répondre aux 3 plus urgents (5 min)", done: false },
      { id: uid(), text: "Archiver le reste (1 min)", done: false },
    ];
  }
  if (lower.includes("rapport") || lower.includes("document") || lower.includes("rédiger")) {
    return [
      { id: uid(), text: "Ouvrir le document et relire le plan (2 min)", done: false },
      { id: uid(), text: "Écrire l'introduction (5 min)", done: false },
      { id: uid(), text: "Compléter une section (10 min)", done: false },
      { id: uid(), text: "Relire et corriger (5 min)", done: false },
    ];
  }
  return [
    { id: uid(), text: "Préparer le matériel nécessaire (2 min)", done: false },
    { id: uid(), text: "Commencer la première sous-tâche (5 min)", done: false },
    { id: uid(), text: "Faire une mini-pause puis continuer (2 min)", done: false },
    { id: uid(), text: "Finaliser et vérifier (3 min)", done: false },
  ];
}

function estimateMinutes(taskText: string): number {
  const lower = taskText.toLowerCase();
  if (lower.includes("email") || lower.includes("mail")) return 15;
  if (lower.includes("rapport") || lower.includes("document")) return 45;
  if (lower.includes("ranger") || lower.includes("nettoyer")) return 12;
  if (lower.includes("réunion") || lower.includes("meeting")) return 30;
  if (lower.includes("vidéo") || lower.includes("montage")) return 60;
  if (lower.includes("seo") || lower.includes("site")) return 40;
  return 20;
}

/* ─── Kanban Card ──────────────────────────────────────────────────── */

function KanbanCard({ task, onOpenDetail }: { task: Task; onOpenDetail: (task: Task) => void }) {
  const { updateTaskStatus, deleteTask, toggleTag, toggleExpand, addMicroStep, toggleMicroStep, deleteMicroStep, setMicroSteps, updateTask, projects } = useAppStore();
  const [microInput, setMicroInput] = useState("");
  const doneCount = task.microSteps.filter((ms) => ms.done).length;
  const totalSteps = task.microSteps.length;

  const handleAddMicro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!microInput.trim()) return;
    addMicroStep(task.id, microInput.trim());
    setMicroInput("");
  };

  const handleMagicBreakup = () => {
    const steps = generateMicroSteps(task.text);
    setMicroSteps(task.id, steps);
    const est = estimateMinutes(task.text);
    updateTask(task.id, { estimatedMinutes: est });
    if (!task.expanded) toggleExpand(task.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      draggable
      onDragStart={(e) => {
        const de = e as unknown as DragEvent;
        if (de.dataTransfer) {
          de.dataTransfer.setData("text/plain", task.id);
          de.dataTransfer.effectAllowed = "move";
        }
      }}
      className="rounded-2xl overflow-hidden group cursor-grab active:cursor-grabbing select-none transition-all"
      style={{
        border: `1px solid ${task.expanded ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`,
        background: task.expanded ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.02)",
      }}
    >
      <div className="flex items-start gap-2 px-5 py-4">
        <GripVertical size={11} className="text-zinc-800 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onOpenDetail(task); }}
        >
          <p className="text-sm text-zinc-200 leading-snug hover:text-white transition-colors" style={{ fontWeight: 450 }}>{task.text}</p>
          {task.projectId && (() => {
            const project = projects.find(p => p.id === task.projectId);
            return project ? (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px]">{project.emoji}</span>
                <span className="text-[11px] font-medium" style={{ color: project.color }}>{project.name}</span>
              </div>
            ) : null;
          })()}
          {task.estimatedMinutes && (
            <div className="flex items-center gap-1 mt-1">
              <Timer size={9} className="text-zinc-600" />
              <span className="text-xs text-zinc-600">~{task.estimatedMinutes} min</span>
            </div>
          )}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {task.tags.map((tag) => {
                const cfg = INCUP_TAGS.find((t) => t.tag === tag);
                return (
                  <span key={tag} className="text-[11px] px-2 py-0.5 rounded-lg font-medium"
                    style={{ color: cfg?.color, background: `${cfg?.color}12`, border: `1px solid ${cfg?.color}20` }}
                  >{tag}</span>
                );
              })}
            </div>
          )}
          {totalSteps > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${(doneCount / totalSteps) * 100}%`, background: "#4ade80" }} />
              </div>
              <span className="text-xs text-zinc-600 font-mono">{doneCount}/{totalSteps}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          {/* Magic Breakup button */}
          {task.microSteps.length === 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); handleMagicBreakup(); }}
              title="Magic Breakup — Découper en micro-étapes"
              className="text-zinc-700 hover:text-amber-300 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Sparkles size={12} />
            </button>
          )}
          <select
            value={task.status}
            onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
            onClick={(e) => e.stopPropagation()}
            className="text-xs bg-transparent border text-zinc-500 rounded-lg px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <button onClick={(e) => { e.stopPropagation(); toggleExpand(task.id); }} className="text-zinc-700 hover:text-zinc-400 transition-colors">
            {task.expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {task.expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-5 pb-4 pt-1.5 flex flex-col gap-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex flex-wrap gap-1.5">
                {INCUP_TAGS.map(({ tag, color }) => {
                  const active = task.tags.includes(tag);
                  return (
                    <button key={tag} onClick={() => toggleTag(task.id, tag)} className="text-[11px] px-2 py-0.5 rounded-lg font-medium transition-all"
                      style={{ color: active ? color : "#52525b", background: active ? `${color}12` : "transparent", border: `1px solid ${active ? color + "25" : "rgba(255,255,255,0.04)"}` }}
                    >{tag}</button>
                  );
                })}
              </div>
              {task.microSteps.map((ms) => (
                <div key={ms.id} className="flex items-center gap-2 group/ms">
                  <button onClick={() => toggleMicroStep(task.id, ms.id)} className="shrink-0 w-4 h-4 rounded-md border flex items-center justify-center transition-colors"
                    style={{ borderColor: ms.done ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.08)", background: ms.done ? "rgba(74,222,128,0.1)" : "transparent" }}
                  >{ms.done && <Check size={7} style={{ color: "#4ade80" }} strokeWidth={3} />}</button>
                  <span className="flex-1 text-xs" style={{ color: ms.done ? "#3f3f46" : "#a1a1aa", textDecoration: ms.done ? "line-through" : "none" }}>{ms.text}</span>
                  <button onClick={() => deleteMicroStep(task.id, ms.id)} className="opacity-0 group-hover/ms:opacity-100 text-zinc-700 hover:text-zinc-400"><X size={9} /></button>
                </div>
              ))}
              <form onSubmit={handleAddMicro} className="flex items-center gap-2">
                <input value={microInput} onChange={(e) => setMicroInput(e.target.value)} placeholder="+ micro-étape"
                  className="flex-1 text-xs bg-transparent border-b py-1 text-zinc-400 placeholder:text-zinc-700 focus:outline-none" style={{ borderColor: "rgba(255,255,255,0.04)" }} />
              </form>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onOpenDetail(task)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Ouvrir le détail →
                </button>
                <button onClick={() => deleteTask(task.id)} className="flex items-center gap-1.5 text-xs text-zinc-700 hover:text-red-300 transition-colors">
                  <Trash2 size={9} /> Supprimer
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Kanban Column ────────────────────────────────────────────────── */

function KanbanColumnComponent({ column, tasks, dragOverCol, onDragOver, onDrop, onDragLeave, onOpenDetail }: {
  column: KanbanColumn; tasks: Task[]; dragOverCol: TaskStatus | null;
  onDragOver: (colId: TaskStatus) => void; onDrop: (colId: TaskStatus, e: React.DragEvent) => void; onDragLeave: () => void;
  onOpenDetail: (task: Task) => void;
}) {
  const { addTask } = useAppStore();
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState("");
  const isOver = dragOverCol === column.id;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    addTask(input.trim(), column.id);
    setInput("");
    setAdding(false);
  };

  return (
    <div
      className="flex flex-col h-full min-w-0 transition-colors"
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; onDragOver(column.id); }}
      onDrop={(e) => { e.preventDefault(); onDrop(column.id, e); }}
      onDragLeave={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const { clientX, clientY } = e;
        if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
          onDragLeave();
        }
      }}
      style={{ background: isOver ? `${column.dotColor}08` : "transparent", borderRight: "1px solid rgba(255,255,255,0.03)" }}
    >
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 shrink-0">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: column.dotColor }} />
        <span className="text-sm font-medium text-zinc-300">{column.label}</span>
        <span className="text-[11px] text-zinc-700 font-mono ml-auto">{tasks.length}</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 flex flex-col gap-3.5">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => <KanbanCard key={task.id} task={task} onOpenDetail={onOpenDetail} />)}
        </AnimatePresence>

        {isOver && (
          <div className="rounded-2xl border-2 border-dashed h-12 flex items-center justify-center text-xs transition-all"
            style={{ borderColor: column.dotColor + "40", color: column.dotColor + "70", background: column.dotColor + "06" }}>
            Déposer ici
          </div>
        )}

        {adding ? (
          <form onSubmit={handleAdd} className="mt-1">
            <input value={input} onChange={(e) => setInput(e.target.value)} onBlur={() => { if (!input.trim()) setAdding(false); }} autoFocus
              placeholder="Nom de la tâche…"
              className="w-full text-sm rounded-2xl px-5 py-4 text-zinc-200 placeholder:text-zinc-700 focus:outline-none transition-colors"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            />
            <div className="flex gap-2 mt-2">
              <button type="submit" className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: "rgba(74,222,128,0.08)", color: "#4ade80" }}>Créer</button>
              <button type="button" onClick={() => setAdding(false)} className="text-xs px-3 py-1.5 text-zinc-600 hover:text-zinc-400">Annuler</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setAdding(true)} className="flex items-center gap-2 px-5 py-3.5 rounded-2xl text-[11px] text-zinc-600 hover:text-zinc-400 transition-all mt-1"
            style={{ border: "1px solid rgba(255,255,255,0.04)" }}>
            <Plus size={12} /> Nouveau
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Main Board ───────────────────────────────────────────────────── */

export default function KanbanBoard() {
  const { tasks, updateTaskStatus } = useAppStore();
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  const handleDrop = useCallback((colId: TaskStatus, e: React.DragEvent) => {
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      updateTaskStatus(taskId, colId);
    }
    setDragOverCol(null);
  }, [updateTaskStatus]);

  const kanbanTasks = tasks.filter((t) => ["todo", "in_progress", "completed", "saved"].includes(t.status));

  // Get fresh task data for the modal
  const currentDetailTask = detailTask ? tasks.find(t => t.id === detailTask.id) || null : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-7 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">Tâches</h1>
        <p className="text-xs text-zinc-600 mt-1">{kanbanTasks.length} tâches · Glisse pour changer le statut</p>
      </div>
      <div className="flex-1 min-h-0 overflow-x-auto">
        <div className="grid grid-cols-4 gap-0 h-full">
          {COLUMNS.map((col) => (
            <KanbanColumnComponent
              key={col.id}
              column={col}
              tasks={kanbanTasks.filter((t) => t.status === col.id)}
              dragOverCol={dragOverCol}
              onDragOver={(id) => setDragOverCol(id)}
              onDrop={handleDrop}
              onDragLeave={() => setDragOverCol(null)}
              onOpenDetail={(task) => setDetailTask(task)}
            />
          ))}
        </div>
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {currentDetailTask && (
          <TaskDetailModal task={currentDetailTask} onClose={() => setDetailTask(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}