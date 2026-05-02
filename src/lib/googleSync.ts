import { useAppStore, type Task, type TimelineEvent } from "@/store/useAppStore";

// ─── Types renvoyés par les routes API ──────────────────────────────────────

interface ApiGoogleTask {
  id: string;
  title?: string;
  notes?: string;
  status?: "needsAction" | "completed";
  due?: string;
  completed?: string;
  updated?: string;
  listId: string;
  listTitle: string;
}

interface ApiGoogleEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?:   { dateTime?: string; date?: string };
  status?: string;
  updated?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36);

function isoDateOnly(iso?: string) {
  if (!iso) return undefined;
  return iso.slice(0, 10);
}

// ─── Sync Tasks ──────────────────────────────────────────────────────────────
// Pull : importe les Google Tasks dans le store local
// Push : envoie les tâches locales (sans googleTaskId) vers Google
// Update : met à jour côté Google les tâches locales modifiées
// ─────────────────────────────────────────────────────────────────────────────

export async function syncTasks(): Promise<{ pulled: number; pushed: number; updated: number; deleted: number }> {
  const store = useAppStore.getState();
  let pulled = 0, pushed = 0, updated = 0, deleted = 0;

  // 1) PULL : récupérer toutes les Google Tasks
  const res = await fetch("/api/google/tasks", { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 401) throw new Error("UNAUTHENTICATED");
    throw new Error("Échec récupération Google Tasks");
  }
  const data = (await res.json()) as { tasks: ApiGoogleTask[]; lists: { id: string; title?: string }[] };
  const googleTasks = data.tasks || [];
  const defaultListId = data.lists?.[0]?.id;
  const crmList = data.lists?.find(l => l.title?.trim().toUpperCase() === "CRM");
  const crmListId = crmList?.id;

  // Pour chaque Google Task : si elle existe en local (par googleTaskId), update si plus récente. Sinon, importe.
  const currentTasks = useAppStore.getState().tasks;
  const localByGoogleId = new Map<string, Task>();
  for (const t of currentTasks) {
    if (t.googleTaskId) localByGoogleId.set(t.googleTaskId, t);
  }

  for (const gt of googleTasks) {
    const existing = localByGoogleId.get(gt.id);
    if (existing) {
      // Update si Google a une version plus récente
      const gUpdated = gt.updated ? new Date(gt.updated).getTime() : 0;
      const lUpdated = existing.googleUpdated ? new Date(existing.googleUpdated).getTime() : 0;
      if (gUpdated > lUpdated) {
        useAppStore.setState((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === existing.id
              ? {
                  ...t,
                  text: gt.title || t.text,
                  description: gt.notes || t.description,
                  dueDate: isoDateOnly(gt.due) || t.dueDate,
                  status: gt.status === "completed" ? "done" : (t.status === "done" ? "today" : t.status),
                  completedAt: gt.completed ? new Date(gt.completed).getTime() : t.completedAt,
                  googleUpdated: gt.updated,
                }
              : t
          ),
        }));
        updated++;
      }
    } else {
      // Import : nouvelle tâche
      const newTask: Task = {
        id: uid(),
        text: gt.title || "(sans titre)",
        description: gt.notes,
        status: gt.status === "completed" ? "done" : "today",
        createdAt: Date.now(),
        completedAt: gt.completed ? new Date(gt.completed).getTime() : undefined,
        tags: [],
        microSteps: [],
        expanded: false,
        dueDate: isoDateOnly(gt.due),
        googleTaskId: gt.id,
        googleTaskListId: gt.listId,
        googleUpdated: gt.updated,
      };
      useAppStore.setState((s) => ({ tasks: [...s.tasks, newTask] }));
      pulled++;
    }
  }

  // 1.1) DELETE LOCALLY : si une tâche locale a un googleTaskId mais n'est plus chez Google, on la supprime
  const googleTaskIds = new Set(googleTasks.map(gt => gt.id));
  for (const t of currentTasks) {
    if (t.googleTaskId && !googleTaskIds.has(t.googleTaskId)) {
      useAppStore.setState((s) => ({
        tasks: s.tasks.filter(tt => tt.id !== t.id)
      }));
      deleted++;
    }
  }

  // 2) PUSH : pour chaque tâche locale sans googleTaskId, créer côté Google
  const tasksAfterPull = useAppStore.getState().tasks;
  for (const t of tasksAfterPull) {
    if (t.googleTaskId) continue;
    // Skip les tâches "done" anciennes (>30j) pour pas polluer
    if (t.status === "done" && t.completedAt && Date.now() - t.completedAt > 1000 * 60 * 60 * 24 * 30) {
      continue;
    }

    // Choisir la liste : CRM si linkedProspectId présent et liste CRM trouvée, sinon défaut
    const targetListId = (t.linkedProspectId && crmListId) ? crmListId : defaultListId;
    if (!targetListId) continue;

    const payload: Record<string, unknown> = {
      listId: targetListId,
      title: t.text,
    };
    if (t.description) payload.notes = t.description;
    if (t.dueDate) payload.due = `${t.dueDate}T00:00:00.000Z`;
    if (t.status === "done") payload.status = "completed";

    const r = await fetch("/api/google/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok) {
      const { task: created, listId } = (await r.json()) as {
        task: { id: string; updated?: string };
        listId: string;
      };
      useAppStore.setState((s) => ({
        tasks: s.tasks.map((tt) =>
          tt.id === t.id
            ? {
                ...tt,
                googleTaskId: created.id,
                googleTaskListId: listId,
                googleUpdated: created.updated,
              }
            : tt
        ),
      }));
      pushed++;
    }
  }

  // 3) Push update : tâches locales avec googleTaskId modifiées localement plus récemment
  // (heuristique simple : si status diffère ou completedAt récent et pas encore reflété)
  // On va juste forcer un update pour les "done" qui ne le sont pas côté Google
  // (la version simple de la sync : on push à chaque sync les tâches done)
  const finalTasks = useAppStore.getState().tasks;
  for (const t of finalTasks) {
    if (!t.googleTaskId || !t.googleTaskListId) continue;
    const matching = googleTasks.find((g) => g.id === t.googleTaskId);
    if (!matching) continue;
    const localDone  = t.status === "done";
    const remoteDone = matching.status === "completed";
    const titleDiff  = (matching.title || "") !== t.text;
    const notesDiff  = (matching.notes || "") !== (t.description || "");
    const dueLocal   = t.dueDate || "";
    const dueRemote  = isoDateOnly(matching.due) || "";
    const dueDiff    = dueLocal !== dueRemote;
    if (localDone === remoteDone && !titleDiff && !notesDiff && !dueDiff) continue;

    const updates: Record<string, unknown> = {
      title: t.text,
      notes: t.description || "",
      status: localDone ? "completed" : "needsAction",
    };
    if (t.dueDate) updates.due = `${t.dueDate}T00:00:00.000Z`;

    const r = await fetch("/api/google/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listId: t.googleTaskListId, taskId: t.googleTaskId, updates }),
    });
    if (r.ok) {
      const { task } = (await r.json()) as { task: { updated?: string } };
      useAppStore.setState((s) => ({
        tasks: s.tasks.map((tt) =>
          tt.id === t.id ? { ...tt, googleUpdated: task.updated } : tt
        ),
      }));
      updated++;
    }
  }

  return { pulled, pushed, updated, deleted };
}

