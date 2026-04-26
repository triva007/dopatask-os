"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CalendarInfo {
  id: string;
  summary: string;
  backgroundColor: string;
  foregroundColor: string;
  selected: boolean;
  primary: boolean;
  accessRole: string;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  colorId?: string;
  status?: string;
  htmlLink?: string;
  updated?: string;
  type?: "event" | "task";
  taskInfo?: any;
  // computed
  backgroundColor?: string;
}

export type CalendarView = "day" | "4day" | "week" | "month" | "agenda";

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function startOfWeek(d: Date, weekStart = 1): Date {
  const r = new Date(d);
  const day = r.getDay();
  const diff = (day - weekStart + 7) % 7;
  r.setDate(r.getDate() - diff);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateShort(d: Date): string {
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

export function getEventStart(ev: CalendarEvent): Date {
  if (ev.start?.dateTime) return new Date(ev.start.dateTime);
  if (ev.start?.date) return new Date(ev.start.date + "T00:00:00");
  return new Date();
}

export function getEventEnd(ev: CalendarEvent): Date {
  if (ev.end?.dateTime) return new Date(ev.end.dateTime);
  if (ev.end?.date) return new Date(ev.end.date + "T00:00:00");
  return new Date();
}

export function isAllDay(ev: CalendarEvent): boolean {
  return !!(ev.start?.date && !ev.start?.dateTime);
}

export function getViewRange(date: Date, view: CalendarView): { start: Date; end: Date } {
  const d = startOfDay(date);
  switch (view) {
    case "day":
      return { start: d, end: addDays(d, 1) };
    case "4day":
      return { start: d, end: addDays(d, 4) };
    case "week": {
      const ws = startOfWeek(d);
      return { start: ws, end: addDays(ws, 7) };
    }
    case "month": {
      const ms = startOfMonth(d);
      const me = endOfMonth(d);
      const gridStart = startOfWeek(ms);
      const gridEnd = addDays(startOfWeek(addDays(me, 6)), 1);
      return { start: gridStart, end: gridEnd };
    }
    case "agenda":
      return { start: d, end: addDays(d, 30) };
  }
}

// Google Calendar color map (colorId → hex)
const GCAL_COLORS: Record<string, string> = {
  "1": "#7986CB", "2": "#33B679", "3": "#8E24AA", "4": "#E67C73",
  "5": "#F6BF26", "6": "#F4511E", "7": "#039BE5", "8": "#616161",
  "9": "#3F51B5", "10": "#0B8043", "11": "#D50000",
};

export function getEventColor(ev: CalendarEvent, calendars: CalendarInfo[]): string {
  if (ev.colorId && GCAL_COLORS[ev.colorId]) return GCAL_COLORS[ev.colorId];
  const cal = calendars.find((c) => c.id === ev.calendarId);
  return cal?.backgroundColor || "#4285f4";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCalendarEvents() {
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchCalendars = useCallback(async () => {
    try {
      const r = await fetch("/api/google/calendar/calendars", { cache: "no-store" });
      if (r.status === 401) { setConnected(false); return []; }
      if (!r.ok) throw new Error("Echec recuperation calendriers");
      const d = (await r.json()) as { calendars: CalendarInfo[] };
      setConnected(true);
      setCalendars(d.calendars || []);
      return d.calendars || [];
    } catch (e) {
      setError(e instanceof Error ? e.message : "erreur");
      return [];
    }
  }, []);

  const fetchEvents = useCallback(async (calendarIds: string[], timeMin: string, timeMax: string) => {
    try {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const ids = calendarIds.join(",");
      const r = await fetch(
        `/api/google/calendar/events?calendarIds=${encodeURIComponent(ids)}&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
        { cache: "no-store", signal: ctrl.signal }
      );
      if (r.status === 401) { setConnected(false); return; }
      if (!r.ok) throw new Error("Echec recuperation events");
      const d = (await r.json()) as { events: CalendarEvent[] };
      const filtered = (d.events || []).filter(
        (e) => !e.summary?.toLowerCase().includes("domicile")
      );
      setEvents(filtered);
      setConnected(true);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "erreur");
    }
  }, []);

  const createEvent = useCallback(async (data: {
    calendarId?: string;
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime?: string; date?: string; timeZone?: string };
    end: { dateTime?: string; date?: string; timeZone?: string };
    colorId?: string;
  }) => {
    const r = await fetch("/api/google/calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error("Creation echouee");
    const d = (await r.json()) as { event: CalendarEvent };
    setEvents((prev) => [...prev, d.event]);
    return d.event;
  }, []);

  const updateEvent = useCallback(async (calendarId: string, eventId: string, updates: Record<string, unknown>) => {
    // Optimistic update
    setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, ...updates } as CalendarEvent : e));
    try {
      const r = await fetch("/api/google/calendar/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarId, eventId, updates }),
      });
      if (!r.ok) throw new Error("Modification echouee");
      const d = (await r.json()) as { event: CalendarEvent };
      setEvents((prev) => prev.map((e) => e.id === eventId ? d.event : e));
      return d.event;
    } catch (e) {
      // Revert will happen on next fetch
      throw e;
    }
  }, []);

  const deleteEvent = useCallback(async (calendarId: string, eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    const r = await fetch(`/api/google/calendar/events?calendarId=${encodeURIComponent(calendarId)}&eventId=${encodeURIComponent(eventId)}`, {
      method: "DELETE",
    });
    if (!r.ok) throw new Error("Suppression echouee");
  }, []);

  return {
    calendars, setCalendars,
    events, setEvents,
    loading, setLoading,
    error, setError,
    connected,
    fetchCalendars,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}

// ─── Keyboard shortcuts hook ──────────────────────────────────────────────────

export function useCalendarKeys(handlers: {
  onToday: () => void;
  onViewDay: () => void;
  onViewWeek: () => void;
  onViewMonth: () => void;
  onViewAgenda: () => void;
  onPrev: () => void;
  onNext: () => void;
  onCreate: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key.toLowerCase()) {
        case "t": handlers.onToday(); break;
        case "d": handlers.onViewDay(); break;
        case "w": handlers.onViewWeek(); break;
        case "m": handlers.onViewMonth(); break;
        case "a": handlers.onViewAgenda(); break;
        case "arrowleft": handlers.onPrev(); break;
        case "arrowright": handlers.onNext(); break;
        case "c":
        case "n": handlers.onCreate(); break;
        case "escape": handlers.onClose(); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handlers]);
}
