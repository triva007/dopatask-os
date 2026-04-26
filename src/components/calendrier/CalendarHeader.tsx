"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { CalendarView } from "./useCalendarEvents";

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onCreate: () => void;
}

const VIEW_LABELS: Record<CalendarView, string> = {
  day: "Jour",
  "4day": "4 jours",
  week: "Semaine",
  month: "Mois",
  agenda: "Agenda",
};

function getTitle(date: Date, view: CalendarView): string {
  const opts: Intl.DateTimeFormatOptions = {};
  switch (view) {
    case "day":
      return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    case "4day":
      return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    case "week":
      opts.month = "long";
      opts.year = "numeric";
      return date.toLocaleDateString("fr-FR", opts);
    case "month":
      return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    case "agenda":
      return "Agenda";
  }
}

export default function CalendarHeader({ currentDate, view, onViewChange, onPrev, onNext, onToday, onCreate }: CalendarHeaderProps) {
  return (
    <div className="shrink-0 flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: "var(--border-primary)" }}>
      {/* Create button */}
      <button
        onClick={onCreate}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-semibold transition-all hover:shadow-md"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border-secondary)",
          color: "var(--text-primary)",
          boxShadow: "var(--card-shadow)",
        }}
      >
        <Plus size={18} style={{ color: "var(--accent-blue)" }} />
        Creer
      </button>

      {/* Nav */}
      <button
        onClick={onToday}
        className="px-3 py-1.5 rounded-xl text-[12.5px] font-medium border transition-all hover:bg-[var(--surface-3)]"
        style={{ borderColor: "var(--border-secondary)", color: "var(--text-primary)" }}
      >
        Aujourd&apos;hui
      </button>
      <div className="flex items-center gap-1">
        <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-[var(--surface-3)] text-[var(--text-secondary)] transition-all">
          <ChevronLeft size={16} />
        </button>
        <button onClick={onNext} className="p-1.5 rounded-lg hover:bg-[var(--surface-3)] text-[var(--text-secondary)] transition-all">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Title */}
      <h1 className="text-[17px] font-semibold text-[var(--text-primary)] capitalize tracking-tight flex-1">
        {getTitle(currentDate, view)}
      </h1>

      {/* View selector */}
      <div
        className="flex items-center rounded-xl overflow-hidden border"
        style={{ borderColor: "var(--border-secondary)", background: "var(--surface-2)" }}
      >
        {(["day", "4day", "week", "month", "agenda"] as CalendarView[]).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={
              "px-3 py-1.5 text-[11.5px] font-medium transition-all " +
              (v === view
                ? "bg-[var(--accent-blue)] text-white"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)]")
            }
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>
    </div>
  );
}
