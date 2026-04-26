"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export default function Template({ children }: { children: React.ReactNode }) {
  const { undo, redo } = useAppStore.temporal.getState();
  const addToast = useAppStore((s) => s.addToast);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isZ = e.key.toLowerCase() === "z";
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      if (isCtrl && isZ) {
        e.preventDefault();
        if (isShift) {
          redo();
          addToast("Action rétablie (Redo)", "info", 2000);
        } else {
          undo();
          addToast("Action annulée (Undo)", "info", 2000);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, addToast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}
