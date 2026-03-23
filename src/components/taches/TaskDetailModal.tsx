"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  X, Check, Trash2, Plus, Clock, Tag, FolderKanban,
  Flag, FileText, Sparkles, Timer,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Task, TaskStatus, IncupTag } from "@/store/useAppStore";

const STATUS_CONFIG: { id: TaskStatus; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "En cours" },
  { id: "completed", label: "Terminé" },
  { id: "saved", label: "Sauvegarde" },
];

const INCUP_TAGS: { tag: IncupTag; dot: string }[] = [
  { tag: "Intérêt", dot: "#67e8f9" },
  { tag: "Nouveauté", dot: "#a78bfa" },
  { tag: "Challenge", dot: "#fbbf24" },
  { tag: "Urgence", dot: "#f87171" },
  { tag: "Passion", dot: "#4ade80" },
];

const PRIORITY_CONFIG = [
  { id: "low" as const, label: "Basse" },
  { id: "medium" as const, label: "Moyenne" },
  { id: "high" as const, label: "Haute" },
];

export default function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const {
    updateTask, updateTaskStatus, deleteTask, toggleTag,
    addMicroStep, toggleMicroStep, deleteMicroStep, setMicroSteps,
    projects,
  } = useAppStore();
  const [microInput, setMicroInput] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.text);
  const [descDraft, setDescDraft] = useState(task.description || "");
  const [showDesc, setShowDesc] = useState(!!task.description);

  const doneSteps = task.microSteps.filter((ms) => ms.done).length;
  const totalSteps = task.microSteps.length;
  const taskProject = projects.find((p) => p.id === task.projectId);

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
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl"
        style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.06)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveTitle(); }}
                autoFocus
                className="text-xl font-semibold bg-transparent focus:outline-none w-full border-b pb-1"
                style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
              />
            ) : (
              <h2
                className="text-xl font-semibold cursor-pointer transition-colors"
                style={{ color: "rgba(255,255,255,0.85)" }}
                onClick={() => setEditingTitle(true)}
              >
                {task.text}
              </h2>
            )}
            <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: "rgba(255,255,255,0.15)" }}>
              <span>Créé {new Date(task.createdAt).toLocaleDateString("fr-FR")}</span>
              {task.completedAt && <span>· Terminé {new Date(task.completedAt).toLocaleDateString("fr-FR")}</span>}
              {task.estimatedMinutes && (
                <span className="flex items-center gap-1">
                  <Timer size={10} /> ~{task.estimatedMinutes} min
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="transition-colors p-1" style={{ color: "rgba(255,255,255,0.2)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 flex flex-col gap-5">

          {/* Status */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-medium uppercase tracking-widest flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
              <Clock size={10} /> Statut
            </label>
            <div className="flex gap-2">
              {STATUS_CONFIG.map((s) => (
                <button
                  key={s.id}
                  onClick={() => updateTaskStatus(task.id, s.id)}
                  className="text-[11px] px-3 py-1.5 rounded-xl font-medium transition-all"
                  style={{
                    background: task.status === s.id ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                    color: task.status === s.id ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)",
                    border: `1px solid ${task.status === s.id ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-medium uppercase tracking-widest flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
              <Flag size={10} /> Priorité
            </label>
            <div className="flex gap-2">
              {PRIORITY_CONFIG.map((p) => (
                <button
                  key={p.id}
                  onClick={() => updateTask(task.id, { priority: task.priority === p.id ? undefined : p.id })}
                  className="text-[11px] px-3 py-1.5 rounded-xl font-medium transition-all"
                  style={{
                    background: task.priority === p.id ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                    color: task.priority === p.id ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)",
                    border: `1px solid ${task.priority === p.id ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags INCUP — monochrome with dot */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-medium uppercase tracking-widest flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
              <Tag size={10} /> Tags INCUP
            </label>
            <div className="flex flex-wrap gap-2">
              {INCUP_TAGS.map(({ tag, dot }) => {
                const active = task.tags.includes(tag);
                return (
                  <button key={tag} onClick={() => toggleTag(task.id, tag)} className="text-[11px] px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5"
                    style={{
                      background: active ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                      color: active ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
                      border: `1px solid ${active ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"}`,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? dot : "rgba(255,255,255,0.1)" }} />
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-medium uppercase tracking-widest flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
              <FolderKanban size={10} /> Projet
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateTask(task.id, { projectId: undefined })}
                className="text-[11px] px-3 py-1.5 rounded-xl font-medium transition-all"
                style={{
                  background: !task.projectId ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                  color: !task.projectId ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
                  border: `1px solid ${!task.projectId ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
                }}
              >Aucun</button>
              {projects.filter(p => p.status === "active").map((p) => (
                <button
                  key={p.id}
                  onClick={() => updateTask(task.id, { projectId: p.id })}
                  className="text-[11px] px-3 py-1.5 rounded-xl font-medium transition-all"
                  style={{
                    background: task.projectId === p.id ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                    color: task.projectId === p.id ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
                    border: `1px solid ${task.projectId === p.id ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
                  }}
                >{p.emoji} {p.name}</button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-medium uppercase tracking-widest flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                <FileText size={10} /> Description
              </label>
              {!showDesc && (
                <button onClick={() => setShowDesc(true)} className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>+ Ajouter</button>
              )}
            </div>
            {showDesc && (
              <textarea
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                onBlur={handleSaveDesc}
                placeholder="Ajoute une description, des notes, du contexte…"
                rows={4}
                className="text-sm bg-transparent placeholder:text-zinc-700 rounded-2xl p-4 focus:outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)" }}
              />
            )}
          </div>

          {/* Micro-steps */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-medium uppercase tracking-widest flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                <Check size={10} /> Micro-étapes
                {totalSteps > 0 && <span style={{ color: "rgba(255,255,255,0.1)" }} className="ml-1">{doneSteps}/{totalSteps}</span>}
              </label>
              {task.microSteps.length === 0 && (
                <button
                  onClick={handleMagicBreakup}
                  className="flex items-center gap-1 text-[10px] transition-colors"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  <Sparkles size={10} /> Magic Breakup
                </button>
              )}
            </div>

            {totalSteps > 0 && (
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${(doneSteps / totalSteps) * 100}%`, background: "rgba(255,255,255,0.25)" }} />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              {task.microSteps.map((ms) => (
                <div key={ms.id} className="flex items-center gap-3 group/ms px-2 py-1.5 rounded-xl transition-colors" style={{ background: "transparent" }}>
                  <button onClick={() => toggleMicroStep(task.id, ms.id)} className="shrink-0 w-4 h-4 rounded-lg border flex items-center justify-center transition-all"
                    style={{ borderColor: ms.done ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)", background: ms.done ? "rgba(255,255,255,0.06)" : "transparent" }}
                  >{ms.done && <Check size={9} style={{ color: "rgba(255,255,255,0.5)" }} strokeWidth={3} />}</button>
                  <span className="flex-1 text-[12px]" style={{ color: ms.done ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.55)", textDecoration: ms.done ? "line-through" : "none" }}>{ms.text}</span>
                  <button onClick={() => deleteMicroStep(task.id, ms.id)} className="opacity-0 group-hover/ms:opacity-100 transition-all" style={{ color: "rgba(255,255,255,0.15)" }}>
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddMicro} className="flex items-center gap-2 mt-1">
              <Plus size={12} style={{ color: "rgba(255,255,255,0.15)" }} className="shrink-0" />
              <input
                value={microInput}
                onChange={(e) => setMicroInput(e.target.value)}
                placeholder="Ajouter une micro-étape…"
                className="flex-1 text-[12px] bg-transparent placeholder:text-zinc-700 focus:outline-none py-1"
                style={{ color: "rgba(255,255,255,0.4)" }}
              />
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>
              {taskProject ? `${taskProject.emoji} ${taskProject.name}` : "Aucun projet"}
            </p>
            <button
              onClick={() => { deleteTask(task.id); onClose(); }}
              className="flex items-center gap-1.5 text-[11px] transition-colors px-3 py-1.5 rounded-xl"
              style={{ border: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.2)" }}
            >
              <Trash2 size={11} /> Supprimer cette tâche
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
