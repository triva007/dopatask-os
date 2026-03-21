import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskStatus = "today" | "inbox" | "done" | "todo" | "in_progress" | "completed" | "saved";
export type IncupTag = "Intérêt" | "Nouveauté" | "Challenge" | "Urgence" | "Passion";

export interface MicroStep {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  text: string;
  status: TaskStatus;
  createdAt: number;
  completedAt?: number;
  tags: IncupTag[];
  microSteps: MicroStep[];
  expanded: boolean;
}

export type ObjectiveHorizon = "week" | "month" | "quarter" | "year";

export interface HyperfocusSession {
  id: string;
  taskName: string;
  durationMinutes: number;
  completedAt: number;
  noise: "brown" | "white" | "none";
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
  progress: number; // 0-100
  milestones: Milestone[];
  color: string;
  createdAt: number;
}

interface AppState {
  // ── Onboarding ──────────────────────────────────────────────────────────
  hasSeenTutorial: boolean;
  setHasSeenTutorial: (v: boolean) => void;

  // ── Tâches ──────────────────────────────────────────────────────────────
  tasks: Task[];
  addTask: (text: string, status?: TaskStatus) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  toggleExpand: (id: string) => void;
  addMicroStep: (taskId: string, text: string) => void;
  toggleMicroStep: (taskId: string, stepId: string) => void;
  deleteMicroStep: (taskId: string, stepId: string) => void;
  toggleTag: (taskId: string, tag: IncupTag) => void;
  newStart: () => void;

  // ── Objectifs ───────────────────────────────────────────────────────────
  objectives: Objective[];
  addObjective: (title: string, horizon: ObjectiveHorizon, color?: string) => void;
  updateObjectiveProgress: (id: string, progress: number) => void;
  addMilestone: (objId: string, text: string) => void;
  toggleMilestone: (objId: string, msId: string) => void;
  deleteMilestone: (objId: string, msId: string) => void;
  deleteObjective: (id: string) => void;

  // ── Gamification ────────────────────────────────────────────────────────
  xp: number;
  streak: number;
  bossHp: number;
  lastCritical: boolean;
  addXp: (amount: number) => void;
  damageBoss: (dmg: number) => void;

  // ── Hyperfocus Sessions ──────────────────────────────────────────────────
  hyperfocusSessions: HyperfocusSession[];
  addHyperfocusSession: (session: Omit<HyperfocusSession, "id">) => void;

  // ── Boutique ─────────────────────────────────────────────────────────────
  purchasedRewards: string[];
  buyReward: (rewardId: string, cost: number) => void;

  // ── Fil d'Ariane (Loi n°6) ──────────────────────────────────────────────
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

      addTask: (text, status) => {
        const { tasks } = get();
        const targetStatus = status ?? (tasks.filter((t) => t.status === "today").length < 5 ? "today" : "inbox");
        const newTask: Task = {
          id: uid(), text: text.trim(), status: targetStatus,
          createdAt: Date.now(), tags: [], microSteps: [], expanded: false,
        };
        set({ tasks: [...tasks, newTask] });
        get().setLastActive(newTask.id);
      },

      updateTaskStatus: (id, status) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, status, ...(status === "completed" ? { completedAt: Date.now() } : {}) } : t
          ),
        })),

      completeTask: (id) => {
        const { tasks, bossHp, xp, streak } = get();
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

      newStart: () => {
        const { tasks } = get();
        set({
          tasks: tasks.map((t) => t.status === "today" ? { ...t, status: "inbox" } : t),
          lastActiveTaskId: null,
        });
      },

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
        set((s) => ({ objectives: s.objectives.filter((o) => o.id !== id) })),

      // ── Hyperfocus Sessions ──────────────────────────────────────────────
      hyperfocusSessions: [],
      addHyperfocusSession: (session) =>
        set((s) => ({
          hyperfocusSessions: [{ ...session, id: uid() }, ...s.hyperfocusSessions],
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
      addXp: (amount) => set((s) => ({ xp: s.xp + amount })),
      damageBoss: (dmg) => set((s) => ({ bossHp: Math.max(0, s.bossHp - dmg) })),

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