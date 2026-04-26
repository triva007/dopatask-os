"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, Check, Loader2, Trash2, AlertCircle, RefreshCw, X,
  Calendar as CalendarIcon, Star, ChevronDown, ChevronRight,
  ListChecks, MoreHorizontal,
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

interface GList {
  id: string;
  title?: string;
}

const STAR_KEY = "dopatask-starred-google-tasks";

function loadStarred(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STAR_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveStarred(s: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STAR_KEY, JSON.stringify(Array.from(s)));
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  const addXp     = useAppStore((s) => s.addXp);
  const addToast  = useAppStore((s) => s.addToast);
  const damageBoss = useAppStore((s) => s.damageBoss);

  useEffect(() => { setStarred(loadStarred()); }, []);

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
      if (r.status === 401) {
        setConnected(false);
        return;
      }
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

  // Auto-refresh toutes les 90s pour voir les changements faits ailleurs
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
      // XP / boss damage si on vient de COMPLETER
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
    } catch {
      setError("Creation impossible");
    }
  };

  const toggleStar = (id: string) => {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveStarred(next);
      return next;
    });
  };

  if (connected === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--accent-blue)12" }}>
          <ListChecks size={26} className="text-accent-blue" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Connecte Google Tasks</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Va dans Reglages pour connecter ton compte Google. Tes taches Google apparaitront ici.
          </p>
        </div>
        <a
          href="/reglages"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-blue text-white rounded-xl text-[13px] font-semibold hover:opacity-90 transition-all"
        >
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
      <div className="shrink-0 px-7 pt-6 pb-4 border-b border-b-primary flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5">
            <ListChecks size={18} className="text-accent-blue" /> Taches
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {tasks.filter((t) => t.status !== "completed").length} ouverte(s) - sync Google Tasks
          </p>
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

      {/* Kanban : listes en colonnes */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 px-7 py-5 h-full min-w-min">
          {lists.length === 0 ? (
            <div className="flex items-center justify-center w-full text-[13px] text-[var(--text-secondary)]">
              Aucune liste Google Tasks trouvee.
            </div>
          ) : (
            lists.map((list) => {
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
                  openCardId={openCardId}
                  onToggleCompleted={() =>
                    setShowCompleted((prev) => ({ ...prev, [list.id]: !prev[list.id] }))
                  }
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

      {/* Detail modal */}
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
/* ListColumn : colonne kanban = une liste Google Tasks            */
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
  openCardId: string | null;
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

  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  const submitNew = () => {
    if (newTitle.trim()) {
      p.onCreate(newTitle);
      setNewTitle("");
    }
    setAdding(false);
  };

  return (
    <div className="shrink-0 w-[320px] h-full overflow-hidden flex flex-col rounded-3xl bg-surface border border-b-primary">
      {/* Header colonne */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-b-primary">
        <h2 className="text-[14.5px] font-semibold text-[var(--text-primary)] truncate">
          {p.list.title || "(sans nom)"}
        </h2>
        <span className="text-[11px] text-[var(--text-secondary)] tabular-nums">
          {p.open.length}
        </span>
      </div>

      {/* Ajouter une tache */}
      <div className="shrink-0 px-3 py-2 border-b border-b-primary">
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
            placeholder="Nouvelle tache..."
            className="w-full bg-empty-bg border border-b-primary rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)]"
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-[13px] text-accent-blue hover:bg-[var(--surface-2)] transition-all font-medium"
          >
            <Plus size={14} />
            Ajouter une tache
          </button>
        )}
      </div>

      {/* Liste des taches */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 flex flex-col gap-1">
        {p.open.length === 0 && p.done.length === 0 && (
          <div className="text-center text-[12px] text-[var(--text-secondary)] py-8">
            Aucune tache
          </div>
        )}

        {p.open.map((t) => (
          <TaskCard
            key={t.id}
            t={t}
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

        {/* Taches terminees deroulant */}
        {p.done.length > 0 && (
          <>
            <button
              onClick={p.onToggleCompleted}
              className="flex items-center gap-2 px-2 py-2 mt-2 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            >
              {p.isCompletedOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span>Taches terminees ({p.done.length})</span>
            </button>
            {p.isCompletedOpen && p.done.map((t) => (
              <TaskCard
                key={t.id}
                t={t}
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
/* TaskCard : carte de tache style capture Google                  */
/* =============================================================== */

interface TaskCardProps {
  t: GTask;
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
      className={
        "group relative px-3 py-2.5 rounded-xl transition-all " +
        (p.isPending ? "opacity-60 " : "") +
        (completed ? "bg-empty-bg " : "bg-surface hover:bg-[var(--surface-2)] ")
      }
    >
      <div className="flex items-start gap-2.5">
        {/* Checkbox */}
        <button
          onClick={p.onCheck}
          disabled={p.isPending}
          className="shrink-0 mt-0.5"
        >
          <span className={
            "block w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center " +
            (completed
              ? "bg-accent-blue border-accent-blue"
              : "border-[var(--text-secondary)] hover:border-accent-blue hover:bg-accent-blue/10")
          }>
            {completed && <Check size={10} className="text-white" strokeWidth={3} />}
          </span>
        </button>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          {p.isEditing ? (
            <input
              autoFocus
              type="text"
              value={p.editValue}
              onChange={(e) => p.onChangeEdit(e.target.value)}
              onBlur={p.onSaveEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") p.onSaveEdit();
                if (e.key === "Escape") p.onCancelEdit();
              }}
              className="w-full bg-empty-bg border border-b-primary rounded-md px-2 py-1 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)]"
            />
          ) : (
            <p
              onDoubleClick={p.onStartEdit}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest(".no-open")) return;
                p.onOpenCard();
              }}
              className={
                "text-[13.5px] leading-snug cursor-pointer break-words " +
                (completed ? "line-through text-[var(--text-secondary)]" : "text-[var(--text-primary)]")
              }
            >
              {p.t.title || "(sans titre)"}
            </p>
          )}

          {p.t.notes && (
            <p
              onClick={p.onOpenCard}
              className={
                "text-[11.5px] mt-1 leading-relaxed cursor-pointer break-words line-clamp-3 " +
                (completed ? "text-[var(--text-secondary)]" : "text-[var(--text-secondary)]")
              }
            >
              {p.t.notes}
            </p>
          )}

          {/* Date */}
          {!completed && (
            <div className="mt-2 flex items-center gap-1 no-open">
              <label className={
                "inline-flex items-center gap-1 text-[10.5px] cursor-pointer rounded-md px-1.5 py-0.5 transition-all relative " +
                (overdue ? "bg-[var(--accent-red-light)] text-[var(--accent-red)]" :
                 p.t.due ? "bg-[var(--accent-blue-light)] text-accent-blue" :
                 "text-[var(--text-secondary)] hover:bg-empty-bg opacity-0 group-hover:opacity-100")
              }>
                <CalendarIcon size={10} />
                {p.t.due ? formatDue(p.t.due) : "Date"}
                <input
                  type="date"
                  value={dueIso}
                  onChange={(e) => p.onSetDate(e.target.value || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              </label>
              {p.t.due && (
                <button
                  onClick={(e) => { e.stopPropagation(); p.onSetDate(null); }}
                  className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--accent-red)]"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>

        {/* Etoile + Trash */}
        <div className="shrink-0 flex flex-col items-end gap-1 no-open">
          <button
            onClick={p.onStar}
            className={
              "transition-all " +
              (p.starred ? "opacity-100 text-[var(--accent-orange)]" : "opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-[var(--accent-orange)]")
            }
          >
            <Star size={13} fill={p.starred ? "currentColor" : "none"} />
          </button>
          <button
            onClick={p.onDelete}
            disabled={p.isPending}
            className="opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-[var(--accent-red)] transition-all"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* =============================================================== */
/* DetailModal : modal d'edition complete d'une tache              */
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
  const [saving, setSaving] = useState(false);

  const completed = t.status === "completed";

  const save = () => {
    const updates: Partial<GTask> = {};
    if (title !== t.title) updates.title = title;
    if (notes !== (t.notes || "")) updates.notes = notes;
    const newDueIso = due ? due + "T00:00:00.000Z" : undefined;
    if (newDueIso !== t.due) updates.due = newDueIso;
    if (Object.keys(updates).length > 0) {
      setSaving(true);
      onUpdate(updates);
      setTimeout(() => setSaving(false), 300);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-3xl max-w-lg w-full border border-b-primary p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3 mb-4">
          <button onClick={onCheck} className="shrink-0 mt-1">
            <span className={
              "block w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center " +
              (completed ? "bg-accent-blue border-accent-blue" : "border-[var(--text-secondary)]")
            }>
              {completed && <Check size={12} className="text-white" strokeWidth={3} />}
            </span>
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={save}
            className={
              "flex-1 bg-transparent text-lg font-semibold focus:outline-none text-[var(--text-primary)] " +
              (completed ? "line-through text-[var(--text-secondary)]" : "")
            }
          />
          <button onClick={onClose} className="shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 font-semibold">
              Description
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={save}
              rows={4}
              placeholder="Ajouter une description, notes, lien..."
              className="w-full bg-empty-bg border border-b-primary rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)] resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 font-semibold">
              Date d'echeance
            </label>
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              onBlur={save}
              className="w-full bg-empty-bg border border-b-primary rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)]"
            />
          </div>

          <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-2">
            Liste : <span className="font-medium text-[var(--text-primary)]">{t.listTitle}</span>
          </div>

          {t.links && t.links.length > 0 && (
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 font-semibold">
                Liens
              </label>
              <ul className="space-y-1">
                {t.links.map((l, i) => (
                  <li key={i}>
                    <a href={l.link} target="_blank" rel="noopener noreferrer" className="text-[12px] text-accent-blue hover:underline break-all">
                      {l.description || l.link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-b-primary">
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--accent-red)] hover:bg-[var(--accent-red-light)] px-3 py-2 rounded-xl transition-all"
          >
            <Trash2 size={13} />
            Supprimer
          </button>
          <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
            {saving && <Loader2 size={11} className="animate-spin" />}
            {saving ? "Enregistrement..." : "Auto-save active"}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
