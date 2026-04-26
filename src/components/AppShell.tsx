"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Minimize2 } from "lucide-react";
import Sidebar from "@/components/sidebar/Sidebar";
import SpotlightSearch from "@/components/spotlight/SpotlightSearch";
import ToastSystem from "@/components/toast/ToastSystem";
import { useAppStore } from "@/store/useAppStore";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [focusMode, setFocusMode] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Shift+F for focus mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setFocusMode((prev) => !prev);
      }
      // Cmd+K or Ctrl+K to trigger spotlight (SpotlightSearch listens too)
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar — hidden in focus mode */}
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

        {/* Main content */}
        <div className="flex-1 h-full overflow-hidden relative bg-[var(--surface-0)]">
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>

          {/* Focus mode toggle button */}
          <button
            onClick={() => setFocusMode((prev) => !prev)}
            className="fixed bottom-8 right-8 z-40 w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-110 shadow-lg backdrop-blur-xl border border-white/10 group overflow-hidden"
            style={{
              background: focusMode ? "var(--accent-blue)" : "var(--surface-1)",
              color: focusMode ? "#fff" : "var(--text-secondary)",
            }}
            title={focusMode ? "Quitter le mode Focus (Ctrl+Shift+F)" : "Mode Focus (Ctrl+Shift+F)"}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex items-center justify-center">
              {focusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </div>
          </button>
        </div>
      </div>

      {/* Global overlays */}
      <SpotlightSearch />
      <ToastSystem />
    </>
  );
}
