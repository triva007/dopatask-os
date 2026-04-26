import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import { supabaseStorage } from "@/lib/supabaseStorage";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskStatus = "today" | "inbox" | "done" | "todo" | "in_progress" | "completed" | "saved";
export type IncupTag = "Intérêt" | "Nouveauté" | "Challenge" | "Urgence" | "Passion";
export type ObjectiveHorizon = "week" | "month" | "quarter" | "year";
export type ProjectStatus = "active" | "paused" | "completed" | "archived";
export type LifeGoalHorizon = "court_terme" | "moyen_terme" | "long_terme";
export type InboxItemType = "task" | "note" | "event";
export type RecurrenceType = "none" | "daily" | "weekdays" | "weekly" | "monthly";

export interface MicroStep {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  text: string;
  description?: string;
  status: TaskStatus;
  projectId?: string;
  sprintId?: string;
  createdAt: number;
  completedAt?: number;
  tags: IncupTag[];
  microSteps: MicroStep[];
  expanded: boolean;
  estimatedMinutes?: number;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
  recurrence?: RecurrenceType;
  order?: number;
  googleTaskId?: string;
  googleTaskListId?: string;
  googleUpdated?: string;
  linkedJournalId?: string;
  linkedNoteId?: string;
}

export interface Project {
  id: string;
  name: string;
  objectiveId?: string;
  status: ProjectStatus;
  emoji: string;
  color: string;
  createdAt: number;
}

export interface Milestone {
  id: string;
  text: string;
  done: boolean;
}

export interface Objective {
  id: string;
  title: string;
  horizon: ObjectiveHorizon;
  progress: number;
  milestones: Milestone[];
  color: string;
  createdAt: number;
}

export interface LifeGoal {
  id: string;
  title: string;
  description: string;
  horizon: LifeGoalHorizon;
  category: string;
  imageUrl?: string;
  actionSteps: { id: string; text: string; done: boolean }[];
  createdAt: number;
  color: string;
}

