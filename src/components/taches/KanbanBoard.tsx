"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, GripVertical, Check, Clock, Bookmark,
  ChevronDown, ChevronRight, X, Trash2,
  Sparkles, Timer, FolderKanban,
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
  { id: "todo",        label: "To Do",      dotColor: "#71717a", Icon: Plus     },
  { id: "in_progress", label: "En cours",   dotColor: "#a1a1aa", Icon: Clock    },
  { id: "completed",   label: "Terminé",    dotColor: "#4ade80", Icon: Check    },
  { id: "saved",       label: "Sauvegarde", dotColor: "#fbbf24", Icon: Bookmark },
];

const INCUP_TAGS: { tag: IncupTag; dot: string; label: string }[] = [
  { tag: "Intérêt",   dot: "#22d3ee", label: "Intérêt" },
  { tag: "Nouveauté", dot: "#a78bfa", label: "Nouveauté" },
  { tag: "Challenge", dot: "#fbbf24", label: "Challenge" },
  { tag: "Urgence",   dot: "#fb7185", label: "Urgence" },
  { tag: "Passion",   dot: "#4ade80", label: "Passion" },
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

/* ─── Kanban Card — Apple/Linear aesthetic ──────────────────────────── */

function KanbanCard({ task, onOpenDetail }: { task: Task; onOpenDetail: (task: Task) => void }) {
  const { updateTaskStatus, deleteTask, toggleTag, toggleExpand, addMicroStep, toggleMicroStep, deleteMicroStep, setMicroSteps, updateTask, projects } = useAppStore();
  const [microInput, setMicroInput] = useState("");
  const doneCount = task.microSteps.filter((ms) => ms.done).length;
  const totalSteps = task.microSteps.length;
  const isCompleted = task.status === "completed";
  const taskProject = projects.find((p) => p.id === task.projectId);

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
      animate={{
        opacity: isCompleted ? 0.5 : 1,
        scale: isCompleted ? 0.97 : 1,
      }}
      exit={{ opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.3 } }}
      transition={{ duration: 0.25, ease: "easeOut" as const }}
      draggable
      onDragStart={(e) => {
        const de = e as unknown as DragEvent;
        if (de.dataTransfer) {
          de.dataTransfer.setData("text/plain", task.id);
          de.dataTransfer.effectAllowed = "move";
        }
      }}
      className="rounded-2xl overflow-hidden group cursor-grab active:cursor-grabbing select-none"
      style={{
        background: task.expanded ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.02)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${task.expanded ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`,
      }}
    >
      <div className="flex items-start gap-2.5 px-5 py-4">
        <GripVertical size={11} className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "rgba(255,255,255,0.12)" }} />
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onOpenDetail(task); }}
        >
          {/* Project name — Pourquoi context */}
          {taskProject && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <FolderKanban size={9} style={{ color: taskProject.color, opacity: 0.6 }} />
              <span className="text-[9px] font-medium tracking-wide" style={{ color: taskProject.color, opacity: 0.6 }}>
                {taskProject.emoji} {taskProject.name}
              </span>
            </div>
          )}
          <p className="text-[13px] leading-snug hover:text-white transition-colors" style={{ color: isCompleted ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.88)", fontWeight: 450, textDecoration: isCompleted ? "line-through" : "none" }}>{task.text}</p>
          {task.estimatedMinutes && (
            <div className="flex items-center gap-1 mt-1.5">
              <Timer size={9} style={{ color: "rgba(255,255,255,0.2)" }} />
              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>~{task.estimatedMinutes} min</span>
            </div>
          )}
          {/* Monochrome tags with colored dots */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {task.tags.map((tag) => {
                const cfg = INCUP_TAGS.find((t) => t.tag === tag);
                return (
                  <span key={tag} className="text-[9px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1.5"
                    style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg?.dot }} />
                    {tag}
                  </span>
                );
              })}
            </div>
          )}
          {totalSteps > 0 && (
            <div className="flex items-center gap-2 mt-2.5">
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${(doneCount / totalSteps) * 100}%`, background: "rgba(255,255,255,0.25)" }} />
              </div>
              <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>{doneCount}/{totalSteps}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          {task.microSteps.length === 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); handleMagicBreakup(); }}
              title="Magic Breakup — Découper en micro-étapes"
              className="opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              <Sparkles size={12} />
            </button>
          )}
          <select
            value={task.status}
            onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
            onClick={(e) => e.stopPropagation()}
            className="text-[9px] bg-transparent border rounded-md px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            style={{ borderColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}
          >
            {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <button onClick={(e) => { e.stopPropagation(); toggleExpand(task.id); }} style={{ color: "rgba(255,255,255,0.2)" }} className="hover:text-white/50 transition-colors">
            {task.expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {task.expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-5 pb-4 pt-2 flex flex-col gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              {/* Monochrome INCUP tags with dot */}
              <div className="flex flex-wrap gap-1.5">
                {INCUP_TAGS.map(({ tag, dot }) => {
                  const active = task.tags.includes(tag);
                  return (
                    <button key={tag} onClick={() => toggleTag(task.id, tag)} className="text-[9px] px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5"
                      style={{
                        color: active ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
                        background: active ? "rgba(255,255,255,0.06)" : "transparent",
                        border: `1px solid ${active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)"}`,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? dot : "rgba(255,255,255,0.12)" }} />
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Project selector */}
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[9px] font-medium self-center mr-1" style={{ color: "rgba(255,255,255,0.2)" }}>Projet:</span>
                {projects.filter(p => p.status === "active").map((p) => (
                  <button key={p.id} onClick={() => updateTask(task.id, { projectId: task.projectId === p.id ? undefined : p.id })}
                    className="text-[9px] px-2 py-0.5 rounded-md font-medium transition-all"
                    style={{
                      color: task.projectId === p.id ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
                      background: task.projectId === p.id ? "rgba(255,255,255,0.06)" : "transparent",
                      border: `1px solid ${task.projectId === p.id ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)"}`,
                    }}
                  >{p.emoji} {p.name}</button>
                ))}
              </div>

              {task.microSteps.map((ms) => (
                <div key={ms.id} className="flex items-center gap-2 group/ms">
                  <button onClick={() => toggleMicroStep(task.id, ms.id)} className="shrink-0 w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-colors"
                    style={{ borderColor: ms.done ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)", background: ms.done ? "rgba(255,255,255,0.06)" : "transparent" }}
                  >{ms.done && <Check size={7} style={{ color: "rgba(255,255,255,0.4)" }} strokeWidth={3} />}</button>
                  <span className="flex-1 text-[10px]" style={{ color: ms.done ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.45)", textDecoration: ms.done ? "line-through" : "none" }}>{ms.text}</span>
                  <button onClick={() => deleteMicroStep(task.id, ms.id)} className="opacity-0 group-hover/ms:opacity-100" style={{ color: "rgba(255,255,255,0.15)" }}><X size={9} /></button>
                </div>
              ))}
              <form onSubmit={handleAddMicro} className="flex items-center gap-2">
                <input value={microInput} onChange={(e) => setMicroInput(e.target.value)} placeholder="+ micro-étape"
                  className="flex-1 text-[10px] bg-transparent border-b py-1 placeholder:text-zinc-700 focus:outline-none" style={{ borderColor: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.35)" }} />
              </form>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onOpenDetail(task)}
                  className="text-[10px] hover:text-white/40 transition-colors"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                >
                  Détail →
                </button>
                <button onClick={() => deleteTask(task.id)} className="flex items-center gap-1.5 text-[10px] hover:text-red-300/60 transition-colors" style={{ color: "rgba(255,255,255,0.15)" }}>
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

/* ─── Kanban Column — More breathing room ────────────────────────────── */

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
      style={{
        background: isOver ? "rgba(255,255,255,0.02)" : "transparent",
        borderRight: "1px solid rgba(255,255,255,0.03)",
      }}
    >
      {/* Column header — extra breathing room */}
      <div className="flex items-center gap-3 px-6 pt-7 pb-5 shrink-0">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: column.dotColor, opacity: 0.5 }} />
        <span className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{column.label}</span>
        <span className="text-[10px] font-mono ml-auto" style={{ color: "rgba(255,255,255,0.15)" }}>{tasks.length}</span>
      </div>

      {/* Cards — increased gap for negative space */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-6 flex flex-col gap-3.5">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => <KanbanCard key={task.id} task={task} onOpenDetail={onOpenDetail} />)}
        </AnimatePresence>

        {isOver && (
          <div className="rounded-2xl border-2 border-dashed h-14 flex items-center justify-center text-[10px] transition-all"
            style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.01)" }}>
            Déposer ici
          </div>
        )}

        {adding ? (
          <form onSubmit={handleAdd} className="mt-1">
            <input value={input} onChange={(e) => setInput(e.target.value)} onBlur={() => { if (!input.trim()) setAdding(false); }} autoFocus
              placeholder="Nom de la tâche…"
              className="w-full text-[13px] rounded-2xl px-5 py-3.5 placeholder:text-zinc-700 focus:outline-none transition-colors"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.8)" }}
            />
            <div className="flex gap-2 mt-2.5">
              <button type="submit" className="text-[10px] px-3.5 py-1.5 rounded-lg font-medium" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>Créer</button>
              <button type="button" onClick={() => setAdding(false)} className="text-[10px] px-3 py-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>Annuler</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setAdding(true)} className="flex items-center gap-2 px-5 py-3.5 rounded-2xl text-[11px] transition-all mt-1"
            style={{ border: "1px solid rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)" }}>
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

  const currentDetailTask = detailTask ? tasks.find(t => t.id === detailTask.id) || null : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-7 pt-7 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <h1 className="text-[17px] font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>Tâches</h1>
        <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>{kanbanTasks.length} tâches · Glisse pour changer le statut</p>
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

      <AnimatePresence>
        {currentDetailTask && (
          <TaskDetailModal task={currentDetailTask} onClose={() => setDetailTask(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