// ─── Sync Calendar ───────────────────────────────────────────────────────────

export async function syncCalendar(): Promise<{ pulled: number; pushed: number }> {
  let pulled = 0, pushed = 0;

  // 0) Récupérer les calendriers pour savoir lesquels synchroniser
  const calRes = await fetch("/api/google/calendar/calendars", { cache: "no-store" });
  if (!calRes.ok) throw new Error("Échec récupération calendriers");
  const { calendars } = (await calRes.json()) as { calendars: { id: string; summary: string }[] };
  const calendarIds = calendars.map(c => c.id);

  if (calendarIds.length === 0) return { pulled: 0, pushed: 0 };

  const res = await fetch(`/api/google/calendar/events?calendarIds=${encodeURIComponent(calendarIds.join(","))}`, { cache: "no-store" });
  if (!res.ok) {
    if (res.status === 401) throw new Error("UNAUTHENTICATED");
    throw new Error("Échec récupération Google Calendar");
  }
  const data = (await res.json()) as { events: ApiGoogleEvent[] };
  const events = data.events || [];

  const currentEvents = useAppStore.getState().timelineEvents;
  const localByGoogleId = new Map<string, TimelineEvent>();
  for (const e of currentEvents) {
    if (e.googleEventId) localByGoogleId.set(e.googleEventId, e);
  }

  // Pull : importer les events Google
  for (const ge of events) {
    const startDateTime = ge.start?.dateTime || (ge.start?.date ? `${ge.start.date}T00:00:00` : null);
    if (!startDateTime) continue;
    const endDateTime = ge.end?.dateTime || (ge.end?.date ? `${ge.end.date}T23:59:59` : startDateTime);

    const start = new Date(startDateTime);
    const end   = new Date(endDateTime);
    const hour  = start.getHours() + start.getMinutes() / 60;
    const durMs = end.getTime() - start.getTime();
    const duration = Math.max(0.25, Math.round((durMs / (1000 * 60 * 60)) * 4) / 4); // arrondi 15 min

    const day = start.toISOString().slice(0, 10);

    const existing = localByGoogleId.get(ge.id);
    if (existing) {
      const gUpdated = ge.updated ? new Date(ge.updated).getTime() : 0;
      const lUpdated = existing.googleUpdated ? new Date(existing.googleUpdated).getTime() : 0;
      if (gUpdated > lUpdated) {
        useAppStore.setState((s) => ({
          timelineEvents: s.timelineEvents.map((e) =>
            e.id === existing.id
              ? { ...e, label: ge.summary || e.label, hour, duration, day, googleUpdated: ge.updated }
              : e
          ),
        }));
      }
    } else {
      const newEvent: TimelineEvent = {
        id: uid(),
        hour,
        duration,
        label: ge.summary || "(sans titre)",
        color: "blue",
        day,
        googleEventId: ge.id,
        googleCalendarId: "primary",
        googleUpdated: ge.updated,
      };
      useAppStore.setState((s) => ({
        timelineEvents: [...s.timelineEvents, newEvent],
      }));
      pulled++;
    }
  }

  // 1.1) DELETE LOCALLY : si un event local a un googleEventId mais n'est plus chez Google, on le supprime
  const googleEventIds = new Set(events.map(ge => ge.id));
  for (const e of currentEvents) {
    if (e.googleEventId && !googleEventIds.has(e.googleEventId)) {
      useAppStore.setState((s) => ({
        timelineEvents: s.timelineEvents.filter(ee => ee.id !== e.id)
      }));
      // deleted++; (can add deleted count if needed)
    }
  }

  // 2) PUSH : envoyer les events locaux sans googleEventId vers Google
  const eventsAfterPull = useAppStore.getState().timelineEvents;
  for (const e of eventsAfterPull) {
    if (e.googleEventId) continue;
    // Construire les dates
    const day = e.day || new Date().toISOString().slice(0, 10);
    const startHour = Math.floor(e.hour);
    const startMin  = Math.round((e.hour - startHour) * 60);
    const start = new Date(`${day}T${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}:00`);
    const end   = new Date(start.getTime() + e.duration * 60 * 60 * 1000);

    const r = await fetch("/api/google/calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: e.label,
        start: { dateTime: start.toISOString() },
        end:   { dateTime: end.toISOString() },
      }),
    });
    if (r.ok) {
      const { event } = (await r.json()) as { event: { id: string; updated?: string } };
      useAppStore.setState((s) => ({
        timelineEvents: s.timelineEvents.map((ev) =>
          ev.id === e.id
            ? { ...ev, googleEventId: event.id, googleCalendarId: "primary", googleUpdated: event.updated }
            : ev
        ),
      }));
      pushed++;
    }
  }

  return { pulled, pushed };
}

// ─── Sync globale ────────────────────────────────────────────────────────────

export async function syncAll() {
  const tasksResult = await syncTasks();
  const calResult   = await syncCalendar();
  return { tasks: tasksResult, calendar: calResult };
}

// ─── Helpers CRUD API ────────────────────────────────────────────────────────

export async function deleteTaskFromGoogle(listId: string, taskId: string) {
  const r = await fetch(`/api/google/tasks?listId=${encodeURIComponent(listId)}&taskId=${encodeURIComponent(taskId)}`, {
    method: "DELETE",
  });
  return r.ok;
}

export async function deleteEventFromGoogle(calendarId: string, eventId: string) {
  const r = await fetch(`/api/google/calendar/events?calendarId=${encodeURIComponent(calendarId)}&eventId=${encodeURIComponent(eventId)}`, {
    method: "DELETE",
  });
  return r.ok;
}
