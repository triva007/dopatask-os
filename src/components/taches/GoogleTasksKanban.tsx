"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  Plus, Check, Loader2, Trash2, AlertCircle, RefreshCw, X,
  Calendar as CalendarIcon, Star, ChevronDown, ChevronRight,
  ListChecks, Eye, EyeOff, Filter,
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

// Couleur stable basée sur l'ID de la liste pour identifier visuellement les colonnes
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

  const addXp     = useAppStore((s) => s.addXp);
  const addToast  = useAppStore((s) => s.addToast);
  const damageBoss = useAppStore((s) => s.damageBoss);

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
        const isCritical = Math.random() < 0.15;
        const dmg  = isCritical ? 22 : 8;
        const gain = isCritical ? 80 : 25;
        addXp(gain);
        damageBoss(dmg);
        addToast(isCritical ? "COUP CRITIQUE ! +" + gain + " XP !" : "+" + gain + " XP", "xp");
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
    } catch { setError("Creation impossible"); }
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
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--accent-blue-light)" }}>
          <ListChecks size={26} className="text-accent-blue" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Connecte Google Tasks</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Va dans Reglages pour connecter ton compte Google.
          </p>
        </div>
        <a href="/reglages" className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-blue text-white rounded-xl text-[13px] font-semibold hover:opacity-90 transition-all">
          Aller aux reglages
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
      {/* Header */}
      <div className="shrink-0 px-7 pt-6 pb-4 border-b border-b-primary flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5">
            <ListChecks size={18} className="text-accent-blue" />
            Taches
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {totalOpen} tache{totalOpen > 1 ? "s" : ""} ouverte{totalOpen > 1 ? "s" : ""}
            {hiddenLists.size > 0 && (
              <span className="ml-1.5 text-[var(--text-secondary)]">- {hiddenLists.size} liste{hiddenLists.size > 1 ? "s" : ""} masquee{hiddenLists.size > 1 ? "s" : ""}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filtre listes */}
          <div className="relative">
            <button
              onClick={() => setShowListFilter(!showListFilter)}
              className={
                "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] transition-all " +
                (hiddenLists.size > 0
                  ? "bg-accent-blue text-white border-accent-blue"
                  : "bg-empty-bg border-b-primary text-[var(--text-secondary)] hover:bg-[var(--surface-2)]")
              }
            >
              <Filter size={12} />
              Listes
              {hiddenLists.size > 0 && (
                <span className="ml-0.5 text-[10px] px-1 rounded bg-white/20 tabular-nums">
                  {visibleLists.length}/{lists.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showListFilter && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowListFilter(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.96 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-1.5 z-20 min-w-[260px] rounded-2xl bg-surface border border-b-primary shadow-2xl overflow-hidden"
                  >
                    <div className="px-3 py-2.5 border-b border-b-primary text-[10.5px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Afficher / masquer
                    </div>
                    <div className="max-h-[400px] overflow-y-auto py-1">
                      {lists.map((l) => {
                        const hidden = hiddenLists.has(l.id);
                        const c = colorForList(l.id);
                        const taskCount = tasks.filter((t) => t.listId === l.id && t.status !== "completed").length;
                        return (
                          <button
                            key={l.id}
                            onClick={() => toggleListVisible(l.id)}
                            className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-[var(--surface-2)] transition-all text-left"
                          >
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.hue }} />
                            <span className={"flex-1 text-[13px] truncate " + (hidden ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]")}>
                              {l.title || "(sans nom)"}
                            </span>
                            <span className="text-[10.5px] text-[var(--text-secondary)] tabular-nums">{taskCount}</span>
                            {hidden ? (
                              <EyeOff size={13} className="text-[var(--text-secondary)] shrink-0" />
                            ) : (
                              <Eye size={13} className="text-accent-blue shrink-0" />
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
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-empty-bg border border-b-primary text-[12px] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Actualiser
          </button>
        </div>
      </div>

      {error && (
        <div className="shrink-0 px-7 pt-3">
          <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[var(--accent-red-light)] text-[var(--accent-red)] text-[12.5px]">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)}><X size={14} /></button>
          </div>
        </div>
      )}

      {/* Kanban */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 px-7 py-5 h-full min-w-min">
          {visibleLists.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full text-center gap-3 py-16">
              <Filter size={28} className="text-[var(--text-secondary)] opacity-50" />
              <p className="text-[13.5px] text-[var(--text-primary)] font-medium">Toutes les listes sont masquees</p>
              <p className="text-[12px] text-[var(--text-secondary)]">Active au moins une liste via le filtre en haut a droite</p>
            </div>
          ) : (
            visibleLists.map((list) => {
              const listTasks = tasks
                .filter((t) => t.listId === list.id)
                .sort((a, b) => (a.position || "").localeCompare(b.position || ""));
              const open = listTasks.filter((t) => t.status !== "completed");
              const done = listTasks.filter((t) => t.status === "completed");
              const isOpen = showCompleted[list.id] || false;

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
                />
              );
            })
          )}
        </div>
      </div>

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
    </div>
  );
}

/* =============================================================== */
/* ListColumn                                                       */
/* =============================================================== */

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
    <div className="shrink-0 w-[330px] h-full flex flex-col rounded-2xl bg-surface border border-b-primary overflow-hidden shadow-sm">
      {/* Header colonne avec couleur */}
      <div className="shrink-0 relative px-4 py-3.5 border-b border-b-primary">
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: c.hue }} />
        <div className="flex items-center gap-2 mt-0.5">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.hue }} />
          <h2 className="flex-1 text-[14.5px] font-semibold text-[var(--text-primary)] truncate">
            {p.list.title || "(sans nom)"}
          </h2>
          <span className="text-[11px] text-[var(--text-secondary)] tabular-nums px-1.5 py-0.5 rounded bg-empty-bg">
            {p.open.length}
          </span>
        </div>
      </div>

      {/* Ajouter une tache */}
      <div className="shrink-0 px-3 py-2.5 border-b border-b-primary">
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
            className="w-full bg-empty-bg border border-b-primary rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)]"
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all hover:bg-[var(--surface-2)]"
            style={{ color: c.hue }}
          >
            <Plus size={14} />
            Ajouter une tache
          </button>
        )}
      </div>

      {/* Liste */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 flex flex-col gap-1">
        {p.open.length === 0 && p.done.length === 0 && (
          <div className="text-center text-[12px] text-[var(--text-secondary)] py-12">
            Aucune tache
          </div>
        )}

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
          />
        ))}

        {p.done.length > 0 && (
          <>
            <button
              onClick={p.onToggleCompleted}
              className="flex items-center gap-2 px-2 py-2 mt-3 text-[11px] font-medium uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            >
              {p.isCompletedOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              <span>Terminees ({p.done.length})</span>
            </button>
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
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* =============================================================== */
/* TaskCard                                                         */
/* =============================================================== */

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
      onClick={(e) => {
        if ((e.target as HTMLElement).closest(".no-open")) return;
        p.onOpenCard();
      }}
      className={
        "group relative px-3 py-2.5 rounded-xl border transition-all cursor-pointer " +
        (p.isPending ? "opacity-60 " : "") +
        (completed
          ? "bg-empty-bg border-transparent "
          : "bg-surface border-b-primary hover:border-accent-blue/40 hover:shadow-sm ")
      }
    >
      <div className="flex items-start gap-2.5">
        <button
          onClick={(e) => { e.stopPropagation(); p.onCheck(); }}
          disabled={p.isPending}
          className="shrink-0 mt-0.5 no-open"
          aria-label={completed ? "Decocher" : "Cocher"}
        >
          <span className={
            "block w-[18px] h-[18px] rounded-full border-2 transition-all flex items-center justify-center " +
            (completed
              ? "bg-accent-blue border-accent-blue"
              : "border-[var(--text-secondary)] hover:border-accent-blue")
          }>
            {completed && <Check size={11} className="text-white" strokeWidth={3} />}
          </span>
        </button>

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
              className="no-open w-full bg-empty-bg border border-b-primary rounded-md px-2 py-1 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)]"
            />
          ) : (
            <p
              onDoubleClick={(e) => { e.stopPropagation(); p.onStartEdit(); }}
              className={
                "text-[13.5px] leading-snug break-words " +
                (completed ? "line-through text-[var(--text-secondary)]" : "text-[var(--text-primary)]")
              }
            >
              {p.t.title || "(sans titre)"}
            </p>
          )}

          {p.t.notes && (
            <p
              className={
                "text-[11.5px] mt-1 leading-relaxed break-words line-clamp-3 " +
                (completed ? "text-[var(--text-secondary)] opacity-70" : "text-[var(--text-secondary)]")
              }
            >
              {p.t.notes}
            </p>
          )}

          {!completed && (
            <div className="mt-2 flex items-center gap-1 no-open">
              <label
                onClick={(e) => e.stopPropagation()}
                className={
                  "inline-flex items-center gap-1 text-[10.5px] cursor-pointer rounded-md px-1.5 py-0.5 transition-all relative font-medium " +
                  (overdue ? "bg-[var(--accent-red-light)] text-[var(--accent-red)]" :
                   p.t.due ? "bg-[var(--accent-blue-light)] text-accent-blue" :
                   "text-[var(--text-secondary)] hover:bg-empty-bg opacity-0 group-hover:opacity-100")
                }
              >
                <CalendarIcon size={10} />
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
                  className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--accent-red)] transition-all"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1.5 no-open">
          <button
            onClick={(e) => { e.stopPropagation(); p.onStar(); }}
            className={
              "transition-all " +
              (p.starred
                ? "opacity-100 text-[var(--accent-orange)]"
                : "opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-[var(--accent-orange)]")
            }
            aria-label="Favori"
          >
            <Star size={13} fill={p.starred ? "currentColor" : "none"} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); p.onDelete(); }}
            disabled={p.isPending}
            className="opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-[var(--accent-red)] transition-all"
            aria-label="Supprimer"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* =============================================================== */
