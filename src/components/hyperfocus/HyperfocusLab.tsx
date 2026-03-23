"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, FlaskConical,
  Clock, Zap, Trophy, Flame, ChevronDown, ChevronUp,
  Check, Target,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

/* ─── Presets & Noise Config ──────────────────────────────────────────────── */

const PRESETS = [
  { label: "25 min", minutes: 25, xp: 40, description: "Pomodoro", color: "#4ade80" },
  { label: "45 min", minutes: 45, xp: 80, description: "Deep Work", color: "#67e8f9" },
  { label: "90 min", minutes: 90, xp: 150, description: "Ultra Focus", color: "#a78bfa" },
];

type NoiseType = "brown" | "white" | "pink" | "none";
const NOISES: { type: NoiseType; label: string; emoji: string }[] = [
  { type: "none",  label: "Silence", emoji: "🔇" },
  { type: "brown", label: "Brown Noise", emoji: "🌊" },
  { type: "white", label: "White Noise", emoji: "⚡" },
  { type: "pink",  label: "Pink Noise", emoji: "🌸" },
];

const FOCUS_QUOTES = [
  "Le focus est un muscle. Entraîne-le.",
  "Une tâche à la fois, un pas à la fois.",
  "Le deep work est ton arme secrète.",
  "Ton futur toi te remerciera.",
  "Chaque minute de focus est un investissement.",
  "La discipline bat le talent.",
  "Commence. Le reste suivra.",
  "Ta productivité n'a pas de limite.",
];

/* ─── Main Component ──────────────────────────────────────────────────────── */

