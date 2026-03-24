"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, Flame, Trophy, Crown, Sparkles, FlaskConical, Calendar, Target } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

/* ─── Level System ────────────────────────────────────────────────────────── */

const LEVEL_TITLES = [
  "Débutant", "Apprenti", "Initié", "Compétent", "Avancé",
  "Expert", "Maître", "Grand Maître", "Légende", "Mythique",
  "Transcendant", "Divin",
];

function xpToLevel(xp: number) { return Math.floor(Math.sqrt(xp / 50)) + 1; }
function xpForNextLevel(level: number) { return (level * level) * 50; }

/* ─── Flow Calendar (GitHub-style Contribution Grid) ────────────────────── */

interface DayActivity {
  date: Date;
  taskCount: number;
  focusMinutes: number;
  level: 0 | 1 | 2 | 3;
}

function getActivityLevel(taskCount: number, focusMinutes: number): 0 | 1 | 2 | 3 {
  if (taskCount === 0 && focusMinutes === 0) return 0;
  if (taskCount <= 2 || focusMinutes < 15) return 1;
  if (taskCount <= 4 || focusMinutes < 45) return 2;
  return 3;
}

function getActivityColor(level: 0 | 1 | 2 | 3): string {
  switch (level) {
    case 0: return "rgba(255,255,255,0.03)";
    case 1: return "rgba(74,222,128,0.15)";
    case 2: return "rgba(74,222,128,0.35)";
    case 3: return "rgba(74,222,128,0.6)";
  }
}

