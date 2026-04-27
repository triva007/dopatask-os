"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Minimize2 } from "lucide-react";
import Sidebar from "@/components/sidebar/Sidebar";
import SpotlightSearch from "@/components/spotlight/SpotlightSearch";
import ToastSystem from "@/components/toast/ToastSystem";
import { useAppStore } from "@/store/useAppStore";
import { usePathname } from "next/navigation";
import { getActiveProfileId } from "@/lib/supabaseStorage";
import AuthScreen from "@/components/auth/AuthScreen";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [focusMode, setFocusMode] = useState(false);
  const [profileId, setProfileId] = useState<number | null>(null);
  const pathname = usePathname();
  const isLandingPage = pathname === "/landing" || pathname.startsWith("/landing/");

  useEffect(() => {
    setProfileId(getActiveProfileId());
  }, []);

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

  if (isLandingPage) {
    return <>{children}</>;
  }

  if (profileId === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--surface-0)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--brand-primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (profileId === -1) {
    return <AuthScreen onLogin={() => window.location.reload()} />;
  }

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
