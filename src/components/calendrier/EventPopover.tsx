"use client";

import { useRef, useEffect } from "react";
import { X, MapPin, Clock, Trash2, Edit3 } from "lucide-react";
import { motion } from "framer-motion";
import type { CalendarEvent, CalendarInfo } from "./useCalendarEvents";
import { getEventStart, getEventEnd, isAllDay, formatTime, getEventColor } from "./useCalendarEvents";

interface EventPopoverProps {
  event: CalendarEvent;
  calendars: CalendarInfo[];
  anchorRect?: { top: number; left: number };
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function EventPopover({ event, calendars, anchorRect, onClose, onEdit, onDelete }: EventPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const color = getEventColor(event, calendars);
  const start = getEventStart(event);
  const end = getEventEnd(event);
  const allDay = isAllDay(event);
  const calName = calendars.find((c) => c.id === event.calendarId)?.summary || "";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const style: React.CSSProperties = {
    position: "fixed",
    zIndex: 60,
  };

  if (anchorRect) {
    const viewHeight = window.innerHeight;
    const viewWidth = window.innerWidth;
    const popoverWidth = 320;
    const popoverHeight = 280;

    let top = anchorRect.top;
    let left = anchorRect.left + 8;

    if (left + popoverWidth > viewWidth) left = anchorRect.left - popoverWidth - 8;
    if (top + popoverHeight > viewHeight) top = viewHeight - popoverHeight - 16;
    if (top < 16) top = 16;

    style.top = top;
    style.left = left;
  } else {
    style.top = "50%";
    style.left = "50%";
    style.transform = "translate(-50%, -50%)";
  }

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.12 }}
        style={style}
        className="w-[320px] rounded-2xl border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", boxShadow: "var(--shadow-elevated)" }} className="rounded-2xl border overflow-hidden">
          {/* Color bar */}
          <div className="h-1.5" style={{ background: color }} />

          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <span className="w-3 h-3 rounded mt-1 shrink-0" style={{ background: color }} />
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-[var(--text-primary)] leading-snug break-words">
                    {event.summary || "(sans titre)"}
                  </h3>
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{calName}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--surface-3)] text-[var(--text-tertiary)] transition-all shrink-0">
                <X size={14} />
              </button>
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-[12.5px] text-[var(--text-secondary)] mb-2">
              <Clock size={13} className="text-[var(--text-tertiary)] shrink-0" />
              {allDay ? (
                <span>Toute la journee — {start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</span>
              ) : (
                <span>
                  {start.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · {formatTime(start)} – {formatTime(end)}
                </span>
              )}
            </div>

            {/* Location */}


            {/* Description preview */}
            {event.description && (
              <p className="text-[12px] text-[var(--text-tertiary)] mt-2 line-clamp-3 leading-relaxed">
                {event.description}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t" style={{ borderColor: "var(--border-primary)" }}>
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-all"
              >
                <Edit3 size={12} /> Modifier
              </button>
              <button
                onClick={() => { if (confirm("Supprimer cet evenement ?")) onDelete(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium text-[var(--accent-red)] hover:bg-[var(--accent-red-light)] transition-all"
              >
                <Trash2 size={12} /> Supprimer
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
