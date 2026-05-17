"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Phone,
  BarChart3,
} from "lucide-react";

const TABS = [
  { href: "/m/crm", label: "Dashboard", icon: LayoutDashboard },
  { href: "/m/prospects", label: "Prospects", icon: Users },
] as const;

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--surface-0)] overflow-hidden">
      {/* ── Scrollable content area ── */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </main>

      {/* ── Bottom Tab Bar ── */}
      <nav
        className="shrink-0 flex items-center justify-around"
        style={{
          background: "var(--surface-1)",
          borderTop: "1px solid var(--border-primary)",
          paddingBottom: "env(safe-area-inset-bottom, 8px)",
          paddingTop: "8px",
        }}
      >
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors"
              style={{
                color: isActive
                  ? "var(--accent-purple)"
                  : "var(--text-tertiary)",
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
              <span
                className="text-[10px] font-semibold tracking-wide"
                style={{
                  opacity: isActive ? 1 : 0.7,
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