export default function HyperfocusLab() {
  const {
    addHyperfocusSession, addXp, damageBoss,
    hyperfocusSessions, totalFocusMinutes, streak,
  } = useAppStore();

  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [noise, setNoise] = useState<NoiseType>("none");
  const [taskName, setTaskName] = useState("");
  const [completed, setCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [quote] = useState(() => FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const totalSeconds = duration * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const currentPreset = PRESETS.find((p) => p.minutes === duration) || PRESETS[0];

  // Stats
  const todaySessions = hyperfocusSessions.filter((s) => {
    const d = new Date(s.completedAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  /* ─── Audio ─────────────────────────────────────────────────────────────── */

  const stopNoise = useCallback(() => {
    if (sourceRef.current) { try { sourceRef.current.stop(); } catch { /* noop */ } sourceRef.current = null; }
  }, []);

  const playNoise = useCallback((type: NoiseType) => {
    stopNoise();
    if (type === "none") return;
    if (!audioRef.current) audioRef.current = new AudioContext();
    const ctx = audioRef.current;
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === "white") {
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    } else if (type === "pink") {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520; b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    } else {
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        const w = Math.random() * 2 - 1;
        data[i] = (last + 0.02 * w) / 1.02; last = data[i]; data[i] *= 3.5;
      }
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer; src.loop = true;
    const gain = ctx.createGain(); gain.gain.value = 0.12;
    src.connect(gain).connect(ctx.destination);
    src.start();
    sourceRef.current = src;
  }, [stopNoise]);

  /* ─── Timer Logic ───────────────────────────────────────────────────────── */

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && running) {
      setRunning(false);
      stopNoise();
      setCompleted(true);
      addHyperfocusSession({ taskName: taskName || "Focus", durationMinutes: duration, completedAt: Date.now(), noise: noise === "pink" ? "white" : noise });
      const xpGain = currentPreset.xp;
      addXp(xpGain);
      damageBoss(duration >= 45 ? 15 : 8);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, timeLeft, duration, noise, taskName, addHyperfocusSession, addXp, damageBoss, stopNoise, currentPreset.xp]);

  const handleStart = () => { setRunning(true); setCompleted(false); if (noise !== "none") playNoise(noise); };
  const handlePause = () => { setRunning(false); stopNoise(); };
  const handleReset = () => { setRunning(false); stopNoise(); setTimeLeft(duration * 60); setCompleted(false); };
  const handlePreset = (m: number) => { setDuration(m); setTimeLeft(m * 60); setRunning(false); stopNoise(); setCompleted(false); };

  const handleNoiseToggle = (type: NoiseType) => {
    setNoise(type);
    if (running) { if (type !== "none") { playNoise(type); } else { stopNoise(); } }
  };

  /* ─── Ring SVG ──────────────────────────────────────────────────────────── */
  const ringSize = 220;
  const strokeWidth = 6;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-7 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <h1 className="text-lg font-semibold text-zinc-100 tracking-tight flex items-center gap-2.5">
          <FlaskConical size={18} className="text-zinc-400" /> Focus Lab
        </h1>
        <p className="text-xs text-zinc-600 mt-1">Deep work avec bruit ambiant</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-6 px-7 py-6">

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1 p-3.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider flex items-center gap-1">
              <Clock size={9} /> Aujourd&apos;hui
            </span>
            <span className="text-lg font-semibold text-zinc-200 tabular-nums">{todayMinutes}<span className="text-xs text-zinc-600 font-normal ml-0.5">min</span></span>
          </div>
          <div className="flex flex-col gap-1 p-3.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider flex items-center gap-1">
              <Trophy size={9} /> Total
            </span>
            <span className="text-lg font-semibold text-zinc-200 tabular-nums">
              {totalFocusMinutes >= 60 ? `${Math.floor(totalFocusMinutes / 60)}h${totalFocusMinutes % 60 > 0 ? String(totalFocusMinutes % 60).padStart(2, "0") : ""}` : `${totalFocusMinutes}min`}
            </span>
          </div>
          <div className="flex flex-col gap-1 p-3.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider flex items-center gap-1">
              <Flame size={9} style={{ color: "#fbbf24" }} /> Sessions
            </span>
            <span className="text-lg font-semibold text-zinc-200 tabular-nums">{hyperfocusSessions.length}</span>
          </div>
        </div>

        {/* Timer Zone */}
        <div className="flex flex-col items-center gap-6 py-4 rounded-3xl relative"
          style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}
        >
          {/* Ambient glow when running */}
          {running && (
            <div className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{ background: `radial-gradient(circle at center 40%, ${currentPreset.color}06 0%, transparent 70%)` }} />
          )}

          {/* Quote */}
          <p className="text-[11px] text-zinc-600 italic text-center px-8">&quot;{quote}&quot;</p>

          {/* Timer ring */}
          <div className="relative flex items-center justify-center" style={{ width: ringSize, height: ringSize }}>
            <svg width={ringSize} height={ringSize} className="transform -rotate-90">
              <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} />
              <motion.circle
                cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none"
                stroke={completed ? "#4ade80" : currentPreset.color}
                strokeWidth={strokeWidth} strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.5 }}
                style={{ filter: running ? `drop-shadow(0 0 8px ${currentPreset.color}40)` : "none" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-extralight text-zinc-100 tabular-nums tracking-tighter">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                  style={{ background: `${currentPreset.color}10`, color: currentPreset.color, border: `1px solid ${currentPreset.color}20` }}
                >{currentPreset.description}</span>
                <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                  <Zap size={8} style={{ color: "#fbbf24" }} /> +{currentPreset.xp} XP
                </span>
              </div>
            </div>
          </div>

          {/* Task name */}
          <input
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Sur quoi travailles-tu ?"
            disabled={running}
            className="text-center text-sm bg-transparent text-zinc-300 placeholder:text-zinc-700 focus:outline-none w-64 border-b pb-2 disabled:opacity-50"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          />

          {/* Preset buttons */}
          <div className="flex gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.minutes}
                onClick={() => handlePreset(p.minutes)}
                disabled={running}
                className="flex flex-col items-center gap-1 px-5 py-3 rounded-2xl font-medium transition-all disabled:opacity-30"
                style={{
                  background: duration === p.minutes ? `${p.color}08` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${duration === p.minutes ? p.color + "20" : "rgba(255,255,255,0.04)"}`,
                }}
              >
                <span className="text-xs" style={{ color: duration === p.minutes ? p.color : "#71717a" }}>{p.label}</span>
                <span className="text-[9px] flex items-center gap-0.5" style={{ color: "#52525b" }}>
                  <Zap size={7} /> {p.xp} XP
                </span>
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button onClick={handleReset}
              className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <RotateCcw size={15} className="text-zinc-400" />
            </button>

            <motion.button
              onClick={running ? handlePause : handleStart}
              whileTap={{ scale: 0.95 }}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all relative"
              style={{
                background: running ? "rgba(255,255,255,0.06)" : `${currentPreset.color}15`,
                border: `1px solid ${running ? "rgba(255,255,255,0.08)" : currentPreset.color + "30"}`,
              }}
            >
              {running && (
                <div className="absolute inset-0 rounded-full animate-ping pointer-events-none"
                  style={{ background: `${currentPreset.color}08` }} />
              )}
              {running
                ? <Pause size={22} className="text-zinc-200 relative z-10" />
                : <Play size={22} className="text-zinc-200 ml-0.5 relative z-10" />
              }
            </motion.button>

            <button
              onClick={() => handleNoiseToggle(noise === "none" ? "brown" : "none")}
              className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all"
              style={{
                background: noise !== "none" ? "rgba(167,139,250,0.06)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${noise !== "none" ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              {noise === "none" ? <VolumeX size={15} className="text-zinc-500" /> : <Volume2 size={15} style={{ color: "#a78bfa" }} />}
            </button>
          </div>

          {/* Noise selector */}
          <div className="flex gap-2">
            {NOISES.map((n) => (
              <button
                key={n.type}
                onClick={() => handleNoiseToggle(n.type)}
                className="text-[10px] px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5"
                style={{
                  background: noise === n.type ? "rgba(255,255,255,0.08)" : "transparent",
                  border: `1px solid ${noise === n.type ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
                  color: noise === n.type ? "#e4e4e7" : "#52525b",
                }}
              >
                <span>{n.emoji}</span> {n.label}
              </button>
            ))}
          </div>

          {/* Completed banner */}
          <AnimatePresence>
            {completed && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="px-6 py-4 rounded-2xl text-center mx-6"
                style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.12)" }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Check size={14} style={{ color: "#4ade80" }} />
                  <p className="text-sm font-medium" style={{ color: "#4ade80" }}>Session terminée !</p>
                </div>
                <div className="flex items-center justify-center gap-3 text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Zap size={10} style={{ color: "#fbbf24" }} /> +{currentPreset.xp} XP
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Target size={10} style={{ color: "#fca5a5" }} /> -{duration >= 45 ? 15 : 8}% Boss HP
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Session History */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full px-1 py-1"
          >
            <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest flex items-center gap-1.5">
              <Clock size={10} /> Historique ({hyperfocusSessions.length})
            </span>
            {showHistory ? <ChevronUp size={12} className="text-zinc-600" /> : <ChevronDown size={12} className="text-zinc-600" />}
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden flex flex-col gap-1.5"
              >
                {hyperfocusSessions.length === 0 && (
                  <p className="text-xs text-zinc-700 text-center py-4">Aucune session pour le moment</p>
                )}
                {hyperfocusSessions.slice(0, 15).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)" }}
                  >
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.12)" }}
                    >
                      <FlaskConical size={11} style={{ color: "#a78bfa" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-zinc-300 truncate">{s.taskName}</p>
                      <p className="text-[10px] text-zinc-700">
                        {new Date(s.completedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        {" · "}{s.durationMinutes} min
                        {s.noise !== "none" && ` · ${s.noise}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Zap size={9} style={{ color: "#fbbf24" }} />
                      <span className="text-[10px] font-medium tabular-nums" style={{ color: "#fbbf24" }}>
                        +{s.durationMinutes >= 45 ? (s.durationMinutes >= 90 ? 150 : 80) : 40}
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Streak reminder */}
        {streak > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.08)" }}
          >
            <Flame size={14} style={{ color: "#fbbf24" }} />
            <div className="flex-1">
              <p className="text-xs text-zinc-300">Streak actif : <span style={{ color: "#fbbf24" }} className="font-semibold">{streak}</span></p>
              <p className="text-[10px] text-zinc-600">Continue comme ça, chaque session compte !</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}