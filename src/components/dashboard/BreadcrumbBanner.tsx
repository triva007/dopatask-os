"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const INACTIVITY_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

export default function BreadcrumbBanner() {
  const { tasks, lastActiveAt, lastActiveTaskId, setLastActive } = useAppStore();
  const [visible, setVisible] = useState(false);

  const lastTask = tasks.find(
    (t) => t.id === lastActiveTaskId && t.status === "today"
  );

  useEffect(() => {
    const check = () => {
      const elapsed = Date.now() - lastActiveAt;
      if (elapsed >= INACTIVITY_THRESHOLD_MS && lastTask) {
        setVisible(true);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") check();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    const interval = setInterval(check, 30_000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, [lastActiveAt, lastTask]);

  const handleResume = () => {
    setLastActive(lastTask?.id);
    setVisible(false);
  };

  if (!lastTask) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border border-dopa-cyan/20 bg-zinc-900/95 backdrop-blur-md shadow-2xl"
          style={{ boxShadow: "0 0 30px rgba(6,182,212,0.10)" }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-dopa-cyan animate-pulse shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-zinc-500">Où en étiez-vous ?</span>
            <span className="text-xs font-semibold text-zinc-200">
              Vous travailliez sur &ldquo;{lastTask.text}&rdquo;
            </span>
          </div>
          <button
            onClick={handleResume}
            className="flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-lg bg-dopa-cyan/10 hover:bg-dopa-cyan/20 text-dopa-cyan text-xs font-semibold transition-colors"
          >
            <RotateCcw size={10} />
            Reprendre
          </button>
          <button
            onClick={() => setVisible(false)}
            className="text-zinc-700 hover:text-zinc-500 transition-colors ml-1"
          >
            <X size={13} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
