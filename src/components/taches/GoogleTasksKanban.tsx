"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  Plus, Check, Loader2, Trash2, AlertCircle, RefreshCw, X,
  Calendar as CalendarIcon, Star, ChevronDown, ChevronRight,
  ListChecks, Eye, EyeOff, Filter, FileText, Folder,
  Copy, ArrowRightLeft, Tag, Search, GripVertical,
  MoreHorizontal, Palette, ChevronUp, Clock, LayoutGrid,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

interface GTask {
  id: string;
  title?: string;
  notes?: string;
  status?: "needsAction" | "completed";
  due?: string | null;
  completed?: string;
  updated?: string;
  parent?: string;
  position?: string;
  links?: { type: string; description?: string; link: string }[];
  listId: string;
  listTitle: string;
}

interface GList { id: string; title?: string }

const STAR_KEY   = "dopatask-starred-google-tasks";
const HIDDEN_KEY = "dopatask-hidden-google-lists";
const LABELS_KEY = "dopatask-task-labels";

function loadSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch { return new Set(); }
}
function saveSet(key: string, s: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(Array.from(s)));
}

function loadRecord<T>(key: string): Record<string, T> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveRecord(key: string, r: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(r));
}

// ─── Trello-style label colors ────────────────────────────────────────────────
const LABEL_COLORS = [
  { id: "green",  color: "#4BCE97", bg: "rgba(75,206,151,0.18)",  name: "Vert" },
  { id: "yellow", color: "#F5CD47", bg: "rgba(245,205,71,0.18)",  name: "Jaune" },
  { id: "orange", color: "#FEA362", bg: "rgba(254,163,98,0.18)",  name: "Orange" },
  { id: "red",    color: "#F87168", bg: "rgba(248,113,104,0.18)", name: "Rouge" },
  { id: "purple", color: "#9F8FEF", bg: "rgba(159,143,239,0.18)", name: "Violet" },
  { id: "blue",   color: "#579DFF", bg: "rgba(87,157,255,0.18)",  name: "Bleu" },
];

const LIST_COLORS = [
  { hue: "var(--accent-blue)",   light: "var(--accent-blue-light)"   },
  { hue: "var(--accent-purple)", light: "var(--accent-purple-light)" },
  { hue: "var(--accent-green)",  light: "var(--accent-green-light)"  },
  { hue: "var(--accent-orange)", light: "var(--accent-orange-light)" },
  { hue: "var(--accent-cyan)",   light: "var(--accent-cyan-light, rgba(95, 163, 184, 0.12))" },
  { hue: "var(--accent-red)",    light: "var(--accent-red-light)"    },
];
function colorForList(id: string) {
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
  return LIST_COLORS[Math.abs(h) % LIST_COLORS.length];
}

// ─── Animation variants ──────────────────────────────────────────────────────
const cardVariants = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
};

const checkVariants = {
  unchecked: { scale: 1 },
  checked: { scale: [1, 1.2, 1], transition: { duration: 0.3 } },
};

