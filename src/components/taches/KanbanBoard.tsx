"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, GripVertical, Check, Clock, Bookmark,
  ChevronDown, ChevronRight, X, Trash2,
  Sparkles, Timer, Flag,
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
  { id: "todo",        label: "To Do",      dotColor: "var(--accent-red)", Icon: Plus     },
  { id: "in_progress", label: "En cours",   dotColor: "var(--accent-blue)", Icon: Clock    },
  { id: "completed",   label: "Terminé",    dotColor: "var(--accent-green)", Icon: Check    },
  { id: "saved",       label: "Sauvegarde", dotColor: "var(--accent-orange)", Icon: Bookmark },
];
const INCUP_TAGS: { tag: IncupTag; color: string }[] = [
  { tag: "Intérêt",   color: "var(--accent-blue)" },
  { tag: "Nouveauté", color: "var(--accent-blue)" },
  { tag: "Challenge", color: "var(--accent-blue)" },
  { tag: "Urgence",   color: "var(--accent-blue)" },
  { tag: "Passion",   color: "var(--accent-blue)" },
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
  }  if (lower.includes("rapport") || lower.includes("document") || lower.includes("rédiger")) {
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
  const { updateTaskStatus, deleteTask, toggleTag, toggleExpand, addMicroStep, toggleMicroStep, deleteMicroStep, setMicroSteps, updateTask } = useAppStore();
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
      onDragStart={(e) => {        const de = e as unknown as DragEvent;
        if (de.dataTransfer) {
          de.dataTransfer.setData("text/plain", task.id);
          de.dataTransfer.effectAllowed = "move";
        }
      }}
      className="rounded-2xl overflow-hidden group cursor-grab active:cursor-grabbing select-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.05)] hover:-translate-y-[1px] bg-surface border border-b-primary"
    >
      <div className="flex items-start gap-2 px-5 py-4">
        <GripVertical size={11} className="text-b-hover mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); onOpenDetail(task); }}
        >
          <p className="text-[15px] text-t-primary leading-snug hover:text-[#000] transition-colors" style={{ fontWeight: 450 }}>{task.text}</p>
          {task.estimatedMinutes && (
            <div className="flex items-center gap-1 mt-1">
              <Timer size={9} className="text-t-secondary" />
              <span className="text-[9px] text-t-secondary">~{task.estimatedMinutes} min</span>
            </div>
          )}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {task.tags.map((tag) => {
                return (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-[6px] font-medium"
                    style={{ color: "var(--accent-blue)", background: "var(--accent-blue-light)" }}
                  >{tag}</span>
                );
              })}
            </div>
          )}          {totalSteps > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--border-b-primary)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${(doneCount / totalSteps) * 100}%`, background: "var(--accent-blue)" }} />
              </div>
              <span className="text-[9px] text-t-secondary font-mono">{doneCount}/{totalSteps}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          {/* Magic Breakup button */}
          {task.microSteps.length === 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); handleMagicBreakup(); }}
              title="Magic Breakup — Découper en micro-étapes"
              className="text-accent-blue hover:text-accent-blue/70 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Sparkles size={12} />
            </button>
          )}
          <select
            value={task.status}
            onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] bg-surface border text-t-secondary rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-b-primary shadow-sm"
          >
            {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <button onClick={(e) => { e.stopPropagation(); toggleExpand(task.id); }} className="text-t-secondary hover:text-t-primary transition-colors">
            {task.expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {task.expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-3 pt-1 flex flex-col gap-2.5 border-t-b-primary">
              <div className="flex flex-wrap gap-1.5">
                {INCUP_TAGS.map(({ tag }) => {
                  const active = task.tags.includes(tag);
                  return (
                    <button key={tag} onClick={() => toggleTag(task.id, tag)} className="text-[10px] px-2 py-1 rounded-[6px] font-medium transition-all"
                      style={{ color: active ? "var(--accent-blue)" : "var(--text-t-secondary)", background: active ? "var(--accent-blue-light)" : "var(--surface)", border: `1px solid ${active ? "transparent" : "var(--border-b-primary)"}` }}
                    >{tag}</button>
                  );
                })}
              </div>
              {task.microSteps.map((ms) => (
                <div key={ms.id} className="flex items-center gap-2 group/ms">
                  <button onClick={() => toggleMicroStep(task.id, ms.id)} className="shrink-0 w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-colors"
                    style={{ borderColor: ms.done ? "var(--accent-blue)" : "var(--border-b-hover)", background: ms.done ? "var(--accent-blue-light)" : "transparent" }}
                  >{ms.done && <Check size={7} style={{ color: "var(--accent-blue)" }} strokeWidth={3} />}</button>
                  <span className="flex-1 text-[10px]" style={{ color: ms.done ? "var(--text-t-secondary)" : "var(--text-t-primary)", textDecoration: ms.done ? "line-through" : "none" }}>{ms.text}</span>
                  <button onClick={() => deleteMicroStep(task.id, ms.id)} className="opacity-0 group-hover/ms:opacity-100 text-t-secondary hover:text-accent-red"><X size={9} /></button>
                </div>
              ))}              <form onSubmit={handleAddMicro} className="flex items-center gap-2">
                <input value={microInput} onChange={(e) => setMicroInput(e.target.value)} placeholder="+ micro-étape"
                  className="flex-1 text-[10px] bg-transparent border-b py-1 text-t-primary placeholder:text-t-tertiary focus:outline-none border-b-primary" />
              </form>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onOpenDetail(task)}
                  className="text-[10px] text-t-secondary hover:text-t-primary transition-colors"
                >
                  Ouvrir le détail →
                </button>
                <button onClick={() => deleteTask(task.id)} className="flex items-center gap-1.5 text-[10px] text-t-secondary hover:text-accent-red transition-colors">
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
}) {  const { addTask } = useAppStore();
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
      style={{ background: isOver ? `color-mix(in srgb, ${column.dotColor} 10%, transparent)` : "transparent", borderRight: "1px solid var(--surface-4)" }}
    >
      <div className="flex items-center gap-3 px-6 pt-8 pb-5 shrink-0">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: column.dotColor }} />        <span className="text-[17px] font-medium text-t-primary">{column.label}</span>
        <span className="text-[10px] text-t-secondary font-mono ml-auto">{tasks.length}</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 flex flex-col gap-2.5">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => <KanbanCard key={task.id} task={task} onOpenDetail={onOpenDetail} />)}
        </AnimatePresence>

        {isOver && (
          <div className="rounded-3xl border-2 border-dashed h-12 flex items-center justify-center text-[10px] transition-all"
            style={{ borderColor: column.dotColor, color: column.dotColor, background: `color-mix(in srgb, ${column.dotColor} 10%, transparent)` }}>
            Déposer ici
          </div>
        )}

        {adding ? (
          <form onSubmit={handleAdd} className="mt-1">
            <input value={input} onChange={(e) => setInput(e.target.value)} onBlur={() => { if (!input.trim()) setAdding(false); }} autoFocus
              placeholder="Nom de la tâche…"
              className="w-full text-sm rounded-2xl px-4 py-3 text-t-primary placeholder:text-t-tertiary focus:outline-none transition-all shadow-sm focus:shadow-md bg-surface border border-b-primary"
            />
            <div className="flex gap-2 mt-2">
              <button type="submit" className="text-[10px] px-3 py-1.5 rounded-lg font-medium" style={{ background: "var(--accent-blue-light)", color: "var(--accent-blue)" }}>Créer</button>
              <button type="button" onClick={() => setAdding(false)} className="text-[10px] px-3 py-1.5 text-t-secondary hover:text-t-primary">Annuler</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setAdding(true)} className="flex items-center gap-2 px-4 py-3 rounded-3xl text-[11px] text-t-secondary hover:text-t-primary transition-all mt-1 border-b-primary">
            <Plus size={12} /> Nouvelle tâche          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Main Board ───────────────────────────────────────────────────── */

export default function KanbanBoard() {
  const { tasks, updateTaskStatus, addTask } = useAppStore();
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [showPriorityAdd, setShowPriorityAdd] = useState(false);
  const [priorityInput, setPriorityInput] = useState("");

  const handleDrop = useCallback((colId: TaskStatus, e: React.DragEvent) => {
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      updateTaskStatus(taskId, colId);
    }
    setDragOverCol(null);
  }, [updateTaskStatus]);

  const kanbanTasks = tasks.filter((t) => ["todo", "in_progress", "completed", "saved"].includes(t.status));
  const todayCount = tasks.filter((t) => t.status === "today").length;

  const handleAddPriority = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priorityInput.trim()) return;    addTask(priorityInput.trim(), "today");
    setPriorityInput("");
    setShowPriorityAdd(false);
  };

  // Get fresh task data for the modal
  const currentDetailTask = detailTask ? tasks.find(t => t.id === detailTask.id) || null : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-10 pt-10 pb-6 border-b border-b-primary flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-t-primary tracking-tight">Tâches</h1>
          <p className="text-xs text-t-secondary mt-1">{kanbanTasks.length} tâches · Glisse pour changer le statut</p>
        </div>
        <div className="flex items-center gap-2">
          {showPriorityAdd ? (
            <form onSubmit={handleAddPriority} className="flex items-center gap-2">
              <input
                value={priorityInput}
                onChange={(e) => setPriorityInput(e.target.value)}
                placeholder="Nom de la tâche prioritaire…"
                autoFocus
                className="text-sm rounded-2xl px-4 py-2 text-t-primary placeholder:text-t-tertiary focus:outline-none bg-surface border-b-primary"
                style={{ border: "1px solid var(--border-b-primary)", minWidth: 220 }}
              />
              <button type="submit" className="text-[11px] px-3 py-2 rounded-xl font-medium text-white" style={{ background: "var(--accent-red)" }}>
                Ajouter
              </button>
              <button type="button" onClick={() => { setShowPriorityAdd(false); setPriorityInput(""); }} className="text-[11px] text-t-secondary hover:text-t-primary px-2 py-2">
                Annuler              </button>
              {todayCount >= 5 && (
                <span className="text-[10px] text-accent-orange font-medium">5/5 max</span>
              )}
            </form>
          ) : (
            <button
              onClick={() => setShowPriorityAdd(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl text-[12px] font-medium transition-all hover:scale-[1.02]"
              style={{ background: "color-mix(in srgb, var(--accent-red) 10%, transparent)", color: "var(--accent-red)", border: "1px solid color-mix(in srgb, var(--accent-red) 25%, transparent)" }}
            >
              <Flag size={13} /> Ajout prioritaire
            </button>
          )}
        </div>
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
          ))}        </div>
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