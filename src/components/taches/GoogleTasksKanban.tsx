"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  Plus, Check, Loader2, Trash2, AlertCircle, RefreshCw, X,
  Calendar as CalendarIcon, Star, ChevronDown, ChevronRight,
  ListChecks, Eye, EyeOff, Filter, FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

interface GTask {
  id: string;
  title?: string;
  notes?: string;
  status?: "needsAction" | "completed";
  due?: string;
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
  const [view, setView] = useState<"kanban" | "list">("kanban");
  
  // New task modal state
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskListId, setNewTaskListId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; t: GTask } | null>(null);

  const addToast  = useAppStore((s) => s.addToast);

  useEffect(() => {
    setStarred(loadSet(STAR_KEY));
    setHiddenLists(loadSet(HIDDEN_KEY));
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
    if (!title.trim()) return;
    try {
      const r = await fetch("/api/google/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId, title: title.trim() }),
      });
      if (!r.ok) throw new Error("Echec");
      await fetchAll();
    } catch {
      setError("Creation impossible");
      throw new Error("create_task_failed");
    }
  };

  const handleCreateNewTask = async () => {
    if (!newTaskTitle.trim() || !newTaskListId) return;
    setCreating(true);
    try {
      await createTask(newTaskListId, newTaskTitle.trim());
      addToast("Tâche créée avec succès !", "success");
      setIsNewTaskModalOpen(false);
      setNewTaskTitle("");
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

  const visibleLists = useMemo(() => lists.filter((l) => !hiddenLists.has(l.id)), [lists, hiddenLists]);
  const totalOpen   = useMemo(() => tasks.filter((t) => t.status !== "completed" && !hiddenLists.has(t.listId)).length, [tasks, hiddenLists]);

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
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-1.5 rounded-lg transition-all ${view === "list" ? "bg-[var(--card-bg)] shadow-sm text-[var(--accent-blue)]" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"}`}
            >
              <ListChecks size={14} />
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

      {/* ─── Kanban / List ────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
        <div className={view === "kanban" ? "flex gap-5 px-8 py-6 h-full min-w-min" : "flex flex-col gap-5 px-8 py-6 max-w-[800px] mx-auto"}>
          {visibleLists.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full text-center gap-3 py-16">
              <Filter size={28} className="text-[var(--text-tertiary)] opacity-50" />
              <p className="text-[14px] text-[var(--text-primary)] font-medium">Toutes les listes sont masquées</p>
              <p className="text-[12.5px] text-[var(--text-secondary)]">Active au moins une liste via le filtre en haut a droite</p>
            </div>
          ) : (
            visibleLists.map((list) => {
              const listTasks = tasks
                .filter((t) => t.listId === list.id)
                .sort((a, b) => (a.position || "").localeCompare(b.position || ""));
              const open = listTasks.filter((t) => t.status !== "completed");
              const done = listTasks.filter((t) => t.status === "completed");
              const isOpen = showCompleted[list.id] || false;

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
      </div>

      {/* ─── Detail Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {openCardId && (() => {
          const t = tasks.find((x) => x.id === openCardId);
          if (!t) return null;
          return (
            <DetailModal
              t={t}
              onClose={() => setOpenCardId(null)}
              onUpdate={(upd) => updateTask(t, upd)}
              onDelete={() => { removeTask(t); setOpenCardId(null); }}
              onCheck={() => toggleTask(t)}
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
                  <input
                    type="text"
                    autoFocus
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateNewTask();
                      if (e.key === "Escape") setIsNewTaskModalOpen(false);
                    }}
                    placeholder="ex: Appeler le comptable..."
                    className="w-full px-4 py-2.5 bg-surface-2 border border-surface-3 rounded-xl text-[14px] focus:outline-none focus:border-dopa-cyan transition-colors"
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
              style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y }}
              className="z-[101] min-w-[160px] bg-[var(--surface-1)] border border-[var(--border-primary)] rounded-xl shadow-xl p-1.5"
            >
              <button
                className="w-full text-left px-3 py-2 text-[13px] hover:bg-[var(--surface-2)] rounded-lg transition-colors"
                onClick={() => { toggleTask(contextMenu.t); setContextMenu(null); }}
              >
                {contextMenu.t.status === "completed" ? "Marquer non terminée" : "Marquer terminée"}
              </button>
              <button
                className="w-full text-left px-3 py-2 text-[13px] hover:bg-[var(--surface-2)] rounded-lg transition-colors"
                onClick={() => { toggleStar(contextMenu.t.id); setContextMenu(null); }}
              >
                {starred.has(contextMenu.t.id) ? "Retirer favori" : "Mettre en favori"}
              </button>
              <button
                className="w-full text-left px-3 py-2 text-[13px] hover:bg-[var(--surface-2)] rounded-lg transition-colors"
                onClick={() => { setEditingId(contextMenu.t.id); setEditValue(contextMenu.t.title || ""); setContextMenu(null); }}
              >
                Renommer
              </button>
              <div className="h-px bg-[var(--border-primary)] my-1 mx-1" />
              <button
                className="w-full text-left px-3 py-2 text-[13px] hover:bg-[var(--surface-2)] rounded-lg transition-colors text-[var(--accent-red)]"
                onClick={() => { removeTask(contextMenu.t); setContextMenu(null); }}
              >
                Supprimer
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

  return (
    <div
      className="shrink-0 w-[340px] h-full flex flex-col rounded-2xl border overflow-hidden"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--card-border)",
        boxShadow: "var(--card-shadow)",
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
        </div>
      </div>

      {/* Add task */}
      <div className="shrink-0 px-4 py-3 border-b" style={{ borderColor: "var(--border-primary)" }}>
        {adding ? (
          <input
            ref={inputRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitNew();
              if (e.key === "Escape") { setNewTitle(""); setAdding(false); }
            }}
            onBlur={submitNew}
            placeholder="Titre de la nouvelle tache..."
            className="w-full border rounded-xl px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 text-[var(--text-primary)] placeholder:text-[var(--text-ghost)]"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border-secondary)",
              outlineColor: "var(--focus-ring)",
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
              onCheck={() => p.onCheck(t)}
              onDelete={() => p.onDelete(t)}
              onStar={() => p.onToggleStar(t.id)}
              onStartEdit={() => p.onStartEdit(t)}
              onChangeEdit={p.onChangeEdit}
              onSaveEdit={() => p.onSaveEdit(t)}
              onCancelEdit={p.onCancelEdit}
              onSetDate={(iso) => p.onUpdate(t, { due: iso ? iso + "T00:00:00.000Z" : undefined })}
              onOpenCard={() => p.onOpenCard(t.id)}
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
                  onCheck={() => p.onCheck(t)}
                  onDelete={() => p.onDelete(t)}
                  onStar={() => p.onToggleStar(t.id)}
                  onStartEdit={() => {}}
                  onChangeEdit={() => {}}
                  onSaveEdit={() => {}}
                  onCancelEdit={() => {}}
                  onSetDate={() => {}}
                  onOpenCard={() => p.onOpenCard(t.id)}
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
  onCheck: () => void;
  onDelete: () => void;
  onStar: () => void;
  onStartEdit: () => void;
  onChangeEdit: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onSetDate: (iso: string | null) => void;
  onOpenCard: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

function TaskCard(p: TaskCardProps) {
  const completed = p.t.status === "completed";

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
      onClick={(e) => {
        if ((e.target as HTMLElement).closest(".no-open")) return;
        p.onOpenCard();
      }}
      onContextMenu={p.onContextMenu}
      className={
        "group relative px-4 py-3.5 rounded-2xl border transition-all cursor-pointer " +
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

          {/* Date badge */}
          {!completed && (
            <div className="mt-2.5 flex items-center gap-1.5 no-open">
              <label
                onClick={(e) => e.stopPropagation()}
                className={
                  "inline-flex items-center gap-1.5 text-[11px] cursor-pointer rounded-lg px-2 py-1 transition-all relative font-medium " +
                  (overdue ? "text-[var(--accent-red)]" :
                   p.t.due ? "text-[var(--accent-blue)]" :
                   "text-[var(--text-ghost)] opacity-0 group-hover:opacity-100")
                }
                style={{
                  background: overdue
                    ? "var(--accent-red-light)"
                    : p.t.due
                      ? "var(--accent-blue-light)"
                      : "transparent",
                }}
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
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* DetailModal                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface DetailModalProps {
  t: GTask;
  onClose: () => void;
  onUpdate: (updates: Partial<GTask>) => void;
  onDelete: () => void;
  onCheck: () => void;
}

function DetailModal({ t, onClose, onUpdate, onDelete, onCheck }: DetailModalProps) {
  const [title, setTitle] = useState(t.title || "");
  const [notes, setNotes] = useState(t.notes || "");
  const [due, setDue]     = useState(t.due ? t.due.slice(0, 10) : "");
  const [saved, setSaved] = useState(false);
  const c = colorForList(t.listId);
  const completed = t.status === "completed";

  const save = () => {
    const updates: Partial<GTask> = {};
    if (title !== t.title) updates.title = title;
    if (notes !== (t.notes || "")) updates.notes = notes;
    const newDueIso = due ? due + "T00:00:00.000Z" : undefined;
    if (newDueIso !== t.due) updates.due = newDueIso;
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
  }, [title, notes, due]);

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
        className="rounded-3xl max-w-lg w-full border overflow-hidden flex flex-col"
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
          <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: "var(--border-primary)" }}>
            <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.hue }} />
              {t.listTitle}
            </div>
            <div className="flex-1" />
            <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1.5">
              {saved ? (
                <>
                  <Check size={12} style={{ color: "var(--accent-green)" }} />
                  <span style={{ color: "var(--accent-green)" }}>Enregistre</span>
                </>
              ) : (
                <span className="opacity-50">Cmd+S pour sauver</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] p-2 rounded-xl transition-all"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-6">
          {/* Title + checkbox */}
          <div className="flex items-start gap-3.5">
            <button
              onClick={onCheck}
              className="shrink-0 mt-2"
              aria-label={completed ? "Decocher" : "Cocher"}
            >
              <span
                className={
                  "block w-[24px] h-[24px] rounded-full border-2 transition-all flex items-center justify-center " +
                  (completed ? "border-transparent" : "hover:border-[var(--accent-blue)]")
                }
                style={{
                  background: completed ? "var(--accent-blue)" : "transparent",
                  borderColor: completed ? "var(--accent-blue)" : "var(--text-ghost)",
                }}
              >
                {completed && <Check size={14} className="text-white" strokeWidth={3} />}
              </span>
            </button>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={save}
              rows={1}
              placeholder="Titre de la tache..."
              className={
                "flex-1 bg-transparent text-[20px] font-semibold focus:outline-none resize-none leading-tight placeholder:text-[var(--text-ghost)] " +
                (completed ? "line-through text-[var(--text-tertiary)]" : "text-[var(--text-primary)]")
              }
              style={{ minHeight: "1.5em" }}
            />
          </div>

          {/* Divider */}
          <div className="divider-soft" />

          {/* Date */}
          <div>
            <label className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2.5 font-semibold">
              <CalendarIcon size={12} />
              Date d&apos;echeance
            </label>
            <div className="flex items-center gap-2.5">
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                onBlur={save}
                className="flex-1 border rounded-xl px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 text-[var(--text-primary)]"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "var(--border-primary)",
                  outlineColor: "var(--focus-ring)",
                }}
              />
              {due && (
                <button
                  onClick={() => { setDue(""); setTimeout(save, 0); }}
                  className="text-[12px] font-medium px-3 py-2 rounded-xl transition-all hover:bg-[var(--accent-red-light)]"
                  style={{ color: "var(--accent-red)" }}
                >
                  Retirer
                </button>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="divider-soft" />

          {/* Notes */}
          <div>
            <label className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2.5 font-semibold">
              <FileText size={12} />
              Description
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={save}
              rows={5}
              placeholder="Ajouter une description, des notes, un lien..."
              className="w-full border rounded-2xl px-4 py-3.5 text-[13.5px] leading-relaxed focus:outline-none focus:ring-2 resize-y placeholder:text-[var(--text-ghost)]"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border-primary)",
                color: "var(--text-primary)",
                outlineColor: "var(--focus-ring)",
                minHeight: "120px",
              }}
            />
          </div>

          {/* Links */}
          {t.links && t.links.length > 0 && (
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2.5 font-semibold">
                Liens
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

        {/* Footer */}
        <div
          className="shrink-0 flex items-center justify-between px-6 py-4 border-t"
          style={{ borderColor: "var(--border-primary)", background: "var(--surface-2)" }}
        >
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3.5 py-2 rounded-xl transition-all"
            style={{ color: "var(--accent-red)" }}
            onMouseEnter={(e) => { (e.currentTarget.style.background) = "var(--accent-red-light)"; }}
            onMouseLeave={(e) => { (e.currentTarget.style.background) = "transparent"; }}
          >
            <Trash2 size={13} />
            Supprimer
          </button>
          <button
            onClick={() => { save(); onClose(); }}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-all"
            style={{ background: "var(--accent-blue)" }}
          >
            Enregistrer & fermer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
