import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import { supabaseStorage } from "@/lib/supabaseStorage";

export * from "./slices/types";
import {
  TaskStatus, IncupTag, ObjectiveHorizon, ProjectStatus, LifeGoalHorizon, InboxItemType, RecurrenceType,
  MicroStep, Task, Project, Milestone, Objective, LifeGoal, JournalEntry, Note, InboxItem, TimelineEvent, Toast, ProjectTemplate
} from "./slices/types";
import { createTasksSlice } from "./slices/tasksSlice";
import { createProjectsSlice } from "./slices/projectsSlice";
import { createNotesSlice } from "./slices/notesSlice";
import { createUISlice } from "./slices/uiSlice";
import { createTemplatesSlice } from "./slices/templatesSlice";

interface AppState {
  hasSeenTutorial: boolean;
  setHasSeenTutorial: (v: boolean) => void;
  tasks: Task[];
  addTask: (text: string, status?: TaskStatus, projectId?: string, linkedJournalId?: string, linkedNoteId?: string, linkedProspectId?: string) => string;
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
  addProject: (name: string, emoji?: string, objectiveId?: string, color?: string) => string;
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
  addNote: (title: string, content: string, color?: string, images?: string[], projectId?: string, linkedEventId?: string, linkedProspectId?: string) => string;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  toggleArchiveNote: (id: string) => void;
  reorderNotes: (noteIds: string[]) => void;
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
  googleNotes?: any[];
  sprints?: any[];
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
  googleEventProjects: Record<string, string>;
  setGoogleEventProject: (eventId: string, projectId: string | null) => void;
  googleTaskProjects: Record<string, string>;
  setGoogleTaskProject: (taskId: string, projectId: string | null) => void;
  templates: ProjectTemplate[];
  saveProjectAsTemplate: (projectId: string, templateName: string) => void;
  applyTemplateToProject: (templateId: string, projectId: string) => void;
  deleteTemplate: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

export const useAppStore = create<AppState>()(
  persist(
    temporal(
      (set, get, api) => ({
        ...createTasksSlice(set, get, api),
        ...createProjectsSlice(set, get, api),
        ...createNotesSlice(set, get, api),
        ...createUISlice(set, get, api),
        ...createTemplatesSlice(set, get, api),
      }),
    ),
    {
      name: "dopatask-storage",
      version: 9, // Normalize done -> completed and guard empty tasks
      migrate: (persistedState: any, version: number) => {
        if (!persistedState.state) persistedState.state = {};
        if (!persistedState.state.googleEventProjects) persistedState.state.googleEventProjects = {};
        if (!persistedState.state.googleTaskProjects) persistedState.state.googleTaskProjects = {};
        
        if (version < 9 && persistedState.state.tasks) {
          persistedState.state.tasks = persistedState.state.tasks.map((task: Task) =>
            task.status === "done" ? { ...task, status: "completed" } : task
          );
        }
        return persistedState;
      },
      storage: createJSONStorage(() => supabaseStorage),
    }
  )
);
