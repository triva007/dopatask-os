"use client";

import { useRef, useEffect } from "react";
import { X, MapPin, Clock, Trash2, Edit3 } from "lucide-react";
import { motion } from "framer-motion";
import type { CalendarEvent, CalendarInfo } from "./useCalendarEvents";
import { getEventStart, getEventEnd, isAllDay, formatTime, getEventColor } from "./useCalendarEvents";
import { useAppStore } from "@/store/useAppStore";

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
    const popoverWidth = 340;
    const popoverHeight = 300;

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
        className="w-[340px] rounded-[16px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          style={{ 
            background: "color-mix(in srgb, var(--surface-0) 85%, transparent)", 
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderColor: "var(--border-primary)", 
            boxShadow: "0 12px 32px rgba(0,0,0,0.2)" 
          }} 
          className="rounded-[16px] border overflow-hidden"
        >
          {/* Color bar */}
          <div className="h-1.5 w-full" style={{ background: color }} />

          <div className="p-4 pt-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="w-3.5 h-3.5 rounded mt-1.5 shrink-0 shadow-sm" style={{ background: color }} />
                <div className="min-w-0">
                  <h3 className="text-[18px] font-bold text-[var(--text-primary)] leading-snug break-words">
                    {event.summary || "(sans titre)"}
                  </h3>
                  <p className="text-[11.5px] font-medium text-[var(--text-tertiary)] mt-1">{calName}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all shrink-0">
                <X size={16} />
              </button>
            </div>

            {/* Time */}
            <div className="flex items-center gap-3 text-[13px] text-[var(--text-secondary)] font-medium mb-3">
              <Clock size={15} className="text-[var(--text-tertiary)] shrink-0" />
              {allDay ? (
                <span>Toute la journee — {start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</span>
              ) : (
                <span>
                  {start.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} · {formatTime(start)} – {formatTime(end)}
                </span>
              )}
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-start gap-3 text-[13px] text-[var(--text-secondary)] font-medium mb-3">
                <MapPin size={15} className="text-[var(--text-tertiary)] mt-0.5 shrink-0" />
                <span className="leading-snug break-words">{event.location}</span>
              </div>
            )}

            {/* Google Calendar Link */}
            {event.htmlLink && event.type !== "task" && (
              <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[12px] text-[var(--accent-blue)] hover:underline mt-1 mb-3 font-semibold">
                Ouvrir dans Google Agenda ↗
              </a>
            )}

            {(() => {
              const state = useAppStore.getState();
              const googleTaskProjects = state.googleTaskProjects || {};
              const googleEventProjects = state.googleEventProjects || {};
              const projectId = event.type === "task" 
                ? googleTaskProjects[event.id] 
                : googleEventProjects[event.id];
              if (!projectId) return null;
              const project = (state.projects || []).find(p => p.id === projectId);
              if (!project) return null;
              return (
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--surface-1)]/80 rounded-md text-[11.5px] font-semibold text-[var(--text-primary)] border border-[var(--border-primary)]/50">
                    {project.emoji} {project.name}
                  </span>
                </div>
              );
            })()}

            {/* Description preview */}
            {event.description && (
              <div className="mt-4 bg-[var(--surface-1)]/50 rounded-xl p-3 border" style={{ borderColor: "var(--border-primary)" }}>
                <p className="text-[12px] text-[var(--text-secondary)] whitespace-pre-wrap max-h-[140px] overflow-y-auto leading-relaxed custom-scrollbar">
                  {event.description}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-5 pt-4 border-t" style={{ borderColor: "var(--border-primary)" }}>
              <button
                onClick={onEdit}
                className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-xl text-[12.5px] font-semibold text-[var(--text-primary)] bg-[var(--surface-1)] border border-[var(--border-primary)] hover:bg-[var(--surface-2)] transition-all shadow-sm"
              >
                <Edit3 size={14} /> Modifier
              </button>
              <button
                onClick={() => { if (confirm("Supprimer cet evenement ?")) onDelete(); }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-semibold text-[var(--accent-red)] hover:bg-[var(--accent-red-light)] transition-all"
                title="Supprimer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
