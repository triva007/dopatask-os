"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  Check,
  Circle,
  Star,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

interface GTask {
  id: string;
  title?: string;
  notes?: string;
  status?: "needsAction" | "completed";
  due?: string | null;
  updated?: string;
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
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export default function MobileTasksView() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [lists, setLists] = useState<GList[]>([]);
  const [tasks, setTasks] = useState<GTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [expandedList, setExpandedList] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());

  const addToast = useAppStore((s) => s.addToast);

  useEffect(() => {
    setStarred(loadStarred());
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/google/tasks", { cache: "no-store" });
      if (r.status === 401) {
        setConnected(false);
        return;
      }
      if (!r.ok) throw new Error("Erreur");
      const d = (await r.json()) as { lists: GList[]; tasks: GTask[] };
      setLists(d.lists || []);
      setTasks(d.tasks || []);
      setConnected(true);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const toggleTask = async (t: GTask) => {
    const next = t.status === "completed" ? "needsAction" : "completed";
    setPending((p) => new Set(p).add(t.id));
    setTasks((prev) =>
      prev.map((x) => (x.id === t.id ? { ...x, status: next } : x))
    );
    try {
      await fetch("/api/google/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listId: t.listId,
          taskId: t.id,
          updates: { status: next },
        }),
      });
      if (next === "completed") addToast("Tâche complétée ✓", "success");
    } catch {
      setTasks((prev) =>
        prev.map((x) => (x.id === t.id ? { ...x, status: t.status } : x))
      );
    } finally {
      setPending((p) => {
        const n = new Set(p);
        n.delete(t.id);
        return n;
      });
    }
  };

  if (connected === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">
          Google Tasks non connecté
        </p>
        <p className="text-[12px] text-[var(--text-secondary)] mb-2">
          Sur ton iPhone, tu dois te connecter une fois pour autoriser l'accès.
        </p>
        <a
          href="/api/google/auth"
          className="px-4 py-2.5 rounded-xl font-bold text-[12px] transition-all active:scale-95"
          style={{ background: "var(--accent-blue)", color: "#fff" }}
        >
          Connecter Google
        </a>
      </div>
    );
  }

  if (loading && tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-[var(--text-tertiary)]">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-[13px]">Chargement…</span>
      </div>
    );
  }

  // Group tasks by list
  const tasksByList = new Map<string, GTask[]>();
  lists.forEach((l) => tasksByList.set(l.id, []));
  tasks.forEach((t) => {
    const arr = tasksByList.get(t.listId) || [];
    arr.push(t);
    tasksByList.set(t.listId, arr);
  });

  const totalOpen = tasks.filter((t) => t.status !== "completed").length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold tracking-tight text-[var(--text-primary)]">
              Tâches
            </h1>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
              {totalOpen} ouverte{totalOpen > 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border-primary)",
            }}
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin text-[var(--text-tertiary)]" />
            ) : (
              <RefreshCw size={14} className="text-[var(--text-tertiary)]" />
            )}
          </button>
        </div>
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 mt-2">
        {lists.map((list) => {
          const listTasks = tasksByList.get(list.id) || [];
          const open = listTasks.filter((t) => t.status !== "completed");
          const done = listTasks.filter((t) => t.status === "completed");
          const isExpanded = expandedList === list.id || expandedList === null;

          return (
            <div
              key={list.id}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border-primary)",
              }}
            >
              {/* List header */}
              <button
                onClick={() =>
                  setExpandedList(expandedList === list.id ? null : list.id)
                }
                className="w-full flex items-center justify-between px-4 py-3 active:bg-[var(--surface-2)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: "var(--accent-purple)" }}
                  />
                  <span className="text-[13px] font-bold text-[var(--text-primary)]">
                    {list.title || "(sans nom)"}
                  </span>
                  <span
                    className="text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md"
                    style={{
                      background: "var(--surface-2)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {open.length}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp size={14} className="text-[var(--text-tertiary)]" />
                ) : (
                  <ChevronDown
                    size={14}
                    className="text-[var(--text-tertiary)]"
                  />
                )}
              </button>

              {/* Tasks */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-1">
                  {open.length === 0 && (
                    <p className="text-[11px] text-[var(--text-tertiary)] italic px-2 py-2">
                      Aucune tâche
                    </p>
                  )}
                  {open.map((t) => {
                    const isStarred = starred.has(t.id);
                    const isPending = pending.has(t.id);
                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[var(--surface-2)] active:bg-[var(--surface-3)] transition-colors"
                      >
                        <button
                          onClick={() => toggleTask(t)}
                          className="shrink-0"
                          disabled={isPending}
                        >
                          {isPending ? (
                            <Loader2
                              size={16}
                              className="animate-spin text-[var(--text-tertiary)]"
                            />
                          ) : (
                            <Circle
                              size={16}
                              className="text-[var(--text-tertiary)]"
                            />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-[var(--text-primary)] leading-tight truncate">
                            {t.title}
                          </p>
                          {t.due && (
                            <p className="text-[9px] text-[var(--text-tertiary)] mt-0.5 tabular-nums">
                              {new Date(t.due).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                              })}
                            </p>
                          )}
                        </div>
                        {isStarred && (
                          <Star
                            size={12}
                            className="text-[var(--accent-orange)] shrink-0"
                            fill="var(--accent-orange)"
                          />
                        )}
                      </div>
                    );
                  })}

                  {/* Completed count */}
                  {done.length > 0 && (
                    <p className="text-[10px] text-[var(--text-tertiary)] text-center pt-2">
                      <Check size={10} className="inline mr-1" />
                      {done.length} complétée{done.length > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
