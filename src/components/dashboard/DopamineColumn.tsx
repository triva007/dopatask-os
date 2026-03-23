"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, Flame, Trophy, Crown, Target, FlaskConical, Calendar } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const LEVEL_TITLES = [
  "Débutant", "Apprenti", "Initié", "Compétent", "Avancé",
  "Expert", "Maître", "Grand Maître", "Légende", "Mythique",
  "Transcendant", "Divin",
];

function xpToLevel(xp: number) { return Math.floor(Math.sqrt(xp / 50)) + 1; }
function xpForNextLevel(level: number) { return (level * level) * 50; }

/* ─── Flow Calendar (GitHub-style contribution grid) ─────────────────── */

function FlowCalendar({ tasks }: { tasks: { completedAt?: number; status: string }[] }) {
  const weeks = 12; // 12 weeks = ~3 months
  const days = weeks * 7;

  const grid = useMemo(() => {
    const now = new Date();
    const cells: { date: Date; count: number; isToday: boolean }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const dayStr = d.toDateString();
      const count = tasks.filter((t) => {
        if (!t.completedAt) return false;
        return new Date(t.completedAt).toDateString() === dayStr;
      }).length;

      cells.push({ date: d, count, isToday: i === 0 });
    }

    return cells;
  }, [tasks, days]);

  // Group into weeks (columns)
  const weekColumns: typeof grid[] = [];
  for (let i = 0; i < grid.length; i += 7) {
    weekColumns.push(grid.slice(i, i + 7));
  }

  const getColor = (count: number, isToday: boolean) => {
    if (isToday && count === 0) return "rgba(255,255,255,0.06)";
    if (count === 0) return "rgba(255,255,255,0.03)";
    if (count >= 5) return "rgba(255,255,255,0.45)";
    if (count >= 3) return "rgba(255,255,255,0.3)";
    if (count >= 1) return "rgba(255,255,255,0.15)";
    return "rgba(255,255,255,0.03)";
  };

  const getBorder = (count: number, isToday: boolean) => {
    if (isToday) return "1px solid rgba(255,255,255,0.15)";
    if (count >= 3) return "1px solid rgba(255,255,255,0.08)";
    return "1px solid rgba(255,255,255,0.02)";
  };

  const totalActive = grid.filter(c => c.count >= 3).length;
  const currentStreak = (() => {
    let s = 0;
    for (let i = grid.length - 1; i >= 0; i--) {
      if (grid[i].count >= 3) s++;
      else break;
    }
    return s;
  })();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Calendar size={10} style={{ color: "rgba(255,255,255,0.25)" }} />
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.25)" }}>Calendrier de Flow</span>
        </div>
        <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>{totalActive}j actifs</span>
      </div>

      {/* Grid */}
      <div className="flex gap-[3px] justify-center">
        {weekColumns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell, di) => (
              <motion.div
                key={`${wi}-${di}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (wi * 7 + di) * 0.003, duration: 0.2 }}
                className="rounded-[3px]"
                style={{
                  width: 10,
                  height: 10,
                  background: getColor(cell.count, cell.isToday),
                  border: getBorder(cell.count, cell.isToday),
                  boxShadow: cell.count >= 3 ? `0 0 4px rgba(255,255,255,0.08)` : "none",
                }}
                title={`${cell.date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} — ${cell.count} tâches`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.15)" }}>Moins</span>
          {[0, 1, 3, 5].map((n) => (
            <div key={n} className="rounded-[2px]" style={{ width: 8, height: 8, background: getColor(n, false), border: "1px solid rgba(255,255,255,0.02)" }} />
          ))}
          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.15)" }}>Plus</span>
        </div>
        {currentStreak > 0 && (
          <span className="text-[9px] font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>{currentStreak}j chaîne</span>
        )}
      </div>
    </div>
  );
}

/* ─── Stat Card ───────────────────────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Zap; label: string; value: string | number; color: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 p-3.5 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <span className="text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-semibold" style={{ color: "rgba(255,255,255,0.2)" }}>
        <Icon size={10} style={{ color }} /> {label}
      </span>
      <motion.span
        key={String(value)}
        initial={{ scale: 1.1, y: -2 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="text-xl font-black leading-none tabular-nums"
        style={{ color }}
      >
        {value}
      </motion.span>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────── */

export default function DopamineColumn() {
  const {
    xp, streak,
    totalTasksCompleted, totalFocusMinutes,
    unlockedAchievements, tasks,
  } = useAppStore();

  const level = xpToLevel(xp);
  const nextLevelXp = xpForNextLevel(level);
  const prevLevelXp = xpForNextLevel(level - 1);
  const xpProg = Math.min(100, ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100);
  const levelTitle = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  const completedTasks = tasks.filter(t => t.completedAt);

  return (
    <div className="flex flex-col h-full px-5 py-6 gap-5 overflow-y-auto">
      {/* Header */}
      <div className="shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>Progression</span>
      </div>

      {/* Flow Calendar — replaces Boss widget */}
      <div className="shrink-0 p-4 rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <FlowCalendar tasks={completedTasks} />
      </div>

      {/* Level Badge — minimal */}
      <div className="shrink-0 flex items-center gap-3 p-4 rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-black text-sm"
          style={{
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.7)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >{level}</motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Crown size={11} style={{ color: "rgba(255,255,255,0.3)" }} />
            <p className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{levelTitle}</p>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: "rgba(255,255,255,0.04)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "rgba(255,255,255,0.25)" }}
              animate={{ width: `${xpProg}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
            />
          </div>
          <p className="text-[10px] mt-1.5 font-mono" style={{ color: "rgba(255,255,255,0.12)" }}>{nextLevelXp - xp} XP → Niv. {level + 1}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="shrink-0 grid grid-cols-2 gap-3">
        <StatCard icon={Zap} label="XP" value={xp.toLocaleString()} color="rgba(255,255,255,0.6)" />
        <StatCard icon={Flame} label="Streak" value={streak} color="rgba(255,255,255,0.6)" />
        <StatCard icon={Target} label="Tâches" value={totalTasksCompleted} color="rgba(255,255,255,0.45)" />
        <StatCard icon={FlaskConical} label="Focus" value={totalFocusMinutes >= 60 ? `${Math.floor(totalFocusMinutes / 60)}h` : `${totalFocusMinutes}m`} color="rgba(255,255,255,0.45)" />
      </div>

      {/* Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <Trophy size={12} style={{ color: "rgba(255,255,255,0.25)" }} />
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>{unlockedAchievements.length} achievement{unlockedAchievements.length > 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Quick Rewards */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        <div className="flex items-center gap-1.5">
          <Trophy size={11} style={{ color: "rgba(255,255,255,0.2)" }} />
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.2)" }}>Récompenses</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {[
            { label: "Café", cost: 80, icon: "☕" },
            { label: "Pause 15min", cost: 250, icon: "🚶" },
            { label: "Gaming", cost: 450, icon: "🎮" },
          ].map(({ label, cost, icon }) => {
            const canBuy = xp >= cost;
            return (
              <motion.div
                key={label}
                whileHover={canBuy ? { x: 3 } : {}}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.04)",
                  opacity: canBuy ? 1 : 0.35,
                  cursor: canBuy ? "pointer" : "not-allowed",
                }}
              >
                <span className="text-base">{icon}</span>
                <span className="text-[12px] flex-1 font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</span>
                <span className="text-[11px] font-bold tabular-nums font-mono" style={{ color: canBuy ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)" }}>{cost} XP</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
