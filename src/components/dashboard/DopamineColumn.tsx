"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Flame, Trophy, ShoppingBag, Crown } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

// ─── Boss SVG ─────────────────────────────────────────────────────────────────

function BossSprite({ hp, shaking }: { hp: number; shaking: boolean }) {
  const eyeColor = hp > 60 ? "#ef4444" : hp > 30 ? "#f97316" : "#fbbf24";
  return (
    <motion.svg
      viewBox="0 0 80 80"
      className="w-16 h-16 mx-auto"
      animate={shaking ? { x: [-3, 3, -3, 3, 0] } : {}}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    >
      <rect x="10" y="20" width="60" height="50" rx="10" fill="#27272a" stroke="#3f3f46" strokeWidth="1.5"/>
      <polygon points="18,22 14,8 26,18" fill="#3f3f46"/>
      <polygon points="62,22 66,8 54,18" fill="#3f3f46"/>
      <circle cx="28" cy="42" r="7" fill="#18181b"/>
      <circle cx="52" cy="42" r="7" fill="#18181b"/>
      <motion.circle cx="28" cy="42" r="4" fill={eyeColor}
        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle cx="52" cy="42" r="4" fill={eyeColor}
        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />
      {hp > 30 ? (
        <path d="M28 58 Q40 64 52 58" stroke="#3f3f46" strokeWidth="2" fill="none" strokeLinecap="round"/>
      ) : (
        <path d="M28 62 Q40 55 52 62" stroke="#ef444480" strokeWidth="2" fill="none" strokeLinecap="round"/>
      )}
      <line x1="10" y1="40" x2="2"  y2="50" stroke="#3f3f46" strokeWidth="3" strokeLinecap="round"/>
      <line x1="70" y1="40" x2="78" y2="50" stroke="#3f3f46" strokeWidth="3" strokeLinecap="round"/>
    </motion.svg>
  );
}

// ─── Barre HP ─────────────────────────────────────────────────────────────────

