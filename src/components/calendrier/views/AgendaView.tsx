"use client";

import { useMemo } from "react";
import { Clock, MapPin } from "lucide-react";
import type { CalendarEvent, CalendarInfo } from "../useCalendarEvents";
import { getEventStart, getEventEnd, isAllDay, formatTime, getEventColor, isSameDay, addDays, startOfDay } from "../useCalendarEvents";

interface AgendaViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  calendars: CalendarInfo[];
  onEventClick: (ev: CalendarEvent, rect: { top: number; left: number }) => void;
}

export default function AgendaView({ currentDate, events, calendars, onEventClick }: AgendaViewProps) {
  const today = useMemo(() => startOfDay(new Date()), []);

  // Group events by day for next 30 days
  const grouped = useMemo(() => {
    const groups: { day: Date; events: CalendarEvent[] }[] = [];
    const start = startOfDay(currentDate);

    for (let i = 0; i < 30; i++) {
      const day = addDays(start, i);
      const dayEvents = events
        .filter((ev) => {
          const evStart = getEventStart(ev);
          if (isAllDay(ev)) {
            const evEnd = getEventEnd(ev);
            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(day);
            dayEnd.setHours(23, 59, 59, 999);
            return evStart <= dayEnd && evEnd > dayStart;
          }
          return isSameDay(evStart, day);
        })
        .sort((a, b) => getEventStart(a).getTime() - getEventStart(b).getTime());

      if (dayEvents.length > 0) {
        groups.push({ day, events: dayEvents });
      }
    }
    return groups;
  }, [currentDate, events]);

  if (grouped.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[14px] text-[var(--text-secondary)]">Aucun evenement dans les 30 prochains jours</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto py-4 px-6">
        {grouped.map(({ day, events: dayEvents }) => {
          const isToday = isSameDay(day, today);
          return (
            <div key={day.toISOString()} className="mb-6">
              {/* Day header */}
              <div className="flex items-center gap-3 mb-2 sticky top-0 py-2 z-10" style={{ background: "var(--background)" }}>
                <span
                  className={
                    "text-[24px] font-bold leading-none " +
                    (isToday ? "text-[var(--accent-blue)]" : "text-[var(--text-primary)]")
                  }
                >
                  {day.getDate()}
                </span>
                <div>
                  <div
                    className={
                      "text-[12px] font-semibold uppercase tracking-wider " +
                      (isToday ? "text-[var(--accent-blue)]" : "text-[var(--text-secondary)]")
                    }
                  >
                    {day.toLocaleDateString("fr-FR", { weekday: "long" })}
                  </div>
                  <div className="text-[11px] text-[var(--text-tertiary)]">
                    {day.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                  </div>
                </div>
                {isToday && (
                  <span
                    className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "var(--accent-blue-light)", color: "var(--accent-blue)" }}
                  >
                    Aujourd&apos;hui
                  </span>
                )}
              </div>

              {/* Events */}
              <div className="space-y-1.5 pl-2">
                {dayEvents.map((ev) => {
                  const color = getEventColor(ev, calendars);
                  const allDay = isAllDay(ev);
                  return (
                    <button
                      key={ev.id}
                      className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-[var(--surface-2)] group cursor-pointer"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        onEventClick(ev, { top: rect.top, left: rect.right });
                      }}
                    >
                      <span className="w-3 h-3 rounded mt-0.5 shrink-0" style={{ background: color }} />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13.5px] font-medium text-[var(--text-primary)] truncate">
                          {ev.summary || "(sans titre)"}
                        </h4>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-[11.5px] text-[var(--text-secondary)]">
                            <Clock size={10} />
                            {allDay ? "Toute la journee" : `${formatTime(getEventStart(ev))} – ${formatTime(getEventEnd(ev))}`}
                          </span>
                          {ev.location && (
                            <span className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] truncate">
                              <MapPin size={10} />
                              {ev.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
