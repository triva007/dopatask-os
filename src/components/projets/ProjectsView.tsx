"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MoreVertical, Trash2, RotateCcw } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { ProjectStatus } from "@/store/useAppStore";
import ProjectDetailView from "./ProjectDetailView";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Actifs",
  paused: "En pause",
  completed: "Terminés",
  archived: "Archivés",
};

const COLUMNS: { id: ProjectStatus | "done"; title: string; statuses: ProjectStatus[] }[] = [
  { id: "active", title: "En cours", statuses: ["active"] },
  { id: "paused", title: "En pause", statuses: ["paused"] },
  { id: "done", title: "Terminés / Archivés", statuses: ["completed", "archived"] },
];

export default function ProjectsView() {
  const { projects, tasks, addProject, updateProject, deleteProject } = useAppStore();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📁");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (selectedProject) {
    return <ProjectDetailView project={selectedProject} onBack={() => setSelectedProjectId(null)} />;
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addProject(newName.trim(), newEmoji);
    setNewName("");
    setNewEmoji("📁");
    setAdding(false);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-8 pt-8 pb-5 border-b border-[var(--border-primary)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight leading-none">
              Projets
            </h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-2">
              Gérez vos domaines de vie et grands objectifs.
            </p>
          </div>
          <button
            onClick={() => setAdding(!adding)}
            className="h-9 px-3.5 rounded-xl text-[12.5px] font-medium border transition-colors flex items-center"
            style={{
              background: "var(--accent-blue-light)",
              color: "var(--accent-blue)",
              borderColor: "color-mix(in srgb, var(--accent-blue) 25%, transparent)",
            }}
          >
            <Plus size={14} className="mr-1" /> Nouveau Projet
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6">
        <AnimatePresence>
          {adding && (
            <motion.form
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              onSubmit={handleAdd}
              className="p-4 rounded-xl flex flex-col gap-3 bg-[var(--card-bg)] border border-[var(--border-primary)] overflow-hidden max-w-2xl"
            >
              <div className="flex items-center gap-3">
                <input
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  className="w-10 h-10 text-center text-xl bg-[var(--surface-1)] rounded-lg focus:outline-none border border-[var(--border-primary)]"
                />
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nom du projet..."
                  className="flex-1 text-[14px] bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="h-8 px-4 text-[12px] font-medium rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim()}
                  className="h-8 px-4 text-[12px] font-medium rounded-lg disabled:opacity-50"
                  style={{
                    background: "var(--accent-blue)",
                    color: "#fff",
                  }}
                >
                  Créer
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex gap-6 h-full items-start overflow-x-auto pb-8">
          {COLUMNS.map((col) => {
            const colProjects = projects.filter((p) => col.statuses.includes(p.status));
            return (
              <div key={col.id} className="flex-1 flex flex-col gap-3 min-w-[300px] max-w-[400px]">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[13px] font-semibold text-[var(--text-secondary)] tracking-wider uppercase">
                    {col.title}
                  </h3>
                  <span className="text-[11px] font-medium text-[var(--text-tertiary)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full">
                    {colProjects.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <AnimatePresence>
                    {colProjects.map((project) => {
                      const projectTasks = tasks.filter((t) => t.projectId === project.id);
                      const doneTasks = projectTasks.filter((t) => t.status === "done" || t.status === "completed").length;
                      const pct = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0;
                      const isMenuOpen = activeMenuId === project.id;

                      return (
                        <motion.div
                          layoutId={project.id}
                          key={project.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-primary)] shadow-sm relative group cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
                          onMouseLeave={() => setActiveMenuId(null)}
                          onClick={() => setSelectedProjectId(project.id)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{project.emoji}</span>
                              <div>
                                <p className="text-[15px] font-semibold text-[var(--text-primary)] leading-tight">{project.name}</p>
                                {project.status === "archived" && <span className="text-[10px] text-[var(--text-tertiary)] uppercase mt-0.5 block">Archivé</span>}
                              </div>
                            </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); setActiveMenuId(isMenuOpen ? null : project.id); }}
                                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1 -mr-2 -mt-1 rounded-md hover:bg-[var(--surface-2)]"
                              >
                                <MoreVertical size={16} />
                              </button>
                            </div>
                            <span className="text-[12px] text-[var(--text-tertiary)] mt-2 block">Espace projet</span>

                          <AnimatePresence>
                            {isMenuOpen && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute right-4 top-10 bg-[var(--surface-1)] border border-[var(--border-primary)] rounded-xl shadow-lg p-1 z-10 min-w-[140px]"
                              >
                                {(["active", "paused", "completed", "archived"] as ProjectStatus[]).map((s) => (
                                  project.status !== s && (
                                    <button
                                      key={s}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateProject(project.id, { status: s });
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] rounded-lg transition-colors flex items-center gap-2"
                                    >
                                      {s === "active" && <RotateCcw size={12} />}
                                      {s === "active" ? "Reprendre" : STATUS_LABELS[s]}
                                    </button>
                                  )
                                ))}
                                <div className="h-px bg-[var(--border-primary)] my-1 mx-2" />
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                                  className="w-full text-left px-3 py-1.5 text-[12px] text-[var(--accent-red)] hover:bg-[var(--accent-red-light)] rounded-lg transition-colors flex items-center gap-2"
                                >
                                  <Trash2 size={12} /> Supprimer
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {colProjects.length === 0 && (
                    <div className="p-4 rounded-2xl border border-dashed border-[var(--border-secondary)] text-center text-[var(--text-tertiary)] text-[12px]">
                      Aucun projet
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}