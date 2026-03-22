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

const RARITY_COLORS = {
  common: "#a1a1aa",
  rare: "#67e8f9",
  epic: "#a78bfa",
  legendary: "#fbbf24",
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
  color: string;
  condition: (state: { totalTasksCompleted: number; streak: number; totalFocusMinutes: number; xp: number; hyperfocusSessions: number }) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: "first_task", name: "Premier Pas", description: "Complète ta première tâche", icon: Star, color: "#4ade80", condition: (s) => s.totalTasksCompleted >= 1 },
  { id: "task_10", name: "Machine", description: "10 tâches complétées", icon: Zap, color: "#67e8f9", condition: (s) => s.totalTasksCompleted >= 10 },
  { id: "task_50", name: "Inarrêtable", description: "50 tâches complétées", icon: Flame, color: "#fbbf24", condition: (s) => s.totalTasksCompleted >= 50 },
  { id: "task_100", name: "Centurion", description: "100 tâches complétées", icon: Crown, color: "#a78bfa", condition: (s) => s.totalTasksCompleted >= 100 },
  { id: "streak_3", name: "Momentum", description: "Streak de 3", icon: Flame, color: "#fbbf24", condition: (s) => s.streak >= 3 },
  { id: "streak_7", name: "Semaine en Feu", description: "Streak de 7", icon: Flame, color: "#ef4444", condition: (s) => s.streak >= 7 },
  { id: "focus_60", name: "Deep Worker", description: "60 min de focus total", icon: Target, color: "#67e8f9", condition: (s) => s.totalFocusMinutes >= 60 },
  { id: "focus_300", name: "Zone Master", description: "5h de focus total", icon: Target, color: "#a78bfa", condition: (s) => s.totalFocusMinutes >= 300 },
  { id: "xp_1000", name: "XP Hunter", description: "Atteins 1000 XP", icon: Sparkles, color: "#fbbf24", condition: (s) => s.xp >= 1000 },
  { id: "xp_5000", name: "Légende", description: "Atteins 5000 XP", icon: Medal, color: "#fbbf24", condition: (s) => s.xp >= 5000 },
  { id: "session_5", name: "Focus Addict", description: "5 sessions focus", icon: Target, color: "#4ade80", condition: (s) => s.hyperfocusSessions >= 5 },
];

