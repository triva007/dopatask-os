"use client";

import { useMemo } from "react";
import type { CalendarEvent, CalendarInfo } from "../useCalendarEvents";
import { getEventStart, getEventEnd, isAllDay, formatTime, getEventColor, isSameDay, startOfMonth, startOfWeek, addDays } from "../useCalendarEvents";

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  calendars: CalendarInfo[];
  onEventClick: (ev: CalendarEvent, rect: { top: number; left: number }) => void;
  onDayClick: (date: Date) => void;
}

const MAX_VISIBLE_EVENTS = 3;

export default function MonthView({ currentDate, events, calendars, onEventClick, onDayClick }: MonthViewProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const weeks = useMemo(() => {
    const ms = startOfMonth(currentDate);
    const gridStart = startOfWeek(ms);
    const result: Date[][] = [];
    let day = gridStart;
    for (let w = 0; w < 6; w++) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(new Date(day));
        day = addDays(day, 1);
      }
      result.push(week);
    }
    return result;
  }, [currentDate]);

  function getEventsForDay(day: Date): CalendarEvent[] {
    return events.filter((ev) => {
      const start = getEventStart(ev);
      if (isAllDay(ev)) {
        const end = getEventEnd(ev);
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        return start <= dayEnd && end > dayStart;
      }
      return isSameDay(start, day);
    }).sort((a, b) => getEventStart(a).getTime() - getEventStart(b).getTime());
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Day headers */}
      <div className="shrink-0 grid grid-cols-7 border-b" style={{ borderColor: "var(--border-primary)" }}>
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <div key={d} className="text-center py-2 text-[10.5px] uppercase tracking-wider font-medium text-[var(--text-tertiary)]">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 min-h-0 grid grid-rows-6 overflow-hidden">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b" style={{ borderColor: "var(--border-primary)", minHeight: 0 }}>
            {week.map((day, di) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = isSameDay(day, today);
              const dayEvents = getEventsForDay(day);
              const visible = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
              const more = dayEvents.length - MAX_VISIBLE_EVENTS;

              return (
                <div
                  key={di}
                  className={
                    "border-l flex flex-col overflow-hidden cursor-pointer hover:bg-[var(--surface-2)] transition-all " +
                    (di === 0 ? "border-l-0 " : "")
                  }
                  style={{ borderColor: "var(--border-primary)" }}
                  onClick={() => onDayClick(day)}
                >
                  {/* Day number */}
                  <div className="shrink-0 px-1.5 pt-1">
                    <span
                      className={
                        "inline-flex items-center justify-center text-[12px] w-6 h-6 rounded-full font-medium " +
                        (isToday
                          ? "bg-[var(--accent-blue)] text-white"
                          : isCurrentMonth
                            ? "text-[var(--text-primary)]"
                            : "text-[var(--text-ghost)]")
                      }
                    >
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Events */}
                  <div className="flex-1 min-h-0 px-1 pb-0.5 space-y-px overflow-hidden">
                    {visible.map((ev) => {
                      const color = getEventColor(ev, calendars);
                      return (
                        <button
                          key={ev.id}
                          className="cal-event w-full text-left rounded px-1 py-px text-[10px] font-medium truncate transition-all hover:opacity-80"
                          style={{
                            background: isAllDay(ev) ? color : "transparent",
                            color: isAllDay(ev) ? "white" : color,
                            borderLeft: isAllDay(ev) ? "none" : `3px solid ${color}`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            onEventClick(ev, { top: rect.top, left: rect.right });
                          }}
                        >
                          {!isAllDay(ev) && (
                            <span className="text-[var(--text-tertiary)] mr-0.5">{formatTime(getEventStart(ev))}</span>
                          )}
                          {ev.summary || "(sans titre)"}
                        </button>
                      );
                    })}
                    {more > 0 && (
                      <div className="text-[9.5px] font-medium text-[var(--text-tertiary)] px-1">
                        +{more} autre{more > 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
