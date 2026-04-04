"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X, Check, Trash2, Plus, Clock, Tag, FolderKanban,
  Flag, FileText, Sparkles, Timer, ChevronDown, Calendar, Repeat,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Task, TaskStatus, IncupTag, RecurrenceType } from "@/store/useAppStore";

const STATUS_CONFIG: { id: TaskStatus; label: string; color: string; dot: string }[] = [
  { id: "todo", label: "To Do", color: "var(--accent-red)", dot: "#ef4444" },
  { id: "in_progress", label: "En cours", color: "var(--accent-blue)", dot: "#3b82f6" },
  { id: "completed", label: "Terminé", color: "var(--accent-green)", dot: "#22c55e" },
  { id: "saved", label: "Sauvegarde", color: "var(--accent-orange)", dot: "#f59e0b" },
];

const INCUP_TAGS: { tag: IncupTag; emoji: string }[] = [
  { tag: "Intérêt", emoji: "💡" },
  { tag: "Nouveauté", emoji: "✨" },
  { tag: "Challenge", emoji: "🏆" },
  { tag: "Urgence", emoji: "⚡" },
  { tag: "Passion", emoji: "❤️" },
];

const PRIORITY_CONFIG = [
  { id: "low" as const, label: "Basse", color: "var(--accent-green)" },
  { id: "medium" as const, label: "Moyenne", color: "var(--accent-orange)" },
  { id: "high" as const, label: "Haute", color: "var(--accent-red)" },
];

const RECURRENCE_OPTIONS: { id: RecurrenceType; label: string }[] = [
  { id: "none", label: "Aucune" },
  { id: "daily", label: "Quotidien" },
  { id: "weekdays", label: "Jours ouvrés" },
  { id: "weekly", label: "Hebdo" },
  { id: "monthly", label: "Mensuel" },
];

