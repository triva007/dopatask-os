"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Zap, Lock, CheckCircle2, Trophy, Flame,
  Star, Crown, Target, Medal, Sparkles,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

/* ─── Types & Data ─────────────────────────────────────────────────────────── */

interface Reward {
  id: string;
  emoji: string;
  name: string;
  description: string;
  cost: number;
  category: "pause" | "plaisir" | "productivite" | "premium";
  rarity: "common" | "rare" | "epic" | "legendary";
}

const RARITY_OPACITY = {
  common: 0.3,
  rare: 0.45,
  epic: 0.6,
  legendary: 0.8,
};

const REWARDS: Reward[] = [
  { id: "cafe", emoji: "☕", name: "Café / Thé", description: "Petite pause chaude méritée", cost: 80, category: "pause", rarity: "common" },
  { id: "break_5", emoji: "🌿", name: "Pause 5 min", description: "Étire-toi, respire", cost: 120, category: "pause", rarity: "common" },
  { id: "snack", emoji: "🍫", name: "Snack Reward", description: "Un encas sans culpabilité", cost: 150, category: "pause", rarity: "common" },
  { id: "break_15", emoji: "🚶", name: "Pause 15 min", description: "Balade ou détente", cost: 250, category: "pause", rarity: "rare" },
  { id: "youtube", emoji: "📱", name: "YouTube 10 min", description: "Vidéo bien méritée", cost: 200, category: "plaisir", rarity: "common" },
  { id: "musique", emoji: "🎵", name: "Playlist Libre", description: "Écoute ce que tu veux 1h", cost: 200, category: "plaisir", rarity: "common" },
  { id: "gaming", emoji: "🎮", name: "Session Gaming", description: "30 min sans culpabilité", cost: 450, category: "plaisir", rarity: "rare" },
  { id: "netflix", emoji: "🍿", name: "Épisode Netflix", description: "Un épisode, tu l'as mérité", cost: 600, category: "plaisir", rarity: "rare" },
  { id: "focus_block", emoji: "🧠", name: "Bloc Focus", description: "Sprint 90 min intense (+50 XP)", cost: 350, category: "productivite", rarity: "rare" },
  { id: "objectif", emoji: "🏆", name: "Objectif Bonus", description: "Objectif surprise débloqué", cost: 500, category: "productivite", rarity: "epic" },
  { id: "boss_reset", emoji: "💀", name: "Boss Reset", description: "Réinitialise le boss à 100%", cost: 800, category: "productivite", rarity: "epic" },
  { id: "vendredi", emoji: "🎉", name: "Vendredi +1h", description: "Finir une heure plus tôt", cost: 1000, category: "premium", rarity: "legendary" },
  { id: "day_off", emoji: "🏖️", name: "Demi-journée OFF", description: "Tu l'as mérité champion", cost: 2500, category: "premium", rarity: "legendary" },
  { id: "treat", emoji: "🎁", name: "Self Treat", description: "Cadeau pour toi-même (50€)", cost: 5000, category: "premium", rarity: "legendary" },
];

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: typeof Trophy;
  condition: (state: { totalTasksCompleted: number; streak: number; totalFocusMinutes: number; xp: number; hyperfocusSessions: number }) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: "first_task", name: "Premier Pas", description: "Complète ta première tâche", icon: Star, condition: (s) => s.totalTasksCompleted >= 1 },
  { id: "task_10", name: "Machine", description: "10 tâches complétées", icon: Zap, condition: (s) => s.totalTasksCompleted >= 10 },
  { id: "task_50", name: "Inarrêtable", description: "50 tâches complétées", icon: Flame, condition: (s) => s.totalTasksCompleted >= 50 },
  { id: "task_100", name: "Centurion", description: "100 tâches complétées", icon: Crown, condition: (s) => s.totalTasksCompleted >= 100 },
  { id: "streak_3", name: "Momentum", description: "Streak de 3", icon: Flame, condition: (s) => s.streak >= 3 },
  { id: "streak_7", name: "Semaine en Feu", description: "Streak de 7", icon: Flame, condition: (s) => s.streak >= 7 },
  { id: "focus_60", name: "Deep Worker", description: "60 min de focus total", icon: Target, condition: (s) => s.totalFocusMinutes >= 60 },
  { id: "focus_300", name: "Zone Master", description: "5h de focus total", icon: Target, condition: (s) => s.totalFocusMinutes >= 300 },
  { id: "xp_1000", name: "XP Hunter", description: "Atteins 1000 XP", icon: Sparkles, condition: (s) => s.xp >= 1000 },
  { id: "xp_5000", name: "Légende", description: "Atteins 5000 XP", icon: Medal, condition: (s) => s.xp >= 5000 },
  { id: "session_5", name: "Focus Addict", description: "5 sessions focus", icon: Target, condition: (s) => s.hyperfocusSessions >= 5 },
];

