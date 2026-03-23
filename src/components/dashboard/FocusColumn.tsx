"use client";

import { useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  RefreshCcw, Check, Inbox,
  ChevronDown, ChevronRight, X, Loader2, Search, Sparkles,
  FolderKanban,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Task, IncupTag } from "@/store/useAppStore";
import confetti from "canvas-confetti";

const INCUP_TAGS: { tag: IncupTag; dot: string }[] = [
  { tag: "Intérêt",   dot: "#22d3ee" },
  { tag: "Nouveauté", dot: "#a78bfa" },
  { tag: "Challenge", dot: "#fbbf24" },
  { tag: "Urgence",   dot: "#fb7185" },
  { tag: "Passion",   dot: "#4ade80" },
];

const cardVariants = {
  initial: { opacity: 0, y: -8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: "easeOut" as const } },
  exit:    { opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.2 } },
};

function MicroStepRow({ step, taskId }: { step: { id: string; text: string; done: boolean }; taskId: string }) {
  const { toggleMicroStep, deleteMicroStep } = useAppStore();
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2.5 py-1.5 group/ms">
      <motion.button
        onClick={() => toggleMicroStep(taskId, step.id)}
        whileTap={{ scale: 0.8 }}
        className="shrink-0 w-4 h-4 rounded-md border flex items-center justify-center transition-all"
        style={{
          borderColor: step.done ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)",
          background: step.done ? "rgba(255,255,255,0.06)" : "transparent",
        }}
      >
        {step.done && <Check size={9} style={{ color: "rgba(255,255,255,0.4)" }} strokeWidth={3} />}
      </motion.button>
      <span className="flex-1 text-[11px] leading-snug" style={{ color: step.done ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.5)", textDecoration: step.done ? "line-through" : "none" }}>
        {step.text}
      </span>
      <button onClick={() => deleteMicroStep(taskId, step.id)} className="opacity-0 group-hover/ms:opacity-100 transition-opacity" style={{ color: "rgba(255,255,255,0.12)" }}>
        <X size={9} />
      </button>
    </motion.div>
  );
}

