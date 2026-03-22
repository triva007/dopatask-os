"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
    <nav className="flex flex-col h-full w-full px-4 py-5 gap-0.5">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 pb-7 pt-1">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span className="text-sm">⚡</span>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-zinc-100 leading-none tracking-tight">
            DopaTask
          </p>
          <p className="text-[10px] text-zinc-600 leading-none mt-1 font-medium">
            v4.0
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-0.5 flex-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setPathname(href)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative"
              style={{
                background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
              }}
            >
              <Icon
                size={16}
                style={{ color: isActive ? "#e4e4e7" : "#52525b" }}
                className="shrink-0 transition-colors group-hover:text-zinc-400"
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span
                className="text-[13px] transition-colors leading-none"
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

      {/* Separator */}
      <div className="h-px mx-3 my-2" style={{ background: "rgba(255,255,255,0.05)" }} />

      {/* Settings */}
      <Link
        href="/reglages"
        onClick={() => setPathname("/reglages")}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
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
      <div className="px-3 pt-4 mt-1">
        <p className="text-[10px] text-zinc-700 leading-relaxed">
          DopaTask OS 4.0
        </p>
      </div>
    </nav>
  );
}