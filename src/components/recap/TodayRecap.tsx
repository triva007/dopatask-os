"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, BookOpen, Trophy, Timer, CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function TodayRecap() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { tasks, xp, totalFocusMinutes, addJournalEntry } = useAppStore();

  const todayCompleted = tasks.filter(
    (t) => (t.status === "done" || t.status === "completed") && t.completedAt &&
    new Date(t.completedAt).toDateString() === new Date().toDateString()
  ).length;

  // Show recap at 20h or after 3+ tasks completed today
  useEffect(() => {
    if (dismissed) return;

    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      if (hour >= 20 && todayCompleted > 0) {
        setVisible(true);
      }
    };

    // Also show if user completed 3+ tasks today
    if (todayCompleted >= 3 && !dismissed) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    }

    const interval = setInterval(checkTime, 60000);
    checkTime();
    return () => clearInterval(interval);
  }, [todayCompleted, dismissed]);

  const handleAddToJournal = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    const entry = `${dateStr}\n${todayCompleted} tâche${todayCompleted > 1 ? "s" : ""} terminée${todayCompleted > 1 ? "s" : ""} · +${xp} XP · ${totalFocusMinutes} min de focus`;
    addJournalEntry(entry, todayCompleted >= 3 ? "great" : todayCompleted >= 1 ? "good" : "neutral");
    setDismissed(true);
    setVisible(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl shadow-xl overflow-hidden bg-surface"
        style={{ border: "1px solid var(--border-primary)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="text-[11px] font-medium text-t-secondary uppercase tracking-widest">Recap du jour</span>
          <button onClick={handleDismiss} className="text-t-tertiary hover:text-t-primary transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Stats */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-4 py-3">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={13} style={{ color: "var(--accent-green)" }} />
              <span className="text-[13px] font-medium text-t-primary">{todayCompleted}</span>
              <span className="text-[11px] text-t-secondary">tâches</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy size={13} style={{ color: "var(--accent-orange)" }} />
              <span className="text-[13px] font-medium text-t-primary">+{xp}</span>
              <span className="text-[11px] text-t-secondary">XP</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Timer size={13} style={{ color: "var(--accent-blue)" }} />
              <span className="text-[13px] font-medium text-t-primary">{totalFocusMinutes}</span>
              <span className="text-[11px] text-t-secondary">min</span>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="px-5 pb-4">
          <button
            onClick={handleAddToJournal}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-medium transition-all hover:scale-[1.01]"
            style={{
              background: "color-mix(in srgb, var(--accent-blue) 10%, transparent)",
              color: "var(--accent-blue)",
              border: "1px solid color-mix(in srgb, var(--accent-blue) 20%, transparent)",
            }}
          >
            <BookOpen size={13} /> Ajouter au Journal
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
