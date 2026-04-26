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

type ViewMode = "day" | "4days" | "week";

const HOUR_HEIGHT = 56;
const DAY_START_HOUR = 6;
const DAY_END_HOUR = 23;

const DAYS_FR_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const COLORS = [
  "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#14b8a6",
];

function colorForId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
  return COLORS[Math.abs(h) % COLORS.length];
}

function startOfWeekMonday(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay() || 7;
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
  const [viewMode, setViewMode] = useState<ViewMode>("4days");
  const [anchorDate, setAnchorDate] = useState<Date>(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  });
  const [editEvent, setEditEvent] = useState<GEvent | null>(null);
  const [creating, setCreating] = useState<{ start: Date; end: Date } | null>(null);

  const numDays = viewMode === "day" ? 1 : viewMode === "4days" ? 4 : 7;

  const startDate = useMemo(() => {
    if (viewMode === "week") return startOfWeekMonday(anchorDate);
    return anchorDate;
  }, [viewMode, anchorDate]);

  const days = useMemo(
    () => Array.from({ length: numDays }, (_, i) => addDays(startDate, i)),
    [startDate, numDays]
  );

  const fetchEvents = useCallback(async (start: Date, days: number) => {
    setLoading(true);
    setError(null);
    try {
      const timeMin = new Date(start); timeMin.setHours(0, 0, 0, 0);
      const timeMax = addDays(start, days); timeMax.setHours(23, 59, 59, 999);
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

  useEffect(() => { fetchEvents(startDate, numDays); }, [startDate, numDays, fetchEvents]);

  const goToday = () => {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    setAnchorDate(t);
  };
  const prev = () => setAnchorDate(addDays(anchorDate, -numDays));
  const next = () => setAnchorDate(addDays(anchorDate, numDays));

  const updateEvent = async (id: string, updates: Partial<GEvent>) => {
    try {
      const r = await fetch("/api/google/calendar/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: id, updates }),
      });
      if (!r.ok) throw new Error("Echec");
      await fetchEvents(startDate, numDays);
    } catch { setError("Modification impossible"); }
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
      await fetchEvents(startDate, numDays);
    } catch { setError("Creation impossible"); }
  };

  const deleteEvent = async (id: string) => {
    try {
      const r = await fetch("/api/google/calendar/events?eventId=" + encodeURIComponent(id), { method: "DELETE" });
      if (!r.ok) throw new Error("Echec");
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch { setError("Suppression impossible"); }
  };

  if (connected === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--accent-blue-light)" }}>
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

  // Header range pour affichage
  const headerRange = (() => {
    const first = days[0];
    const last  = days[days.length - 1];
    if (!first || !last) return "";
    if (sameDay(first, last)) {
      return first.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    }
    if (first.getMonth() === last.getMonth()) {
      return first.getDate() + " - " + last.getDate() + " " + first.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    }
    return first.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + " - " + last.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  })();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-7 pt-6 pb-4 border-b border-b-primary flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5">
            <CalendarIcon size={18} className="text-accent-blue" /> Calendrier
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 capitalize truncate">{headerRange || fmtMonthYear(anchorDate)}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* View switcher */}
          <div className="flex p-0.5 rounded-xl bg-empty-bg border border-b-primary">
            {(["day", "4days", "week"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={
                  "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all " +
                  (viewMode === v
                    ? "bg-accent-blue text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")
                }
              >
                {v === "day" ? "Jour" : v === "4days" ? "4j" : "Semaine"}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={prev} className="p-2 rounded-lg bg-empty-bg border border-b-primary hover:bg-[var(--surface-2)] text-[var(--text-secondary)] transition-all">
              <ChevronLeft size={14} />
            </button>
            <button onClick={goToday} className="px-3 py-2 rounded-lg bg-empty-bg border border-b-primary hover:bg-[var(--surface-2)] text-[12px] font-medium text-[var(--text-primary)] transition-all">
              Aujourd&apos;hui
            </button>
            <button onClick={next} className="p-2 rounded-lg bg-empty-bg border border-b-primary hover:bg-[var(--surface-2)] text-[var(--text-secondary)] transition-all">
              <ChevronRight size={14} />
            </button>
          </div>

          <button
            onClick={() => fetchEvents(startDate, numDays)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 p-2 rounded-lg bg-empty-bg border border-b-primary text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:opacity-50 transition-all"
            aria-label="Actualiser"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
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

      {/* Grid */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div
          className="grid sticky top-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur border-b border-b-primary"
          style={{ gridTemplateColumns: "70px repeat(" + numDays + ", 1fr)" }}
        >
          <div /> {/* corner */}
          {days.map((day) => {
            const isToday = sameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={"flex items-center justify-center gap-2 py-3 border-l border-b-primary " + (isToday ? "bg-[var(--accent-blue-light)]" : "")}
              >
                <p className="text-[10.5px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                  {DAYS_FR_SHORT[(day.getDay() + 6) % 7]}
                </p>
                <p
                  className={
                    "text-[18px] font-semibold tabular-nums leading-none " +
                    (isToday
                      ? "w-8 h-8 rounded-full bg-accent-blue text-white flex items-center justify-center"
                      : "text-[var(--text-primary)]")
                  }
                >
                  {day.getDate()}
                </p>
              </div>
            );
          })}
        </div>

        <AllDayRow days={days} events={events} numDays={numDays} onClick={(e) => setEditEvent(e)} />

        <div
          className="grid relative"
          style={{ gridTemplateColumns: "70px repeat(" + numDays + ", 1fr)" }}
        >
          <div className="flex flex-col">
            {Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i).map((h) => (
              <div
                key={h}
                className="text-[10px] text-[var(--text-secondary)] text-right pr-2 border-t border-b-primary font-medium tabular-nums"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="relative -top-1.5">{h}:00</span>
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

function AllDayRow({ days, events, numDays, onClick }: { days: Date[]; events: GEvent[]; numDays: number; onClick: (e: GEvent) => void }) {
  const allDay = events.filter((e) => {
    const d = eventDates(e);
    return d?.allDay;
  });
  if (allDay.length === 0) return null;

  return (
    <div
      className="grid border-b border-b-primary bg-[var(--bg-primary)]"
      style={{ gridTemplateColumns: "70px repeat(" + numDays + ", 1fr)" }}
    >
      <div className="text-[9px] uppercase tracking-wider text-[var(--text-secondary)] flex items-center justify-end pr-2 font-semibold">Toute la j.</div>
      {days.map((day) => {
        const dayEvents = allDay.filter((e) => {
          const d = eventDates(e); if (!d) return false;
          return sameDay(d.start, day) || (d.start <= day && d.end > day);
        });
        return (
          <div key={day.toISOString()} className="border-l border-b-primary p-1 min-h-[32px] space-y-0.5">
            {dayEvents.map((e) => (
              <button
                key={e.id}
                onClick={() => onClick(e)}
                className="block w-full text-left text-[10.5px] truncate px-1.5 py-1 rounded text-white font-medium hover:opacity-90 transition-all"
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
      className={"relative border-l border-b-primary cursor-pointer transition-all hover:bg-[var(--surface-2)]/30 " + (isToday ? "bg-[var(--accent-blue-light)]/20" : "")}
      style={{ height: totalH }}
    >
      {Array.from({ length: hours }, (_, i) => (
        <div
          key={i}
          className={"absolute left-0 right-0 border-t " + (i % 2 === 0 ? "border-[var(--border-primary)]" : "border-[var(--border-primary)]/40")}
          style={{ top: i * HOUR_HEIGHT }}
        />
      ))}

      {isToday && nowOffset >= 0 && nowOffset <= totalH && (
        <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: nowOffset }}>
          <div className="h-[2px] bg-accent-red shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
          <div className="absolute -left-1 -top-1 w-3 h-3 rounded-full bg-accent-red shadow-md" />
        </div>
      )}

      {dayEvents.map((e) => {
        const d = eventDates(e); if (!d) return null;
        const startMin = (d.start.getHours() + d.start.getMinutes() / 60) - DAY_START_HOUR;
        const endMin   = (d.end.getHours()   + d.end.getMinutes() / 60)   - DAY_START_HOUR;
        const top    = Math.max(0, startMin * HOUR_HEIGHT);
        const height = Math.max(24, (endMin - startMin) * HOUR_HEIGHT - 3);
        const color = colorForId(e.id);
        const isShort = height < 38;

        return (
          <button
            key={e.id}
            onClick={(ev) => { ev.stopPropagation(); onClickEvent(e); }}
            className="event-block absolute left-1 right-1 rounded-lg text-left overflow-hidden text-white shadow-sm hover:shadow-lg hover:brightness-110 transition-all"
            style={{
              top,
              height,
              background: "linear-gradient(135deg, " + color + ", " + color + "dd)",
              borderLeft: "3px solid " + color,
            }}
          >
            <div className="px-2 py-1">
              <p className={"font-semibold leading-tight truncate " + (isShort ? "text-[10.5px]" : "text-[11.5px]")}>
                {e.summary || "(sans titre)"}
              </p>
              {!isShort && (
                <p className="text-[10px] opacity-95 leading-tight mt-0.5">
                  {fmtTime(d.start)} - {fmtTime(d.end)}
                </p>
              )}
            </div>
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
  const color = colorForId(event.id);

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary, description, date, start, end]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-3xl max-w-md w-full border border-b-primary shadow-2xl overflow-hidden"
      >
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: color }} />
          <div className="flex items-center gap-3 px-6 py-4 border-b border-b-primary">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <p className="text-[10.5px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold flex-1">
              Modifier l&apos;evenement
            </p>
            <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-empty-bg p-1.5 rounded-lg transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[10.5px] uppercase tracking-wider text-[var(--text-secondary)] mb-2 font-semibold">
              Titre
            </label>
            <input
              type="text" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Titre de l'evenement"
              className="w-full bg-empty-bg border border-b-primary rounded-xl px-4 py-2.5 text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-[10.5px] uppercase tracking-wider text-[var(--text-secondary)] mb-2 font-semibold">
              Date et heure
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-empty-bg border border-b-primary rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)]"
              />
              <div className="flex items-center gap-2">
                <input
                  type="time" value={start} onChange={(e) => setStart(e.target.value)}
                  className="flex-1 bg-empty-bg border border-b-primary rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)]"
                />
                <span className="text-[12px] text-[var(--text-secondary)] font-medium">a</span>
                <input
                  type="time" value={end} onChange={(e) => setEnd(e.target.value)}
                  className="flex-1 bg-empty-bg border border-b-primary rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10.5px] uppercase tracking-wider text-[var(--text-secondary)] mb-2 font-semibold">
              Description
            </label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3} placeholder="Notes, lien, lieu..."
              className="w-full bg-empty-bg border border-b-primary rounded-xl px-4 py-2.5 text-[13px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)] resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-b-primary bg-[var(--surface-2)]">
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 text-[13px] text-[var(--accent-red)] hover:bg-[var(--accent-red-light)] px-3 py-2 rounded-xl transition-all font-medium"
          >
            <Trash2 size={13} /> Supprimer
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] bg-empty-bg text-[var(--text-primary)] hover:bg-surface transition-all font-medium">
              Annuler
            </button>
            <button onClick={submit} className="px-5 py-2 rounded-xl text-[13px] bg-accent-blue text-white hover:opacity-90 transition-all font-semibold">
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary, description, date, tStart, tEnd]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-3xl max-w-md w-full border border-b-primary shadow-2xl overflow-hidden"
      >
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-accent-blue" />
          <div className="flex items-center gap-3 px-6 py-4 border-b border-b-primary">
            <Plus size={16} className="text-accent-blue" />
            <p className="text-[10.5px] uppercase tracking-wider text-[var(--text-secondary)] font-semibold flex-1">
              Nouvel evenement
            </p>
            <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-empty-bg p-1.5 rounded-lg transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[10.5px] uppercase tracking-wider text-[var(--text-secondary)] mb-2 font-semibold">
              Titre
            </label>
            <input
              autoFocus
              type="text" value={summary} onChange={(e) => setSummary(e.target.value)}
              placeholder="Ex: Reunion client, Deep work..."
              className="w-full bg-empty-bg border border-b-primary rounded-xl px-4 py-2.5 text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-[10.5px] uppercase tracking-wider text-[var(--text-secondary)] mb-2 font-semibold">
              Date et heure
            </label>
            <div className="space-y-2">
              <input
                type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full bg-empty-bg border border-b-primary rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)]"
              />
              <div className="flex items-center gap-2">
                <input
                  type="time" value={tStart} onChange={(e) => setTStart(e.target.value)}
                  className="flex-1 bg-empty-bg border border-b-primary rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)]"
                />
                <span className="text-[12px] text-[var(--text-secondary)] font-medium">a</span>
                <input
                  type="time" value={tEnd} onChange={(e) => setTEnd(e.target.value)}
                  className="flex-1 bg-empty-bg border border-b-primary rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10.5px] uppercase tracking-wider text-[var(--text-secondary)] mb-2 font-semibold">
              Description (optionnel)
            </label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} placeholder="Notes, lien..."
              className="w-full bg-empty-bg border border-b-primary rounded-xl px-4 py-2.5 text-[13px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent-blue text-[var(--text-primary)] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-b-primary bg-[var(--surface-2)]">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-[13px] bg-empty-bg text-[var(--text-primary)] hover:bg-surface transition-all font-medium">
            Annuler
          </button>
          <button onClick={submit} disabled={!summary.trim()} className="px-5 py-2 rounded-xl text-[13px] bg-accent-blue text-white hover:opacity-90 disabled:opacity-50 transition-all font-semibold">
            Creer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
