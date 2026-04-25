"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import ProspectsListCompact from "./ProspectsListCompact";
import ProspectDetail from "./ProspectDetail";

export default function ProspectsSplitView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const selectedId = searchParams.get("p");

  const setSelected = useCallback((id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("p", id);
    else params.delete("p");
    const qs = params.toString();
    router.replace(`${pathname}${qs ? "?" + qs : ""}`, { scroll: false });
  }, [pathname, router, searchParams]);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Liste à gauche : pleine largeur si rien de sélectionné, sinon ~40% */}
      <div className={`${selectedId ? "w-[420px] min-w-[380px]" : "w-full"} border-r border-[var(--border-primary)] overflow-hidden transition-all`}>
        <ProspectsListCompact
          selectedId={selectedId}
          onSelect={(id) => setSelected(id)}
        />
      </div>

      {/* Drawer fiche à droite */}
      {selectedId && (
        <div className="flex-1 overflow-hidden">
          <ProspectDetail
            id={selectedId}
            onClose={() => setSelected(null)}
            onNavigate={(id) => setSelected(id)}
          />
        </div>
      )}
    </div>
  );
}
