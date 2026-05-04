import { StateCreator } from "zustand";
import { AppState } from "../useAppStore";
import { Task, MicroStep, IncupTag, TaskStatus } from "./types";
import { uid } from "./utils";

export const createTasksSlice: StateCreator<AppState, [], [], Pick<AppState, "tasks" | "addTask" | "updateTask" | "updateTaskStatus" | "completeTask" | "deleteTask" | "toggleExpand" | "addMicroStep" | "toggleMicroStep" | "deleteMicroStep" | "toggleTag" | "assignTaskToProject" | "setMicroSteps" | "newStart" | "reorderTasks" | "lastActiveAt" | "lastActiveTaskId" | "setLastActive">> = (set, get) => ({
  tasks: [],
  lastActiveAt: Date.now(),
  lastActiveTaskId: null,
  setLastActive: (taskId) => set((s) => ({ lastActiveAt: Date.now(), lastActiveTaskId: taskId ?? s.lastActiveTaskId })),
  addTask: (text, status, projectId, linkedJournalId, linkedNoteId, linkedProspectId) => {
    const trimmedText = text.trim();
    if (!trimmedText) return "";
    const newTask: Task = { id: uid(), text: trimmedText, status: status ?? "today", projectId, createdAt: Date.now(), tags: [], microSteps: [], expanded: false, linkedJournalId, linkedNoteId, linkedProspectId };
    set((s) => ({ tasks: [...s.tasks, newTask], lastActiveAt: Date.now(), lastActiveTaskId: newTask.id }));
    get().addToast(`Tâche ajoutée`, "info");
    return newTask.id;
  },
  updateTask: (id, updates) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, ...updates } : t) })),
  updateTaskStatus: (id, status) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, status, ...(status === "completed" ? { completedAt: Date.now() } : {}) } : t) })),
  completeTask: (id) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, status: "completed", completedAt: Date.now() } : t), lastActiveAt: Date.now() })),
  deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  toggleExpand: (id) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, expanded: !t.expanded } : t) })),
  addMicroStep: (taskId, text) => set((s) => ({ tasks: s.tasks.map((t) => t.id === taskId ? { ...t, microSteps: [...t.microSteps, { id: uid(), text: text.trim(), done: false }] } : t) })),
  toggleMicroStep: (taskId, stepId) => set((s) => ({ tasks: s.tasks.map((t) => t.id === taskId ? { ...t, microSteps: t.microSteps.map((ms) => ms.id === stepId ? { ...ms, done: !ms.done } : ms) } : t) })),
  deleteMicroStep: (taskId, stepId) => set((s) => ({ tasks: s.tasks.map((t) => t.id === taskId ? { ...t, microSteps: t.microSteps.filter((ms) => ms.id !== stepId) } : t) })),
  toggleTag: (taskId, tag) => set((s) => ({ tasks: s.tasks.map((t) => t.id === taskId ? { ...t, tags: t.tags.includes(tag) ? t.tags.filter((tg) => tg !== tag) : [...t.tags, tag] } : t) })),
  assignTaskToProject: (taskId, projectId) => set((s) => ({ tasks: s.tasks.map((t) => t.id === taskId ? { ...t, projectId } : t) })),
  setMicroSteps: (taskId, steps) => set((s) => ({ tasks: s.tasks.map((t) => t.id === taskId ? { ...t, microSteps: steps } : t) })),
  newStart: () => set((s) => ({ tasks: s.tasks.map((t) => t.status === "today" ? { ...t, status: "inbox" } : t), lastActiveTaskId: null })),
  reorderTasks: (taskIds) => set((s) => ({ tasks: s.tasks.map((t) => ({ ...t, order: taskIds.indexOf(t.id) })) })),
});
