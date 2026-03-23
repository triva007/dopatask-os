import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskStatus = "today" | "inbox" | "done" | "todo" | "in_progress" | "completed" | "saved";
export type IncupTag = "Intérêt" | "Nouveauté" | "Challenge" | "Urgence" | "Passion";
export type ObjectiveHorizon = "week" | "month" | "quarter" | "year";
export type ProjectStatus = "active" | "paused" | "completed" | "archived";
export type LifeGoalHorizon = "court_terme" | "moyen_terme" | "long_terme";
export type InboxItemType = "task" | "note" | "event";

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
  createdAt: number;
  completedAt?: number;
  tags: IncupTag[];
  microSteps: MicroStep[];
  expanded: boolean;
  estimatedMinutes?: number;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
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

export interface HyperfocusSession {
  id: string;
  taskName: string;
  durationMinutes: number;
  completedAt: number;
  noise: "brown" | "white" | "none";
}

interface AppState {
  // ── Onboarding ──────────────────────────────────────────────────────────
  hasSeenTutorial: boolean;
  setHasSeenTutorial: (v: boolean) => void;

  // ── Tâches ──────────────────────────────────────────────────────────────
  tasks: Task[];
  addTask: (text: string, status?: TaskStatus, projectId?: string) => void;
  updateTask: (id: string, updates: Partial<Pick<Task, "text" | "description" | "status" | "projectId" | "tags" | "estimatedMinutes" | "dueDate" | "priority">>) => void;
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

  // ── Inbox (Quick Capture) ─────────────────────────────────────────────
  inboxItems: InboxItem[];
  addInboxItem: (text: string, type?: InboxItemType) => void;
  processInboxItem: (id: string) => void;
  convertInboxToTask: (id: string) => void;
  deleteInboxItem: (id: string) => void;

  // ── Gamification ────────────────────────────────────────────────────────
  xp: number;
  streak: number;
  bossHp: number;
  lastCritical: boolean;
  totalTasksCompleted: number;
  totalFocusMinutes: number;
  unlockedAchievements: string[];
  dailyChallengeId: string | null;
  dailyChallengeCompleted: boolean;
  addXp: (amount: number) => void;
  damageBoss: (dmg: number) => void;
  unlockAchievement: (id: string) => void;
  completeDailyChallenge: () => void;
  setDailyChallenge: (id: string) => void;

  // ── Hyperfocus Sessions ─────────────────────────────────────────────────
  hyperfocusSessions: HyperfocusSession[];
  addHyperfocusSession: (session: Omit<HyperfocusSession, "id">) => void;

  // ── Boutique ────────────────────────────────────────────────────────────
  purchasedRewards: string[];
  buyReward: (rewardId: string, cost: number) => void;

