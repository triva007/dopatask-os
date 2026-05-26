"use client";

import { useState, useEffect } from "react";
import { X, MapPin, FileText, Clock, Palette, StickyNote, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import type { CalendarEvent, CalendarInfo } from "./useCalendarEvents";

interface EventDrawerProps {
  event?: CalendarEvent | null;
  defaultDate?: Date;
  defaultEndDate?: Date;
  calendars: CalendarInfo[];
  taskLists?: { id: string; title: string }[];
  onSave: (data: {
    type: "event" | "task";
    calendarId?: string;
    taskListId?: string;
    summary: string;
    description: string;
    start: { dateTime?: string; date?: string; timeZone?: string };
    end: { dateTime?: string; date?: string; timeZone?: string };
    colorId?: string;
    projectId?: string;
  }) => void;
  onDelete?: (ev: CalendarEvent) => void;
  onClose: () => void;
}

const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris";

function toLocalISOString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const COLOR_OPTIONS = [
  { id: "", label: "Calendrier", hex: "" },
  { id: "1", label: "Lavande", hex: "#7986CB" },
  { id: "2", label: "Sauge", hex: "#33B679" },
  { id: "3", label: "Raisin", hex: "#8E24AA" },
  { id: "4", label: "Flamant", hex: "#E67C73" },
  { id: "5", label: "Banane", hex: "#F6BF26" },
  { id: "6", label: "Mandarine", hex: "#F4511E" },
  { id: "7", label: "Paon", hex: "#039BE5" },
  { id: "9", label: "Myrtille", hex: "#3F51B5" },
  { id: "10", label: "Basilic", hex: "#0B8043" },
  { id: "11", label: "Tomate", hex: "#D50000" },
];

export default function EventDrawer({ event, defaultDate, defaultEndDate, calendars, taskLists = [], onSave, onDelete, onClose }: EventDrawerProps) {
  const router = useRouter();
  const isEdit = !!event;
  const now = defaultDate || new Date();
  const defaultEnd = defaultEndDate || new Date(now.getTime() + 60 * 60 * 1000);

  const [mode, setMode] = useState<"event" | "task">(event?.type === "task" ? "task" : "event");

  // Liaison de notes
  const notes = useAppStore((s) => s.notes);
  const addNote = useAppStore((s) => s.addNote);
  const linkedNote = isEdit && event?.id ? notes.find((n) => n.linkedEventId === event.id) : undefined;

  const handleCreateNote = () => {
    if (!event?.id) return;
    const noteId = addNote(
      `Note: ${event.summary}`,
      `Notes pour l'événement du ${new Date(event.start?.dateTime || event.start?.date || "").toLocaleDateString()}`,
      undefined,
      [],
      projectId || undefined,
      event.id
    );
    onClose();
    router.push(`/notes?id=${noteId}`);
  };

  const existingAllDay = event?.start?.date && !event?.start?.dateTime;

  const [summary, setSummary] = useState(event?.summary || "");
  const [description, setDescription] = useState(event?.description || "");
  const [allDay, setAllDay] = useState(!!existingAllDay);
  const [startStr, setStartStr] = useState(
    event?.start?.dateTime
      ? toLocalISOString(new Date(event.start.dateTime))
      : event?.start?.date
        ? toDateString(new Date(event.start.date + "T00:00:00"))
        : toLocalISOString(now)
  );
  const [endStr, setEndStr] = useState(
    event?.end?.dateTime
      ? toLocalISOString(new Date(event.end.dateTime))
      : event?.end?.date
        ? toDateString(new Date(event.end.date + "T00:00:00"))
        : toLocalISOString(defaultEnd)
  );
  const [calendarId, setCalendarId] = useState(event?.calendarId || calendars.find((c) => c.primary)?.id || calendars[0]?.id || "primary");
  const [taskListId, setTaskListId] = useState(event?.taskInfo?.listId || event?.taskInfo?.taskListId || taskLists[0]?.id || "");
  const [colorId, setColorId] = useState(event?.colorId || "");
  const [projectId, setProjectId] = useState<string>("");
  const [showColors, setShowColors] = useState(false);

  useEffect(() => {
    if (event) {
      if (event.type === "task") {
        setProjectId((useAppStore.getState().googleTaskProjects || {})[event.id] || "");
      } else {
        setProjectId((useAppStore.getState().googleEventProjects || {})[event.id] || "");
      }
    }
  }, [event]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSave();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [summary, description, startStr, endStr, calendarId, colorId, allDay]);

  const handleSave = () => {
    if (!summary.trim()) return;

    if (mode === "task") {
      const d = startStr.slice(0, 10) + "T00:00:00.000Z";
      onSave({
        type: "task",
        taskListId,
        summary: summary.trim(),
        description,
        start: { date: d },
        end: { date: d },
        projectId: projectId || undefined,
      });
      return;
    }

    if (allDay) {
      const startDate = startStr.slice(0, 10);
      let endDate = endStr.slice(0, 10);
      if (endDate <= startDate) {
        const d = new Date(startDate + "T00:00:00");
        d.setDate(d.getDate() + 1);
        endDate = toDateString(d);
      }
      onSave({
        type: "event",
        calendarId,
        summary: summary.trim(),
        description,
        start: { date: startDate, dateTime: null as any, timeZone: null as any },
        end: { date: endDate, dateTime: null as any, timeZone: null as any },
        colorId: colorId || undefined,
        projectId: projectId || undefined,
      });
    } else {
      onSave({
        type: "event",
        calendarId,
        summary: summary.trim(),
        description,
        start: { dateTime: new Date(startStr).toISOString(), timeZone: TZ, date: null as any },
        end: { dateTime: new Date(endStr).toISOString(), timeZone: TZ, date: null as any },
        colorId: colorId || undefined,
        projectId: projectId || undefined,
      });
    }
  };

  const selectedColor = COLOR_OPTIONS.find((c) => c.id === colorId);
  const calColor = calendars.find((c) => c.id === calendarId)?.backgroundColor || "#4285f4";

  return (
    <>
      <div 
        className="fixed inset-0 z-[60] sm:hidden" 
        onClick={onClose} 
        style={{ background: "rgba(0,0,0,0.4)" }} 
      />
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="fixed top-0 bottom-0 right-0 z-[70] w-full sm:w-[380px] bg-[var(--surface-0)] flex flex-col shadow-2xl border-l"
        style={{ borderColor: "var(--border-primary)" }}
      >
        {/* Header (Top Nav) */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-[var(--surface-2)] p-1 rounded-lg">
            {!isEdit && (
              <>
                <button
                  className={`px-3 py-1 text-[12px] font-medium rounded-md transition-all ${mode === "event" ? "bg-[var(--surface-0)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                  onClick={() => setMode("event")}
                >
                  Événement
                </button>
                <button
                  className={`px-3 py-1 text-[12px] font-medium rounded-md transition-all ${mode === "task" ? "bg-[var(--surface-0)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                  onClick={() => setMode("task")}
                >
                  Tâche
                </button>
              </>
            )}
            {isEdit && (
              <span className="px-3 py-1 text-[12px] font-medium text-[var(--text-primary)]">
                Modifier {mode === "event" ? "l'événement" : "la tâche"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isEdit && onDelete && event && (
              <button 
                onClick={() => {
                  if (confirm("Supprimer cet élément ?")) {
                    onDelete(event);
                    onClose();
                  }
                }} 
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-500 transition-all"
                title="Supprimer"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-3)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-6 custom-scrollbar">
          
          {/* Title Input (Seamless) */}
          <div className="relative">
            <input
              autoFocus
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={mode === "event" ? "Titre de l'événement" : "Titre de la tâche"}
              className="w-full text-[24px] font-bold bg-transparent focus:outline-none text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] placeholder:font-medium leading-tight"
            />
            {/* Very faint underline on focus to ground the input */}
            <div className="absolute -bottom-2 left-0 right-0 h-[1px] bg-gradient-to-r from-[var(--accent-blue)]/50 to-transparent opacity-0 transition-opacity focus-within:opacity-100 pointer-events-none" />
          </div>

          {/* Time & Date Block */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3">
              <Clock size={16} className="text-[var(--text-tertiary)] mt-1.5 shrink-0" />
              <div className="flex-1 space-y-3">
                {mode === "event" ? (
                  <>
                    <div className="flex items-center gap-2 text-[14px]">
                      <input
                        type={allDay ? "date" : "datetime-local"}
                        value={allDay ? startStr.slice(0, 10) : startStr}
                        onChange={(e) => setStartStr(e.target.value)}
                        className="flex-1 bg-transparent border-b hover:bg-[var(--surface-2)] focus:bg-[var(--surface-1)] border-[var(--border-primary)] focus:border-[var(--accent-blue)] px-2 py-1.5 transition-all text-[var(--text-primary)] font-medium outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[14px]">
                      <span className="text-[var(--text-ghost)] pl-2">→</span>
                      <input
                        type={allDay ? "date" : "datetime-local"}
                        value={allDay ? endStr.slice(0, 10) : endStr}
                        onChange={(e) => setEndStr(e.target.value)}
                        className="flex-1 bg-transparent border-b hover:bg-[var(--surface-2)] focus:bg-[var(--surface-1)] border-[var(--border-primary)] focus:border-[var(--accent-blue)] px-2 py-1.5 transition-all text-[var(--text-primary)] font-medium outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none">
                        <input
                          type="checkbox"
                          checked={allDay}
                          onChange={(e) => setAllDay(e.target.checked)}
                          className="rounded accent-[var(--accent-blue)] w-3.5 h-3.5 cursor-pointer"
                        />
                        Toute la journée
                      </label>
                      <span className="text-[11px] text-[var(--text-tertiary)] font-medium px-2 py-0.5 rounded bg-[var(--surface-2)]">{TZ}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-[14px]">
                    <input
                      type="date"
                      value={startStr.slice(0, 10)}
                      onChange={(e) => setStartStr(e.target.value)}
                      className="w-full bg-transparent border-b hover:bg-[var(--surface-2)] focus:bg-[var(--surface-1)] border-[var(--border-primary)] focus:border-[var(--accent-blue)] px-2 py-1.5 transition-all text-[var(--text-primary)] font-medium outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="h-px bg-[var(--border-primary)] w-full" />

          {/* Details Block */}
          <div className="space-y-4">
            
            {/* Description */}
            <div className="flex items-start gap-3 group">
              <FileText size={16} className="text-[var(--text-tertiary)] mt-2 shrink-0 group-focus-within:text-[var(--accent-blue)] transition-colors" />
              <div className="flex-1">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ajouter une description ou des notes..."
                  rows={4}
                  className="w-full bg-transparent hover:bg-[var(--surface-2)] focus:bg-[var(--surface-1)] border border-transparent focus:border-[var(--border-primary)] rounded-xl px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-ghost)] resize-y outline-none transition-all custom-scrollbar leading-relaxed"
                />
              </div>
            </div>

            {/* Project / Link */}
            <div className="flex items-center gap-3">
              <StickyNote size={16} className="text-[var(--text-tertiary)] shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none cursor-pointer transition-colors font-medium appearance-none"
                  style={{ backgroundImage: "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239898A2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", backgroundSize: "8px auto" }}
                >
                  <option value="">Lier à un projet...</option>
                  {useAppStore.getState().projects.filter(p => p.status !== "archived" || p.id === projectId).map(p => (
                    <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                  ))}
                </select>

                {mode === "event" && isEdit && (
                  <>
                    {linkedNote ? (
                      <button
                        onClick={() => { onClose(); router.push(`/notes?id=${linkedNote.id}`); }}
                        className="w-full text-left bg-[var(--accent-blue-light)] text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 rounded-lg px-3 py-2 text-[12px] font-medium hover:brightness-110 transition-all truncate"
                      >
                        Ouvrir la note liée
                      </button>
                    ) : (
                      <button
                        onClick={handleCreateNote}
                        className="w-full text-left bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border border-[var(--border-primary)] border-dashed rounded-lg px-3 py-2 text-[12px] text-[var(--text-secondary)] transition-all"
                      >
                        + Créer une note dédiée
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Calendar / List & Color */}
            <div className="flex items-center gap-3">
              <span 
                className="w-4 h-4 rounded-full shrink-0" 
                style={{ 
                  background: mode === "event" ? calColor : "transparent", 
                  border: mode === "event" ? "none" : "2px solid var(--text-tertiary)" 
                }} 
              />
              <div className="flex-1 flex items-center gap-2">
                {mode === "event" ? (
                  <select
                    value={calendarId}
                    onChange={(e) => setCalendarId(e.target.value)}
                    className="flex-1 bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[13px] font-medium text-[var(--text-primary)] outline-none cursor-pointer appearance-none truncate"
                    style={{ backgroundImage: "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239898A2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", backgroundSize: "8px auto" }}
                  >
                    {calendars.filter((c) => c.accessRole === "owner" || c.accessRole === "writer").map((c) => (
                      <option key={c.id} value={c.id}>{c.summary}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={taskListId}
                    onChange={(e) => setTaskListId(e.target.value)}
                    className="flex-1 bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border border-[var(--border-primary)] rounded-lg px-3 py-2 text-[13px] font-medium text-[var(--text-primary)] outline-none cursor-pointer appearance-none truncate"
                    style={{ backgroundImage: "url(\"data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239898A2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", backgroundSize: "8px auto" }}
                  >
                    {taskLists.map((l) => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Colors */}
            {mode === "event" && (
              <div className="flex items-start gap-3">
                <Palette size={16} className="text-[var(--text-tertiary)] mt-1.5 shrink-0" />
                <div className="flex-1 flex flex-wrap gap-2 pt-1">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setColorId(c.id)}
                      className={
                        "w-5 h-5 rounded-full border-2 transition-all " +
                        (colorId === c.id ? "scale-110 shadow-sm" : "hover:scale-110 opacity-70 hover:opacity-100")
                      }
                      style={{
                        background: c.hex || calColor,
                        borderColor: colorId === c.id ? "var(--text-primary)" : "transparent",
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>

          <div className="h-6" /> {/* spacer */}
        </div>

        {/* Footer (Save Button) */}
        <div className="p-4 border-t border-[var(--border-primary)] shrink-0 bg-[var(--surface-0)]">
          <button
            onClick={handleSave}
            disabled={!summary.trim()}
            className="w-full py-2.5 rounded-xl text-[14px] font-semibold text-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--accent-blue)" }}
          >
            {isEdit ? "Enregistrer les modifications" : "Créer"}
          </button>
        </div>
      </motion.div>
    </>
  );
}
