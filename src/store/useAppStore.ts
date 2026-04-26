import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
  // Google Tasks sync
  googleTaskId?: string;
  googleTaskListId?: string;
  googleUpdated?: string;
  // Synergy
  linkedJournalId?: string;
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
  day?: string; // ISO date string, defaults to today
  // Google Calendar sync
  googleEventId?: string;
  googleCalendarId?: string;
  googleUpdated?: string;
  // Synergy
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
  // ── Onboarding ──────────────────────────────────────────────────────────
  hasSeenTutorial: boolean;
  setHasSeenTutorial: (v: boolean) => void;

  // ── Tâches ──────────────────────────────────────────────────────────────
  tasks: Task[];
  addTask: (text: string, status?: TaskStatus, projectId?: string, linkedJournalId?: string) => void;
  updateTask: (id: string, updates: Partial<Pick<Task, "text" | "description" | "status" | "projectId" | "sprintId" | "tags" | "estimatedMinutes" | "dueDate" | "priority" | "recurrence" | "order" | "linkedJournalId">>) => void;
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

  // ── Projets ─────────────────────────────────────────────────────────────
  projects: Project[];
  addProject: (name: string, emoji?: string, objectiveId?: string, color?: string) => void;
  updateProject: (id: string, updates: Partial<Pick<Project, "name" | "emoji" | "status" | "objectiveId" | "color">>) => void;
  deleteProject: (id: string) => void;

  // ── Objectifs ───────────────────────────────────────────────────────────
  objectives: Objective[];
  addObjective: (title: string, horizon: ObjectiveHorizon, color?: string) => void;
  updateObjectiveProgress: (id: string, progress: number) => void;
  addMilestone: (objId: string, text: string) => void;
  toggleMilestone: (objId: string, msId: string) => void;
  deleteMilestone: (objId: string, msId: string) => void;
  deleteObjective: (id: string) => void;

  // ── Life Goals (Vision Board) ─────────────────────────────────────────
  lifeGoals: LifeGoal[];
  addLifeGoal: (goal: Omit<LifeGoal, "id" | "createdAt">) => void;
  updateLifeGoal: (id: string, updates: Partial<Omit<LifeGoal, "id" | "createdAt">>) => void;
  deleteLifeGoal: (id: string) => void;
  toggleLifeGoalStep: (goalId: string, stepId: string) => void;
  addLifeGoalStep: (goalId: string, text: string) => void;
  deleteLifeGoalStep: (goalId: string, stepId: string) => void;

  // ── Journal ───────────────────────────────────────────────────────────
  journalEntries: JournalEntry[];
  addJournalEntry: (content: string, mood?: JournalEntry["mood"], tags?: string[]) => void;
  updateJournalEntry: (id: string, updates: Partial<Pick<JournalEntry, "content" | "mood" | "tags">>) => void;
  deleteJournalEntry: (id: string) => void;
  convertJournalToTask: (id: string) => void;
  sendJournalToInbox: (id: string) => void;

  // ── Inbox (Quick Capture) ─────────────────────────────────────────────
  inboxItems: InboxItem[];
  addInboxItem: (text: string, type?: InboxItemType) => void;
  processInboxItem: (id: string) => void;
  convertInboxToTask: (id: string, projectId?: string) => void;
  deleteInboxItem: (id: string) => void;
  clearProcessedInbox: () => void;

  // ── Timeline Events ─────────────────────────────────────────────────────
  timelineEvents: TimelineEvent[];
  addTimelineEvent: (event: Omit<TimelineEvent, "id">) => void;
  updateTimelineEvent: (id: string, updates: Partial<Omit<TimelineEvent, "id">>) => void;
  deleteTimelineEvent: (id: string) => void;

  // ── Toasts ──────────────────────────────────────────────────────────────
  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"], duration?: number) => void;
  removeToast: (id: string) => void;

  // ── Fil d'Ariane ────────────────────────────────────────────────────────
  lastActiveAt: number;
  lastActiveTaskId: string | null;
  setLastActive: (taskId?: string) => void;

  // ── Settings ────────────────────────────────────────────────────────────
  settings: {
    enableSounds: boolean;
  };
  updateSettings: (updates: Partial<AppState["settings"]>) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

