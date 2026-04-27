"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ListChecks, Target, Settings,
  FolderKanban, Eye, BookOpen, Inbox, Phone,
  Calendar, StickyNote,
  type LucideIcon,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useCrmStore } from "@/store/useCrmStore";

type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  badge?: "inbox_count" | "today_tasks" | "pending_tasks" | "prospects_to_call";
};

const NAV_PRIMARY: NavItem[] = [
  { href: "/",           label: "Dashboard", Icon: LayoutDashboard },
  { href: "/taches",     label: "Tâches",    Icon: ListChecks,      badge: "pending_tasks" },
  { href: "/calendrier", label: "Calendrier", Icon: Calendar },
  { href: "/inbox",      label: "Inbox",     Icon: Inbox,           badge: "inbox_count" },
  { href: "/notes",      label: "Notes",     Icon: StickyNote },
];

const NAV_AGENCE: NavItem[] = [
  { href: "/crm",        label: "CRM",       Icon: Phone, badge: "prospects_to_call" },
];

const NAV_VIE: NavItem[] = [
  { href: "/projets",    label: "Projets",      Icon: FolderKanban },
  { href: "/objectifs",  label: "Objectifs",    Icon: Target       },
  { href: "/vision",   label: "Vision",    Icon: Eye      },
  { href: "/journal",  label: "Journal",   Icon: BookOpen },
];

function NavLink({ item, isActive, badgeCount }: { item: NavItem; isActive: boolean; badgeCount: number }) {
  const { Icon, href, label, badge } = item;
  return (
    <Link
      href={href}
      className="relative flex items-center px-4 py-3 rounded-xl group transition-all duration-150"
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl"
          style={{ background: "var(--sidebar-active-bg)" }}
          initial={false}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <div className="relative z-10 flex items-center gap-3.5 w-full">
        <Icon
          size={20}
          className={`shrink-0 transition-colors duration-150 ${
            isActive ? "text-sidebar-active-text" : "text-sidebar-inactive group-hover:text-sidebar-active-text"
          }`}
          strokeWidth={1.75}
        />
        <span
          className={`text-[15px] transition-colors duration-150 leading-none flex-1 ${
            isActive
              ? "text-sidebar-active-text font-semibold"
              : "text-sidebar-inactive font-medium group-hover:text-sidebar-active-text"
          }`}
        >
          {label}
        </span>
        {badge && badgeCount > 0 && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-2 text-[11px] font-bold rounded-full whitespace-nowrap tabular-nums shadow-sm"
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
  const inboxCount = useAppStore((s) => s.inboxItems.filter((i) => !i.processed).length);
  const todayTasks = useAppStore((s) => s.tasks.filter((t) => t.status === "today").length);
  const pendingTasks = useAppStore((s) => s.tasks.filter((t) => ["todo", "in_progress"].includes(t.status)).length);
  const prospectsToCall = useCrmStore((s) =>
    s.prospects.filter((p) => !p.archived && (p.statut === "A_APPELER" || p.statut === "REPONDEUR")).length
  );

  const countFor = (badge?: string) => {
    if (badge === "inbox_count") return inboxCount;
    if (badge === "today_tasks") return todayTasks;
    if (badge === "pending_tasks") return pendingTasks;
    if (badge === "prospects_to_call") return prospectsToCall;
    return 0;
  };

  return (
    <nav className="flex flex-col h-full w-full px-4 py-8 gap-1.5">
      {/* Logo — larger for PC */}
      <div className="flex items-center gap-3.5 pb-10 pt-2 px-3">
        <div
          className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 shadow-lg"
          style={{
            background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
          }}
        >
          <span className="text-[18px] text-white font-bold">A</span>
        </div>
        <div>
          <p className="text-[16px] font-bold leading-none tracking-tight text-sidebar-active-text">
            Aaron-OS
          </p>
          <p className="text-[10px] leading-none mt-1.5 font-bold text-sidebar-inactive tracking-widest uppercase opacity-60">
            v5.0 · Ultra PC
          </p>
        </div>
      </div>

      {/* Primary group */}
      <div className="flex flex-col gap-1 px-1">
        {NAV_PRIMARY.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href}
            badgeCount={countFor(item.badge)}
          />
        ))}
      </div>

      {/* Divider + Agence */}
      <p className="px-4 pt-8 pb-3 text-[10px] font-bold tracking-[0.25em] uppercase text-t-tertiary opacity-50">
        Agence
      </p>
      <div className="flex flex-col gap-1 px-1">
        {NAV_AGENCE.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href}
            badgeCount={countFor(item.badge)}
          />
        ))}
      </div>

      {/* Divider + Vie */}
      <p className="px-4 pt-8 pb-3 text-[10px] font-bold tracking-[0.25em] uppercase text-t-tertiary opacity-50">
        Vie
      </p>
      <div className="flex flex-col gap-1 px-1">
        {NAV_VIE.map((item) => (
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
      <div className="px-1 mt-6 pt-6 border-t border-b-primary">
        <NavLink
          item={{ href: "/reglages", label: "Réglages", Icon: Settings }}
          isActive={pathname === "/reglages"}
          badgeCount={0}
        />
      </div>

    </nav>
  );
}
