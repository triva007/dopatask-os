import { StateCreator } from "zustand";
import { AppState } from "../useAppStore";
import { Project, Objective, LifeGoal } from "./types";
import { uid } from "./utils";

export const createProjectsSlice: StateCreator<AppState, [], [], Pick<AppState, "projects" | "addProject" | "updateProject" | "deleteProject" | "objectives" | "addObjective" | "updateObjectiveProgress" | "addMilestone" | "toggleMilestone" | "deleteMilestone" | "deleteObjective" | "lifeGoals" | "addLifeGoal" | "updateLifeGoal" | "deleteLifeGoal" | "toggleLifeGoalStep" | "addLifeGoalStep" | "deleteLifeGoalStep">> = (set, get) => ({
  projects: [],
  addProject: (name, emoji, objectiveId, color) => {
    const newId = uid();
    set((s) => ({ projects: [...s.projects, { id: newId, name: name.trim(), emoji: emoji ?? "📁", objectiveId, status: "active", color: color ?? "#3b82f6", createdAt: Date.now() }] }));
    return newId;
  },
  updateProject: (id, updates) => set((s) => ({ projects: s.projects.map((p) => p.id === id ? { ...p, ...updates } : p) })),
  deleteProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id), tasks: s.tasks.map((t) => t.projectId === id ? { ...t, projectId: undefined } : t) })),

  objectives: [],
  addObjective: (title, horizon, color) => set((s) => ({ objectives: [...s.objectives, { id: uid(), title: title.trim(), horizon, progress: 0, color: color ?? "#06b6d4", createdAt: Date.now(), milestones: [] }] })),
  updateObjectiveProgress: (id, progress) => set((s) => ({ objectives: s.objectives.map((o) => o.id === id ? { ...o, progress: Math.min(100, Math.max(0, progress)) } : o) })),
  addMilestone: (objId, text) => set((s) => ({ objectives: s.objectives.map((o) => o.id === objId ? { ...o, milestones: [...o.milestones, { id: uid(), text: text.trim(), done: false }] } : o) })),
  toggleMilestone: (objId, msId) => set((s) => ({ objectives: s.objectives.map((o) => { if (o.id !== objId) return o; const updated = o.milestones.map((m) => m.id === msId ? { ...m, done: !m.done } : m); const newProgress = updated.length > 0 ? Math.round((updated.filter(m => m.done).length / updated.length) * 100) : o.progress; return { ...o, milestones: updated, progress: newProgress }; }) })),
  deleteMilestone: (objId, msId) => set((s) => ({ objectives: s.objectives.map((o) => o.id === objId ? { ...o, milestones: o.milestones.filter((m) => m.id !== msId) } : o) })),
  deleteObjective: (id) => set((s) => ({ objectives: s.objectives.filter((o) => o.id !== id), projects: s.projects.map((p) => p.objectiveId === id ? { ...p, objectiveId: undefined } : p) })),

  lifeGoals: [],
  addLifeGoal: (goal) => set((s) => ({ lifeGoals: [...s.lifeGoals, { ...goal, id: uid(), createdAt: Date.now(), color: goal.color || "#7c3aed" }] })),
  updateLifeGoal: (id, updates) => set((s) => ({ lifeGoals: s.lifeGoals.map((g) => g.id === id ? { ...g, ...updates } : g) })),
  deleteLifeGoal: (id) => set((s) => ({ lifeGoals: s.lifeGoals.filter((g) => g.id !== id) })),
  toggleLifeGoalStep: (goalId, stepId) => set((s) => ({ lifeGoals: s.lifeGoals.map((g) => g.id === goalId ? { ...g, actionSteps: g.actionSteps.map((s) => s.id === stepId ? { ...s, done: !s.done } : s) } : g) })),
  addLifeGoalStep: (goalId, text) => set((s) => ({ lifeGoals: s.lifeGoals.map((g) => g.id === goalId ? { ...g, actionSteps: [...g.actionSteps, { id: uid(), text: text.trim(), done: false }] } : g) })),
  deleteLifeGoalStep: (goalId, stepId) => set((s) => ({ lifeGoals: s.lifeGoals.map((g) => g.id === goalId ? { ...g, actionSteps: g.actionSteps.filter((s) => s.id !== stepId) } : g) })),
});
