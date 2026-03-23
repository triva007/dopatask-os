"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Flame, Trophy, Crown, Target, Sparkles, FlaskConical } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

/* ─── Level System ────────────────────────────────────────────────────────── */

const LEVEL_TITLES = [
  "Débutant", "Apprenti", "Initié", "Compétent", "Avancé",
  "Expert", "Maître", "Grand Maître", "Légende", "Mythique",
  "Transcendant", "Divin",
];

function xpToLevel(xp: number) { return Math.floor(Math.sqrt(xp / 50)) + 1; }
function xpForNextLevel(level: number) { return (level * level) * 50; }

/* ─── 3D Activity Ring ────────────────────────────────────────────────────── */

function ActivityRing({ progress, size, strokeWidth, color, glowColor }: {
  progress: number; size: number; strokeWidth: number; color: string; glowColor: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, progress / 100));

  return (
    <svg width={size} height={size} className="transform -rotate-90" style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} />
      <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={`url(#grad-${color.replace('#','')})`} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference}
        animate={{ strokeDashoffset: offset }}
        transition={{ type: "spring", stiffness: 60, damping: 20 }}
      />
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Boss 3D Rings ───────────────────────────────────────────────────────── */

function BossRings({ hp, xpProgress, streak }: { hp: number; xpProgress: number; streak: number }) {
  const streakProgress = Math.min(100, streak * 10);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 150, height: 150 }}>
      <div className="absolute inset-0">
        <ActivityRing progress={hp} size={150} strokeWidth={10} color="#fb7185" glowColor="rgba(251,113,133,0.15)" />
      </div>
      <div className="absolute" style={{ top: 15, left: 15 }}>
        <ActivityRing progress={xpProgress} size={120} strokeWidth={10} color="#4ade80" glowColor="rgba(74,222,128,0.15)" />
      </div>
      <div className="absolute" style={{ top: 30, left: 30 }}>
        <ActivityRing progress={streakProgress} size={90} strokeWidth={10} color="#fbbf24" glowColor="rgba(251,191,36,0.15)" />
      </div>
      {/* Center icon — 3D orb */}
      <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 20px rgba(167,139,250,0.08)",
        }}
      >
        <Zap size={20} className="text-dopa-violet" />
      </div>
    </div>
  );
}

