"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

interface TimeBlock {
  hour: number;
  duration: number;
  label: string;
  color: string;
}

const EVENTS: TimeBlock[] = [
  { hour: 8,  duration: 1,   label: "Routine matinale", color: "rgba(251,191,36,0.5)" },
  { hour: 9,  duration: 2.5, label: "Deep Work",        color: "rgba(167,139,250,0.5)" },
  { hour: 12, duration: 1,   label: "Déjeuner",         color: "rgba(74,222,128,0.5)" },
  { hour: 14, duration: 1.5, label: "Emails & admin",   color: "rgba(147,197,253,0.5)" },
  { hour: 16, duration: 2,   label: "Focus session",    color: "rgba(167,139,250,0.5)" },
  { hour: 19, duration: 1,   label: "Récompense",       color: "rgba(251,191,36,0.5)" },
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
        <p className="text-sm font-medium text-zinc-200 capitalize leading-tight">
          {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
          <p className="text-xs text-zinc-500 flex items-center gap-1.5">
            <Clock size={10} />
            {pad(now.getHours())}:{pad(now.getMinutes())}
          </p>
        </div>
      </div>

      {/* Timeline grid */}
      <div className="relative flex-1 min-h-0 overflow-hidden rounded-2xl" style={{ background: "rgba(255,255,255,0.02)" }}>
        {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
          const h = START_HOUR + i;
          const pct = (i / TOTAL_HOURS) * 100;
          return (
            <div key={h} className="absolute left-0 right-0 flex items-center gap-2" style={{ top: `${pct}%` }}>
              <span className="text-[9px] text-zinc-700 w-9 shrink-0 select-none font-mono text-right pr-1">
                {pad(h)}h
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.03)" }} />
            </div>
          );
        })}

        {EVENTS.map((ev, idx) => {
          const top = hourToPercent(ev.hour);
          const height = (ev.duration / TOTAL_HOURS) * 100;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.3 }}
              className="absolute left-11 right-2 rounded-xl px-3 py-1.5 cursor-default"
              style={{
                top: `calc(${top}% + 2px)`,
                height: `calc(${height}% - 4px)`,
                background: ev.color.replace("0.5", "0.08"),
                borderLeft: `2px solid ${ev.color.replace("0.5", "0.6")}`,
              }}
            >
              <p className="text-[10px] font-medium leading-tight truncate" style={{ color: ev.color.replace("0.5", "0.9") }}>
                {ev.label}
              </p>
              {ev.duration > 1 && (
                <p className="text-[9px] mt-0.5 opacity-50" style={{ color: ev.color.replace("0.5", "0.9") }}>
                  {ev.duration}h
                </p>
              )}
            </motion.div>
          );
        })}

        {isInRange && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute left-0 right-0 flex items-center gap-1 z-10 pointer-events-none"
            style={{ top: `${nowPercent}%` }}
          >
            <div className="w-2 h-2 rounded-full bg-white shrink-0 ml-8" style={{ boxShadow: "0 0 8px rgba(255,255,255,0.3)" }} />
            <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, rgba(255,255,255,0.4), transparent 80%)" }} />
          </motion.div>
        )}
      </div>
    </div>
  );
}