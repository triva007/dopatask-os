"use client";

import { useMemo, useRef, useCallback, useState } from "react";
import type { CalendarEvent, CalendarInfo } from "../useCalendarEvents";
import { getEventStart, getEventEnd, isAllDay, formatTime, getEventColor, isSameDay, addDays } from "../useCalendarEvents";

interface TimeGridProps {
  days: Date[];
  events: CalendarEvent[];
  calendars: CalendarInfo[];
  onEventClick: (ev: CalendarEvent, rect: { top: number; left: number }) => void;
  onSlotClick: (date: Date) => void;
  onEventDrop?: (ev: CalendarEvent, newStart: Date, newEnd: Date) => void;
}

const HOUR_HEIGHT = 60; // px per hour
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MIN_EVENT_HEIGHT = 18;

function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((ev) => {
    if (isAllDay(ev)) return false;
    const start = getEventStart(ev);
    return isSameDay(start, day);
  });
}

function getAllDayEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((ev) => {
    if (!isAllDay(ev)) return false;
    const start = getEventStart(ev);
    const end = getEventEnd(ev);
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    return start <= dayEnd && end > dayStart;
  });
}

function timeToY(d: Date): number {
  return (d.getHours() + d.getMinutes() / 60) * HOUR_HEIGHT;
}

// Compute overlapping columns for events
interface LayoutEvent {
  ev: CalendarEvent;
  top: number;
  height: number;
  col: number;
  totalCols: number;
}

function layoutEvents(events: CalendarEvent[]): LayoutEvent[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort((a, b) => getEventStart(a).getTime() - getEventStart(b).getTime());
  const layouts: LayoutEvent[] = [];
  const columns: { end: number }[][] = [];

  for (const ev of sorted) {
    const top = timeToY(getEventStart(ev));
    const rawH = timeToY(getEventEnd(ev)) - top;
    const height = Math.max(rawH, MIN_EVENT_HEIGHT);

    // Find first column where this event doesn't overlap
    let placed = false;
    for (let g = 0; g < columns.length; g++) {
      const group = columns[g];
      let col = -1;
      for (let c = 0; c < group.length; c++) {
        if (group[c].end <= top) {
          col = c;
          break;
        }
      }
      if (col === -1) {
        col = group.length;
      }
      if (col < group.length) {
        group[col] = { end: top + height };
      } else {
        group.push({ end: top + height });
      }
      layouts.push({ ev, top, height, col, totalCols: group.length });
      placed = true;
      break;
    }

    if (!placed) {
      columns.push([{ end: top + height }]);
      layouts.push({ ev, top, height, col: 0, totalCols: 1 });
    }
  }

  // Update totalCols for all events in same group
  // Simple approach: overlapping events share column count
  for (let i = 0; i < layouts.length; i++) {
    let maxCols = layouts[i].totalCols;
    for (let j = 0; j < layouts.length; j++) {
      if (i === j) continue;
      const iEnd = layouts[i].top + layouts[i].height;
      const jEnd = layouts[j].top + layouts[j].height;
      if (layouts[i].top < jEnd && layouts[j].top < iEnd) {
        maxCols = Math.max(maxCols, layouts[j].col + 1, layouts[i].col + 1);
      }
    }
    layouts[i].totalCols = maxCols;
  }

  return layouts;
}

