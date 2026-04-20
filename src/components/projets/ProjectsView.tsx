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
      <div className="shrink-0 px-8 pt-8 pb-5 border-b" style={{ borderColor: "var(--border-primary)" }}>
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight leading-none">
              Projets
            </h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-2">
              <span className="font-medium">{projects.length}</span> projets
              <span className="mx-2 text-[var(--text-ghost)]">·</span>
              <span className="font-medium">{activeProjects.length}</span> actifs
            </p>
          </div>
          <button
            onClick={() => setAdding(!adding)}
            className="h-9 px-3.5 rounded-xl text-[12.5px] font-medium border transition-colors shrink-0"
            style={{
              background: "var(--accent-blue-light)",
              color: "var(--accent-blue)",
              borderColor: "color-mix(in srgb, var(--accent-blue) 25%, transparent)",
            }}
          >
            <Plus size={13} className="inline mr-1" /> Nouveau
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6 flex flex-col gap-6">
        {/* Add form */}
        <AnimatePresence>
          {adding && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              onSubmit={handleAdd}
              className="p-4 rounded-lg flex flex-col gap-3 bg-[var(--card-bg)] border border-[var(--border-primary)]"
            >
              <div className="flex items-center gap-3">
                <input
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  className="w-9 h-9 text-center text-lg bg-[var(--surface-1)] rounded-md focus:outline-none border border-[var(--border-primary)]"
                />
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nom du projet"
                  className="flex-1 text-[13px] bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="h-8 px-3 text-[12px] font-medium rounded-md border text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-8 px-3 text-[12px] font-medium rounded-md"
                  style={{
                    background: "var(--accent-blue-light)",
                    color: "var(--accent-blue)",
                    border: "1px solid color-mix(in srgb, var(--accent-blue) 25%, transparent)",
                  }}
                >
                  Créer
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Active projects */}
        {activeProjects.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-semibold text-[var(--text-secondary)]">Actifs</p>
            <div className="grid grid-cols-2 gap-3">
              {activeProjects.map((project) => {
                const projectTasks = tasks.filter((t) => t.projectId === project.id);
                const doneTasks = projectTasks.filter((t) => t.status === "done" || t.status === "completed").length;
                const isSelected = selectedId === project.id;

                return (
                  <motion.div
                    key={project.id}
                    layout
                    className="rounded-lg overflow-hidden transition-colors cursor-pointer bg-[var(--card-bg)] border border-[var(--border-primary)] hover:bg-[var(--surface-2)]"
                    onClick={() => setSelectedId(isSelected ? null : project.id)}
                  >
                    <div className="flex items-center gap-3 p-4">
                      <span className="text-xl">{project.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-[var(--text-primary)] truncate">{project.name}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{projectTasks.length} tâches · {doneTasks} faites</p>
                      </div>
                      {isSelected ? (
                        <ChevronDown size={13} className="text-[var(--text-secondary)] shrink-0" />
                      ) : (
                        <ChevronRight size={13} className="text-[var(--text-tertiary)] shrink-0" />
                      )}
                    </div>

                    {projectTasks.length > 0 && (
                      <div className="mx-4 mb-3 h-[3px] rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${(doneTasks / projectTasks.length) * 100}%`, background: project.color }} />
                      </div>
                    )}

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 flex flex-col gap-2" style={{ borderTop: "1px solid var(--border-primary)" }}>
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {(["active", "paused", "completed", "archived"] as ProjectStatus[]).map((s) => (
                                <button
                                  key={s}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateProject(project.id, { status: s });
                                  }}
                                  className="text-[11px] px-2.5 py-1 rounded-md font-medium transition-all border"
                                  style={{
                                    background: project.status === s ? "var(--accent-blue-light)" : "transparent",
                                    color: project.status === s ? "var(--accent-blue)" : "var(--text-secondary)",
                                    borderColor: project.status === s ? "var(--accent-blue)" : "var(--border-primary)",
                                  }}
                                >
                                  {STATUS_LABELS[s]}
                                </button>
                              ))}
                            </div>
                            {projectTasks.length > 0 && (
                              <div className="flex flex-col gap-1 mt-1">
                                {projectTasks.slice(0, 5).map((t) => (
                                  <div key={t.id} className="flex items-center gap-2 text-[11px]">
                                    <div
                                      className="w-1.5 h-1.5 rounded-full shrink-0"
                                      style={{
                                        background: t.status === "done" || t.status === "completed" ? "var(--accent-green)" : "var(--border-secondary)",
                                      }}
                                    />
                                    <span
                                      className="truncate"
                                      style={{
                                        color: t.status === "done" || t.status === "completed" ? "var(--accent-green)" : "var(--text-secondary)",
                                      }}
                                    >
                                      {t.text}
                                    </span>
                                  </div>
                                ))}
                                {projectTasks.length > 5 && (
                                  <p className="text-[10px] text-[var(--text-tertiary)]">+{projectTasks.length - 5} de plus</p>
                                )}
                              </div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteProject(project.id);
                              }}
                              className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--accent-red)] transition-colors self-end mt-1"
                            >
                              <Trash2 size={10} /> Supprimer
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

        {/* Other projects */}
        {otherProjects.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-semibold text-[var(--text-secondary)]">Autres</p>
            <div className="flex flex-col gap-2">
              {otherProjects.map((project) => {
                const projectTasks = tasks.filter((t) => t.projectId === project.id);
                const doneTasks = projectTasks.filter((t) => t.status === "done" || t.status === "completed").length;
                const isExpanded = expandedOtherId === project.id;

                return (
                  <motion.div
                    key={project.id}
                    layout
                    className="rounded-lg overflow-hidden transition-colors bg-[var(--card-bg)] border border-[var(--border-primary)]"
                  >
                    <div
                      className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
                      onClick={() => setExpandedOtherId(isExpanded ? null : project.id)}
                    >
                      <span className="text-lg">{project.emoji}</span>
                      <span className="flex-1 text-[13px] font-medium text-[var(--text-primary)] truncate">{project.name}</span>
                      <span
                        className="text-[10px] px-2 py-1 rounded-md font-medium inline-flex"
                        style={{
                          background: `${STATUS_COLORS[project.status]}20`,
                          color: STATUS_COLORS[project.status],
                          border: `1px solid ${STATUS_COLORS[project.status]}40`,
                        }}
                      >
                        {STATUS_LABELS[project.status]}
                      </span>
                      {isExpanded ? (
                        <ChevronDown size={13} className="text-[var(--text-secondary)] shrink-0" />
                      ) : (
                        <ChevronRight size={13} className="text-[var(--text-tertiary)] shrink-0" />
                      )}
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 flex flex-col gap-2" style={{ borderTop: "1px solid var(--border-primary)" }}>
                            <div className="flex flex-wrap gap-1.5 pt-2">
                              {(["active", "paused", "completed", "archived"] as ProjectStatus[]).map((s) => (
                                <button
                                  key={s}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateProject(project.id, { status: s });
                                  }}
                                  className="text-[11px] px-2.5 py-1 rounded-md font-medium transition-all border flex items-center gap-1"
                                  style={{
                                    background: project.status === s ? "var(--accent-blue-light)" : "transparent",
                                    color: project.status === s ? "var(--accent-blue)" : "var(--text-secondary)",
                                    borderColor: project.status === s ? "var(--accent-blue)" : "var(--border-primary)",
                                  }}
                                >
                                  {s === "active" && project.status !== "active" && <RotateCcw size={9} />}
                                  {STATUS_LABELS[s]}
                                </button>
                              ))}
                            </div>

                            {projectTasks.length > 0 && (
                              <div className="flex flex-col gap-1">
                                <p className="text-[11px] text-[var(--text-tertiary)]">
                                  {projectTasks.length} tâches · {doneTasks} terminées
                                </p>
                                {projectTasks.slice(0, 3).map((t) => (
                                  <div key={t.id} className="flex items-center gap-2 text-[11px]">
                                    <div
                                      className="w-1.5 h-1.5 rounded-full shrink-0"
                                      style={{
                                        background: t.status === "done" || t.status === "completed" ? "var(--accent-green)" : "var(--border-secondary)",
                                      }}
                                    />
                                    <span
                                      className="truncate"
                                      style={{
                                        color: t.status === "done" || t.status === "completed" ? "var(--accent-green)" : "var(--text-secondary)",
                                      }}
                                    >
                                      {t.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteProject(project.id);
                              }}
                              className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--accent-red)] transition-colors self-end"
                            >
                              <Trash2 size={10} /> Supprimer
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
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "var(--surface-1)" }}>
              <FolderKanban size={20} className="text-[var(--text-secondary)]" />
            </div>
            <p className="text-[13px] font-medium text-[var(--text-secondary)]">Aucun projet</p>
            <p className="text-[12px] text-[var(--text-tertiary)]">Crée ton premier projet pour démarrer</p>
          </div>
        )}
      </div>
    </div>
  );
}