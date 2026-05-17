"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Minimize2 } from "lucide-react";
import Sidebar from "@/components/sidebar/Sidebar";
import SpotlightSearch from "@/components/spotlight/SpotlightSearch";
import ToastSystem from "@/components/toast/ToastSystem";
import { useAppStore } from "@/store/useAppStore";
import { usePathname, useRouter } from "next/navigation";
import { getActiveProfileId } from "@/lib/supabaseStorage";
import AuthScreen from "@/components/auth/AuthScreen";

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  // Check screen width
  if (window.innerWidth < 768) return true;
  // Check touch-only device (no hover support)
  if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) return true;
  return false;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [focusMode, setFocusMode] = useState(false);
  const [profileId, setProfileId] = useState<number | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isLandingPage = pathname === "/landing" || pathname.startsWith("/landing/");
  const isMobileRoute = pathname.startsWith("/m");

  useEffect(() => {
    setProfileId(getActiveProfileId());
  }, []);

  // ── Auto-redirect mobile devices to /m/crm ──
  useEffect(() => {
    if (isLandingPage || isMobileRoute) return;
    // Don't redirect if user opted for desktop mode
    if (localStorage.getItem("dopatask_force_desktop") === "1") return;
    if (isMobileDevice()) {
      router.replace("/m/crm");
    }
  }, [pathname, isLandingPage, isMobileRoute, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Shift+F for focus mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setFocusMode((prev) => !prev);
      }
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

  // ── Mobile routes: skip Sidebar, Spotlight, etc. ──
  if (isMobileRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar — always visible */}
        <aside className="glass-sidebar shrink-0 h-full relative z-40">
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

