"use client";

import { useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check, Plus, Clock, ChevronDown, ChevronRight,
  X, Loader2, Sparkles, ArrowRight,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Task, IncupTag } from "@/store/useAppStore";
import confetti from "canvas-confetti";

const INCUP_TAGS: IncupTag[] = ["Intérêt", "Nouveauté", "Challenge", "Urgence", "Passion"];

const getPriorityColor = (priority?: "low" | "medium" | "high"): string => {
  switch (priority) {
    case "high":   return "var(--accent-red)";
    case "medium": return "var(--accent-orange)";
    case "low":
    default:       return "var(--accent-green)";
  }
};

/* ═════════════════════════════════════════════════════════════════════════
   HERO TASK CARD — la tâche focus actuelle, XL, mono-attention
   ═════════════════════════════════════════════════════════════════════════ */
function HeroTaskCard({ task }: { task: Task }) {
  const { completeTask, toggleExpand, addMicroStep, toggleMicroStep, deleteMicroStep, toggleTag, lastCritical, setLastActive } = useAppStore();
  const [checking, setChecking] = useState(false);
  const [microInput, setMicroInput] = useState("");

  const doneCount = task.microSteps.filter((ms) => ms.done).length;
  const totalSteps = task.microSteps.length;
  const progress = totalSteps > 0 ? doneCount / totalSteps : 0;

  const handleCheck = async () => {
    if (checking || task.status === "done") return;
    setChecking(true);
    setLastActive(task.id);
    await new Promise((r) => setTimeout(r, 220));
    completeTask(task.id);
    if (lastCritical) {
      confetti({
        particleCount: 120, spread: 75, origin: { y: 0.4 },
        colors: ["#7C6BD4", "#5FA87D", "#D9944E", "#4F46E5", "#FFFFFF"],
      });
    }
  };

  const handleAddMicro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!microInput.trim()) return;
    addMicroStep(task.id, microInput.trim());
    setMicroInput("");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-primary)] p-6"
    >
      {/* Priority + Label */}
      <div className="flex items-center gap-2 mb-4">
        {task.priority && (
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: getPriorityColor(task.priority) }}
          />
        )}
        <span className="text-[12px] font-medium text-[var(--text-secondary)]">
          Focus actuel
        </span>
      </div>

      {/* Title */}
      <h2 className="text-[24px] font-semibold text-[var(--text-primary)] mb-4 max-w-xl leading-tight">
        {task.text}
      </h2>

      {/* Meta row */}
      <div className="flex items-center gap-2 mb-5">
        {task.estimatedMinutes && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium" style={{ background: "var(--accent-blue-light)", color: "var(--accent-blue)" }}>
            <Clock size={11} strokeWidth={1.8} />
            <span className="tabular-nums">~{task.estimatedMinutes} min</span>
          </div>
        )}
        {totalSteps > 0 && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium" style={{ background: "var(--accent-green-light)", color: "var(--accent-green)" }}>
            <span className="tabular-nums">
              {doneCount} / {totalSteps} étapes
            </span>
          </div>
        )}
      </div>

      {/* Big complete button */}
      <div className="flex items-center gap-2 mb-5">
        <motion.button
          onClick={handleCheck}
          disabled={checking}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2.5 h-9 px-3.5 rounded-xl text-[12.5px] font-medium transition-all"
          style={{
            background: "var(--accent-green-light)",
            color: "var(--accent-green)",
            borderColor: "color-mix(in srgb, var(--accent-green) 25%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent-green) 25%, transparent)",
            opacity: checking ? 0.7 : 1,
          }}
        >
          {checking ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Check size={14} strokeWidth={2.5} />
          )}
          <span>Terminer</span>
        </motion.button>
        <button
          onClick={() => toggleExpand(task.id)}
          className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-[12.5px] font-medium border transition-colors"
          style={{
            background: "var(--card-bg)",
            color: "var(--text-secondary)",
            borderColor: "var(--border-primary)",
          }}
        >
          {task.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>{task.expanded ? "Replier" : "Étapes"}</span>
        </button>
      </div>

      {/* Progress bar */}
      {totalSteps > 0 && (
        <div className="flex items-center gap-2 mb-5">
          <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "var(--accent-green)" }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums font-mono">
            {doneCount}/{totalSteps}
          </span>
        </div>
      )}

      {/* Expanded content */}
      <AnimatePresence>
        {task.expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-2 flex flex-col gap-5">
              {/* INCUP tags */}
              <div>
                <p className="text-[10px] font-medium tracking-wider uppercase text-[var(--text-tertiary)] mb-2.5">
                  Motivateurs
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {INCUP_TAGS.map((tag) => {
                    const active = task.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(task.id, tag)}
                        className="inline-flex items-center text-[12px] font-medium px-2 py-[3px] rounded-md transition-all"
                        style={{
                          color: active ? "var(--accent-blue)" : "var(--text-secondary)",
                          background: active ? "var(--accent-blue-light)" : "var(--surface-2)",
                          border: `1px solid ${active ? "var(--accent-blue)" : "var(--border-primary)"}`,
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Micro-steps */}
              <div>
                <p className="text-[10px] font-medium tracking-wider uppercase text-[var(--text-tertiary)] mb-2.5">
                  Micro-étapes
                </p>
                <div className="flex flex-col">
                  <AnimatePresence>
                    {task.microSteps.map((step) => (
                      <motion.div
                        key={step.id}
                        layout
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-3 py-2 group/ms"
                      >
                        <button
                          onClick={() => toggleMicroStep(task.id, step.id)}
                          className="shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-all"
                          style={{
                            borderColor: step.done ? "var(--accent-blue)" : "var(--border-secondary)",
                            background: step.done ? "var(--accent-blue)" : "transparent",
                          }}
                        >
                          {step.done && <Check size={9} className="text-white" strokeWidth={3} />}
                        </button>
                        <span
                          className="flex-1 text-[13px] leading-snug"
                          style={{
                            color: step.done ? "var(--text-tertiary)" : "var(--text-primary)",
                            textDecoration: step.done ? "line-through" : "none",
                          }}
                        >
                          {step.text}
                        </span>
                        <button
                          onClick={() => deleteMicroStep(task.id, step.id)}
                          className="opacity-0 group-hover/ms:opacity-100 text-t-tertiary hover:text-t-primary transition-opacity"
                        >
                          <X size={11} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <form onSubmit={handleAddMicro} className="flex items-center gap-2 mt-2">
                    <div className="shrink-0 w-4 h-4 rounded-full border border-dashed border-b-hover" />
                    <input
                      value={microInput}
                      onChange={(e) => setMicroInput(e.target.value)}
                      placeholder="Ajouter une micro-étape..."
                      className="flex-1 text-[13px] bg-transparent py-1 text-t-primary placeholder:text-t-tertiary focus:outline-none"
                    />
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   UP NEXT ROW — mini-ligne compacte pour une prochaine tâche
   ═════════════════════════════════════════════════════════════════════════ */
function UpNextRow({ task, onPromote }: { task: Task; onPromote: (id: string) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 px-4 py-3.5 rounded-lg bg-[var(--card-bg)] border border-[var(--border-primary)] hover:bg-[var(--surface-2)] transition-colors group cursor-pointer"
      onClick={() => onPromote(task.id)}
    >
      {task.priority && (
        <div
          className="shrink-0 w-1.5 h-1.5 rounded-full"
          style={{ background: getPriorityColor(task.priority) }}
        />
      )}
      <span className="flex-1 text-[14px] font-medium text-[var(--text-primary)] leading-snug truncate">
        {task.text}
      </span>
      {task.estimatedMinutes && (
        <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums shrink-0">
          {task.estimatedMinutes}m
        </span>
      )}
      <ArrowRight size={13} className="text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   MAIN HERO
   ═════════════════════════════════════════════════════════════════════════ */
export default function FocusHero() {
  const { tasks, addInboxItem, settings, reorderTasks } = useAppStore();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const todayTasks = tasks.filter((t) => t.status === "today");
  const currentFocus = todayTasks[0];
  const upNext = todayTasks.slice(1, 4);
  const inboxCount = tasks.filter((t) => t.status === "inbox").length;
  const maxDailyTasks = settings.maxDailyTasks || 5;

  const doneCount = tasks.filter((t) =>
    t.status === "done" && t.completedAt &&
    new Date(t.completedAt).toDateString() === new Date().toDateString()
  ).length;
  const totalToday = todayTasks.length + doneCount;
  const progressPercent = totalToday > 0 ? (doneCount / totalToday) * 100 : 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    addInboxItem(input.trim(), "task");
    setInput("");
  };

  const handlePromote = (id: string) => {
    const idx = todayTasks.findIndex((t) => t.id === id);
    if (idx <= 0) return;
    const newOrder = [...todayTasks];
    const [moved] = newOrder.splice(idx, 1);
    newOrder.unshift(moved);
    reorderTasks(newOrder.map((t) => t.id));
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-10 py-14 gap-10">

        {/* Greeting header */}
        <div className="shrink-0">
          <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight leading-none">
            {todayTasks.length === 0 && doneCount === 0
              ? "Respire. Commence où tu veux."
              : todayTasks.length === 0 && doneCount > 0
              ? "Journée bouclée."
              : doneCount === 0
              ? `${todayTasks.length} ${todayTasks.length > 1 ? "choses" : "chose"} à faire.`
              : `${doneCount} terminée${doneCount > 1 ? "s" : ""} · ${todayTasks.length} en cours.`}
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-2">
            Aujourd'hui · une seule à la fois
          </p>
          {totalToday > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "var(--accent-green)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
              <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums font-medium">
                {Math.round(progressPercent)}%
              </span>
            </div>
          )}
        </div>

        {/* Hero focus task */}
        <AnimatePresence mode="popLayout">
          {currentFocus ? (
            <HeroTaskCard key={currentFocus.id} task={currentFocus} />
          ) : (
            <motion.div
              key="empty-hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl bg-[var(--card-bg)] border border-[var(--border-primary)] p-8 flex flex-col items-center justify-center text-center gap-4"
            >
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "var(--surface-1)" }}>
                <Sparkles size={20} className="text-[var(--text-secondary)]" strokeWidth={1.5} />
              </div>
              <p className="text-[16px] font-medium text-[var(--text-primary)]">Rien à faire maintenant.</p>
              <p className="text-[13px] text-[var(--text-secondary)] max-w-xs leading-relaxed">
                Capture une idée ci-dessous ou consulte l'inbox.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Capture bar */}
        <form onSubmit={handleSubmit} className="shrink-0">
          <div className="relative flex items-center rounded-xl bg-[var(--card-bg)] border border-[var(--border-primary)] transition-colors focus-within:border-[var(--accent-blue)]">
            <div className="pl-3.5 pr-2">
              <Plus size={14} className="text-[var(--text-tertiary)]" strokeWidth={2} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Capturer une idée…"
              className="w-full py-3 pr-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] bg-transparent focus:outline-none"
            />
            <AnimatePresence>
              {input.trim() && (
                <motion.button
                  type="submit"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.12 }}
                  className="mr-1.5 h-8 px-2.5 rounded-lg text-[12px] font-medium transition-all"
                  style={{
                    background: "var(--accent-blue-light)",
                    color: "var(--accent-blue)",
                    border: "1px solid color-mix(in srgb, var(--accent-blue) 25%, transparent)",
                  }}
                >
                  → Inbox
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <p className="mt-2 px-1 text-[11px] text-[var(--text-tertiary)]">
            {inboxCount > 0 ? `${inboxCount} idée${inboxCount > 1 ? "s" : ""} en attente · ` : ""}
            Ctrl+Shift+I
          </p>
        </form>

        {/* Up next — compact list */}
        {upNext.length > 0 && (
          <div className="shrink-0">
            <p className="text-[12px] font-semibold text-[var(--text-secondary)] mb-3">
              À suivre
            </p>
            <div className="flex flex-col gap-2">
              <AnimatePresence mode="popLayout">
                {upNext.map((task) => (
                  <UpNextRow key={task.id} task={task} onPromote={handlePromote} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Overflow indicator */}
        {todayTasks.length > 4 && (
          <p className="shrink-0 text-[12px] text-[var(--text-tertiary)] text-center">
            +{todayTasks.length - 4} tâche{todayTasks.length - 4 > 1 ? "s" : ""} · max {maxDailyTasks}
          </p>
        )}
      </div>
    </div>
  );
}
