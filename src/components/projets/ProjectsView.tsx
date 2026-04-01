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
  active: "var(--accent-green)",
  paused: "var(--accent-orange)",
  completed: "var(--accent-blue)",
  archived: "var(--text-secondary)",
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
      <div className="shrink-0 px-7 pt-6 pb-4 flex items-center justify-between border-b-primary">
        <div>
          <h1 className="text-2xl font-semibold text-t-primary tracking-tight flex items-center gap-2.5">
            <FolderKanban size={18} className="text-t-secondary" /> Projets
          </h1>
          <p className="text-xs text-t-secondary mt-1">{projects.length} projets · {activeProjects.length} actifs</p>
        </div>
        <button onClick={() => setAdding(!adding)} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all bg-surface border-b-primary text-t-primary"
        ><Plus size={13} /> Nouveau</button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        {/* Add form */}
        <AnimatePresence>
          {adding && (
            <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAdd} className="p-6 rounded-3xl flex flex-col gap-3 bg-surface border-b-primary"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
            >
              <div className="flex items-center gap-3">
                <input value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} className="w-10 h-10 text-center text-xl bg-transparent rounded-xl focus:outline-none border-b-primary"
                />
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom du projet"
                  className="flex-1 text-sm bg-transparent text-t-primary placeholder:text-t-tertiary focus:outline-none border-b border-b-primary pb-2"
                  autoFocus />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setAdding(false)} className="text-xs text-t-secondary hover:text-t-primary px-3 py-1.5">Annuler</button>
                <button type="submit" className="text-xs px-4 py-1.5 rounded-xl font-medium bg-accent-blue text-white">Créer</button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Active projects */}
        {activeProjects.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-medium text-t-secondary uppercase tracking-widest px-1">Actifs</p>
            <div className="grid grid-cols-2 gap-3">
              {activeProjects.map((project) => {
                const projectTasks = tasks.filter((t) => t.projectId === project.id);
                const doneTasks = projectTasks.filter((t) => t.status === "done" || t.status === "completed").length;
                const isSelected = selectedId === project.id;

                return (
                  <motion.div key={project.id} layout className="rounded-3xl overflow-hidden transition-all cursor-pointer bg-surface border-b-primary"
                    onClick={() => setSelectedId(isSelected ? null : project.id)}
                    style={{ boxShadow: isSelected ? "0 4px 12px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.08)", transform: isSelected ? "scale(1.015)" : "scale(1)" }}
                  >
                    <div className="flex items-center gap-3 p-4">
                      <span className="text-2xl">{project.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[17px] text-t-primary truncate" style={{ fontWeight: 450 }}>{project.name}</p>
                        <p className="text-[11px] text-t-secondary mt-0.5">{projectTasks.length} tâches · {doneTasks} faites</p>
                      </div>
                      {isSelected ? <ChevronDown size={14} className="text-t-secondary shrink-0" /> : <ChevronRight size={14} className="text-b-hover shrink-0" />}
                    </div>

                    {projectTasks.length > 0 && (
                      <div className="mx-4 mb-3 h-1 rounded-full overflow-hidden bg-b-primary">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(doneTasks / projectTasks.length) * 100}%`, background: project.color }} />
                      </div>
                    )}

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-3 flex flex-col gap-2 border-t-b-primary" style={{ borderTop: "1px solid var(--border-b-primary)" }}>
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {(["active", "paused", "completed", "archived"] as ProjectStatus[]).map((s) => (
                                <button key={s} onClick={(e) => { e.stopPropagation(); updateProject(project.id, { status: s }); }}
                                  className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all"
                                  style={{ background: project.status === s ? "var(--accent-blue-light)" : "var(--surface)", color: project.status === s ? "var(--accent-blue)" : "var(--text-primary)", border: `1px solid ${project.status === s ? "var(--accent-blue-light)" : "var(--border-b-primary)"}` }}
                                >{STATUS_LABELS[s]}</button>
                              ))}
                            </div>
                            {projectTasks.length > 0 && (
                              <div className="flex flex-col gap-1 mt-1">
                                {projectTasks.slice(0, 5).map((t) => (
                                  <div key={t.id} className="flex items-center gap-2 text-[11px]">
                                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: t.status === "done" || t.status === "completed" ? "var(--accent-green)" : "var(--border-b-hover)" }} />
                                    <span className="truncate" style={{ color: t.status === "done" || t.status === "completed" ? "var(--accent-green)" : "var(--text-secondary)" }}>{t.text}</span>
                                  </div>
                                ))}
                                {projectTasks.length > 5 && <p className="text-[10px] text-t-secondary">+{projectTasks.length - 5} de plus</p>}
                              </div>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                              className="flex items-center gap-1.5 text-[10px] text-t-secondary hover:text-accent-red transition-colors self-end mt-1">
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
            <p className="text-[10px] font-medium text-t-secondary uppercase tracking-widest px-1">Autres</p>
            <div className="flex flex-col gap-2">
              {otherProjects.map((project) => {
                const projectTasks = tasks.filter((t) => t.projectId === project.id);
                const doneTasks = projectTasks.filter((t) => t.status === "done" || t.status === "completed").length;
                const isExpanded = expandedOtherId === project.id;

                return (
                  <motion.div key={project.id} layout className="rounded-3xl overflow-hidden transition-all bg-surface border-b-primary"
                    style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
                  >
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-empty-bg transition-colors"
                      onClick={() => setExpandedOtherId(isExpanded ? null : project.id)}
                    >
                      <span className="text-lg">{project.emoji}</span>
                      <span className="flex-1 text-sm text-t-primary truncate">{project.name}</span>
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
                      {isExpanded ? <ChevronDown size={14} className="text-t-secondary shrink-0" /> : <ChevronRight size={14} className="text-b-hover shrink-0" />}
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 flex flex-col gap-2.5" style={{ borderTop: "1px solid var(--border-b-primary)" }}>
                            {/* Status buttons — including "active" to reactivate */}
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {(["active", "paused", "completed", "archived"] as ProjectStatus[]).map((s) => (
                                <button
                                  key={s}
                                  onClick={(e) => { e.stopPropagation(); updateProject(project.id, { status: s }); }}
                                  className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1"
                                  style={{
                                    background: project.status === s ? "var(--accent-blue-light)" : "var(--surface)",
                                    color: project.status === s ? "var(--accent-blue)" : "var(--text-primary)",
                                    border: `1px solid ${project.status === s ? "var(--accent-blue-light)" : "var(--border-b-primary)"}`,
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
                                <p className="text-[10px] text-t-secondary">{projectTasks.length} tâches · {doneTasks} terminées</p>
                                {projectTasks.slice(0, 3).map((t) => (
                                  <div key={t.id} className="flex items-center gap-2 text-[11px]">
                                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: t.status === "done" || t.status === "completed" ? "var(--accent-green)" : "var(--border-b-hover)" }} />
                                    <span className="truncate" style={{ color: t.status === "done" || t.status === "completed" ? "var(--accent-green)" : "var(--text-secondary)" }}>{t.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <button
                              onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                              className="flex items-center gap-1.5 text-[10px] text-t-secondary hover:text-accent-red transition-colors self-end"
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
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-empty-bg border-b-primary">
              <FolderKanban size={18} className="text-t-secondary" />
            </div>
            <p className="text-xs text-t-secondary">Aucun projet. Crée ton premier !</p>
          </div>
        )}
      </div>
    </div>
  );
}