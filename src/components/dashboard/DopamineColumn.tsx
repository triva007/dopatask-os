"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Flame, Trophy, Crown } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

// ─── Apple Activity Ring ─────────────────────────────────────────────────────

function ActivityRing({ progress, size, strokeWidth, color }: {
  progress: number; size: number; strokeWidth: number; color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, progress / 100));

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
      <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference}
        animate={{ strokeDashoffset: offset }}
        transition={{ type: "spring", stiffness: 60, damping: 20 }}
      />
    </svg>
  );
}

// ─── Boss Activity Rings ──────────────────────────────────────────────────────

function BossRings({ hp, xpProgress, streak }: { hp: number; xpProgress: number; streak: number }) {
  const streakProgress = Math.min(100, streak * 10);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      {/* Outer ring — Boss HP (red) */}
      <div className="absolute inset-0">
        <ActivityRing progress={hp} size={140} strokeWidth={10} color="#fca5a5" />
      </div>
      {/* Middle ring — XP level (green) */}
      <div className="absolute" style={{ top: 14, left: 14 }}>
        <ActivityRing progress={xpProgress} size={112} strokeWidth={10} color="#4ade80" />
      </div>
      {/* Inner ring — Streak (amber) */}
      <div className="absolute" style={{ top: 28, left: 28 }}>
        <ActivityRing progress={streakProgress} size={84} strokeWidth={10} color="#fbbf24" />
      </div>
      {/* Center icon */}
      <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }}>
        <Zap size={18} className="text-zinc-400" />
      </div>
    </div>
  );
}

export default function DopamineColumn() {
  const { xp, streak, bossHp, lastCritical } = useAppStore();
  const [criticalFlash, setCriticalFlash] = useState(false);
  const [prevHp, setPrevHp] = useState(bossHp);

  useEffect(() => {
    if (bossHp < prevHp && lastCritical) {
      setCriticalFlash(true);
      setTimeout(() => setCriticalFlash(false), 800);
    }
    setPrevHp(bossHp);
  }, [bossHp, lastCritical, prevHp]);

  const level = Math.floor(xp / 200) + 1;
  const xpNext = level * 200;
  const xpProg = ((xp % 200) / 200) * 100;

  return (
    <div className="flex flex-col h-full px-5 py-6 gap-5">
      {/* Header */}
      <div className="shrink-0">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest">Dopamine</span>
      </div>

      {/* Activity Rings */}
      <div className="shrink-0 flex flex-col items-center gap-4 py-4 rounded-2xl relative" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
        <AnimatePresence>
          {criticalFlash && (
            <motion.div key="flash" initial={{ opacity: 0.4 }} animate={{ opacity: 0 }} className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(167,139,250,0.15), transparent 70%)" }} />
          )}
        </AnimatePresence>

        <BossRings hp={bossHp} xpProgress={xpProg} streak={streak} />

        {/* Ring legend */}
        <div className="flex items-center gap-4 text-[10px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: "#fca5a5" }} />
            Boss {bossHp}%
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: "#4ade80" }} />
            XP
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: "#fbbf24" }} />
            Streak
          </div>
        </div>

        <AnimatePresence>
          {bossHp === 0 && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="px-3 py-1.5 rounded-xl"
              style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.12)" }}>
              <p className="text-xs font-medium" style={{ color: "#4ade80" }}>Boss vaincu</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats */}
      <div className="shrink-0 grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1 p-3.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider">XP</span>
          <motion.span key={xp} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="text-xl font-semibold leading-none tabular-nums" style={{ color: "#4ade80" }}>
            {xp.toLocaleString()}
          </motion.span>
          <span className="text-[9px] text-zinc-700 mt-1">Niv. {level} · {xp % 200}/{200}</span>
        </div>

        <div className="flex flex-col gap-1 p-3.5 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider flex items-center gap-1">
            <Flame size={9} style={{ color: "#fbbf24" }} /> Streak
          </span>
          <motion.span key={streak} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="text-xl font-semibold leading-none tabular-nums" style={{ color: "#fbbf24" }}>
            {streak}
          </motion.span>
          <span className="text-[9px] text-zinc-700 mt-1">d&apos;affilée</span>
        </div>
      </div>

      {/* Level badge */}
      <div className="shrink-0 flex items-center gap-3 p-3 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(167,139,250,0.08)" }}>
          <Crown size={14} style={{ color: "#a78bfa" }} />
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-300">Niveau {level}</p>
          <p className="text-[10px] text-zinc-600">{xpNext - xp} XP restants</p>
        </div>
      </div>

      {/* Rewards preview */}
      <div className="flex-1 flex flex-col gap-2.5 min-h-0">
        <div className="flex items-center gap-1.5">
          <Trophy size={10} className="text-zinc-600" />
          <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">Récompenses</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {[
            { label: "Café", cost: 100, color: "#fbbf24" },
            { label: "Pause", cost: 200, color: "#67e8f9" },
            { label: "Gaming", cost: 500, color: "#a78bfa" },
          ].map(({ label, cost, color }) => {
            const canBuy = xp >= cost;
            return (
              <div key={label} className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
                style={{ border: `1px solid ${canBuy ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)"}`, opacity: canBuy ? 1 : 0.4 }}
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-[11px] text-zinc-400 flex-1">{label}</span>
                <span className="text-[10px] font-medium tabular-nums" style={{ color: canBuy ? color : "#3f3f46" }}>{cost}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}