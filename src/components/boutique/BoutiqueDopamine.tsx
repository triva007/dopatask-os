"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Zap, Lock, CheckCircle2, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

// ─── Rewards catalog ─────────────────────────────────────────────────────────

interface Reward {
  id: string;
  emoji: string;
  name: string;
  description: string;
  cost: number;
  category: "pause" | "plaisir" | "productivite";
}

const REWARDS: Reward[] = [
  {
    id: "cafe",
    emoji: "☕",
    name: "Café / Thé",
    description: "Mérite une petite pause chaude",
    cost: 100,
    category: "pause",
  },
  {
    id: "break_5",
    emoji: "🌿",
    name: "Pause 5 min",
    description: "Lève-toi, étire-toi, respire",
    cost: 150,
    category: "pause",
  },
  {
    id: "break_15",
    emoji: "🚶",
    name: "Pause 15 min",
    description: "Courte balade ou snack mérité",
    cost: 300,
    category: "pause",
  },
  {
    id: "youtube",
    emoji: "📱",
    name: "YouTube 10 min",
    description: "Une petite vidéo bien méritée",
    cost: 200,
    category: "plaisir",
  },
  {
    id: "gaming",
    emoji: "🎮",
    name: "Session Gaming",
    description: "30 min de jeu sans culpabilité",
    cost: 500,
    category: "plaisir",
  },
  {
    id: "musique",
    emoji: "🎵",
    name: "Playlist Libre",
    description: "Écoute ce que tu veux pendant 1h",
    cost: 250,
    category: "plaisir",
  },
  {
    id: "focus_block",
    emoji: "🧠",
    name: "Bloc Focus Premium",
    description: "Configure un sprint de 90 min intense",
    cost: 400,
    category: "productivite",
  },
  {
    id: "objectif",
    emoji: "🏆",
    name: "Objectif Bonus",
    description: "Ajoute un objectif surprise à ta semaine",
    cost: 600,
    category: "productivite",
  },
  {
    id: "vendredi",
    emoji: "🎉",
    name: "Vendredi +1h",
    description: "Tu mérites de finir une heure plus tôt",
    cost: 1000,
    category: "plaisir",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  pause: "Pauses",
  plaisir: "Plaisirs",
  productivite: "Productivité",
};

const CATEGORY_COLORS: Record<string, string> = {
  pause: "#22c55e",
  plaisir: "#06b6d4",
  productivite: "#7c3aed",
};

// ─── XP Level ────────────────────────────────────────────────────────────────

function xpToLevel(xp: number) {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

function xpForNextLevel(level: number) {
  return (level * level) * 50;
}

// ─── Reward Card ─────────────────────────────────────────────────────────────

function RewardCard({
  reward,
  xp,
  onBuy,
}: {
  reward: Reward;
  xp: number;
  onBuy: (r: Reward) => void;
}) {
  const canAfford = xp >= reward.cost;
  const color     = CATEGORY_COLORS[reward.category];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-lg"
      style={{
        background: "#0f0f12",
        borderColor: canAfford ? `${color}20` : "rgba(255,255,255,0.04)",
        boxShadow: canAfford ? `0 0 12px ${color}10` : "none",
      }}
    >
      {/* Emoji */}
      <div
        className="flex items-center justify-center py-6 text-4xl transition-transform duration-200 group-hover:scale-110"
        style={{ background: canAfford ? `${color}08` : "transparent" }}
      >
        {reward.emoji}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 px-4 py-3 flex-1">
        <p className="text-sm font-semibold text-zinc-100 leading-tight">{reward.name}</p>
        <p className="text-xs text-zinc-500 leading-relaxed flex-1">{reward.description}</p>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap size={11} className="text-dopa-xp" />
          <span className="text-xs font-bold text-dopa-xp">{reward.cost}</span>
        </div>
        <button
          onClick={() => canAfford && onBuy(reward)}
          disabled={!canAfford}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            background: canAfford ? `${color}20` : "transparent",
            border: `1px solid ${canAfford ? color + "40" : "rgba(255,255,255,0.04)"}`,
            color: canAfford ? color : "#52525b",
          }}
        >
          {canAfford ? "Acheter" : <Lock size={10} />}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BoutiqueDopamine() {
  const { xp, streak, buyReward } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const level       = xpToLevel(xp);
  const nextLevelXp = xpForNextLevel(level);
  const prevLevelXp = xpForNextLevel(level - 1);
  const progress    = Math.min(100, ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100);

  const categories = ["pause", "plaisir", "productivite"];
  const filtered   = activeCategory
    ? REWARDS.filter((r) => r.category === activeCategory)
    : REWARDS;

  const handleBuy = (r: Reward) => {
    buyReward(r.id, r.cost);
    setToast(`${r.emoji} ${r.name} débloqué !`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-7 pt-6 pb-4 border-b border-b-[rgba(255,255,255,0.04)]">
        <h1 className="text-xl font-bold text-zinc-50 tracking-tight flex items-center gap-2.5">
          <ShoppingBag size={20} className="text-dopa-xp" />
          Boutique Dopamine
        </h1>
        <p className="text-sm text-zinc-500 mt-1.5">
          Échange tes XP contre des récompenses bien méritées
        </p>
      </div>

      {/* XP Status bar */}
      <div
        className="shrink-0 px-7 py-4 border-b border-b-[rgba(255,255,255,0.04)] flex items-center gap-5"
        style={{ background: "#050507" }}
      >
        {/* Level badge */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold text-base"
          style={{ background: "linear-gradient(135deg, #f59e0b22, #f59e0b44)", color: "#f59e0b" }}
        >
          {level}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-zinc-300">Niveau {level}</span>
            <div className="flex items-center gap-1.5">
              <Zap size={12} className="text-dopa-xp" />
              <span className="text-sm font-bold text-dopa-xp">{xp} XP</span>
            </div>
          </div>
          <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, #f59e0b, #ef4444)" }}
            />
          </div>
          <p className="text-xs text-zinc-600 mt-1">
            {nextLevelXp - xp} XP pour le niveau {level + 1}
          </p>
        </div>

        {streak > 0 && (
          <div className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg" style={{ background: "rgba(251, 191, 36, 0.08)" }}>
            <Sparkles size={13} className="text-dopa-xp" />
            <span className="text-sm font-bold text-dopa-xp">{streak} 🔥</span>
          </div>
        )}
      </div>

      {/* Category filter */}
      <div className="shrink-0 px-7 pt-4 pb-3 flex items-center gap-2.5 overflow-x-auto">
        <button
          onClick={() => setActiveCategory(null)}
          className="text-xs px-4 py-2 rounded-full font-semibold transition-all duration-200 whitespace-nowrap hover:scale-105"
          style={{
            background: activeCategory === null ? "rgba(255,255,255,0.1)" : "transparent",
            border: `1.5px solid ${activeCategory === null ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)"}`,
            color: activeCategory === null ? "#e4e4e7" : "#71717a",
          }}
        >
          Tous
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className="text-xs px-4 py-2 rounded-full font-semibold transition-all duration-200 whitespace-nowrap hover:scale-105"
            style={{
              background: activeCategory === cat ? `${CATEGORY_COLORS[cat]}18` : "transparent",
              border: `1.5px solid ${activeCategory === cat ? CATEGORY_COLORS[cat] + "40" : "rgba(255,255,255,0.04)"}`,
              color: activeCategory === cat ? CATEGORY_COLORS[cat] : "#71717a",
            }}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Rewards grid */}
      <div className="flex-1 min-h-0 overflow-y-auto px-7 pb-6">
        <div className="grid grid-cols-4 gap-4 pt-3">
          <AnimatePresence>
            {filtered.map((r) => (
              <RewardCard key={r.id} reward={r} xp={xp} onBuy={handleBuy} />
            ))}
          </AnimatePresence>
        </div>

        {xp < 100 && (
          <div className="mt-6 px-5 py-4 rounded-2xl border border-[rgba(255,255,255,0.04)] text-center bg-[rgba(255,255,255,0.02)]">
            <p className="text-sm text-zinc-500">
              Complète des tâches pour gagner tes premiers XP et débloquer des récompenses !
            </p>
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-3 rounded-2xl border text-sm font-semibold z-50"
            style={{
              background: "#131316",
              borderColor: "rgba(34,197,94,0.4)",
              color: "#22c55e",
              boxShadow: "0 8px 32px rgba(34,197,94,0.2)",
            }}
          >
            <CheckCircle2 size={16} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}