const DAILY_CHALLENGES = [
  { id: "dc_3tasks", name: "Triomphe du Trio", description: "Complète 3 tâches aujourd'hui", xpReward: 150 },
  { id: "dc_focus", name: "Deep Dive", description: "Fais une session focus de 45+ min", xpReward: 150 },
  { id: "dc_inbox", name: "Inbox Zero", description: "Traite tous les items de ton inbox", xpReward: 150 },
  { id: "dc_micro", name: "Micro-Maître", description: "Termine toutes les micro-étapes d'une tâche", xpReward: 150 },
  { id: "dc_journal", name: "Introspection", description: "Écris une entrée dans ton journal", xpReward: 150 },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  pause: { label: "Pauses", color: "#4ade80" },
  plaisir: { label: "Plaisirs", color: "#67e8f9" },
  productivite: { label: "Productivité", color: "#a78bfa" },
  premium: { label: "Premium", color: "#fbbf24" },
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
  const rarityColor = RARITY_COLORS[reward.rarity];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="flex flex-col rounded-2xl overflow-hidden transition-all relative"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${canAfford ? rarityColor + "25" : "rgba(255,255,255,0.04)"}`,
      }}
    >
      {/* Rarity indicator */}
      <div className="absolute top-3 right-3">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: rarityColor, boxShadow: `0 0 6px ${rarityColor}40` }} />
      </div>

      <div className="flex items-center justify-center py-6 text-3xl relative">
        {reward.rarity === "legendary" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full" style={{ background: `radial-gradient(circle, ${rarityColor}08 0%, transparent 70%)` }} />
          </div>
        )}
        <span className="relative z-10">{reward.emoji}</span>
      </div>

      <div className="flex flex-col gap-1.5 px-4 py-2 flex-1">
        <p className="text-sm text-zinc-200" style={{ fontWeight: 450 }}>{reward.name}</p>
        <p className="text-[11px] text-zinc-600 leading-relaxed flex-1">{reward.description}</p>
      </div>

      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap size={10} style={{ color: "#fbbf24" }} />
          <span className="text-xs font-medium tabular-nums" style={{ color: "#fbbf24" }}>{reward.cost}</span>
        </div>
        <button
          onClick={() => canAfford && onBuy(reward)}
          disabled={!canAfford}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          style={{
            background: canAfford ? `${rarityColor}10` : "transparent",
            border: `1px solid ${canAfford ? rarityColor + "25" : "rgba(255,255,255,0.04)"}`,
            color: canAfford ? rarityColor : "#3f3f46",
          }}
        >
          {canAfford ? "Acheter" : <Lock size={10} />}
        </button>
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

  // Auto-check achievements
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
        setToast(`🏆 Achievement: ${a.name} !`);
        setTimeout(() => setToast(null), 3000);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalTasksCompleted, streak, totalFocusMinutes, xp]);

  // Daily challenge init
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
        <h1 className="text-lg font-semibold text-zinc-100 tracking-tight flex items-center gap-2.5">
          <ShoppingBag size={18} className="text-zinc-400" /> Boutique Dopamine
        </h1>
        <p className="text-xs text-zinc-600 mt-1">Échange tes XP contre des récompenses</p>
      </div>

      {/* XP Status Bar — Premium */}
      <div className="shrink-0 px-7 py-4 flex items-center gap-4" style={{ background: "rgba(255,255,255,0.01)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold text-base"
            style={{ background: "rgba(251,191,36,0.08)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.15)" }}
          >{level}</div>
          {streak > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
              style={{ background: "#ef4444", color: "white", border: "2px solid #0a0a0a" }}>
              {streak}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-300">{levelTitle}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: "rgba(167,139,250,0.08)", color: "#a78bfa" }}>Niv. {level}</span>
            </div>
            <span className="text-xs font-medium tabular-nums" style={{ color: "#fbbf24" }}>{xp.toLocaleString()} XP</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #fbbf24, #f59e0b)" }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-zinc-700">{nextLevelXp - xp} XP pour le niveau {level + 1}</span>
            <span className="text-[10px] text-zinc-700">{totalTasksCompleted} tâches · {totalFocusMinutes} min focus</span>
          </div>
        </div>
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
            className="text-xs px-3.5 py-2 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5"
            style={{
              background: activeTab === tab.id ? "rgba(255,255,255,0.08)" : "transparent",
              border: `1px solid ${activeTab === tab.id ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
              color: activeTab === tab.id ? "#e4e4e7" : "#71717a",
            }}
          >
            <tab.icon size={12} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-7 pb-6">
        <AnimatePresence mode="wait">
          {activeTab === "shop" && (
            <motion.div key="shop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Category filter */}
              <div className="flex items-center gap-2 py-3 overflow-x-auto">
                <button
                  onClick={() => setActiveCategory(null)}
                  className="text-[11px] px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all"
                  style={{
                    background: activeCategory === null ? "rgba(255,255,255,0.08)" : "transparent",
                    border: `1px solid ${activeCategory === null ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
                    color: activeCategory === null ? "#e4e4e7" : "#71717a",
                  }}
                >Tous ({REWARDS.length})</button>
                {categories.map((cat) => {
                  const cfg = CATEGORY_LABELS[cat];
                  const count = REWARDS.filter(r => r.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                      className="text-[11px] px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all"
                      style={{
                        background: activeCategory === cat ? `${cfg.color}10` : "transparent",
                        border: `1px solid ${activeCategory === cat ? cfg.color + "25" : "rgba(255,255,255,0.04)"}`,
                        color: activeCategory === cat ? cfg.color : "#71717a",
                      }}
                    >{cfg.label} ({count})</button>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {filtered.map((r) => <RewardCard key={r.id} reward={r} xp={xp} onBuy={handleBuy} />)}
              </div>
            </motion.div>
          )}

          {activeTab === "achievements" && (
            <motion.div key="achievements" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3 pt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-zinc-500">{unlockedAchievements.length}/{ACHIEVEMENTS.length} débloqués</span>
                <div className="h-1.5 w-24 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(unlockedAchievements.length / ACHIEVEMENTS.length) * 100}%`, background: "linear-gradient(90deg, #4ade80, #67e8f9)" }} />
                </div>
              </div>

              {ACHIEVEMENTS.map((a) => {
                const unlocked = unlockedAchievements.includes(a.id);
                return (
                  <motion.div
                    key={a.id}
                    layout
                    className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all"
                    style={{
                      background: unlocked ? `${a.color}06` : "rgba(255,255,255,0.02)",
                      border: `1px solid ${unlocked ? a.color + "20" : "rgba(255,255,255,0.04)"}`,
                      opacity: unlocked ? 1 : 0.5,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        background: unlocked ? `${a.color}12` : "rgba(255,255,255,0.03)",
                        border: `1px solid ${unlocked ? a.color + "25" : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      <a.icon size={16} style={{ color: unlocked ? a.color : "#3f3f46" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: unlocked ? "#e4e4e7" : "#52525b" }}>{a.name}</p>
                      <p className="text-[11px]" style={{ color: unlocked ? "#71717a" : "#3f3f46" }}>{a.description}</p>
                    </div>
                    {unlocked && (
                      <CheckCircle2 size={16} style={{ color: a.color }} className="shrink-0" />
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {activeTab === "challenges" && (
            <motion.div key="challenges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 pt-3">
              {/* Daily challenge */}
              {currentChallenge && (
                <div className="rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden"
                  style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.12)" }}>
                  <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(251,191,36,0.06), transparent 70%)" }} />
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} style={{ color: "#fbbf24" }} />
                    <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "#fbbf24" }}>Défi du jour</span>
                  </div>
                  <p className="text-base font-medium text-zinc-200">{currentChallenge.name}</p>
                  <p className="text-[12px] text-zinc-500">{currentChallenge.description}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5">
                      <Zap size={11} style={{ color: "#fbbf24" }} />
                      <span className="text-xs font-medium" style={{ color: "#fbbf24" }}>+{currentChallenge.xpReward} XP</span>
                    </div>
                    {dailyChallengeCompleted ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#4ade80" }}>
                        <CheckCircle2 size={13} /> Complété
                      </span>
                    ) : (
                      <button
                        onClick={() => completeDailyChallenge()}
                        className="text-xs px-4 py-2 rounded-xl font-medium transition-all"
                        style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}
                      >Valider</button>
                    )}
                  </div>
                </div>
              )}

              {/* All challenges list */}
              <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest px-1">Défis disponibles</p>
              {DAILY_CHALLENGES.map((c) => {
                const isActive = c.id === dailyChallengeId;
                const isCompleted = isActive && dailyChallengeCompleted;
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
                    style={{
                      background: isActive ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.01)",
                      border: `1px solid ${isActive ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)"}`,
                      opacity: isActive ? 1 : 0.5,
                    }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <Target size={13} className="text-zinc-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-zinc-300">{c.name}</p>
                      <p className="text-[10px] text-zinc-600">{c.description}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Zap size={9} style={{ color: "#fbbf24" }} />
                      <span className="text-[10px] font-medium" style={{ color: "#fbbf24" }}>+{c.xpReward}</span>
                    </div>
                    {isCompleted && <CheckCircle2 size={14} style={{ color: "#4ade80" }} className="shrink-0" />}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium z-50"
            style={{ background: "rgba(20,20,20,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
          ><CheckCircle2 size={14} /> {toast}</motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}