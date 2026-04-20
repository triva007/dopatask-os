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
    <div className="flex flex-col h-full px-8 pt-8 pb-5 gap-6 overflow-y-auto">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight leading-none">
          Niveau {level}
        </h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-2">
          {levelTitle} · Progression
        </p>
      </div>

      {/* Level Ring */}
      <div className="shrink-0 flex flex-col items-center gap-5 py-8 rounded-xl bg-[var(--card-bg)] border border-[var(--border-primary)] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "transparent" }} />
        <div className="relative flex items-center justify-center" style={{ width: 132, height: 132 }}>
          <ProgressRing progress={xpProg} size={132} strokeWidth={7} color="var(--accent-blue)" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[32px] font-semibold text-[var(--text-primary)] tabular-nums leading-none">{level}</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5 relative z-10 text-center">
          <p className="text-[12px] text-[var(--text-secondary)] tabular-nums">
            {(nextLevelXp - xp).toLocaleString()} XP restants
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
            <Zap size={10} style={{ color: "var(--accent-blue)" }} />
            <span className="tabular-nums">{xp.toLocaleString()} XP</span>
          </div>
        </div>

        <AnimatePresence>
          {levelUpText && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-3 right-3 px-2.5 py-1 rounded-md text-[10px] font-semibold"
              style={{ background: "var(--accent-green-light)", color: "var(--accent-green)" }}
            >
              +1 {levelUpText}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stat trio */}
      <div className="shrink-0 grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-[var(--card-bg)] border border-[var(--border-primary)]">
          <Flame size={11} style={{ color: "var(--accent-orange)" }} />
          <span className="text-[18px] font-semibold tabular-nums text-[var(--text-primary)] leading-none">{streak}</span>
          <span className="text-[10px] text-[var(--text-tertiary)] font-medium">Streak</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-[var(--card-bg)] border border-[var(--border-primary)]">
          <span className="text-[18px] font-semibold tabular-nums text-[var(--text-primary)] leading-none">{totalTasksCompleted}</span>
          <span className="text-[10px] text-[var(--text-tertiary)] font-medium">Tâches</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-[var(--card-bg)] border border-[var(--border-primary)]">
          <span className="text-[18px] font-semibold tabular-nums text-[var(--text-primary)] leading-none">
            {totalFocusMinutes >= 60 ? `${Math.floor(totalFocusMinutes / 60)}h` : `${totalFocusMinutes}m`}
          </span>
          <span className="text-[10px] text-[var(--text-tertiary)] font-medium">Focus</span>
        </div>
      </div>

      {/* Daily Challenge */}
      {dailyChallengeId && !dailyChallengeCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="shrink-0 flex items-center gap-3 px-4 py-3 rounded-lg"
          style={{ background: "var(--accent-orange-light)", border: "1px solid var(--accent-orange)" }}
        >
          <Sparkles size={13} style={{ color: "var(--accent-orange)" }} className="shrink-0" strokeWidth={2} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium" style={{ color: "var(--accent-orange)" }}>Défi du jour</p>
            <p className="text-[11px] text-[var(--text-secondary)]">+150 XP</p>
          </div>
        </motion.div>
      )}
      {dailyChallengeCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="shrink-0 flex items-center gap-3 px-4 py-3 rounded-lg"
          style={{ background: "var(--accent-green-light)", border: "1px solid var(--accent-green)" }}
        >
          <Sparkles size={13} style={{ color: "var(--accent-green)" }} className="shrink-0" strokeWidth={2} />
          <p className="text-[12px] font-medium" style={{ color: "var(--accent-green)" }}>Défi complété !</p>
        </motion.div>
      )}

      {/* Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-lg bg-[var(--card-bg)] border border-[var(--border-primary)]">
          <Trophy size={13} style={{ color: "var(--accent-purple)" }} className="shrink-0" strokeWidth={2} />
          <span className="text-[12px] font-medium text-[var(--text-primary)]">
            {unlockedAchievements.length} récompense{unlockedAchievements.length > 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Rewards */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        <p className="text-[12px] font-semibold text-[var(--text-secondary)]">
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
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors bg-[var(--card-bg)] border border-[var(--border-primary)] hover:bg-[var(--surface-2)] text-left"
                style={{
                  opacity: canBuy ? 1 : 0.5,
                  cursor: canBuy ? "pointer" : "default",
                }}
                whileHover={canBuy ? { scale: 1.01 } : {}}
                whileTap={canBuy ? { scale: 0.98 } : {}}
              >
                <span className="text-[14px]">{emoji}</span>
                <span className="text-[13px] font-medium text-[var(--text-primary)] flex-1">{label}</span>
                <span
                  className="text-[12px] font-semibold tabular-nums"
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
