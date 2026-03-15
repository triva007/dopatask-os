"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, GripVertical, Check, Clock, Bookmark,
  ChevronDown, ChevronRight, X, Trash2,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Task, TaskStatus, IncupTag } from "@/store/useAppStore";

// ─── Colonnes Kanban ──────────────────────────────────────────────────────────

interface KanbanColumn {
  id: TaskStatus;
  label: string;
  dotColor: string;
  Icon: typeof Clock;
}

const COLUMNS: KanbanColumn[] = [
  { id: "todo",        label: "To Do",      dotColor: "#ef4444", Icon: Plus     },
  { id: "in_progress", label: "En cours",   dotColor: "#3b82f6", Icon: Clock    },
  { id: "completed",   label: "Terminé",    dotColor: "#22c55e", Icon: Check    },
  { id: "saved",       label: "Sauvegarde", dotColor: "#f59e0b", Icon: Bookmark },
];

// ─── INCUP tags ───────────────────────────────────────────────────────────────

const INCUP_TAGS: { tag: IncupTag; color: string }[] = [
  { tag: "Intérêt",   color: "#06b6d4" },
  { tag: "Nouveauté", color: "#7c3aed" },
  { tag: "Challenge", color: "#f59e0b" },
  { tag: "Urgence",   color: "#ef4444" },
  { tag: "Passion",   color: "#22c55e" },
];

// ─── Task Card (avec drag natif HTML5) ───────────────────────────────────────

