"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, FlaskConical,
  Clock, Zap, Trophy, Flame, ChevronDown, ChevronUp,
  Check, Target, Waves, Wind, CloudRain,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

/* ─── Noise Config ────────────────────────────────────────────────────── */

type NoiseType = "brown" | "white" | "pink" | "none";
const NOISES: { type: NoiseType; label: string; icon: typeof Waves; color: string }[] = [
  { type: "none",  label: "Silence",     icon: VolumeX,   color: "rgba(255,255,255,0.2)" },
  { type: "brown", label: "Brown",       icon: CloudRain, color: "rgba(255,255,255,0.4)" },
  { type: "white", label: "White",       icon: Wind,      color: "rgba(255,255,255,0.4)" },
  { type: "pink",  label: "Pink",        icon: Waves,     color: "rgba(255,255,255,0.4)" },
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

/* ─── Main Component — Flow Timer (counts UP from 00:00) ────────────── */

export default function HyperfocusLab() {
  const {
    addHyperfocusSession, addXp, damageBoss,
    hyperfocusSessions, streak,
  } = useAppStore();

  const [elapsed, setElapsed] = useState(0); // seconds elapsed
  const [running, setRunning] = useState(false);
  const [noise, setNoise] = useState<NoiseType>("none");
  const [taskName, setTaskName] = useState("");
  const [completed, setCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [quote] = useState(() => FOCUS_QUOTES[Math.floor(Math.random() * FOCUS_QUOTES.length)]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  // Personal record
  const personalBest = useMemo(() => {
    if (hyperfocusSessions.length === 0) return 0;
    return Math.max(...hyperfocusSessions.map(s => s.durationMinutes));
  }, [hyperfocusSessions]);
  const currentMinutes = Math.floor(elapsed / 60);
  const isNewRecord = running && currentMinutes > personalBest && personalBest > 0;

  // XP calculation based on elapsed time
  const getXpReward = (mins: number) => {
    if (mins >= 90) return 150;
    if (mins >= 45) return 80;
    if (mins >= 25) return 40;
    if (mins >= 10) return 15;
    return 5;
  };

  // Stats
  const todaySessions = hyperfocusSessions.filter((s) => {
    const d = new Date(s.completedAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  /* ─── Audio ─────────────────────────────────────────────────────────── */

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

  /* ─── Timer Logic — counts UP ──────────────────────────────────────── */

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handleStart = () => {
    setRunning(true);
    setCompleted(false);
    if (noise !== "none") playNoise(noise);
  };

  const handleStop = () => {
    setRunning(false);
    stopNoise();
    const durationMin = Math.max(1, Math.floor(elapsed / 60));
    if (elapsed >= 60) { // only save if at least 1 min
      setCompleted(true);
      addHyperfocusSession({
        taskName: taskName || "Flow Session",
        durationMinutes: durationMin,
        completedAt: Date.now(),
        noise: noise === "pink" ? "white" : noise,
      });
      const xpGain = getXpReward(durationMin);
      addXp(xpGain);
      damageBoss(durationMin >= 45 ? 15 : 8);
    }
  };

  const handleReset = () => {
    setRunning(false);
    stopNoise();
    setElapsed(0);
    setCompleted(false);
  };

  const handleNoiseToggle = (type: NoiseType) => {
    setNoise(type);
    if (running) { if (type !== "none") { playNoise(type); } else { stopNoise(); } }
  };

  /* ─── Ring SVG ──────────────────────────────────────────────────────── */
  const ringSize = 240;
  const strokeWidth = 4;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Fill based on minutes (full circle = personal best or 90 min)
  const targetMin = Math.max(personalBest, 90);
  const progress = Math.min(100, (currentMinutes / targetMin) * 100);
  const offset = circumference * (1 - progress / 100);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-7 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="flex items-center gap-3">
          <FlaskConical size={16} style={{ color: "rgba(255,255,255,0.3)" }} />
          <div>
            <h1 className="text-[17px] font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>Flow Timer</h1>
            <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>Bats ton record · Reste dans la zone</p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-6 px-7 py-6">

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Aujourd'hui", value: `${todayMinutes}`, unit: "min", icon: Clock },
            { label: "Record", value: personalBest > 0 ? `${personalBest}` : "—", unit: personalBest > 0 ? "min" : "", icon: Trophy },
            { label: "Sessions", value: `${hyperfocusSessions.length}`, unit: "", icon: Flame },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-2 p-4 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.02)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <div className="flex items-center gap-1.5">
                <stat.icon size={10} style={{ color: "rgba(255,255,255,0.2)" }} />
                <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "rgba(255,255,255,0.15)" }}>{stat.label}</span>
              </div>
              <span className="text-xl font-bold tabular-nums" style={{ color: "rgba(255,255,255,0.6)" }}>
                {stat.value}<span className="text-[10px] font-normal ml-0.5" style={{ color: "rgba(255,255,255,0.15)" }}>{stat.unit}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Timer Zone */}
        <div
          className="flex flex-col items-center gap-7 py-8 rounded-3xl relative overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.015)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {/* New record indicator */}
          <AnimatePresence>
            {isNewRecord && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-1.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>Nouveau record !</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quote */}
          <p className="text-[11px] italic text-center px-8" style={{ color: "rgba(255,255,255,0.15)" }}>&quot;{quote}&quot;</p>

          {/* Timer ring — counting UP */}
          <div className="relative flex items-center justify-center" style={{ width: ringSize, height: ringSize }}>
            <svg width={ringSize} height={ringSize} className="transform -rotate-90">
              <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} />
              <motion.circle
                cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={strokeWidth} strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.5 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Ascending timer display */}
              <span className="tabular-nums tracking-tighter" style={{
                fontSize: hours > 0 ? "42px" : "52px",
                fontWeight: 200,
                color: running ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)",
              }}>
                {hours > 0 && `${String(hours).padStart(2, "0")}:`}
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
              <div className="flex items-center gap-2.5 mt-2.5">
                <span className="text-[10px] flex items-center gap-1" style={{ color: "rgba(255,255,255,0.15)" }}>
                  <Zap size={9} /> +{getXpReward(currentMinutes)} XP
                </span>
                {personalBest > 0 && (
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.1)" }}>
                    Record: {personalBest}min
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Task name input */}
          <div className="w-72 relative">
            <input
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Sur quoi travailles-tu ?"
              disabled={running}
              className="w-full text-center text-sm placeholder:text-zinc-700 focus:outline-none disabled:opacity-40 px-4 py-3 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.6)",
              }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-5">
            <motion.button
              onClick={handleReset}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <RotateCcw size={16} style={{ color: "rgba(255,255,255,0.3)" }} />
            </motion.button>

            <motion.button
              onClick={running ? handleStop : handleStart}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="w-20 h-20 rounded-full flex items-center justify-center relative"
              style={{
                background: running
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(255,255,255,0.12)",
                border: `1px solid ${running ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.2)"}`,
              }}
            >
              {running
                ? <Pause size={26} style={{ color: "rgba(255,255,255,0.7)" }} />
                : <Play size={26} className="ml-1" style={{ color: "rgba(255,255,255,0.8)" }} />
              }
            </motion.button>

            <motion.button
              onClick={() => handleNoiseToggle(noise === "none" ? "brown" : "none")}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: noise !== "none" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${noise !== "none" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              {noise === "none" ? <VolumeX size={16} style={{ color: "rgba(255,255,255,0.2)" }} /> : <Volume2 size={16} style={{ color: "rgba(255,255,255,0.5)" }} />}
            </motion.button>
          </div>

          {/* Noise selector */}
          <div className="flex gap-2.5">
            {NOISES.map((n) => {
              const NoiseIcon = n.icon;
              return (
                <motion.button
                  key={n.type}
                  onClick={() => handleNoiseToggle(n.type)}
                  whileTap={{ scale: 0.96 }}
                  className="text-[10px] px-3.5 py-2 rounded-xl font-medium flex items-center gap-1.5"
                  style={{
                    background: noise === n.type ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${noise === n.type ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)"}`,
                    color: noise === n.type ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)",
                  }}
                >
                  <NoiseIcon size={11} /> {n.label}
                </motion.button>
              );
            })}
          </div>

          {/* Completed banner */}
          <AnimatePresence>
            {completed && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="px-6 py-5 rounded-2xl text-center mx-6"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex items-center justify-center gap-2.5 mb-2">
                  <Check size={14} style={{ color: "rgba(255,255,255,0.5)" }} strokeWidth={3} />
                  <p className="text-base font-bold" style={{ color: "rgba(255,255,255,0.7)" }}>Session terminée !</p>
                </div>
                <div className="flex items-center justify-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                    <Clock size={10} /> {Math.floor(elapsed / 60)} min
                  </span>
                  <span className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                    <Zap size={10} /> +{getXpReward(Math.floor(elapsed / 60))} XP
                  </span>
                  <span className="flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                    <Target size={10} /> -{Math.floor(elapsed / 60) >= 45 ? 15 : 8}% Boss
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
            <span className="text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.15)" }}>
              <Clock size={10} /> Historique ({hyperfocusSessions.length})
            </span>
            {showHistory ? <ChevronUp size={12} style={{ color: "rgba(255,255,255,0.15)" }} /> : <ChevronDown size={12} style={{ color: "rgba(255,255,255,0.15)" }} />}
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden flex flex-col gap-2"
              >
                {hyperfocusSessions.length === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: "rgba(255,255,255,0.1)" }}>Aucune session pour le moment</p>
                )}
                {hyperfocusSessions.slice(0, 15).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.03)",
                    }}
                  >
                    <FlaskConical size={12} style={{ color: "rgba(255,255,255,0.2)" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate" style={{ color: "rgba(255,255,255,0.6)" }}>{s.taskName}</p>
                      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>
                        {new Date(s.completedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        {" · "}{s.durationMinutes} min
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold tabular-nums" style={{ color: "rgba(255,255,255,0.3)" }}>
                      +{s.durationMinutes >= 45 ? (s.durationMinutes >= 90 ? 150 : 80) : 40} XP
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <Flame size={16} style={{ color: "rgba(255,255,255,0.3)" }} />
            <div className="flex-1">
              <p className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>Streak actif : <span style={{ color: "rgba(255,255,255,0.8)" }}>{streak}</span></p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>Continue comme ça, chaque session compte !</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
