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
  { hour: 8,  duration: 1,   label: "Réveil & routine",  color: "rgba(245,158,11,0.08)", colorBorder: "#f59e0b" },
  { hour: 9,  duration: 2.5, label: "Deep Work",          color: "rgba(124,58,237,0.08)", colorBorder: "#7c3aed" },
  { hour: 12, duration: 1,   label: "Déjeuner",           color: "rgba(34,197,94,0.08)",  colorBorder: "#22c55e" },
  { hour: 14, duration: 1.5, label: "Emails & admin",     color: "rgba(6,182,212,0.08)",  colorBorder: "#06b6d4" },
  { hour: 16, duration: 2,   label: "Focus session",      color: "rgba(124,58,237,0.08)", colorBorder: "#7c3aed" },
  { hour: 19, duration: 1,   label: "Récompense",         color: "rgba(245,158,11,0.08)", colorBorder: "#f59e0b" },
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
    <div className="flex flex-col h-full px-5 py-6 gap-5">

      {/* Header */}
      <div className="shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)" }}>
            <CalendarDays size={12} className="text-zinc-500" />
          </div>
          <span className="text-[11px] font-semibold text-zinc-500 tracking-wider uppercase">
            Timeline
          </span>
        </div>
        <p className="text-sm font-semibold text-zinc-200 capitalize leading-tight">
          {now.toLocaleDateString("fr-FR", {
            weekday: "long", day: "numeric", month: "long",
          })}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-dopa-cyan animate-pulse" />
          <p className="text-xs text-zinc-500 flex items-center gap-1">
            <Clock size={10} />
            {pad(now.getHours())}:{pad(now.getMinutes())}
          </p>
        </div>
      </div>

      {/* Grille timeline */}
      <div className="relative flex-1 min-h-0 overflow-hidden rounded-xl" style={{ background: "rgba(255,255,255,0.015)" }}>

        {/* Lignes d'heures */}
        {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
          const h   = START_HOUR + i;
          const pct = (i / TOTAL_HOURS) * 100;
          return (
            <div
              key={h}
              className="absolute left-0 right-0 flex items-center gap-2"
              style={{ top: `${pct}%` }}
            >
              <span className="text-[9px] text-zinc-600 w-9 shrink-0 select-none font-mono text-right pr-1">
                {pad(h)}h
              </span>
              <div className="flex-1 h-px bg-zinc-800/40" />
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
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.07, duration: 0.35, ease: "easeOut" }}
              className="absolute left-11 right-2 rounded-lg px-2.5 py-1.5 cursor-default group"
              style={{
                top:    `calc(${top}% + 2px)`,
                height: `calc(${height}% - 4px)`,
                background:  ev.color,
                borderLeft:  `2.5px solid ${ev.colorBorder}`,
                overflow: "hidden",
              }}
            >
              <p
                className="text-[10px] font-medium leading-tight truncate"
                style={{ color: ev.colorBorder }}
              >
                {ev.label}
              </p>
              {ev.duration > 1 && (
                <p className="text-[9px] mt-0.5 opacity-60" style={{ color: ev.colorBorder }}>
                  {ev.duration}h
                </p>
              )}
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
            <div className="w-2 h-2 rounded-full bg-dopa-cyan shrink-0 ml-8 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
            <div
              className="flex-1 h-[1.5px]"
              style={{ background: "linear-gradient(to right, #06b6d4, transparent 80%)" }}
            />
          </motion.div>
        )}
      </div>

      {/* Bouton Sync */}
      <button className="shrink-0 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-zinc-800/60 bg-zinc-900/40 text-[11px] text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all">
        <RefreshCw size={11} />
        Synchroniser Google Agenda
      </button>
    </div>
  );
}