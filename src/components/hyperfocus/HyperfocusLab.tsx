"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Volume2, VolumeX, FlaskConical } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const PRESETS = [
  { label: "25 min", minutes: 25 },
  { label: "45 min", minutes: 45 },
  { label: "90 min", minutes: 90 },
];

type NoiseType = "brown" | "white" | "none";
const NOISES: { type: NoiseType; label: string }[] = [
  { type: "none",  label: "Silence" },
  { type: "brown", label: "Brown" },
  { type: "white", label: "White" },
];

export default function HyperfocusLab() {
  const { addHyperfocusSession, addXp, damageBoss } = useAppStore();
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [noise, setNoise] = useState<NoiseType>("none");
  const [taskName, setTaskName] = useState("");
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const totalSeconds = duration * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const stopNoise = useCallback(() => {
    if (sourceRef.current) { try { sourceRef.current.stop(); } catch {} sourceRef.current = null; }
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
    gain.gain.value = 0.15;
    src.connect(gain).connect(ctx.destination);
    src.start();
    sourceRef.current = src;
  }, [stopNoise]);

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && running) {
      setRunning(false);
      stopNoise();
      setCompleted(true);
      addHyperfocusSession({ taskName: taskName || "Focus", durationMinutes: duration, completedAt: Date.now(), noise });
      addXp(duration >= 45 ? 80 : 40);
      damageBoss(duration >= 45 ? 15 : 8);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, timeLeft, duration, noise, taskName, addHyperfocusSession, addXp, damageBoss, stopNoise]);

  const handleStart = () => { setRunning(true); setCompleted(false); if (noise !== "none") playNoise(noise); };
  const handlePause = () => { setRunning(false); stopNoise(); };
  const handleReset = () => { setRunning(false); stopNoise(); setTimeLeft(duration * 60); setCompleted(false); };
  const handlePreset = (m: number) => { setDuration(m); setTimeLeft(m * 60); setRunning(false); stopNoise(); setCompleted(false); };

  const handleNoiseToggle = (type: NoiseType) => {
    setNoise(type);
    if (running) {
      if (type !== "none") { playNoise(type); } else { stopNoise(); }
    }
  };

  // Ring SVG
  const ringSize = 200;
  const strokeWidth = 8;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-7 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <h1 className="text-lg font-semibold text-zinc-100 tracking-tight flex items-center gap-2.5">
          <FlaskConical size={18} className="text-zinc-400" /> Focus Lab
        </h1>
        <p className="text-xs text-zinc-600 mt-1">Deep work avec bruit ambiant</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center gap-8 px-8 py-8">
        {/* Timer ring */}
        <div className="relative flex items-center justify-center" style={{ width: ringSize, height: ringSize }}>
          <svg width={ringSize} height={ringSize} className="transform -rotate-90">
            <circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
            <motion.circle cx={ringSize / 2} cy={ringSize / 2} r={radius} fill="none"
              stroke={completed ? "#4ade80" : "rgba(255,255,255,0.2)"}
              strokeWidth={strokeWidth} strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-light text-zinc-100 tabular-nums tracking-tight">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <span className="text-[10px] text-zinc-600 mt-1">{duration} min session</span>
          </div>
        </div>

        {/* Task name */}
        <input value={taskName} onChange={(e) => setTaskName(e.target.value)} placeholder="Sur quoi travailles-tu ?"
          className="text-center text-sm bg-transparent text-zinc-300 placeholder:text-zinc-700 focus:outline-none w-64 border-b pb-2"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        />

        {/* Preset buttons */}
        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <button key={p.minutes} onClick={() => handlePreset(p.minutes)} className="text-xs px-4 py-2 rounded-xl font-medium transition-all"
              style={{
                background: duration === p.minutes ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${duration === p.minutes ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
                color: duration === p.minutes ? "#e4e4e7" : "#71717a",
              }}
            >{p.label}</button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button onClick={handleReset} className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <RotateCcw size={15} className="text-zinc-400" />
          </button>
          <button onClick={running ? handlePause : handleStart}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
            style={{ background: running ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)", border: `1px solid ${running ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.15)"}` }}
          >
            {running ? <Pause size={20} className="text-zinc-200" /> : <Play size={20} className="text-zinc-200 ml-0.5" />}
          </button>
          <button onClick={() => handleNoiseToggle(noise === "none" ? "brown" : "none")}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {noise === "none" ? <VolumeX size={15} className="text-zinc-500" /> : <Volume2 size={15} className="text-zinc-300" />}
          </button>
        </div>

        {/* Noise selector */}
        <div className="flex gap-2">
          {NOISES.map((n) => (
            <button key={n.type} onClick={() => handleNoiseToggle(n.type)} className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{
                background: noise === n.type ? "rgba(255,255,255,0.08)" : "transparent",
                border: `1px solid ${noise === n.type ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
                color: noise === n.type ? "#e4e4e7" : "#52525b",
              }}
            >{n.label}</button>
          ))}
        </div>

        {/* Completed banner */}
        <AnimatePresence>
          {completed && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="px-5 py-3 rounded-2xl text-center"
              style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.12)" }}
            >
              <p className="text-sm font-medium" style={{ color: "#4ade80" }}>Session terminée</p>
              <p className="text-[10px] text-zinc-500 mt-1">+{duration >= 45 ? 80 : 40} XP gagnés</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}