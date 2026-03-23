"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar } from "lucide-react";

interface TimeBlock {
  hour: number;
  duration: number;
  label: string;
}

const EVENTS: TimeBlock[] = [
  { hour: 8,  duration: 1,   label: "Routine matinale" },
  { hour: 9,  duration: 2.5, label: "Deep Work" },
  { hour: 12, duration: 1,   label: "Déjeuner" },
  { hour: 14, duration: 1.5, label: "Emails & admin" },
  { hour: 16, duration: 2,   label: "Focus session" },
  { hour: 19, duration: 1,   label: "Récompense" },
];

const START_HOUR = 8;
const END_HOUR = 20;
const TOTAL_HOURS = END_HOUR - START_HOUR;

function pad(n: number) { return n.toString().padStart(2, "0"); }
function hourToPercent(h: number) { return ((h - START_HOUR) / TOTAL_HOURS) * 100; }

export default function TimelineColumn() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const currentHour = now.getHours() + now.getMinutes() / 60;
  const nowPercent = Math.min(100, Math.max(0, hourToPercent(currentHour)));
  const isInRange = currentHour >= START_HOUR && currentHour <= END_HOUR;

  return (
    <div className="flex flex-col h-full px-5 py-6 gap-5">
      {/* Header */}
      <div className="shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={12} style={{ color: "rgba(255,255,255,0.25)" }} />
          <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(255,255,255,0.2)" }}>Aujourd&apos;hui</span>
        </div>
        <p className="text-[15px] font-bold capitalize leading-tight tracking-tight" style={{ color: "rgba(255,255,255,0.85)" }}>
          {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <div className="flex items-center gap-2 mt-2.5">
          <div className="w-2 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.4)" }} />
          <p className="text-[12px] flex items-center gap-1.5 font-mono tabular-nums" style={{ color: "rgba(255,255,255,0.3)" }}>
            <Clock size={11} />
            {pad(now.getHours())}:{pad(now.getMinutes())}
          </p>
        </div>
      </div>

      {/* Timeline grid */}
      <div className="relative flex-1 min-h-0 overflow-hidden rounded-2xl p-0"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
      >
        {/* Hour markers */}
        {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
          const h = START_HOUR + i;
          const pct = (i / TOTAL_HOURS) * 100;
          return (
            <div key={h} className="absolute left-0 right-0 flex items-center gap-2" style={{ top: `${pct}%` }}>
              <span className="text-[9px] w-9 shrink-0 select-none font-mono text-right pr-1" style={{ color: "rgba(255,255,255,0.12)" }}>
                {pad(h)}h
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.03)" }} />
            </div>
          );
        })}

        {/* Event blocks — monochrome */}
        {EVENTS.map((ev, idx) => {
          const top = hourToPercent(ev.hour);
          const height = (ev.duration / TOTAL_HOURS) * 100;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: idx * 0.08, duration: 0.35, ease: "easeOut" as const }}
              whileHover={{ scale: 1.02, x: 2 }}
              className="absolute left-11 right-2 rounded-xl px-3 py-1.5 cursor-default"
              style={{
                top: `calc(${top}% + 2px)`,
                height: `calc(${height}% - 4px)`,
                background: "rgba(255,255,255,0.04)",
                borderLeft: "3px solid rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.04)",
                borderLeftWidth: "3px",
                borderLeftColor: "rgba(255,255,255,0.15)",
              }}
            >
              <p className="text-[11px] font-semibold leading-tight truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
                {ev.label}
              </p>
              {ev.duration > 1 && (
                <p className="text-[9px] mt-0.5 font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>
                  {ev.duration}h
                </p>
              )}
            </motion.div>
          );
        })}

        {/* Now indicator */}
        {isInRange && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute left-0 right-0 flex items-center gap-1 z-10 pointer-events-none"
            style={{ top: `${nowPercent}%` }}
          >
            <div className="relative ml-7">
              <div className="w-3 h-3 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.8)",
                  boxShadow: "0 0 12px rgba(255,255,255,0.4)",
                }}
              />
            </div>
            <div className="flex-1 h-[2px]"
              style={{
                background: "linear-gradient(to right, rgba(255,255,255,0.5), rgba(255,255,255,0.1), transparent 70%)",
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
