"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import ProspectsListCompact, { type ViewMode } from "./ProspectsListCompact";
import ProspectDetail from "./ProspectDetail";

export default function ProspectsSplitView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const selectedId = searchParams.get("p");

  // Vue active : list (split classique), cards (grille pleine), kanban (pipeline pleine)
  const [view, setView] = useState<ViewMode>("list");

  const setSelected = useCallback((id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("p", id);
    else params.delete("p");
    const qs = params.toString();
    router.replace(`${pathname}${qs ? "?" + qs : ""}`, { scroll: false });
  }, [pathname, router, searchParams]);

  // Si on sélectionne un prospect en cards/kanban → on bascule en list pour avoir le detail à droite
  const handleSelect = useCallback((id: string) => {
    if (view !== "list") setView("list");
    setSelected(id);
  }, [view, setSelected]);

  const handleViewChange = useCallback((v: ViewMode) => {
    if (v !== "list") setSelected(null);
    setView(v);
  }, [setSelected]);

  const showDetail = view === "list" && !!selectedId;

  return (
    <div className="h-full flex overflow-hidden">
      <div
        className={`${showDetail ? "w-[440px] min-w-[4