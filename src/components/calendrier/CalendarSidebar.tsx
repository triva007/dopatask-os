"use client";

import { Eye, EyeOff } from "lucide-react";
import MiniCalendar from "./MiniCalendar";
import type { CalendarInfo } from "./useCalendarEvents";

interface CalendarSidebarProps {
  currentDate: Date;
  calendars: CalendarInfo[];
  hiddenCalendarIds: Set<string>;
  onSelectDate: (d: Date) => void;
  onToggleCalendar: (id: string) => void;
}

export default function CalendarSidebar({
  currentDate,
  calendars,
  hiddenCalendarIds,
  onSelectDate,
  onToggleCalendar,
}: CalendarSidebarProps) {
  return (
    <div
      className="shrink-0 w-[220px] h-full flex flex-col border-r overflow-y-auto"
      style={{ borderColor: "var(--border-primary)", background: "var(--surface-0)" }}
    >
      {/* Mini calendar */}
      <div className="px-3 pt-4 pb-3">
        <MiniCalendar currentDate={currentDate} onSelectDate={onSelectDate} />
      </div>

      {/* Divider */}
      <div className="mx-3 divider-soft" />

      {/* Calendar list */}
      <div className="px-3 pt-3 pb-4">
        <h3 className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-tertiary)] mb-2 px-1">
          Mes calendriers
        </h3>
        <div className="space-y-0.5">
          {calendars.map((cal) => {
            const hidden = hiddenCalendarIds.has(cal.id);
            return (
              <button
                key={cal.id}
                onClick={() => onToggleCalendar(cal.id)}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-[var(--surface-3)] transition-all text-left group"
              >
                <span
                  className="w-3 h-3 rounded shrink-0 transition-all"
                  style={{
                    background: hidden ? "transparent" : cal.backgroundColor,
                    border: hidden ? `2px solid var(--text-ghost)` : `2px solid ${cal.backgroundColor}`,
                  }}
                />
                <span
                  className={
                    "flex-1 text-[12px] truncate " +
                    (hidden ? "text-[var(--text-tertiary)] line-through" : "text-[var(--text-primary)]")
                  }
                >
                  {cal.summary}
                </span>
                <span className="opacity-0 group-hover:opacity-100 transition-all">
                  {hidden ? (
                    <EyeOff size={11} className="text-[var(--text-tertiary)]" />
                  ) : (
                    <Eye size={11} className="text-[var(--text-tertiary)]" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
