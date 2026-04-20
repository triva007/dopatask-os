"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const START_HOUR = 8;
const END_HOUR = 20;
const TOTAL_HOURS = END_HOUR - START_HOUR;

const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  orange: { bg: "var(--accent-orange-light)", border: "var(--accent-orange)", text: "var(--accent-orange)" },
  purple: { bg: "var(--accent-purple-light)", border: "var(--accent-purple)", text: "var(--accent-purple)" },
  green:  { bg: "var(--accent-green-light)",  border: "var(--accent-green)",  text: "var(--accent-green)"  },
  blue:   { bg: "var(--accent-blue-light)",   border: "var(--accent-blue)",   text: "var(--accent-blue)"   },
};

function pad(n: number) { return n.toString().padStart(2, "0"); }
function hourToPercent(h: number) { return ((h - START_HOUR) / TOTAL_HOURS) * 100; }

interface AddEventForm {
  hour: number;
  duration: number;
  label: string;
  color: "orange" | "purple" | "green" | "blue";
}

export default function DayPanel() {
  const [now, setNow] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormData, setAddFormData] = useState<AddEventForm>({
    hour: 12, duration: 1, label: "", color: "purple",
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
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
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
    <div className="flex flex-col h-full px-8 pt-8 pb-5 gap-6">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight leading-none">
          {now.toLocaleDateString("fr-FR", { weekday: "long" })}
        </h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-2">
          {now.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} · {pad(now.getHours())}:{pad(now.getMinutes())}
          <span className="mx-2 text-[var(--text-ghost)]">·</span>
          Bloc horaire
        </p>
      </div>

      {/* Timeline */}
      <div className="relative flex-1 min-h-0 overflow-hidden rounded-xl px-4 py-4" style={{ background: "var(--surface-1)", boxShadow: "inset 0 0 0 1px var(--border-primary)" }}>
        {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
          const h = START_HOUR + i;
          const pct = (i / TOTAL_HOURS) * 100;
          return (
            <div key={h} className="absolute left-0 right-0 flex items-center gap-2" style={{ top: `${pct}%` }}>
              <span className="text-[9px] text-t-tertiary w-9 shrink-0 select-none font-medium tabular-nums text-right pr-1">
                {pad(h)}h
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--border-primary)" }} />
            </div>
          );
        })}

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
                transition={{ delay: idx * 0.04, duration: 0.3 }}
                className="absolute left-11 right-2 rounded-xl px-2.5 py-1.5 cursor-default hover:opacity-90 transition-opacity group"
                style={{
                  top: `calc(${top}% + 2px)`,
                  height: `calc(${height}% - 4px)`,
                  background: colors.bg,
                  borderLeft: `2px solid ${colors.border}`,
                }}
                onMouseEnter={() => setHoveredEventId(ev.id)}
                onMouseLeave={() => setHoveredEventId(null)}
              >
                <div className="flex items-start justify-between gap-2 h-full">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium leading-tight truncate" style={{ color: colors.text }}>
                      {ev.label}
                    </p>
                    {ev.duration > 1 && (
                      <p className="text-[9px] mt-0.5 opacity-70 tabular-nums" style={{ color: colors.text }}>
                        {ev.duration}h
                      </p>
                    )}
                  </div>
                  {hoveredEventId === ev.id && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => deleteTimelineEvent(ev.id)}
                      className="shrink-0 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                      style={{ color: colors.text }}
                    >
                      <X size={11} />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isInRange && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute left-0 right-0 flex items-center gap-1 z-10 pointer-events-none"
            style={{ top: `${nowPercent}%` }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0 ml-8 animate-breathe"
              style={{ background: "var(--accent-blue)" }}
            />
            <div className="flex-1 h-px" style={{ background: "var(--accent-blue)" }} />
          </motion.div>
        )}
      </div>

      {/* Add event */}
      <div className="shrink-0 relative">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full flex items-center justify-center gap-1.5 h-9 rounded-xl text-[12.5px] font-medium transition-colors"
          style={{
            background: "var(--accent-blue-light)",
            color: "var(--accent-blue)",
            border: "1px solid color-mix(in srgb, var(--accent-blue) 25%, transparent)",
          }}
        >
          <Plus size={13} strokeWidth={2} />
          Ajouter un bloc
        </button>

        <AnimatePresence>
          {showAddForm && (
            <motion.div
              ref={popoverRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="absolute bottom-full mb-2 left-0 right-0 bg-[var(--card-bg)] border border-[var(--border-primary)] rounded-xl px-4 py-4 z-50"
              style={{ boxShadow: "var(--shadow-elevated)" }}
            >
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-medium tracking-wider uppercase text-[var(--text-tertiary)] block mb-1.5">Libellé</label>
                  <input
                    type="text"
                    value={addFormData.label}
                    onChange={(e) => setAddFormData({ ...addFormData, label: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleAddEvent()}
                    placeholder="Ex: Réunion"
                    className="w-full text-[13px] px-3.5 py-2.5 rounded-xl bg-[var(--card-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none transition-colors"
                    style={{ border: "1px solid var(--accent-blue)", boxShadow: "0 0 0 3px var(--accent-blue-light)" }}
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-medium tracking-wider uppercase text-[var(--text-tertiary)] block mb-1.5">Heure</label>
                    <select
                      value={addFormData.hour}
                      onChange={(e) => setAddFormData({ ...addFormData, hour: parseInt(e.target.value) })}
                      className="w-full text-[12px] px-3 py-2.5 rounded-xl bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none"
                      style={{ border: "1px solid var(--border-primary)" }}
                    >
                      {Array.from({ length: 12 }, (_, i) => START_HOUR + i).map((h) => (
                        <option key={h} value={h}>{pad(h)}:00</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium tracking-wider uppercase text-[var(--text-tertiary)] block mb-1.5">Durée</label>
                    <select
                      value={addFormData.duration}
                      onChange={(e) => setAddFormData({ ...addFormData, duration: parseFloat(e.target.value) })}
                      className="w-full text-[12px] px-3 py-2.5 rounded-xl bg-[var(--card-bg)] text-[var(--text-primary)] focus:outline-none"
                      style={{ border: "1px solid var(--border-primary)" }}
                    >
                      <option value={0.5}>30 min</option>
                      <option value={1}>1 h</option>
                      <option value={1.5}>1.5 h</option>
                      <option value={2}>2 h</option>
                      <option value={3}>3 h</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-medium tracking-wider uppercase text-[var(--text-tertiary)] block mb-2">Couleur</label>
                  <div className="flex gap-2">
                    {(["orange", "purple", "green", "blue"] as const).map((colorKey) => {
                      const colorData = COLOR_MAP[colorKey];
                      return (
                        <button
                          key={colorKey}
                          onClick={() => setAddFormData({ ...addFormData, color: colorKey })}
                          className="flex-1 h-7 rounded-lg transition-all"
                          style={{
                            background: colorData.bg,
                            border: addFormData.color === colorKey
                              ? `2px solid ${colorData.text}`
                              : "1px solid var(--border-primary)",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleAddEvent}
                  disabled={!addFormData.label.trim()}
                  className="w-full h-9 text-[12.5px] font-medium px-3 py-2.5 rounded-xl border transition-colors hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: "var(--accent-blue-light)",
                    color: "var(--accent-blue)",
                    borderColor: "color-mix(in srgb, var(--accent-blue) 25%, transparent)",
                    opacity: !addFormData.label.trim() ? 0.5 : 1,
                    cursor: !addFormData.label.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  Ajouter
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
