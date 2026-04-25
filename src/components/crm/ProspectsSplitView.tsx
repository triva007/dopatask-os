"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ProspectsListCompact, { type ViewMode } from "./ProspectsListCompact";
import ProspectDetail from "./ProspectDetail";

export default function ProspectsSplitView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const selectedId = searchParams.get("p");

  const [view, setView] = useState<ViewMode>("list");

  const setSelected = useCallback((id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("p", id);
    else params.delete("p");
    const qs = params.toString();
    router.replace(`${pathname}${qs ? "?" + qs : ""}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleSelect = useCallback((id: string) => {
    setSelected(id);
  }, [setSelected]);

  const handleViewChange = useCallback((v: ViewMode) => {
    setView(v);
  }, []);

  // Echap pour fermer la fiche
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, setSelected]);

  return (
    <div className="h-full relative overflow-hidden">
      {/* Liste toujours en pleine largeur */}
      <div className="h-full overflow-hidden">
        <ProspectsListCompact
          selectedId={selectedId}
          onSelect={handleSelect}
          view={view}
          onViewChange={handleViewChange}
          isSplit={false}
        />
      </div>

      {/* Drawer overlay : peu importe la vue active */}
      <AnimatePresence>
        {selectedId && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setSelected(null)}
              className="absolute inset-0 bg-black/55 backdrop-blur-[2px] z-30"
            />
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="absolute top-0 right-0 bottom-0 w-full max-w-[640px] z-40 bg-[var(--background)] border-l border-[var(--border-primary)] shadow-2xl"
            >
              <ProspectDetail
                id={selectedId}
                onClose={() => setSelected(null)}
                onNavigate={(id) => setSelected(id)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
