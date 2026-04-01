"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const INACTIVITY_THRESHOLD_MS = 3 * 60 * 1000;

export default function BreadcrumbBanner() {
  const { tasks, lastActiveAt, lastActiveTaskId, setLastActive } = useAppStore();
  const [visible, setVisible] = useState(false);

  const lastTask = tasks.find((t) => t.id === lastActiveTaskId && t.status === "today");

  useEffect(() => {
    const check = () => {
      if (Date.now() - lastActiveAt >= INACTIVITY_THRESHOLD_MS && lastTask) setVisible(true);
    };
    const handleVis = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", handleVis);
    const interval = setInterval(check, 30_000);
    return () => { document.removeEventListener("visibilitychange", handleVis); clearInterval(interval); };
  }, [lastActiveAt, lastTask]);

  if (!lastTask) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface/95 border-b-primary"
          style={{
            backdropFilter: "blur(20px)",
            border: "1px solid var(--border-b-primary)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-t-secondary">Reprendre ?</span>
            <span className="text-xs font-medium text-t-primary">&ldquo;{lastTask.text}&rdquo;</span>
          </div>
          <button onClick={() => { setLastActive(lastTask.id); setVisible(false); }}
            className="flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors bg-accent-blue text-white"
            style={{}}
          >
            <RotateCcw size={10} /> Reprendre
          </button>
          <button onClick={() => setVisible(false)} className="text-t-secondary hover:text-t-primary ml-1">
            <X size={12} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}