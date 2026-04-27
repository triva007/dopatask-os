"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Check,
  ChevronDown, X, Trash2, Sparkles, Timer, Flag, Search,
  SlidersHorizontal, ArrowUpDown, MoreHorizontal,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Task, TaskStatus, IncupTag } from "@/store/useAppStore";
import TaskDetailModal from "./TaskDetailModal";

/* ─── Columns ──────────────────────────────────────────────────────── */

interface KanbanColumn {
  id: TaskStatus;
  label: string;
  accent: string;
  accentSoft: string;
}

const COLUMNS: KanbanColumn[] = [
  { id: "todo",        label: "À faire",    accent: "var(--accent-red)",    accentSoft: "var(--accent-red-light)"    },
  { id: "in_progress", label: "En cours",   accent: "var(--accent-blue)",   accentSoft: "var(--accent-blue-light)"   },
  { id: "completed",   label: "Terminé",    accent: "var(--accent-green)",  accentSoft: "var(--accent-green-light)"  },
  { id: "saved",       label: "Sauvegarde", accent: "var(--accent-orange)", accentSoft: "var(--accent-orange-light)" },
];

const INCUP_COLORS: Record<IncupTag, string> = {
  "Intérêt":   "var(--accent-cyan)",
  "Nouveauté": "var(--accent-purple)",
  "Challenge": "var(--accent-orange)",
  "Urgence":   "var(--accent-red)",
  "Passion":   "var(--accent-green)",
};

const INCUP_LIGHT: Record<IncupTag, string> = {
  "Intérêt":   "var(--accent-cyan-light, rgba(95, 163, 184, 0.12))",
  "Nouveauté": "var(--accent-purple-light)",
  "Challenge": "var(--accent-orange-light)",
  "Urgence":   "var(--accent-red-light)",
  "Passion":   "var(--accent-green-light)",
};

type SortOption = "date" | "priority" | "time";

/* ─── Magic Breakup ────────────────────────────────────────────────── */

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

/* ─── Card ─────────────────────────────────────────────────────────── */

interface KanbanCardProps {
  task: Task;
  onOpenDetail: (task: Task) => void;
  isSelected: boolean;
  onSelect: (taskId: string) => void;
  accent: string;
}