function HpBar({ hp }: { hp: number }) {
  const hpColor = hp > 60 ? "#ef4444" : hp > 30 ? "#f97316" : "#fbbf24";
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider">
          Boss HP
        </span>
        <span className="text-[11px] font-bold" style={{ color: hpColor }}>
          {hp}/100
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${hp}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          style={{
            background: `linear-gradient(to right, ${hpColor}99, ${hpColor})`,
            boxShadow: `0 0 8px ${hpColor}80`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

export default function DopamineColumn() {
  const { xp, streak, bossHp, lastCritical } = useAppStore();
  const [shaking, setShaking]           = useState(false);
  const [criticalFlash, setCriticalFlash] = useState(false);
  const [prevHp, setPrevHp]             = useState(bossHp);

  useEffect(() => {
    if (bossHp < prevHp) {
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
      if (lastCritical) {
        setCriticalFlash(true);
        setTimeout(() => setCriticalFlash(false), 900);
      }
    }
    setPrevHp(bossHp);
  }, [bossHp, lastCritical, prevHp]);

  // Calcul du niveau
  const level  = Math.floor(xp / 200) + 1;
  const xpNext = level * 200;
  const xpProg = ((xp % 200) / 200) * 100;

  return (
    <div className="flex flex-col h-full px-4 py-5 gap-4">

      {/* Header */}
      <div className="flex items-center gap-2 shrink-0">
        <Zap size={13} className="text-dopa-violet" />
        <span className="text-[11px] font-semibold text-zinc-500 tracking-wider uppercase">
          Dopamine Zone
        </span>
      </div>

      {/* ── Boss Section ── */}
      <div className="shrink-0 flex flex-col gap-3 px-3 py-3.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 relative overflow-hidden">
        {/* Critical flash */}
        <AnimatePresence>
          {criticalFlash && (
            <motion.div
              key="flash"
              initial={{ opacity: 0.5 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ background: "radial-gradient(circle, #7c3aed55, transparent 70%)" }}
            />
          )}
        </AnimatePresence>

        {/* Label + critique */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-700 font-semibold uppercase tracking-wider">
            Boss Procrastination
          </span>
          <AnimatePresence>
            {criticalFlash && (
              <motion.span
                key="crit"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1.1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-[11px] font-black text-dopa-violet"
              >
                💥 CRITIQUE !
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <BossSprite hp={bossHp} shaking={shaking} />
        <HpBar hp={bossHp} />

        <AnimatePresence>
          {bossHp === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="text-center text-xs text-dopa-green font-bold"
            >
              🎉 Boss vaincu !
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Stats XP + Streak ── */}
      <div className="shrink-0 grid grid-cols-2 gap-2.5">
        {/* XP */}
        <div className="flex flex-col gap-1 px-3 py-3 rounded-xl border border-zinc-800 bg-zinc-900/30">
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider">XP Total</span>
          <motion.span
            key={xp}
            initial={{ scale: 1.25, color: "#22c55e" }}
            animate={{ scale: 1,    color: "#4ade80" }}
            transition={{ duration: 0.35 }}
            className="text-xl font-black leading-none"
            style={{ color: "#4ade80" }}
          >
            {xp.toLocaleString()}
          </motion.span>
          {/* Barre progression niveau */}
          <div className="mt-1 w-full h-1 rounded-full bg-zinc-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-dopa-green"
              animate={{ width: `${xpProg}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
          <span className="text-[9px] text-zinc-700">
            Niv. {level} · {xp % 200}/{200} XP
          </span>
        </div>

        {/* Streak */}
        <div className="flex flex-col gap-1 px-3 py-3 rounded-xl border border-zinc-800 bg-zinc-900/30">
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider flex items-center gap-1">
            <Flame size={9} className="text-orange-400" /> Streak
          </span>
          <motion.span
            key={streak}
            initial={{ scale: 1.25 }} animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="text-xl font-black text-orange-400 leading-none"
          >
            {streak}
          </motion.span>
          <span className="text-[9px] text-zinc-700 mt-1">tâches d&apos;affilée</span>
        </div>
      </div>

      {/* ── Niveau / Badge ── */}
      <div className="shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/20">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}
        >
          <Crown size={14} className="text-dopa-violet" />
        </div>
        <div>
          <p className="text-xs font-semibold text-zinc-300">Niveau {level}</p>
          <p className="text-[10px] text-zinc-600">
            {xpNext - xp} XP pour le prochain
          </p>
        </div>
      </div>

      {/* ── Récompenses CTA ── */}
      <div className="flex-1 flex flex-col gap-2.5 min-h-0">
        <div className="flex items-center gap-2">
          <Trophy size={11} className="text-dopa-xp" />
          <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">
            Récompenses
          </span>
        </div>

        {/* Preview récompenses */}
        <div className="flex flex-col gap-1.5">
          {[
            { label: "Café",   cost: 100, color: "#f59e0b" },
            { label: "Break",  cost: 200, color: "#06b6d4" },
            { label: "Gaming", cost: 500, color: "#7c3aed" },
          ].map(({ label, cost, color }) => {
            const canBuy = xp >= cost;
            return (
              <div
                key={label}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-colors"
                style={{
                  borderColor: canBuy ? `${color}30` : "#1f1f23",
                  background:  canBuy ? `${color}08` : "transparent",
                  opacity: canBuy ? 1 : 0.4,
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: color }}
                />
                <span className="text-[11px] text-zinc-400 flex-1">{label}</span>
                <span className="text-[10px] font-semibold" style={{ color: canBuy ? color : "#3f3f46" }}>
                  {cost} XP
                </span>
              </div>
            );
          })}
        </div>

        {/* Bouton CTA Boutique */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border text-xs font-semibold transition-all"
          style={{
            background:   "rgba(124,58,237,0.08)",
            borderColor:  "rgba(124,58,237,0.2)",
            color:        "#a78bfa",
          }}
        >
          <ShoppingBag size={12} />
          Ouvrir la Boutique
        </motion.button>
      </div>
    </div>
  );
}
