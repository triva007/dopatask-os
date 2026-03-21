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
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: "rgba(20,20,20,0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-500">Reprendre ?</span>
            <span className="text-xs font-medium text-zinc-200">&ldquo;{lastTask.text}&rdquo;</span>
          </div>
          <button onClick={() => { setLastActive(lastTask.id); setVisible(false); }}
            className="flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", color: "#e4e4e7" }}
          >
            <RotateCcw size={10} /> Reprendre
          </button>
          <button onClick={() => setVisible(false)} className="text-zinc-600 hover:text-zinc-400 ml-1">
            <X size={12} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}