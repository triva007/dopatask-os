"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/",           label: "Dashboard",    Icon: LayoutDashboard },
  { href: "/inbox",      label: "Inbox",        Icon: Inbox           },
  { href: "/taches",     label: "Tâches",       Icon: ListChecks      },
  { href: "/projets",    label: "Projets",      Icon: FolderKanban    },
  { href: "/objectifs",  label: "Objectifs",    Icon: Target          },
  { href: "/vision",     label: "Vision Board", Icon: Eye             },
  { href: "/journal",    label: "Journal",      Icon: BookOpen        },
  { href: "/hyperfocus", label: "Focus Lab",    Icon: FlaskConical    },
  { href: "/boutique",   label: "Boutique",     Icon: ShoppingBag     },
] as const;

export default function Sidebar() {
  const [pathname, setPathname] = useState("/");

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  return (
    <nav className="flex flex-col h-full w-full px-3 py-5 gap-1 relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-0 w-full h-48 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 30% 0%, rgba(167,139,250,0.06), transparent 70%)" }}
      />

      {/* Logo */}
      <div className="flex items-center gap-3 px-3 pb-6 pt-1 relative z-10">
        <div className="relative">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(34,211,238,0.10))",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <Zap size={15} className="text-dopa-violet" />
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-xl animate-pulse-slow opacity-30"
            style={{ boxShadow: "0 0 12px rgba(167,139,250,0.3)" }}
          />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-zinc-100 leading-none tracking-tight">
            DopaTask
          </p>
          <p className="text-[10px] text-zinc-600 leading-none mt-1 font-medium">
            OS v4.0
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-0.5 flex-1 overflow-y-auto relative z-10 pr-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setPathname(href)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden"
              style={{
                background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
              }}
            >
              {/* Active indicator glow */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: "linear-gradient(90deg, rgba(167,139,250,0.06), transparent 80%)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {/* Active left accent bar */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-bar"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full"
                  style={{
                    background: "linear-gradient(180deg, #a78bfa, #22d3ee)",
                    boxShadow: "0 0 8px rgba(167,139,250,0.4)",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon
                size={16}
                style={{ color: isActive ? "#d4d4d8" : "#52525b" }}
                className="shrink-0 transition-colors group-hover:text-zinc-400 relative z-10"
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span
                className="text-[13px] transition-colors leading-none relative z-10"
                style={{
                  color: isActive ? "#e4e4e7" : "#71717a",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Separator — gradient */}
      <div className="mx-3 my-2 h-px relative z-10"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }}
      />

      {/* Settings */}
      <Link
        href="/reglages"
        onClick={() => setPathname("/reglages")}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative z-10"
        style={{
          background: pathname === "/reglages" ? "rgba(255,255,255,0.06)" : "transparent",
        }}
      >
        <Settings
          size={16}
          style={{ color: pathname === "/reglages" ? "#a1a1aa" : "#52525b" }}
          className="shrink-0 transition-colors group-hover:text-zinc-400"
          strokeWidth={1.5}
        />
        <span
          className="text-[13px] transition-colors leading-none"
          style={{
            color: pathname === "/reglages" ? "#d4d4d8" : "#71717a",
            fontWeight: pathname === "/reglages" ? 500 : 400,
          }}
        >
          Réglages
        </span>
      </Link>

      {/* Footer */}
      <div className="px-3 pt-3 mt-1 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-dopa-green animate-pulse" />
          <p className="text-[10px] text-zinc-700">
            DopaTask OS 4.0
          </p>
        </div>
      </div>
    </nav>
  );
}
