"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeBlock {
  hour: number;
  duration: number;
  label: string;
  color: string;
  colorBorder: string;
}

// ─── Événements de démo ──────────────────────────────────────────────────────

const EVENTS: TimeBlock[] = [
  { hour: 8,  duration: 1,   label: "☀️ Réveil & routine",   color: "#f59e0b18", colorBorder: "#f59e0b" },
  { hour: 9,  duration: 2.5, label: "🧠 Deep Work",           color: "#7c3aed18", colorBorder: "#7c3aed" },
  { hour: 12, duration: 1,   label: "🥗 Déjeuner",            color: "#22c55e18", colorBorder: "#22c55e" },
  { hour: 14, duration: 1.5, label: "📧 Emails & admin",      color: "#06b6d418", colorBorder: "#06b6d4" },
  { hour: 16, duration: 2,   label: "🔥 Focus session",       color: "#7c3aed18", colorBorder: "#7c3aed" },
  { hour: 19, duration: 1,   label: "🎮 Récompense",          color: "#f59e0b18", colorBorder: "#f59e0b" },
];

const START_HOUR  = 8;
const END_HOUR    = 20;
const TOTAL_HOURS = END_HOUR - START_HOUR;

function pad(n: number) { return n.toString().padStart(2, "0"); }

function hourToPercent(h: number) {
  return ((h - START_HOUR) / TOTAL_HOURS) * 100;
}

// ─── Composant ───────────────────────────────────────────────────────────────

export default function TimelineColumn() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const currentHour = now.getHours() + now.getMinutes() / 60;
  const nowPercent  = Math.min(100, Math.max(0, hourToPercent(currentHour)));
  const isInRange   = currentHour >= START_HOUR && currentHour <= END_HOUR;

  return (
    <div className="flex flex-col h-full px-4 py-5 gap-4">

      {/* Header */}
      <div className="flex items-center gap-2 shrink-0">
        <CalendarDays size={13} className="text-zinc-500" />
        <span className="text-[11px] font-semibold text-zinc-500 tracking-wider uppercase">
          Timeline
        </span>
      </div>

      {/* Date & heure */}
      <div className="shrink-0">
        <p className="text-sm font-semibold text-zinc-200 capitalize leading-tight">
          {now.toLocaleDateString("fr-FR", {
            weekday: "long", day: "numeric", month: "long",
          })}
        </p>
        <p className="text-xs text-zinc-600 mt-1 flex items-center gap-1">
          <Clock size={10} />
          {pad(now.getHours())}:{pad(now.getMinutes())}
        </p>
      </div>

      {/* Grille timeline */}
      <div className="relative flex-1 min-h-0 overflow-hidden">

        {/* Lignes d'heures */}
        {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
          const h   = START_HOUR + i;
          const pct = (i / TOTAL_HOURS) * 100;
          return (
            <div
              key={h}
              className="absolute left-0 right-0 flex items-center gap-1.5"
              style={{ top: `${pct}%` }}
            >
              <span className="text-[9px] text-zinc-700 w-8 shrink-0 select-none font-mono">
                {pad(h)}h
              </span>
              <div className="flex-1 h-px bg-zinc-800/50" />
            </div>
          );
        })}

        {/* Blocs d'événements */}
        {EVENTS.map((ev, idx) => {
          const top    = hourToPercent(ev.hour);
          const height = (ev.duration / TOTAL_HOURS) * 100;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.3, ease: "easeOut" }}
              className="absolute left-10 right-0 rounded-md px-2 py-1 cursor-default"
              style={{
                top:    `calc(${top}% + 1px)`,
                height: `calc(${height}% - 3px)`,
                background:  ev.color,
                borderLeft:  `2px solid ${ev.colorBorder}`,
                overflow: "hidden",
              }}
            >
              <p
                className="text-[10px] font-medium leading-tight truncate"
                style={{ color: ev.colorBorder }}
              >
                {ev.label}
              </p>
            </motion.div>
          );
        })}

        {/* Ligne "maintenant" */}
        {isInRange && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute left-0 right-0 flex items-center gap-1 z-10 pointer-events-none"
            style={{ top: `${nowPercent}%` }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-dopa-cyan shrink-0 ml-7" />
            <div
              className="flex-1 h-px"
              style={{ background: "linear-gradient(to right, #06b6d4, transparent)" }}
            />
          </motion.div>
        )}
      </div>

      {/* Bouton Sync */}
      <button className="shrink-0 flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-zinc-800 text-[11px] text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 transition-colors">
        <RefreshCw size={10} />
        Synchroniser Google Agenda
      </button>
    </div>
  );
}
