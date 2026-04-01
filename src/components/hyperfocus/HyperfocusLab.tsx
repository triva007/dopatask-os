"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, FlaskConical,
  Clock, Zap, Trophy, Flame, ChevronDown, ChevronUp,
  Check, Target, Coffee,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

/* ─── Presets & Noise Config ──────────────────────────────────────────────── */

const PRESETS = [
  { label: "25 min", minutes: 25, xp: 40, description: "Pomodoro", color: "var(--accent-green)" },
  { label: "45 min", minutes: 45, xp: 80, description: "Deep Work", color: "var(--accent-blue)" },
  { label: "90 min", minutes: 90, xp: 150, description: "Ultra Focus", color: "var(--accent-purple)" },
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
  const [customDuration, setCustomDuration] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [noise, setNoise] = useState<NoiseType>("none");
  const [noiseVolume, setNoiseVolume] = useState(12);
  const [taskName, setTaskName] = useState("");
  const [completed, setCompleted] = useState(false);
  const [showBreakPrompt, setShowBreakPrompt] = useState(false);
  const [breakRunning, setBreakRunning] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(5 * 60);
  const [showHistory, setShowHistory] = useState(false);
  const [quote] = useState(() => FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breakIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const tabVisibleRef = useRef(true);
  const sessionStartTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number | null>(null);

  const totalSeconds = duration * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const currentPreset = PRESETS.find((p) => p.minutes === duration) || PRESETS[0];

  const breakMinutes = Math.floor(breakTimeLeft / 60);
  const breakSeconds = breakTimeLeft % 60;

  // Stats
  const todaySessions = hyperfocusSessions.filter((s) => {
    const d = new Date(s.completedAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  /* ─── Audio ─────────────────────────────────────────────────────────────── */

  const stopNoise = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        /* noop */
      }
      sourceRef.current = null;
    }
  }, []);

  const playNoise = useCallback(
    (type: NoiseType) => {
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
        let b0 = 0,
          b1 = 0,
          b2 = 0,
          b3 = 0,
          b4 = 0,
          b5 = 0,
          b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const w = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + w * 0.0555179;
          b1 = 0.99332 * b1 + w * 0.0750759;
          b2 = 0.969 * b2 + w * 0.153852;
          b3 = 0.8665 * b3 + w * 0.3104856;
          b4 = 0.55 * b4 + w * 0.5329522;
          b5 = -0.7616 * b5 - w * 0.016898;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
          b6 = w * 0.115926;
        }
      } else {
        let last = 0;
        for (let i = 0; i < bufferSize; i++) {
          const w = Math.random() * 2 - 1;
          data[i] = (last + 0.02 * w) / 1.02;
          last = data[i];
          data[i] *= 3.5;
        }
      }

      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const gain = ctx.createGain();
      gain.gain.value = noiseVolume / 100;
      src.connect(gain).connect(ctx.destination);
      src.start();
      sourceRef.current = src;
    },
    [stopNoise, noiseVolume]
  );

  /* ─── Tab Visibility & Focus Time Tracking ──────────────────────────────── */

  useEffect(() => {
    const handleVisibilityChange = () => {
      tabVisibleRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  /* ─── Timer Logic ───────────────────────────────────────────────────────── */

  useEffect(() => {
    if (running && !paused && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && running) {
      setRunning(false);
      setPaused(false);
      stopNoise();
      setCompleted(true);
      setShowBreakPrompt(true);
      addHyperfocusSession({
        taskName: taskName || "Focus",
        durationMinutes: duration,
        completedAt: Date.now(),
        noise: noise === "pink" ? "white" : noise,
      });
      const xpGain = currentPreset.xp;
      addXp(xpGain);
      damageBoss(duration >= 45 ? 15 : 8);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    running,
    paused,
    timeLeft,
    duration,
    noise,
    taskName,
    addHyperfocusSession,
    addXp,
    damageBoss,
    stopNoise,
    currentPreset.xp,
  ]);

  /* ─── Break Timer Logic ──────────────────────────────────────────────────── */

  useEffect(() => {
    if (breakRunning && breakTimeLeft > 0) {
      breakIntervalRef.current = setInterval(() => setBreakTimeLeft((t) => t - 1), 1000);
    } else if (breakTimeLeft === 0 && breakRunning) {
      setBreakRunning(false);
      setBreakTimeLeft(5 * 60);
    }
    return () => {
      if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
    };
  }, [breakRunning, breakTimeLeft]);

  /* ─── Audio Cleanup on Unmount ──────────────────────────────────────────── */

  useEffect(() => {
    return () => {
      stopNoise();
      if (audioRef.current && audioRef.current.state === "running") {
        audioRef.current.close();
      }
    };
  }, [stopNoise]);

  const handleStart = () => {
    setRunning(true);
    setPaused(false);
    setCompleted(false);
    setShowBreakPrompt(false);
    sessionStartTimeRef.current = Date.now();
    if (noise !== "none") playNoise(noise);
  };

  const handlePause = () => {
    setPaused(true);
    stopNoise();
  };

  const handleResume = () => {
    setPaused(false);
    if (noise !== "none") playNoise(noise);
  };

  const handleReset = () => {
    setRunning(false);
    setPaused(false);
    stopNoise();
    setTimeLeft(duration * 60);
    setCompleted(false);
    setShowBreakPrompt(false);
  };

  const handlePreset = (m: number) => {
    setDuration(m);
    setTimeLeft(m * 60);
    setCustomDuration("");
    setRunning(false);
    setPaused(false);
    stopNoise();
    setCompleted(false);
  };

  const handleCustomDuration = () => {
    const customMins = parseInt(customDuration, 10);
    if (customMins > 0 && customMins <= 480) {
      setDuration(customMins);
      setTimeLeft(customMins * 60);
      setRunning(false);
      setPaused(false);
      stopNoise();
      setCompleted(false);
    }
  };

  const handleNoiseToggle = (type: NoiseType) => {
    setNoise(type);
    if (running && !paused) {
      if (type !== "none") {
        playNoise(type);
      } else {
        stopNoise();
      }
    }
  };

  const startBreak = () => {
    setShowBreakPrompt(false);
    setBreakTimeLeft(5 * 60);
    setBreakRunning(true);
  };

  const skipBreak = () => {
    setShowBreakPrompt(false);
    setBreakTimeLeft(5 * 60);
  };

  /* ─── Ring SVG ──────────────────────────────────────────────────────────── */

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-7 pt-6 pb-4 border-b-b-primary">
        <h1 className="text-2xl font-semibold text-t-primary tracking-tight flex items-center gap-2.5">
          <FlaskConical size={18} className="text-t-secondary" /> Focus Lab
        </h1>
        <p className="text-xs text-t-secondary mt-1">Deep work avec bruit ambiant</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-6 px-7 py-6">

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1 p-5 rounded-3xl bg-surface border-b-primary" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <span className="text-[13px] text-t-secondary uppercase tracking-wider flex items-center gap-1">
              <Clock size={9} /> Aujourd&apos;hui
            </span>
            <span className="text-xl font-semibold text-t-primary tabular-nums">{todayMinutes}<span className="text-xs text-t-secondary font-normal ml-0.5">min</span></span>
          </div>
          <div className="flex flex-col gap-1 p-5 rounded-3xl bg-surface border-b-primary" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <span className="text-[13px] text-t-secondary uppercase tracking-wider flex items-center gap-1">
              <Trophy size={9} /> Total
            </span>
            <span className="text-xl font-semibold text-t-primary tabular-nums">
              {totalFocusMinutes >= 60 ? `${Math.floor(totalFocusMinutes / 60)}h${totalFocusMinutes % 60 > 0 ? String(totalFocusMinutes % 60).padStart(2, "0") : ""}` : `${totalFocusMinutes}min`}
            </span>
          </div>
          <div className="flex flex-col gap-1 p-5 rounded-3xl bg-surface border-b-primary" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <span className="text-[13px] text-t-secondary uppercase tracking-wider flex items-center gap-1">
              <Flame size={9} className="text-accent-orange" /> Sessions
            </span>
            <span className="text-xl font-semibold text-t-primary tabular-nums">{hyperfocusSessions.length}</span>
          </div>
        </div>

        {/* Timer Zone */}
        <div className="flex flex-col items-center gap-6 py-4 rounded-3xl relative bg-surface border-b-primary"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
        >
          {/* Ambient glow when running */}
          {running && (
            <div className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{ background: `radial-gradient(circle at center 40%, ${currentPreset.color}10 0%, transparent 70%)` }} />
          )}

          {/* Quote */}
          <p className="text-[13px] text-t-secondary italic text-center px-8">&quot;{quote}&quot;</p>

          {/* Timer ring */}
          <div
            className="relative flex items-center justify-center transition-opacity duration-300"
            style={{
              width: 260,
              height: 260,
              opacity: paused ? 0.6 : 1,
            }}
          >
            <svg width={260} height={260} className="transform -rotate-90">
              <circle cx={130} cy={130} r={126} fill="none" stroke="var(--surface-4)" strokeWidth={8} />
              <motion.circle
                cx={130}
                cy={130}
                r={126}
                fill="none"
                stroke={completed ? "var(--accent-green)" : currentPreset.color}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 126}
                animate={{ strokeDashoffset: 2 * Math.PI * 126 * (1 - progress / 100) }}
                transition={{ duration: 0.5 }}
                style={{
                  filter:
                    running && !paused
                      ? `drop-shadow(0 0 12px ${currentPreset.color}30)`
                      : "none",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-extralight text-t-primary tabular-nums tracking-tighter">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
              {paused && (
                <span className="text-xs font-medium text-t-secondary mt-1">En pause</span>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="text-[13px] font-medium px-2 py-0.5 rounded-md"
                  style={{
                    background: `${currentPreset.color}15`,
                    color: currentPreset.color,
                    border: `1px solid ${currentPreset.color}25`,
                  }}
                >
                  {currentPreset.description}
                </span>
                <span className="text-[13px] text-t-secondary flex items-center gap-1">
                  <Zap size={8} className="text-accent-orange" /> +{currentPreset.xp} XP
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
            className="text-center text-sm bg-transparent text-t-primary placeholder:text-[#C7C7CC] focus:outline-none w-64 border-b-b-primary border-b pb-2 disabled:opacity-50"
          />

          {/* Preset buttons */}
          <div className="flex gap-2 flex-wrap justify-center">
            {PRESETS.map((p) => (
              <button
                key={p.minutes}
                onClick={() => handlePreset(p.minutes)}
                disabled={running}
                className="flex flex-col items-center gap-1 px-5 py-3 rounded-3xl font-medium transition-all disabled:opacity-30"
                style={{
                  background:
                    duration === p.minutes ? "var(--accent-blue-light)" : "var(--surface)",
                  border:
                    duration === p.minutes
                      ? "1px solid var(--accent-blue)"
                      : "1px solid var(--border-primary)",
                }}
              >
                <span
                  className="text-xs"
                  style={{
                    color:
                      duration === p.minutes
                        ? "var(--accent-blue)"
                        : "var(--text-secondary)",
                  }}
                >
                  {p.label}
                </span>
                <span className="text-[9px] flex items-center gap-0.5 text-t-secondary">
                  <Zap size={7} /> {p.xp} XP
                </span>
              </button>
            ))}

            {/* Custom duration input */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-3xl border-b-primary"
              style={{ background: "var(--surface)" }}
            >
              <input
                type="number"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustomDuration()}
                placeholder="min"
                disabled={running}
                min="1"
                max="480"
                className="w-12 text-xs text-center bg-transparent text-t-primary placeholder:text-t-secondary focus:outline-none disabled:opacity-50"
              />
              <button
                onClick={handleCustomDuration}
                disabled={running || !customDuration}
                className="text-[9px] px-2 py-0.5 rounded-md font-medium transition-all disabled:opacity-30"
                style={{
                  background: customDuration ? "var(--accent-blue-light)" : "transparent",
                  color: customDuration ? "var(--accent-blue)" : "var(--text-secondary)",
                }}
              >
                Set
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="w-11 h-11 rounded-3xl flex items-center justify-center transition-all border-b-primary"
              style={{ background: "var(--surface)" }}
            >
              <RotateCcw size={15} className="text-t-secondary" />
            </button>

            <motion.button
              onClick={
                running
                  ? paused
                    ? handleResume
                    : handlePause
                  : handleStart
              }
              whileTap={{ scale: 0.95 }}
              className="w-20 h-20 rounded-full flex items-center justify-center transition-all relative bg-accent-blue"
              style={{
                border: "1px solid var(--accent-blue)",
              }}
            >
              {running && !paused && (
                <div
                  className="absolute inset-0 rounded-full animate-ping pointer-events-none"
                  style={{ background: "rgba(0,113,227,0.15)" }}
                />
              )}
              {!running ? (
                <Play size={22} className="text-white ml-0.5 relative z-10" />
              ) : paused ? (
                <Play size={22} className="text-white ml-0.5 relative z-10" />
              ) : (
                <Pause size={22} className="text-white relative z-10" />
              )}
            </motion.button>

            <button
              onClick={() => handleNoiseToggle(noise === "none" ? "brown" : "none")}
              className="w-11 h-11 rounded-3xl flex items-center justify-center transition-all border-b-primary"
              style={{
                background:
                  noise !== "none" ? "var(--accent-blue-light)" : "var(--surface)",
                border:
                  noise !== "none"
                    ? "1px solid var(--accent-blue)"
                    : "1px solid var(--border-primary)",
              }}
            >
              {noise === "none" ? (
                <VolumeX size={15} className="text-t-secondary" />
              ) : (
                <Volume2 size={15} className="text-accent-blue" />
              )}
            </button>
          </div>

          {/* Volume Slider */}
          {noise !== "none" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 px-6 py-3 rounded-3xl max-w-xs"
              style={{ background: "var(--surface)" }}
            >
              <Volume2 size={14} className="text-t-secondary shrink-0" />
              <input
                type="range"
                min="0"
                max="30"
                value={noiseVolume}
                onChange={(e) => {
                  const newVol = parseInt(e.target.value, 10);
                  setNoiseVolume(newVol);
                  if (running && !paused && (noise === "brown" || noise === "white" || noise === "pink")) {
                    playNoise(noise);
                  }
                }}
                className="flex-1 h-1.5 rounded-full accent-accent-blue"
                style={{
                  background:
                    "linear-gradient(to right, var(--surface-4) 0%, var(--surface-4) calc(100% * " +
                    noiseVolume / 30 +
                    "), var(--border-primary) calc(100% * " +
                    noiseVolume / 30 +
                    "), var(--border-primary) 100%)",
                }}
              />
              <span className="text-[11px] font-medium text-t-secondary w-6 text-right">
                {noiseVolume}%
              </span>
            </motion.div>
          )}

          {/* Noise selector */}
          <div className="flex gap-2 flex-wrap justify-center">
            {NOISES.map((n) => (
              <button
                key={n.type}
                onClick={() => handleNoiseToggle(n.type)}
                className="text-[13px] px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 border-b-primary"
                style={{
                  background:
                    noise === n.type ? "var(--accent-blue-light)" : "var(--surface)",
                  border: `1px solid ${
                    noise === n.type
                      ? "var(--accent-blue)"
                      : "var(--border-primary)"
                  }`,
                  color:
                    noise === n.type
                      ? "var(--accent-blue)"
                      : "var(--text-secondary)",
                }}
              >
                <span>{n.emoji}</span> {n.label}
              </button>
            ))}
          </div>

          {/* Completed banner */}
          <AnimatePresence>
            {completed && !breakRunning && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="px-6 py-4 rounded-3xl text-center mx-6"
                style={{
                  background: "var(--accent-green-light)",
                  border: "1px solid var(--accent-green-light)",
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Check size={14} className="text-accent-green" />
                  <p className="text-sm font-medium text-accent-green">
                    Session terminée !
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 text-[13px] text-t-secondary">
                  <span className="flex items-center gap-1">
                    <Zap size={10} className="text-accent-orange" /> +{currentPreset.xp} XP
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Target size={10} className="text-accent-red" /> -{duration >= 45 ? 15 : 8}%
                    Boss HP
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Break prompt banner */}
          <AnimatePresence>
            {showBreakPrompt && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="px-6 py-4 rounded-3xl text-center mx-6"
                style={{
                  background: "var(--accent-orange-light)",
                  border: "1px solid var(--accent-orange-light)",
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Coffee size={14} className="text-accent-orange" />
                  <p className="text-sm font-medium text-accent-orange">
                    Prends une pause !
                  </p>
                </div>
                <p className="text-xs text-t-secondary mb-3">
                  5 minutes pour recharger tes batteries
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={startBreak}
                    className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: "var(--accent-orange)",
                      color: "white",
                    }}
                  >
                    Démarrer la pause
                  </button>
                  <button
                    onClick={skipBreak}
                    className="px-4 py-2 rounded-xl text-xs font-medium transition-all border-b-primary"
                    style={{
                      background: "var(--surface)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Plus tard
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Break timer */}
          <AnimatePresence>
            {breakRunning && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="px-6 py-6 rounded-3xl text-center mx-6"
                style={{
                  background: "var(--accent-orange-light)",
                  border: "1px solid var(--accent-orange-light)",
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Coffee size={16} className="text-accent-orange" />
                  <p className="text-sm font-medium text-accent-orange">
                    Pause en cours
                  </p>
                </div>
                <div className="text-4xl font-extralight text-accent-orange tabular-nums mb-3">
                  {String(breakMinutes).padStart(2, "0")}:
                  {String(breakSeconds).padStart(2, "0")}
                </div>
                <button
                  onClick={() => setBreakRunning(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: "var(--surface)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-primary)",
                  }}
                >
                  Terminer la pause
                </button>
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
            <span className="text-[10px] font-medium text-t-secondary uppercase tracking-widest flex items-center gap-1.5">
              <Clock size={10} /> Historique ({hyperfocusSessions.length})
            </span>
            {showHistory ? <ChevronUp size={12} className="text-t-secondary" /> : <ChevronDown size={12} className="text-t-secondary" />}
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
                  <p className="text-xs text-t-secondary text-center py-4">Aucune session pour le moment</p>
                )}
                {hyperfocusSessions.slice(0, 15).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-3xl bg-surface border-b-primary"
                  >
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 bg-accent-blue-light border-b-primary"
                    >
                      <FlaskConical size={11} className="text-accent-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-t-primary truncate">{s.taskName}</p>
                      <p className="text-[12px] text-t-secondary">
                        {new Date(s.completedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        {" · "}{s.durationMinutes} min
                        {s.noise !== "none" && ` · ${s.noise}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Zap size={9} className="text-accent-orange" />
                      <span className="text-[12px] font-medium tabular-nums text-accent-orange">
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
          <div className="flex items-center gap-3 px-4 py-3 rounded-3xl"
            style={{ background: "var(--accent-orange-light)", border: "1px solid var(--accent-orange-light)" }}
          >
            <Flame size={14} className="text-accent-orange" />
            <div className="flex-1">
              <p className="text-xs text-t-primary">Streak actif : <span className="text-accent-orange font-semibold">{streak}</span></p>
              <p className="text-[12px] text-t-secondary">Continue comme ça, chaque session compte !</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}