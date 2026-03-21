"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, GripVertical, Check, Clock, Bookmark,
  ChevronDown, ChevronRight, X, Trash2,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Task, TaskStatus, IncupTag } from "@/store/useAppStore";

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

function KanbanCard({ task }: { task: Task }) {
  const { updateTaskStatus, deleteTask, toggleTag, toggleExpand, addMicroStep, toggleMicroStep, deleteMicroStep } = useAppStore();
  const [microInput, setMicroInput] = useState("");
  const doneCount = task.microSteps.filter((ms) => ms.done).length;
  const totalSteps = task.microSteps.length;

  const handleAddMicro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!microInput.trim()) return;
    addMicroStep(task.id, microInput.trim());
    setMicroInput("");
  };

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
      draggable
      onDragStart={(e) => { (e as unknown as DragEvent).dataTransfer?.setData("text/plain", task.id); }}
      className="rounded-2xl overflow-hidden group cursor-grab active:cursor-grabbing select-none transition-all"
      style={{ border: `1px solid ${task.expanded ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`, background: task.expanded ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.02)" }}
    >
      <div className="flex items-start gap-2 px-4 py-3">
        <GripVertical size={11} className="text-zinc-800 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-200 leading-snug" style={{ fontWeight: 450 }}>{task.text}</p>
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {task.tags.map((tag) => {
                const cfg = INCUP_TAGS.find((t) => t.tag === tag);
                return (
                  <span key={tag} className="text-[9px] px-2 py-0.5 rounded-lg font-medium"
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
              <span className="text-[9px] text-zinc-600 font-mono">{doneCount}/{totalSteps}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <select value={task.status} onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)} onClick={(e) => e.stopPropagation()}
            className="text-[9px] bg-transparent border text-zinc-500 rounded-lg px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <button onClick={() => toggleExpand(task.id)} className="text-zinc-700 hover:text-zinc-400 transition-colors">
            {task.expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {task.expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-3 pt-1 flex flex-col gap-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex flex-wrap gap-1.5">
                {INCUP_TAGS.map(({ tag, color }) => {
                  const active = task.tags.includes(tag);
                  return (
                    <button key={tag} onClick={() => toggleTag(task.id, tag)} className="text-[9px] px-2 py-0.5 rounded-lg font-medium transition-all"
                      style={{ color: active ? color : "#52525b", background: active ? `${color}12` : "transparent", border: `1px solid ${active ? color + "25" : "rgba(255,255,255,0.04)"}` }}
                    >{tag}</button>
                  );
                })}
              </div>
              {task.microSteps.map((ms) => (
                <div key={ms.id} className="flex items-center gap-2 group/ms">
                  <button onClick={() => toggleMicroStep(task.id, ms.id)} className="shrink-0 w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-colors"
                    style={{ borderColor: ms.done ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.08)", background: ms.done ? "rgba(74,222,128,0.1)" : "transparent" }}
                  >{ms.done && <Check size={7} style={{ color: "#4ade80" }} strokeWidth={3} />}</button>
                  <span className="flex-1 text-[10px]" style={{ color: ms.done ? "#3f3f46" : "#a1a1aa", textDecoration: ms.done ? "line-through" : "none" }}>{ms.text}</span>
                  <button onClick={() => deleteMicroStep(task.id, ms.id)} className="opacity-0 group-hover/ms:opacity-100 text-zinc-700 hover:text-zinc-400"><X size={9} /></button>
                </div>
              ))}
              <form onSubmit={handleAddMicro} className="flex items-center gap-2">
                <input value={microInput} onChange={(e) => setMicroInput(e.target.value)} placeholder="+ micro-étape"
                  className="flex-1 text-[10px] bg-transparent border-b py-1 text-zinc-400 placeholder:text-zinc-700 focus:outline-none" style={{ borderColor: "rgba(255,255,255,0.04)" }} />
              </form>
              <button onClick={() => deleteTask(task.id)} className="flex items-center gap-1.5 text-[10px] text-zinc-700 hover:text-red-300 transition-colors self-end">
                <Trash2 size={9} /> Supprimer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function KanbanColumnComponent({ column, tasks, dragOverCol, onDragOver, onDrop, onDragLeave }: {
  column: KanbanColumn; tasks: Task[]; dragOverCol: TaskStatus | null;
  onDragStart: (id: string) => void; onDragOver: (colId: TaskStatus) => void; onDrop: (colId: TaskStatus) => void; onDragLeave: () => void;
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
    <div className="flex flex-col h-full min-w-0 transition-colors"
      onDragOver={(e) => { e.preventDefault(); onDragOver(column.id); }}
      onDrop={(e) => { e.preventDefault(); onDrop(column.id); }}
      onDragLeave={onDragLeave}
      style={{ background: isOver ? `${column.dotColor}06` : "transparent" }}
    >
      <div className="flex items-center gap-3 px-6 pt-6 pb-4 shrink-0">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: column.dotColor }} />
        <span className="text-sm font-medium text-zinc-300">{column.label}</span>
        <span className="text-[10px] text-zinc-700 font-mono ml-auto">{tasks.length}</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 flex flex-col gap-2.5">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => <KanbanCard key={task.id} task={task} />)}
        </AnimatePresence>

        {isOver && (
          <div className="rounded-2xl border-2 border-dashed h-12 flex items-center justify-center text-[10px]"
            style={{ borderColor: column.dotColor + "40", color: column.dotColor + "70" }}>Déposer ici</div>
        )}

        {adding ? (
          <form onSubmit={handleAdd} className="mt-1">
            <input value={input} onChange={(e) => setInput(e.target.value)} onBlur={() => { if (!input.trim()) setAdding(false); }} autoFocus
              placeholder="Nom de la tâche…"
              className="w-full text-sm rounded-2xl px-4 py-3 text-zinc-200 placeholder:text-zinc-700 focus:outline-none transition-colors"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            />
            <div className="flex gap-2 mt-2">
              <button type="submit" className="text-[10px] px-3 py-1.5 rounded-lg font-medium" style={{ background: "rgba(74,222,128,0.08)", color: "#4ade80" }}>Créer</button>
              <button type="button" onClick={() => setAdding(false)} className="text-[10px] px-3 py-1.5 text-zinc-600 hover:text-zinc-400">Annuler</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setAdding(true)} className="flex items-center gap-2 px-4 py-3 rounded-2xl text-[11px] text-zinc-600 hover:text-zinc-400 transition-all mt-1"
            style={{ border: "1px solid rgba(255,255,255,0.04)" }}>
            <Plus size={12} /> Nouveau
          </button>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const { tasks, updateTaskStatus } = useAppStore();
  const draggedIdRef = useRef<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  const handleDragStart = (id: string) => { draggedIdRef.current = id; };
  const handleDrop = (colId: TaskStatus) => {
    if (draggedIdRef.current) { updateTaskStatus(draggedIdRef.current, colId); draggedIdRef.current = null; }
    setDragOverCol(null);
  };

  const kanbanTasks = tasks.filter((t) => ["todo", "in_progress", "completed", "saved"].includes(t.status));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-7 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">Tâches</h1>
        <p className="text-xs text-zinc-600 mt-1">{kanbanTasks.length} tâches · Glisse pour changer le statut</p>
      </div>
      <div className="flex-1 min-h-0 overflow-x-auto">
        <div className="grid grid-cols-4 gap-0 h-full" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          {COLUMNS.map((col) => (
            <KanbanColumnComponent key={col.id} column={col}
              tasks={kanbanTasks.filter((t) => t.status === col.id)}
              dragOverCol={dragOverCol}
              onDragStart={handleDragStart}
              onDragOver={(id) => setDragOverCol(id)}
              onDrop={handleDrop}
              onDragLeave={() => setDragOverCol(null)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}