function KanbanCard({ task, onOpenDetail, isSelected, onSelect, accent }: KanbanCardProps) {
  const { updateTaskStatus, deleteTask, setMicroSteps, updateTask } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const doneCount = task.microSteps.filter((ms) => ms.done).length;
  const totalSteps = task.microSteps.length;
  const progress = totalSteps > 0 ? (doneCount / totalSteps) * 100 : 0;
  const isDone = task.status === "completed";

  const handleMagicBreakup = (e: React.MouseEvent) => {
    e.stopPropagation();
    const steps = generateMicroSteps(task.text);
    setMicroSteps(task.id, steps);
    if (!task.estimatedMinutes) {
      updateTask(task.id, { estimatedMinutes: estimateMinutes(task.text) });
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      draggable
      onDragStart={(e) => {
        setIsDragging(true);
        const de = e as unknown as DragEvent;
        if (de.dataTransfer) {
          de.dataTransfer.setData("text/plain", task.id);
          de.dataTransfer.effectAllowed = "move";
        }
      }}
      onDragEnd={() => setIsDragging(false)}
      onClick={() => onOpenDetail(task)}
      className="group relative cursor-grab active:cursor-grabbing rounded-lg bg-[var(--card-bg)] border transition-colors duration-150 hover:bg-[var(--surface-2)]"
      style={{
        borderColor: isSelected ? accent : "var(--border-primary)",
        boxShadow: isSelected ? `0 0 0 1px ${accent}` : "none",
      }}
    >

      <div className="px-4 py-3.5 flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(task.id); }}
          className="shrink-0 mt-[2px] w-[18px] h-[18px] rounded-md border flex items-center justify-center transition-all"
          style={{
            borderColor: isSelected ? accent : "var(--checkbox-border)",
            background: isSelected ? accent : "transparent",
          }}
          aria-label="Sélectionner"
        >
          {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
        </button>

        {/* Body */}
        <div className="flex-1 min-w-0">
          <p
            className="text-[14px] leading-snug text-[var(--text-primary)] break-words"
            style={{
              fontWeight: 500,
              textDecoration: isDone ? "line-through" : "none",
              opacity: isDone ? 0.55 : 1,
            }}
          >
            {task.text}
          </p>

          {/* Meta row */}
          {(task.estimatedMinutes || task.tags.length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {task.estimatedMinutes && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] tabular-nums">
                  <Timer size={10} strokeWidth={2} />
                  {task.estimatedMinutes}m
                </span>
              )}
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-[2px] rounded-md font-medium tracking-wide"
                  style={{
                    color: INCUP_COLORS[tag as IncupTag],
                    background: INCUP_LIGHT[tag as IncupTag],
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Progress */}
          {totalSteps > 0 && (
            <div className="flex items-center gap-2 mt-2.5">
              <div
                className="flex-1 h-[3px] rounded-full overflow-hidden"
                style={{ background: "var(--surface-3)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: accent }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
              <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums font-mono">
                {doneCount}/{totalSteps}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          {task.microSteps.length === 0 && (
            <button
              onClick={handleMagicBreakup}
              title="Découper en micro-étapes"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--accent-blue)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <Sparkles size={13} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
            aria-label="Actions"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Inline menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-2 top-12 z-20 bg-[var(--card-bg)] border border-[var(--border-primary)] rounded-xl overflow-hidden"
            style={{ boxShadow: "var(--shadow-elevated)" }}
          >
            <div className="py-1.5 min-w-[160px]">
              <div className="px-3 pt-1 pb-1 text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">
                Déplacer vers
              </div>
              {COLUMNS.filter((c) => c.id !== task.status).map((c) => (
                <button
                  key={c.id}
                  onClick={() => { updateTaskStatus(task.id, c.id); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-[12px] text-[var(--text-primary)] hover:bg-[var(--surface-2)] flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.accent }} />
                  {c.label}
                </button>
              ))}
              <div className="h-px bg-[var(--border-primary)] my-1" />
              <button
                onClick={() => { deleteTask(task.id); setMenuOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-[12px] text-[var(--accent-red)] hover:bg-[var(--surface-2)] flex items-center gap-2"
              >
                <Trash2 size={11} /> Supprimer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Column ───────────────────────────────────────────────────────── */

interface KanbanColumnComponentProps {
  column: KanbanColumn;
  tasks: Task[];
  dragOverCol: TaskStatus | null;
  onDragOver: (colId: TaskStatus) => void;
  onDrop: (colId: TaskStatus, e: React.DragEvent) => void;
  onDragLeave: () => void;
  onOpenDetail: (task: Task) => void;
  selectedTasks: Set<string>;
  onSelectTask: (taskId: string) => void;
}

function KanbanColumnComponent({
  column,
  tasks,
  dragOverCol,
  onDragOver,
  onDrop,
  onDragLeave,
  onOpenDetail,
  selectedTasks,
  onSelectTask,
}: KanbanColumnComponentProps) {
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
      className="flex flex-col min-w-0 h-full rounded-xl transition-colors"
      style={{
        background: isOver
          ? `color-mix(in srgb, ${column.accent} 6%, var(--surface-1))`
          : "var(--surface-1)",
        boxShadow: isOver ? `inset 0 0 0 1.5px ${column.accent}` : `inset 0 0 0 1px var(--border-primary)`,
      }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; onDragOver(column.id); }}
      onDrop={(e) => { e.preventDefault(); onDrop(column.id, e); }}
      onDragLeave={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const { clientX, clientY } = e;
        if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
          onDragLeave();
        }
      }}
    >
      {/* Column header — Notion-style status pill */}
      <div className="shrink-0 px-3 pt-5 pb-3 flex items-center gap-2">
        <span
          className="inline-flex items-center text-[12px] font-medium px-2 py-[3px] rounded-md tracking-tight"
          style={{ background: column.accentSoft, color: column.accent }}
        >
          {column.label}
        </span>
        <motion.span
          key={tasks.length}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="text-[12px] font-medium text-[var(--text-tertiary)] tabular-nums"
        >
          {tasks.length}
        </motion.span>

        <button
          onClick={() => setAdding(true)}
          className="ml-auto w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
          aria-label="Nouvelle tâche"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Column body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-4 flex flex-col gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              accent={column.accent}
              onOpenDetail={onOpenDetail}
              isSelected={selectedTasks.has(task.id)}
              onSelect={onSelectTask}
            />
          ))}
        </AnimatePresence>

        {/* Add task inline */}
        {adding ? (
          <form onSubmit={handleAdd} className="mt-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onBlur={() => { if (!input.trim()) setAdding(false); }}
              onKeyDown={(e) => { if (e.key === "Escape") { setAdding(false); setInput(""); } }}
              autoFocus
              placeholder="Nouvelle tâche…"
              className="w-full text-[13px] rounded-xl px-3.5 py-2.5 bg-[var(--card-bg)] border text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none transition-all"
              style={{ borderColor: column.accent, boxShadow: `0 0 0 3px ${column.accentSoft}` }}
            />
          </form>
        ) : tasks.length === 0 ? (
          <button
            onClick={() => setAdding(true)}
            className="mt-1 w-full rounded-xl border border-dashed py-4 text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-colors"
            style={{ borderColor: "var(--border-primary)" }}
          >
            Glisse une tâche ici
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ─── Main Board ───────────────────────────────────────────────────── */

export default function KanbanBoard() {
  const { tasks, updateTaskStatus, addTask, deleteTask, projects } = useAppStore();
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [showPriorityAdd, setShowPriorityAdd] = useState(false);
  const [priorityInput, setPriorityInput] = useState("");

  // Filter state
  const [searchText, setSearchText] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedIncupTag, setSelectedIncupTag] = useState<IncupTag | "">("");
  const [selectedPriority, setSelectedPriority] = useState<"low" | "medium" | "high" | "">("");
  const [showFilters, setShowFilters] = useState(false);

  // Sort
  const [sortBy, setSortBy] = useState<SortOption>("date");

  // Batch selection
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showBatchMenu, setShowBatchMenu] = useState(false);

  const handleDrop = useCallback((colId: TaskStatus, e: React.DragEvent) => {
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) updateTaskStatus(taskId, colId);
    setDragOverCol(null);
  }, [updateTaskStatus]);

  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter((t) => ["todo", "in_progress", "completed", "done", "saved"].includes(t.status));
    if (searchText) {
      const lower = searchText.toLowerCase();
      filtered = filtered.filter((t) => t.text.toLowerCase().includes(lower));
    }
    if (selectedProject) filtered = filtered.filter((t) => t.projectId === selectedProject);
    if (selectedIncupTag) filtered = filtered.filter((t) => t.tags.includes(selectedIncupTag));
    if (selectedPriority) filtered = filtered.filter((t) => t.priority === selectedPriority);
    return filtered;
  }, [tasks, searchText, selectedProject, selectedIncupTag, selectedPriority]);

  const sortedAndFiltered = useMemo(() => {
    const sorted = [...filteredTasks];
    const priorityMap: Record<string, number> = { low: 1, medium: 2, high: 3 };
    sorted.sort((a, b) => {
      switch (sortBy) {
        case "priority":
          return (priorityMap[b.priority || "low"] || 0) - (priorityMap[a.priority || "low"] || 0);
        case "time":
          return (b.estimatedMinutes || 0) - (a.estimatedMinutes || 0);
        case "date":
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });
    return sorted;
  }, [filteredTasks, sortBy]);

  const kanbanTasks = sortedAndFiltered;
  const todayCount = tasks.filter((t) => t.status === "today").length;

  const activeFilters =
    (selectedProject ? 1 : 0) +
    (selectedIncupTag ? 1 : 0) +
    (selectedPriority ? 1 : 0);

  const handleAddPriority = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priorityInput.trim()) return;
    addTask(priorityInput.trim(), "today");
    setPriorityInput("");
    setShowPriorityAdd(false);
  };

  const handleSelectTask = (taskId: string) => {
    const next = new Set(selectedTasks);
    if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
    setSelectedTasks(next);
  };

  const handleBatchMove = (status: TaskStatus) => {
    selectedTasks.forEach((id) => updateTaskStatus(id, status));
    setSelectedTasks(new Set());
    setShowBatchMenu(false);
  };

  const handleBatchDelete = () => {
    if (confirm(`Supprimer ${selectedTasks.size} tâche(s) ?`)) {
      selectedTasks.forEach((id) => deleteTask(id));
      setSelectedTasks(new Set());
      setShowBatchMenu(false);
    }
  };

  const clearFilters = () => {
    setSelectedProject("");
    setSelectedIncupTag("");
    setSelectedPriority("");
  };

  const currentDetailTask = detailTask ? tasks.find((t) => t.id === detailTask.id) || null : null;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--surface-0)]">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="shrink-0 px-8 pt-8 pb-5">
        <div className="flex items-end justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight leading-none">
              Tâches
            </h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-2">
              {kanbanTasks.length} {kanbanTasks.length > 1 ? "tâches" : "tâche"}
              <span className="mx-2 text-[var(--text-ghost)]">·</span>
              Glisse pour changer le statut
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {showPriorityAdd ? (
              <form onSubmit={handleAddPriority} className="flex items-center gap-2">
                <input
                  value={priorityInput}
                  onChange={(e) => setPriorityInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Escape") { setShowPriorityAdd(false); setPriorityInput(""); } }}
                  placeholder="Tâche prioritaire…"
                  autoFocus
                  className="text-[13px] rounded-xl h-9 px-3.5 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none bg-[var(--card-bg)] border"
                  style={{ borderColor: "var(--accent-red)", boxShadow: "0 0 0 3px var(--accent-red-light)", minWidth: 240 }}
                />
                <button
                  type="submit"
                  className="h-9 px-3.5 rounded-xl text-[12px] font-medium text-white transition-transform active:scale-95"
                  style={{ background: "var(--accent-red)" }}
                >
                  Ajouter
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPriorityAdd(false); setPriorityInput(""); }}
                  className="h-9 px-2 rounded-xl text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Annuler
                </button>
                {todayCount >= 5 && (
                  <span className="text-[11px] text-[var(--accent-orange)] font-medium">5/5 max</span>
                )}
              </form>
            ) : (
              <button
                onClick={() => setShowPriorityAdd(true)}
                className="flex items-center gap-2 h-9 px-3.5 rounded-xl text-[12.5px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98] border"
                style={{
                  background: "var(--accent-red-light)",
                  color: "var(--accent-red)",
                  borderColor: "color-mix(in srgb, var(--accent-red) 25%, transparent)",
                }}
              >
                <Flag size={13} strokeWidth={2.2} />
                Ajout prioritaire
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Toolbar ────────────────────────────────────────────────── */}
      <div className="shrink-0 px-8 pb-4">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div
            className="flex items-center gap-2 h-9 px-3 rounded-xl border flex-1 min-w-0 max-w-md transition-colors bg-[var(--card-bg)]"
            style={{ borderColor: "var(--border-primary)" }}
          >
            <Search size={13} className="text-[var(--text-tertiary)] shrink-0" />
            <input
              type="text"
              placeholder="Rechercher une tâche…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-1 min-w-0 text-[13px] bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] font-medium border transition-colors bg-[var(--card-bg)]"
            style={{
              borderColor: showFilters || activeFilters > 0 ? "var(--accent-blue)" : "var(--border-primary)",
              color: showFilters || activeFilters > 0 ? "var(--accent-blue)" : "var(--text-secondary)",
              background: activeFilters > 0 ? "var(--accent-blue-light)" : "var(--card-bg)",
            }}
          >
            <SlidersHorizontal size={12} />
            Filtres
            {activeFilters > 0 && (
              <span
                className="ml-1 min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center tabular-nums text-white"
                style={{ background: "var(--accent-blue)" }}
              >
                {activeFilters}
              </span>
            )}
          </button>

          {/* Sort */}
          <div
            className="flex items-center gap-1 h-9 px-2.5 rounded-xl border bg-[var(--card-bg)]"
            style={{ borderColor: "var(--border-primary)" }}
          >
            <ArrowUpDown size={12} className="text-[var(--text-tertiary)]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-[12.5px] bg-transparent text-[var(--text-primary)] focus:outline-none cursor-pointer pr-1"
            >
              <option value="date">Par date</option>
              <option value="priority">Par priorité</option>
              <option value="time">Par temps</option>
            </select>
          </div>

          {/* Batch actions */}
          {selectedTasks.size > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowBatchMenu((v) => !v)}
                className="flex items-center gap-2 h-9 px-3 rounded-xl text-[12.5px] font-medium border transition-colors"
                style={{
                  background: "var(--accent-blue-light)",
                  color: "var(--accent-blue)",
                  borderColor: "color-mix(in srgb, var(--accent-blue) 30%, transparent)",
                }}
              >
                {selectedTasks.size} sélectionnée{selectedTasks.size > 1 ? "s" : ""}
                <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {showBatchMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-full right-0 mt-2 bg-[var(--card-bg)] border border-[var(--border-primary)] rounded-xl overflow-hidden z-20 min-w-[200px]"
                    style={{ boxShadow: "var(--shadow-elevated)" }}
                  >
                    <div className="py-1.5">
                      <div className="px-3 pt-1 pb-1 text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">
                        Déplacer vers
                      </div>
                      {COLUMNS.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleBatchMove(c.id)}
                          className="w-full text-left px-3 py-1.5 text-[12.5px] text-[var(--text-primary)] hover:bg-[var(--surface-2)] flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.accent }} />
                          {c.label}
                        </button>
                      ))}
                      <div className="h-px bg-[var(--border-primary)] my-1" />
                      <button
                        onClick={handleBatchDelete}
                        className="w-full text-left px-3 py-1.5 text-[12.5px] text-[var(--accent-red)] hover:bg-[var(--surface-2)] flex items-center gap-2"
                      >
                        <Trash2 size={11} /> Supprimer
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Expanded filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 flex-wrap pt-3">
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="text-[12.5px] h-8 px-3 rounded-lg border bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none cursor-pointer"
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  <option value="">Tous les projets</option>
                  {projects?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                <select
                  value={selectedIncupTag}
                  onChange={(e) => setSelectedIncupTag(e.target.value as IncupTag | "")}
                  className="text-[12.5px] h-8 px-3 rounded-lg border bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none cursor-pointer"
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  <option value="">Tous les tags INCUP</option>
                  {(Object.keys(INCUP_COLORS) as IncupTag[]).map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>

                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as "" | "high" | "low" | "medium")}
                  className="text-[12.5px] h-8 px-3 rounded-lg border bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none cursor-pointer"
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  <option value="">Toutes priorités</option>
                  <option value="high">Haute</option>
                  <option value="medium">Moyenne</option>
                  <option value="low">Basse</option>
                </select>

                {activeFilters > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-[12px] h-8 px-3 text-[var(--text-secondary)] hover:text-[var(--accent-red)] transition-colors"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Board ──────────────────────────────────────────────────── */}
      <div
        className="flex-1 min-h-0 overflow-x-auto border-t"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <div className="grid grid-cols-4 gap-3 h-full px-5 py-3">
          {COLUMNS.map((col) => (
            <KanbanColumnComponent
              key={col.id}
              column={col}
              tasks={kanbanTasks.filter((t) => col.id === "completed" ? t.status === "completed" || t.status === "done" : t.status === col.id)}
              dragOverCol={dragOverCol}
              onDragOver={(id) => setDragOverCol(id)}
              onDrop={handleDrop}
              onDragLeave={() => setDragOverCol(null)}
              onOpenDetail={(task) => setDetailTask(task)}
              selectedTasks={selectedTasks}
              onSelectTask={handleSelectTask}
            />
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {currentDetailTask && (
          <TaskDetailModal task={currentDetailTask} onClose={() => setDetailTask(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