function TaskCard({ task, index }: { task: Task; index: number }) {
  const { completeTask, toggleExpand, addMicroStep, toggleTag, lastCritical, setLastActive, projects } = useAppStore();
  const [checking, setChecking] = useState(false);
  const [microInput, setMicroInput] = useState("");

  const doneCount = task.microSteps.filter((ms) => ms.done).length;
  const totalSteps = task.microSteps.length;
  const progress = totalSteps > 0 ? doneCount / totalSteps : 0;
  const taskProject = projects.find((p) => p.id === task.projectId);

  const handleCheck = async () => {
    if (checking || task.status === "done") return;
    setChecking(true);
    setLastActive(task.id);
    await new Promise((r) => setTimeout(r, 200));
    completeTask(task.id);
    if (lastCritical) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ["#fff", "#e4e4e7", "#a1a1aa", "#71717a"] });
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
      whileHover={{ y: -1 }}
      className="rounded-2xl overflow-hidden transition-all duration-300 group"
      style={{
        background: task.expanded ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.02)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${task.expanded ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`,
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="text-[10px] font-mono w-4 shrink-0 select-none text-center" style={{ color: "rgba(255,255,255,0.12)" }}>{index + 1}</span>

        {/* Checkbox */}
        <motion.button
          onClick={handleCheck} disabled={checking}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.85 }}
          className="shrink-0 rounded-full flex items-center justify-center"
          style={{
            width: 22, height: 22,
            border: "1.5px solid rgba(255,255,255,0.1)",
            background: "transparent",
          }}
        >
          {checking ? <Loader2 size={10} className="animate-spin" style={{ color: "rgba(255,255,255,0.4)" }} /> : null}
        </motion.button>

        <div className="flex-1 min-w-0">
          {/* Project name — the "why" */}
          {taskProject && (
            <div className="flex items-center gap-1 mb-0.5">
              <FolderKanban size={8} style={{ color: taskProject.color, opacity: 0.5 }} />
              <span className="text-[9px] font-medium" style={{ color: taskProject.color, opacity: 0.5 }}>{taskProject.name}</span>
            </div>
          )}
          <span className="text-[13px] leading-snug block truncate" style={{ color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{task.text}</span>
        </div>

        {/* Monochrome tags as dots only */}
        {task.tags.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            {task.tags.slice(0, 3).map((tag) => {
              const cfg = INCUP_TAGS.find((t) => t.tag === tag);
              return <div key={tag} className="w-1.5 h-1.5 rounded-full" style={{ background: cfg?.dot, opacity: 0.5 }} title={tag} />;
            })}
          </div>
        )}

        {totalSteps > 0 && (
          <span className="text-[10px] font-mono shrink-0 px-2 py-0.5 rounded-md" style={{ color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.03)" }}>
            {doneCount}/{totalSteps}
          </span>
        )}
        <span className="text-[10px] font-mono font-bold opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" style={{ color: "rgba(255,255,255,0.3)" }}>+25 XP</span>
        <button onClick={() => toggleExpand(task.id)} className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all" style={{ color: "rgba(255,255,255,0.15)" }}>
          {task.expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
      </div>

      {/* Progress bar */}
      {totalSteps > 0 && (
        <div className="mx-4 h-[2px] rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.03)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "rgba(255,255,255,0.2)" }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
          />
        </div>
      )}

      <AnimatePresence>
        {task.expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-2 flex flex-col gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              {/* Monochrome INCUP Tags with colored dots */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {INCUP_TAGS.map(({ tag, dot }) => {
                  const active = task.tags.includes(tag);
                  return (
                    <motion.button
                      key={tag}
                      onClick={() => toggleTag(task.id, tag)}
                      whileTap={{ scale: 0.92 }}
                      className="text-[10px] px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5"
                      style={{
                        color: active ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.15)",
                        background: active ? "rgba(255,255,255,0.05)" : "transparent",
                        border: `1px solid ${active ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)"}`,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? dot : "rgba(255,255,255,0.08)" }} />
                      {tag}
                    </motion.button>
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
                  className="flex-1 text-[11px] bg-transparent border-b py-1.5 placeholder:text-zinc-700 focus:outline-none transition-colors"
                  style={{ borderColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)" }}
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
  const [inputFocused, setInputFocused] = useState(false);
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
          <h2 className="text-[16px] font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>Focus du jour</h2>
          <p className="text-[11px] mt-1 font-mono tabular-nums" style={{ color: "rgba(255,255,255,0.2)" }}>{todayTasks.length}/5 actives · {inboxCount} en inbox</p>
        </div>
      </div>

      {/* Omnibar — sends to Inbox by default */}
      <form onSubmit={handleSubmit} className="shrink-0">
        <div className="relative flex items-center">
          <Search size={15} className="absolute left-4 pointer-events-none" style={{ color: "rgba(255,255,255,0.15)" }} />
          <input
            ref={inputRef} type="text" value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Capturer une idée...  ⌘K → Inbox"
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-[13px] placeholder:text-zinc-700 focus:outline-none transition-all"
            style={{
              color: "rgba(255,255,255,0.8)",
              background: "rgba(255,255,255,0.02)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${inputFocused ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"}`,
            }}
          />
          <AnimatePresence>
            {input.trim() && (
              <motion.button type="submit" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                className="absolute right-3 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <Sparkles size={10} />
                Ajouter
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </form>

      <div className="flex items-center justify-between shrink-0">
        <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.15)" }}>Priorités</span>
        {todayTasks.length > 0 && (
          <AnimatePresence mode="wait">
            {!showNewStart ? (
              <motion.button key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowNewStart(true)} className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg transition-all"
                style={{ color: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.04)" }}
              ><RefreshCcw size={10} /> Reset</motion.button>
            ) : (
              <motion.div key="c" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>Tout archiver ?</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { newStart(); setShowNewStart(false); }}
                  className="text-[11px] font-semibold px-3 py-1 rounded-lg"
                  style={{ color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                >Oui</motion.button>
                <button onClick={() => setShowNewStart(false)} className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>Non</button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Task list */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {todayTasks.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full gap-4 py-16">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <Inbox size={22} style={{ color: "rgba(255,255,255,0.15)" }} />
              </motion.div>
              <div className="text-center">
                <p className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Aucune tâche pour aujourd&apos;hui</p>
                <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.12)" }}>Utilise ⌘K pour capturer une idée</p>
              </div>
            </motion.div>
          ) : (
            todayTasks.map((task, i) => <TaskCard key={task.id} task={task} index={i} />)
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isFull && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-center py-3 px-4 rounded-xl mt-1"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>Limite atteinte · nouvelles tâches → Inbox</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
