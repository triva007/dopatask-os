"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Loader2, Calendar } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import {
  useCalendarEvents, useCalendarKeys,
  type CalendarView, type CalendarEvent,
  getViewRange, addDays, startOfWeek, startOfDay,
} from "./useCalendarEvents";
import CalendarHeader from "./CalendarHeader";
import CalendarSidebar from "./CalendarSidebar";
import DayView from "./views/DayView";
import FourDayView from "./views/FourDayView";
import WeekView from "./views/WeekView";
import MonthView from "./views/MonthView";
import AgendaView from "./views/AgendaView";
import EventPopover from "./EventPopover";
import EventModal from "./EventModal";

const HIDDEN_CAL_KEY = "dopatask-hidden-calendars";

function loadHiddenCals(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(HIDDEN_CAL_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch { return new Set(); }
}

function saveHiddenCals(s: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HIDDEN_CAL_KEY, JSON.stringify(Array.from(s)));
}

export default function CalendarApp() {
  const [currentDate, setCurrentDate] = useState(() => startOfDay(new Date()));
  const [view, setView] = useState<CalendarView>("week");
  const [hiddenCalendarIds, setHiddenCalendarIds] = useState<Set<string>>(() => loadHiddenCals());
  const [popoverEvent, setPopoverEvent] = useState<{ ev: CalendarEvent; anchor: { top: number; left: number } } | null>(null);
  const [modalEvent, setModalEvent] = useState<CalendarEvent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDefaultDate, setCreateDefaultDate] = useState<Date | null>(null);
  const initialFetchDone = useRef(false);

  const {
    calendars, events,
    loading, error, setError,
    connected,
    fetchCalendars, fetchEvents,
    createEvent, updateEvent, deleteEvent,
    setLoading,
  } = useCalendarEvents();

  // Visible calendar IDs
  const visibleCalendarIds = useMemo(
    () => calendars.filter((c) => !hiddenCalendarIds.has(c.id)).map((c) => c.id),
    [calendars, hiddenCalendarIds]
  );

  // Visible events
  const visibleEvents = useMemo(
    () => events.filter((ev) => !hiddenCalendarIds.has(ev.calendarId)),
    [events, hiddenCalendarIds]
  );

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    const cals = await fetchCalendars();
    if (cals.length > 0) {
      const ids = cals.filter((c) => !hiddenCalendarIds.has(c.id)).map((c) => c.id);
      if (ids.length > 0) {
        const range = getViewRange(currentDate, view);
        // Extend range a bit for smooth navigation
        const timeMin = addDays(range.start, -7).toISOString();
        const timeMax = addDays(range.end, 7).toISOString();
        await fetchEvents(ids, timeMin, timeMax);
      }
    }
    setLoading(false);
  }, [fetchCalendars, fetchEvents, currentDate, view, hiddenCalendarIds, setLoading]);

  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      loadData();
    }
  }, [loadData]);

  // Refresh events when view/date changes
  const prevRangeRef = useRef<string>("");
  useEffect(() => {
    if (!initialFetchDone.current || visibleCalendarIds.length === 0) return;
    const range = getViewRange(currentDate, view);
    const key = `${range.start.toISOString()}-${range.end.toISOString()}`;
    if (key === prevRangeRef.current) return;
    prevRangeRef.current = key;
    const timeMin = addDays(range.start, -7).toISOString();
    const timeMax = addDays(range.end, 7).toISOString();
    fetchEvents(visibleCalendarIds, timeMin, timeMax);
  }, [currentDate, view, visibleCalendarIds, fetchEvents]);

  // Auto-refresh every 90s
  useEffect(() => {
    if (connected !== true) return;
    const interval = setInterval(() => {
      if (visibleCalendarIds.length > 0) {
        const range = getViewRange(currentDate, view);
        const timeMin = addDays(range.start, -7).toISOString();
        const timeMax = addDays(range.end, 7).toISOString();
        fetchEvents(visibleCalendarIds, timeMin, timeMax);
      }
    }, 90_000);
    return () => clearInterval(interval);
  }, [connected, visibleCalendarIds, currentDate, view, fetchEvents]);

  // Navigation
  const navigate = useCallback((dir: 1 | -1) => {
    setCurrentDate((d) => {
      switch (view) {
        case "day": return addDays(d, dir);
        case "4day": return addDays(d, 4 * dir);
        case "week": return addDays(d, 7 * dir);
        case "month": {
          const next = new Date(d);
          next.setMonth(next.getMonth() + dir);
          return next;
        }
        case "agenda": return addDays(d, 7 * dir);
      }
    });
  }, [view]);

  const goToday = useCallback(() => setCurrentDate(startOfDay(new Date())), []);

  const handleToggleCalendar = useCallback((id: string) => {
    setHiddenCalendarIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveHiddenCals(next);
      return next;
    });
  }, []);

  // Event actions
  const handleEventClick = useCallback((ev: CalendarEvent, anchor: { top: number; left: number }) => {
    setPopoverEvent({ ev, anchor });
  }, []);

  const handleSlotClick = useCallback((date: Date) => {
    setCreateDefaultDate(date);
    setShowCreateModal(true);
  }, []);

  const handleCreate = useCallback(async (data: Parameters<typeof createEvent>[0]) => {
    try {
      await createEvent(data);
      setShowCreateModal(false);
      setCreateDefaultDate(null);
    } catch {
      setError("Creation echouee");
    }
  }, [createEvent, setError]);

  const handleUpdate = useCallback(async (data: Parameters<typeof createEvent>[0]) => {
    if (!modalEvent) return;
    try {
      await updateEvent(modalEvent.calendarId, modalEvent.id, {
        summary: data.summary,
        description: data.description,
        location: data.location,
        start: data.start,
        end: data.end,
        colorId: data.colorId,
      });
      setModalEvent(null);
    } catch {
      setError("Modification echouee");
    }
  }, [modalEvent, updateEvent, setError]);

  const handleDelete = useCallback(async (ev: CalendarEvent) => {
    try {
      await deleteEvent(ev.calendarId, ev.id);
      setPopoverEvent(null);
    } catch {
      setError("Suppression echouee");
    }
  }, [deleteEvent, setError]);

  const handleEventDrop = useCallback(async (ev: CalendarEvent, newStart: Date, newEnd: Date) => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Paris";
      await updateEvent(ev.calendarId, ev.id, {
        start: { dateTime: newStart.toISOString(), timeZone: tz },
        end: { dateTime: newEnd.toISOString(), timeZone: tz },
      });
    } catch {
      setError("Deplacement echoue");
    }
  }, [updateEvent, setError]);

  // Keyboard shortcuts
  useCalendarKeys({
    onToday: goToday,
    onViewDay: () => setView("day"),
    onViewWeek: () => setView("week"),
    onViewMonth: () => setView("month"),
    onViewAgenda: () => setView("agenda"),
    onPrev: () => navigate(-1),
    onNext: () => navigate(1),
    onCreate: () => { setCreateDefaultDate(new Date()); setShowCreateModal(true); },
    onClose: () => { setPopoverEvent(null); setModalEvent(null); setShowCreateModal(false); },
  });

  // Not connected
  if (connected === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--accent-blue-light)" }}>
          <Calendar size={26} className="text-accent-blue" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Connecte ton Google Agenda</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Va dans Reglages pour connecter ton compte.
          </p>
        </div>
        <a href="/reglages" className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent-blue text-white rounded-xl text-[13px] font-semibold hover:opacity-90">
          Aller aux reglages
        </a>
      </div>
    );
  }

  // Loading
  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={20} className="animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Error bar */}
      {error && (
        <div className="shrink-0 px-5 pt-2">
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl text-[12px]" style={{ background: "var(--accent-red-light)", color: "var(--accent-red)" }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-semibold">✕</button>
          </div>
        </div>
      )}

      {/* Header */}
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={setView}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        onToday={goToday}
        onCreate={() => { setCreateDefaultDate(new Date()); setShowCreateModal(true); }}
      />

      {/* Body */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Sidebar */}
        <CalendarSidebar
          currentDate={currentDate}
          calendars={calendars}
          hiddenCalendarIds={hiddenCalendarIds}
          onSelectDate={(d) => { setCurrentDate(d); setView("day"); }}
          onToggleCalendar={handleToggleCalendar}
        />

        {/* Calendar view */}
        <div className="flex-1 min-w-0 overflow-hidden" style={{ background: "var(--surface-1)" }}>
          {view === "day" && (
            <DayView
              currentDate={currentDate}
              events={visibleEvents}
              calendars={calendars}
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
              onEventDrop={handleEventDrop}
            />
          )}
          {view === "4day" && (
            <FourDayView
              currentDate={currentDate}
              events={visibleEvents}
              calendars={calendars}
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
              onEventDrop={handleEventDrop}
            />
          )}
          {view === "week" && (
            <WeekView
              currentDate={currentDate}
              events={visibleEvents}
              calendars={calendars}
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
              onEventDrop={handleEventDrop}
            />
          )}
          {view === "month" && (
            <MonthView
              currentDate={currentDate}
              events={visibleEvents}
              calendars={calendars}
              onEventClick={handleEventClick}
              onDayClick={(d) => { setCurrentDate(d); setView("day"); }}
            />
          )}
          {view === "agenda" && (
            <AgendaView
              currentDate={currentDate}
              events={visibleEvents}
              calendars={calendars}
              onEventClick={handleEventClick}
            />
          )}
        </div>
      </div>

      {/* Popover */}
      <AnimatePresence>
        {popoverEvent && (
          <EventPopover
            event={popoverEvent.ev}
            calendars={calendars}
            anchorRect={popoverEvent.anchor}
            onClose={() => setPopoverEvent(null)}
            onEdit={() => {
              setModalEvent(popoverEvent.ev);
              setPopoverEvent(null);
            }}
            onDelete={() => handleDelete(popoverEvent.ev)}
          />
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {modalEvent && (
          <EventModal
            event={modalEvent}
            calendars={calendars}
            onSave={handleUpdate}
            onClose={() => setModalEvent(null)}
          />
        )}
      </AnimatePresence>

      {/* Create modal */}
      <AnimatePresence>
        {showCreateModal && (
          <EventModal
            defaultDate={createDefaultDate || undefined}
            defaultEndDate={createDefaultDate ? new Date(createDefaultDate.getTime() + 60 * 60 * 1000) : undefined}
            calendars={calendars}
            onSave={handleCreate}
            onClose={() => { setShowCreateModal(false); setCreateDefaultDate(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