export default function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const {
    updateTask, updateTaskStatus, deleteTask, toggleTag,
    addMicroStep, toggleMicroStep, deleteMicroStep, setMicroSteps,
    projects, sprints,
  } = useAppStore();
  const [microInput, setMicroInput] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.text);
  const [descDraft, setDescDraft] = useState(task.description || "");
  const [showDesc, setShowDesc] = useState(!!task.description);
  const [showMetaSection, setShowMetaSection] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const doneSteps = task.microSteps.filter((ms) => ms.done).length;
  const totalSteps = task.microSteps.length;
  const taskProject = projects.find((p) => p.id === task.projectId);
  const currentStatus = STATUS_CONFIG.find((s) => s.id === task.status);
  const currentPriority = PRIORITY_CONFIG.find((p) => p.id === task.priority);

  const handleAddMicro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!microInput.trim()) return;
    addMicroStep(task.id, microInput.trim());
    setMicroInput("");
  };

  const handleSaveTitle = () => {
    if (titleDraft.trim() && titleDraft !== task.text) {
      updateTask(task.id, { text: titleDraft.trim() });
    }
    setEditingTitle(false);
  };

  const handleSaveDesc = () => {
    updateTask(task.id, { description: descDraft.trim() || undefined });
  };

  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

  const handleMagicBreakup = () => {
    const lower = task.text.toLowerCase();
    let steps: { id: string; text: string; done: boolean }[];
    if (lower.includes("ranger") || lower.includes("nettoyer") || lower.includes("ménage")) {
      steps = [
        { id: uid(), text: "Rassembler tout ce qui traîne (2 min)", done: false },
        { id: uid(), text: "Jeter les déchets évidents (2 min)", done: false },
        { id: uid(), text: "Ranger les objets à leur place (3 min)", done: false },
        { id: uid(), text: "Passer un coup de chiffon (2 min)", done: false },
      ];
    } else if (lower.includes("email") || lower.includes("mail")) {
      steps = [
        { id: uid(), text: "Ouvrir la boîte mail (1 min)", done: false },
        { id: uid(), text: "Trier : urgents vs plus tard (2 min)", done: false },
        { id: uid(), text: "Répondre aux 3 plus urgents (5 min)", done: false },
        { id: uid(), text: "Archiver le reste (1 min)", done: false },
      ];
    } else {
      steps = [
        { id: uid(), text: "Préparer le matériel nécessaire (2 min)", done: false },
        { id: uid(), text: "Commencer la première sous-tâche (5 min)", done: false },
        { id: uid(), text: "Faire une mini-pause puis continuer (2 min)", done: false },
        { id: uid(), text: "Finaliser et vérifier (3 min)", done: false },
      ];
    }
    setMicroSteps(task.id, steps);
    const est = lower.includes("email") ? 15 : lower.includes("rapport") ? 45 : 20;
    updateTask(task.id, { estimatedMinutes: est });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--backdrop-bg)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl shadow-xl bg-surface"
        style={{ border: "1px solid var(--border-b-primary)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header compact */}
        <div className="px-6 pt-6 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {editingTitle ? (
                <input
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveTitle(); }}
                  autoFocus
                  className="text-xl font-semibold text-t-primary bg-transparent focus:outline-none w-full border-b pb-1"
                  style={{ borderColor: "var(--border-b-primary)" }}
                />
              ) : (
                <h2
                  className="text-xl font-semibold text-t-primary cursor-pointer transition-colors leading-snug"
                  onClick={() => setEditingTitle(true)}
                >
                  {task.text}
                </h2>
              )}
            </div>
            <button onClick={onClose} className="text-t-secondary hover:text-t-primary transition-colors p-1 shrink-0 mt-0.5">
              <X size={16} />
            </button>
          </div>

          {/* Compact metadata bar */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {/* Status pill */}
            {currentStatus && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-lg"
                style={{ background: `color-mix(in srgb, ${currentStatus.color} 10%, transparent)`, color: currentStatus.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: currentStatus.dot }} />
                {currentStatus.label}
              </span>
            )}

            {/* Priority pill */}
            {currentPriority && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-lg"
                style={{ background: `color-mix(in srgb, ${currentPriority.color} 10%, transparent)`, color: currentPriority.color }}
              >
                <Flag size={9} /> {currentPriority.label}
              </span>
            )}

            {/* Active tags as tiny pills */}
            {task.tags.map((tag) => {
              const tagConfig = INCUP_TAGS.find((t) => t.tag === tag);
              return (
                <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg"
                  style={{ background: "var(--empty-bg)", color: "var(--text-t-secondary)" }}
                >
                  {tagConfig?.emoji} {tag}
                </span>
              );
            })}

            {/* Project pill */}
            {taskProject && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-lg"
                style={{ background: `color-mix(in srgb, ${taskProject.color} 10%, transparent)`, color: taskProject.color }}
              >
                {taskProject.emoji} {taskProject.name}
              </span>
            )}

            {/* Time estimate */}
            {task.estimatedMinutes && (
              <span className="inline-flex items-center gap-1 text-[10px] text-t-secondary px-2 py-1">
                <Timer size={9} /> ~{task.estimatedMinutes} min
              </span>
            )}

            {/* Date */}
            <span className="text-[10px] text-t-tertiary ml-auto">
              {new Date(task.createdAt).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mx-6" style={{ background: "var(--border-b-primary)" }} />

        {/* Content area */}
        <div className="px-6 py-4 flex flex-col gap-4">

          {/* Description */}
          <div>
            {showDesc ? (
              <textarea
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                onBlur={handleSaveDesc}
                placeholder="Notes, contexte, détails…"
                rows={3}
                className="w-full text-[13px] text-t-primary placeholder:text-t-tertiary rounded-2xl p-3.5 focus:outline-none resize-none"
                style={{ background: "var(--empty-bg)" }}
              />
            ) : (
              <button onClick={() => setShowDesc(true)} className="text-[12px] text-t-tertiary hover:text-t-secondary transition-colors flex items-center gap-1.5">
                <FileText size={11} /> Ajouter une description…
              </button>
            )}
          </div>

          {/* Micro-steps */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-t-secondary flex items-center gap-1.5">
                Micro-étapes
                {totalSteps > 0 && <span className="text-t-tertiary">{doneSteps}/{totalSteps}</span>}
              </span>
              {task.microSteps.length === 0 && (
                <button
                  onClick={handleMagicBreakup}
                  className="flex items-center gap-1 text-[10px] text-accent-blue hover:text-accent-blue/70 transition-colors"
                >
                  <Sparkles size={10} /> Magic Breakup
                </button>
              )}
            </div>

            {totalSteps > 0 && (
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border-b-primary)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${(doneSteps / totalSteps) * 100}%`, background: "var(--accent-blue)" }} />
              </div>
            )}

            <div className="flex flex-col gap-0.5">
              {task.microSteps.map((ms) => (
                <div key={ms.id} className="flex items-center gap-2.5 group/ms px-2 py-1.5 rounded-xl hover:bg-empty-bg transition-colors">
                  <button onClick={() => toggleMicroStep(task.id, ms.id)} className="shrink-0 w-4 h-4 rounded-md border flex items-center justify-center transition-all"
                    style={{ borderColor: ms.done ? "var(--accent-blue)" : "var(--border-b-hover)", background: ms.done ? "var(--accent-blue-light)" : "transparent" }}
                  >{ms.done && <Check size={9} style={{ color: "var(--accent-blue)" }} strokeWidth={3} />}</button>
                  <span className="flex-1 text-[12px]" style={{ color: ms.done ? "var(--text-t-secondary)" : "var(--text-t-primary)", textDecoration: ms.done ? "line-through" : "none" }}>{ms.text}</span>
                  <button onClick={() => deleteMicroStep(task.id, ms.id)} className="opacity-0 group-hover/ms:opacity-100 text-t-secondary hover:text-accent-red transition-all">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddMicro} className="flex items-center gap-2">
              <Plus size={11} className="text-t-tertiary shrink-0" />
              <input
                value={microInput}
                onChange={(e) => setMicroInput(e.target.value)}
                placeholder="Ajouter une micro-étape…"
                className="flex-1 text-[12px] bg-transparent text-t-primary placeholder:text-t-tertiary focus:outline-none py-1"
              />
            </form>
          </div>

          {/* Collapsible metadata editor */}
          <div>
            <button
              onClick={() => setShowMetaSection(!showMetaSection)}
              className="flex items-center gap-1.5 text-[11px] text-t-secondary hover:text-t-primary transition-colors"
            >
              <ChevronDown size={12} className={`transition-transform ${showMetaSection ? "" : "-rotate-90"}`} />
              Modifier les propriétés
            </button>

            {showMetaSection && (
              <div className="mt-3 flex flex-col gap-3 pl-1">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <Clock size={10} className="text-t-tertiary shrink-0" />
                  <div className="flex gap-1.5 flex-wrap">
                    {STATUS_CONFIG.map((s) => (
                      <button key={s.id} onClick={() => updateTaskStatus(task.id, s.id)}
                        className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all"
                        style={{
                          background: task.status === s.id ? `color-mix(in srgb, ${s.color} 10%, transparent)` : "transparent",
                          color: task.status === s.id ? s.color : "var(--text-t-secondary)",
                          border: `1px solid ${task.status === s.id ? s.color : "var(--border-b-primary)"}`,
                        }}
                      >{s.label}</button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div className="flex items-center gap-2">
                  <Flag size={10} className="text-t-tertiary shrink-0" />
                  <div className="flex gap-1.5">
                    {PRIORITY_CONFIG.map((p) => (
                      <button key={p.id} onClick={() => updateTask(task.id, { priority: task.priority === p.id ? undefined : p.id })}
                        className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all"
                        style={{
                          background: task.priority === p.id ? `color-mix(in srgb, ${p.color} 10%, transparent)` : "transparent",
                          color: task.priority === p.id ? p.color : "var(--text-t-secondary)",
                          border: `1px solid ${task.priority === p.id ? p.color : "var(--border-b-primary)"}`,
                        }}
                      >{p.label}</button>
                    ))}
                  </div>
                </div>

                {/* Tags INCUP */}
                <div className="flex items-center gap-2">
                  <Tag size={10} className="text-t-tertiary shrink-0" />
                  <div className="flex gap-1.5 flex-wrap">
                    {INCUP_TAGS.map(({ tag, emoji }) => {
                      const active = task.tags.includes(tag);
                      return (
                        <button key={tag} onClick={() => toggleTag(task.id, tag)}
                          className="text-[10px] px-2 py-1 rounded-lg font-medium transition-all"
                          style={{
                            color: active ? "var(--accent-blue)" : "var(--text-t-secondary)",
                            background: active ? "var(--accent-blue-light)" : "transparent",
                            border: `1px solid ${active ? "var(--accent-blue)" : "var(--border-b-primary)"}`,
                          }}
                        >{emoji} {tag}</button>
                      );
                    })}
                  </div>
                </div>

                {/* Project */}
                <div className="flex items-center gap-2">
                  <FolderKanban size={10} className="text-t-tertiary shrink-0" />
                  <div className="flex gap-1.5 flex-wrap">
                    <button onClick={() => updateTask(task.id, { projectId: undefined })}
                      className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all"
                      style={{
                        color: !task.projectId ? "var(--text-t-primary)" : "var(--text-t-secondary)",
                        border: `1px solid ${!task.projectId ? "var(--accent-blue)" : "var(--border-b-primary)"}`,
                      }}
                    >Aucun</button>
                    {projects.filter(p => p.status === "active").map((p) => (
                      <button key={p.id} onClick={() => updateTask(task.id, { projectId: p.id })}
                        className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all"
                        style={{
                          background: task.projectId === p.id ? `color-mix(in srgb, ${p.color} 10%, transparent)` : "transparent",
                          color: task.projectId === p.id ? p.color : "var(--text-t-secondary)",
                          border: `1px solid ${task.projectId === p.id ? p.color : "var(--border-b-primary)"}`,
                        }}
                      >{p.emoji} {p.name}</button>
                    ))}
                  </div>
                </div>

                {/* Due Date */}
                <div className="flex items-center gap-2">
                  <Calendar size={10} className="text-t-tertiary shrink-0" />
                  <input
                    type="date"
                    value={task.dueDate || ""}
                    onChange={(e) => updateTask(task.id, { dueDate: e.target.value || undefined })}
                    className="text-[10px] px-2.5 py-1 rounded-lg font-medium bg-transparent focus:outline-none"
                    style={{
                      color: "var(--text-t-secondary)",
                      border: "1px solid var(--border-b-primary)",
                    }}
                  />
                  {task.dueDate && (
                    <button onClick={() => updateTask(task.id, { dueDate: undefined })}
                      className="text-[10px] text-t-tertiary hover:text-accent-red transition-colors"
                    ><X size={9} /></button>
                  )}
                </div>

                {/* Estimated Time */}
                <div className="flex items-center gap-2">
                  <Timer size={10} className="text-t-tertiary shrink-0" />
                  <div className="flex gap-1.5">
                    {[5, 10, 15, 25, 45, 60, 90].map((min) => (
                      <button key={min} onClick={() => updateTask(task.id, { estimatedMinutes: task.estimatedMinutes === min ? undefined : min })}
                        className="text-[10px] px-2 py-1 rounded-lg font-medium transition-all"
                        style={{
                          background: task.estimatedMinutes === min ? "color-mix(in srgb, var(--accent-blue) 10%, transparent)" : "transparent",
                          color: task.estimatedMinutes === min ? "var(--accent-blue)" : "var(--text-t-secondary)",
                          border: `1px solid ${task.estimatedMinutes === min ? "var(--accent-blue)" : "var(--border-b-primary)"}`,
                        }}
                      >{min}m</button>
                    ))}
                  </div>
                </div>

                {/* Recurrence */}
                <div className="flex items-center gap-2">
                  <Repeat size={10} className="text-t-tertiary shrink-0" />
                  <div className="flex gap-1.5 flex-wrap">
                    {RECURRENCE_OPTIONS.map((r) => (
                      <button key={r.id} onClick={() => updateTask(task.id, { recurrence: r.id === "none" ? undefined : r.id })}
                        className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all"
                        style={{
                          background: (task.recurrence || "none") === r.id ? "color-mix(in srgb, var(--accent-purple) 10%, transparent)" : "transparent",
                          color: (task.recurrence || "none") === r.id ? "var(--accent-purple)" : "var(--text-t-secondary)",
                          border: `1px solid ${(task.recurrence || "none") === r.id ? "var(--accent-purple)" : "var(--border-b-primary)"}`,
                        }}
                      >{r.label}</button>
                    ))}
                  </div>
                </div>

                {/* Sprint Assignment */}
                {sprints.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Sparkles size={10} className="text-t-tertiary shrink-0" />
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => updateTask(task.id, { sprintId: undefined })}
                        className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all"
                        style={{
                          color: !task.sprintId ? "var(--text-t-primary)" : "var(--text-t-secondary)",
                          border: `1px solid ${!task.sprintId ? "var(--accent-orange)" : "var(--border-b-primary)"}`,
                        }}
                      >Aucun sprint</button>
                      {sprints.map((sp) => (
                        <button key={sp.id} onClick={() => updateTask(task.id, { sprintId: sp.id })}
                          className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all"
                          style={{
                            background: task.sprintId === sp.id ? "color-mix(in srgb, var(--accent-orange) 10%, transparent)" : "transparent",
                            color: task.sprintId === sp.id ? "var(--accent-orange)" : "var(--text-t-secondary)",
                            border: `1px solid ${task.sprintId === sp.id ? "var(--accent-orange)" : "var(--border-b-primary)"}`,
                          }}
                        >{sp.name}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 flex items-center justify-end" style={{ borderTop: "1px solid var(--border-b-primary)" }}>
          <button
            onClick={() => { deleteTask(task.id); onClose(); }}
            className="flex items-center gap-1.5 text-[11px] text-t-secondary hover:text-accent-red transition-colors px-3 py-1.5 rounded-xl"
          >
            <Trash2 size={11} /> Supprimer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
