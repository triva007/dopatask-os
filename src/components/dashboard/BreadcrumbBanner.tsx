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
          initial={{ opacity: 0, y: -30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl"
          style={{
            background: "rgba(20,20,22,0.95)",
            backdropFilter: "blur(24px) saturate(150%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.4)" }} />

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>Reprendre ?</span>
            <span className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>&ldquo;{lastTask.text}&rdquo;</span>
          </div>

          <motion.button
            onClick={() => { setLastActive(lastTask.id); setVisible(false); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.93 }}
            className="flex items-center gap-1.5 ml-2 px-4 py-2 rounded-xl text-[11px] font-semibold"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            <RotateCcw size={10} /> Reprendre
          </motion.button>

          <button onClick={() => setVisible(false)} className="ml-1 transition-colors" style={{ color: "rgba(255,255,255,0.15)" }}>
            <X size={13} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
