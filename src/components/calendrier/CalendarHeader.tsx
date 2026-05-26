"use client";

import { ChevronLeft, ChevronRight, Plus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { CalendarView } from "./useCalendarEvents";

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onViewChange: (v: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onCreate: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const VIEW_LABELS: Record<CalendarView, string> = {
  day: "Jour",
  "4day": "4 Jours",
  week: "Semaine",
  month: "Mois",
  agenda: "Agenda",
};

function getTitle(date: Date, view: CalendarView): string {
  const opts: Intl.DateTimeFormatOptions = {};
  switch (view) {
    case "day":
      return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    case "4day":
      return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    case "week":
      return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    case "month":
      return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    case "agenda":
      return "Agenda";
  }
}

export default function CalendarHeader({ currentDate, view, onViewChange, onPrev, onNext, onToday, onCreate, isSidebarOpen = true, onToggleSidebar }: CalendarHeaderProps) {
  const title = getTitle(currentDate, view);
  
  return (
    <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b bg-[var(--surface-0)] z-20 relative" style={{ borderColor: "var(--border-primary)" }}>
      {/* Left section */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-md hover:bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            title={isSidebarOpen ? "Fermer le panneau latéral" : "Ouvrir le panneau latéral"}
          >
            {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        )}
        
        <button
          onClick={onToday}
          className="px-3 py-1.5 rounded-md text-[13px] font-medium transition-all text-[var(--text-primary)] hover:bg-[var(--surface-2)] border border-[var(--border-primary)]"
          title="Aujourd'hui (T)"
        >
          Aujourd&apos;hui
        </button>

        <div className="flex items-center">
          <button onClick={onPrev} className="p-1.5 rounded-md hover:bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all" title="Précédent">
            <ChevronLeft size={16} />
          </button>
          <button onClick={onNext} className="p-1.5 rounded-md hover:bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all" title="Suivant">
            <ChevronRight size={16} />
          </button>
        </div>

        <h1 className="text-[18px] font-semibold text-[var(--text-primary)] capitalize tracking-tight ml-2">
          {title}
        </h1>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        
        {/* View selector (Segmented control) */}
        <div
          className="flex items-center rounded-md p-0.5"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border-primary)" }}
        >
          {(["day", "4day", "week", "month", "agenda"] as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={
                "px-3 py-1 text-[12px] font-medium transition-all rounded-sm " +
                (v === view
                  ? "bg-[var(--surface-0)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")
              }
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>

        {/* Create button */}
        <button
          onClick={onCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold text-white transition-all shadow-sm hover:opacity-90 ml-1"
          style={{ background: "var(--accent-blue)" }}
          title="Créer un événement (C)"
        >
          <Plus size={16} />
          Créer
        </button>

      </div>
    </div>
  );
}
