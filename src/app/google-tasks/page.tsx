"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckSquare, Square, Plus, Loader2, Trash2, AlertCircle, RefreshCw,
  Calendar as CalendarIcon, ChevronDown, ChevronRight, X,
} from "lucide-react";

interface GTask {
  id: string;
  title?: string;
  notes?: string;
  status?: "needsAction" | "completed";
  due?: string;
  completed?: string;
  updated?: string;
  listId: string;
  listTitle: string;
}

interface GList {
  id: string;
  title?: string;
}

export default function GoogleTasksPage() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [lists, setLists]   = useState<GList[]>([]);
  const [tasks, setTasks]   = useState<GTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);
  const [pending, setPending] = useState<Set<string>>(new Set());

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
      if (!r.ok) throw new Error("Échec récupération");
      const d = (await r.json()) as { lists: GList[]; tasks: GTask[] };
      setLists(d.lists || []);
      setTasks(d.tasks || []);
      setConnected(true);
      if (!activeListId && d.lists?.[0]?.id) setActiveListId(d.lists[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "erreur");
    } finally {
      setLoading(false);
    }
  }, [activeListId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggle = async (t: GTask) => {
    const next = t.status === "completed" ? "needsAction" : "completed";
    markPending(t.id, true);
    // Optimistic update
    setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, status: next } : x));
    try {
      const r = await fetch("/api/google/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: t.listId, taskId: t.id, updates: { status: next } }),
      });
      if (!r.ok) throw new Error("Échec");
    } catch {
      // Revert
      setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, status: t.status } : x));
      setError("Modification impossible");
    } finally {
      markPending(t.id, false);
    }
  };

  const remove = async (t: GTask) => {
    if (!confirm(`Supprimer "${t.title}" ?`)) return;
    markPending(t.id, true);
    const backup = tasks;
    setTasks((prev) => prev.filter((x) => x.id !== t.id));
    try {
      const r = await fetch(`/api/google/tasks?listId=${t.listId}&taskId=${t.id}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error("Échec");
    } catch {
      setTasks(backup);
      setError("Suppression impossible");
    } finally {
      markPending(t.id, false);
    }
  };

  const create = async () => {
    if (!newTitle.trim() || !activeListId) return;
    setCreating(true);
    try {
      const r = await fetch("/api/google/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: activeListId, title: newTitle.trim() }),
      });
      if (!r.ok) throw new Error("Échec");
      setNewTitle("");
      await fetchAll();
    } catch {
      setError("Création impossible");
    } finally {
      setCreating(false);
    }
  };

  const saveEdit = async (t: GTask) => {
    if (!editValue.trim() || editValue === t.title) {
      setEditingId(null);
      return;
    }
    markPending(t.id, true);
    const newTitle = editValue.trim();
    setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, title: newTitle } : x));
    setEditingId(null);
    try {
      const r = await fetch("/api/google/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: t.listId, taskId: t.id, updates: { title: newTitle } }),
      });
      if (!r.ok) throw new Error("Échec");
    } catch {
      setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, title: t.title } : x));
      setError("Modification impossible");
    } finally {
      markPending(t.id, false);
    }
  };

  const setDueDate = async (t: GTask, isoDate: string | null) => {
    markPending(t.id, true);
    const dueIso = isoDate ? `${isoDate}T00:00:00.000Z` : null;
    setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, due: dueIso ?? undefined } : x));
    try {
      const updates: Record<string, unknown> = isoDate ? { due: dueIso } : { due: null };
      const r = await fetch("/api/google/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: t.listId, taskId: t.id, updates }),
      });
      if (!r.ok) throw new Error("Échec");
    } catch {
      setError("Date impossible à modifier");
    } finally {
      markPending(t.id, false);
    }
  };

  if (connected === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--accent-blue)12" }}>
          <CheckSquare size={26} className="text-accent-blue" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Connecte Google Tasks</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2">Va dans Réglages pour connecter ton compte Google.</p>
        </div>
        <a
          href="/reglages"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-blue text-white rounded-xl text-[13px] font-semibold hover:opacity-90 transition-all"
        >
          Aller aux réglages
        </a>
      </div>
    );
  }

  const tasksInList = tasks.filter((t) => t.listId === activeListId);
  const open = tasksInList.filter((t) => t.status !== "completed");
  const done = tasksInList.filter((t) => t.status === "completed");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-7 pt-6 pb-4 border-b border-b-primary flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5">
            <CheckSquare size={18} className="text-accent-blue" /> Google Tasks
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {tasksInList.length} tâche{tasksInList.length > 1 ? "s" : ""} · {open.length} ouverte{open.length > 1 ? "s" : ""}
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

      {/* Onglets de listes */}
      {lists.length > 0 && (
        <div className="shrink-0 px-7 pt-3 pb-2 flex gap-2 overflow-x-auto border-b border-b-primary">
          {lists.map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveListId(l.id)}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium whitespace-nowrap transition-all ${
                activeListId === l.id
                  ? "bg-accent-blue text-white"
                  : "bg-empty-bg text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              }`}
            >
              {l.title || "(sans nom)"}
              <span className="ml-1.5 opacity-70">
                {tasks.filter((t) => t.listId === l.id && t.status !== "completed").length}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-4">

          {error && (
            <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[var(--accent-red-light)] text-[var(--accent-red)] text-[12.5px]">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)}><X size={14} /></button>
            </div>
          )}

          {/* Ajout rapide */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") create(); }}
              placeholder="Nouvelle tâche…"
              className="flex-1 bg-surface border border-b-primary rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)]"
            />
            <button
              onClick={create}
              disabled={creating || !newTitle.trim() || !activeListId}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-accent-blue text-white rounded-xl text-[13px] font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Ajouter
            </button>
          </div>

          {loading && tasks.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={20} className="animate-spin text-[var(--text-secondary)]" />
            </div>
          ) : (
            <>
              {/* Tâches ouvertes */}
              <div className="flex flex-col gap-2">
                {open.length === 0 ? (
                  <div className="rounded-2xl bg-empty-bg border border-b-primary px-5 py-8 text-center">
                    <p className="text-[13px] text-[var(--text-secondary)]">Aucune tâche ouverte dans cette liste.</p>
                  </div>
                ) : (
                  open.map((t) => (
                    <TaskRow
                      key={t.id}
                      t={t}
                      pending={pending.has(t.id)}
                      editing={editingId === t.id}
                      editValue={editValue}
                      onToggle={() => toggle(t)}
                      onDelete={() => remove(t)}
                      onStartEdit={() => { setEditingId(t.id); setEditValue(t.title || ""); }}
                      onChangeEdit={setEditValue}
                      onSaveEdit={() => saveEdit(t)}
                      onCancelEdit={() => setEditingId(null)}
                      onSetDate={(d) => setDueDate(t, d)}
                    />
                  ))
                )}
              </div>

              {/* Tâches complétées */}
              {done.length > 0 && (
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="flex items-center gap-2 px-2 py-1 text-[11px] text-[var(--text-secondary)] uppercase tracking-wider font-medium hover:text-[var(--text-primary)]"
                  >
                    {showCompleted ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    Complétées ({done.length})
                  </button>
                  {showCompleted && done.map((t) => (
                    <TaskRow
                      key={t.id}
                      t={t}
                      pending={pending.has(t.id)}
                      editing={false}
                      editValue=""
                      onToggle={() => toggle(t)}
                      onDelete={() => remove(t)}
                      onStartEdit={() => {}}
                      onChangeEdit={() => {}}
                      onSaveEdit={() => {}}
                      onCancelEdit={() => {}}
                      onSetDate={() => {}}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskRow({
  t, pending, editing, editValue,
  onToggle, onDelete, onStartEdit, onChangeEdit, onSaveEdit, onCancelEdit, onSetDate,
}: {
  t: GTask;
  pending: boolean;
  editing: boolean;
  editValue: string;
  onToggle: () => void;
  onDelete: () => void;
  onStartEdit: () => void;
  onChangeEdit: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onSetDate: (iso: string | null) => void;
}) {
  const completed = t.status === "completed";
  const dueDate   = t.due ? t.due.slice(0, 10) : "";

  const formatDue = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dayOnly = new Date(d); dayOnly.setHours(0, 0, 0, 0);
    const diffDays = Math.round((dayOnly.getTime() - today.getTime()) / (86400000));
    if (diffDays === 0)  return "Aujourd'hui";
    if (diffDays === 1)  return "Demain";
    if (diffDays === -1) return "Hier";
    if (diffDays < 0)    return `Il y a ${Math.abs(diffDays)}j`;
    if (diffDays < 7)    return `Dans ${diffDays}j`;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const overdue = t.due && new Date(t.due) < new Date() && !completed;

  return (
    <div className={`group flex items-start gap-3 px-4 py-3 rounded-2xl border border-b-primary transition-all ${pending ? "opacity-60" : ""} ${completed ? "bg-empty-bg" : "bg-surface hover:bg-[var(--surface-2)]"}`}>
      <button
        onClick={onToggle}
        disabled={pending}
        className="shrink-0 mt-0.5 transition-all"
      >
        {completed ? (
          <CheckSquare size={18} className="text-accent-green" />
        ) : (
          <Square size={18} className="text-[var(--text-secondary)] hover:text-accent-blue" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            type="text"
            value={editValue}
            onChange={(e) => onChangeEdit(e.target.value)}
            onBlur={onSaveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit();
              if (e.key === "Escape") onCancelEdit();
            }}
            className="w-full bg-empty-bg border border-b-primary rounded-lg px-2 py-1 text-[14px] focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)]"
          />
        ) : (
          <p
            onClick={onStartEdit}
            className={`text-[14px] cursor-text leading-snug ${
              completed
                ? "line-through text-[var(--text-secondary)]"
                : "text-[var(--text-primary)]"
            }`}
          >
            {t.title || "(sans titre)"}
          </p>
        )}
        {t.notes && (
          <p className="text-[11.5px] text-[var(--text-secondary)] mt-1 leading-relaxed line-clamp-2">{t.notes}</p>
        )}
        {(t.due || !completed) && (
          <div className="mt-2 flex items-center gap-2">
            <label className={`inline-flex items-center gap-1 text-[11px] cursor-pointer rounded-md px-1.5 py-0.5 transition-all ${
              overdue ? "bg-[var(--accent-red-light)] text-[var(--accent-red)]" :
              t.due   ? "bg-empty-bg text-[var(--text-secondary)]" : "text-[var(--text-secondary)] hover:bg-empty-bg"
            }`}>
              <CalendarIcon size={11} />
              {t.due ? formatDue(t.due) : "Ajouter une date"}
              <input
                type="date"
                value={dueDate}
                onChange={(e) => onSetDate(e.target.value || null)}
                className="absolute opacity-0 w-0 h-0"
              />
            </label>
            {t.due && (
              <button
                onClick={() => onSetDate(null)}
                className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--accent-red)]"
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>

      <button
        onClick={onDelete}
        disabled={pending}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-[var(--accent-red)] transition-all"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