/* DetailModal - redesigned                                         */
/* =============================================================== */

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
      setTimeout(() => setSaved(false), 1500);
    }
  };

  // Save sur Cmd+Enter ou Escape pour fermer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { save(); onClose(); }
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-3xl max-w-xl w-full border border-b-primary shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header sticky avec bordure couleur de la liste */}
        <div className="shrink-0 relative">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: c.hue }} />
          <div className="flex items-center gap-3 px-6 py-4 border-b border-b-primary">
            <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
              <span className="w-2 h-2 rounded-full" style={{ background: c.hue }} />
              {t.listTitle}
            </div>
            <div className="flex-1" />
            <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
              {saved ? (
                <>
                  <Check size={12} className="text-accent-green" />
                  Enregistre
                </>
              ) : (
                <span className="opacity-60">Auto-save</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-empty-bg p-1.5 rounded-lg transition-all"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
          {/* Titre + checkbox */}
          <div className="flex items-start gap-3">
            <button
              onClick={onCheck}
              className="shrink-0 mt-1.5"
              aria-label={completed ? "Decocher" : "Cocher"}
            >
              <span className={
                "block w-[22px] h-[22px] rounded-full border-2 transition-all flex items-center justify-center " +
                (completed
                  ? "bg-accent-blue border-accent-blue"
                  : "border-[var(--text-secondary)] hover:border-accent-blue")
              }>
                {completed && <Check size={13} className="text-white" strokeWidth={3} />}
              </span>
            </button>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={save}
              rows={1}
              placeholder="Titre de la tache..."
              className={
                "flex-1 bg-transparent text-[19px] font-semibold focus:outline-none resize-none leading-tight " +
                (completed ? "line-through text-[var(--text-secondary)]" : "text-[var(--text-primary)]")
              }
              style={{ minHeight: "1.5em" }}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-[10.5px] uppercase tracking-wider text-[var(--text-secondary)] mb-2 font-semibold">
              Date d&apos;echeance
            </label>
            <div className="flex items-center gap-2">
              <CalendarIcon size={14} className="text-[var(--text-secondary)] shrink-0" />
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                onBlur={save}
                className="flex-1 bg-empty-bg border border-b-primary rounded-xl px-3 py-2.5 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)]"
              />
              {due && (
                <button
                  onClick={() => { setDue(""); setTimeout(save, 0); }}
                  className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--accent-red)] px-2 py-1 transition-all"
                >
                  Retirer
                </button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10.5px] uppercase tracking-wider text-[var(--text-secondary)] mb-2 font-semibold">
              Description
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={save}
              rows={6}
              placeholder="Ajouter une description, des notes, un lien..."
              className="w-full bg-empty-bg border border-b-primary rounded-xl px-4 py-3 text-[13.5px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)] resize-y placeholder:text-[var(--text-secondary)]"
            />
          </div>

          {t.links && t.links.length > 0 && (
            <div>
              <label className="block text-[10.5px] uppercase tracking-wider text-[var(--text-secondary)] mb-2 font-semibold">
                Liens
              </label>
              <ul className="space-y-1.5">
                {t.links.map((l, i) => (
                  <li key={i}>
                    <a href={l.link} target="_blank" rel="noopener noreferrer" className="text-[12.5px] text-accent-blue hover:underline break-all">
                      {l.description || l.link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-b-primary bg-[var(--surface-2)]">
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 text-[13px] text-[var(--accent-red)] hover:bg-[var(--accent-red-light)] px-3 py-2 rounded-xl transition-all font-medium"
          >
            <Trash2 size={13} />
            Supprimer
          </button>
          <button
            onClick={() => { save(); onClose(); }}
            className="px-5 py-2 rounded-xl text-[13px] bg-accent-blue text-white hover:opacity-90 transition-all font-semibold"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
