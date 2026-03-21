"use client";

import { useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus, RefreshCcw, Check, Inbox, Flame,
  ChevronDown, ChevronRight, X, Loader2,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Task, IncupTag } from "@/store/useAppStore";
import confetti from "canvas-confetti";

// ─── INCUP config ─────────────────────────────────────────────────────────────

const INCUP_TAGS: { tag: IncupTag; color: string; bg: string }[] = [
  { tag: "Intérêt",   color: "#06b6d4", bg: "rgba(6,182,212,0.08)"  },
  { tag: "Nouveauté", color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
  { tag: "Challenge", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  { tag: "Urgence",   color: "#ef4444", bg: "rgba(239,68,68,0.08)"  },
  { tag: "Passion",   color: "#22c55e", bg: "rgba(34,197,94,0.08)"  },
];

// ─── Variantes ────────────────────────────────────────────────────────────────

const cardVariants = {
  initial: { opacity: 0, y: -8, scale: 0.99 },
  animate: { opacity: 1, y: 0,   scale: 1,    transition: { duration: 0.25, ease: "easeOut" as const } },
  exit:    { opacity: 0, x: 40,  scale: 0.97, transition: { duration: 0.2,  ease: "easeIn"  as const } },
};

// ─── MicroStep Row ────────────────────────────────────────────────────────────

function MicroStepRow({
  step, taskId,
}: {
  step: { id: string; text: string; done: boolean };
  taskId: string;
}) {
  const { toggleMicroStep, deleteMicroStep } = useAppStore();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2.5 py-1.5 group/ms"
    >
      <div className="w-px h-3 bg-zinc-800/60 shrink-0 ml-1.5" />
      <button
        onClick={() => toggleMicroStep(taskId, step.id)}
        className="shrink-0 w-4 h-4 rounded-md border border-zinc-700/80 hover:border-dopa-green flex items-center justify-center transition-all"
        style={{ background: step.done ? "rgba(34,197,94,0.12)" : "transparent" }}
      >
        {step.done && <Check size={9} className="text-dopa-green" strokeWidth={3} />}
      </button>
      <span
        className="flex-1 text-[11px] leading-snug transition-colors"
        style={{ color: step.done ? "#52525b" : "#a1a1aa", textDecoration: step.done ? "line-through" : "none" }}
      >
        {step.text}
      </span>
      <button
        onClick={() => deleteMicroStep(taskId, step.id)}
        className="opacity-0 group-hover/ms:opacity-100 transition-opacity text-zinc-700 hover:text-zinc-400"
      >
        <X size={10} />
      </button>
    </motion.div>
  );
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────

function TaskCard({ task, index }: { task: Task; index: number }) {
  const {
    completeTask, toggleExpand, addMicroStep,
    toggleTag, lastCritical, setLastActive,
  } = useAppStore();
  const [checking, setChecking]   = useState(false);
  const [microInput, setMicroInput] = useState("");

  const doneCount  = task.microSteps.filter((ms) => ms.done).length;
  const totalSteps = task.microSteps.length;
  const progress   = totalSteps > 0 ? doneCount / totalSteps : 0;

  const handleCheck = async () => {
    if (checking || task.status === "done") return;
    setChecking(true);
    setLastActive(task.id);
    await new Promise((r) => setTimeout(r, 220));
    completeTask(task.id);
    if (lastCritical) {
      confetti({
        particleCount: 140,
        spread: 85,
        origin: { y: 0.5 },
        colors: ["#22c55e", "#06b6d4", "#7c3aed", "#f59e0b", "#ffffff"],
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
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="rounded-2xl border overflow-hidden transition-all duration-200"
      style={{
        borderColor: task.expanded ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
        background: task.expanded ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.015)",
      }}
    >
      {/* Ligne principale */}
      <div className="flex items-center gap-3 px-4 py-3.5 group">
        {/* Numéro */}
        <span className="text-[10px] text-zinc-700 font-mono w-4 shrink-0 select-none text-center">
          {index + 1}
        </span>

        {/* Cercle check */}
        <button
          onClick={handleCheck}
          disabled={checking}
          className="shrink-0 w-[22px] h-[22px] rounded-full border-2 border-zinc-700/80 hover:border-dopa-green flex items-center justify-center transition-all group-hover:border-dopa-green/40"
          aria-label="Valider la tâche"
        >
          {checking ? (
            <Loader2 size={11} className="text-dopa-green animate-spin" />
          ) : (
            <motion.div animate={{ scale: checking ? 1 : 0, opacity: checking ? 1 : 0 }}>
              <Check size={11} className="text-dopa-green" strokeWidth={3} />
            </motion.div>
          )}
        </button>

        {/* Texte */}
        <span className="flex-1 text-[13px] text-zinc-200 leading-snug min-w-0 truncate font-medium">
          {task.text}
        </span>

        {/* Badge micro-progress */}
        {totalSteps > 0 && (
          <span className="text-[10px] text-zinc-500 font-mono shrink-0 bg-zinc-800/50 px-1.5 py-0.5 rounded-md">
            {doneCount}/{totalSteps}
          </span>
        )}

        {/* Badge XP hover */}
        <span className="text-[10px] text-dopa-green/60 font-mono opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          +25 XP
        </span>

        {/* Toggle expand */}
        <button
          onClick={() => toggleExpand(task.id)}
          className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/50 transition-all ml-0.5"
          aria-label="Détails"
        >
          {task.expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
      </div>

      {/* Progress bar micro-étapes */}
      {totalSteps > 0 && (
        <div className="mx-4 h-[3px] rounded-full bg-zinc-800/60 overflow-hidden mb-1">
          <motion.div
            className="h-full rounded-full bg-dopa-cyan"
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
          />
        </div>
      )}

      {/* Panel étendu */}
      <AnimatePresence>
        {task.expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3.5 pt-2 flex flex-col gap-3">

              {/* Tags INCUP */}
              <div className="flex flex-wrap gap-1.5">
                {INCUP_TAGS.map(({ tag, color, bg }) => {
                  const active = task.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(task.id, tag)}
                      className="text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-all"
                      style={{
                        color: active ? color : "#52525b",
                        background: active ? bg : "transparent",
                        border: `1px solid ${active ? color + "30" : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Micro-étapes existantes */}
              <div className="flex flex-col">
                <AnimatePresence>
                  {task.microSteps.map((ms) => (
                    <MicroStepRow key={ms.id} step={ms} taskId={task.id} />
                  ))}
                </AnimatePresence>
              </div>

              {/* Input nouvelle micro-étape */}
              <form onSubmit={handleAddMicro} className="flex items-center gap-2.5">
                <div className="w-px h-3 bg-zinc-800/60 shrink-0 ml-1.5" />
                <input
                  value={microInput}
                  onChange={(e) => setMicroInput(e.target.value)}
                  placeholder="Ajouter une micro-étape…"
                  className="flex-1 text-[11px] bg-transparent border-b border-zinc-800/60 focus:border-zinc-600 focus:outline-none text-zinc-400 placeholder:text-zinc-700 py-1 transition-colors"
                />
                {microInput.trim() && (
                  <button
                    type="submit"
                    className="text-[10px] text-dopa-green hover:opacity-80 shrink-0 font-semibold bg-dopa-green/10 px-2 py-0.5 rounded-md"
                  >
                    Ajouter
                  </button>
                )}
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function FocusColumn() {
  const { tasks, addTask, newStart } = useAppStore();
  const [input, setInput]           = useState("");
  const [showNewStart, setShowNewStart] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const todayTasks = tasks.filter((t) => t.status === "today");
  const inboxCount = tasks.filter((t) => t.status === "inbox").length;
  const isFull     = todayTasks.length >= 5;

  // Cmd+K global → focus omnibar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
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
    addTask(input.trim());
    setInput("");
  };

  const handleNewStart = () => {
    newStart();
    setShowNewStart(false);
  };

  return (
    <div className="flex flex-col h-full px-6 py-6 gap-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-bold text-zinc-100 tracking-tight">
            Focus du Jour
          </h2>
          <p className="text-[11px] text-zinc-500 mt-1">
            {todayTasks.length}/5 tâches actives · {inboxCount} en inbox
          </p>
        </div>

        {/* Body Doubling */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <Flame size={12} className="text-orange-400" />
          <span className="text-[11px] text-zinc-500 font-medium">
            145 cerveaux en focus
          </span>
        </div>
      </div>

      {/* ── Omnibar ── */}
      <form onSubmit={handleSubmit} className="shrink-0">
        <div className="relative flex items-center">
          <Plus size={15} className="absolute left-4 text-zinc-600 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Capture une idée ici… (Cmd+K)"
            className="w-full pl-10 pr-28 py-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 focus:border-zinc-600 focus:bg-zinc-900 focus:outline-none text-sm text-zinc-200 placeholder:text-zinc-600 transition-all"
          />
          <div className="absolute right-3 flex items-center gap-2">
            {!input.trim() && (
              <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-600 border border-zinc-700/50 font-mono">
                ⌘K
              </kbd>
            )}
            <AnimatePresence>
              {input.trim() && (
                <motion.button
                  type="submit"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.15 }}
                  className="px-3.5 py-1.5 rounded-xl bg-dopa-green text-black text-xs font-bold hover:bg-dopa-green/90 transition-colors"
                >
                  Ajouter
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </form>

      {/* ── Sous-titre + Nouveau Départ ── */}
      <div className="flex items-center justify-between shrink-0">
        <span className="text-[10px] text-zinc-600 uppercase tracking-[0.1em] font-semibold">
          Priorités du jour
        </span>

        {todayTasks.length > 0 && (
          <AnimatePresence mode="wait">
            {!showNewStart ? (
              <motion.button
                key="trigger"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowNewStart(true)}
                className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800/50"
              >
                <RefreshCcw size={11} />
                Nouveau Départ
              </motion.button>
            ) : (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2.5"
              >
                <span className="text-[11px] text-zinc-500">Archiver tout ?</span>
                <button
                  onClick={handleNewStart}
                  className="text-[11px] text-dopa-green font-semibold hover:opacity-80 px-2 py-0.5 rounded-md bg-dopa-green/10"
                >
                  Oui
                </button>
                <button
                  onClick={() => setShowNewStart(false)}
                  className="text-[11px] text-zinc-600 hover:text-zinc-400"
                >
                  Non
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ── Liste tâches ── */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2.5">
        <AnimatePresence mode="popLayout">
          {todayTasks.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full gap-4 py-16"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Inbox size={20} className="text-zinc-600" />
              </div>
              <div className="text-center">
                <p className="text-xs text-zinc-500 mb-1">
                  Aucune tâche pour aujourd&apos;hui.
                </p>
                <p className="text-[11px] text-zinc-600">
                  Capture quelque chose ci-dessus.
                </p>
              </div>
            </motion.div>
          ) : (
            todayTasks.map((task, i) => (
              <TaskCard key={task.id} task={task} index={i} />
            ))
          )}
        </AnimatePresence>

        {/* Avertissement 5/5 */}
        <AnimatePresence>
          {isFull && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center py-2 px-3 rounded-xl mt-1"
              style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.1)" }}
            >
              <p className="text-[11px] text-dopa-xp font-medium">
                Limite atteinte · nouvelles tâches → Inbox
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}