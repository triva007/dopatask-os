import { StateCreator } from "zustand";
import { AppState } from "../useAppStore";
import { ProjectTemplate } from "./types";
import { uid } from "./utils";

export const createTemplatesSlice: StateCreator<
  AppState,
  [],
  [],
  Pick<AppState, "templates" | "saveProjectAsTemplate" | "applyTemplateToProject" | "deleteTemplate">
> = (set, get) => ({
  templates: [],

  saveProjectAsTemplate: (projectId, templateName) => {
    const { tasks, projects } = get();
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    const projectTasks = tasks.filter((t) => t.projectId === projectId);
    const templateTasks = projectTasks.map((t) => ({
      text: t.text,
      tags: t.tags || [],
      microSteps: (t.microSteps || []).map((ms) => ({ text: ms.text })),
    }));

    const newTemplate: ProjectTemplate = {
      id: uid(),
      name: templateName.trim(),
      tasks: templateTasks,
    };

    set((s) => ({ templates: [...s.templates, newTemplate] }));
  },

  applyTemplateToProject: (templateId, projectId) => {
    const { templates, addTask, updateTask } = get();
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    template.tasks.forEach((taskTpl) => {
      const newTaskId = addTask(taskTpl.text, "today", projectId);
      if (newTaskId) {
        updateTask(newTaskId, {
          tags: taskTpl.tags,
          microSteps: taskTpl.microSteps.map(ms => ({ id: uid(), text: ms.text, done: false }))
        });
      }
    });
  },

  deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),
});
