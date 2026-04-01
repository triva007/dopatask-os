"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const START_HOUR = 8;
const END_HOUR = 20;
const TOTAL_HOURS = END_HOUR - START_HOUR;

const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  orange: { bg: "var(--accent-orange-light)", border: "var(--accent-orange)", text: "var(--accent-orange)" },
  purple: { bg: "var(--accent-purple-light)", border: "var(--accent-purple)", text: "var(--accent-purple)" },
  green: { bg: "var(--accent-green-light)", border: "var(--accent-green)", text: "var(--accent-green)" },
  blue: { bg: "var(--accent-blue-light)", border: "var(--accent-blue)", text: "var(--accent-blue)" },
};

function pad(n: number) { return n.toString().padStart(2, "0"); }
function hourToPercent(h: number) { return ((h - START_HOUR) / TOTAL_HOURS) * 100; }

interface AddEventForm {
  hour: number;
  duration: number;
  label: string;
  color: "orange" | "purple" | "green" | "blue";
}

export default function TimelineColumn() {
  const [now, setNow] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState<AddEventForm>({
    hour: 12,
    duration: 1,
    label: "",
    color: "purple",
  });
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const timelineEvents = useAppStore((s) => s.timelineEvents);
  const addTimelineEvent = useAppStore((s) => s.addTimelineEvent);
  const deleteTimelineEvent = useAppStore((s) => s.deleteTimelineEvent);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowAddForm(false);
      }
    }
    if (showAddForm) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showAddForm]);

  const currentHour = now.getHours() + now.getMinutes() / 60;
  const nowPercent = Math.min(100, Math.max(0, hourToPercent(currentHour)));
  const isInRange = currentHour >= START_HOUR && currentHour <= END_HOUR;

  const handleAddEvent = () => {
    if (addFormData.label.trim()) {
      addTimelineEvent({
        hour: addFormData.hour,
        duration: addFormData.duration,
        label: addFormData.label,
        color: addFormData.color,
      });
      setAddFormData({ hour: 12, duration: 1, label: "", color: "purple" });
      setShowAddForm(false);
    }
  };

  return (
    <div className="flex flex-col h-full px-6 py-8 gap-6">
      {/* Header */}
      <div className="shrink-0">
        <p className="text-lg font-semibold text-t-primary capitalize leading-tight">
          {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
          <p className="text-xs text-t-secondary flex items-center gap-1.5">
            <Clock size={10} />
            {pad(now.getHours())}:{pad(now.getMinutes())}
          </p>
        </div>
      </div>

      {/* Timeline grid */}
      <div className="relative flex-1 min-h-0 overflow-hidden rounded-2xl px-8 py-8 bg-surface-0 border border-b-primary shadow-[inset_0_2px_10px_rgba(0,0,0,0.01)]">
        {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
          const h = START_HOUR + i;
          const pct = (i / TOTAL_HOURS) * 100;
          return (
            <div key={h} className="absolute left-0 right-0 flex items-center gap-2" style={{ top: `${pct}%` }}>
              <span className="text-[9px] text-t-tertiary w-9 shrink-0 select-none font-mono text-right pr-1">
                {pad(h)}h
              </span>
              <div className="flex-1 h-px bg-surface-4" />
            </div>
          );
        })}

        {/* Timeline events from store */}
        <AnimatePresence>
          {timelineEvents.map((ev, idx) => {
            const colors = COLOR_MAP[ev.color] || COLOR_MAP.purple;
            const top = hourToPercent(ev.hour);
            const height = (ev.duration / TOTAL_HOURS) * 100;
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ delay: idx * 0.06, duration: 0.3 }}
                className="absolute left-11 right-2 rounded-xl px-3 py-1.5 cursor-default hover:opacity-90 transition-opacity group"
                style={{
                  top: `calc(${top}% + 2px)`,
                  height: `calc(${height}% - 4px)`,
                  background: colors.bg,
                  borderLeft: `3px solid ${colors.border}`,
                }}
                onMouseEnter={() => setHoveredEventId(ev.id)}
                onMouseLeave={() => setHoveredEventId(null)}
              >
                <div className="flex items-start justify-between gap-2 h-full">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium leading-tight truncate" style={{ color: colors.text }}>
                      {ev.label}
                    </p>
                    {ev.duration > 1 && (
                      <p className="text-[9px] mt-0.5 opacity-70" style={{ color: colors.text }}>
                        {ev.duration}h
                      </p>
                    )}
                  </div>
                  {hoveredEventId === ev.id && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => deleteTimelineEvent(ev.id)}
                      className="shrink-0 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                      style={{ color: colors.text }}
                      title="Supprimer"
                    >
                      <X size={12} />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Current time indicator */}
        {isInRange && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute left-0 right-0 flex items-center gap-1 z-10 pointer-events-none"
            style={{ top: `${nowPercent}%` }}
          >
            <div className="w-2 h-2 rounded-full bg-accent-blue shrink-0 ml-8" style={{ boxShadow: "0 0 12px rgba(0,113,227,0.3)" }} />
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, rgba(0,113,227,0.3), transparent 80%)" }} />
          </motion.div>
        )}
      </div>

      {/* Add event button */}
      <div className="shrink-0 relative">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs font-medium text-t-secondary hover:text-t-primary transition-colors flex items-center gap-1"
        >
          + Ajouter
        </button>

        {/* Add event popover */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              ref={popoverRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full mb-2 left-0 bg-surface-0 border border-b-primary rounded-xl px-4 py-3 shadow-lg z-50 w-64"
            >
              <div className="space-y-3">
                {/* Label input */}
                <div>
                  <label className="text-[11px] font-medium text-t-secondary block mb-1">Libellé</label>
                  <input
                    type="text"
                    value={addFormData.label}
                    onChange={(e) => setAddFormData({ ...addFormData, label: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleAddEvent()}
                    placeholder="Ex: Réunion"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-surface-2 border border-surface-4 text-t-primary placeholder:text-t-tertiary focus:outline-none focus:border-accent-blue transition-colors"
                    autoFocus
                  />
                </div>

                {/* Hour selector */}
                <div>
                  <label className="text-[11px] font-medium text-t-secondary block mb-1">Heure</label>
                  <select
                    value={addFormData.hour}
                    onChange={(e) => setAddFormData({ ...addFormData, hour: parseInt(e.target.value) })}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-surface-2 border border-surface-4 text-t-primary focus:outline-none focus:border-accent-blue transition-colors"
                  >
                    {Array.from({ length: 12 }, (_, i) => START_HOUR + i).map((h) => (
                      <option key={h} value={h}>
                        {pad(h)}:00
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration selector */}
                <div>
                  <label className="text-[11px] font-medium text-t-secondary block mb-1">Durée</label>
                  <select
                    value={addFormData.duration}
                    onChange={(e) => setAddFormData({ ...addFormData, duration: parseFloat(e.target.value) })}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-surface-2 border border-surface-4 text-t-primary focus:outline-none focus:border-accent-blue transition-colors"
                  >
                    <option value={0.5}>30 min</option>
                    <option value={1}>1 h</option>
                    <option value={1.5}>1.5 h</option>
                    <option value={2}>2 h</option>
                    <option value={2.5}>2.5 h</option>
                    <option value={3}>3 h</option>
                  </select>
                </div>

                {/* Color picker */}
                <div>
                  <label className="text-[11px] font-medium text-t-secondary block mb-2">Couleur</label>
                  <div className="flex gap-2">
                    {(["orange", "purple", "green", "blue"] as const).map((colorKey) => {
                      const colorData = COLOR_MAP[colorKey];
                      return (
                        <button
                          key={colorKey}
                          onClick={() => setAddFormData({ ...addFormData, color: colorKey })}
                          className={`w-6 h-6 rounded-full transition-all ${
                            addFormData.color === colorKey ? "ring-2 ring-offset-2" : "hover:scale-110"
                          }`}
                          style={{
                            background: colorData.bg,
                            borderColor: colorData.border,
                            border: "2px solid",
                            boxShadow: `0 0 0 2px ${colorData.text}`,
                          }}
                          title={colorKey}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleAddEvent}
                    disabled={!addFormData.label.trim()}
                    className="flex-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-accent-blue text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    Ajouter
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-b-primary text-t-primary hover:bg-surface-2 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}