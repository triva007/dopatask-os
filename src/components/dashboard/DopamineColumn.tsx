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

/* ─── Apple Activity Ring ─────────────────────────────────────────────────── */

function ActivityRing({ progress, size, strokeWidth, color }: {
  progress: number; size: number; strokeWidth: number; color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, progress / 100));

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="var(--surface-4)" strokeWidth={strokeWidth} />
      <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference}
        animate={{ strokeDashoffset: offset }}
        transition={{ type: "spring", stiffness: 60, damping: 20 }}
      />
    </svg>
  );
}

/* ─── Boss Activity Rings ─────────────────────────────────────────────────── */

function BossRings({ hp, xpProgress, streak, bossLevel }: { hp: number; xpProgress: number; streak: number; bossLevel: number }) {
  const streakProgress = Math.min(100, streak * 10);
  const [deathPulse, setDeathPulse] = useState(false);

  useEffect(() => {
    if (hp === 0 && !deathPulse) {
      setDeathPulse(true);
    }
  }, [hp, deathPulse]);

  return (
    <div className="relative flex flex-col items-center justify-center gap-3">
      {/* Boss Level Badge */}
      <div className="px-2.5 py-1 rounded-lg bg-accent-red-light" style={{ border: "1px solid rgba(255,59,48,0.2)" }}>
        <span className="text-xs font-semibold text-accent-red">Boss Niv. {bossLevel}</span>
      </div>

      {/* Rings Container */}
      <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
        <AnimatePresence>
          {deathPulse && hp === 0 && (
            <>
              <motion.div
                key="pulse-1"
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ border: "2px solid var(--accent-red)" }}
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.3, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
              <motion.div
                key="pulse-2"
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ border: "2px solid var(--accent-red)" }}
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              />
            </>
          )}
        </AnimatePresence>

        <div className="absolute inset-0">
          <ActivityRing progress={hp} size={140} strokeWidth={10} color="var(--accent-red)" />
        </div>
        <div className="absolute" style={{ top: 14, left: 14 }}>
          <ActivityRing progress={xpProgress} size={112} strokeWidth={10} color="var(--accent-blue)" />
        </div>
        <div className="absolute" style={{ top: 28, left: 28 }}>
          <ActivityRing progress={streakProgress} size={84} strokeWidth={10} color="var(--accent-orange)" />
        </div>
        <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-background">
          <Zap size={18} className="text-t-secondary" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────────── */

