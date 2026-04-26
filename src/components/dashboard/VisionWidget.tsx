"use client";

import { useAppStore } from "@/store/useAppStore";
import { motion } from "framer-motion";
import { Eye, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function VisionWidget() {
  const lifeGoals = useAppStore((s) => s.lifeGoals);

  if (lifeGoals.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-5"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border-primary)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-[var(--accent-purple)]" />
          <h3 className="text-[13px] font-semibold tracking-tight">Vision Long Terme</h3>
        </div>
        <Link href="/vision" className="text-[10px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center gap-0.5 transition-colors">
          Voir tout <ChevronRight size={10} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {lifeGoals.slice(0, 4).map((goal) => {
          const totalSteps = goal.actionSteps.length;
          const doneSteps = goal.actionSteps.filter((s) => s.done).length;
          const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

          return (
            <div
              key={goal.id}
              className="p-3.5 rounded-xl border flex flex-col gap-2.5 transition-all hover:bg-[var(--surface-2)]"
              style={{ background: "var(--card-bg)", borderColor: "var(--border-primary)" }}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight line-clamp-2">
                  {goal.title}
                </span>
                <div 
                  className="w-1.5 h-1.5 rounded-full shrink-0 mt-1" 
                  style={{ background: goal.color }} 
                />
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[var(--text-tertiary)] font-medium">Progression</span>
                  <span className="font-bold tabular-nums" style={{ color: goal.color }}>{pct}%</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden bg-[var(--surface-3)]">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    className="h-full rounded-full"
                    style={{ background: goal.color }}
                  />
                </div>
              </div>

              {goal.actionSteps.length > 0 && (
                <p className="text-[10px] text-[var(--text-tertiary)] truncate italic">
                  Prochaine étape : {goal.actionSteps.find(s => !s.done)?.text || "Toutes terminées !"}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