export default function GoogleTasksKanban() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [lists, setLists]   = useState<GList[]>([]);
  const [tasks, setTasks]   = useState<GTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [showCompleted, setShowCompleted] = useState<Record<string, boolean>>({});
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [hiddenLists, setHiddenLists] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [showListFilter, setShowListFilter] = useState(false);
  const [view, setView] = useState<"kanban" | "list" | "matrix">("kanban");
  const [dragOverQuadrant, setDragOverQuadrant] = useState<string | null>(null);
  
  // New task modal state
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskListId, setNewTaskListId] = useState<string>("");
  const [newTaskProjectId, setNewTaskProjectId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; t: GTask } | null>(null);

  // ─── Trello features state ────────────────────────────────────────
  const [taskLabels, setTaskLabels] = useState<Record<string, string[]>>({});
  const [searchText, setSearchText] = useState("");
  const [filterLabel, setFilterLabel] = useState<string>("");
  const [draggedTask, setDraggedTask] = useState<GTask | null>(null);
  const [dragOverListId, setDragOverListId] = useState<string | null>(null);
  const [collapsedLists, setCollapsedLists] = useState<Set<string>>(new Set());
  const [showMoveMenu, setShowMoveMenu] = useState<{ taskId: string; listId: string } | null>(null);

  const addToast  = useAppStore((s) => s.addToast);
  const googleTaskPriorities = useAppStore((s) => s.googleTaskPriorities);
  const googleTaskDurations = useAppStore((s) => s.googleTaskDurations);
  const setGoogleTaskPriority = useAppStore((s) => s.setGoogleTaskPriority);
  const setGoogleTaskDuration = useAppStore((s) => s.setGoogleTaskDuration);

  useEffect(() => {
    setStarred(loadSet(STAR_KEY));
    setHiddenLists(loadSet(HIDDEN_KEY));
    setTaskLabels(loadRecord<string[]>(LABELS_KEY));
  }, []);

  const markPending = (id: string, on: boolean) => {
    setPending((prev) => {
      const next = new Set(prev);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/google/tasks", { cache: "no-store" });
      if (r.status === 401) { setConnected(false); return; }
      if (!r.ok) throw new Error("Echec recuperation");
      const d = (await r.json()) as { lists: GList[]; tasks: GTask[] };
      setLists(d.lists || []);
      setTasks(d.tasks || []);
      setConnected(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!connected) return;
    const interval = setInterval(() => { fetchAll(); }, 90 * 1000);
    return () => clearInterval(interval);
  }, [connected, fetchAll]);

  const toggleTask = async (t: GTask) => {
    const next = t.status === "completed" ? "needsAction" : "completed";
    markPending(t.id, true);
    setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, status: next } : x));
    try {
      const r = await fetch("/api/google/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: t.listId, taskId: t.id, updates: { status: next } }),
      });
      if (!r.ok) throw new Error("Echec");
      if (next === "completed") {
        addToast("Tâche complétée", "success");
      }
    } catch {
      setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, status: t.status } : x));
      setError("Modification impossible");
    } finally {
      markPending(t.id, false);
    }
  };

  const removeTask = async (t: GTask) => {
    if (!confirm("Supprimer \"" + (t.title || "cette tache") + "\" ?")) return;
    markPending(t.id, true);
    const backup = tasks;
    setTasks((prev) => prev.filter((x) => x.id !== t.id));
    try {
      const r = await fetch("/api/google/tasks?listId=" + t.listId + "&taskId=" + t.id, { method: "DELETE" });
      if (!r.ok) throw new Error("Echec");
    } catch {
      setTasks(backup);
      setError("Suppression impossible");
    } finally {
      markPending(t.id, false);
    }
  };

  const updateTask = async (t: GTask, updates: Partial<GTask>) => {
    markPending(t.id, true);
    const backup = tasks;
    setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, ...updates } : x));
    try {
      const r = await fetch("/api/google/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: t.listId, taskId: t.id, updates }),
      });
      if (!r.ok) throw new Error("Echec");
    } catch {
      setTasks(backup);
      setError("Modification impossible");
    } finally {
      markPending(t.id, false);
    }
  };

  const createTask = async (listId: string, title: string) => {
    if (!title.trim()) return null;
    try {
      const r = await fetch("/api/google/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId, title: title.trim() }),
      });
      if (!r.ok) throw new Error("Echec");
      const d = await r.json();
      await fetchAll();
      return d.task as GTask;
    } catch {
      setError("Creation impossible");
      throw new Error("create_task_failed");
    }
  };

  const handleCreateNewTask = async () => {
    if (!newTaskTitle.trim() || !newTaskListId) return;
    setCreating(true);
    try {
      const task = await createTask(newTaskListId, newTaskTitle.trim());
      if (task && newTaskProjectId) {
        useAppStore.getState().setGoogleTaskProject(`task-${task.id}`, newTaskProjectId);
      }
      addToast("Tâche créée avec succès !", "success");
      setIsNewTaskModalOpen(false);
      setNewTaskTitle("");
      setNewTaskProjectId("");
    } catch (e) {
      console.error(e);
      addToast("Erreur lors de la création", "error");
    } finally {
      setCreating(false);
    }
  };

  const toggleStar = (id: string) => {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveSet(STAR_KEY, next);
      return next;
    });
  };

  const toggleListVisible = (id: string) => {
    setHiddenLists((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveSet(HIDDEN_KEY, next);
      return next;
    });
  };

  // ─── Trello: Label management ─────────────────────────────────────
  const toggleLabel = (taskId: string, labelId: string) => {
    setTaskLabels((prev) => {
      const curr = prev[taskId] || [];
      const next = curr.includes(labelId) ? curr.filter((l) => l !== labelId) : [...curr, labelId];
      const updated = { ...prev, [taskId]: next };
      if (next.length === 0) delete updated[taskId];
      saveRecord(LABELS_KEY, updated);
      return updated;
    });
  };

  // ─── Trello: Move task between lists ──────────────────────────────
  const moveTaskToList = async (task: GTask, newListId: string) => {
    if (task.listId === newListId) return;
    const newListTitle = lists.find((l) => l.id === newListId)?.title || "";
    markPending(task.id, true);
    // Optimistic UI
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, listId: newListId, listTitle: newListTitle } : t));
    try {
      // Create in new list
      const payload: Record<string, unknown> = { title: task.title };
      if (task.notes) payload.notes = task.notes;
      if (task.due) payload.due = task.due;
      if (task.status) payload.status = task.status;
      const createRes = await fetch("/api/google/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: newListId, ...payload }),
      });
      if (!createRes.ok) throw new Error("move_create_failed");
      const { task: newTask } = await createRes.json();
      // Delete from old list
      await fetch(`/api/google/tasks?listId=${task.listId}&taskId=${task.id}`, { method: "DELETE" });
      // Transfer local metadata to new task ID
      const oldId = task.id;
      const newId = newTask.id;
      // Transfer labels
      setTaskLabels((prev) => {
        if (!prev[oldId]) return prev;
        const updated: Record<string, string[]> = { ...prev, [newId]: prev[oldId] };
        delete updated[oldId];
        saveRecord(LABELS_KEY, updated as Record<string, unknown>);
        return updated;
      });
      // Transfer starred
      setStarred((prev) => {
        if (!prev.has(oldId)) return prev;
        const next = new Set(prev);
        next.delete(oldId); next.add(newId);
        saveSet(STAR_KEY, next);
        return next;
      });
      // Transfer store data
      const store = useAppStore.getState();
      const proj = (store.googleTaskProjects || {})[oldId];
      if (proj) { store.setGoogleTaskProject(newId, proj); store.setGoogleTaskProject(oldId, null); }
      const rec = (store.googleTaskRecurrence || {})[oldId];
      if (rec) { store.setGoogleTaskRecurrence(newId, rec); store.setGoogleTaskRecurrence(oldId, false); }
      const subs = (store.googleTaskSubtasks || {})[oldId];
      if (subs?.length) { store.setGoogleTaskSubtasks(newId, subs); store.setGoogleTaskSubtasks(oldId, []); }
      // Update local task with new ID
      setTasks((prev) => prev.map((t) => t.id === oldId ? { ...t, ...newTask, listId: newListId, listTitle: newListTitle } : t));
      addToast(`Tâche déplacée vers ${newListTitle}`, "success");
    } catch {
      await fetchAll();
      setError("Déplacement impossible");
    } finally {
      markPending(task.id, false);
    }
  };

  // ─── Trello: Duplicate task ───────────────────────────────────────
  const duplicateTask = async (task: GTask) => {
    try {
      const newTask = await createTask(task.listId, (task.title || "") + " (copie)");
      if (newTask && task.notes) {
        await updateTask({ ...newTask, listId: task.listId, listTitle: task.listTitle }, { notes: task.notes });
      }
      // Copy labels
      const lbls = taskLabels[task.id];
      if (lbls && newTask) {
        setTaskLabels((prev) => {
          const updated = { ...prev, [newTask.id]: [...lbls] };
          saveRecord(LABELS_KEY, updated);
          return updated;
        });
      }
      addToast("Tâche dupliquée", "success");
    } catch {
      setError("Duplication impossible");
    }
  };

  // ─── Trello: Drag & Drop handlers ─────────────────────────────────
  const handleDragStart = (task: GTask) => setDraggedTask(task);
  const handleDragEnd = () => { setDraggedTask(null); setDragOverListId(null); };
  const handleDragOverList = (listId: string) => {
    if (draggedTask && draggedTask.listId !== listId) setDragOverListId(listId);
  };
  const handleDropOnList = async (listId: string) => {
    if (draggedTask && draggedTask.listId !== listId) {
      await moveTaskToList(draggedTask, listId);
    }
    setDraggedTask(null);
    setDragOverListId(null);
  };

  // ─── Trello: Toggle collapsed column ──────────────────────────────
  const toggleCollapsed = (listId: string) => {
    setCollapsedLists((prev) => {
      const next = new Set(prev);
      if (next.has(listId)) next.delete(listId); else next.add(listId);
      return next;
    });
  };

  // ─── Filtered tasks ───────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    if (searchText) {
      const lower = searchText.toLowerCase();
      filtered = filtered.filter((t) =>
        (t.title || "").toLowerCase().includes(lower) ||
        (t.notes || "").toLowerCase().includes(lower)
      );
    }
    if (filterLabel) {
      filtered = filtered.filter((t) => (taskLabels[t.id] || []).includes(filterLabel));
    }
    return filtered;
  }, [tasks, searchText, filterLabel, taskLabels]);

  const visibleLists = useMemo(() => lists.filter((l) => !hiddenLists.has(l.id)), [lists, hiddenLists]);
  const totalOpen   = useMemo(() => filteredTasks.filter((t) => t.status !== "completed" && !hiddenLists.has(t.listId)).length, [filteredTasks, hiddenLists]);

  if (connected === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 px-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--accent-blue-light)" }}
        >
          <ListChecks size={28} style={{ color: "var(--accent-blue)" }} />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Connecte Google Tasks</h2>
          <p className="text-[13.5px] text-[var(--text-secondary)] mt-2 leading-relaxed">
            Va dans Réglages pour connecter ton compte Google.
          </p>
        </div>
        <a
          href="/reglages"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-[13.5px] font-semibold hover:opacity-90 transition-all"
          style={{ background: "var(--accent-blue)", color: "white" }}
        >
          Aller aux Réglages
        </a>
      </div>
    );
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={20} className="animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-8 pt-7 pb-5 border-b flex items-center justify-between gap-4" style={{ borderColor: "var(--border-primary)" }}>
        <div>
          <h1 className="text-[22px] font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
            <ListChecks size={20} style={{ color: "var(--accent-blue)" }} />
            Tâches
          </h1>
          <p className="text-[12.5px] text-[var(--text-secondary)] mt-1.5">
            {totalOpen} tache{totalOpen > 1 ? "s" : ""} ouverte{totalOpen > 1 ? "s" : ""}
            {hiddenLists.size > 0 && (
              <span className="ml-1.5 text-[var(--text-tertiary)]"> · {hiddenLists.size} liste{hiddenLists.size > 1 ? "s" : ""} masquee{hiddenLists.size > 1 ? "s" : ""}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (visibleLists.length > 0) {
                setNewTaskListId(visibleLists[0].id);
                setIsNewTaskModalOpen(true);
                setNewTaskTitle("");
              } else {
                addToast("Veuillez d'abord afficher une liste", "error");
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold text-white transition-all shadow-sm hover:opacity-90 active:scale-95"
            style={{ background: "var(--accent-blue)" }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Nouvelle Tâche
          </button>

          {/* View Toggle */}
          <div className="flex items-center p-0.5 rounded-xl border bg-[var(--surface-2)]" style={{ borderColor: "var(--border-secondary)" }}>
            <button
              onClick={() => setView("kanban")}
              className={`p-1.5 rounded-lg transition-all ${view === "kanban" ? "bg-[var(--card-bg)] shadow-sm text-[var(--accent-blue)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"}`}
              title="Vue Tableau Kanban"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-1.5 rounded-lg transition-all ${view === "list" ? "bg-[var(--card-bg)] shadow-sm text-[var(--accent-blue)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"}`}
              title="Vue Liste"
            >
              <ListChecks size={14} />
            </button>
            <button
              onClick={() => setView("matrix")}
              className={`p-1.5 rounded-lg transition-all ${view === "matrix" ? "bg-[var(--card-bg)] shadow-sm text-[var(--accent-blue)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"}`}
              title="Matrice d'Eisenhower"
            >
              <LayoutGrid size={14} />
            </button>
          </div>

          {/* List filter */}
          <div className="relative">
            <button
              onClick={() => setShowListFilter(!showListFilter)}
              className={
                "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-[12px] font-medium transition-all " +
                (hiddenLists.size > 0
                  ? "text-white border-transparent"
                  : "border-[var(--border-secondary)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]")
              }
              style={hiddenLists.size > 0 ? { background: "var(--accent-blue)" } : { background: "var(--card-bg)" }}
            >
              <Filter size={12} />
              Listes
              {hiddenLists.size > 0 && (
                <span className="ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 tabular-nums">
                  {visibleLists.length}/{lists.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showListFilter && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowListFilter(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    className="absolute right-0 top-full mt-2 z-20 min-w-[280px] rounded-2xl border overflow-hidden"
                    style={{
                      background: "var(--card-bg)",
                      borderColor: "var(--card-border)",
                      boxShadow: "var(--shadow-elevated)",
                    }}
                  >
                    <div className="px-4 py-3 border-b text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]" style={{ borderColor: "var(--border-primary)" }}>
                      Afficher / masquer
                    </div>
                    <div className="max-h-[400px] overflow-y-auto py-1.5">
                      {lists.map((l) => {
                        const hidden = hiddenLists.has(l.id);
                        const c = colorForList(l.id);
                        const taskCount = tasks.filter((t) => t.listId === l.id && t.status !== "completed").length;
                        return (
                          <button
                            key={l.id}
                            onClick={() => toggleListVisible(l.id)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--surface-2)] transition-all text-left"
                          >
                            <span className="w-3 h-3 rounded shrink-0 transition-all" style={{ background: hidden ? "var(--text-ghost)" : c.hue, opacity: hidden ? 0.4 : 1 }} />
                            <span className={"flex-1 text-[13px] truncate " + (hidden ? "text-[var(--text-tertiary)] line-through" : "text-[var(--text-primary)]")}>
                              {l.title || "(sans nom)"}
                            </span>
                            <span className="text-[10.5px] text-[var(--text-tertiary)] tabular-nums px-1.5 py-0.5 rounded-md" style={{ background: "var(--surface-2)" }}>{taskCount}</span>
                            {hidden ? (
                              <EyeOff size={13} className="text-[var(--text-tertiary)] shrink-0" />
                            ) : (
                              <Eye size={13} className="shrink-0" style={{ color: "var(--accent-blue)" }} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={fetchAll}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-[12px] font-medium transition-all disabled:opacity-50"
            style={{
              borderColor: "var(--border-secondary)",
              color: "var(--text-secondary)",
              background: "var(--card-bg)",
            }}
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Actualiser
          </button>
        </div>
      </div>

      {/* ─── Search & Label Filter Toolbar ──────────────────────────── */}
      <div className="shrink-0 px-8 py-3 border-b flex items-center gap-3 flex-wrap" style={{ borderColor: "var(--border-primary)" }}>
        {/* Search */}
        <div className="flex items-center gap-2 h-9 px-3 rounded-xl border flex-1 min-w-0 max-w-xs transition-colors bg-[var(--surface-2)]" style={{ borderColor: "var(--border-primary)" }}>
          <Search size={13} className="text-[var(--text-tertiary)] shrink-0" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-1 min-w-0 text-[13px] bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
          />
          {searchText && (
            <button onClick={() => setSearchText("")} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Label filter pills */}
        <div className="flex items-center gap-1.5">
          <Tag size={12} className="text-[var(--text-tertiary)]" />
          {LABEL_COLORS.map((lbl) => (
            <button
              key={lbl.id}
              onClick={() => setFilterLabel(filterLabel === lbl.id ? "" : lbl.id)}
              className="w-6 h-4 rounded-[4px] transition-all hover:scale-110"
              style={{
                background: lbl.color,
                opacity: filterLabel && filterLabel !== lbl.id ? 0.3 : 1,
                boxShadow: filterLabel === lbl.id ? `0 0 0 2px var(--surface-0), 0 0 0 4px ${lbl.color}` : "none",
              }}
              title={`Filtrer par ${lbl.name}`}
            />
          ))}
          {filterLabel && (
            <button
              onClick={() => setFilterLabel("")}
              className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--accent-red)] ml-1 transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {(searchText || filterLabel) && (
          <span className="text-[11px] text-[var(--text-tertiary)] ml-auto">
            {filteredTasks.filter(t => t.status !== "completed").length} résultat{filteredTasks.filter(t => t.status !== "completed").length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ─── Error ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="shrink-0 px-8 pt-3">
          <div
            className="flex items-center justify-between gap-2 p-3.5 rounded-2xl text-[12.5px]"
            style={{ background: "var(--accent-red-light)", color: "var(--accent-red)" }}
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)}><X size={14} /></button>
          </div>
        </div>
      )}

      {/* ─── Kanban / List / Matrix ────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-auto">
        {view === "matrix" ? (
          <div className="h-full flex flex-col p-6 overflow-hidden">
            {visibleLists.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full text-center gap-3 py-16">
                <Filter size={28} className="text-[var(--text-tertiary)] opacity-50" />
                <p className="text-[14px] text-[var(--text-primary)] font-medium">Toutes les listes sont masquées</p>
                <p className="text-[12.5px] text-[var(--text-secondary)]">Active au moins une liste via le filtre en haut a droite</p>
              </div>
            ) : (() => {
              // Group tasks
              const activeTasks = filteredTasks.filter(t => t.status !== "completed" && !hiddenLists.has(t.listId));
              const q1Tasks = activeTasks.filter(t => (googleTaskPriorities || {})[t.id] === "urgent-important");
              const q2Tasks = activeTasks.filter(t => (googleTaskPriorities || {})[t.id] === "important");
              const q3Tasks = activeTasks.filter(t => (googleTaskPriorities || {})[t.id] === "urgent");
              const q4Tasks = activeTasks.filter(t => {
                const prio = (googleTaskPriorities || {})[t.id];
                return !prio || prio === "none";
              });

              const renderQuadrant = (
                quadId: "urgent-important" | "important" | "urgent" | "none",
                title: string,
                subtitle: string,
                description: string,
                emoji: string,
                accentColor: string,
                bgColor: string,
                hoverBg: string,
                quadTasks: GTask[]
              ) => {
                const isOver = dragOverQuadrant === quadId;
                return (
                  <div
                    onDragOver={(e) => {
                       e.preventDefault();
                       if (dragOverQuadrant !== quadId) setDragOverQuadrant(quadId);
                    }}
                    onDragLeave={() => setDragOverQuadrant(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverQuadrant(null);
                      const taskId = e.dataTransfer.getData("text/plain");
                      if (taskId) {
                        setGoogleTaskPriority(taskId, quadId === "none" ? null : quadId);
                        addToast(`Priorité mise à jour : ${title}`, "success");
                      }
                    }}
                    className="flex flex-col rounded-2xl border p-5 min-h-[280px] xl:h-full transition-all duration-200"
                    style={{
                      background: isOver ? hoverBg : "var(--card-bg)",
                      borderColor: isOver ? accentColor : "var(--card-border)",
                      boxShadow: isOver ? "var(--shadow-elevated)" : "var(--card-shadow)",
                      ...(isOver ? { outline: `2px solid ${accentColor}`, outlineOffset: "2px" } : {})
                    }}
                  >
                    {/* Title */}
                    <div className="flex items-center justify-between mb-4 border-b pb-2.5 shrink-0" style={{ borderColor: "var(--border-primary)" }}>
                      <div>
                        <h3 className="text-[14px] font-bold flex items-center gap-2" style={{ color: accentColor }}>
                          <span>{title}</span>
                        </h3>
                        {subtitle && <p className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5">{subtitle}</p>}
                        {description && <p className="text-[10px] text-[var(--text-tertiary)] italic mt-1 font-normal leading-relaxed max-w-[280px]">{description}</p>}
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] font-bold">
                        {quadTasks.length}
                      </span>
                    </div>

                    {/* Task cards list */}
                    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2.5 pr-1">
                      {quadTasks.map((t) => (
                        <TaskCard
                          key={t.id}
                          t={t}
                          accent={colorForList(t.listId).hue}
                          starred={starred.has(t.id)}
                          isPending={pending.has(t.id)}
                          isEditing={editingId === t.id}
                          editValue={editValue}
                          labels={taskLabels[t.id] || []}
                          onCheck={() => toggleTask(t)}
                          onDelete={() => removeTask(t)}
                          onStar={() => toggleStar(t.id)}
                          onStartEdit={() => { setEditingId(t.id); setEditValue(t.title || ""); }}
                          onChangeEdit={setEditValue}
                          onSaveEdit={() => {
                            if (editValue.trim() && editValue !== t.title) {
                              updateTask(t, { title: editValue.trim() });
                            }
                            setEditingId(null);
                          }}
                          onCancelEdit={() => setEditingId(null)}
                          onSetDate={(iso) => updateTask(t, { due: iso ? iso + "T00:00:00.000Z" : undefined })}
                          onOpenCard={() => setOpenCardId(t.id)}
                          onDragStart={() => handleDragStart(t)}
                          onDragEnd={handleDragEnd}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({ x: e.clientX, y: e.clientY, t });
                          }}
                        />
                      ))}
                      {quadTasks.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-secondary)] rounded-2xl py-8 px-4 text-center">
                          <p className="text-[12px] text-[var(--text-tertiary)] italic">Glisser-déposer une tâche ici</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              };

              return (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full min-h-0 overflow-y-auto xl:overflow-hidden">
                  {renderQuadrant(
                    "urgent-important",
                    "🔥 IMPORTANT & URGENT",
                    "",
                    "",
                    "🔥",
                    "var(--accent-red)",
                    "var(--accent-red-light)",
                    "rgba(248, 113, 104, 0.08)",
                    q1Tasks
                  )}
                  {renderQuadrant(
                    "important",
                    "🧠 IMPORTANT mais pas urgent",
                    "",
                    "",
                    "🧠",
                    "var(--accent-orange)",
                    "rgba(254,163,98,0.12)",
                    "rgba(254, 163, 98, 0.08)",
                    q2Tasks
                  )}
                  {renderQuadrant(
                    "urgent",
                    "⏱️ URGENT mais facile",
                    "",
                    "",
                    "⏱️",
                    "#d4a000",
                    "rgba(230,177,0,0.10)",
                    "rgba(230, 177, 0, 0.08)",
                    q3Tasks
                  )}
                  {renderQuadrant(
                    "none",
                    "☁️ PAS URGENT & PAS IMPORTANT",
                    "",
                    "",
                    "☁️",
                    "var(--text-tertiary)",
                    "var(--surface-2)",
                    "rgba(120, 120, 120, 0.08)",
                    q4Tasks
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          <div className={view === "kanban" ? "flex gap-5 px-8 py-6 h-full min-w-min" : "flex flex-col gap-5 px-8 py-6 max-w-[800px] mx-auto"}>
            {visibleLists.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full text-center gap-3 py-16">
                <Filter size={28} className="text-[var(--text-tertiary)] opacity-50" />
                <p className="text-[14px] text-[var(--text-primary)] font-medium">Toutes les listes sont masquées</p>
                <p className="text-[12.5px] text-[var(--text-secondary)]">Active au moins une liste via le filtre en haut a droite</p>
              </div>
            ) : (
              visibleLists.map((list) => {
                const listTasks = filteredTasks
                  .filter((t) => t.listId === list.id)
                  .sort((a, b) => (a.position || "").localeCompare(b.position || ""));
                const open = listTasks.filter((t) => t.status !== "completed");
                const done = listTasks.filter((t) => t.status === "completed");
                const isOpen = showCompleted[list.id] || false;
                const isCollapsed = collapsedLists.has(list.id);
                const isDragOver = dragOverListId === list.id;

                if (view === "kanban") {
                  return (
                    <ListColumn
                      key={list.id}
                      list={list}
                      open={open}
                      done={done}
                      isCompletedOpen={isOpen}
                      starred={starred}
                      pending={pending}
                      editingId={editingId}
                      editValue={editValue}
                      taskLabels={taskLabels}
                      isCollapsed={isCollapsed}
                      isDragOver={isDragOver}
                      onToggleCollapsed={() => toggleCollapsed(list.id)}
                      onDragOverList={() => handleDragOverList(list.id)}
                      onDragLeaveList={() => setDragOverListId(null)}
                      onDropOnList={() => handleDropOnList(list.id)}
                      onToggleCompleted={() => setShowCompleted((p) => ({ ...p, [list.id]: !p[list.id] }))}
                      onCreate={(title) => createTask(list.id, title)}
                      onCheck={toggleTask}
                      onDelete={removeTask}
                      onToggleStar={toggleStar}
                      onStartEdit={(t) => { setEditingId(t.id); setEditValue(t.title || ""); }}
                      onChangeEdit={setEditValue}
                      onSaveEdit={(t) => {
                        if (editValue.trim() && editValue !== t.title) {
                          updateTask(t, { title: editValue.trim() });
                        }
                        setEditingId(null);
                      }}
                      onCancelEdit={() => setEditingId(null)}
                      onUpdate={updateTask}
                      onOpenCard={setOpenCardId}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onContextMenu={(t, e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, t });
                      }}
                    />
                  );
                } else {
                  return (
                    <div key={list.id} className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: colorForList(list.id).hue }} />
                        <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">{list.title || "(sans nom)"}</h2>
                        <span className="text-[11px] px-2 py-0.5 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)]">{open.length}</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {open.map((t) => (
                          <TaskCard
                            key={t.id}
                            t={t}
                            accent={colorForList(list.id).hue}
                            starred={starred.has(t.id)}
                            isPending={pending.has(t.id)}
                            isEditing={editingId === t.id}
                            editValue={editValue}
                            labels={taskLabels[t.id] || []}
                            onCheck={() => toggleTask(t)}
                            onDelete={() => removeTask(t)}
                            onStar={() => toggleStar(t.id)}
                            onStartEdit={() => { setEditingId(t.id); setEditValue(t.title || ""); }}
                            onChangeEdit={setEditValue}
                            onSaveEdit={() => {
                              if (editValue.trim() && editValue !== t.title) {
                                updateTask(t, { title: editValue.trim() });
                              }
                              setEditingId(null);
                            }}
                            onCancelEdit={() => setEditingId(null)}
                            onSetDate={(iso) => updateTask(t, { due: iso ? iso + "T00:00:00.000Z" : undefined })}
                            onOpenCard={() => setOpenCardId(t.id)}
                            onDragStart={() => handleDragStart(t)}
                            onDragEnd={handleDragEnd}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setContextMenu({ x: e.clientX, y: e.clientY, t });
                            }}
                          />
                        ))}
                        {open.length === 0 && <p className="text-[12px] text-[var(--text-tertiary)] italic">Aucune tâche</p>}
                        <button onClick={() => {
                          const title = window.prompt("Nouvelle tâche dans " + (list.title || "cette liste") + " :");
                          if (title && title.trim()) createTask(list.id, title);
                        }} className="text-[12px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 py-2 transition-colors">
                          <Plus size={12} /> Ajouter une tâche
                        </button>
                      </div>
                    </div>
                  );
                }
              })
            )}
          </div>
        )}
      </div>

      {/* ─── Detail Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {openCardId && (() => {
          const t = tasks.find((x) => x.id === openCardId);
          if (!t) return null;
          return (
            <DetailModal
              t={t}
              lists={lists}
              labels={taskLabels[t.id] || []}
              onClose={() => setOpenCardId(null)}
              onUpdate={(upd) => updateTask(t, upd)}
              onDelete={() => { removeTask(t); setOpenCardId(null); }}
              onCheck={() => toggleTask(t)}
              onToggleLabel={(labelId) => toggleLabel(t.id, labelId)}
              onMoveToList={(listId) => { moveTaskToList(t, listId); setOpenCardId(null); }}
              onDuplicate={() => { duplicateTask(t); setOpenCardId(null); }}
            />
          );
        })()}
      </AnimatePresence>

      {/* NEW TASK MODAL */}
      <AnimatePresence>
        {isNewTaskModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsNewTaskModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-surface-1 border border-surface-3 rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-surface-2 flex items-center justify-between">
                <h3 className="text-[15px] font-bold">Nouvelle Tâche Google</h3>
                <button
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="p-1 rounded-md hover:bg-surface-2 text-t-tertiary transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-t-secondary">
                    Titre de la tâche
                  </label>
                  <textarea
                    autoFocus
                    value={newTaskTitle}
                    onChange={(e) => {
                      setNewTaskTitle(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleCreateNewTask();
                      }
                      if (e.key === "Escape") setIsNewTaskModalOpen(false);
                    }}
                    rows={1}
                    placeholder="ex: Appeler le comptable..."
                    className="w-full px-4 py-3 bg-surface-2 border border-surface-3 rounded-xl text-[14px] focus:outline-none focus:border-dopa-cyan transition-colors resize-none overflow-hidden leading-snug"
                    style={{ minHeight: "44px" }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-t-secondary">
                    Liste de destination
                  </label>
                  <select
                    value={newTaskListId}
                    onChange={(e) => setNewTaskListId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-2 border border-surface-3 rounded-xl text-[13px] text-t-primary focus:outline-none focus:border-dopa-cyan transition-colors"
                  >
                    {lists.map(l => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-t-secondary">
                    Projet DopaTask
                  </label>
                  <select
                    value={newTaskProjectId}
                    onChange={(e) => setNewTaskProjectId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-2 border border-surface-3 rounded-xl text-[14px] focus:outline-none focus:border-dopa-cyan transition-colors"
                  >
                    <option value="">Aucun projet</option>
                    {useAppStore.getState().projects.filter(p => p.status !== "archived").map(p => (
                      <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 bg-surface-2/50 border-t border-surface-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[13px] font-medium text-t-secondary hover:text-t-primary transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateNewTask}
                  disabled={!newTaskTitle.trim() || creating}
                  className="px-5 py-2 rounded-xl text-[13px] font-bold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "var(--accent-blue)" }}
                >
                  {creating ? "Création..." : "Créer"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setContextMenu(null)} onContextMenu={e => { e.preventDefault(); setContextMenu(null); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: 'fixed',
                left: Math.min(contextMenu.x, window.innerWidth - 240),
                top: Math.min(contextMenu.y, window.innerHeight - 380),
                maxHeight: '80vh',
              }}
              className="z-[101] w-[230px] bg-[var(--surface-1)] border border-[var(--border-primary)] rounded-xl shadow-xl p-1.5 overflow-y-auto"
            >
              <button
                className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-[var(--surface-2)] rounded-lg transition-colors"
                onClick={() => { toggleTask(contextMenu.t); setContextMenu(null); }}
              >
                {contextMenu.t.status === "completed" ? "↩ Non terminée" : "✅ Terminée"}
              </button>
              <button
                className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-[var(--surface-2)] rounded-lg transition-colors"
                onClick={() => { toggleStar(contextMenu.t.id); setContextMenu(null); }}
              >
                {starred.has(contextMenu.t.id) ? "☆ Retirer favori" : "⭐ Favori"}
              </button>
              <button
                className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-[var(--surface-2)] rounded-lg transition-colors"
                onClick={() => { setEditingId(contextMenu.t.id); setEditValue(contextMenu.t.title || ""); setContextMenu(null); }}
              >
                ✏️ Renommer
              </button>

              <div className="h-px bg-[var(--border-primary)] my-1 mx-1" />

              {/* Importance — compact inline */}
              <div className="px-2 py-1">
                <span className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold px-1">Importance</span>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {([
                    { id: "urgent-important", emoji: "🔥", label: "IMPORTANT & URGENT" },
                    { id: "important",        emoji: "🧠", label: "IMPORTANT mais pas urgent" },
                    { id: "urgent",           emoji: "⏱️", label: "URGENT mais facile" },
                    { id: "none",             emoji: "☁️", label: "PAS URGENT & PAS IMPORTANT" },
                  ] as const).map(opt => {
                    const isActive = (googleTaskPriorities || {})[contextMenu.t.id] === opt.id;
                    return (
                      <button key={opt.id}
                        onClick={() => { setGoogleTaskPriority(contextMenu.t.id, isActive ? null : opt.id); setContextMenu(null); }}
                        className="text-left text-[11px] py-1 px-1.5 rounded-md transition-colors flex items-center gap-1"
                        style={{
                          background: isActive ? "var(--surface-2)" : "transparent",
                          color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >
                        {opt.emoji} {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Durée — compact inline */}
              <div className="px-2 py-1">
                <span className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold px-1">Durée</span>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {([
                    { id: "<5",   label: "⚡ <5 min" },
                    { id: "10-15", label: "🕐 10-15 min" },
                    { id: "30",   label: "⏱ 30 min" },
                    { id: "+1h",  label: "⏳ +1h" },
                  ] as const).map(opt => {
                    const isActive = (googleTaskDurations || {})[contextMenu.t.id] === opt.id;
                    return (
                      <button key={opt.id}
                        onClick={() => { setGoogleTaskDuration(contextMenu.t.id, isActive ? null : opt.id as any); setContextMenu(null); }}
                        className="text-left text-[11px] py-1 px-1.5 rounded-md transition-colors flex items-center gap-1"
                        style={{
                          background: isActive ? "var(--accent-blue-light)" : "transparent",
                          color: isActive ? "var(--accent-blue)" : "var(--text-secondary)",
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="Personnalisé..."
                  defaultValue={typeof (googleTaskDurations || {})[contextMenu.t.id] === "string" && !["<5","10-15","30","+1h"].includes((googleTaskDurations || {})[contextMenu.t.id] as any) ? (googleTaskDurations || {})[contextMenu.t.id] as string : ""}
                  className="w-full mt-1 text-[11px] px-2 py-1 rounded border bg-transparent focus:outline-none"
                  style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) { setGoogleTaskDuration(contextMenu.t.id, val as any); setContextMenu(null); }
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="h-px bg-[var(--border-primary)] my-1 mx-1" />

              <button
                className="w-full text-left px-2 py-1.5 text-[12px] hover:bg-[var(--surface-2)] rounded-lg transition-colors flex items-center gap-2"
                onClick={() => { duplicateTask(contextMenu.t); setContextMenu(null); }}
              >
                <Copy size={12} /> Dupliquer
              </button>
              <button
                className="w-full text-left px-2 py-1.5 text-[12px] hover:bg-[var(--surface-2)] rounded-lg transition-colors text-[var(--accent-red)] flex items-center gap-2"
                onClick={() => { removeTask(contextMenu.t); setContextMenu(null); }}
              >
                <Trash2 size={12} /> Supprimer
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* ListColumn                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface ListColumnProps {
  list: GList;
  open: GTask[];
  done: GTask[];
  isCompletedOpen: boolean;
  starred: Set<string>;
  pending: Set<string>;
  editingId: string | null;
  editValue: string;
  taskLabels: Record<string, string[]>;
  isCollapsed: boolean;
  isDragOver: boolean;
  onToggleCollapsed: () => void;
  onDragOverList: () => void;
  onDragLeaveList: () => void;
  onDropOnList: () => void;
  onToggleCompleted: () => void;
  onCreate: (title: string) => void;
  onCheck: (t: GTask) => void;
  onDelete: (t: GTask) => void;
  onToggleStar: (id: string) => void;
  onStartEdit: (t: GTask) => void;
  onChangeEdit: (v: string) => void;
  onSaveEdit: (t: GTask) => void;
  onCancelEdit: () => void;
  onUpdate: (t: GTask, updates: Partial<GTask>) => void;
  onOpenCard: (id: string) => void;
  onDragStart: (t: GTask) => void;
  onDragEnd: () => void;
  onContextMenu: (t: GTask, e: React.MouseEvent) => void;
}

function ListColumn(p: ListColumnProps) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const c = colorForList(p.list.id);

  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  const submitNew = () => {
    if (newTitle.trim()) { p.onCreate(newTitle); setNewTitle(""); }
    setAdding(false);
  };

  // Collapsed column
  if (p.isCollapsed) {
    return (
      <div
        className="shrink-0 w-[48px] h-full flex flex-col items-center rounded-2xl border cursor-pointer transition-all hover:bg-[var(--surface-2)]"
        style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", boxShadow: "var(--card-shadow)" }}
        onClick={p.onToggleCollapsed}
        onDragOver={(e) => { e.preventDefault(); p.onDragOverList(); }}
        onDrop={(e) => { e.preventDefault(); p.onDropOnList(); }}
        onDragLeave={p.onDragLeaveList}
      >
        <div className="w-full h-[3px] rounded-b-full mx-2" style={{ background: c.hue, opacity: 0.8 }} />
        <div className="mt-4 mb-2">
          <ChevronRight size={14} className="text-[var(--text-tertiary)]" />
        </div>
        <span className="text-[11px] font-semibold tabular-nums text-[var(--text-secondary)]">{p.open.length}</span>
        <span className="[writing-mode:vertical-lr] text-[13px] font-semibold text-[var(--text-primary)] mt-3 rotate-180">
          {p.list.title || "(sans nom)"}
        </span>
      </div>
    );
  }

  return (
    <div
      className={"shrink-0 w-[340px] h-full flex flex-col rounded-2xl border overflow-hidden transition-all " + (p.isDragOver ? "ring-2 ring-offset-2" : "")}
      style={{
        background: p.isDragOver ? "var(--surface-2)" : "var(--card-bg)",
        borderColor: p.isDragOver ? c.hue : "var(--card-border)",
        boxShadow: "var(--card-shadow)",
        ...(p.isDragOver ? { outline: `2px solid ${c.hue}`, outlineOffset: "2px" } : {}),
      }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; p.onDragOverList(); }}
      onDrop={(e) => { e.preventDefault(); p.onDropOnList(); }}
      onDragLeave={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) p.onDragLeaveList();
      }}
    >
      {/* Header */}
      <div className="shrink-0 relative px-5 py-4 border-b" style={{ borderColor: "var(--border-primary)" }}>
        {/* Subtle color indicator — pill style */}
        <div
          className="absolute top-0 left-4 right-4 h-[3px] rounded-b-full"
          style={{ background: c.hue, opacity: 0.8 }}
        />
        <div className="flex items-center gap-2.5 mt-1">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.hue }} />
          <h2 className="flex-1 text-[15px] font-semibold text-[var(--text-primary)] truncate">
            {p.list.title || "(sans nom)"}
          </h2>
          <span
            className="text-[11px] tabular-nums px-2 py-0.5 rounded-lg font-medium"
            style={{
              background: "var(--surface-2)",
              color: "var(--text-secondary)",
            }}
          >
            {p.open.length}
          </span>
          <button
            onClick={p.onToggleCollapsed}
            className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
            title="Réduire"
          >
            <ChevronUp size={12} />
          </button>
        </div>
      </div>

      {/* Add task */}
      <div className="shrink-0 px-4 py-3 border-b" style={{ borderColor: "var(--border-primary)" }}>
        {adding ? (
          <textarea
            ref={inputRef as any}
            value={newTitle}
            onChange={(e) => {
              setNewTitle(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitNew(); }
              if (e.key === "Escape") { setNewTitle(""); setAdding(false); }
            }}
            onBlur={submitNew}
            rows={1}
            placeholder="Titre de la nouvelle tache..."
            className="w-full border rounded-xl px-3.5 py-2.5 text-[13px] leading-snug focus:outline-none focus:ring-2 text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] resize-none overflow-hidden"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border-secondary)",
              outlineColor: "var(--focus-ring)",
              minHeight: "40px"
            }}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all hover:bg-[var(--surface-2)]"
            style={{ color: c.hue }}
          >
            <Plus size={15} />
            Ajouter une tache
          </button>
        )}
      </div>

      {/* Task list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 flex flex-col gap-2">
        {p.open.length === 0 && p.done.length === 0 && (
          <div className="text-center text-[12.5px] text-[var(--text-tertiary)] py-14">
            Aucune tache
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {p.open.map((t) => (
            <TaskCard
              key={t.id}
              t={t}
              accent={c.hue}
              starred={p.starred.has(t.id)}
              isPending={p.pending.has(t.id)}
              isEditing={p.editingId === t.id}
              editValue={p.editValue}
              labels={p.taskLabels[t.id] || []}
              onCheck={() => p.onCheck(t)}
              onDelete={() => p.onDelete(t)}
              onStar={() => p.onToggleStar(t.id)}
              onStartEdit={() => p.onStartEdit(t)}
              onChangeEdit={p.onChangeEdit}
              onSaveEdit={() => p.onSaveEdit(t)}
              onCancelEdit={p.onCancelEdit}
              onSetDate={(iso) => p.onUpdate(t, { due: iso ? iso + "T00:00:00.000Z" : undefined })}
              onOpenCard={() => p.onOpenCard(t.id)}
              onDragStart={() => p.onDragStart(t)}
              onDragEnd={p.onDragEnd}
              onContextMenu={(e) => p.onContextMenu(t, e)}
            />
          ))}
        </AnimatePresence>

        {/* Completed section */}
        {p.done.length > 0 && (
          <>
            <button
              onClick={p.onToggleCompleted}
              className="flex items-center gap-2 px-2.5 py-2.5 mt-4 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-all rounded-lg hover:bg-[var(--surface-2)]"
            >
              {p.isCompletedOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              <span>Terminees ({p.done.length})</span>
            </button>
            <AnimatePresence>
              {p.isCompletedOpen && p.done.map((t) => (
                <TaskCard
                  key={t.id}
                  t={t}
                  accent={c.hue}
                  starred={p.starred.has(t.id)}
                  isPending={p.pending.has(t.id)}
                  isEditing={false}
                  editValue=""
                  labels={p.taskLabels[t.id] || []}
                  onCheck={() => p.onCheck(t)}
                  onDelete={() => p.onDelete(t)}
                  onStar={() => p.onToggleStar(t.id)}
                  onStartEdit={() => {}}
                  onChangeEdit={() => {}}
                  onSaveEdit={() => {}}
                  onCancelEdit={() => {}}
                  onSetDate={() => {}}
                  onOpenCard={() => p.onOpenCard(t.id)}
                  onDragStart={() => p.onDragStart(t)}
                  onDragEnd={p.onDragEnd}
                  onContextMenu={(e) => p.onContextMenu(t, e)}
                />
              ))}
            </AnimatePresence>
          </>
        )}
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* TaskCard                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface TaskCardProps {
  t: GTask;
  accent: string;
  starred: boolean;
  isPending: boolean;
  isEditing: boolean;
  editValue: string;
  labels: string[];
  onCheck: () => void;
  onDelete: () => void;
  onStar: () => void;
  onStartEdit: () => void;
  onChangeEdit: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onSetDate: (iso: string | null) => void;
  onOpenCard: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

function TaskCard(p: TaskCardProps) {
  const completed = p.t.status === "completed";
  const subtasks = (useAppStore.getState().googleTaskSubtasks || {})[p.t.id] || [];
  const subtasksDone = subtasks.filter((s: { completed: boolean }) => s.completed).length;
  const subtasksTotal = subtasks.length;
  const activeLabels = LABEL_COLORS.filter((l) => p.labels.includes(l.id));

  const formatDue = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dayOnly = new Date(d); dayOnly.setHours(0, 0, 0, 0);
    const diff = Math.round((dayOnly.getTime() - today.getTime()) / 86400000);
    if (diff === 0)  return "Aujourd'hui";
    if (diff === 1)  return "Demain";
    if (diff === -1) return "Hier";
    if (diff < 0)    return "Il y a " + Math.abs(diff) + "j";
    if (diff < 7)    return "Dans " + diff + "j";
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const overdue = p.t.due && new Date(p.t.due) < new Date() && !completed;
  const dueIso = p.t.due ? p.t.due.slice(0, 10) : "";

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      draggable
      onDragStart={(e) => {
        p.onDragStart();
        const de = e as unknown as DragEvent;
        if (de.dataTransfer) {
          de.dataTransfer.setData("text/plain", p.t.id);
          de.dataTransfer.effectAllowed = "move";
        }
      }}
      onDragEnd={() => p.onDragEnd()}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest(".no-open")) return;
        p.onOpenCard();
      }}
      onContextMenu={p.onContextMenu}
      className={
        "group relative rounded-2xl border transition-all cursor-grab active:cursor-grabbing overflow-hidden " +
        (p.isPending ? "opacity-60 " : "") +
        (completed
          ? "opacity-60 "
          : "hover:shadow-sm ")
      }
      style={{
        background: completed ? "var(--surface-2)" : "var(--card-bg)",
        borderColor: completed ? "transparent" : "var(--card-border)",
      }}
      whileHover={completed ? undefined : { borderColor: "rgba(79, 70, 229, 0.25)" }}
    >

      <div className={"px-4 " + (activeLabels.length > 0 && !completed ? "pt-2 pb-3.5" : "py-3.5")}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <motion.button
          onClick={(e) => { e.stopPropagation(); p.onCheck(); }}
          disabled={p.isPending}
          className="shrink-0 mt-0.5 no-open"
          aria-label={completed ? "Decocher" : "Cocher"}
          variants={checkVariants}
          animate={completed ? "checked" : "unchecked"}
        >
          <span
            className={
              "block w-[20px] h-[20px] rounded-full border-2 transition-all flex items-center justify-center " +
              (completed
                ? "border-transparent"
                : "hover:border-[var(--accent-blue)]")
            }
            style={{
              background: completed ? "var(--accent-blue)" : "transparent",
              borderColor: completed ? "var(--accent-blue)" : "var(--text-ghost)",
            }}
          >
            {completed && <Check size={12} className="text-white animate-checkmark" strokeWidth={3} />}
          </span>
        </motion.button>

        <div className="flex-1 min-w-0">
          {p.isEditing ? (
            <input
              autoFocus
              type="text"
              value={p.editValue}
              onChange={(e) => p.onChangeEdit(e.target.value)}
              onBlur={p.onSaveEdit}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter") p.onSaveEdit();
                if (e.key === "Escape") p.onCancelEdit();
              }}
              className="no-open w-full border rounded-xl px-3 py-1.5 text-[13.5px] focus:outline-none focus:ring-2 text-[var(--text-primary)]"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border-secondary)",
                outlineColor: "var(--focus-ring)",
              }}
            />
          ) : (
            <p
              onDoubleClick={(e) => { e.stopPropagation(); p.onStartEdit(); }}
              className={
                "text-[14px] leading-snug break-words font-medium " +
                (completed ? "line-through text-[var(--text-tertiary)]" : "text-[var(--text-primary)]")
              }
            >
              {(() => {
                const projectId = (useAppStore.getState().googleTaskProjects || {})[p.t.id];
                const project = projectId ? (useAppStore.getState().projects || []).find(pj => pj.id === projectId) : null;
                return project && <span className="mr-1.5">{project.emoji}</span>;
              })()}
              {(p.t.title || "(sans titre)").split(/(\s+)/).map((word, i) => {
                if (word.match(/^#[\w-]+/)) {
                  return <span key={i} className="text-[var(--accent-blue)]">{word}</span>;
                }
                if (word.match(/^@[\w-]+/)) {
                  return <span key={i} className="text-[var(--accent-orange)]">{word}</span>;
                }
                return word;
              })}
            </p>
          )}

          {/* Notes preview */}
          {p.t.notes && (
            <p
              className={
                "text-[12px] mt-1.5 leading-relaxed break-words line-clamp-2 " +
                (completed ? "text-[var(--text-ghost)]" : "text-[var(--text-tertiary)]")
              }
            >
              {p.t.notes}
            </p>
          )}

          {/* Badges row: date + subtasks */}
          {!completed && (
            <div className="mt-2.5 flex items-center gap-2.5 no-open flex-wrap">
              <label
                onClick={(e) => e.stopPropagation()}
                className={
                  "inline-flex items-center gap-1.5 text-[11px] cursor-pointer rounded px-1.5 py-0.5 transition-all relative font-medium " +
                  (overdue ? "text-[var(--accent-red)] bg-[var(--accent-red-light)]" :
                   p.t.due ? "text-[var(--accent-blue)]" :
                   "text-[var(--text-ghost)] opacity-0 group-hover:opacity-100")
                }
              >
                <CalendarIcon size={11} />
                {p.t.due ? formatDue(p.t.due) : "Date"}
                <input
                  type="date"
                  value={dueIso}
                  onChange={(e) => p.onSetDate(e.target.value || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
              {p.t.due && (
                <button
                  onClick={(e) => { e.stopPropagation(); p.onSetDate(null); }}
                  className="text-[10px] text-[var(--text-ghost)] hover:text-[var(--accent-red)] transition-all p-0.5"
                >
                  ×
                </button>
              )}
              {/* Subtasks badge */}
              {subtasksTotal > 0 && (
                <span className={"inline-flex items-center gap-1 text-[11px] font-medium " + (subtasksDone === subtasksTotal ? "text-[var(--accent-green)]" : "text-[var(--text-tertiary)]")}>
                  <Check size={11} strokeWidth={2.5} />
                  {subtasksDone}/{subtasksTotal}
                </span>
              )}
            </div>
          )}

          {/* Priority + Duration row — always visible if set */}
          {!completed && (
            <div className="mt-2 no-open">
              {/* Badges affichés si définis */}
              {(() => {
                const priority = (useAppStore.getState().googleTaskPriorities || {})[p.t.id];
                const duration = (useAppStore.getState().googleTaskDurations || {})[p.t.id];
                const PRIORITY_META: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
                  "urgent-important": { emoji: "🔥", label: "IMPORTANT & URGENT",  color: "var(--accent-red)",    bg: "var(--accent-red-light)" },
                  "important":        { emoji: "🧠", label: "IMPORTANT mais pas urgent", color: "var(--accent-orange)", bg: "rgba(254,163,98,0.12)" },
                  "urgent":           { emoji: "⏱️", label: "URGENT mais facile", color: "#a07800",               bg: "rgba(230,177,0,0.10)" },
                  "none":             { emoji: "☁️", label: "PAS URGENT & PAS IMPORTANT",         color: "var(--text-tertiary)", bg: "var(--surface-2)" },
                };
                const DURATION_LABELS: Record<string, string> = {
                  "<5": "⚡ <5m", "10-15": "🕐 10-15m", "30": "⏱ 30m", "+1h": "⏳ +1h",
                };
                const pm = priority && priority !== "none" ? PRIORITY_META[priority] : null;
                const dl = duration ? (DURATION_LABELS[String(duration)] ?? `⏱ ${duration}`) : null;
                return (pm || dl) ? (
                  <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                    {pm && <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: pm.bg, color: pm.color }}>{pm.emoji} {pm.label}</span>}
                    {dl && <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "var(--accent-blue-light)", color: "var(--accent-blue)" }}>{dl}</span>}
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 flex flex-col items-end gap-2 no-open">
          <button
            onClick={(e) => { e.stopPropagation(); p.onStar(); }}
            className={
              "transition-all p-0.5 rounded " +
              (p.starred
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100 hover:bg-[var(--surface-2)]")
            }
            style={{ color: p.starred ? "var(--accent-orange)" : "var(--text-ghost)" }}
            aria-label="Favori"
          >
            <Star size={14} fill={p.starred ? "currentColor" : "none"} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); p.onDelete(); }}
            disabled={p.isPending}
            className="opacity-0 group-hover:opacity-100 text-[var(--text-ghost)] hover:text-[var(--accent-red)] transition-all p-0.5 rounded hover:bg-[var(--accent-red-light)]"
            aria-label="Supprimer"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* DetailModal                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface DetailModalProps {
  t: GTask;
  lists: GList[];
  labels: string[];
  onClose: () => void;
  onUpdate: (updates: Partial<GTask>) => void;
  onDelete: () => void;
  onCheck: () => void;
  onToggleLabel: (labelId: string) => void;
  onMoveToList: (listId: string) => void;
  onDuplicate: () => void;
}

function DetailModal({ t, lists, labels, onClose, onUpdate, onDelete, onCheck, onToggleLabel, onMoveToList, onDuplicate }: DetailModalProps) {
  const [title, setTitle] = useState(t.title || "");
  const [notes, setNotes] = useState(t.notes || "");
  const [due, setDue]     = useState(t.due ? t.due.slice(0, 10) : "");
  const [projectId, setProjectId] = useState((useAppStore.getState().googleTaskProjects || {})[t.id] || "");
  const [isRecurring, setIsRecurring] = useState((useAppStore.getState().googleTaskRecurrence || {})[t.id] || false);
  const storeSubtasks = (useAppStore.getState().googleTaskSubtasks || {})[t.id] || [];
  const [subtasks, setSubtasks] = useState<{ id: string; text: string; completed: boolean }[]>(storeSubtasks);
  const [saved, setSaved] = useState(false);
  const c = colorForList(t.listId);
  const completed = t.status === "completed";

  const storeDuration = (useAppStore.getState().googleTaskDurations || {})[t.id];
  const [selDuration, setSelDuration] = useState<string>(() => {
    if (!storeDuration) return "none";
    if (["<5", "10-15", "30", "+1h"].includes(storeDuration as string)) return storeDuration as string;
    return "custom";
  });
  const [customDurVal, setCustomDurVal] = useState<string>(() => {
    if (!storeDuration || ["<5", "10-15", "30", "+1h"].includes(storeDuration as string)) return "";
    return storeDuration as string;
  });

  useEffect(() => {
    setSelDuration(() => {
      if (!storeDuration) return "none";
      if (["<5", "10-15", "30", "+1h"].includes(storeDuration as string)) return storeDuration as string;
      return "custom";
    });
    setCustomDurVal(() => {
      if (!storeDuration || ["<5", "10-15", "30", "+1h"].includes(storeDuration as string)) return "";
      return storeDuration as string;
    });
  }, [storeDuration]);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = (el: HTMLTextAreaElement | null) => {
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  useEffect(() => {
    autoResize(titleRef.current);
    const id = setTimeout(() => autoResize(titleRef.current), 50);
    return () => clearTimeout(id);
  }, [title]);

  useEffect(() => {
    autoResize(notesRef.current);
    const id = setTimeout(() => autoResize(notesRef.current), 50);
    return () => clearTimeout(id);
  }, [notes]);

  const save = (overrides?: { subtasks?: typeof subtasks, projectId?: string, isRecurring?: boolean }) => {
    const currentSubtasks = overrides?.subtasks ?? subtasks;
    const currentProjectId = overrides?.projectId ?? projectId;
    const currentIsRecurring = overrides?.isRecurring ?? isRecurring;

    const updates: Partial<GTask> = {};
    if (title !== t.title) updates.title = title;
    if (notes !== (t.notes || "")) updates.notes = notes;
    const newDueIso = due ? due + "T00:00:00.000Z" : null;
    if (newDueIso !== (t.due || null)) updates.due = newDueIso;
    
    useAppStore.getState().setGoogleTaskProject(t.id, currentProjectId || null);
    useAppStore.getState().setGoogleTaskRecurrence(t.id, currentIsRecurring);
    useAppStore.getState().setGoogleTaskSubtasks(t.id, currentSubtasks);

    if (Object.keys(updates).length > 0) {
      onUpdate(updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { save(); onClose(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, notes, due, projectId, isRecurring, subtasks]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--backdrop-bg)", backdropFilter: "var(--backdrop-blur)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="rounded-3xl max-w-3xl w-full border overflow-hidden flex flex-col"
        style={{
          background: "var(--card-bg)",
          borderColor: "var(--card-border)",
          boxShadow: "var(--shadow-elevated)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div className="shrink-0 relative">
          <div className="absolute top-0 left-0 right-0 h-[3px] rounded-b-full mx-4" style={{ background: c.hue, opacity: 0.8 }} />
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border-primary)" }}>
            <div className="flex items-center gap-3">
              <button 
                onClick={onCheck} 
                className="flex items-center justify-center w-[22px] h-[22px] rounded-full border-[2px] transition-transform hover:scale-110 active:scale-95" 
                style={{ 
                  background: completed ? c.hue : "transparent", 
                  borderColor: completed ? c.hue : "var(--border-secondary)" 
                }}
              >
                {completed && <Check size={12} className="text-white" strokeWidth={3} />}
              </button>
              <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.hue }} />
                {t.listTitle}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {saved && (
                <span className="text-[11px] font-medium flex items-center gap-1.5" style={{ color: "var(--accent-green)" }}>
                  <Check size={12} /> Enregistré
                </span>
              )}
              <div className="flex items-center gap-1">
                <button
                  onClick={onDelete}
                  className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--accent-red-light)] hover:text-[var(--accent-red)] transition-colors"
                  aria-label="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors"
                  aria-label="Fermer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Body — Trello two-column layout */}
        <div className="flex-1 min-h-0 overflow-y-auto flex">
         {/* Left: Main content */}
         <div className="flex-1 min-w-0 px-6 py-8">
          <textarea
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={save}
            placeholder="Titre de la tâche..."
            className={
              "w-full bg-transparent text-[24px] sm:text-[28px] font-bold tracking-tight focus:outline-none resize-none leading-[1.2] placeholder:text-[var(--text-ghost)] " +
              (completed ? "line-through text-[var(--text-tertiary)]" : "text-[var(--text-primary)]")
            }
            style={{ minHeight: "36px", overflow: "hidden" }}
          />

          {/* Properties Grid */}
          <div className="mt-8 flex flex-col gap-1.5">
            {/* Date */}
            <div className="flex items-center min-h-[36px] group">
              <div className="w-[140px] text-[13px] text-[var(--text-tertiary)] flex items-center gap-2 font-medium">
                <CalendarIcon size={14} /> Date
              </div>
              <div className="flex-1 flex items-center">
                <input
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  onBlur={save}
                  className="bg-transparent text-[13.5px] font-medium focus:outline-none hover:bg-[var(--surface-2)] px-2.5 py-1.5 -ml-2.5 rounded-md transition-colors cursor-pointer text-[var(--text-primary)] min-w-[120px]"
                />
                {due && (
                  <button onClick={() => { setDue(""); setTimeout(save, 0); }} className="ml-2 opacity-0 group-hover:opacity-100 text-[var(--text-tertiary)] hover:text-[var(--accent-red)] transition-all">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Project */}
            <div className="flex items-center min-h-[36px]">
              <div className="w-[140px] text-[13px] text-[var(--text-tertiary)] flex items-center gap-2 font-medium">
                <Folder size={14} /> Projet
              </div>
              <div className="flex-1">
                <select
                  value={projectId}
                  onChange={(e) => { 
                    const val = e.target.value;
                    setProjectId(val); 
                    save({ projectId: val }); 
                  }}
                  className="bg-transparent text-[13.5px] font-medium focus:outline-none hover:bg-[var(--surface-2)] px-2.5 py-1.5 -ml-2.5 rounded-md transition-colors cursor-pointer text-[var(--text-primary)] appearance-none"
                >
                  <option value="">Aucun projet</option>
                  {useAppStore.getState().projects.filter(p => p.status !== "archived" || p.id === projectId).map(pj => (
                    <option key={pj.id} value={pj.id}>{pj.emoji} {pj.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Importance */}
            <div className="flex items-center min-h-[36px]">
              <div className="w-[140px] text-[13px] text-[var(--text-tertiary)] flex items-center gap-2 font-medium">
                <Star size={14} /> Importance
              </div>
              <div className="flex-1">
                <select
                  value={(useAppStore.getState().googleTaskPriorities || {})[t.id] || "none"}
                  onChange={(e) => { 
                    const val = e.target.value;
                    useAppStore.getState().setGoogleTaskPriority(t.id, val === "none" ? null : val);
                    setSaved(true); setTimeout(() => setSaved(false), 2000);
                  }}
                  className="bg-transparent text-[13.5px] font-medium focus:outline-none hover:bg-[var(--surface-2)] px-2.5 py-1.5 -ml-2.5 rounded-md transition-colors cursor-pointer text-[var(--text-primary)] appearance-none"
                >
                  <option value="none">☁️ PAS URGENT & PAS IMPORTANT</option>
                  <option value="urgent-important">🔥 IMPORTANT & URGENT</option>
                  <option value="important">🧠 IMPORTANT mais pas urgent</option>
                  <option value="urgent">⏱️ URGENT mais facile</option>
                </select>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center min-h-[36px]">
              <div className="w-[140px] text-[13px] text-[var(--text-tertiary)] flex items-center gap-2 font-medium">
                <Clock size={14} /> Durée estimée
              </div>
              <div className="flex-1 flex items-center">
                <select
                  value={selDuration}
                  onChange={(e) => { 
                    const val = e.target.value;
                    setSelDuration(val);
                    if (val !== "custom") {
                      useAppStore.getState().setGoogleTaskDuration(t.id, val === "none" ? null : val);
                      setSaved(true); setTimeout(() => setSaved(false), 2000);
                    }
                  }}
                  className="bg-transparent text-[13.5px] font-medium focus:outline-none hover:bg-[var(--surface-2)] px-2.5 py-1.5 -ml-2.5 rounded-md transition-colors cursor-pointer text-[var(--text-primary)] appearance-none"
                >
                  <option value="none">Aucune</option>
                  <option value="<5">⚡ Moins de 5 min</option>
                  <option value="10-15">🕐 10 – 15 min</option>
                  <option value="30">⏱ 30 min</option>
                  <option value="+1h">⏳ Plus d'1 heure</option>
                  <option value="custom">Personnalisé...</option>
                </select>
                {selDuration === "custom" && (
                  <input
                    type="text"
                    placeholder="ex: 45min"
                    value={customDurVal}
                    onChange={(e) => setCustomDurVal(e.target.value)}
                    className="ml-2 text-[13px] px-2 py-1 rounded border bg-transparent focus:outline-none"
                    style={{ borderColor: "var(--border-primary)", color: "var(--text-primary)", width: "100px" }}
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      if (val) {
                        useAppStore.getState().setGoogleTaskDuration(t.id, val);
                        setSaved(true); setTimeout(() => setSaved(false), 2000);
                      } else {
                        setSelDuration("none");
                        useAppStore.getState().setGoogleTaskDuration(t.id, null);
                        setSaved(true); setTimeout(() => setSaved(false), 2000);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                    }}
                  />
                )}
              </div>
            </div>

            {/* Recurrence */}
            <div className="flex items-center min-h-[36px]">
              <div className="w-[140px] text-[13px] text-[var(--text-tertiary)] flex items-center gap-2 font-medium">
                <RefreshCw size={14} /> Récurrence
              </div>
              <div className="flex-1">
                <button
                  onClick={() => { 
                    const val = !isRecurring;
                    setIsRecurring(val); 
                    save({ isRecurring: val }); 
                  }}
                  className={
                    "text-[12.5px] font-medium px-2.5 py-1.5 -ml-2.5 rounded-md transition-colors flex items-center gap-2 " + 
                    (isRecurring ? "text-[var(--accent-blue)] bg-[var(--accent-blue-light)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]")
                  }
                >
                  <div className={"w-1.5 h-1.5 rounded-full " + (isRecurring ? "bg-[var(--accent-blue)]" : "bg-[var(--text-ghost)]")} />
                  {isRecurring ? "Affiché sur le Dashboard" : "Désactivé"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-[var(--border-primary)] pt-6">
            <textarea
              ref={notesRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={save}
              placeholder="Ajouter une description, des notes, un lien..."
              className="w-full bg-transparent text-[14.5px] leading-relaxed focus:outline-none resize-none placeholder:text-[var(--text-ghost)] text-[var(--text-primary)]"
              style={{ minHeight: "150px", overflow: "hidden" }}
            />

            {/* Subtasks */}
            <div className="mt-6 mb-2">
              <label className="flex items-center gap-2 text-[12px] uppercase tracking-wider text-[var(--text-tertiary)] mb-3 font-bold">
                <Check size={14} /> Étapes (Sous-tâches)
              </label>
              <div className="flex flex-col gap-1">
                {subtasks.map((st, i) => (
                  <div key={st.id} className="flex items-start gap-2.5 group py-1">
                    <button
                      onClick={() => {
                        const newSt = [...subtasks];
                        newSt[i].completed = !newSt[i].completed;
                        setSubtasks(newSt);
                        save({ subtasks: newSt });
                      }}
                      className={"shrink-0 mt-[3px] w-[18px] h-[18px] rounded-[5px] border transition-colors flex items-center justify-center " + (st.completed ? "bg-[var(--accent-blue)] border-[var(--accent-blue)]" : "border-[var(--border-secondary)] hover:border-[var(--text-ghost)]")}
                    >
                      {st.completed && <Check size={12} className="text-white" strokeWidth={3} />}
                    </button>
                    <textarea
                      value={st.text}
                      onChange={(e) => {
                        const newSt = [...subtasks];
                        newSt[i].text = e.target.value;
                        setSubtasks(newSt);
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                      onBlur={save}
                      rows={1}
                      className={"flex-1 bg-transparent text-[14.5px] leading-snug focus:outline-none resize-none overflow-hidden transition-colors " + (st.completed ? "line-through text-[var(--text-tertiary)]" : "text-[var(--text-primary)]")}
                      placeholder="Nouvelle étape..."
                      style={{ minHeight: "22px" }}
                    />
                    <button
                      onClick={() => {
                        const newSt = subtasks.filter(s => s.id !== st.id);
                        setSubtasks(newSt);
                        save({ subtasks: newSt });
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-ghost)] hover:text-[var(--accent-red)] transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                {/* Add new subtask */}
                <div className="flex items-center gap-2.5 mt-1 py-1">
                  <div className="shrink-0 w-[18px] h-[18px] rounded-[5px] border border-[var(--border-secondary)] opacity-50 flex items-center justify-center">
                    <Plus size={12} className="text-[var(--text-ghost)]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Ajouter une étape..."
                    className="flex-1 bg-transparent text-[14.5px] text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const newSt = [...subtasks, { id: crypto.randomUUID(), text: e.currentTarget.value.trim(), completed: false }];
                        setSubtasks(newSt);
                        e.currentTarget.value = "";
                        save({ subtasks: newSt });
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Links */}
            {t.links && t.links.length > 0 && (
              <div className="mt-6 p-4 rounded-xl border" style={{ borderColor: "var(--border-primary)", background: "var(--surface-2)" }}>
                <label className="block text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2.5 font-semibold">
                  Liens attachés
                </label>
                <ul className="space-y-2">
                  {t.links.map((l, i) => (
                    <li key={i}>
                      <a
                        href={l.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] hover:underline break-all"
                        style={{ color: "var(--accent-blue)" }}
                      >
                        {l.description || l.link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
         </div>

         {/* Right: Trello-style sidebar */}
         <div className="shrink-0 w-[200px] border-l px-4 py-8 flex flex-col gap-4" style={{ borderColor: "var(--border-primary)", background: "var(--surface-1)" }}>
           <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-bold">Actions</div>

           {/* Labels */}
           <div>
             <span className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1.5 mb-2"><Tag size={12} /> Étiquettes</span>
             <div className="flex flex-wrap gap-1.5">
               {LABEL_COLORS.map((lbl) => {
                 const active = labels.includes(lbl.id);
                 return (
                   <button
                     key={lbl.id}
                     onClick={() => onToggleLabel(lbl.id)}
                     className="w-8 h-5 rounded-[4px] transition-all hover:scale-110"
                     style={{
                       background: lbl.color,
                       opacity: active ? 1 : 0.35,
                       boxShadow: active ? `0 0 0 2px var(--surface-1), 0 0 0 3px ${lbl.color}` : "none",
                     }}
                     title={lbl.name}
                   />
                 );
               })}
             </div>
           </div>

           {/* Move to list */}
           <div>
             <span className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1.5 mb-2"><ArrowRightLeft size={12} /> Déplacer</span>
             <div className="flex flex-col gap-1">
               {lists.filter((l) => l.id !== t.listId).map((l) => (
                 <button
                   key={l.id}
                   onClick={() => onMoveToList(l.id)}
                   className="text-left px-2.5 py-1.5 text-[12px] rounded-lg hover:bg-[var(--surface-2)] transition-colors flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                 >
                   <span className="w-2 h-2 rounded-full" style={{ background: colorForList(l.id).hue }} />
                   {l.title || "(sans nom)"}
                 </button>
               ))}
             </div>
           </div>

           <div className="h-px" style={{ background: "var(--border-primary)" }} />

           {/* Duplicate */}
           <button
             onClick={onDuplicate}
             className="flex items-center gap-2 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] px-2.5 py-2 rounded-lg transition-colors"
           >
             <Copy size={13} /> Dupliquer
           </button>

           {/* Delete */}
           <button
             onClick={onDelete}
             className="flex items-center gap-2 text-[12px] font-medium text-[var(--accent-red)] hover:bg-[var(--accent-red-light)] px-2.5 py-2 rounded-lg transition-colors"
           >
             <Trash2 size={13} /> Supprimer
           </button>
         </div>
        </div>

      </motion.div>
    </motion.div>
  );
}