export default function DopamineColumn() {
  const {
    xp, streak, bossHp, lastCritical, bossLevel,
    totalTasksCompleted, totalFocusMinutes,
    unlockedAchievements,
    dailyChallengeId, dailyChallengeCompleted,
    buyReward, addToast,
  } = useAppStore();
  const [criticalFlash, setCriticalFlash] = useState(false);
  const [prevHp, setPrevHp] = useState(bossHp);
  const [prevLevel, setPrevLevel] = useState(xpToLevel(xp));
  const [brainCount, setBrainCount] = useState(Math.floor(Math.random() * 200 + 100));
  const [levelUpText, setLevelUpText] = useState<string | null>(null);

  useEffect(() => {
    if (bossHp < prevHp && lastCritical) {
      setCriticalFlash(true);
      setTimeout(() => setCriticalFlash(false), 800);
    }
    setPrevHp(bossHp);
  }, [bossHp, lastCritical, prevHp]);

  const level = xpToLevel(xp);

  useEffect(() => {
    if (level > prevLevel) {
      setLevelUpText(`Niveau ${level} !`);
      setTimeout(() => setLevelUpText(null), 2000);
      setPrevLevel(level);
    }
  }, [level, prevLevel]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBrainCount(Math.floor(Math.random() * 200 + 100));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const nextLevelXp = xpForNextLevel(level);
  const prevLevelXp = xpForNextLevel(level - 1);
  const xpProg = Math.min(100, ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100);
  const levelTitle = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  const handleBuyReward = (rewardLabel: string, cost: number) => {
    buyReward(rewardLabel, cost);
    addToast(`${rewardLabel} acheté !`, "success");
  };

  return (
    <div className="flex flex-col h-full px-5 py-6 gap-4">
      {/* Header */}
      <div className="shrink-0">
        <span className="text-[11px] font-medium text-t-secondary uppercase tracking-widest">Dopamine</span>
      </div>

      {/* Activity Rings */}
      <div className="shrink-0 flex flex-col items-center gap-5 py-6 rounded-2xl relative bg-surface border border-b-primary shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <AnimatePresence>
          {criticalFlash && (
            <motion.div key="flash" initial={{ opacity: 0.4 }} animate={{ opacity: 0 }} className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(255,59,48,0.1), transparent 70%)" }} />
          )}
        </AnimatePresence>

        <BossRings hp={bossHp} xpProgress={xpProg} streak={streak} bossLevel={bossLevel} />

        {/* Level-up Celebration */}
        <AnimatePresence>
          {levelUpText && (
            <motion.div
              key="levelup"
              initial={{ opacity: 0, y: -10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="px-4 py-2 rounded-xl bg-accent-blue-light"
              style={{ border: "1px solid rgba(0,113,227,0.2)" }}
            >
              <p className="text-xs font-bold text-accent-blue">{levelUpText}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ring legend */}
        <div className="flex items-center gap-4 text-[10px] text-t-secondary">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent-red" /> Boss {bossHp}%
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent-blue" /> XP
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent-orange" /> Streak
          </div>
        </div>

        <AnimatePresence>
          {bossHp === 0 && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="px-3 py-1.5 rounded-xl bg-accent-green-light"
              style={{ border: "1px solid rgba(52,199,89,0.2)" }}>
              <p className="text-xs font-medium text-accent-green">Boss vaincu</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Level Badge — Premium */}
      <div className="shrink-0 flex items-center gap-4 p-4 rounded-2xl relative overflow-hidden bg-surface border border-b-primary shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at left center, rgba(0,113,227,0.03), transparent 60%)" }} />
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm relative z-10 bg-accent-blue-light text-accent-blue"
          style={{ border: "1px solid rgba(0,113,227,0.1)" }}
        >{level}</div>
        <div className="relative z-10 flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Crown size={11} className="text-accent-purple" />
            <p className="text-xs font-medium text-t-primary">{levelTitle}</p>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mt-1.5 border-b-primary" style={{ background: "var(--border-b-primary)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, var(--accent-blue), #0A84FF)" }}
              animate={{ width: `${xpProg}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
            />
          </div>
          <p className="text-[9px] text-t-secondary mt-1">{nextLevelXp - xp} XP → Niv. {level + 1}</p>
        </div>
      </div>

      {/* Body Doubling Section */}
      <div className="shrink-0 px-4 py-3 rounded-2xl bg-surface border border-b-primary shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex items-center gap-2.5">
        <span className="text-lg">🧠</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-t-primary">{brainCount} cerveaux en focus maintenant</p>
          <p className="text-[9px] text-t-secondary">Body doubling en direct</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="shrink-0 grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1.5 p-5 rounded-2xl bg-surface border border-b-primary shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all">
          <span className="text-[13px] text-t-secondary uppercase tracking-wider flex items-center gap-1">
            <Zap size={8} className="text-accent-blue" /> XP
          </span>
          <motion.span key={xp} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="text-2xl font-semibold leading-none tabular-nums text-accent-blue">
            {xp.toLocaleString()}
          </motion.span>
        </div>

        <div className="flex flex-col gap-1.5 p-5 rounded-2xl bg-surface border border-b-primary shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all">
          <span className="text-[13px] text-t-secondary uppercase tracking-wider flex items-center gap-1">
            <Flame size={8} className="text-accent-orange" /> Streak
          </span>
          <motion.span key={streak} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="text-2xl font-semibold leading-none tabular-nums text-accent-orange">
            {streak}
          </motion.span>
        </div>

        <div className="flex flex-col gap-1.5 p-5 rounded-2xl bg-surface border border-b-primary shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all">
          <span className="text-[13px] text-t-secondary uppercase tracking-wider flex items-center gap-1">
            <Target size={8} className="text-t-secondary" /> Tâches
          </span>
          <span className="text-2xl font-semibold leading-none tabular-nums text-t-primary">{totalTasksCompleted}</span>
        </div>

        <div className="flex flex-col gap-1.5 p-5 rounded-2xl bg-surface border border-b-primary shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all">
          <span className="text-[13px] text-t-secondary uppercase tracking-wider flex items-center gap-1">
            <FlaskConical size={8} className="text-t-secondary" /> Focus
          </span>
          <span className="text-2xl font-semibold leading-none tabular-nums text-t-primary">
            {totalFocusMinutes >= 60 ? `${Math.floor(totalFocusMinutes / 60)}h` : `${totalFocusMinutes}m`}
          </span>
        </div>
      </div>

      {/* Daily Challenge Mini */}
      {dailyChallengeId && !dailyChallengeCompleted && (
        <div className="shrink-0 px-3 py-2.5 rounded-2xl flex items-center gap-2.5 bg-accent-orange-light"
          style={{ border: "1px solid rgba(255,149,0,0.15)" }}
        >
          <Sparkles size={12} className="text-accent-orange" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-accent-orange">Défi du jour</p>
            <p className="text-[9px] text-t-secondary truncate">+150 XP en jeu</p>
          </div>
        </div>
      )}
      {dailyChallengeCompleted && (
        <div className="shrink-0 px-3 py-2.5 rounded-2xl flex items-center gap-2.5 bg-accent-green-light"
          style={{ border: "1px solid rgba(52,199,89,0.15)" }}
        >
          <Sparkles size={12} className="text-accent-green" />
          <p className="text-[10px] font-medium text-accent-green">Défi complété !</p>
        </div>
      )}

      {/* Achievements Mini */}
      {unlockedAchievements.length > 0 && (
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-b-primary shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
        >
          <Trophy size={11} className="text-accent-purple" />
          <span className="text-[10px] text-[#3C3C43]">{unlockedAchievements.length} achievement{unlockedAchievements.length > 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Rewards preview */}
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        <div className="flex items-center gap-1.5">
          <Trophy size={10} className="text-t-secondary" />
          <span className="text-[10px] font-medium text-t-secondary uppercase tracking-wider">Récompenses</span>
        </div>

        <div className="flex flex-col gap-1.5">
          {[
            { label: "Café", cost: 80, color: "var(--accent-orange)", emoji: "☕" },
            { label: "Pause 15min", cost: 250, color: "var(--accent-blue)", emoji: "🚶" },
            { label: "Gaming", cost: 450, color: "var(--accent-purple)", emoji: "🎮" },
          ].map(({ label, cost, color, emoji }) => {
            const canBuy = xp >= cost;
            return (
              <motion.button
                key={label}
                onClick={() => canBuy && handleBuyReward(label, cost)}
                disabled={!canBuy}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all bg-surface text-left"
                style={{
                  border: `1px solid ${canBuy ? "var(--border-b-primary)" : "var(--surface-4)"}`,
                  opacity: canBuy ? 1 : 0.4,
                  boxShadow: canBuy ? "0 1px 3px rgba(0,0,0,0.02)" : "none",
                  cursor: canBuy ? "pointer" : "default",
                }}
                whileHover={canBuy ? { y: -1, boxShadow: "0 2px 6px rgba(0,0,0,0.05)" } : {}}
                whileTap={canBuy ? { scale: 0.98 } : {}}
              >
                <span className="text-sm">{emoji}</span>
                <span className="text-[11px] text-t-primary flex-1">{label}</span>
                <span className="text-[10px] font-medium tabular-nums" style={{ color: canBuy ? color : "var(--text-t-tertiary)" }}>{cost}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
