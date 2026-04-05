"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar } from "lucide-react";

interface TimeBlock {
  hour: number;
  duration: number;
  label: string;
  color: string;
  gradient: string;
}

const EVENTS: TimeBlock[] = [
  { hour: 8,  duration: 1,   label: "Routine matinale", color: "#fbbf24", gradient: "from-amber-500/20 to-amber-500/5" },
  { hour: 9,  duration: 2.5, label: "Deep Work",        color: "#a78bfa", gradient: "from-violet-500/20 to-violet-500/5" },
  { hour: 12, duration: 1,   label: "Déjeuner",         color: "#4ade80", gradient: "from-green-500/20 to-green-500/5" },
  { hour: 14, duration: 1.5, label: "Emails & admin",   color: "#60a5fa", gradient: "from-blue-500/20 to-blue-500/5" },
  { hour: 16, duration: 2,   label: "Focus session",    color: "#a78bfa", gradient: "from-violet-500/20 to-violet-500/5" },
  { hour: 19, duration: 1,   label: "Récompense",       color: "#fbbf24", gradient: "from-amber-500/20 to-amber-500/5" },
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
    <div className="flex flex-col h-full px-5 py-6 gap-5 relative">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(251,191,36,0.04), transparent 70%)" }}
      />

      {/* Header */}
      <div className="shrink-0 relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={12} className="text-zinc-600" />
          <span className="text-[11px] text-zinc-600 uppercase tracking-widest font-medium">Aujourd&apos;hui</span>
        </div>
        <p className="text-base font-semibold text-zinc-100 capitalize leading-tight tracking-tight">
          {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <div className="flex items-center gap-2 mt-2.5">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-dopa-green" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-dopa-green animate-ping opacity-30" />
          </div>
          <p className="text-sm text-zinc-400 flex items-center gap-1.5 font-mono tabular-nums">
            <Clock size={10} />
            {pad(now.getHours())}:{pad(now.getMinutes())}
          </p>
        </div>
      </div>

      {/* Timeline grid */}
      <div className="relative flex-1 min-h-0 overflow-hidden rounded-2xl" style={{
        background: "rgba(255,255,255,0.015)",
        border: "1px solid rgba(255,255,255,0.04)",
        boxShadow: "var(--shadow-card), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}>
        {/* Hour markers */}
        {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
          const h = START_HOUR + i;
          const pct = (i / TOTAL_HOURS) * 100;
          return (
            <div key={h} className="absolute left-0 right-0 flex items-center gap-2" style={{ top: `${pct}%` }}>
              <span className="text-[10px] text-zinc-700 w-9 shrink-0 select-none font-mono text-right pr-1">
                {pad(h)}h
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.025)" }} />
            </div>
          );
        })}

        {/* Event blocks — 3D glass cards */}
        {EVENTS.map((ev, idx) => {
          const top = hourToPercent(ev.hour);
          const height = (ev.duration / TOTAL_HOURS) * 100;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -8, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: idx * 0.08, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="absolute left-11 right-2 rounded-xl px-3 py-1.5 cursor-default group"
              style={{
                top: `calc(${top}% + 2px)`,
                height: `calc(${height}% - 4px)`,
                background: `linear-gradient(135deg, ${ev.color}12, ${ev.color}05)`,
                borderLeft: `2.5px solid ${ev.color}80`,
                border: `1px solid ${ev.color}15`,
                borderLeftWidth: "2.5px",
                borderLeftColor: `${ev.color}80`,
                boxShadow: `0 2px 8px ${ev.color}08, inset 0 1px 0 rgba(255,255,255,0.03)`,
              }}
            >
              <p className="text-[11px] font-medium leading-tight truncate" style={{ color: `${ev.color}dd` }}>
                {ev.label}
              </p>
              {ev.duration > 1 && (
                <p className="text-xs mt-0.5 font-mono" style={{ color: `${ev.color}60` }}>
                  {ev.duration}h
                </p>
              )}
            </motion.div>
          );
        })}

        {/* Now indicator — glowing line */}
        {isInRange && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute left-0 right-0 flex items-center gap-1 z-10 pointer-events-none"
            style={{ top: `${nowPercent}%` }}
          >
            <div className="relative ml-7">
              <div className="w-2.5 h-2.5 rounded-full bg-white"
                style={{ boxShadow: "0 0 10px rgba(255,255,255,0.5), 0 0 20px rgba(255,255,255,0.2)" }}
              />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-white animate-ping opacity-20" />
            </div>
            <div className="flex-1 h-[1.5px]"
              style={{ background: "linear-gradient(to right, rgba(255,255,255,0.5), rgba(255,255,255,0.1), transparent 80%)" }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