export default function TimeGrid({ days, events, calendars, onEventClick, onSlotClick, onEventDrop }: TimeGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [dragEvent, setDragEvent] = useState<{ ev: CalendarEvent; startY: number; origTop: number; offsetY: number } | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const nowY = useMemo(() => {
    const now = new Date();
    return timeToY(now);
  }, []);

  const isMultiDay = days.length > 1;

  const handleGridClick = useCallback((dayIndex: number, e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".cal-event")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const hour = Math.floor(y / HOUR_HEIGHT);
    const minutes = Math.round(((y % HOUR_HEIGHT) / HOUR_HEIGHT) * 60 / 15) * 15;
    const d = new Date(days[dayIndex]);
    d.setHours(hour, minutes, 0, 0);
    onSlotClick(d);
  }, [days, onSlotClick]);

  // Drag handlers
  const handleMouseDown = useCallback((ev: CalendarEvent, e: React.MouseEvent) => {
    if (!onEventDrop) return;
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragEvent({
      ev,
      startY: e.clientY,
      origTop: timeToY(getEventStart(ev)),
      offsetY: e.clientY - rect.top,
    });
  }, [onEventDrop]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragEvent || !gridRef.current) return;
    // Visual feedback handled with CSS
  }, [dragEvent]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!dragEvent || !gridRef.current || !onEventDrop) {
      setDragEvent(null);
      return;
    }
    if (Math.abs(e.clientY - dragEvent.startY) < 5) {
      setDragEvent(null);
      return;
    }
    const gridRect = gridRef.current.getBoundingClientRect();
    const y = e.clientY - gridRect.top - dragEvent.offsetY;
    const hour = Math.floor(y / HOUR_HEIGHT);
    const minutes = Math.round(((y % HOUR_HEIGHT) / HOUR_HEIGHT) * 60 / 15) * 15;

    const origStart = getEventStart(dragEvent.ev);
    const origEnd = getEventEnd(dragEvent.ev);
    const duration = origEnd.getTime() - origStart.getTime();

    const newStart = new Date(origStart);
    newStart.setHours(hour, minutes, 0, 0);
    const newEnd = new Date(newStart.getTime() + duration);

    onEventDrop(dragEvent.ev, newStart, newEnd);
    setDragEvent(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragEvent, onEventDrop]);

  // Get all-day events for header
  const allDayRows = days.map((day) => getAllDayEventsForDay(events, day));
  const hasAllDay = allDayRows.some((r) => r.length > 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* All-day section */}
      {hasAllDay && (
        <div className="shrink-0 flex border-b" style={{ borderColor: "var(--border-primary)" }}>
          {/* Time gutter */}
          <div className="shrink-0 w-[52px] text-right pr-2 py-1">
            <span className="text-[10px] text-[var(--text-tertiary)]">j. entier</span>
          </div>
          {/* Day columns */}
          {days.map((day, di) => (
            <div
              key={di}
              className="flex-1 min-w-0 flex flex-wrap gap-1 p-1 border-l"
              style={{ borderColor: "var(--border-primary)" }}
            >
              {allDayRows[di].map((ev) => {
                const color = getEventColor(ev, calendars);
                const isTask = ev.type === "task";
                return (
                  <button
                    key={ev.id}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      onEventClick(ev, { top: rect.top, left: rect.right });
                    }}
                    className="cal-event flex items-center gap-1.5 text-left px-1.5 py-0.5 rounded-[4px] text-[11px] font-semibold truncate max-w-full transition-all hover:opacity-90"
                    style={{
                      background: isTask ? color : `${color}30`,
                      color: isTask ? "#fff" : color,
                    }}
                  >
                    {isTask && (
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 border-2" style={{ borderColor: 'currentColor' }} />
                    )}
                    <span className="truncate">{ev.summary || "(sans titre)"}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Day headers (multi-day only) */}
      {isMultiDay && (
        <div className="shrink-0 flex border-b" style={{ borderColor: "var(--border-primary)" }}>
          <div className="shrink-0 w-[52px]" />
          {days.map((day, i) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={i}
                className="flex-1 min-w-0 text-center py-2 border-l"
                style={{ borderColor: "var(--border-primary)" }}
              >
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-medium">
                  {day.toLocaleDateString("fr-FR", { weekday: "short" })}
                </div>
                <div
                  className={
                    "text-[20px] font-semibold leading-tight mt-0.5 " +
                    (isToday
                      ? "text-white bg-[var(--accent-blue)] w-9 h-9 rounded-full flex items-center justify-center mx-auto"
                      : "text-[var(--text-primary)]")
                  }
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Time grid */}
      <div
        ref={gridRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="flex" style={{ height: 24 * HOUR_HEIGHT }}>
          {/* Time labels */}
          <div className="shrink-0 w-[52px] relative">
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute right-2 text-[10px] text-[var(--text-tertiary)] tabular-nums"
                style={{ top: h * HOUR_HEIGHT - 6 }}
              >
                {h > 0 && `${String(h).padStart(2, "0")}:00`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, di) => {
            const dayEvents = getEventsForDay(events, day);
            const laid = layoutEvents(dayEvents);
            const isToday = isSameDay(day, today);

            return (
              <div
                key={di}
                className="flex-1 min-w-0 relative border-l"
                style={{ borderColor: "var(--border-primary)" }}
                onClick={(e) => handleGridClick(di, e)}
              >
                {/* Hour lines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t"
                    style={{ top: h * HOUR_HEIGHT, borderColor: "var(--border-primary)" }}
                  />
                ))}

                {/* Half-hour lines */}
                {HOURS.map((h) => (
                  <div
                    key={`half-${h}`}
                    className="absolute left-0 right-0 border-t"
                    style={{ top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2, borderColor: "var(--border-primary)", opacity: 0.4 }}
                  />
                ))}

                {/* Now indicator */}
                {isToday && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: nowY }}
                  >
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-full -ml-1.5" style={{ background: "var(--accent-red)" }} />
                      <div className="flex-1 h-[2px]" style={{ background: "var(--accent-red)" }} />
                    </div>
                  </div>
                )}

                {/* Events */}
                {laid.map((l) => {
                  const color = getEventColor(l.ev, calendars);
                  const isTask = l.ev.type === "task";
                  const colWidth = 100 / l.totalCols;
                  return (
                    <button
                      key={l.ev.id}
                      className="cal-event absolute rounded-[4px] text-left overflow-hidden transition-all hover:opacity-90 group cursor-pointer"
                      style={{
                        top: l.top,
                        height: Math.max(l.height, MIN_EVENT_HEIGHT),
                        left: `calc(${l.col * colWidth}% + 1px)`,
                        width: `calc(${colWidth}% - 2px)`,
                        background: isTask ? `var(--card-bg)` : `${color}25`,
                        border: isTask ? `1px solid var(--card-border)` : `1px solid ${color}40`,
                        borderLeft: `3px solid ${color}`,
                        zIndex: 10,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        onEventClick(l.ev, { top: rect.top, left: rect.right });
                      }}
                      onMouseDown={(e) => handleMouseDown(l.ev, e)}
                    >
                      <div className="px-1.5 py-0.5 h-full flex flex-col justify-start min-h-0">
                        <div className="flex items-start gap-1">
                          <span className="text-[11.5px] font-semibold leading-tight truncate" style={{ color: isTask ? "var(--text-primary)" : color }}>
                            {l.ev.summary || "(sans titre)"}
                          </span>
                        </div>
                        {l.height > 25 && (
                          <span className="text-[10px] opacity-80 mt-0.5 leading-none" style={{ color: isTask ? "var(--text-secondary)" : color }}>
                            {formatTime(getEventStart(l.ev))} – {formatTime(getEventEnd(l.ev))}
                          </span>
                        )}

                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
