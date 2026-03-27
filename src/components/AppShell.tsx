"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Minimize2 } from "lucide-react";
import Sidebar from "@/components/sidebar/Sidebar";
import SpotlightSearch from "@/components/spotlight/SpotlightSearch";
import TodayRecap from "@/components/recap/TodayRecap";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [focusMode, setFocusMode] = useState(false);

  // Keyboard shortcut: Ctrl+Shift+F for focus mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setFocusMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <AnimatePresence>
          {!focusMode && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "var(--sidebar-width)", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="glass-sidebar shrink-0 h-full overflow-hidden"
            >
              <Sidebar />
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="flex-1 h-full overflow-hidden relative">
          {children}

          <button
            onClick={() => setFocusMode((prev) => !prev)}
            className="fixed bottom-5 left-5 z-40 w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 shadow-sm"
            style={{
              background: focusMode ? "color-mix(in srgb, var(--accent-blue) 10%, var(--surface))" : "var(--surface)",
              border: "1px solid var(--border-b-primary)",
              color: focusMode ? "var(--accent-blue)" : "var(--text-t-secondary)",
            }}
            title={focusMode ? "Quitter le mode Focus (Ctrl+Shift+F)" : "Mode Focus (Ctrl+Shift+F)"}
          >
            {focusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      <SpotlightSearch />
      <TodayRecap />
    </>
  );
}
