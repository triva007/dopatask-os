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
    <nav className="flex flex-col h-full w-full px-3 py-5 gap-1">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 pb-6 pt-1">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Zap size={16} style={{ color: "rgba(255,255,255,0.7)" }} />
        </motion.div>
        <div>
          <p className="text-[14px] font-bold leading-none tracking-tight" style={{ color: "rgba(255,255,255,0.85)" }}>
            DopaTask
          </p>
          <p className="text-[10px] leading-none mt-1.5 font-medium tracking-wide" style={{ color: "rgba(255,255,255,0.2)" }}>
            OS v4.0
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-0.5 flex-1 overflow-y-auto pr-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setPathname(href)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <Icon
                size={17}
                style={{ color: isActive ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)" }}
                className="shrink-0 transition-colors relative z-10"
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span
                className="text-[13px] transition-colors leading-none relative z-10"
                style={{
                  color: isActive ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Separator */}
      <div className="mx-3 my-2 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)" }}
      />

      {/* Settings */}
      <Link
        href="/reglages"
        onClick={() => setPathname("/reglages")}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
        style={{
          background: pathname === "/reglages" ? "rgba(255,255,255,0.04)" : "transparent",
        }}
      >
        <Settings
          size={16}
          style={{ color: pathname === "/reglages" ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)" }}
          className="shrink-0 transition-colors"
          strokeWidth={1.5}
        />
        <span
          className="text-[13px] transition-colors leading-none"
          style={{
            color: pathname === "/reglages" ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)",
            fontWeight: pathname === "/reglages" ? 500 : 400,
          }}
        >
          Réglages
        </span>
      </Link>

      {/* Footer */}
      <div className="px-3 pt-3 mt-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.3)" }} />
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>En ligne</p>
        </div>
      </div>
    </nav>
  );
}
