"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Zap, Lock, CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

interface Reward {
  id: string;
  emoji: string;
  name: string;
  description: string;
  cost: number;
  category: "pause" | "plaisir" | "productivite";
}

const REWARDS: Reward[] = [
  { id: "cafe", emoji: "☕", name: "Café / Thé", description: "Petite pause chaude méritée", cost: 100, category: "pause" },
  { id: "break_5", emoji: "🌿", name: "Pause 5 min", description: "Étire-toi, respire", cost: 150, category: "pause" },
  { id: "break_15", emoji: "🚶", name: "Pause 15 min", description: "Balade ou snack", cost: 300, category: "pause" },
  { id: "youtube", emoji: "📱", name: "YouTube 10 min", description: "Vidéo bien méritée", cost: 200, category: "plaisir" },
  { id: "gaming", emoji: "🎮", name: "Session Gaming", description: "30 min sans culpabilité", cost: 500, category: "plaisir" },
  { id: "musique", emoji: "🎵", name: "Playlist Libre", description: "Écoute ce que tu veux 1h", cost: 250, category: "plaisir" },
  { id: "focus_block", emoji: "🧠", name: "Bloc Focus", description: "Sprint 90 min intense", cost: 400, category: "productivite" },
  { id: "objectif", emoji: "🏆", name: "Objectif Bonus", description: "Objectif surprise", cost: 600, category: "productivite" },
  { id: "vendredi", emoji: "🎉", name: "Vendredi +1h", description: "Finir une heure plus tôt", cost: 1000, category: "plaisir" },
];

const CATEGORY_LABELS: Record<string, string> = { pause: "Pauses", plaisir: "Plaisirs", productivite: "Productivité" };

function xpToLevel(xp: number) { return Math.floor(Math.sqrt(xp / 50)) + 1; }
function xpForNextLevel(level: number) { return (level * level) * 50; }

function RewardCard({ reward, xp, onBuy }: { reward: Reward; xp: number; onBuy: (r: Reward) => void }) {
  const canAfford = xp >= reward.cost;
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ y: -2 }}
      className="flex flex-col rounded-2xl overflow-hidden transition-all"
      style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${canAfford ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}` }}
    >
      <div className="flex items-center justify-center py-5 text-3xl">{reward.emoji}</div>
      <div className="flex flex-col gap-1.5 px-4 py-2 flex-1">
        <p className="text-sm text-zinc-200" style={{ fontWeight: 450 }}>{reward.name}</p>
        <p className="text-[11px] text-zinc-600 leading-relaxed flex-1">{reward.description}</p>
      </div>
      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Zap size={10} style={{ color: "#fbbf24" }} />
          <span className="text-xs font-medium tabular-nums" style={{ color: "#fbbf24" }}>{reward.cost}</span>
        </div>
        <button onClick={() => canAfford && onBuy(reward)} disabled={!canAfford}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: canAfford ? "rgba(255,255,255,0.06)" : "transparent", border: `1px solid ${canAfford ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"}`, color: canAfford ? "#e4e4e7" : "#3f3f46" }}
        >
          {canAfford ? "Acheter" : <Lock size={10} />}
        </button>
      </div>
    </motion.div>
  );
}

export default function BoutiqueDopamine() {
  const { xp, streak, buyReward } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const level = xpToLevel(xp);
  const nextLevelXp = xpForNextLevel(level);
  const prevLevelXp = xpForNextLevel(level - 1);
  const progress = Math.min(100, ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100);

  const categories = ["pause", "plaisir", "productivite"];
  const filtered = activeCategory ? REWARDS.filter((r) => r.category === activeCategory) : REWARDS;

  const handleBuy = (r: Reward) => {
    buyReward(r.id, r.cost);
    setToast(`${r.emoji} ${r.name} débloqué !`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-7 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <h1 className="text-lg font-semibold text-zinc-100 tracking-tight flex items-center gap-2.5">
          <ShoppingBag size={18} className="text-zinc-400" /> Boutique
        </h1>
        <p className="text-xs text-zinc-600 mt-1">Échange tes XP contre des récompenses</p>
      </div>

      {/* XP Status */}
      <div className="shrink-0 px-7 py-4 flex items-center gap-4" style={{ background: "rgba(255,255,255,0.01)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-semibold text-sm"
          style={{ background: "rgba(251,191,36,0.08)", color: "#fbbf24" }}
        >{level}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-zinc-400">Niveau {level}</span>
            <span className="text-xs font-medium tabular-nums" style={{ color: "#fbbf24" }}>{xp} XP</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #fbbf24, #f59e0b)" }} />
          </div>
          <p className="text-[10px] text-zinc-700 mt-1">{nextLevelXp - xp} XP pour le niveau {level + 1}</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg" style={{ background: "rgba(251,191,36,0.06)" }}>
            <span className="text-xs font-medium" style={{ color: "#fbbf24" }}>{streak} 🔥</span>
          </div>
        )}
      </div>

      {/* Category filter */}
      <div className="shrink-0 px-7 pt-4 pb-3 flex items-center gap-2 overflow-x-auto">
        <button onClick={() => setActiveCategory(null)} className="text-xs px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all"
          style={{ background: activeCategory === null ? "rgba(255,255,255,0.08)" : "transparent", border: `1px solid ${activeCategory === null ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`, color: activeCategory === null ? "#e4e4e7" : "#71717a" }}
        >Tous</button>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)} className="text-xs px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all"
            style={{ background: activeCategory === cat ? "rgba(255,255,255,0.08)" : "transparent", border: `1px solid ${activeCategory === cat ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`, color: activeCategory === cat ? "#e4e4e7" : "#71717a" }}
          >{CATEGORY_LABELS[cat]}</button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto px-7 pb-6">
        <div className="grid grid-cols-3 gap-3 pt-3">
          <AnimatePresence>
            {filtered.map((r) => <RewardCard key={r.id} reward={r} xp={xp} onBuy={handleBuy} />)}
          </AnimatePresence>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium z-50"
            style={{ background: "rgba(20,20,20,0.9)", backdropFilter: "blur(20px)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
          ><CheckCircle2 size={14} /> {toast}</motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}