const DAILY_CHALLENGES = [
  { id: "dc_3tasks", name: "Triomphe du Trio", description: "Complète 3 tâches aujourd'hui", xpReward: 150 },
  { id: "dc_focus", name: "Deep Dive", description: "Fais une session focus de 45+ min", xpReward: 150 },
  { id: "dc_inbox", name: "Inbox Zero", description: "Traite tous les items de ton inbox", xpReward: 150 },
  { id: "dc_micro", name: "Micro-Maître", description: "Termine toutes les micro-étapes d'une tâche", xpReward: 150 },
  { id: "dc_journal", name: "Introspection", description: "Écris une entrée dans ton journal", xpReward: 150 },
];

const CATEGORY_LABELS: Record<string, string> = {
  pause: "Pauses",
  plaisir: "Plaisirs",
  productivite: "Productivité",
  premium: "Premium",
};

const LEVEL_TITLES = [
  "Débutant", "Apprenti", "Initié", "Compétent", "Avancé",
  "Expert", "Maître", "Grand Maître", "Légende", "Mythique",
  "Transcendant", "Divin",
];

function xpToLevel(xp: number) { return Math.floor(Math.sqrt(xp / 50)) + 1; }
function xpForNextLevel(level: number) { return (level * level) * 50; }

/* ─── Components ───────────────────────────────────────────────────────────── */

function RewardCard({ reward, xp, onBuy }: { reward: Reward; xp: number; onBuy: (r: Reward) => void }) {
  const canAfford = xp >= reward.cost;
  const op = RARITY_OPACITY[reward.rarity];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.97 }}
      className="flex flex-col rounded-2xl overflow-hidden transition-all"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${canAfford ? `rgba(255,255,255,${op * 0.2})` : "rgba(255,255,255,0.04)"}`,
      }}
    >
      {/* Rarity dot */}
      <div className="absolute top-3 right-3 z-10">
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: `rgba(255,255,255,${op})` }}
        />
      </div>

      {/* Emoji */}
      <div className="flex items-center justify-center py-8 text-4xl relative">
        <span className="relative z-10">{reward.emoji}</span>
      </div>

      {/* Card content */}
      <div className="flex flex-col gap-2 px-4 py-3 flex-1">
        <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
          {reward.name}
        </p>
        <p className="text-[11px] leading-relaxed flex-1" style={{ color: "rgba(255,255,255,0.25)" }}>
          {reward.description}
        </p>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}>
        <div className="flex items-center gap-1.5">
          <Zap size={11} style={{ color: "rgba(255,255,255,0.4)" }} />
          <span className="text-xs font-bold tabular-nums" style={{ color: "rgba(255,255,255,0.5)" }}>
            {reward.cost}
          </span>
        </div>
        <motion.button
          onClick={() => canAfford && onBuy(reward)}
          disabled={!canAfford}
          whileHover={canAfford ? { y: -1 } : {}}
          whileTap={canAfford ? { scale: 0.97 } : {}}
          className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: canAfford ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${canAfford ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"}`,
            color: canAfford ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.1)",
          }}
        >
          {canAfford ? "Acheter" : <Lock size={11} />}
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ─── Main ─────────────────────────────────────────────────────────────────── */