function KanbanCard({
  task,
  onDragStart,
}: {
  task: Task;
  onDragStart: (id: string) => void;
}) {
  const {
    updateTaskStatus, deleteTask, toggleTag,
    toggleExpand, addMicroStep, toggleMicroStep, deleteMicroStep,
  } = useAppStore();
  const [microInput, setMicroInput] = useState("");

  const doneCount  = task.microSteps.filter((ms) => ms.done).length;
  const totalSteps = task.microSteps.length;

  const handleAddMicro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!microInput.trim()) return;
    addMicroStep(task.id, microInput.trim());
    setMicroInput("");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      draggable
      onDragStart={(e) => {
        (e as unknown as DragEvent).dataTransfer?.setData("text/plain", task.id);
        onDragStart(task.id);
      }}
      className="rounded-xl border overflow-hidden group cursor-grab active:cursor-grabbing select-none"
      style={{
        borderColor: task.expanded ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
        background: task.expanded ? "#131316" : "#0f0f12",
      }}
    >
      {/* Main row */}
      <div className="flex items-start gap-2 px-3 py-2.5">
        <GripVertical
          size={12}
          className="text-zinc-700 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        />

        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-200 leading-snug">{task.text}</p>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {task.tags.map((tag) => {
                const cfg = INCUP_TAGS.find((t) => t.tag === tag);
                return (
                  <span
                    key={tag}
                    className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                    style={{
                      color: cfg?.color,
                      background: `${cfg?.color}15`,
                      border: `1px solid ${cfg?.color}25`,
                    }}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          )}

          {/* Micro-étapes progress */}
          {totalSteps > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-dopa-cyan transition-all"
                  style={{ width: `${(doneCount / totalSteps) * 100}%` }}
                />
              </div>
              <span className="text-[9px] text-zinc-600 font-mono">{doneCount}/{totalSteps}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          {/* Move via select (fallback) */}
          <select
            value={task.status}
            onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
            onClick={(e) => e.stopPropagation()}
            className="text-[9px] bg-zinc-800 border border-zinc-700 text-zinc-400 rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            {COLUMNS.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <button
            onClick={() => toggleExpand(task.id)}
            className="text-zinc-700 hover:text-zinc-500 transition-colors"
          >
            {task.expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      <AnimatePresence>
        {task.expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2.5 pt-0.5 flex flex-col gap-2 border-t border-zinc-800/50">
              {/* Tags INCUP */}
              <div className="flex flex-wrap gap-1">
                {INCUP_TAGS.map(({ tag, color }) => {
                  const active = task.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(task.id, tag)}
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold transition-all"
                      style={{
                        color: active ? color : "#52525b",
                        background: active ? `${color}15` : "transparent",
                        border: `1px solid ${active ? color + "30" : "#27272a"}`,
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Micro-étapes */}
              {task.microSteps.map((ms) => (
                <div key={ms.id} className="flex items-center gap-2 group/ms">
                  <button
                    onClick={() => toggleMicroStep(task.id, ms.id)}
                    className="shrink-0 w-3 h-3 rounded border border-zinc-700 hover:border-dopa-green flex items-center justify-center"
                    style={{ background: ms.done ? "rgba(34,197,94,0.15)" : "transparent" }}
                  >
                    {ms.done && <Check size={7} className="text-dopa-green" strokeWidth={3} />}
                  </button>
                  <span
                    className="flex-1 text-[10px]"
                    style={{
                      color: ms.done ? "#52525b" : "#a1a1aa",
                      textDecoration: ms.done ? "line-through" : "none",
                    }}
                  >
                    {ms.text}
                  </span>
                  <button
                    onClick={() => deleteMicroStep(task.id, ms.id)}
                    className="opacity-0 group-hover/ms:opacity-100 text-zinc-700 hover:text-zinc-500"
                  >
                    <X size={9} />
                  </button>
                </div>
              ))}

              {/* Add micro-step */}
              <form onSubmit={handleAddMicro} className="flex items-center gap-1.5">
                <input
                  value={microInput}
                  onChange={(e) => setMicroInput(e.target.value)}
                  placeholder="+ micro-étape"
                  className="flex-1 text-[10px] bg-transparent border-b border-zinc-800 focus:border-zinc-600 focus:outline-none text-zinc-400 placeholder:text-zinc-700 py-0.5"
                />
              </form>

              {/* Delete */}
              <button
                onClick={() => deleteTask(task.id)}
                className="flex items-center gap-1 text-[10px] text-zinc-700 hover:text-red-400 transition-colors self-end mt-0.5"
              >
                <Trash2 size={9} /> Supprimer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Kanban Column (avec drop zone) ──────────────────────────────────────────

function KanbanColumnComponent({
  column,
  tasks,
  dragOverCol,
  onDragOver,
  onDrop,
  onDragLeave,
}: {
  column: KanbanColumn;
  tasks: Task[];
  dragOverCol: TaskStatus | null;
  onDragStart: (id: string) => void;
  onDragOver: (colId: TaskStatus) => void;
  onDrop: (colId: TaskStatus) => void;
  onDragLeave: () => void;
}) {
  const { addTask } = useAppStore();
  const [adding, setAdding] = useState(false);
  const [input, setInput]   = useState("");
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
      onDragOver={(e) => { e.preventDefault(); onDragOver(column.id); }}
      onDrop={(e) => { e.preventDefault(); onDrop(column.id); }}
      onDragLeave={onDragLeave}
      style={{
        background: isOver ? `${column.dotColor}08` : "transparent",
        outline: isOver ? `1px solid ${column.dotColor}30` : "none",
        transition: "background 0.15s, outline 0.15s",
      }}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-3 shrink-0">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: column.dotColor }} />
        <span className="text-xs font-semibold text-zinc-300">{column.label}</span>
        <span className="text-[10px] text-zinc-600 font-mono ml-auto">{tasks.length}</span>
      </div>

      {/* Cards */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 flex flex-col gap-1.5">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onDragStart={() => {}}
            />
          ))}
        </AnimatePresence>

        {/* Drop hint */}
        {isOver && (
          <div
            className="rounded-xl border-2 border-dashed h-12 flex items-center justify-center text-[10px] mt-1"
            style={{ borderColor: column.dotColor + "50", color: column.dotColor + "80" }}
          >
            Déposer ici
          </div>
        )}

        {/* Add task */}
        {adding ? (
          <form onSubmit={handleAdd} className="mt-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onBlur={() => { if (!input.trim()) setAdding(false); }}
              autoFocus
              placeholder="Nom de la tâche…"
              className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 placeholder:text-zinc-700 focus:border-zinc-600 focus:outline-none"
            />
            <div className="flex gap-1.5 mt-1.5">
              <button
                type="submit"
                className="text-[10px] px-2 py-1 rounded bg-dopa-green/10 text-dopa-green font-semibold hover:bg-dopa-green/20 transition-colors"
              >
                Créer
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="text-[10px] px-2 py-1 text-zinc-600 hover:text-zinc-400"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/50 transition-colors mt-0.5"
          >
            <Plus size={11} />
            Créer projet
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Board ───────────────────────────────────────────────────────────────

export default function KanbanBoard() {
  const { tasks, updateTaskStatus } = useAppStore();
  const draggedIdRef = useRef<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  const handleDragStart = (id: string) => {
    draggedIdRef.current = id;
  };

  const handleDragOver = (colId: TaskStatus) => {
    setDragOverCol(colId);
  };

  const handleDrop = (colId: TaskStatus) => {
    if (draggedIdRef.current) {
      updateTaskStatus(draggedIdRef.current, colId);
      draggedIdRef.current = null;
    }
    setDragOverCol(null);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const kanbanTasks = tasks.filter((t) =>
    ["todo", "in_progress", "completed", "saved"].includes(t.status)
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 pt-5 pb-3 border-b border-zinc-900">
        <h1 className="text-lg font-bold text-zinc-100 tracking-tight">Gestion des Tâches</h1>
        <p className="text-xs text-zinc-600 mt-0.5">
          Board Kanban · {kanbanTasks.length} tâches · Glisse une carte pour changer son statut
        </p>
      </div>

      {/* Kanban grid */}
      <div className="flex-1 min-h-0 overflow-x-auto">
        <div className="grid grid-cols-4 gap-0 h-full divide-x divide-zinc-900">
          {COLUMNS.map((col) => (
            <KanbanColumnComponent
              key={col.id}
              column={col}
              tasks={kanbanTasks.filter((t) => t.status === col.id)}
              dragOverCol={dragOverCol}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragLeave={handleDragLeave}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