function FlowCalendar({ tasks, hyperfocusSessions }: { tasks: { completedAt?: number }[]; hyperfocusSessions: { completedAt: number; durationMinutes: number }[] }) {
  const dayActivities = useMemo(() => {
    const activities = new Map<string, DayActivity>();
    const now = new Date();
    
    // Initialize last 84 days (12 weeks)
    for (let i = 0; i < 84; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      activities.set(dateStr, {
        date: new Date(date),
        taskCount: 0,
        focusMinutes: 0,
        level: 0,
      });
    }

    // Count completed tasks by day
    tasks.forEach((task) => {
      if (task.completedAt) {
        const completedDate = new Date(task.completedAt);
        const dateStr = completedDate.toDateString();
        const activity = activities.get(dateStr);
        if (activity) {
          activity.taskCount += 1;
        }
      }
    });

    // Count focus minutes by day
    hyperfocusSessions.forEach((session) => {
      const sessionDate = new Date(session.completedAt);
      const dateStr = sessionDate.toDateString();
      const activity = activities.get(dateStr);
      if (activity) {
        activity.focusMinutes += session.durationMinutes;
      }
    });

    // Update activity levels
    activities.forEach((activity) => {
      activity.level = getActivityLevel(activity.taskCount, activity.focusMinutes);
    });

    // Sort by date descending (most recent first)
    return Array.from(activities.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [tasks, hyperfocusSessions]);

  // Organize into weeks (Sunday to Saturday, 7 columns per week)
  const weeks = useMemo(() => {
    const weeksArray: DayActivity[][] = [];
    let currentWeek: DayActivity[] = [];
    // Sort chronologically (oldest first) for proper week layout
    const sortedByDate = [...dayActivities].reverse();
    
    sortedByDate.forEach((day) => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeksArray.push([...currentWeek]);
        currentWeek = [];
      }
    });
    
    if (currentWeek.length > 0) {
      weeksArray.push(currentWeek);
    }

    return weeksArray;
  }, [dayActivities]);

  // Get month labels for top row
  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = "";
    
    weeks.forEach((week, weekIndex) => {
      if (week.length > 0) {
        const monthStr = week[0].date.toLocaleDateString("fr-FR", { month: "short" }).slice(0, 3);
        if (monthStr !== lastMonth) {
          labels.push({ month: monthStr, weekIndex });
          lastMonth = monthStr;
        }
      }
    });

    return labels;
  }, [weeks]);

  return (
    <div className="shrink-0 flex flex-col gap-4 py-4 rounded-3xl relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Mesh gradient background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle at 30% 30%, rgba(74,222,128,0.03), transparent 50%)" }}
      />

      <div className="relative z-10 px-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={13} style={{ color: "#4ade80" }} />
          <span className="text-[11px] font-semibold text-zinc-300">Flow Calendar</span>
        </div>
        
        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <div className="flex gap-1 pb-2">
            {/* Day labels on left */}
            <div className="flex flex-col gap-1 mr-1">
              <div className="h-5" /> {/* Space for month labels */}
              {["L", "M", "M", "J", "V", "S", "D"].map((day) => (
                <div key={day} className="w-5 h-3 flex items-center justify-center text-[8px] text-zinc-600 font-semibold">
                  {day}
                </div>
              ))}
            </div>

            {/* Weeks grid */}
            <div className="flex gap-1">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {/* Month label */}
                  <div className="h-5 flex items-center">
                    {monthLabels.some(m => m.weekIndex === weekIdx) && (
                      <span className="text-[8px] text-zinc-600 font-semibold px-0.5">
                        {monthLabels.find(m => m.weekIndex === weekIdx)?.month}
                      </span>
                    )}
                  </div>
                  
                  {/* Days */}
                  {week.map((day) => (
                    <motion.div
                      key={day.date.toDateString()}
                      whileHover={{ scale: 1.15 }}
                      className="w-3 h-3 rounded-sm transition-all cursor-pointer"
                      style={{
                        background: getActivityColor(day.level),
                        border: "1px solid rgba(74,222,128,0.1)",
                        boxShadow: day.level > 0 ? `0 0 4px rgba(74,222,128,${0.1 * day.level})` : "none",
                      }}
                      title={`${day.date.toLocaleDateString("fr-FR")}: ${day.taskCount} tâches, ${day.focusMinutes}m`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Legend */}
        <div className="mt-3 flex items-center gap-3 text-[10px] text-zinc-600">
          <span>Moins</span>
          {[0, 1, 2, 3].map((level) => (
            <div
              key={level}
              className="w-2.5 h-2.5 rounded-xs"
              style={{ background: getActivityColor(level as 0 | 1 | 2 | 3) }}
            />
          ))}
          <span>Plus</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Stat Card 3D ────────────────────────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Zap; label: string; value: string | number; color: string;
}) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-2xl relative overflow-hidden"
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
      <span className="text-[11px] text-zinc-600 uppercase tracking-wider flex items-center gap-1 relative z-10">
        <Icon size={9} style={{ color }} /> {label}
      </span>
      <motion.span
        key={String(value)}
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-2xl font-semibold leading-none tabular-nums relative z-10"
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
    xp, streak,
    totalTasksCompleted, totalFocusMinutes,
    unlockedAchievements,
    dailyChallengeId, dailyChallengeCompleted,
    tasks, hyperfocusSessions,
  } = useAppStore();

  const level = xpToLevel(xp);
  const nextLevelXp = xpForNextLevel(level);
  const prevLevelXp = xpForNextLevel(level - 1);
  const xpProg = Math.min(100, ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100);
  const levelTitle = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  // Calculate weekly stats
  const weeklyStats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    let weekTaskCount = 0;
    let weekFocusMinutes = 0;

    tasks.forEach((task) => {
      if (task.completedAt) {
        const completedDate = new Date(task.completedAt);
        if (completedDate >= weekAgo && completedDate <= now) {
          weekTaskCount += 1;
        }
      }
    });

    hyperfocusSessions.forEach((session) => {
      const sessionDate = new Date(session.completedAt);
      if (sessionDate >= weekAgo && sessionDate <= now) {
        weekFocusMinutes += session.durationMinutes;
      }
    });

    return { weekTaskCount, weekFocusMinutes };
  }, [tasks, hyperfocusSessions]);

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

      {/* Level Badge — 3D Premium */}
      <div className="shrink-0 flex items-center gap-4 p-4 rounded-2xl relative overflow-hidden"
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
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-base relative z-10"
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
          <p className="text-[10px] text-zinc-700 mt-1 font-mono">{nextLevelXp - xp} XP → Niv. {level + 1}</p>
        </div>
      </div>

      {/* Stats Grid — 3D Cards */}
      <div className="shrink-0 grid grid-cols-2 gap-2.5 relative z-10">
        <StatCard icon={Zap} label="XP" value={xp.toLocaleString()} color="#4ade80" />
        <StatCard icon={Flame} label="Streak" value={streak} color="#fbbf24" />
        <StatCard icon={Target} label="Tâches" value={totalTasksCompleted} color="#a1a1aa" />
        <StatCard icon={FlaskConical} label="Focus" value={totalFocusMinutes >= 60 ? `${Math.floor(totalFocusMinutes / 60)}h` : `${totalFocusMinutes}m`} color="#a1a1aa" />
      </div>

      {/* Flow Calendar */}
      <FlowCalendar tasks={tasks} hyperfocusSessions={hyperfocusSessions} />

      {/* Daily Challenge */}
      {dailyChallengeId && !dailyChallengeCompleted && (
        <div className="shrink-0 px-4 py-3.5 rounded-2xl flex items-center gap-3 relative z-10"
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
        <div className="shrink-0 px-4 py-3.5 rounded-2xl flex items-center gap-3 relative z-10"
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

      {/* Weekly Summary */}
      <div className="flex-1 flex flex-col gap-3 min-h-0 relative z-10">
        <div className="flex items-center gap-1.5">
          <Trophy size={10} className="text-zinc-600" />
          <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider">Cette semaine</span>
        </div>

        <div className="flex flex-col gap-2">
          {[
            { label: "Tâches", value: weeklyStats.weekTaskCount, color: "#4ade80", icon: Target },
            { label: "Focus", value: `${Math.floor(weeklyStats.weekFocusMinutes / 60)}h ${weeklyStats.weekFocusMinutes % 60}m`, color: "#a78bfa", icon: FlaskConical },
            { label: "Streak", value: streak, color: "#fbbf24", icon: Flame },
          ].map(({ label, value, color, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
              style={{
                border: `1px solid ${color}20`,
                background: `linear-gradient(135deg, ${color}08, transparent)`,
                boxShadow: `0 2px 8px ${color}08, inset 0 1px 0 rgba(255,255,255,0.03)`,
              }}
            >
              <Icon size={13} style={{ color }} />
              <span className="text-[11px] text-zinc-400 flex-1">{label}</span>
              <span className="text-[10px] font-semibold tabular-nums font-mono" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
