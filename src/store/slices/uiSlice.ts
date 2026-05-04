import { StateCreator } from "zustand";
import { AppState } from "../useAppStore";
import { Toast, InboxItem, TimelineEvent } from "./types";
import { uid } from "./utils";

export const createUISlice: StateCreator<AppState, [], [], Pick<AppState, "hasSeenTutorial" | "setHasSeenTutorial" | "theme" | "toggleTheme" | "googleEventProjects" | "setGoogleEventProject" | "googleTaskProjects" | "setGoogleTaskProject" | "inboxItems" | "addInboxItem" | "processInboxItem" | "convertInboxToTask" | "deleteInboxItem" | "clearProcessedInbox" | "timelineEvents" | "addTimelineEvent" | "updateTimelineEvent" | "deleteTimelineEvent" | "xp" | "bossHp" | "streak" | "bossLevel" | "lastCritical" | "lastStreakDate" | "purchasedRewards" | "totalFocusMinutes" | "hyperfocusSessions" | "totalTasksCompleted" | "unlockedAchievements" | "dailyChallengeId" | "dailyChallengeCompleted" | "addXp" | "attackBoss" | "toasts" | "addToast" | "removeToast" | "settings" | "updateSettings">> = (set, get) => ({
  hasSeenTutorial: false,
  setHasSeenTutorial: (v) => set({ hasSeenTutorial: v }),
  theme: "dark",
  toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),

  googleEventProjects: {},
  setGoogleEventProject: (eventId, projectId) => set((s) => {
    const newMap = { ...s.googleEventProjects };
    if (projectId) newMap[eventId] = projectId;
    else delete newMap[eventId];
    return { googleEventProjects: newMap };
  }),

  googleTaskProjects: {},
  setGoogleTaskProject: (taskId, projectId) => set((s) => {
    const newMap = { ...s.googleTaskProjects };
    if (projectId) newMap[taskId] = projectId;
    else delete newMap[taskId];
    return { googleTaskProjects: newMap };
  }),

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

  settings: { enableSounds: true },
  updateSettings: (updates) => set((s) => ({ settings: { ...s.settings, ...updates } })),
});