const OBJ_COLORS = ["#06b6d4", "#7c3aed", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];
const PROJECT_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
const PROJECT_EMOJIS = ["📁", "🚀", "💡", "🎯", "⚡", "🔥"];
const GOAL_COLORS = ["#7c3aed", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#3b82f6", "#10b981"];

const todayStr = () => new Date().toISOString().slice(0, 10);

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Onboarding ──────────────────────────────────────────────────────
      hasSeenTutorial: false,
      theme: "dark",
      setHasSeenTutorial: (v) => set({ hasSeenTutorial: v }),
      toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),

      // ── Tâches ──────────────────────────────────────────────────────────
      tasks: [],

      addTask: (text, status, projectId, linkedJournalId) => {
        const { tasks } = get();
        const targetStatus = status ?? "today";
        const newTask: Task = {
          id: uid(), text: text.trim(), status: targetStatus, projectId,
          createdAt: Date.now(), tags: [], microSteps: [], expanded: false,
          linkedJournalId,
        };
        set({ tasks: [...tasks, newTask] });
        get().setLastActive(newTask.id);
        get().addToast(`Tâche ajoutée${targetStatus === "inbox" ? " → Inbox" : ""}`, "info");
      },

      updateTask: (id, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      updateTaskStatus: (id, status) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, status, ...(status === "completed" ? { completedAt: Date.now() } : {}) } : t
          ),
        })),

      completeTask: (id) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, status: "done", completedAt: Date.now() } : t
          ),
          lastActiveAt: Date.now(),
        }));
      },

      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      toggleExpand: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, expanded: !t.expanded } : t
          ),
        })),

      addMicroStep: (taskId, text) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, microSteps: [...t.microSteps, { id: uid(), text: text.trim(), done: false }] }
              : t
          ),
        })),

      toggleMicroStep: (taskId, stepId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, microSteps: t.microSteps.map((ms) => ms.id === stepId ? { ...ms, done: !ms.done } : ms) }
              : t
          ),
        })),

      deleteMicroStep: (taskId, stepId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, microSteps: t.microSteps.filter((ms) => ms.id !== stepId) }
              : t
          ),
        })),

      toggleTag: (taskId, tag) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const has = t.tags.includes(tag);
            return { ...t, tags: has ? t.tags.filter((tg) => tg !== tag) : [...t.tags, tag] };
          }),
        })),

      assignTaskToProject: (taskId, projectId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, projectId } : t
          ),
        })),

      setMicroSteps: (taskId, steps) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, microSteps: steps } : t
          ),
        })),

      newStart: () => {
        const { tasks } = get();
        set({
          tasks: tasks.map((t) => t.status === "today" ? { ...t, status: "inbox" } : t),
          lastActiveTaskId: null,
        });
        get().addToast("Nouveau Départ ! Ardoise effacée.", "info");
      },

      reorderTasks: (taskIds) =>
        set((s) => ({
          tasks: s.tasks.map((t) => {
            const idx = taskIds.indexOf(t.id);
            return idx >= 0 ? { ...t, order: idx } : t;
          }),
        })),

      // ── Projets ─────────────────────────────────────────────────────────
      projects: [
        {
          id: "proj_aaronos", name: "Aaron-OS", objectiveId: undefined,
          status: "active", emoji: "🧠", color: "#8b5cf6", createdAt: Date.now() - 432000000,
        },
        {
          id: "proj_agence", name: "Agence Biz", objectiveId: undefined,
          status: "active", emoji: "🚀", color: "#3b82f6", createdAt: Date.now() - 604800000,
        },
        {
          id: "proj_perso", name: "Perso", objectiveId: undefined,
          status: "active", emoji: "🌱", color: "#10b981", createdAt: Date.now() - 259200000,
        },
      ],

      addProject: (name, emoji, objectiveId, color) =>
        set((s) => ({
          projects: [
            ...s.projects,
            {
              id: uid(),
              name: name.trim(),
              emoji: emoji ?? PROJECT_EMOJIS[s.projects.length % PROJECT_EMOJIS.length],
              objectiveId,
              status: "active" as ProjectStatus,
              color: color ?? PROJECT_COLORS[s.projects.length % PROJECT_COLORS.length],
              createdAt: Date.now(),
            },
          ],
        })),

      updateProject: (id, updates) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          tasks: s.tasks.map((t) => t.projectId === id ? { ...t, projectId: undefined } : t),
        })),

      // ── Objectifs ──────────────────────────────────────────────────────────
      objectives: [],

      addObjective: (title, horizon, color) =>
        set((s) => ({
          objectives: [
            ...s.objectives,
            {
              id: uid(), title: title.trim(), horizon, progress: 0,
              color: color ?? OBJ_COLORS[s.objectives.length % OBJ_COLORS.length],
              createdAt: Date.now(), milestones: [],
            },
          ],
        })),

      updateObjectiveProgress: (id, progress) =>
        set((s) => ({
          objectives: s.objectives.map((o) =>
            o.id === id ? { ...o, progress: Math.min(100, Math.max(0, progress)) } : o
          ),
        })),

      addMilestone: (objId, text) =>
        set((s) => ({
          objectives: s.objectives.map((o) =>
            o.id === objId
              ? { ...o, milestones: [...o.milestones, { id: uid(), text: text.trim(), done: false }] }
              : o
          ),
        })),

      toggleMilestone: (objId, msId) =>
        set((s) => ({
          objectives: s.objectives.map((o) => {
            if (o.id !== objId) return o;
            const updated = o.milestones.map((m) => m.id === msId ? { ...m, done: !m.done } : m);
            const doneCount = updated.filter((m) => m.done).length;
            const newProgress = updated.length > 0 ? Math.round((doneCount / updated.length) * 100) : o.progress;
            return { ...o, milestones: updated, progress: newProgress };
          }),
        })),

      deleteMilestone: (objId, msId) =>
        set((s) => ({
          objectives: s.objectives.map((o) =>
            o.id === objId ? { ...o, milestones: o.milestones.filter((m) => m.id !== msId) } : o
          ),
        })),

      deleteObjective: (id) =>
        set((s) => ({
          objectives: s.objectives.filter((o) => o.id !== id),
          projects: s.projects.map((p) => p.objectiveId === id ? { ...p, objectiveId: undefined } : p),
        })),

      // ── Life Goals (Vision Board) ─────────────────────────────────────
      lifeGoals: [],
      addLifeGoal: (goal) =>
        set((s) => ({
          lifeGoals: [
            ...s.lifeGoals,
            {
              ...goal,
              id: uid(),
              createdAt: Date.now(),
              color: goal.color || GOAL_COLORS[s.lifeGoals.length % GOAL_COLORS.length],
            },
          ],
        })),

      updateLifeGoal: (id, updates) =>
        set((s) => ({
          lifeGoals: s.lifeGoals.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        })),

      deleteLifeGoal: (id) =>
        set((s) => ({
          lifeGoals: s.lifeGoals.filter((g) => g.id !== id),
        })),

      toggleLifeGoalStep: (goalId, stepId) =>
        set((s) => ({
          lifeGoals: s.lifeGoals.map((g) =>
            g.id === goalId
              ? { ...g, actionSteps: g.actionSteps.map((s) => s.id === stepId ? { ...s, done: !s.done } : s) }
              : g
          ),
        })),

      addLifeGoalStep: (goalId, text) =>
        set((s) => ({
          lifeGoals: s.lifeGoals.map((g) =>
            g.id === goalId
              ? { ...g, actionSteps: [...g.actionSteps, { id: uid(), text: text.trim(), done: false }] }
              : g
          ),
        })),

      deleteLifeGoalStep: (goalId, stepId) =>
        set((s) => ({
          lifeGoals: s.lifeGoals.map((g) =>
            g.id === goalId
              ? { ...g, actionSteps: g.actionSteps.filter((s) => s.id !== stepId) }
              : g
          ),
        })),

      // ── Journal ───────────────────────────────────────────────────────
      journalEntries: [],
      addJournalEntry: (content, mood, tags) =>
        set((s) => ({
          journalEntries: [
            { id: uid(), content: content.trim(), mood, tags: tags ?? [], createdAt: Date.now() },
            ...s.journalEntries,
          ],
        })),

      updateJournalEntry: (id, updates) =>
        set((s) => ({
          journalEntries: s.journalEntries.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),

      deleteJournalEntry: (id) =>
        set((s) => ({
          journalEntries: s.journalEntries.filter((e) => e.id !== id),
        })),

      convertJournalToTask: (id) => {
        const entry = get().journalEntries.find(e => e.id === id);
        if (!entry) return;
        // Extraction du premier titre ou début du contenu
        const title = entry.content.split("\n")[0].slice(0, 50).trim() || "Tâche issue du journal";
        get().addTask(title, "today", undefined, id);
        get().addToast("Journal converti en tâche !", "success");
      },

      sendJournalToInbox: (id) => {
        const entry = get().journalEntries.find(e => e.id === id);
        if (!entry) return;
        const text = entry.content.slice(0, 100).trim();
        get().addInboxItem(text, "note");
        get().addToast("Note envoyée à l'Inbox", "info");
      },

      // ── Inbox (Quick Capture) ─────────────────────────────────────────
      inboxItems: [],
      addInboxItem: (text, type) =>
        set((s) => ({
          inboxItems: [
            { id: uid(), text: text.trim(), type: type ?? "task", processed: false, createdAt: Date.now() },
            ...s.inboxItems,
          ],
        })),

      processInboxItem: (id) =>
        set((s) => ({
          inboxItems: s.inboxItems.map((i) =>
            i.id === id ? { ...i, processed: true } : i
          ),
        })),

      convertInboxToTask: (id, projectId) => {
        const { inboxItems } = get();
        const item = inboxItems.find((i) => i.id === id);
        if (!item) return;
        get().addTask(item.text, "today", projectId);
        set((s) => ({
          inboxItems: s.inboxItems.map((i) =>
            i.id === id ? { ...i, processed: true } : i
          ),
        }));
      },

      deleteInboxItem: (id) =>
        set((s) => ({
          inboxItems: s.inboxItems.filter((i) => i.id !== id),
        })),

      clearProcessedInbox: () =>
        set((s) => ({
          inboxItems: s.inboxItems.filter((i) => !i.processed),
        })),

      // ── Timeline Events ───────────────────────────────────────────────────
      timelineEvents: [],
      addTimelineEvent: (event) =>
        set((s) => ({
          timelineEvents: [...s.timelineEvents, { ...event, id: uid() }],
        })),
      updateTimelineEvent: (id, updates) =>
        set((s) => ({
          timelineEvents: s.timelineEvents.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
      deleteTimelineEvent: (id) =>
        set((s) => ({
          timelineEvents: s.timelineEvents.filter((e) => e.id !== id),
        })),

      // ── Toasts ──────────────────────────────────────────────────────────
      toasts: [],
      addToast: (message, type = "info", duration = 3000) =>
        set((s) => ({
          toasts: [...s.toasts, { id: uid(), message, type, duration, createdAt: Date.now() }],
        })),
      removeToast: (id) =>
        set((s) => ({
          toasts: s.toasts.filter((t) => t.id !== id),
        })),

      // ── Fil d'Ariane ────────────────────────────────────────────────────
      lastActiveAt: Date.now(),
      lastActiveTaskId: null,
      setLastActive: (taskId) =>
        set((s) => ({
          lastActiveAt: Date.now(),
          lastActiveTaskId: taskId ?? s.lastActiveTaskId,
        })),

      // ── Settings ────────────────────────────────────────────────────────
      settings: {
        enableSounds: true,
      },
      updateSettings: (updates) =>
        set((s) => ({
          settings: { ...s.settings, ...updates },
        })),
    }),
    {
      name: "dopatask-storage",
      version: 3,
      migrate: (persisted: unknown, version: number) => {
        // v2 : purge les tâches mock historiques
        const MOCK_TASK_TEXTS = new Set([
          "Finir le rapport Q1",
          "Répondre aux emails urgents",
          "Préparer la réunion de 14h",
          "Faire SEO site web",
          "Montage vidéo client",
          "Copyrighting page d'accueil",
          "Script Reels (benchmark)",
        ]);
        if (version < 2 && persisted && typeof persisted === "object") {
          const p = persisted as { tasks?: Array<{ text?: string }> };
          if (Array.isArray(p.tasks)) {
            p.tasks = p.tasks.filter((t) => !MOCK_TASK_TEXTS.has((t?.text || "").trim()));
          }
        }
        // v3 : migration vers Supabase (noop, handled by supabaseStorage)
        return persisted;
      },
      storage: createJSONStorage(() => supabaseStorage),
    }
  )
);
