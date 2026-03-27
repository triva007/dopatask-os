"use client";

import { useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check, Inbox,
  ChevronDown, ChevronRight, X, Loader2, Search,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Task, IncupTag } from "@/store/useAppStore";
import confetti from "canvas-confetti";

const INCUP_TAGS: { tag: IncupTag; color: string }[] = [
  { tag: "Intérêt",   color: "var(--accent-cyan, #67e8f9)" },
  { tag: "Nouveauté", color: "var(--accent-purple, #a78bfa)" },
  { tag: "Challenge", color: "var(--accent-orange, #fbbf24)" },
  { tag: "Urgence",   color: "var(--accent-red, #fca5a5)" },
  { tag: "Passion",   color: "var(--accent-green, #4ade80)" },
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
        className="shrink-0 w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all"
        style={{
          borderColor: step.done ? "var(--accent-blue)" : "var(--border-b-hover)",
          background: step.done ? "rgba(0,113,227,0.1)" : "transparent",
        }}
      >
        {step.done && <Check size={8} style={{ color: "var(--accent-blue)" }} strokeWidth={3} />}
      </button>
      <span className="flex-1 text-[11px] leading-snug" style={{ color: step.done ? "var(--text-t-secondary)" : "#3C3C43", textDecoration: step.done ? "line-through" : "none" }}>
        {step.text}
      </span>
      <button onClick={() => deleteMicroStep(taskId, step.id)} className="opacity-0 group-hover/ms:opacity-100 text-t-secondary hover:text-t-primary">
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
      className="rounded-2xl overflow-hidden transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.05)] hover:-translate-y-[1px] border border-b-primary bg-surface"
    >
      <div className="flex items-center gap-3 px-6 py-4 group">
        <span className="text-[10px] text-t-secondary font-mono w-4 shrink-0 select-none text-center">{index + 1}</span>
        <button
          onClick={handleCheck} disabled={checking}
          className="shrink-0 w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-all border-b-hover"
          style={{}}
        >
          {checking ? <Loader2 size={10} className="animate-spin text-accent-blue" /> : null}
        </button>
        <span className="flex-1 text-[17px] text-t-primary leading-snug min-w-0 truncate" style={{ fontWeight: 450 }}>{task.text}</span>
        {totalSteps > 0 && (
          <span className="text-[10px] text-t-secondary font-mono shrink-0 px-1.5 py-0.5 rounded-md bg-background">
            {doneCount}/{totalSteps}
          </span>
        )}
        <span className="text-[10px] font-mono opacity-0 group-hover:opacity-100 shrink-0 text-accent-blue">+25</span>
        <button onClick={() => toggleExpand(task.id)} className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-t-secondary hover:text-t-primary transition-all">
          {task.expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
      </div>
      {totalSteps > 0 && (
        <div className="mx-5 h-[2px] rounded-full overflow-hidden mb-2 border-b-primary" style={{ background: "var(--border-b-primary)" }}>
          <motion.div className="h-full rounded-full bg-accent-blue" style={{}} animate={{ width: `${progress * 100}%` }} transition={{ type: "spring", stiffness: 120, damping: 18 }} />
        </div>
      )}

      <AnimatePresence>
        {task.expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-6 pb-5 pt-3 flex flex-col gap-3 border-t border-b-primary">
              <div className="flex flex-wrap gap-1.5 pt-1">
                {INCUP_TAGS.map(({ tag }) => {
                  const active = task.tags.includes(tag);
                  return (
                    <button key={tag} onClick={() => toggleTag(task.id, tag)} className="text-[10px] px-2.5 py-1 rounded-[6px] font-medium transition-all"
                      style={{
                        color: active ? "var(--accent-blue)" : "var(--text-t-secondary)",
                        background: active ? "var(--accent-blue-light)" : "var(--surface)",
                        border: `1px solid ${active ? "transparent" : "var(--border-b-primary)"}`,
                      }}
                    >{tag}</button>
                  );
                })}
              </div>
              <div className="flex flex-col">
                <AnimatePresence>
                  {task.microSteps.map((ms) => <MicroStepRow key={ms.id} step={ms} taskId={task.id} />)}
                </AnimatePresence>
              </div>              <form onSubmit={handleAddMicro} className="flex items-center gap-2">
                <input value={microInput} onChange={(e) => setMicroInput(e.target.value)} placeholder="+ micro-étape"
                  className="flex-1 text-[11px] bg-transparent border-b py-1 text-[#3C3C43] placeholder:text-t-tertiary focus:outline-none transition-colors"
                  style={{ borderColor: "var(--border-b-primary)" }}
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
  const { tasks, addInboxItem } = useAppStore();
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const todayTasks = tasks.filter((t) => t.status === "today");
  const inboxCount = tasks.filter((t) => t.status === "inbox").length;
  const isFull = todayTasks.length >= 5;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "i") { e.preventDefault(); inputRef.current?.focus(); }
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

  return (
    <div className="flex flex-col h-full px-6 py-6 gap-5">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-semibold text-t-primary tracking-tight">Focus du jour</h2>
          <p className="text-[15px] text-t-secondary mt-1">{todayTasks.length}/5 actives · {inboxCount} en inbox</p>
        </div>
      </div>

      {/* Spotlight Omnibar */}
      <form onSubmit={handleSubmit} className="shrink-0">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-4 text-t-secondary pointer-events-none" />
          <input
            ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Capturer une idée → Inbox...  (Ctrl+Shift+I)"
            className="w-full pl-11 pr-4 py-4 rounded-[20px] text-[15px] text-t-primary placeholder:text-t-tertiary focus:outline-none transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] focus:shadow-[0_4px_24px_rgba(0,113,227,0.08)] bg-surface border border-b-primary"
          />          <AnimatePresence>
            {input.trim() && (
              <motion.button type="submit" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="absolute right-3 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors bg-accent-blue text-white"
                style={{}}
              >→ Inbox</motion.button>
            )}
          </AnimatePresence>
        </div>
      </form>

      <div className="flex items-center justify-between shrink-0">
        <span className="text-[10px] text-t-secondary uppercase tracking-widest font-medium">Priorités</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {todayTasks.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full gap-3 py-16">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-surface border border-b-primary shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <Inbox size={18} className="text-t-tertiary" />
              </div>
              <p className="text-xs text-t-secondary">Aucune tâche pour aujourd&apos;hui</p>
            </motion.div>
          ) : (
            todayTasks.map((task, i) => <TaskCard key={task.id} task={task} index={i} />)
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isFull && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-2 px-3 rounded-xl mt-1 bg-accent-orange-light" style={{ border: "1px solid rgba(255,149,0,0.2)" }}>
              <p className="text-[11px] font-medium text-accent-orange">Limite atteinte · nouvelles tâches → Inbox</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}