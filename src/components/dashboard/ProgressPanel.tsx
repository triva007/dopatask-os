"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, Sparkles, Zap } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const LEVEL_TITLES = [
  "Débutant", "Apprenti", "Initié", "Compétent", "Avancé",
  "Expert", "Maître", "Grand Maître", "Légende", "Mythique",
  "Transcendant", "Divin",
];

function xpToLevel(xp: number) { return Math.floor(Math.sqrt(xp / 50)) + 1; }
function xpForNextLevel(level: number) { return (level * level) * 50; }

/* ─── Progress Ring — minimal ─────────────────────────────────────────────── */
function ProgressRing({
  progress, size, strokeWidth, color, bgColor,
}: {
  progress: number; size: number; strokeWidth: number; color: string; bgColor?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, progress / 100));

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke={bgColor || "var(--surface-3)"}
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        animate={{ strokeDashoffset: offset }}
        transition={{ type: "spring", stiffness: 60, damping: 20 }}
      />
    </svg>
  );
}

export default function ProgressPanel() {
  const {
    xp, streak, totalTasksCompleted, totalFocusMinutes,
    unlockedAchievements,
    dailyChallengeId, dailyChallengeCompleted,
    buyReward, addToast,
  } = useAppStore();

  const [prevLevel, setPrevLevel] = useState(xpToLevel(xp));
  const [levelUpText, setLevelUpText] = useState<string | null>(null);
  const level = xpToLevel(xp);

  useEffect(() => {
    if (level > prevLevel) {
      setLevelUpText(`Niveau ${level}`);
      setTimeout(() => setLevelUpText(null), 2200);
      setPrevLevel(level);
    }
  }, [level, prevLevel]);

  const nextLevelXp = xpForNextLevel(level);
  const prevLevelXp = xpForNextLevel(level - 1);
  const xpProg = Math.min(100, ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100);
  const levelTitle = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  const handleBuyReward = (label: string, cost: number) => {
    buyReward(label, cost);
    addToast(`${label} acheté !`, "success");
  };

  return (
    <div className="flex flex-col h-full px-6 py-10 gap-6 overflow-y-auto">
      {/* Header */}
      <div className="shrink-0">
        <p className="text-[10px] font-medium tracking-[0.22em] uppercase text-t-tertiary mb-2">
          Progression
        </p>
        <h2 className="text-[18px] font-medium text-t-primary" style={{ letterSpacing: "-0.02em" }}>
          Niveau {level}
        </h2>
        <p className="text-[13px] text-t-secondary mt-0.5">
          {levelTitle}
        </p>
      </div>

      {/* Level Ring — centered, premium */}
      <div className="shrink-0 flex flex-col items-center gap-5 py-8 rounded-2xl bg-card-bg border border-b-primary relative overflow-hidden"
        style={{ boxShadow: "var(--card-shadow)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at center top, var(--accent-blue-light), transparent 70%)",
          }}
        />
        <div className="relative flex items-center justify-center" style={{ width: 132, height: 132 }}>
          <ProgressRing progress={xpProg} size={132} strokeWidth={7} color="var(--accent-blue)" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[28px] font-semibold text-t-primary tabular-nums leading-none">{level}</span>
            <span className="text-[10px] font-medium text-t-tertiary mt-1.5 tracking-wider uppercase">Niveau</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 relative z-10">
          <p className="text-[11px] text-t-secondary tabular-nums">
            {(nextLevelXp - xp).toLocaleString()} XP → Niv. {level + 1}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] text-t-tertiary">
            <Zap size={9} className="text-accent-blue" />
            <span className="tabular-nums">{xp.toLocaleString()} XP total</span>
          </div>
        </div>

        <AnimatePresence>
          {levelUpText && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-accent-blue text-white text-[10px] font-semibold"
            >
              +1 {levelUpText}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stat trio — streak, tasks, focus */}
      <div className="shrink-0 grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card-bg border border-b-primary">
          <div className="flex items-center gap-1 text-t-tertiary">
            <Flame size={10} className="text-accent-orange" />
          </div>
          <span className="text-[18px] font-semibold tabular-nums text-t-primary leading-none">{streak}</span>
          <span className="text-[9px] text-t-tertiary uppercase tracking-wider">streak</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card-bg border border-b-primary">
          <span className="text-[18px] font-semibold tabular-nums text-t-primary leading-none mt-[18px]">{totalTasksCompleted}</span>
          <span className="text-[9px] text-t-tertiary uppercase tracking-wider">tâches</span>
        </div>
        <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-card-bg border border-b-primary">
          <span className="text-[18px] font-semibold tabular-nums text-t-primary leading-none mt-[18px]">
            {totalFocusMinutes >= 60 ? `${Math.floor(totalFocusMinutes / 60)}h` : `${totalFocusMinutes}m`}
          </span>
          <span className="text-[9px] text-t-tertiary uppercase tracking-wider">focus</span>
        </div>
      </div>

      {/* Daily Challenge */}
      {dailyChallengeId && !dailyChallengeCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl bg-accent-orange-light"
          style={{ border: "1px solid rgba(217, 148, 78, 0.2)" }}
        >
          <Sparkles size={14} className="text-accent-orange shrink-0" strokeWidth={1.8} />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-accent-orange">Défi du jour</p>
            <p className="text-[10px] text-t-secondary">+150 XP en jeu</p>
          </div>
        </motion.div>
      )}
      {dailyChallengeCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl bg-accent-green-light"
          style={{ border: "1px solid rgba(95, 168, 125, 0.2)" }}
        >
          <Sparkles size={14} className="text-accent-green shrink-0" strokeWidth={1.8} />
          <p className="text-[11px] font-medium text-accent-green">Défi complété !</p>
        </motion.div>
      )}

      {/* Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-card-bg border border-b-primary">
          <Trophy size={13} className="text-accent-purple shrink-0" strokeWidth={1.8} />
          <span className="text-[11px] text-t-primary">
            {unlockedAchievements.length} achievement{unlockedAchievements.length > 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Rewards */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        <p className="text-[10px] font-medium tracking-[0.22em] uppercase text-t-tertiary">
          Récompenses
        </p>

        <div className="flex flex-col gap-2">
          {[
            { label: "Café", cost: 80, color: "var(--accent-orange)", emoji: "☕" },
            { label: "Pause 15 min", cost: 250, color: "var(--accent-blue)", emoji: "🚶" },
            { label: "Gaming", cost: 450, color: "var(--accent-purple)", emoji: "🎮" },
          ].map(({ label, cost, color, emoji }) => {
            const canBuy = xp >= cost;
            return (
              <motion.button
                key={label}
                onClick={() => canBuy && handleBuyReward(label, cost)}
                disabled={!canBuy}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all bg-card-bg text-left"
                style={{
                  border: "1px solid var(--border-primary)",
                  opacity: canBuy ? 1 : 0.45,
                  cursor: canBuy ? "pointer" : "default",
                }}
                whileHover={canBuy ? { y: -1, borderColor: "var(--border-hover)" } : {}}
                whileTap={canBuy ? { scale: 0.98 } : {}}
              >
                <span className="text-[16px]">{emoji}</span>
                <span className="text-[12px] text-t-primary flex-1 font-medium">{label}</span>
                <span
                  className="text-[11px] font-semibold tabular-nums"
                  style={{ color: canBuy ? color : "var(--text-tertiary)" }}
                >
                  {cost}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
