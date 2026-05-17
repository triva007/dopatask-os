"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";
import { CALENDAR_CENSOR_REGEX } from "@/lib/constants";

interface CalEvent {
  id: string;
  calendarId: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  colorId?: string;
  backgroundColor?: string;
}

const GCAL_COLORS: Record<string, string> = {
  "1": "#a4bdfc", "2": "#7ae7bf", "3": "#dbadff", "4": "#ff887c",
  "5": "#fbd75b", "6": "#ffb878", "7": "#46d6db", "8": "#e1e1e1",
  "9": "#5484ed", "10": "#51b749", "11": "#dc2127",
};

function formatTime(d: Date) {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function getColor(ev: CalEvent) {
  if (ev.colorId && GCAL_COLORS[ev.colorId]) return GCAL_COLORS[ev.colorId];
  if (ev.backgroundColor) return ev.backgroundColor;
  return "#818CF8";
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const DAY_NAMES = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

export default function MobileCalendarView() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const fetchEvents = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const timeMin = addDays(date, -1).toISOString();
      const timeMax = addDays(date, 8).toISOString();
      const r = await fetch(
        `/api/google/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
        { cache: "no-store" }
      );
      if (r.status === 401) {
        setConnected(false);
        return;
      }
      if (!r.ok) throw new Error("Erreur");
      const d = (await r.json()) as { events: CalEvent[] };
      const filtered = (d.events || []).filter(
        (e) => !CALENDAR_CENSOR_REGEX.test(e.summary || "")
      );
      setEvents(filtered);
      setConnected(true);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(currentDate);
  }, [currentDate, fetchEvents]);

  // Build 7-day schedule
  const days = useMemo(() => {
    const result: { date: Date; events: CalEvent[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(currentDate, i);
      const dayEvents = events
        .filter((ev) => {
          const iso = ev.start?.dateTime || ev.start?.date;
          if (!iso) return false;
          const start = new Date(ev.start?.dateTime ? iso : iso + "T00:00:00");
          return isSameDay(start, date);
        })
        .sort((a, b) => {
          const aTime = a.start?.dateTime ? new Date(a.start.dateTime).getTime() : 0;
          const bTime = b.start?.dateTime ? new Date(b.start.dateTime).getTime() : 0;
          return aTime - bTime;
        });
      result.push({ date, events: dayEvents });
    }
    return result;
  }, [events, currentDate]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (connected === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
        <CalendarIcon size={32} className="text-[var(--accent-blue)] opacity-50" />
        <p className="text-[14px] font-semibold text-[var(--text-primary)]">Calendrier non connecté</p>
        <p className="text-[12px] text-[var(--text-secondary)]">Connecte Google Agenda via Réglages sur PC.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-bold tracking-tight text-[var(--text-primary)]">
            Calendrier
          </h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentDate(addDays(currentDate, -7))}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-primary)" }}
            >
              <ChevronLeft size={16} className="text-[var(--text-secondary)]" />
            </button>
            <button
              onClick={() => {
                const t = new Date();
                t.setHours(0, 0, 0, 0);
                setCurrentDate(t);
              }}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold"
              style={{ background: "var(--accent-blue-light)", color: "var(--accent-blue)" }}
            >
              Auj.
            </button>
            <button
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-primary)" }}
            >
              <ChevronRight size={16} className="text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>
        <p className="text-[11px] text-[var(--text-tertiary)] mt-1 capitalize">
          {currentDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Day chips row */}
      <div className="px-4 pb-2 shrink-0">
        <div className="flex gap-1">
          {days.map(({ date }) => {
            const isToday = isSameDay(date, today);
            const isSelected = isSameDay(date, currentDate);
            return (
              <button
                key={date.toISOString()}
                onClick={() => setCurrentDate(date)}
                className="flex-1 flex flex-col items-center py-1.5 rounded-xl transition-all"
                style={{
                  background: isToday
                    ? "var(--accent-blue)"
                    : isSelected
                    ? "var(--surface-2)"
                    : "transparent",
                  color: isToday ? "#fff" : "var(--text-secondary)",
                }}
              >
                <span className="text-[9px] font-semibold uppercase">
                  {DAY_NAMES[date.getDay()]}
                </span>
                <span className="text-[14px] font-bold tabular-nums mt-0.5">
                  {date.getDate()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && events.length === 0 && (
        <div className="flex items-center justify-center flex-1 gap-2 text-[var(--text-tertiary)]">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-[13px]">Chargement…</span>
        </div>
      )}

      {/* Agenda list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 mt-1">
        {days.map(({ date, events: dayEvents }) => {
          const isToday = isSameDay(date, today);
          if (dayEvents.length === 0 && !isToday) return null;

          return (
            <div key={date.toISOString()}>
              {/* Day header */}
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{
                    color: isToday ? "var(--accent-blue)" : "var(--text-tertiary)",
                  }}
                >
                  {isToday
                    ? "Aujourd'hui"
                    : date.toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                </span>
                <div className="flex-1 h-px" style={{ background: "var(--border-primary)" }} />
              </div>

              {dayEvents.length === 0 ? (
                <p className="text-[11px] text-[var(--text-tertiary)] italic pl-2 py-1">
                  Rien de prévu
                </p>
              ) : (
                <div className="space-y-1.5">
                  {dayEvents.map((ev) => {
                    const isAllDay = !ev.start?.dateTime;
                    const startTime = ev.start?.dateTime
                      ? formatTime(new Date(ev.start.dateTime))
                      : null;
                    const endTime = ev.end?.dateTime
                      ? formatTime(new Date(ev.end.dateTime))
                      : null;
                    const color = getColor(ev);

                    return (
                      <div
                        key={ev.id}
                        className="flex items-stretch gap-0 rounded-xl overflow-hidden"
                        style={{
                          background: "var(--surface-1)",
                          border: "1px solid var(--border-primary)",
                        }}
                      >
                        {/* Color bar */}
                        <div
                          className="w-1 shrink-0"
                          style={{ background: color }}
                        />
                        <div className="flex-1 px-3 py-2.5 min-w-0">
                          <p className="text-[12.5px] font-semibold text-[var(--text-primary)] truncate leading-tight">
                            {ev.summary || "(sans titre)"}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Clock size={10} className="text-[var(--text-tertiary)] shrink-0" />
                            <span className="text-[10px] text-[var(--text-secondary)] tabular-nums">
                              {isAllDay
                                ? "Toute la journée"
                                : `${startTime}${endTime ? ` — ${endTime}` : ""}`}
                            </span>
                          </div>
                          {ev.location && (
                            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 truncate">
                              📍 {ev.location}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
