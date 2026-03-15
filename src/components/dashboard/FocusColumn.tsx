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
  { tag: "Intérêt",   color: "#06b6d4", bg: "rgba(6,182,212,0.1)"  },
  { tag: "Nouveauté", color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  { tag: "Challenge", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  { tag: "Urgence",   color: "#ef4444", bg: "rgba(239,68,68,0.1)"  },
  { tag: "Passion",   color: "#22c55e", bg: "rgba(34,197,94,0.1)"  },
];

// ─── Variantes ────────────────────────────────────────────────────────────────

const cardVariants = {
  initial: { opacity: 0, y: -10, scale: 0.98 },
  animate: { opacity: 1, y: 0,   scale: 1,    transition: { duration: 0.25, ease: "easeOut" as const } },
  exit:    { opacity: 0, x: 50,  scale: 0.96, transition: { duration: 0.2,  ease: "easeIn"  as const } },
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
      className="flex items-center gap-2 py-1 group/ms"
    >
      <div className="w-px h-3 bg-zinc-800 shrink-0 ml-1" />
      <button
        onClick={() => toggleMicroStep(taskId, step.id)}
        className="shrink-0 w-3.5 h-3.5 rounded border border-zinc-700 hover:border-dopa-green flex items-center justify-center transition-colors"
        style={{ background: step.done ? "rgba(34,197,94,0.15)" : "transparent" }}
      >
        {step.done && <Check size={8} className="text-dopa-green" strokeWidth={3} />}
      </button>
      <span
        className="flex-1 text-[11px] leading-snug transition-colors"
        style={{ color: step.done ? "#52525b" : "#a1a1aa", textDecoration: step.done ? "line-through" : "none" }}
      >
        {step.text}
      </span>
      <button
        onClick={() => deleteMicroStep(taskId, step.id)}
        className="opacity-0 group-hover/ms:opacity-100 transition-opacity text-zinc-700 hover:text-zinc-500"
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
  const microRef = useRef<HTMLInputElement>(null);

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
      className="rounded-xl border overflow-hidden transition-colors"
      style={{
        borderColor: task.expanded ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
        background: task.expanded ? "#111113" : "#0d0d0f",
      }}
    >
      {/* Ligne principale */}
      <div className="flex items-center gap-2.5 px-3.5 py-3 group">
        {/* Numéro */}
        <span className="text-[10px] text-zinc-700 font-mono w-3.5 shrink-0 select-none">
          {index + 1}
        </span>

        {/* Cercle check */}
        <button
          onClick={handleCheck}
          disabled={checking}
          className="shrink-0 w-5 h-5 rounded-full border-2 border-zinc-700 hover:border-dopa-green flex items-center justify-center transition-all group-hover:border-dopa-green/50"
          aria-label="Valider la tâche"
        >
          {checking ? (
            <Loader2 size={10} className="text-dopa-green animate-spin" />
          ) : (
            <motion.div animate={{ scale: checking ? 1 : 0, opacity: checking ? 1 : 0 }}>
              <Check size={10} className="text-dopa-green" strokeWidth={3} />
            </motion.div>
          )}
        </button>

        {/* Texte */}
        <span className="flex-1 text-sm text-zinc-200 leading-snug min-w-0 truncate">
          {task.text}
        </span>

        {/* Badge micro-progress si des étapes existent */}
        {totalSteps > 0 && (
          <span className="text-[10px] text-zinc-600 font-mono shrink-0">
            {doneCount}/{totalSteps}
          </span>
        )}

        {/* Badge XP */}
        <span className="text-[10px] text-zinc-700 font-mono opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          +25 XP
        </span>

        {/* Toggle expand */}
        <button
          onClick={() => toggleExpand(task.id)}
          className="shrink-0 text-zinc-700 hover:text-zinc-500 transition-colors ml-1"
          aria-label="Détails"
        >
          {task.expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
      </div>

      {/* Progress bar micro-étapes */}
      {totalSteps > 0 && (
        <div className="mx-3.5 h-0.5 rounded-full bg-zinc-800 overflow-hidden mb-0.5">
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
            <div className="px-3.5 pb-3 pt-1 flex flex-col gap-2.5">

              {/* Tags INCUP */}
              <div className="flex flex-wrap gap-1.5">
                {INCUP_TAGS.map(({ tag, color, bg }) => {
                  const active = task.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(task.id, tag)}
                      className="text-[10px] px-2 py-0.5 rounded-full font-semibold transition-all"
                      style={{
                        color: active ? color : "#52525b",
                        background: active ? bg : "transparent",
                        border: `1px solid ${active ? color + "40" : "#27272a"}`,
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
              <form onSubmit={handleAddMicro} className="flex items-center gap-2">
                <div className="w-px h-3 bg-zinc-800 shrink-0 ml-1" />
                <input
                  ref={microRef}
                  value={microInput}
                  onChange={(e) => setMicroInput(e.target.value)}
                  placeholder="Ajouter une micro-étape…"
                  className="flex-1 text-[11px] bg-transparent border-b border-zinc-800 focus:border-zinc-600 focus:outline-none text-zinc-400 placeholder:text-zinc-700 py-0.5 transition-colors"
                />
                {microInput.trim() && (
                  <button
                    type="submit"
                    className="text-[10px] text-dopa-green hover:opacity-80 shrink-0 font-semibold"
                  >
                    ↵
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
    <div className="flex flex-col h-full px-5 py-5 gap-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-bold text-zinc-200 tracking-tight">
            Focus du Jour
          </h2>
          <p className="text-[11px] text-zinc-600 mt-0.5">
            {todayTasks.length}/5 tâches actives · {inboxCount} en inbox
          </p>
        </div>

        {/* Body Doubling */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-zinc-800 bg-zinc-900/40">
          <Flame size={11} className="text-orange-400" />
          <span className="text-[11px] text-zinc-500 font-medium">
            145 cerveaux en focus
          </span>
        </div>
      </div>

      {/* ── Omnibar ── */}
      <form onSubmit={handleSubmit} className="shrink-0">
        <div className="relative flex items-center">
          <Plus size={14} className="absolute left-3.5 text-zinc-600 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Capture une idée ici… (Cmd+K)"
            className="w-full pl-9 pr-24 py-3 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-zinc-600 focus:outline-none text-sm text-zinc-200 placeholder:text-zinc-700 transition-colors"
          />
          <AnimatePresence>
            {input.trim() && (
              <motion.button
                type="submit"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15 }}
                className="absolute right-2 px-3 py-1.5 rounded-lg bg-dopa-green text-black text-xs font-bold"
              >
                Ajouter
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </form>

      {/* ── Sous-titre + Nouveau Départ ── */}
      <div className="flex items-center justify-between shrink-0">
        <span className="text-[10px] text-zinc-700 uppercase tracking-widest font-semibold">
          Priorités du jour
        </span>

        {todayTasks.length > 0 && (
          <AnimatePresence mode="wait">
            {!showNewStart ? (
              <motion.button
                key="trigger"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowNewStart(true)}
                className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <RefreshCcw size={11} />
                Nouveau Départ
              </motion.button>
            ) : (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <span className="text-[11px] text-zinc-500">Archiver tout ?</span>
                <button
                  onClick={handleNewStart}
                  className="text-[11px] text-dopa-green font-semibold hover:opacity-80"
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
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {todayTasks.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full gap-3 py-16"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <Inbox size={18} className="text-zinc-700" />
              </div>
              <p className="text-xs text-zinc-700 text-center leading-relaxed">
                Aucune tâche pour aujourd&apos;hui.<br />
                <span className="text-zinc-600">Capture quelque chose ci-dessus.</span>
              </p>
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
            <motion.p
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-[11px] text-zinc-600 text-center pt-1 italic"
            >
              Limite atteinte · nouvelles tâches → Inbox
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
