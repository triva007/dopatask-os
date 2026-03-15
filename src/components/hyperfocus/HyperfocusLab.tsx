"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, Play, Pause, Square, Volume2, VolumeX,
  CheckCircle2, Clock, Flame,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

// ─── Types ───────────────────────────────────────────────────────────────────

type NoiseType = "brown" | "white" | "none";
type Phase = "idle" | "running" | "paused" | "done";

const DURATIONS = [15, 25, 45, 60, 90];

const NOISE_LABELS: Record<NoiseType, string> = {
  brown: "Bruit Brun",
  white: "Bruit Blanc",
  none: "Silence",
};

// ─── Audio Generator ─────────────────────────────────────────────────────────

function useNoise(type: NoiseType, active: boolean) {
  const audioCtxRef    = useRef<AudioContext | null>(null);
  const gainNodeRef    = useRef<GainNode | null>(null);
  const sourceNodeRef  = useRef<AudioBufferSourceNode | null>(null);

  const stopNoise = useCallback(() => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch { /* ignore */ }
      sourceNodeRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!active || type === "none") {
      stopNoise();
      return;
    }

    const ctx = audioCtxRef.current ?? new AudioContext();
    audioCtxRef.current = ctx;

    const bufferSize = ctx.sampleRate * 2; // 2 sec loop
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === "white") {
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    } else {
      // Brown noise
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (last + 0.02 * white) / 1.02;
        last = data[i];
        data[i] *= 3.5;
      }
    }

    const gain = gainNodeRef.current ?? ctx.createGain();
    gainNodeRef.current = gain;
    gain.gain.value = 0.35;
    gain.connect(ctx.destination);

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(gain);
    src.start();
    sourceNodeRef.current = src;

    return stopNoise;
  }, [active, type, stopNoise]);

  useEffect(() => () => stopNoise(), [stopNoise]);
}

// ─── Time Timer Ring ─────────────────────────────────────────────────────────

function TimeRing({
  totalSeconds,
  remaining,
}: {
  totalSeconds: number;
  remaining: number;
}) {
  const pct = totalSeconds > 0 ? remaining / totalSeconds : 1;
  const r   = 70;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
      <svg width="180" height="180" style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle cx="90" cy="90" r={r} fill="none" stroke="#1c1c1f" strokeWidth="8" />
        {/* Progress */}
        <circle
          cx="90" cy="90" r={r}
          fill="none"
          stroke={pct < 0.2 ? "#ef4444" : pct < 0.5 ? "#f59e0b" : "#06b6d4"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 1s linear, stroke 0.5s" }}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="text-4xl font-mono font-bold text-zinc-100 tabular-nums">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
        <span className="text-[10px] text-zinc-600 mt-0.5">restantes</span>
      </div>
    </div>
  );
}

// ─── Session History ─────────────────────────────────────────────────────────

