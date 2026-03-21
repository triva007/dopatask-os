"use client";

import { useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  RefreshCcw, Check, Inbox,
  ChevronDown, ChevronRight, X, Loader2, Search,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Task, IncupTag } from "@/store/useAppStore";
import confetti from "canvas-confetti";

const INCUP_TAGS: { tag: IncupTag; color: string }[] = [
  { tag: "Intérêt",   color: "#67e8f9" },
  { tag: "Nouveauté", color: "#a78bfa" },
  { tag: "Challenge", color: "#fbbf24" },
  { tag: "Urgence",   color: "#fca5a5" },
  { tag: "Passion",   color: "#4ade80" },
];

const cardVariants = {
  initial: { opacity: 0, y: -6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit:    { opacity: 0, x: 30, transition: { duration: 0.15 } },
};

function MicroStepRow({ step, taskId }: { step: { id: string; text: string; done: boolean }; taskId: string }) {
  const { toggleMicroStep, deleteMicroStep } = useAppStore();
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2.5 py-1 group/ms">
      <button
        onClick={() => toggleMicroStep(taskId, step.id)}
        className="shrink-0 w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-all"
        style={{
          borderColor: step.done ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.1)",
          background: step.done ? "rgba(74,222,128,0.1)" : "transparent",
        }}
      >
        {step.done && <Check size={8} style={{ color: "#4ade80" }} strokeWidth={3} />}
      </button>
      <span className="flex-1 text-[11px] leading-snug" style={{ color: step.done ? "#3f3f46" : "#a1a1aa", textDecoration: step.done ? "line-through" : "none" }}>
        {step.text}
      </span>
      <button onClick={() => deleteMicroStep(taskId, step.id)} className="opacity-0 group-hover/ms:opacity-100 text-zinc-700 hover:text-zinc-400">
        <X size={9} />
      </button>
    </motion.div>
  );
}

