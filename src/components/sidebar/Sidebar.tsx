"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ListChecks,
  Target,
  FlaskConical,
  ShoppingBag,
  Settings,
  FolderKanban,
  Eye,
  BookOpen,
  Inbox,
  Moon,
  Sun,
  Rocket,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  badge?: "inbox_count" | "today_tasks" | "pending_tasks";
};

const NAV_ITEMS: NavItem[] = [
  { href: "/",           label: "Dashboard",    Icon: LayoutDashboard, badge: "today_tasks" },
  { href: "/inbox",      label: "Inbox",        Icon: Inbox,           badge: "inbox_count" },
  { href: "/taches",     label: "Tâches",       Icon: ListChecks,      badge: "pending_tasks" },
  { href: "/projets",    label: "Projets",      Icon: FolderKanban    },
  { href: "/objectifs",  label: "Objectifs",    Icon: Target          },
  { href: "/vision",     label: "Vision Board", Icon: Eye             },
  { href: "/journal",    label: "Journal",      Icon: BookOpen        },
  { href: "/sprints",    label: "Sprints",      Icon: Rocket          },
  { href: "/hyperfocus", label: "Focus Lab",    Icon: FlaskConical    },
  { href: "/boutique",   label: "Boutique",     Icon: ShoppingBag     },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [brainsInFocus, setBrainsInFocus] = useState(150);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const inboxCount = useAppStore((s) => s.inboxItems.filter((i) => !i.processed).length);
  const todayTasks = useAppStore((s) => s.tasks.filter((t) => t.status === "today").length);
  const pendingTasks = useAppStore((s) => s.tasks.filter((t) => ["todo", "in_progress"].includes(t.status)).length);

  useEffect(() => {
    const interval = setInterval(() => {
      setBrainsInFocus(Math.floor(Math.random() * (300 - 100 + 1)) + 100);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="flex flex-col h-full w-full px-4 py-5 gap-0.5">
      {/* Logo */}
      <div className="flex items-center gap-3 pb-6 pt-2 px-1">
        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 bg-sidebar-active-bg shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <span className="text-[13px] text-sidebar-active-text">⚡</span>
        </div>
        <div>
          <p className="text-[14px] font-medium leading-none tracking-tight text-t-primary">
            DopaTask
          </p>
          <p className="text-[10px] leading-none mt-1 font-medium text-sidebar-inactive">
            v4.0
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-1 flex-1 overflow-y-auto w-full px-1">
        {NAV_ITEMS.map(({ href, label, Icon, badge }) => {
          const isActive = pathname === href;

          let badgeCount = 0;
          if (badge === "inbox_count") badgeCount = inboxCount;
          else if (badge === "today_tasks") badgeCount = todayTasks;
          else if (badge === "pending_tasks") badgeCount = pendingTasks;

          return (
            <Link
              key={href}
              href={href}
              className="relative flex items-center px-3 py-2.5 rounded-xl group transition-colors duration-200"
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-sidebar-active-bg rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-3 w-full">
                <Icon
                  size={17}
                  className={`shrink-0 transition-all duration-300 group-hover:scale-110 ${
                    isActive ? "text-sidebar-active-text" : "text-sidebar-inactive group-hover:text-t-primary"
                  }`}
                  strokeWidth={1.5}
                />
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[14px] transition-colors duration-200 leading-none ${
                      isActive ? "text-sidebar-active-text font-medium" : "text-sidebar-inactive font-normal group-hover:text-t-primary"
                    }`}
                  >
                    {label}
                  </span>
                  {badge && badgeCount > 0 && (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center justify-center px-2 py-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full whitespace-nowrap"
                    >
                      {badgeCount}
                    </motion.span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Separator */}
      <div className="h-px my-2 bg-b-primary" />

      {/* Settings */}
      <div className="px-1">
        <Link
          href="/reglages"
          className="relative flex items-center px-3 py-2.5 rounded-xl group transition-colors duration-200"
        >
          {pathname === "/reglages" && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute inset-0 bg-sidebar-active-bg rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
              initial={false}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />
          )}
          <div className="relative z-10 flex items-center gap-3 w-full">
            <Settings
              size={17}
              className={`shrink-0 transition-all duration-300 group-hover:rotate-45 ${
                pathname === "/reglages" ? "text-sidebar-active-text" : "text-sidebar-inactive group-hover:text-t-primary"
              }`}
              strokeWidth={1.5}
            />
            <span
              className={`text-[14px] transition-colors duration-200 leading-none ${
                pathname === "/reglages" ? "text-sidebar-active-text font-medium" : "text-sidebar-inactive font-normal group-hover:text-t-primary"
              }`}
            >
              Réglages
            </span>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <div className="pt-4 mt-1 flex flex-col gap-4">
        {/* Body Doubling Indicator */}
        <div className="px-2 py-2 bg-surface-2 rounded-lg border border-b-primary">
          <p className="text-[11px] text-center font-medium text-sidebar-inactive">
            {brainsInFocus} cerveaux en focus
          </p>
        </div>

        <p className="text-[10px] leading-relaxed text-t-tertiary">
          DopaTask OS 4.0
        </p>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-full py-2 px-3 rounded-lg bg-surface border border-b-primary hover:bg-surface-3 transition-colors duration-200 group"
          title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? (
            <Moon size={18} className="text-sidebar-inactive group-hover:text-t-primary transition-colors" />
          ) : (
            <Sun size={18} className="text-sidebar-inactive group-hover:text-t-primary transition-colors" />
          )}
        </button>
      </div>
    </nav>
  );
}