function SessionHistory() {
  const { hyperfocusSessions } = useAppStore();
  if (hyperfocusSessions.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 mt-4 w-full max-w-sm">
      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1">
        Dernières sessions
      </p>
      {hyperfocusSessions.slice(0, 5).map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-3 px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/50"
        >
          <CheckCircle2 size={12} className="text-dopa-green shrink-0" />
          <span className="flex-1 text-xs text-zinc-400 truncate">{s.taskName}</span>
          <span className="text-[10px] text-zinc-600 font-mono">{s.durationMinutes} min</span>
          <span className="text-[9px] text-zinc-700">
            {new Date(s.completedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HyperfocusLab() {
  const { tasks, addHyperfocusSession, addXp } = useAppStore();

  const [phase, setPhase]         = useState<Phase>("idle");
  const [taskName, setTaskName]   = useState("");
  const [duration, setDuration]   = useState(25);
  const [noise, setNoise]         = useState<NoiseType>("brown");
  const [remaining, setRemaining] = useState(25 * 60);
  const [muted, setMuted]         = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRunning = phase === "running";
  useNoise(noise, isRunning && !muted);

  // Countdown
  useEffect(() => {
    if (phase !== "running") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current!);
          setPhase("done");
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase]);

  // Session complete
  useEffect(() => {
    if (phase === "done") {
      addHyperfocusSession({
        taskName: taskName || "Session sans nom",
        durationMinutes: duration,
        completedAt: Date.now(),
        noise,
      });
      addXp(duration * 2);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = () => {
    if (!taskName.trim()) return;
    setRemaining(duration * 60);
    setPhase("running");
  };

  const handlePause  = () => setPhase("paused");
  const handleResume = () => setPhase("running");
  const handleStop   = () => { setPhase("idle"); setRemaining(duration * 60); };
  const handleReset  = () => { setPhase("idle"); setRemaining(duration * 60); };

  const todoTasks = tasks.filter((t) =>
    t.status === "today" || t.status === "todo" || t.status === "in_progress"
  );

  return (
    <AnimatePresence mode="wait">
      {phase === "idle" || phase === "done" ? (
        // ── Setup / Done screen ──
        <motion.div
          key="setup"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col h-full overflow-y-auto"
        >
          {/* Header */}
          <div className="shrink-0 px-6 pt-5 pb-3 border-b border-zinc-900">
            <h1 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              <FlaskConical size={18} className="text-dopa-violet" />
              Hyperfocus Lab
            </h1>
            <p className="text-xs text-zinc-600 mt-0.5">
              Tunnel de concentration totale · Chrono + son ambiant + XP
            </p>
          </div>

          {phase === "done" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-6 mt-4 px-4 py-3 rounded-xl border flex items-center gap-3"
              style={{ background: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.2)" }}
            >
              <CheckCircle2 size={18} className="text-dopa-green shrink-0" />
              <div>
                <p className="text-sm font-semibold text-dopa-green">Session terminée !</p>
                <p className="text-xs text-zinc-500">+{duration * 2} XP gagnés · bien joué 💪</p>
              </div>
              <button onClick={handleReset} className="ml-auto text-xs text-zinc-600 hover:text-zinc-400">
                Nouvelle session
              </button>
            </motion.div>
          )}

          <div className="flex-1 flex flex-col items-center justify-start px-6 pt-8 pb-6 gap-6">

            {/* Task picker */}
            <div className="w-full max-w-sm flex flex-col gap-2">
              <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
                Sur quoi tu travailles ?
              </label>
              <input
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Nom de ta tâche…"
                className="w-full text-sm bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 placeholder:text-zinc-700 focus:border-zinc-600 focus:outline-none"
              />
              {todoTasks.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {todoTasks.slice(0, 4).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTaskName(t.text)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-all"
                    >
                      {t.text.slice(0, 30)}{t.text.length > 30 ? "…" : ""}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Duration picker */}
            <div className="w-full max-w-sm flex flex-col gap-2">
              <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
                Durée
              </label>
              <div className="flex gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => { setDuration(d); setRemaining(d * 60); }}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: duration === d ? "rgba(6,182,212,0.12)" : "#0f0f12",
                      border: `1px solid ${duration === d ? "rgba(6,182,212,0.25)" : "rgba(255,255,255,0.04)"}`,
                      color: duration === d ? "#06b6d4" : "#52525b",
                    }}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            {/* Noise picker */}
            <div className="w-full max-w-sm flex flex-col gap-2">
              <label className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
                Son ambiant
              </label>
              <div className="flex gap-2">
                {(["brown", "white", "none"] as NoiseType[]).map((n) => (
                  <button
                    key={n}
                    onClick={() => setNoise(n)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: noise === n ? "rgba(124,58,237,0.12)" : "#0f0f12",
                      border: `1px solid ${noise === n ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.04)"}`,
                      color: noise === n ? "#7c3aed" : "#52525b",
                    }}
                  >
                    {NOISE_LABELS[n]}
                  </button>
                ))}
              </div>
            </div>

            {/* Start button */}
            <button
              onClick={handleStart}
              disabled={!taskName.trim()}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #06b6d4, #7c3aed)",
                color: "white",
                boxShadow: taskName.trim() ? "0 0 24px rgba(6,182,212,0.2)" : "none",
              }}
            >
              <Play size={16} /> Lancer le tunnel
            </button>

            <SessionHistory />
          </div>
        </motion.div>
      ) : (
        // ── Tunnel (running / paused) ──
        <motion.div
          key="tunnel"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col h-full items-center justify-center gap-6"
          style={{ background: "#09090b" }}
        >
          {/* Task name */}
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-base font-semibold text-zinc-300 tracking-tight text-center px-8 max-w-md"
          >
            {taskName}
          </motion.p>

          {/* Timer ring */}
          <TimeRing totalSeconds={duration * 60} remaining={remaining} />

          {/* Phase label */}
          <div className="flex items-center gap-2">
            {phase === "running"
              ? <Flame size={14} className="text-dopa-cyan" />
              : <Clock size={14} className="text-zinc-600" />
            }
            <span className="text-xs text-zinc-600">
              {phase === "running" ? "En concentration…" : "En pause"}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {phase === "running" ? (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 transition-colors"
              >
                <Pause size={13} /> Pause
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: "linear-gradient(135deg, #06b6d4, #7c3aed)", color: "white" }}
              >
                <Play size={13} /> Reprendre
              </button>
            )}
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-semibold hover:text-zinc-400 transition-colors"
            >
              <Square size={13} /> Arrêter
            </button>
            <button
              onClick={() => setMuted((m) => !m)}
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            </button>
          </div>

          {/* Noise label */}
          <p className="text-[10px] text-zinc-700">
            {muted ? "Son coupé" : NOISE_LABELS[noise]} · {duration} min
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
