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
  linkedProspectId?: string;
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
  images: string[];
  order: number;
  projectId?: string;
  linkedEventId?: string;
  linkedProspectId?: string;
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
  linkedProspectId?: string;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
  createdAt: number;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  tasks: { text: string; tags: IncupTag[]; microSteps: { text: string }[] }[];
}
