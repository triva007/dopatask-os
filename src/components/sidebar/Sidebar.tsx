"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ListChecks, Target, FlaskConical, ShoppingBag, Settings,
  FolderKanban, Eye, BookOpen, Inbox, Moon, Sun, Rocket,
  type LucideIcon,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  badge?: "inbox_count" | "today_tasks" | "pending_tasks";
};

const NAV_PRIMARY: NavItem[] = [
  { href: "/",        label: "Dashboard", Icon: LayoutDashboard, badge: "today_tasks" },
  { href: "/inbox",   label: "Inbox",     Icon: Inbox,           badge: "inbox_count" },
  { href: "/taches",  label: "Tâches",    Icon: ListChecks,      badge: "pending_tasks" },
];

const NAV_SECONDARY: NavItem[] = [
  { href: "/projets",    label: "Projets",      Icon: FolderKanban },
  { href: "/objectifs",  label: "Objectifs",    Icon: Target       },
  { href: "/sprints",    label: "Sprints",      Icon: Rocket       },
  { href: "/hyperfocus", label: "Focus Lab",    Icon: FlaskConical },
];

const NAV_TERTIARY: NavItem[] = [
  { href: "/vision",   label: "Vision",    Icon: Eye      },
  { href: "/journal",  label: "Journal",   Icon: BookOpen },
  { href: "/boutique", label: "Boutique",  Icon: ShoppingBag },
];

function NavLink({ item, isActive, badgeCount }: { item: NavItem; isActive: boolean; badgeCount: number }) {
  const { Icon, href, label, badge } = item;
  return (
    <Link
      href={href}
      className="relative flex items-center px-3 py-2 rounded-lg group transition-colors duration-150"
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-lg"
          style={{ background: "var(--sidebar-active-bg)" }}
          initial={false}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <div className="relative z-10 flex items-center gap-2.5 w-full">
        <Icon
          size={15}
          className={`shrink-0 transition-colors duration-150 ${
            isActive ? "text-sidebar-active-text" : "text-sidebar-inactive group-hover:text-t-primary"
          }`}
          strokeWidth={1.75}
        />
        <span
          className={`text-[13px] transition-colors duration-150 leading-none flex-1 ${
            isActive
              ? "text-sidebar-active-text font-medium"
              : "text-sidebar-inactive font-normal group-hover:text-t-primary"
          }`}
        >
          {label}
        </span>
        {badge && badgeCount > 0 && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-semibold rounded-full whitespace-nowrap tabular-nums"
            style={{
              background: isActive ? "var(--accent-blue)" : "var(--badge-bg)",
              color: isActive ? "#fff" : "var(--badge-text)",
            }}
          >
            {badgeCount}
          </motion.span>
        )}
      </div>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const inboxCount = useAppStore((s) => s.inboxItems.filter((i) => !i.processed).length);
  const todayTasks = useAppStore((s) => s.tasks.filter((t) => t.status === "today").length);
  const pendingTasks = useAppStore((s) => s.tasks.filter((t) => ["todo", "in_progress"].includes(t.status)).length);

  const countFor = (badge?: string) => {
    if (badge === "inbox_count") return inboxCount;
    if (badge === "today_tasks") return todayTasks;
    if (badge === "pending_tasks") return pendingTasks;
    return 0;
  };

  return (
    <nav className="flex flex-col h-full w-full px-3 py-6 gap-0.5">
      {/* Logo — minimal */}
      <div className="flex items-center gap-2.5 pb-7 pt-1 px-2">
        <div
          className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
          }}
        >
          <span className="text-[13px] text-white font-semibold">D</span>
        </div>
        <div>
          <p className="text-[13px] font-semibold leading-none tracking-tight text-t-primary">
            DopaTask
          </p>
          <p className="text-[9px] leading-none mt-1 font-medium text-t-tertiary tracking-wider uppercase">
            v4.1 · premium
          </p>
        </div>
      </div>

      {/* Primary group */}
      <div className="flex flex-col gap-0.5 px-1">
        {NAV_PRIMARY.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href}
            badgeCount={countFor(item.badge)}
          />
        ))}
      </div>

      {/* Divider + Secondary */}
      <p className="px-3 pt-5 pb-2 text-[9px] font-medium tracking-[0.2em] uppercase text-t-tertiary">
        Organiser
      </p>
      <div className="flex flex-col gap-0.5 px-1">
        {NAV_SECONDARY.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href}
            badgeCount={countFor(item.badge)}
          />
        ))}
      </div>

      {/* Divider + Tertiary */}
      <p className="px-3 pt-5 pb-2 text-[9px] font-medium tracking-[0.2em] uppercase text-t-tertiary">
        Explorer
      </p>
      <div className="flex flex-col gap-0.5 px-1">
        {NAV_TERTIARY.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href}
            badgeCount={countFor(item.badge)}
          />
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings */}
      <div className="px-1">
        <NavLink
          item={{ href: "/reglages", label: "Réglages", Icon: Settings }}
          isActive={pathname === "/reglages"}
          badgeCount={0}
        />
      </div>

      {/* Theme toggle */}
      <div className="px-2 pt-3">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg transition-colors duration-150 group hover:bg-surface-2"
          title={`Thème ${theme === "light" ? "sombre" : "clair"}`}
        >
          {theme === "light" ? (
            <Moon size={14} className="text-sidebar-inactive group-hover:text-t-primary transition-colors" strokeWidth={1.75} />
          ) : (
            <Sun size={14} className="text-sidebar-inactive group-hover:text-t-primary transition-colors" strokeWidth={1.75} />
          )}
          <span className="text-[12px] text-sidebar-inactive group-hover:text-t-primary transition-colors">
            {theme === "light" ? "Mode sombre" : "Mode clair"}
          </span>
        </button>
      </div>
    </nav>
  );
}