/* ─── Stat Card 3D ────────────────────────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Zap; label: string; value: string | number; color: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Subtle corner glow */}
      <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${color}08, transparent 70%)` }}
      />
      <span className="text-[10px] text-zinc-600 uppercase tracking-wider flex items-center gap-1 relative z-10">
        <Icon size={9} style={{ color }} /> {label}
      </span>
      <motion.span
        key={String(value)}
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-lg font-semibold leading-none tabular-nums relative z-10"
        style={{ color }}
      >
        {value}
      </motion.span>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────────── */

export default function DopamineColumn() {
  const {
    xp, streak, bossHp, lastCritical,
    totalTasksCompleted, totalFocusMinutes,
    unlockedAchievements,
    dailyChallengeId, dailyChallengeCompleted,
  } = useAppStore();
  const [criticalFlash, setCriticalFlash] = useState(false);
  const [prevHp, setPrevHp] = useState(bossHp);

  useEffect(() => {
    if (bossHp < prevHp && lastCritical) {
      setCriticalFlash(true);
      setTimeout(() => setCriticalFlash(false), 800);
    }
    setPrevHp(bossHp);
  }, [bossHp, lastCritical, prevHp]);

  const level = xpToLevel(xp);
  const nextLevelXp = xpForNextLevel(level);
  const prevLevelXp = xpForNextLevel(level - 1);
  const xpProg = Math.min(100, ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100);
  const levelTitle = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  return (
    <div className="flex flex-col h-full px-5 py-6 gap-4 relative overflow-y-auto">
      {/* Ambient glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(167,139,250,0.04), transparent 70%)", filter: "blur(40px)" }}
      />

      {/* Header */}
      <div className="shrink-0 relative z-10">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest">Dopamine</span>
      </div>

      {/* Activity Rings — 3D Glass Container */}
      <div className="shrink-0 flex flex-col items-center gap-4 py-5 rounded-3xl relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* Mesh gradient background */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(circle at 30% 30%, rgba(251,113,133,0.04), transparent 50%), radial-gradient(circle at 70% 70%, rgba(74,222,128,0.03), transparent 50%)" }}
        />

        <AnimatePresence>
          {criticalFlash && (
            <motion.div key="flash" initial={{ opacity: 0.5 }} animate={{ opacity: 0 }} transition={{ duration: 0.8 }}
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(167,139,250,0.2), transparent 60%)" }}
            />
          )}
        </AnimatePresence>

        <BossRings hp={bossHp} xpProgress={xpProg} streak={streak} />

        {/* Ring legend */}
        <div className="flex items-center gap-4 text-[10px] text-zinc-500 relative z-10">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: "#fb7185", boxShadow: "0 0 4px rgba(251,113,133,0.4)" }} /> Boss {bossHp}%
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: "#4ade80", boxShadow: "0 0 4px rgba(74,222,128,0.4)" }} /> XP
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: "#fbbf24", boxShadow: "0 0 4px rgba(251,191,36,0.4)" }} /> Streak
          </div>
        </div>

        <AnimatePresence>
          {bossHp === 0 && (
            <motion.div initial={{ opacity: 0, y: 4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              className="px-4 py-2 rounded-xl relative z-10"
              style={{
                background: "linear-gradient(135deg, rgba(74,222,128,0.1), rgba(74,222,128,0.04))",
                border: "1px solid rgba(74,222,128,0.2)",
                boxShadow: "0 0 20px rgba(74,222,128,0.1)",
              }}
            >
              <p className="text-xs font-semibold" style={{ color: "#4ade80" }}>Boss vaincu</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Level Badge — 3D Premium */}
      <div className="shrink-0 flex items-center gap-3 p-3.5 rounded-2xl relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Gradient corner accent */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(circle at 0% 50%, rgba(167,139,250,0.06), transparent 50%)" }}
        />
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm relative z-10"
          style={{
            background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))",
            color: "#fbbf24",
            border: "1px solid rgba(251,191,36,0.2)",
            boxShadow: "0 2px 8px rgba(251,191,36,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >{level}</div>
        <div className="relative z-10 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Crown size={11} style={{ color: "#a78bfa" }} />
            <p className="text-xs font-medium text-zinc-300">{levelTitle}</p>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mt-1.5" style={{ background: "rgba(255,255,255,0.04)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
                boxShadow: "0 0 8px rgba(251,191,36,0.3)",
              }}
              animate={{ width: `${xpProg}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
            />
          </div>
          <p className="text-[9px] text-zinc-700 mt-1 font-mono">{nextLevelXp - xp} XP → Niv. {level + 1}</p>
        </div>
      </div>

      {/* Stats Grid — 3D Cards */}
      <div className="shrink-0 grid grid-cols-2 gap-2.5 relative z-10">
        <StatCard icon={Zap} label="XP" value={xp.toLocaleString()} color="#4ade80" />
        <StatCard icon={Flame} label="Streak" value={streak} color="#fbbf24" />
        <StatCard icon={Target} label="Tâches" value={totalTasksCompleted} color="#a1a1aa" />
        <StatCard icon={FlaskConical} label="Focus" value={totalFocusMinutes >= 60 ? `${Math.floor(totalFocusMinutes / 60)}h` : `${totalFocusMinutes}m`} color="#a1a1aa" />
      </div>

      {/* Daily Challenge */}
      {dailyChallengeId && !dailyChallengeCompleted && (
        <div className="shrink-0 px-3.5 py-3 rounded-2xl flex items-center gap-2.5 relative z-10"
          style={{
            background: "linear-gradient(135deg, rgba(251,191,36,0.06), rgba(251,191,36,0.02))",
            border: "1px solid rgba(251,191,36,0.12)",
            boxShadow: "0 0 16px rgba(251,191,36,0.05), inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          <Sparkles size={13} style={{ color: "#fbbf24" }} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold" style={{ color: "#fbbf24" }}>Défi du jour</p>
            <p className="text-[9px] text-zinc-600 truncate">+150 XP en jeu</p>
          </div>
        </div>
      )}
      {dailyChallengeCompleted && (
        <div className="shrink-0 px-3.5 py-3 rounded-2xl flex items-center gap-2.5 relative z-10"
          style={{
            background: "linear-gradient(135deg, rgba(74,222,128,0.06), rgba(74,222,128,0.02))",
            border: "1px solid rgba(74,222,128,0.12)",
            boxShadow: "0 0 16px rgba(74,222,128,0.05)",
          }}
        >
          <Sparkles size={13} style={{ color: "#4ade80" }} />
          <p className="text-[10px] font-semibold" style={{ color: "#4ade80" }}>Défi complété !</p>
        </div>
      )}

      {/* Achievements Mini */}
      {unlockedAchievements.length > 0 && (
        <div className="shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl relative z-10"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.04)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          <Trophy size={11} style={{ color: "#a78bfa" }} />
          <span className="text-[10px] text-zinc-400">{unlockedAchievements.length} achievement{unlockedAchievements.length > 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Rewards — 3D boutique preview */}
      <div className="flex-1 flex flex-col gap-2.5 min-h-0 relative z-10">
        <div className="flex items-center gap-1.5">
          <Trophy size={10} className="text-zinc-600" />
          <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">Récompenses</span>
        </div>

        <div className="flex flex-col gap-2">
          {[
            { label: "Café", cost: 80, color: "#fbbf24", icon: "☕" },
            { label: "Pause 15min", cost: 250, color: "#22d3ee", icon: "🚶" },
            { label: "Gaming", cost: 450, color: "#a78bfa", icon: "🎮" },
          ].map(({ label, cost, color, icon }) => {
            const canBuy = xp >= cost;
            return (
              <motion.div
                key={label}
                whileHover={canBuy ? { scale: 1.02, y: -1 } : {}}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all cursor-default"
                style={{
                  border: `1px solid ${canBuy ? `${color}20` : "rgba(255,255,255,0.03)"}`,
                  background: canBuy ? `linear-gradient(135deg, ${color}08, transparent)` : "rgba(255,255,255,0.01)",
                  opacity: canBuy ? 1 : 0.4,
                  boxShadow: canBuy ? `0 2px 8px ${color}08, inset 0 1px 0 rgba(255,255,255,0.03)` : "none",
                  cursor: canBuy ? "pointer" : "not-allowed",
                }}
              >
                <span className="text-sm">{icon}</span>
                <span className="text-[11px] text-zinc-400 flex-1">{label}</span>
                <span className="text-[10px] font-semibold tabular-nums font-mono" style={{ color: canBuy ? color : "#3f3f46" }}>{cost}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
