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
        {/* Sidebar — always visible */}
        <aside className="glass-sidebar shrink-0 h-full overflow-hidden">
          <Sidebar />
        </aside>

        {/* Main content */}
        <div className="flex-1 h-full overflow-hidden relative bg-[var(--surface-0)]">
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </div>
      </div>

      {/* Global overlays */}
      <SpotlightSearch />
      <ToastSystem />
    </>
  );
}
