import { StateCreator } from "zustand";
import { AppState } from "../useAppStore";
import { Note, JournalEntry } from "./types";
import { uid } from "./utils";

export const createNotesSlice: StateCreator<AppState, [], [], Pick<AppState, "notes" | "addNote" | "updateNote" | "deleteNote" | "togglePinNote" | "toggleArchiveNote" | "reorderNotes" | "journalEntries" | "addJournalEntry" | "updateJournalEntry" | "deleteJournalEntry" | "convertJournalToTask" | "sendJournalToInbox">> = (set, get) => ({
  journalEntries: [],
  addJournalEntry: (content, mood, tags) => set((s) => ({ journalEntries: [{ id: uid(), content: content.trim(), mood, tags: tags ?? [], createdAt: Date.now() }, ...s.journalEntries] })),
  updateJournalEntry: (id, updates) => set((s) => ({ journalEntries: s.journalEntries.map((e) => e.id === id ? { ...e, ...updates } : e) })),
  deleteJournalEntry: (id) => set((s) => ({ journalEntries: s.journalEntries.filter((e) => e.id !== id) })),
  convertJournalToTask: (id) => { const entry = get().journalEntries.find(e => e.id === id); if (entry) get().addTask(entry.content.split("\n")[0].slice(0, 50), "today", undefined, id); },
  sendJournalToInbox: (id) => { const entry = get().journalEntries.find(e => e.id === id); if (entry) get().addInboxItem(entry.content.slice(0, 100), "note"); },

  notes: [],
  addNote: (title, content, color, images, projectId, linkedEventId, linkedProspectId) => {
    const newId = uid();
    set((s) => {
      const maxOrder = s.notes.length > 0 ? Math.max(...s.notes.map(n => n.order || 0)) : -1;
      return { notes: [{ id: newId, title: title.trim(), content: content.trim(), color: color ?? "#7c3aed", pinned: false, archived: false, labels: [], images: images ?? [], order: maxOrder + 1, projectId, linkedEventId, linkedProspectId, createdAt: Date.now(), updatedAt: Date.now() }, ...s.notes] };
    });
    return newId;
  },
  updateNote: (id, updates) => set((s) => ({ notes: s.notes.map((n) => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n) })),
  deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
  togglePinNote: (id) => set((s) => ({ notes: s.notes.map((n) => n.id === id ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n) })),
  toggleArchiveNote: (id) => set((s) => ({ notes: s.notes.map((n) => n.id === id ? { ...n, archived: !n.archived, updatedAt: Date.now() } : n) })),
  reorderNotes: (noteIds) => set((s) => ({
    notes: s.notes.map((n) => {
      const idx = noteIds.indexOf(n.id);
      return idx >= 0 ? { ...n, order: idx } : n;
    })
  })),
});
