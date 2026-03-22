"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FolderKanban, ChevronRight, ChevronDown, Trash2, RotateCcw } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { ProjectStatus } from "@/store/useAppStore";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Actif",
  paused: "En pause",
  completed: "Terminé",
  archived: "Archivé",
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  active: "#4ade80",
  paused: "#fbbf24",
  completed: "#93c5fd",
  archived: "#71717a",
};

export default function ProjectsView() {
  const { projects, tasks, addProject, updateProject, deleteProject } = useAppStore();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📁");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedOtherId, setExpandedOtherId] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addProject(newName.trim(), newEmoji);
    setNewName("");
    setNewEmoji("📁");
    setAdding(false);
  };

  const activeProjects = projects.filter((p) => p.status === "active");
  const otherProjects = projects.filter((p) => p.status !== "active");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-7 pt-6 pb-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div>
          <h1 className="text-lg font-semibold text-zinc-100 tracking-tight flex items-center gap-2.5">
            <FolderKanban size={18} className="text-zinc-400" /> Projets
          </h1>
          <p className="text-xs text-zinc-600 mt-1">{projects.length} projets · {activeProjects.length} actifs</p>
        </div>
        <button onClick={() => setAdding(!adding)} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#d4d4d8" }}
        ><Plus size={13} /> Nouveau</button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        {/* Add form */}
        <AnimatePresence>
          {adding && (
            <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAdd} className="p-4 rounded-2xl flex flex-col gap-3"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-center gap-3">
                <input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} className="w-10 h-10 text-center text-xl bg-transparent rounded-xl focus:outline-none"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }} />
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom du projet"
                  className="flex-1 text-sm bg-transparent text-zinc-200 placeholder:text-zinc-600 focus:outline-none border-b pb-2"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }} autoFocus />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setAdding(false)} className="text-xs text-zinc-600 hover:text-zinc-400 px-3 py-1.5">Annuler</button>
                <button type="submit" className="text-xs px-4 py-1.5 rounded-xl font-medium" style={{ background: "rgba(255,255,255,0.08)", color: "#e4e4e7" }}>Créer</button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Active projects */}
        {activeProjects.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest px-1">Actifs</p>
            <div className="grid grid-cols-2 gap-3">
              {activeProjects.map((project) => {
                const projectTasks = tasks.filter((t) => t.projectId === project.id);
                const doneTasks = projectTasks.filter((t) => t.status === "done" || t.status === "completed").length;
                const isSelected = selectedId === project.id;

                return (
                  <motion.div key={project.id} layout className="rounded-2xl overflow-hidden transition-all cursor-pointer"
                    onClick={() => setSelectedId(isSelected ? null : project.id)}
                    style={{ background: isSelected ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${isSelected ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"}` }}
                  >
                    <div className="flex items-center gap-3 p-4">
                      <span className="text-2xl">{project.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate" style={{ fontWeight: 450 }}>{project.name}</p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">{projectTasks.length} tâches · {doneTasks} faites</p>
                      </div>
                      {isSelected ? <ChevronDown size={14} className="text-zinc-500 shrink-0" /> : <ChevronRight size={14} className="text-zinc-700 shrink-0" />}
                    </div>

                    {projectTasks.length > 0 && (
                      <div className="mx-4 mb-3 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${(doneTasks / projectTasks.length) * 100}%`, background: project.color }} />
                      </div>
                    )}

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-3 flex flex-col gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {(["active", "paused", "completed", "archived"] as ProjectStatus[]).map((s) => (
                                <button key={s} onClick={(e) => { e.stopPropagation(); updateProject(project.id, { status: s }); }}
                                  className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all"
                                  style={{ background: project.status === s ? "rgba(255,255,255,0.08)" : "transparent", color: project.status === s ? "#e4e4e7" : "#52525b", border: `1px solid ${project.status === s ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}` }}
                                >{STATUS_LABELS[s]}</button>
                              ))}
                            </div>
                            {projectTasks.length > 0 && (
                              <div className="flex flex-col gap-1 mt-1">
                                {projectTasks.slice(0, 5).map((t) => (
                                  <div key={t.id} className="flex items-center gap-2 text-[11px]">
                                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: t.status === "done" || t.status === "completed" ? "#4ade80" : "rgba(255,255,255,0.1)" }} />
                                    <span className="truncate" style={{ color: t.status === "done" || t.status === "completed" ? "#3f3f46" : "#a1a1aa" }}>{t.text}</span>
                                  </div>
                                ))}
                                {projectTasks.length > 5 && <p className="text-[10px] text-zinc-700">+{projectTasks.length - 5} de plus</p>}
                              </div>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                              className="flex items-center gap-1.5 text-[10px] text-zinc-700 hover:text-red-300 transition-colors self-end mt-1">
                              <Trash2 size={9} /> Supprimer
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Other projects — now with full interactivity */}
        {otherProjects.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest px-1">Autres</p>
            <div className="flex flex-col gap-2">
              {otherProjects.map((project) => {
                const projectTasks = tasks.filter((t) => t.projectId === project.id);
                const doneTasks = projectTasks.filter((t) => t.status === "done" || t.status === "completed").length;
                const isExpanded = expandedOtherId === project.id;

                return (
                  <motion.div key={project.id} layout className="rounded-2xl overflow-hidden transition-all"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                      onClick={() => setExpandedOtherId(isExpanded ? null : project.id)}
                    >
                      <span className="text-lg">{project.emoji}</span>
                      <span className="flex-1 text-sm text-zinc-400 truncate">{project.name}</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-lg font-medium"
                        style={{
                          background: `${STATUS_COLORS[project.status]}12`,
                          color: STATUS_COLORS[project.status],
                          border: `1px solid ${STATUS_COLORS[project.status]}20`,
                        }}
                      >
                        {STATUS_LABELS[project.status]}
                      </span>
                      {isExpanded ? <ChevronDown size={14} className="text-zinc-500 shrink-0" /> : <ChevronRight size={14} className="text-zinc-700 shrink-0" />}
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 flex flex-col gap-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                            {/* Status buttons — including "active" to reactivate */}
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {(["active", "paused", "completed", "archived"] as ProjectStatus[]).map((s) => (
                                <button
                                  key={s}
                                  onClick={(e) => { e.stopPropagation(); updateProject(project.id, { status: s }); }}
                                  className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1"
                                  style={{
                                    background: project.status === s ? "rgba(255,255,255,0.08)" : "transparent",
                                    color: project.status === s ? "#e4e4e7" : "#52525b",
                                    border: `1px solid ${project.status === s ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
                                  }}
                                >
                                  {s === "active" && project.status !== "active" && <RotateCcw size={8} />}
                                  {STATUS_LABELS[s]}
                                </button>
                              ))}
                            </div>

                            {/* Task summary */}
                            {projectTasks.length > 0 && (
                              <div className="flex flex-col gap-1">
                                <p className="text-[10px] text-zinc-600">{projectTasks.length} tâches · {doneTasks} terminées</p>
                                {projectTasks.slice(0, 3).map((t) => (
                                  <div key={t.id} className="flex items-center gap-2 text-[11px]">
                                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: t.status === "done" || t.status === "completed" ? "#4ade80" : "rgba(255,255,255,0.1)" }} />
                                    <span className="truncate" style={{ color: t.status === "done" || t.status === "completed" ? "#3f3f46" : "#a1a1aa" }}>{t.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <button
                              onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                              className="flex items-center gap-1.5 text-[10px] text-zinc-700 hover:text-red-300 transition-colors self-end"
                            >
                              <Trash2 size={9} /> Supprimer
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <FolderKanban size={18} className="text-zinc-600" />
            </div>
            <p className="text-xs text-zinc-600">Aucun projet. Crée ton premier !</p>
          </div>
        )}
      </div>
    </div>
  );
}