function TaskCard({ task, index }: { task: Task; index: number }) {
  const { completeTask, toggleExpand, addMicroStep, toggleTag, lastCritical, setLastActive } = useAppStore();
  const [checking, setChecking] = useState(false);
  const [microInput, setMicroInput] = useState("");

  const doneCount = task.microSteps.filter((ms) => ms.done).length;
  const totalSteps = task.microSteps.length;
  const progress = totalSteps > 0 ? doneCount / totalSteps : 0;

  const handleCheck = async () => {
    if (checking || task.status === "done") return;
    setChecking(true);
    setLastActive(task.id);
    await new Promise((r) => setTimeout(r, 200));
    completeTask(task.id);
    if (lastCritical) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 }, colors: ["#4ade80", "#67e8f9", "#a78bfa", "#fbbf24", "#fff"] });
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
      layout variants={cardVariants} initial="initial" animate="animate" exit="exit"
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        border: `1px solid ${task.expanded ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`,
        background: task.expanded ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.02)",
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3 group">
        <span className="text-[10px] text-zinc-700 font-mono w-4 shrink-0 select-none text-center">{index + 1}</span>
        <button
          onClick={handleCheck} disabled={checking}
          className="shrink-0 w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-all"
          style={{ borderColor: "rgba(255,255,255,0.12)" }}
        >
          {checking ? <Loader2 size={10} className="animate-spin" style={{ color: "#4ade80" }} /> : null}
        </button>
        <span className="flex-1 text-[13px] text-zinc-200 leading-snug min-w-0 truncate" style={{ fontWeight: 450 }}>{task.text}</span>
        {totalSteps > 0 && (
          <span className="text-[10px] text-zinc-600 font-mono shrink-0 px-1.5 py-0.5 rounded-md" style={{ background: "rgba(255,255,255,0.04)" }}>
            {doneCount}/{totalSteps}
          </span>
        )}
        <span className="text-[10px] font-mono opacity-0 group-hover:opacity-100 shrink-0" style={{ color: "rgba(74,222,128,0.5)" }}>+25</span>
        <button onClick={() => toggleExpand(task.id)} className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-400 transition-all">
          {task.expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
      </div>

      {totalSteps > 0 && (
        <div className="mx-4 h-[2px] rounded-full overflow-hidden mb-1" style={{ background: "rgba(255,255,255,0.04)" }}>
          <motion.div className="h-full rounded-full" style={{ background: "#4ade80" }} animate={{ width: `${progress * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 18 }} />
        </div>
      )}

      <AnimatePresence>
        {task.expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-3 pt-1 flex flex-col gap-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {INCUP_TAGS.map(({ tag, color }) => {
                  const active = task.tags.includes(tag);
                  return (
                    <button key={tag} onClick={() => toggleTag(task.id, tag)} className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all"
                      style={{
                        color: active ? color : "#52525b",
                        background: active ? `${color}15` : "transparent",
                        border: `1px solid ${active ? color + "25" : "rgba(255,255,255,0.04)"}`,
                      }}
                    >{tag}</button>
                  );
                })}
              </div>
              <div className="flex flex-col">
                <AnimatePresence>
                  {task.microSteps.map((ms) => <MicroStepRow key={ms.id} step={ms} taskId={task.id} />)}
                </AnimatePresence>
              </div>
              <form onSubmit={handleAddMicro} className="flex items-center gap-2">
                <input value={microInput} onChange={(e) => setMicroInput(e.target.value)} placeholder="+ micro-étape"
                  className="flex-1 text-[11px] bg-transparent border-b py-1 text-zinc-400 placeholder:text-zinc-700 focus:outline-none transition-colors"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                />
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FocusColumn() {
  const { tasks, addTask, newStart } = useAppStore();
  const [input, setInput] = useState("");
  const [showNewStart, setShowNewStart] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const todayTasks = tasks.filter((t) => t.status === "today");
  const inboxCount = tasks.filter((t) => t.status === "inbox").length;
  const isFull = todayTasks.length >= 5;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); inputRef.current?.focus(); }
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

  return (
    <div className="flex flex-col h-full px-6 py-6 gap-5">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 tracking-tight">Focus du jour</h2>
          <p className="text-[11px] text-zinc-600 mt-1">{todayTasks.length}/5 actives · {inboxCount} en inbox</p>
        </div>
      </div>

      {/* Spotlight Omnibar */}
      <form onSubmit={handleSubmit} className="shrink-0">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-4 text-zinc-600 pointer-events-none" />
          <input
            ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Ajouter une tâche...  ⌘K"
            className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          />
          <AnimatePresence>
            {input.trim() && (
              <motion.button type="submit" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="absolute right-3 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
                style={{ background: "rgba(255,255,255,0.1)", color: "#e4e4e7" }}
              >Ajouter</motion.button>
            )}
          </AnimatePresence>
        </div>
      </form>

      <div className="flex items-center justify-between shrink-0">
        <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium">Priorités</span>
        {todayTasks.length > 0 && (
          <AnimatePresence mode="wait">
            {!showNewStart ? (
              <motion.button key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowNewStart(true)} className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 px-2 py-1 rounded-lg transition-colors"
              ><RefreshCcw size={10} /> Reset</motion.button>
            ) : (
              <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-600">Tout archiver ?</span>
                <button onClick={() => { newStart(); setShowNewStart(false); }} className="text-[11px] font-medium px-2 py-0.5 rounded-md" style={{ color: "#4ade80", background: "rgba(74,222,128,0.08)" }}>Oui</button>
                <button onClick={() => setShowNewStart(false)} className="text-[11px] text-zinc-600 hover:text-zinc-400">Non</button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {todayTasks.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full gap-3 py-16">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Inbox size={18} className="text-zinc-600" />
              </div>
              <p className="text-xs text-zinc-600">Aucune tâche pour aujourd&apos;hui</p>
            </motion.div>
          ) : (
            todayTasks.map((task, i) => <TaskCard key={task.id} task={task} index={i} />)
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isFull && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-2 px-3 rounded-xl mt-1" style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.1)" }}>
              <p className="text-[11px] font-medium" style={{ color: "#fbbf24" }}>Limite atteinte · nouvelles tâches → Inbox</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}