export interface JournalEntry {
  id: string;
  content: string;
  mood?: "great" | "good" | "neutral" | "bad" | "terrible";
  createdAt: number;
  tags: string[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  archived: boolean;
  labels: string[];
  images: string[]; // Base64 strings for now
  createdAt: number;
  updatedAt: number;
}

export interface InboxItem {
  id: string;
  text: string;
  type: InboxItemType;
  processed: boolean;
  createdAt: number;
}

export interface TimelineEvent {
  id: string;
  hour: number;
  duration: number;
  label: string;
  color: string;
  day?: string;
  googleEventId?: string;
  googleCalendarId?: string;
  googleUpdated?: string;
  linkedTaskId?: string;
  linkedProjectId?: string;
  linkedJournalId?: string;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
  createdAt: number;
}

interface AppState {
  hasSeenTutorial: boolean;
  setHasSeenTutorial: (v: boolean) => void;
  tasks: Task[];
  addTask: (text: string, status?: TaskStatus, projectId?: string, linkedJournalId?: string, linkedNoteId?: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  toggleExpand: (id: string) => void;
  addMicroStep: (taskId: string, text: string) => void;
  toggleMicroStep: (taskId: string, stepId: string) => void;
  deleteMicroStep: (taskId: string, stepId: string) => void;
  toggleTag: (taskId: string, tag: IncupTag) => void;
  assignTaskToProject: (taskId: string, projectId: string | undefined) => void;
  setMicroSteps: (taskId: string, steps: MicroStep[]) => void;
  newStart: () => void;
  reorderTasks: (taskIds: string[]) => void;
  projects: Project[];
  addProject: (name: string, emoji?: string, objectiveId?: string, color?: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  objectives: Objective[];
  addObjective: (title: string, horizon: ObjectiveHorizon, color?: string) => void;
  updateObjectiveProgress: (id: string, progress: number) => void;
  addMilestone: (objId: string, text: string) => void;
  toggleMilestone: (objId: string, msId: string) => void;
  deleteMilestone: (objId: string, msId: string) => void;
  deleteObjective: (id: string) => void;
  lifeGoals: LifeGoal[];
  addLifeGoal: (goal: Omit<LifeGoal, "id" | "createdAt">) => void;
  updateLifeGoal: (id: string, updates: Partial<LifeGoal>) => void;
  deleteLifeGoal: (id: string) => void;
  toggleLifeGoalStep: (goalId: string, stepId: string) => void;
  addLifeGoalStep: (goalId: string, text: string) => void;
  deleteLifeGoalStep: (goalId: string, stepId: string) => void;
  journalEntries: JournalEntry[];
  addJournalEntry: (content: string, mood?: JournalEntry["mood"], tags?: string[]) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
  convertJournalToTask: (id: string) => void;
  sendJournalToInbox: (id: string) => void;
  notes: Note[];
  addNote: (title: string, content: string, color?: string, images?: string[]) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  toggleArchiveNote: (id: string) => void;
  inboxItems: InboxItem[];
  addInboxItem: (text: string, type?: InboxItemType) => void;
  processInboxItem: (id: string) => void;
  convertInboxToTask: (id: string, projectId?: string) => void;
  deleteInboxItem: (id: string) => void;
  clearProcessedInbox: () => void;
  timelineEvents: TimelineEvent[];
  addTimelineEvent: (event: Omit<TimelineEvent, "id">) => void;
  updateTimelineEvent: (id: string, updates: Partial<TimelineEvent>) => void;
  deleteTimelineEvent: (id: string) => void;
  xp: number;
  bossHp: number;
  streak: number;
  bossLevel: number;
  lastCritical: number;
  lastStreakDate: string | null;
  purchasedRewards: string[];
  totalFocusMinutes: number;
  hyperfocusSessions: number;
  totalTasksCompleted: number;
  unlockedAchievements: string[];
  dailyChallengeId: string | null;
  dailyChallengeCompleted: boolean;
  addXp: (amount: number) => void;
  attackBoss: (damage: number) => void;
  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"], duration?: number) => void;
  removeToast: (id: string) => void;
  lastActiveAt: number;
  lastActiveTaskId: string | null;
  setLastActive: (taskId?: string) => void;
  settings: { enableSounds: boolean };
  updateSettings: (updates: Partial<{ enableSounds: boolean }>) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

export const useAppStore = create<AppState>()(
  persist(
    temporal(
      (set, get) => ({
        hasSeenTutorial: false,
        theme: "dark",
        setHasSeenTutorial: (v) => set({ hasSeenTutorial: v }),
        toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),

        tasks: [],
        addTask: (text, status, projectId, linkedJournalId, linkedNoteId) => {
          const newTask: Task = { id: uid(), text: text.trim(), status: status ?? "today", projectId, createdAt: Date.now(), tags: [], microSteps: [], expanded: false, linkedJournalId, linkedNoteId };
          set((s) => ({ tasks: [...s.tasks, newTask], lastActiveAt: Date.now(), lastActiveTaskId: newTask.id }));
          get().addToast(`Tâche ajoutée`, "info");
        },
        updateTask: (id, updates) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, ...updates } : t) })),
        updateTaskStatus: (id, status) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, status, ...(status === "completed" ? { completedAt: Date.now() } : {}) } : t) })),
        completeTask: (id) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, status: "done", completedAt: Date.now() } : t), lastActiveAt: Date.now() })),
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

        projects: [],
        addProject: (name, emoji, objectiveId, color) => set((s) => ({ projects: [...s.projects, { id: uid(), name: name.trim(), emoji: emoji ?? "📁", objectiveId, status: "active", color: color ?? "#3b82f6", createdAt: Date.now() }] })),
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

        journalEntries: [],
        addJournalEntry: (content, mood, tags) => set((s) => ({ journalEntries: [{ id: uid(), content: content.trim(), mood, tags: tags ?? [], createdAt: Date.now() }, ...s.journalEntries] })),
        updateJournalEntry: (id, updates) => set((s) => ({ journalEntries: s.journalEntries.map((e) => e.id === id ? { ...e, ...updates } : e) })),
        deleteJournalEntry: (id) => set((s) => ({ journalEntries: s.journalEntries.filter((e) => e.id !== id) })),
        convertJournalToTask: (id) => { const entry = get().journalEntries.find(e => e.id === id); if (entry) get().addTask(entry.content.split("\n")[0].slice(0, 50), "today", undefined, id); },
        sendJournalToInbox: (id) => { const entry = get().journalEntries.find(e => e.id === id); if (entry) get().addInboxItem(entry.content.slice(0, 100), "note"); },

        notes: [],
        addNote: (title, content, color, images) => set((s) => ({ notes: [{ id: uid(), title: title.trim(), content: content.trim(), color: color ?? "#7c3aed", pinned: false, archived: false, labels: [], images: images ?? [], createdAt: Date.now(), updatedAt: Date.now() }, ...s.notes] })),
        updateNote: (id, updates) => set((s) => ({ notes: s.notes.map((n) => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n) })),
        deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
        togglePinNote: (id) => set((s) => ({ notes: s.notes.map((n) => n.id === id ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n) })),
        toggleArchiveNote: (id) => set((s) => ({ notes: s.notes.map((n) => n.id === id ? { ...n, archived: !n.archived, updatedAt: Date.now() } : n) })),

        inboxItems: [],
        addInboxItem: (text, type) => set((s) => ({ inboxItems: [{ id: uid(), text: text.trim(), type: type ?? "task", processed: false, createdAt: Date.now() }, ...s.inboxItems] })),
        processInboxItem: (id) => set((s) => ({ inboxItems: s.inboxItems.map((i) => i.id === id ? { ...i, processed: true } : i) })),
        convertInboxToTask: (id, projectId) => { const item = get().inboxItems.find(i => i.id === id); if (item) { get().addTask(item.text, "today", projectId); get().processInboxItem(id); } },
        deleteInboxItem: (id) => set((s) => ({ inboxItems: s.inboxItems.filter((i) => i.id !== id) })),
        clearProcessedInbox: () => set((s) => ({ inboxItems: s.inboxItems.filter((i) => !i.processed) })),

        timelineEvents: [],
        addTimelineEvent: (event) => set((s) => ({ timelineEvents: [...s.timelineEvents, { ...event, id: uid() }] })),
        updateTimelineEvent: (id, updates) => set((s) => ({ timelineEvents: s.timelineEvents.map((e) => e.id === id ? { ...e, ...updates } : e) })),
        deleteTimelineEvent: (id) => set((s) => ({ timelineEvents: s.timelineEvents.filter((e) => e.id !== id) })),

        xp: 0, bossHp: 100, streak: 0, bossLevel: 1, lastCritical: 0, lastStreakDate: null, purchasedRewards: [],
        totalFocusMinutes: 0, hyperfocusSessions: 0, totalTasksCompleted: 0, unlockedAchievements: [], dailyChallengeId: null, dailyChallengeCompleted: false,
        addXp: (amount) => set((s) => ({ xp: s.xp + amount })),
        attackBoss: (damage) => set((s) => ({ bossHp: Math.max(0, s.bossHp - damage) })),

        toasts: [],
        addToast: (message, type = "info", duration = 3000) => set((s) => ({ toasts: [...s.toasts, { id: uid(), message, type, duration, createdAt: Date.now() }] })),
        removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

        lastActiveAt: Date.now(),
        lastActiveTaskId: null,
        setLastActive: (taskId) => set((s) => ({ lastActiveAt: Date.now(), lastActiveTaskId: taskId ?? s.lastActiveTaskId })),
        settings: { enableSounds: true },
        updateSettings: (updates) => set((s) => ({ settings: { ...s.settings, ...updates } })),
      }),
    ),
    {
      name: "dopatask-storage",
      version: 7, // Increment for Note images field
      storage: createJSONStorage(() => supabaseStorage),
    }
  )
);