  // ── Fil d'Ariane ────────────────────────────────────────────────────────
  lastActiveAt: number;
  lastActiveTaskId: string | null;
  setLastActive: (taskId?: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

const BOSS_DMG_NORMAL   = 8;
const BOSS_DMG_CRITICAL = 22;
const XP_NORMAL         = 25;
const XP_CRITICAL       = 80;
const CRITICAL_RATE     = 0.15;

const OBJ_COLORS = ["#06b6d4", "#7c3aed", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];
const PROJECT_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
const PROJECT_EMOJIS = ["📁", "🚀", "💡", "🎯", "⚡", "🔥"];
const GOAL_COLORS = ["#7c3aed", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#3b82f6", "#10b981"];

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Onboarding ──────────────────────────────────────────────────────
      hasSeenTutorial: false,
      setHasSeenTutorial: (v) => set({ hasSeenTutorial: v }),

      // ── Tâches ──────────────────────────────────────────────────────────
      tasks: [
        {
          id: uid(), text: "Finir le rapport Q1", status: "today",
          createdAt: Date.now() - 3600000, tags: ["Urgence"], microSteps: [], expanded: false,
        },
        {
          id: uid(), text: "Répondre aux emails urgents", status: "today",
          createdAt: Date.now() - 7200000, tags: ["Urgence", "Challenge"], microSteps: [
            { id: uid(), text: "Trier les emails non-lus", done: false },
            { id: uid(), text: "Répondre aux clients prioritaires", done: false },
          ], expanded: false,
        },
        {
          id: uid(), text: "Préparer la réunion de 14h", status: "today",
          createdAt: Date.now() - 900000, tags: ["Passion"], microSteps: [], expanded: false,
        },
        {
          id: uid(), text: "Faire SEO site web", status: "todo",
          createdAt: Date.now() - 86400000, tags: ["Challenge", "Urgence"], microSteps: [], expanded: false,
        },
        {
          id: uid(), text: "Montage vidéo client", status: "in_progress",
          createdAt: Date.now() - 43200000, tags: ["Passion"], microSteps: [], expanded: false,
        },
        {
          id: uid(), text: "Copyrighting page d'accueil", status: "completed",
          createdAt: Date.now() - 172800000, completedAt: Date.now() - 3600000, tags: ["Nouveauté"], microSteps: [], expanded: false,
        },
        {
          id: uid(), text: "Script Reels (benchmark)", status: "saved",
          createdAt: Date.now() - 259200000, tags: ["Intérêt"], microSteps: [], expanded: false,
        },
      ],

      addTask: (text, status, projectId) => {
        const { tasks } = get();
        const targetStatus = status ?? "inbox";
        const newTask: Task = {
          id: uid(), text: text.trim(), status: targetStatus, projectId,
          createdAt: Date.now(), tags: [], microSteps: [], expanded: false,
        };
        set({ tasks: [...tasks, newTask] });
        get().setLastActive(newTask.id);
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
        const { tasks, bossHp, xp, streak, totalTasksCompleted } = get();
        const isCritical = Math.random() < CRITICAL_RATE;
        const dmg  = isCritical ? BOSS_DMG_CRITICAL : BOSS_DMG_NORMAL;
        const gain = isCritical ? XP_CRITICAL       : XP_NORMAL;
        const newHp = Math.max(0, bossHp - dmg);
        set({
          tasks: tasks.map((t) =>
            t.id === id ? { ...t, status: "done", completedAt: Date.now() } : t
          ),
          bossHp: newHp,
          xp: xp + gain,
          streak: streak + 1,
          lastCritical: isCritical,
          lastActiveAt: Date.now(),
          totalTasksCompleted: totalTasksCompleted + 1,
        });
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
      },

      // ── Projets ─────────────────────────────────────────────────────────
      projects: [
        {
          id: "proj_agence", name: "Site Agence Web", objectiveId: undefined,
          status: "active", emoji: "🚀", color: "#3b82f6", createdAt: Date.now() - 604800000,
        },
        {
          id: "proj_seo", name: "Campagne SEO Q1", objectiveId: undefined,
          status: "active", emoji: "📈", color: "#10b981", createdAt: Date.now() - 432000000,
        },
        {
          id: "proj_content", name: "Contenu Réseaux", objectiveId: undefined,
          status: "active", emoji: "🎬", color: "#8b5cf6", createdAt: Date.now() - 259200000,
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
      objectives: [
        {
          id: uid(), title: "Lancer l'agence web", horizon: "quarter", progress: 35,
          color: "#7c3aed", createdAt: Date.now() - 2592000000,
          milestones: [
            { id: uid(), text: "Créer le site vitrine", done: true },
            { id: uid(), text: "5 premiers clients", done: false },
            { id: uid(), text: "Process de vente rodé", done: false },
          ],
        },
        {
          id: uid(), title: "Maîtriser le SEO", horizon: "month", progress: 60,
          color: "#06b6d4", createdAt: Date.now() - 604800000,
          milestones: [
            { id: uid(), text: "Suivre la formation Rank Math", done: true },
            { id: uid(), text: "Optimiser 3 pages client", done: true },
            { id: uid(), text: "Obtenir 1er résultat page 1", done: false },
          ],
        },
        {
          id: uid(), title: "Routine matinale stable", horizon: "week", progress: 70,
          color: "#22c55e", createdAt: Date.now() - 172800000,
          milestones: [
            { id: uid(), text: "Se lever à 7h 5j/7", done: true },
            { id: uid(), text: "20 min exercice", done: false },
          ],
        },
        {
          id: uid(), title: "100 clients agence", horizon: "year", progress: 5,
          color: "#f59e0b", createdAt: Date.now() - 5184000000,
          milestones: [
            { id: uid(), text: "10 clients", done: false },
            { id: uid(), text: "Recruter un freelance", done: false },
            { id: uid(), text: "50 clients", done: false },
            { id: uid(), text: "100 clients", done: false },
          ],
        },
      ],

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

      convertInboxToTask: (id) => {
        const { inboxItems } = get();
        const item = inboxItems.find((i) => i.id === id);
        if (!item) return;
        get().addTask(item.text);
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

      // ── Hyperfocus Sessions ──────────────────────────────────────────────
      hyperfocusSessions: [],
      addHyperfocusSession: (session) =>
        set((s) => ({
          hyperfocusSessions: [{ ...session, id: uid() }, ...s.hyperfocusSessions],
          totalFocusMinutes: s.totalFocusMinutes + session.durationMinutes,
        })),

      // ── Boutique ─────────────────────────────────────────────────────────
      purchasedRewards: [],
      buyReward: (rewardId, cost) =>
        set((s) => {
          if (s.xp < cost) return s;
          return { xp: s.xp - cost, purchasedRewards: [...s.purchasedRewards, rewardId + "_" + Date.now()] };
        }),

      // ── Gamification ────────────────────────────────────────────────────
      xp: 0,
      streak: 0,
      bossHp: 100,
      lastCritical: false,
      totalTasksCompleted: 0,
      totalFocusMinutes: 0,
      unlockedAchievements: [],
      dailyChallengeId: null,
      dailyChallengeCompleted: false,
      addXp: (amount) => set((s) => ({ xp: s.xp + amount })),
      damageBoss: (dmg) => set((s) => ({ bossHp: Math.max(0, s.bossHp - dmg) })),
      unlockAchievement: (id) =>
        set((s) => ({
          unlockedAchievements: s.unlockedAchievements.includes(id)
            ? s.unlockedAchievements
            : [...s.unlockedAchievements, id],
        })),
      completeDailyChallenge: () =>
        set((s) => ({
          dailyChallengeCompleted: true,
          xp: s.xp + 150,
        })),
      setDailyChallenge: (id) =>
        set({ dailyChallengeId: id, dailyChallengeCompleted: false }),

      // ── Fil d'Ariane ────────────────────────────────────────────────────
      lastActiveAt: Date.now(),
      lastActiveTaskId: null,
      setLastActive: (taskId) =>
        set((s) => ({
          lastActiveAt: Date.now(),
          lastActiveTaskId: taskId ?? s.lastActiveTaskId,
        })),
    }),
    {
      name: "dopatask-storage",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        }
        return localStorage;
      }),
    }
  )
);