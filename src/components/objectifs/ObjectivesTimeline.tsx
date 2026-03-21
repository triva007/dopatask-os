"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Plus, Check, ChevronDown, ChevronRight, Trash2, X,
  CalendarDays, Zap, Trophy, Timer,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Objective, ObjectiveHorizon } from "@/store/useAppStore";

// ─── Config ───────────────────────────────────────────────────────────────────

const HORIZONS: { id: ObjectiveHorizon; label: string; Icon: typeof Timer; sublabel: string }[] = [
  { id: "week",    label: "Semaine",   Icon: Timer,        sublabel: "Court terme" },
  { id: "month",   label: "Mois",      Icon: CalendarDays, sublabel: "Court terme" },
  { id: "quarter", label: "Trimestre", Icon: Zap,          sublabel: "Moyen terme" },
  { id: "year",    label: "Année",     Icon: Trophy,       sublabel: "Long terme"  },
];

const COLOR_OPTIONS = ["#06b6d4", "#7c3aed", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];

// ─── Objective Card ───────────────────────────────────────────────────────────

function ObjectiveCard({ obj }: { obj: Objective }) {
  const {
    toggleMilestone, addMilestone, deleteMilestone,
    updateObjectiveProgress, deleteObjective,
  } = useAppStore();
  const [expanded, setExpanded]   = useState(false);
  const [msInput, setMsInput]     = useState("");
  const [editProg, setEditProg]   = useState(false);
  const [tempProg, setTempProg]   = useState(obj.progress);

  const doneMs = obj.milestones.filter((m) => m.done).length;

  const handleAddMs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msInput.trim()) return;
    addMilestone(obj.id, msInput.trim());
    setMsInput("");
  };

  const handleSaveProgress = () => {
    updateObjectiveProgress(obj.id, tempProg);
    setEditProg(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border overflow-hidden transition-colors"
      style={{
        borderColor: expanded ? `rgba(${parseInt(obj.color.slice(1,3), 16)},${parseInt(obj.color.slice(3,5), 16)},${parseInt(obj.color.slice(5,7), 16)},0.15)` : "rgba(255,255,255,0.04)",
        background: expanded ? "#111114" : "#0d0d10",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-4 px-7 pt-6 pb-4 cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Color indicator */}
        <div
          className="w-1.5 h-12 rounded-full shrink-0 transition-all"
          style={{ background: obj.color }}
        />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-200 leading-snug truncate">
            {obj.title}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5 font-medium">
            {doneMs}/{obj.milestones.length} jalons · {obj.progress}%
          </p>
        </div>

        {/* Progress ring */}
        <div className="relative w-12 h-12 shrink-0">
          <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
            <circle cx="18" cy="18" r="14" fill="none" stroke="#27272a" strokeWidth="3" />
            <motion.circle
              cx="18" cy="18" r="14" fill="none"
              stroke={obj.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 14}`}
              animate={{ strokeDashoffset: `${2 * Math.PI * 14 * (1 - obj.progress / 100)}` }}
              transition={{ type: "spring", stiffness: 80, damping: 15 }}
            />
          </svg>
          <span
            className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
            style={{ color: obj.color }}
          >
            {obj.progress}%
          </span>
        </div>

        <button className="text-zinc-700 group-hover:text-zinc-500 transition-colors shrink-0">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Progress bar */}
      <div className="mx-7 h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-0">
        <motion.div
          className="h-full rounded-full"
          style={{ background: obj.color }}
          animate={{ width: `${obj.progress}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 18 }}
        />
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-7 pb-5 pt-4 flex flex-col gap-4 border-t border-zinc-800/40">

              {/* Progress manual edit */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Progression</span>
                {editProg ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="range" min="0" max="100" value={tempProg}
                      onChange={(e) => setTempProg(Number(e.target.value))}
                      className="flex-1 h-1.5 accent-current"
                      style={{ accentColor: obj.color }}
                    />
                    <span className="text-xs font-bold w-10 text-right" style={{ color: obj.color }}>
                      {tempProg}%
                    </span>
                    <button onClick={handleSaveProgress} className="text-xs text-dopa-green font-semibold">
                      ✓
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setTempProg(obj.progress); setEditProg(true); }}
                    className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors font-medium"
                  >
                    Ajuster
                  </button>
                )}
              </div>

              {/* Milestones */}
              <div className="flex flex-col gap-2">
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Jalons</span>
                {obj.milestones.map((ms, idx) => (
                  <div key={ms.id} className="flex items-center gap-2.5 group/ms">
                    {/* Vertical line connector */}
                    <div className="flex flex-col items-center w-5 shrink-0">
                      {idx > 0 && <div className="w-px h-2.5 bg-zinc-800" />}
                      <button
                        onClick={() => toggleMilestone(obj.id, ms.id)}
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors shrink-0"
                        style={{
                          borderColor: ms.done ? obj.color : "#3f3f46",
                          background: ms.done ? `${obj.color}25` : "transparent",
                        }}
                      >
                        {ms.done && <Check size={8} style={{ color: obj.color }} strokeWidth={3} />}
                      </button>
                      {idx < obj.milestones.length - 1 && <div className="w-px flex-1 min-h-[10px] bg-zinc-800" />}
                    </div>

                    <span
                      className="flex-1 text-xs leading-snug font-medium"
                      style={{ color: ms.done ? "#52525b" : "#d4d4d8", textDecoration: ms.done ? "line-through" : "none" }}
                    >
                      {ms.text}
                    </span>

                    <button
                      onClick={() => deleteMilestone(obj.id, ms.id)}
                      className="opacity-0 group-hover/ms:opacity-100 text-zinc-700 hover:text-zinc-500 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}

                {/* Add milestone */}
                <form onSubmit={handleAddMs} className="flex items-center gap-2.5 mt-1">
                  <div className="w-5 flex justify-center shrink-0">
                    <Plus size={11} className="text-zinc-700" />
                  </div>
                  <input
                    value={msInput}
                    onChange={(e) => setMsInput(e.target.value)}
                    placeholder="Ajouter un jalon…"
                    className="flex-1 text-xs bg-transparent border-b border-zinc-800 focus:border-zinc-600 focus:outline-none text-zinc-400 placeholder:text-zinc-700 py-1 font-medium"
                  />
                </form>
              </div>

              {/* Delete */}
              <button
                onClick={() => deleteObjective(obj.id)}
                className="flex items-center gap-1.5 text-xs text-zinc-700 hover:text-red-400 transition-colors self-end font-medium"
              >
                <Trash2 size={10} /> Supprimer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Add Objective Form ───────────────────────────────────────────────────────

function AddObjectiveForm({ onClose }: { onClose: () => void }) {
  const { addObjective } = useAppStore();
  const [title, setTitle]       = useState("");
  const [horizon, setHorizon]   = useState<ObjectiveHorizon>("month");
  const [color, setColor]       = useState(COLOR_OPTIONS[0]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addObjective(title.trim(), horizon, color);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 flex flex-col gap-4"
      style={{ borderColor: "rgba(255,255,255,0.04)" }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nom de l'objectif…"
          autoFocus
          className="w-full text-sm bg-transparent border-b border-zinc-800 focus:border-zinc-600 focus:outline-none text-zinc-200 placeholder:text-zinc-700 pb-2 font-medium"
        />

        {/* Horizon selector */}
        <div className="flex gap-2">
          {HORIZONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setHorizon(id)}
              className="text-xs px-3 py-2 rounded-xl font-medium transition-all"
              style={{
                color: horizon === id ? color : "#52525b",
                background: horizon === id ? `${color}15` : "transparent",
                border: `1px solid ${horizon === id ? color + "30" : "#27272a"}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Color selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 font-medium">Couleur :</span>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-5 h-5 rounded-lg transition-transform"
                style={{
                  background: c,
                  transform: color === c ? "scale(1.2)" : "scale(1)",
                  border: color === c ? "2px solid white" : "none",
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="text-sm px-4 py-2.5 rounded-xl font-medium text-black transition-all"
            style={{ background: color }}
          >
            Créer l&apos;objectif
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-4 py-2.5 text-zinc-600 hover:text-zinc-400 font-medium"
          >
            Annuler
          </button>
        </div>
      </form>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ObjectivesTimeline() {
  const { objectives } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);

  // Stats
  const total     = objectives.length;
  const avgProg   = total > 0 ? Math.round(objectives.reduce((s, o) => s + o.progress, 0) / total) : 0;
  const completed = objectives.filter((o) => o.progress >= 100).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-7 pt-6 pb-5 border-b border-zinc-900">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              <Target size={20} className="text-dopa-violet" />
              Objectifs
            </h1>
            <p className="text-xs text-zinc-500 mt-1 font-medium">
              {total} objectifs · {avgProg}% en moyenne · {completed} terminé{completed > 1 ? "s" : ""}
            </p>
          </div>
          <motion.button
            onClick={() => setShowAdd(!showAdd)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-colors"
            style={{
              background: "rgba(124,58,237,0.1)",
              border: "1px solid rgba(124,58,237,0.2)",
              color: "#a78bfa",
            }}
          >
            <Plus size={14} />
            Nouvel Objectif
          </motion.button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-3">
          {HORIZONS.map(({ id, label, Icon, sublabel }) => {
            const items = objectives.filter((o) => o.horizon === id);
            const avg = items.length > 0 ? Math.round(items.reduce((s, o) => s + o.progress, 0) / items.length) : 0;
            return (
              <div
                key={id}
                className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border bg-zinc-900/30 transition-colors"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}
              >
                <Icon size={14} className="text-zinc-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-zinc-600 truncate font-medium">{label} · {sublabel}</p>
                  <p className="text-xs font-bold text-zinc-300 mt-0.5">{items.length} obj · {avg}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6">

        {/* Add form */}
        <AnimatePresence>
          {showAdd && (
            <div className="mb-6">
              <AddObjectiveForm onClose={() => setShowAdd(false)} />
            </div>
          )}
        </AnimatePresence>

        {/* Timeline by horizon */}
        {HORIZONS.map(({ id, label, sublabel }) => {
          const items = objectives.filter((o) => o.horizon === id);
          if (items.length === 0) return null;
          return (
            <div key={id} className="mb-8">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-2 h-2 rounded-full bg-dopa-violet" />
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  {label} — {sublabel}
                </span>
                <div className="flex-1 h-px bg-zinc-800/60" />
              </div>

              <div className="flex flex-col gap-3 pl-0">
                <AnimatePresence mode="popLayout">
                  {items.map((obj) => (
                    <ObjectiveCard key={obj.id} obj={obj} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {total === 0 && !showAdd && (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Target size={28} className="text-zinc-700" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-400">
                Aucun objectif défini
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                Clique sur &quot;Nouvel Objectif&quot; pour commencer à définir tes objectifs
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}