"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2,
  Plus, X, Trash2, Clock, AlertCircle, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?:   { dateTime?: string; date?: string };
  status?: string;
  htmlLink?: string;
  updated?: string;
}

const HOUR_HEIGHT = 48; // px par heure
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 23;

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const COLORS = [
  "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#14b8a6",
];

function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  return COLORS[Math.abs(hash) % COLORS.length];
}

function startOfWeekMonday(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay() || 7; // lundi = 1, dimanche = 7
  date.setDate(date.getDate() - (day - 1));
  return date;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function fmtMonthYear(d: Date): string {
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function eventDates(e: GEvent): { start: Date; end: Date; allDay: boolean } | null {
  const sIso = e.start?.dateTime || e.start?.date;
  const eIso = e.end?.dateTime   || e.end?.date;
  if (!sIso) return null;
  const allDay = !e.start?.dateTime;
  const start = new Date(allDay ? sIso + "T00:00:00" : sIso);
  const end   = new Date(eIso ? (allDay ? eIso + "T00:00:00" : eIso) : start.getTime() + 60 * 60 * 1000);
  return { start, end, allDay };
}

export default function WeekCalendar() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [events, setEvents] = useState<GEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeekMonday(new Date()));
  const [editEvent, setEditEvent] = useState<GEvent | null>(null);
  const [creating, setCreating] = useState<{ start: Date; end: Date } | null>(null);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const fetchEvents = useCallback(async (start: Date) => {
    setLoading(true);
    setError(null);
    try {
      const timeMin = new Date(start); timeMin.setHours(0, 0, 0, 0);
      const timeMax = addDays(start, 7); timeMax.setHours(23, 59, 59, 999);
      const url = "/api/google/calendar/events?timeMin=" + encodeURIComponent(timeMin.toISOString()) + "&timeMax=" + encodeURIComponent(timeMax.toISOString());
      const r = await fetch(url, { cache: "no-store" });
      if (r.status === 401) { setConnected(false); return; }
      if (!r.ok) throw new Error("Echec recuperation");
      const d = (await r.json()) as { events: GEvent[] };
      setEvents(d.events || []);
      setConnected(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(weekStart); }, [weekStart, fetchEvents]);

  const goToday = () => setWeekStart(startOfWeekMonday(new Date()));
  const prev    = () => setWeekStart(addDays(weekStart, -7));
  const next    = () => setWeekStart(addDays(weekStart, 7));

  const updateEvent = async (id: string, updates: Partial<GEvent>) => {
    try {
      const r = await fetch("/api/google/calendar/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: id, updates }),
      });
      if (!r.ok) throw new Error("Echec");
      await fetchEvents(weekStart);
    } catch {
      setError("Modification impossible");
    }
  };

  const createEvent = async (data: { summary: string; description?: string; start: Date; end: Date }) => {
    try {
      const r = await fetch("/api/google/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: data.summary,
          description: data.description,
          start: { dateTime: data.start.toISOString() },
          end:   { dateTime: data.end.toISOString() },
        }),
      });
      if (!r.ok) throw new Error("Echec");
      await fetchEvents(weekStart);
    } catch {
      setError("Creation impossible");
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const r = await fetch("/api/google/calendar/events?eventId=" + encodeURIComponent(id), { method: "DELETE" });
      if (!r.ok) throw new Error("Echec");
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setError("Suppression impossible");
    }
  };

  if (connected === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--accent-blue)12" }}>
          <CalendarIcon size={26} className="text-accent-blue" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Connecte ton Google Calendar</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2">Va dans Reglages pour connecter ton compte.</p>
        </div>
        <a href="/reglages" className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-blue text-white rounded-xl text-[13px] font-semibold hover:opacity-90">
          Aller aux reglages
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-7 pt-6 pb-4 border-b border-b-primary flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5">
            <CalendarIcon size={18} className="text-accent-blue" /> Calendrier
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 capitalize">{fmtMonthYear(weekStart)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prev} className="p-2 rounded-lg bg-empty-bg border border-b-primary hover:bg-[var(--surface-2)] text-[var(--text-secondary)]">
            <ChevronLeft size={14} />
          </button>
          <button onClick={goToday} className="px-3 py-2 rounded-lg bg-empty-bg border border-b-primary hover:bg-[var(--surface-2)] text-[12px] font-medium text-[var(--text-primary)]">
            Aujourd&apos;hui
          </button>
          <button onClick={next} className="p-2 rounded-lg bg-empty-bg border border-b-primary hover:bg-[var(--surface-2)] text-[var(--text-secondary)]">
            <ChevronRight size={14} />
          </button>
          <button
            onClick={() => fetchEvents(weekStart)}
            disabled={loading}
            className="ml-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-empty-bg border border-b-primary text-[12px] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="shrink-0 px-7 pt-3">
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[var(--accent-red-light)] text-[var(--accent-red)] text-[12px]">
            <div className="flex items-center gap-2">
              <AlertCircle size={13} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)}><X size={13} /></button>
          </div>
        </div>
      )}

      {/* Week grid */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] sticky top-0 z-10 bg-[var(--bg-primary)] border-b border-b-primary">
          <div /> {/* corner */}
          {days.map((day) => {
            const isToday = sameDay(day, new Date());
            return (
              <div key={day.toISOString()} className={"flex flex-col items-center py-2 border-l border-b-primary " + (isToday ? "bg-[var(--accent-blue-light)]" : "")}>
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                  {DAYS_FR[(day.getDay() + 6) % 7]}
                </p>
                <p className={"text-lg font-semibold mt-0.5 " + (isToday ? "text-accent-blue" : "text-[var(--text-primary)]")}>
                  {day.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        {/* All-day events row */}
        <AllDayRow days={days} events={events} onClick={(e) => setEditEvent(e)} />

        {/* Hours grid */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
          {/* Hours labels */}
          <div className="flex flex-col">
            {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i).map((h) => (
              <div key={h} className="text-[10px] text-[var(--text-secondary)] text-right pr-2 border-t border-b-primary" style={{ height: HOUR_HEIGHT }}>
                <span className="relative -top-1.5">{h}h</span>
              </div>
            ))}
          </div>

          {days.map((day) => (
            <DayColumn
              key={day.toISOString()}
              day={day}
              events={events}
              onCreateSlot={(start, end) => setCreating({ start, end })}
              onClickEvent={(e) => setEditEvent(e)}
            />
          ))}
        </div>
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editEvent && (
          <EventModal
            event={editEvent}
            onClose={() => setEditEvent(null)}
            onSave={(upd) => { updateEvent(editEvent.id, upd); setEditEvent(null); }}
            onDelete={() => { deleteEvent(editEvent.id); setEditEvent(null); }}
          />
        )}
      </AnimatePresence>

      {/* Create modal */}
      <AnimatePresence>
        {creating && (
          <CreateModal
            start={creating.start}
            end={creating.end}
            onClose={() => setCreating(null)}
            onCreate={(data) => { createEvent(data); setCreating(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* =============================================================== */
/* AllDayRow                                                        */
/* =============================================================== */

function AllDayRow({ days, events, onClick }: { days: Date[]; events: GEvent[]; onClick: (e: GEvent) => void }) {
  const allDay = events.filter((e) => {
    const d = eventDates(e);
    return d?.allDay;
  });
  if (allDay.length === 0) return null;

  return (
    <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-b-primary bg-[var(--bg-primary)]">
      <div className="text-[9px] uppercase tracking-wider text-[var(--text-secondary)] flex items-center justify-end pr-2">Toute la j.</div>
      {days.map((day) => {
        const dayEvents = allDay.filter((e) => {
          const d = eventDates(e); if (!d) return false;
          return sameDay(d.start, day) || (d.start <= day && d.end > day);
        });
        return (
          <div key={day.toISOString()} className="border-l border-b-primary p-1 min-h-[28px] space-y-0.5">
            {dayEvents.map((e) => (
              <button
                key={e.id}
                onClick={() => onClick(e)}
                className="block w-full text-left text-[10.5px] truncate px-1.5 py-0.5 rounded text-white"
                style={{ background: colorForId(e.id) }}
              >
                {e.summary || "(sans titre)"}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* =============================================================== */
/* DayColumn                                                        */
/* =============================================================== */

function DayColumn({
  day, events, onCreateSlot, onClickEvent,
}: {
  day: Date;
  events: GEvent[];
  onCreateSlot: (start: Date, end: Date) => void;
  onClickEvent: (e: GEvent) => void;
}) {
  const hours = DAY_END_HOUR - DAY_START_HOUR;
  const totalH = hours * HOUR_HEIGHT;

  const dayEvents = events.filter((e) => {
    const d = eventDates(e); if (!d || d.allDay) return false;
    return sameDay(d.start, day);
  });

  const isToday = sameDay(day, new Date());
  const now = new Date();
  const nowOffset = isToday
    ? ((now.getHours() + now.getMinutes() / 60) - DAY_START_HOUR) * HOUR_HEIGHT
    : -1;

  const handleEmptyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".event-block")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const hourFloat = y / HOUR_HEIGHT + DAY_START_HOUR;
    const startHour = Math.max(DAY_START_HOUR, Math.floor(hourFloat * 2) / 2);
    const start = new Date(day); start.setHours(Math.floor(startHour), (startHour % 1) * 60, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    onCreateSlot(start, end);
  };

  return (
    <div
      onClick={handleEmptyClick}
      className="relative border-l border-b-primary cursor-pointer"
      style={{ height: totalH }}
    >
      {/* Hour grid lines */}
      {Array.from({ length: hours }, (_, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 border-t border-b-primary"
          style={{ top: i * HOUR_HEIGHT }}
        />
      ))}

      {/* Now line */}
      {isToday && nowOffset >= 0 && nowOffset <= totalH && (
        <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: nowOffset }}>
          <div className="h-[2px] bg-accent-red" />
          <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-accent-red" />
        </div>
      )}

      {/* Events */}
      {dayEvents.map((e) => {
        const d = eventDates(e); if (!d) return null;
        const startMin = (d.start.getHours() + d.start.getMinutes() / 60) - DAY_START_HOUR;
        const endMin   = (d.end.getHours()   + d.end.getMinutes() / 60)   - DAY_START_HOUR;
        const top    = Math.max(0, startMin * HOUR_HEIGHT);
        const height = Math.max(20, (endMin - startMin) * HOUR_HEIGHT - 2);
        const color = colorForId(e.id);

        return (
          <button
            key={e.id}
            onClick={(ev) => { ev.stopPropagation(); onClickEvent(e); }}
            className="event-block absolute left-1 right-1 rounded-md px-2 py-1 text-left overflow-hidden text-white shadow-sm hover:shadow-md transition-shadow"
            style={{ top, height, background: color }}
          >
            <p className="text-[11px] font-semibold leading-tight truncate">{e.summary || "(sans titre)"}</p>
            <p className="text-[10px] opacity-90 leading-tight">
              {fmtTime(d.start)} - {fmtTime(d.end)}
            </p>
          </button>
        );
      })}
    </div>
  );
}

/* =============================================================== */
/* EventModal (edit)                                                */
/* =============================================================== */

function EventModal({
  event, onClose, onSave, onDelete,
}: {
  event: GEvent;
  onClose: () => void;
  onSave: (updates: Partial<GEvent>) => void;
  onDelete: () => void;
}) {
  const d = eventDates(event);
  const initialDate  = d ? d.start.toISOString().slice(0, 10) : "";
  const initialStart = d && !d.allDay ? d.start.toTimeString().slice(0, 5) : "09:00";
  const initialEnd   = d && !d.allDay ? d.end.toTimeString().slice(0, 5)   : "10:00";

  const [summary, setSummary] = useState(event.summary || "");
  const [description, setDescription] = useState(event.description || "");
  const [date, setDate]   = useState(initialDate);
  const [start, setStart] = useState(initialStart);
  const [end, setEnd]     = useState(initialEnd);

  const submit = () => {
    const startDt = new Date(date + "T" + start + ":00");
    const endDt   = new Date(date + "T" + end + ":00");
    onSave({
      summary,
      description,
      start: { dateTime: startDt.toISOString() },
      end:   { dateTime: endDt.toISOString() },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-3xl max-w-md w-full border border-b-primary p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3 mb-4">
          <input
            type="text" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Titre"
            className="flex-1 bg-transparent text-lg font-semibold focus:outline-none text-[var(--text-primary)]"
          />
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[var(--text-secondary)] shrink-0" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="flex-1 bg-empty-bg border border-b-primary rounded-lg px-2.5 py-1.5 text-[12.5px] text-[var(--text-primary)]" />
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)}
              className="bg-empty-bg border border-b-primary rounded-lg px-2.5 py-1.5 text-[12.5px] text-[var(--text-primary)]" />
            <span className="text-[12px] text-[var(--text-secondary)]">a</span>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)}
              className="bg-empty-bg border border-b-primary rounded-lg px-2.5 py-1.5 text-[12.5px] text-[var(--text-primary)]" />
          </div>

          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            rows={3} placeholder="Description (optionnel)"
            className="w-full bg-empty-bg border border-b-primary rounded-xl px-3 py-2 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)] resize-none"
          />
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-b-primary">
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--accent-red)] hover:bg-[var(--accent-red-light)] px-3 py-2 rounded-xl transition-all"
          >
            <Trash2 size={13} /> Supprimer
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12.5px] bg-empty-bg text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
              Annuler
            </button>
            <button onClick={submit} className="px-4 py-2 rounded-xl text-[12.5px] bg-accent-blue text-white hover:opacity-90">
              Enregistrer
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =============================================================== */
/* CreateModal                                                      */
/* =============================================================== */

function CreateModal({
  start, end, onClose, onCreate,
}: {
  start: Date; end: Date;
  onClose: () => void;
  onCreate: (data: { summary: string; description?: string; start: Date; end: Date }) => void;
}) {
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate]   = useState(start.toISOString().slice(0, 10));
  const [tStart, setTStart] = useState(start.toTimeString().slice(0, 5));
  const [tEnd, setTEnd]     = useState(end.toTimeString().slice(0, 5));

  const submit = () => {
    if (!summary.trim()) return;
    const startDt = new Date(date + "T" + tStart + ":00");
    const endDt   = new Date(date + "T" + tEnd + ":00");
    onCreate({ summary: summary.trim(), description: description.trim() || undefined, start: startDt, end: endDt });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-3xl max-w-md w-full border border-b-primary p-6 shadow-2xl"
      >
        <div className="flex items-start gap-3 mb-4">
          <Plus size={18} className="text-accent-blue mt-1 shrink-0" />
          <input
            autoFocus
            type="text" value={summary} onChange={(e) => setSummary(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="Titre de l'evenement"
            className="flex-1 bg-transparent text-lg font-semibold focus:outline-none text-[var(--text-primary)]"
          />
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[var(--text-secondary)] shrink-0" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="flex-1 bg-empty-bg border border-b-primary rounded-lg px-2.5 py-1.5 text-[12.5px] text-[var(--text-primary)]" />
            <input type="time" value={tStart} onChange={(e) => setTStart(e.target.value)}
              className="bg-empty-bg border border-b-primary rounded-lg px-2.5 py-1.5 text-[12.5px] text-[var(--text-primary)]" />
            <span className="text-[12px] text-[var(--text-secondary)]">a</span>
            <input type="time" value={tEnd} onChange={(e) => setTEnd(e.target.value)}
              className="bg-empty-bg border border-b-primary rounded-lg px-2.5 py-1.5 text-[12.5px] text-[var(--text-primary)]" />
          </div>

          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            rows={2} placeholder="Description (optionnel)"
            className="w-full bg-empty-bg border border-b-primary rounded-xl px-3 py-2 text-[12.5px] focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)] resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-b-primary">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[12.5px] bg-empty-bg text-[var(--text-primary)] hover:bg-[var(--surface-2)]">
            Annuler
          </button>
          <button onClick={submit} disabled={!summary.trim()} className="px-4 py-2 rounded-xl text-[12.5px] bg-accent-blue text-white hover:opacity-90 disabled:opacity-50">
            Creer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
