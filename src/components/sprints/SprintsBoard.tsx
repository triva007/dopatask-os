"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, Plus, Calendar, Target, Check, X, ChevronDown, Play,
  Flag, BarChart3, Trash2, Edit2, ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Sprint, Task } from "@/store/useAppStore";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type ViewMode = "list" | "activeSprint" | "retrospective";

interface FormState {
  name: string;
  startDate: string;
  endDate: string;
  goal: string;
}

/* ─── Utils ──────────────────────────────────────────────────────────────── */

function daysRemaining(endDate: string): number {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function daysElapsed(startDate: string): number {
  const now = new Date();
  const start = new Date(startDate);
  const diff = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function getDurationDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
}

function getStatusColor(status: string): string {
  switch (status) {
    case "planning":
      return "var(--accent-blue)";
    case "active":
      return "var(--accent-green)";
    case "completed":
      return "var(--accent-purple)";
    case "cancelled":
      return "var(--accent-red)";
    default:
      return "var(--text-tertiary)";
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    planning: "En planification",
    active: "En cours",
    completed: "Terminé",
    cancelled: "Annulé",
  };
  return labels[status] || status;
}

/* ─── Create Sprint Form ──────────────────────────────────────────────────── */

function CreateSprintForm({ onSubmit, onCancel }: {
  onSubmit: (form: FormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    name: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    goal: "",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="p-4 bg-surface border border-b-primary rounded-xl"
    >
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Créer un nouveau sprint</h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
            Nom du sprint
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="ex: Sprint Q1 - Refactor"
            className="w-full px-3 py-2 text-sm bg-surface border border-b-primary rounded-lg text-[var(--text-primary)] placeholder-text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-offset-1"
            style={{ boxShadow: "0 0 0 3px var(--accent-blue)" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
              Date de début
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface border border-b-primary rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-offset-1"
              style={{ boxShadow: "0 0 0 3px var(--accent-blue)" }}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
              Date de fin
            </label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface border border-b-primary rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-offset-1"
              style={{ boxShadow: "0 0 0 3px var(--accent-blue)" }}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
            Objectif du sprint
          </label>
          <textarea
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            placeholder="Décris l'objectif principal de ce sprint..."
            rows={2}
            className="w-full px-3 py-2 text-sm bg-surface border border-b-primary rounded-lg text-[var(--text-primary)] placeholder-text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-offset-1 resize-none"
            style={{ boxShadow: "0 0 0 3px var(--accent-blue)" }}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onSubmit(form)}
            disabled={!form.name || !form.goal}
            className="flex-1 px-3 py-2 text-sm font-medium rounded-lg bg-accent-blue text-white disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:opacity-90 transition-opacity"
          >
            Créer Sprint
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 text-sm font-medium rounded-lg border border-b-primary text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Sprint Stats Bar ──────────────────────────────────────────────────── */

function SprintStats({ sprint, tasksInSprint }: {
  sprint: Sprint;
  tasksInSprint: Task[];
}) {
  const completed = tasksInSprint.filter((t) => t.status === "done").length;
  const total = tasksInSprint.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;
  const duration = getDurationDays(sprint.startDate, sprint.endDate);
  const velocity = duration > 0 ? (completed / duration).toFixed(1) : "0.0";
  const remaining = daysRemaining(sprint.endDate);
  const elapsed = daysElapsed(sprint.startDate);

  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {/* Progress */}
      <div className="p-3 bg-surface border border-b-primary rounded-xl">
        <div className="text-xs text-[var(--text-tertiary)] mb-1.5">Complétées</div>
        <div className="flex items-end gap-1">
          <span className="text-lg font-bold text-[var(--text-primary)]">{completed}</span>
          <span className="text-xs text-[var(--text-secondary)]">/ {total}</span>
        </div>
        <div className="mt-1.5 h-1 bg-[var(--surface-2)] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[var(--surface-1)]-r"
            style={{
              backgroundImage: "linear-gradient(90deg, var(--accent-green), var(--accent-blue))",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 60 }}
          />
        </div>
      </div>

      {/* Velocity */}
      <div className="p-3 bg-surface border border-b-primary rounded-xl">
        <div className="text-xs text-[var(--text-tertiary)] mb-1.5">Vélocité</div>
        <div className="flex items-end gap-1">
          <span className="text-lg font-bold text-[var(--text-primary)]">{velocity}</span>
          <span className="text-xs text-[var(--text-secondary)]">tasks/j</span>
        </div>
      </div>

      {/* Days Elapsed */}
      <div className="p-3 bg-surface border border-b-primary rounded-xl">
        <div className="text-xs text-[var(--text-tertiary)] mb-1.5">Jours écoulés</div>
        <div className="text-lg font-bold text-[var(--text-primary)]">{elapsed}</div>
        <div className="text-xs text-[var(--text-secondary)]">/ {duration}j</div>
      </div>

      {/* Days Remaining */}
      <div className="p-3 bg-surface border border-b-primary rounded-xl">
        <div className="text-xs text-[var(--text-tertiary)] mb-1.5">Restant</div>
        <div className={`text-lg font-bold ${remaining <= 2 ? "text-accent-red" : "text-[var(--text-primary)]"}`}>
          {remaining}j
        </div>
      </div>
    </div>
  );
}

/* ─── Burndown Chart ──────────────────────────────────────────────────────– */

function BurndownChart({ sprint, tasksInSprint }: {
  sprint: Sprint;
  tasksInSprint: Task[];
}) {
  const completed = tasksInSprint.filter((t) => t.status === "done").length;
  const total = tasksInSprint.length;
  const duration = getDurationDays(sprint.startDate, sprint.endDate);
  const idealTasks = Math.max(0, total - (daysElapsed(sprint.startDate) / duration) * total);
  const currentRemaining = Math.max(0, total - completed);

  const maxTasks = Math.max(total, 10);

  return (
    <div className="p-4 bg-surface border border-b-primary rounded-xl mb-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={16} className="text-[var(--text-secondary)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Burndown</h3>
      </div>

      <div className="relative h-40 flex items-end gap-1">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          <div className="border-t border-b-primary opacity-20" />
          <div className="border-t border-b-primary opacity-20" />
          <div className="border-t border-b-primary opacity-20" />
        </div>

        {/* Ideal line (diagonal) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <line
            x1="0"
            y1={((maxTasks - total) / maxTasks) * 100 + "%"}
            x2="100%"
            y2={((maxTasks) / maxTasks) * 100 + "%"}
            stroke="var(--accent-orange)"
            strokeWidth="2"
            strokeDasharray="4"
            opacity="0.5"
          />
        </svg>

        {/* Ideal remaining bar */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            className="w-full bg-accent-orange-light rounded-t-lg"
            style={{
              height: `${(idealTasks / maxTasks) * 100}%`,
              borderBottom: `2px solid var(--accent-orange)`,
            }}
            initial={{ height: 0 }}
            animate={{ height: `${(idealTasks / maxTasks) * 100}%` }}
            transition={{ type: "spring", stiffness: 60 }}
          />
          <span className="text-xs text-[var(--text-tertiary)]">Idéal</span>
        </div>

        {/* Actual remaining bar */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            className="w-full rounded-t-lg"
            style={{
              height: `${(currentRemaining / maxTasks) * 100}%`,
              background:
                currentRemaining <= idealTasks
                  ? "var(--accent-green)"
                  : "var(--accent-red)",
            }}
            initial={{ height: 0 }}
            animate={{ height: `${(currentRemaining / maxTasks) * 100}%` }}
            transition={{ type: "spring", stiffness: 60 }}
          />
          <span className="text-xs text-[var(--text-tertiary)]">Réel</span>
        </div>
      </div>

      <div className="mt-4 text-xs text-[var(--text-secondary)]">
        {currentRemaining} tâches restantes • Idéal: {idealTasks.toFixed(1)}
      </div>
    </div>
  );
}

/* ─── Task List in Sprint ────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SprintTaskList({ tasksInSprint, sprintId, onAssign }: {
  tasksInSprint: Task[];
  sprintId: string;
  onAssign: (taskId: string, sprintId: string | undefined) => void;
}) {
  const completed = tasksInSprint.filter((t) => t.status === "done");
  const remaining = tasksInSprint.filter((t) => t.status !== "done");

  return (
    <div className="space-y-3">
      {remaining.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
            À faire ({remaining.length})
          </h4>
          <div className="space-y-1">
            {remaining.map((task) => (
              <motion.div
                key={task.id}
                layout
                className="p-2.5 bg-surface border border-b-primary rounded-lg flex items-start gap-2 group hover:border-b-secondary transition-colors"
              >
                <div className="w-4 h-4 rounded-full border-2 border-b-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] break-words">{task.text}</p>
                  {task.description && (
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{task.description}</p>
                  )}
                </div>
                <button
                  onClick={() => onAssign(task.id, undefined)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1 text-[var(--text-tertiary)] hover:text-accent-red"
                  title="Remove from sprint"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
            Complétées ({completed.length})
          </h4>
          <div className="space-y-1">
            {completed.map((task) => (
              <motion.div
                key={task.id}
                layout
                className="p-2.5 bg-surface border border-b-primary rounded-lg flex items-start gap-2 opacity-60 group"
              >
                <Check size={16} className="text-accent-green mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] line-through">{task.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {tasksInSprint.length === 0 && (
        <div className="p-6 text-center">
          <Target size={24} className="mx-auto mb-2 text-[var(--text-tertiary)]" />
          <p className="text-sm text-[var(--text-secondary)]">
            Aucune tâche assignée à ce sprint
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Assign Tasks to Sprint ─────────────────────────────────────────────── */

function AssignTasksPanel({ unassignedTasks, sprintId, onAssign }: {
  unassignedTasks: Task[];
  sprintId: string;
  onAssign: (taskId: string, sprintId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (unassignedTasks.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-surface border border-b-primary rounded-xl">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-sm font-semibold text-[var(--text-primary)] hover:text-accent-blue transition-colors"
      >
        <span>Ajouter des tâches ({unassignedTasks.length})</span>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-1 pt-3 border-t border-b-primary"
          >
            {unassignedTasks.map((task) => (
              <motion.button
                key={task.id}
                layout
                onClick={() => onAssign(task.id, sprintId)}
                className="w-full p-2.5 text-left text-sm bg-[var(--surface-2)] border border-b-primary rounded-lg text-[var(--text-primary)] hover:border-accent-blue hover:bg-surface-3 transition-colors flex items-center justify-between gap-2 group"
              >
                <span className="flex-1 truncate">{task.text}</span>
                <Plus size={14} className="flex-shrink-0 text-[var(--text-tertiary)] group-hover:text-accent-blue" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Sprint Card (List View) ────────────────────────────────────────────── */

function SprintCard({ sprint, tasksInSprint, onSelect, onEdit, onDelete }: {
  sprint: Sprint;
  tasksInSprint: Task[];
  onSelect: () => void;
  onEdit: (s: Sprint) => void;
  onDelete: (id: string) => void;
}) {
  const completed = tasksInSprint.filter((t) => t.status === "done").length;
  const total = tasksInSprint.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <motion.button
      onClick={onSelect}
      layout
      className="w-full p-4 bg-surface border border-b-primary rounded-xl text-left hover:border-b-secondary hover:shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.05)] transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{sprint.name}</h3>
          <p className="text-xs text-[var(--text-tertiary)] line-clamp-2">{sprint.goal}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(sprint);
            }}
            className="p-1.5 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 size={14} className="text-[var(--text-secondary)]" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(sprint.id);
            }}
            className="p-1.5 hover:bg-[var(--surface-2)] rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={14} className="text-accent-red" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div
          className="px-2 py-1 rounded-lg text-xs font-medium"
          style={{
            backgroundColor: getStatusColor(sprint.status) + "20",
            color: getStatusColor(sprint.status),
            border: `1px solid ${getStatusColor(sprint.status)}40`,
          }}
        >
          {getStatusLabel(sprint.status)}
        </div>
        <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
          <Calendar size={12} />
          {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[var(--surface-1)]-r"
            style={{
              backgroundImage: "linear-gradient(90deg, var(--accent-green), var(--accent-blue))",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 60 }}
          />
        </div>
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          {completed}/{total}
        </span>
      </div>
    </motion.button>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export default function SprintsBoard() {
  const store = useAppStore();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [editForm, setEditForm] = useState<Partial<FormState>>({});

  // Get all sprints and organize by status
  const sprintsByStatus = useMemo(() => {
    const planning = store.sprints.filter((s) => s.status === "planning");
    const active = store.sprints.filter((s) => s.status === "active");
    const completed = store.sprints.filter((s) => s.status === "completed");
    const cancelled = store.sprints.filter((s) => s.status === "cancelled");
    return { planning, active, completed, cancelled };
  }, [store.sprints]);

  // Get active sprint
  const currentActiveSprint = useMemo(
    () => sprintsByStatus.active[0] || null,
    [sprintsByStatus.active]
  );

  // Get tasks for a sprint
  const getTasksForSprint = (sprintId: string) => {
    return store.tasks.filter((t) => t.sprintId === sprintId);
  };

  // Get unassigned tasks
  const unassignedTasks = useMemo(
    () => store.tasks.filter((t) => !t.sprintId),
    [store.tasks]
  );

  // Handle create sprint
  const handleCreateSprint = (form: FormState) => {
    store.addSprint({
      name: form.name,
      goal: form.goal,
      startDate: form.startDate,
      endDate: form.endDate,
      status: "planning",
    });
    setShowCreateForm(false);
  };

  // Handle delete sprint
  const handleDeleteSprint = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce sprint?")) {
      store.deleteSprint(id);
      if (activeSprint?.id === id) {
        setActiveSprint(null);
        setViewMode("list");
      }
    }
  };

  // Handle edit sprint
  const handleEditSprint = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setEditForm({
      name: sprint.name,
      goal: sprint.goal,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
    });
  };

  const handleSaveEdit = () => {
    if (editingSprint && editForm.name && editForm.goal) {
      store.updateSprint(editingSprint.id, {
        name: editForm.name,
        goal: editForm.goal,
        startDate: editForm.startDate || editingSprint.startDate,
        endDate: editForm.endDate || editingSprint.endDate,
      });
      setEditingSprint(null);
      setEditForm({});
    }
  };

  // Handle sprint selection
  const handleSelectSprint = (sprint: Sprint) => {
    setActiveSprint(sprint);
    setViewMode("activeSprint");
  };

  // Handle sprint status change
  const handleStatusChange = (sprintId: string, newStatus: string) => {
    store.updateSprint(sprintId, { status: newStatus as Sprint["status"] });
    if (newStatus !== "active" && activeSprint?.id === sprintId) {
      setActiveSprint(null);
      setViewMode("list");
    }
  };

  // Render list view
  if (viewMode === "list") {
    return (
      <div className="min-h-screen bg-[var(--surface-2)]">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="border-b border-b-primary pb-6">
            <div className="flex items-center gap-3 mb-2">
              <Rocket size={28} className="text-accent-blue" />
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">Sprints</h1>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Gérez vos sprints et suivez votre avancement
            </p>
          </div>

          {/* Create button and form */}
          <div>
            <AnimatePresence mode="wait">
              {showCreateForm ? (
                <CreateSprintForm
                  onSubmit={handleCreateSprint}
                  onCancel={() => setShowCreateForm(false)}
                />
              ) : (
                <motion.button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full px-4 py-3 bg-accent-blue text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Plus size={18} />
                  Créer un sprint
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Active Sprint Quick View */}
          {currentActiveSprint && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-[var(--surface-1)]-r from-accent-green from-0% to-accent-blue to-100% rounded-xl text-white cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleSelectSprint(currentActiveSprint)}
            >
              <div className="flex items-center gap-2 mb-2">
                <Play size={16} fill="currentColor" />
                <span className="text-sm font-semibold">Sprint actif</span>
              </div>
              <h2 className="text-lg font-bold mb-1">{currentActiveSprint.name}</h2>
              <p className="text-sm opacity-90">{currentActiveSprint.goal}</p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span>{daysRemaining(currentActiveSprint.endDate)} jours restants</span>
                <ChevronRight size={16} />
              </div>
            </motion.div>
          )}

          {/* Edit Sprint Modal */}
          <AnimatePresence>
            {editingSprint && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
                onClick={() => setEditingSprint(null)}
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-surface border border-b-primary rounded-xl p-6 w-full max-w-md"
                >
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Modifier le sprint</h2>
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                        Nom
                      </label>
                      <input
                        type="text"
                        value={editForm.name || ""}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-surface border border-b-primary rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2"
                        style={{ boxShadow: "0 0 0 3px var(--accent-blue)" }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                        Objectif
                      </label>
                      <textarea
                        value={editForm.goal || ""}
                        onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 text-sm bg-surface border border-b-primary rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 resize-none"
                        style={{ boxShadow: "0 0 0 3px var(--accent-blue)" }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-accent-blue text-white hover:opacity-90 transition-opacity"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => setEditingSprint(null)}
                      className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-b-primary text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sprints by Status */}
          {Object.entries(sprintsByStatus).map(([status, sprints]) => {
            if (sprints.length === 0) return null;

            return (
              <div key={status}>
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wide">
                  {getStatusLabel(status)} ({sprints.length})
                </h2>
                <div className="space-y-2">
                  {sprints.map((sprint) => (
                    <SprintCard
                      key={sprint.id}
                      sprint={sprint}
                      tasksInSprint={getTasksForSprint(sprint.id)}
                      onSelect={() => handleSelectSprint(sprint)}
                      onEdit={handleEditSprint}
                      onDelete={handleDeleteSprint}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {store.sprints.length === 0 && (
            <div className="py-12 text-center">
              <Flag size={32} className="mx-auto mb-3 text-[var(--text-tertiary)]" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Aucun sprint</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Créez votre premier sprint pour commencer
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render active sprint view
  if (viewMode === "activeSprint" && activeSprint) {
    const tasksInSprint = getTasksForSprint(activeSprint.id);
    const unassignedForThisSprint = unassignedTasks;

    return (
      <div className="min-h-screen bg-[var(--surface-2)]">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          {/* Header with back button */}
          <div>
            <button
              onClick={() => setViewMode("list")}
              className="text-accent-blue text-sm font-medium mb-3 flex items-center gap-1 hover:opacity-75 transition-opacity"
            >
              ← Retour aux sprints
            </button>
            <div className="border-b border-b-primary pb-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-3xl font-bold text-[var(--text-primary)]">{activeSprint.name}</h1>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{activeSprint.goal}</p>
                </div>
                <div className="flex gap-2">
                  {activeSprint.status === "active" && (
                    <button
                      onClick={() => handleStatusChange(activeSprint.id, "completed")}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg bg-accent-green text-white hover:opacity-90 transition-opacity flex items-center gap-1"
                    >
                      <Check size={14} />
                      Terminer
                    </button>
                  )}
                  <button
                    onClick={() => setViewMode("list")}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-b-primary text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {activeSprint.status !== "active" && (
                  <button
                    onClick={() => handleStatusChange(activeSprint.id, "active")}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-accent-blue text-white hover:opacity-90 transition-opacity flex items-center gap-1"
                  >
                    <Play size={12} fill="currentColor" />
                    Activer
                  </button>
                )}
                <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDate(activeSprint.startDate)} → {formatDate(activeSprint.endDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <SprintStats sprint={activeSprint} tasksInSprint={tasksInSprint} />

          {/* Burndown */}
          <BurndownChart sprint={activeSprint} tasksInSprint={tasksInSprint} />

          {/* Tasks */}
          <div className="bg-surface border border-b-primary rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Target size={16} />
              Tâches du sprint
            </h3>
            <SprintTaskList
              tasksInSprint={tasksInSprint}
              sprintId={activeSprint.id}
              onAssign={store.assignTaskToSprint}
            />
          </div>

          {/* Assign tasks */}
          {unassignedForThisSprint.length > 0 && (
            <AssignTasksPanel
              unassignedTasks={unassignedForThisSprint}
              sprintId={activeSprint.id}
              onAssign={store.assignTaskToSprint}
            />
          )}
        </div>
      </div>
    );
  }

  return null;
}
