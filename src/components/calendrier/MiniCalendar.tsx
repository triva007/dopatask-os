"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { startOfMonth, startOfWeek, addDays, isSameDay } from "./useCalendarEvents";

interface MiniCalendarProps {
  currentDate: Date;
  onSelectDate: (d: Date) => void;
}

const DAYS = ["L", "M", "M", "J", "V", "S", "D"];

export default function MiniCalendar({ currentDate, onSelectDate }: MiniCalendarProps) {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(currentDate));

  const weeks = useMemo(() => {
    const first = startOfWeek(viewMonth);
    const result: Date[][] = [];
    let day = first;
    for (let w = 0; w < 6; w++) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(new Date(day));
        day = addDays(day, 1);
      }
      result.push(week);
    }
    return result;
  }, [viewMonth]);

  const today = new Date();

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2 px-1">
        <button
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
          className="p-1 rounded-lg hover:bg-[var(--surface-3)] text-[var(--text-secondary)] transition-all"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-[12.5px] font-semibold text-[var(--text-primary)]">
          {viewMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
          className="p-1 rounded-lg hover:bg-[var(--surface-3)] text-[var(--text-secondary)] transition-all"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-[var(--text-tertiary)] py-1">
            {d}
          </div>
        ))}
        {weeks.flat().map((day, i) => {
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, currentDate);
          const isCurrentMonth = day.getMonth() === viewMonth.getMonth();

          return (
            <button
              key={i}
              onClick={() => onSelectDate(day)}
              className={
                "w-full aspect-square flex items-center justify-center text-[11px] rounded-full transition-all " +
                (isSelected
                  ? "bg-[var(--accent-blue)] text-white font-semibold "
                  : isToday
                    ? "bg-[var(--accent-blue-light)] text-[var(--accent-blue)] font-semibold "
                    : isCurrentMonth
                      ? "text-[var(--text-primary)] hover:bg-[var(--surface-3)] "
                      : "text-[var(--text-ghost)] hover:bg-[var(--surface-3)] ")
              }
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