export default function BoutiqueDopamine() {
  const {
    xp, streak, buyReward, totalTasksCompleted, totalFocusMinutes,
    hyperfocusSessions, unlockedAchievements, unlockAchievement,
    dailyChallengeId, dailyChallengeCompleted, setDailyChallenge, completeDailyChallenge,
  } = useAppStore();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"shop" | "achievements" | "challenges">("shop");
  const [toast, setToast] = useState<string | null>(null);

  const level = xpToLevel(xp);
  const nextLevelXp = xpForNextLevel(level);
  const prevLevelXp = xpForNextLevel(level - 1);
  const progress = Math.min(100, ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100);
  const levelTitle = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  const categories = ["pause", "plaisir", "productivite", "premium"];
  const filtered = activeCategory ? REWARDS.filter((r) => r.category === activeCategory) : REWARDS;

  const achievementState = {
    totalTasksCompleted,
    streak,
    totalFocusMinutes,
    xp,
    hyperfocusSessions: hyperfocusSessions.length,
  };

  useEffect(() => {
    ACHIEVEMENTS.forEach((a) => {
      if (!unlockedAchievements.includes(a.id) && a.condition(achievementState)) {
        unlockAchievement(a.id);
        setToast(`Achievement: ${a.name} !`);
        setTimeout(() => setToast(null), 3000);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalTasksCompleted, streak, totalFocusMinutes, xp]);

  useEffect(() => {
    const today = new Date().toDateString();
    const storedDay = typeof window !== "undefined" ? localStorage.getItem("dc_day") : null;
    if (storedDay !== today) {
      const idx = Math.floor(Math.random() * DAILY_CHALLENGES.length);
      setDailyChallenge(DAILY_CHALLENGES[idx].id);
      if (typeof window !== "undefined") localStorage.setItem("dc_day", today);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentChallenge = DAILY_CHALLENGES.find((c) => c.id === dailyChallengeId);

  const handleBuy = (r: Reward) => {
    buyReward(r.id, r.cost);
    setToast(`${r.emoji} ${r.name} débloqué !`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-7 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2.5" style={{ color: "rgba(255,255,255,0.85)" }}>
          <ShoppingBag size={18} style={{ color: "rgba(255,255,255,0.4)" }} /> Boutique Dopamine
        </h1>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.2)" }}>
          Échange tes XP contre des récompenses
        </p>
      </div>

      {/* XP Status Bar */}
      <div className="shrink-0 px-7 py-4 flex items-center gap-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold text-base"
          style={{
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {level}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{levelTitle}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-lg font-semibold"
                style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
                Niv. {level}
              </span>
            </div>
            <span className="text-xs font-bold tabular-nums" style={{ color: "rgba(255,255,255,0.5)" }}>
              {xp.toLocaleString()} XP
            </span>
          </div>

          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "rgba(255,255,255,0.25)" }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 60, damping: 15 }}
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>{nextLevelXp - xp} XP pour le niveau {level + 1}</span>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>{totalTasksCompleted} tâches · {totalFocusMinutes} min focus</span>
          </div>
        </div>

        {streak > 0 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Flame size={11} style={{ color: "rgba(255,255,255,0.4)" }} />
            <span className="text-[11px] font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>{streak}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="shrink-0 px-7 pt-4 pb-3 flex items-center gap-2">
        {[
          { id: "shop" as const, label: "Boutique", icon: ShoppingBag },
          { id: "achievements" as const, label: "Achievements", icon: Trophy },
          { id: "challenges" as const, label: "Défis", icon: Target },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="text-xs px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2"
            style={{
              background: activeTab === tab.id ? "rgba(255,255,255,0.06)" : "transparent",
              border: `1px solid ${activeTab === tab.id ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`,
              color: activeTab === tab.id ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)",
            }}
          >
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-7 pb-6">
        <AnimatePresence mode="wait">
          {activeTab === "shop" && (
            <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Category filter */}
              <div className="flex items-center gap-2 py-4 overflow-x-auto">
                <button
                  onClick={() => setActiveCategory(null)}
                  className="text-[11px] px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all"
                  style={{
                    background: activeCategory === null ? "rgba(255,255,255,0.06)" : "transparent",
                    border: `1px solid ${activeCategory === null ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`,
                    color: activeCategory === null ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
                  }}
                >Tous ({REWARDS.length})</button>
                {categories.map((cat) => {
                  const count = REWARDS.filter((r) => r.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                      className="text-[11px] px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all"
                      style={{
                        background: activeCategory === cat ? "rgba(255,255,255,0.06)" : "transparent",
                        border: `1px solid ${activeCategory === cat ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`,
                        color: activeCategory === cat ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
                      }}
                    >{CATEGORY_LABELS[cat]} ({count})</button>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {filtered.map((r) => (
                  <RewardCard key={r.id} reward={r} xp={xp} onBuy={handleBuy} />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "achievements" && (
            <motion.div key="achievements" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3 pt-4">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {unlockedAchievements.length}/{ACHIEVEMENTS.length} débloqués
                </span>
                <div className="h-1.5 w-32 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(unlockedAchievements.length / ACHIEVEMENTS.length) * 100}%`, background: "rgba(255,255,255,0.3)" }} />
                </div>
              </div>

              {ACHIEVEMENTS.map((a) => {
                const unlocked = unlockedAchievements.includes(a.id);
                return (
                  <motion.div
                    key={a.id}
                    layout
                    className="flex items-center gap-4 px-4 py-4 rounded-2xl transition-all"
                    style={{
                      background: unlocked ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${unlocked ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`,
                      opacity: unlocked ? 1 : 0.5,
                    }}
                  >
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: unlocked ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${unlocked ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}` }}>
                      <a.icon size={16} style={{ color: unlocked ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.1)" }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: unlocked ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)" }}>{a.name}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: unlocked ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.1)" }}>{a.description}</p>
                    </div>

                    {unlocked && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 100, damping: 10 }}>
                        <CheckCircle2 size={18} style={{ color: "rgba(255,255,255,0.5)" }} className="shrink-0" />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {activeTab === "challenges" && (
            <motion.div key="challenges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 pt-4">
              {currentChallenge && (
                <div className="rounded-2xl p-5 flex flex-col gap-3"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Défi du jour</span>
                  </div>

                  <div>
                    <p className="text-base font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.85)" }}>{currentChallenge.name}</p>
                    <p className="text-[12px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{currentChallenge.description}</p>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5">
                      <Zap size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
                      <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.5)" }}>+{currentChallenge.xpReward} XP</span>
                    </div>
                    {dailyChallengeCompleted ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
                        <CheckCircle2 size={13} /> Complété
                      </span>
                    ) : (
                      <button
                        onClick={() => completeDailyChallenge()}
                        className="text-xs px-4 py-2 rounded-xl font-semibold transition-all"
                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                      >Valider</button>
                    )}
                  </div>
                </div>
              )}

              <p className="text-[10px] font-bold uppercase tracking-widest px-1 mt-2" style={{ color: "rgba(255,255,255,0.15)" }}>Défis disponibles</p>
              {DAILY_CHALLENGES.map((c) => {
                const isActive = c.id === dailyChallengeId;
                const isCompleted = isActive && dailyChallengeCompleted;
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all"
                    style={{
                      background: isActive ? "rgba(255,255,255,0.03)" : "transparent",
                      border: `1px solid ${isActive ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)"}`,
                      opacity: isActive ? 1 : 0.45,
                    }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: isActive ? "rgba(255,255,255,0.04)" : "transparent", border: `1px solid ${isActive ? "rgba(255,255,255,0.04)" : "transparent"}` }}>
                      <Target size={13} style={{ color: isActive ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.1)" }} />
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: isActive ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)" }}>{c.name}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: isActive ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)" }}>{c.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <Zap size={9} style={{ color: "rgba(255,255,255,0.3)" }} />
                        <span className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>+{c.xpReward}</span>
                      </div>
                      {isCompleted && <CheckCircle2 size={15} style={{ color: "rgba(255,255,255,0.5)" }} className="shrink-0" />}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-semibold z-50"
            style={{
              background: "rgba(20,20,22,0.95)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.8)",
            }}
          >
            <CheckCircle2 size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
