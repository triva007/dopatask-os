"use client";

import { useState, useEffect } from "react";
import { X, MapPin, FileText, Clock, Palette } from "lucide-react";
import { motion } from "framer-motion";
import type { CalendarEvent, CalendarInfo } from "./useCalendarEvents";

interface EventModalProps {
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

export default function EventModal({ event, defaultDate, defaultEndDate, calendars, taskLists = [], onSave, onClose }: EventModalProps) {
  const isEdit = !!event;
  const now = defaultDate || new Date();
  const defaultEnd = defaultEndDate || new Date(now.getTime() + 60 * 60 * 1000);

  const [mode, setMode] = useState<"event" | "task">(event?.type === "task" ? "task" : "event");

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

  // Initialize projectId if editing an existing event/task
  useEffect(() => {
    if (event) {
      if (event.type === "task") {
        setProjectId(useAppStore.getState().googleTaskProjects[event.id] || "");
      } else {
        setProjectId(useAppStore.getState().googleEventProjects[event.id] || "");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--backdrop-bg)", backdropFilter: "var(--backdrop-blur)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl border overflow-hidden flex flex-col"
        style={{
          background: "var(--card-bg)",
          borderColor: "var(--card-border)",
          boxShadow: "var(--shadow-elevated)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div className="flex flex-col border-b" style={{ borderColor: "var(--border-primary)" }}>
          <div className="flex items-center justify-between px-6 pt-4 pb-2">
            <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">
              {isEdit ? "Modifier" : "Créer"}
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-3)] text-[var(--text-secondary)] transition-all">
              <X size={16} />
            </button>
          </div>
          {!isEdit && (
            <div className="flex gap-6 px-6 mt-1">
              <button
                className={`pb-2 text-[13px] font-semibold transition-all border-b-2 ${mode === "event" ? "border-[var(--accent-blue)] text-[var(--accent-blue)]" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                onClick={() => setMode("event")}
              >
                Événement
              </button>
              <button
                className={`pb-2 text-[13px] font-semibold transition-all border-b-2 ${mode === "task" ? "border-[var(--accent-blue)] text-[var(--accent-blue)]" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                onClick={() => setMode("task")}
              >
                Tâche
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
          {/* Title */}
          <input
            autoFocus
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder={mode === "event" ? "Titre de l'événement" : "Titre de la tâche"}
            className="w-full text-[18px] font-semibold bg-transparent focus:outline-none text-[var(--text-primary)] placeholder:text-[var(--text-ghost)]"
          />

          {/* All day toggle + dates (Event mode vs Task mode) */}
          <div className="space-y-3">
            {mode === "event" && (
              <label className="flex items-center gap-2 text-[12.5px] text-[var(--text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="rounded"
                />
                Toute la journée
              </label>
            )}

            <div className="flex items-center gap-3">
              <Clock size={14} className="text-[var(--text-tertiary)] shrink-0" />
              {mode === "event" ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type={allDay ? "date" : "datetime-local"}
                    value={allDay ? startStr.slice(0, 10) : startStr}
                    onChange={(e) => setStartStr(e.target.value)}
                    className="flex-1 bg-[var(--surface-2)] border rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 text-[var(--text-primary)]"
                    style={{ borderColor: "var(--border-primary)", outlineColor: "var(--focus-ring)" }}
                  />
                  <span className="text-[var(--text-tertiary)] text-[12px]">→</span>
                  <input
                    type={allDay ? "date" : "datetime-local"}
                    value={allDay ? endStr.slice(0, 10) : endStr}
                    onChange={(e) => setEndStr(e.target.value)}
                    className="flex-1 bg-[var(--surface-2)] border rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 text-[var(--text-primary)]"
                    style={{ borderColor: "var(--border-primary)", outlineColor: "var(--focus-ring)" }}
                  />
                </div>
              ) : (
                <input
                  type="date"
                  value={startStr.slice(0, 10)}
                  onChange={(e) => setStartStr(e.target.value)}
                  className="bg-[var(--surface-2)] border rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 text-[var(--text-primary)]"
                  style={{ borderColor: "var(--border-primary)", outlineColor: "var(--focus-ring)" }}
                />
              )}
            </div>
          </div>

          {/* Description */}
          <div className="flex items-start gap-3">
            <FileText size={14} className="text-[var(--text-tertiary)] shrink-0 mt-2.5" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (notes)"
              rows={3}
              className="flex-1 bg-[var(--surface-2)] border rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 text-[var(--text-primary)] resize-y leading-relaxed placeholder:text-[var(--text-ghost)]"
              style={{ borderColor: "var(--border-primary)", outlineColor: "var(--focus-ring)" }}
            />
          </div>

          {/* Project Selector */}
          <div className="flex items-center gap-3">
            <Palette size={14} className="text-[var(--text-tertiary)] shrink-0" />
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="flex-1 bg-[var(--surface-2)] border rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 text-[var(--text-primary)] cursor-pointer"
              style={{ borderColor: "var(--border-primary)", outlineColor: "var(--focus-ring)" }}
            >
              <option value="">Lier à un projet DopaTask...</option>
              {useAppStore.getState().projects.filter(p => p.status !== "archived" || p.id === projectId).map(p => (
                <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
              ))}
            </select>
          </div>

          {/* Calendar selector or Task list selector */}
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded shrink-0" style={{ background: mode === "event" ? calColor : "transparent", border: mode === "event" ? "none" : "2px solid currentColor", color: "var(--text-tertiary)" }} />
            {mode === "event" ? (
              <select
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                className="flex-1 bg-[var(--surface-2)] border rounded-xl px-3 py-2 text-[13px] focus:outline-none text-[var(--text-primary)] cursor-pointer"
                style={{ borderColor: "var(--border-primary)" }}
              >
                {calendars.filter((c) => c.accessRole === "owner" || c.accessRole === "writer").map((c) => (
                  <option key={c.id} value={c.id}>{c.summary}</option>
                ))}
              </select>
            ) : (
              <select
                value={taskListId}
                onChange={(e) => setTaskListId(e.target.value)}
                className="flex-1 bg-[var(--surface-2)] border rounded-xl px-3 py-2 text-[13px] focus:outline-none text-[var(--text-primary)] cursor-pointer"
                style={{ borderColor: "var(--border-primary)" }}
              >
                {taskLists.map((l) => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            )}
          </div>

          {/* Color (Event only) */}
          {mode === "event" && (
            <div className="flex items-center gap-3">
              <Palette size={14} className="text-[var(--text-tertiary)] shrink-0" />
              <button
                onClick={() => setShowColors(!showColors)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12.5px] hover:bg-[var(--surface-3)] transition-all"
                style={{ color: "var(--text-secondary)" }}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: selectedColor?.hex || calColor }}
                />
                {selectedColor?.label || "Couleur du calendrier"}
              </button>
            </div>
          )}

          {showColors && (
            <div className="flex flex-wrap gap-1.5 pl-8">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setColorId(c.id); setShowColors(false); }}
                  className={
                    "w-6 h-6 rounded-full border-2 transition-all " +
                    (colorId === c.id ? "scale-110 ring-2 ring-offset-1" : "hover:scale-105")
                  }
                  style={{
                    background: c.hex || calColor,
                    borderColor: colorId === c.id ? "var(--text-primary)" : "transparent",
                    outlineColor: "var(--focus-ring)",
                  }}
                  title={c.label}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t" style={{ borderColor: "var(--border-primary)", background: "var(--surface-2)" }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!summary.trim()}
            className="px-5 py-2 rounded-xl text-[13px] font-semibold text-white transition-all disabled:opacity-40"
            style={{ background: "var(--accent-blue)" }}
          >
            {isEdit ? "Enregistrer" : "Créer"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
