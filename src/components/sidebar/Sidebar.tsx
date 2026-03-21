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
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/",           label: "Dashboard",         Icon: LayoutDashboard },
  { href: "/taches",     label: "Tâches",            Icon: ListChecks      },
  { href: "/objectifs",  label: "Objectifs",         Icon: Target          },
  { href: "/hyperfocus", label: "Hyperfocus Lab",    Icon: FlaskConical    },
  { href: "/boutique",   label: "Boutique Dopamine", Icon: ShoppingBag     },
] as const;

export default function Sidebar() {
  const [pathname, setPathname] = useState("/");

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  return (
    <nav className="flex flex-col h-full w-full px-3 py-6 gap-1.5">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 pb-8 pt-1">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, #06b6d4, #7c3aed)",
            boxShadow: "0 0 20px rgba(6,182,212,0.2)",
          }}
        >
          <Zap size={15} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-[13px] font-bold text-zinc-100 leading-none tracking-tight">
            DopaTask
          </p>
          <p className="text-[10px] text-zinc-600 leading-none mt-1">
            OS Neuro-Cognitif
          </p>
        </div>
      </div>

      {/* Section label */}
      <p className="text-[9px] font-semibold text-zinc-700 uppercase tracking-[0.12em] px-3 mb-1">
        Navigation
      </p>

      {/* Liens */}
      <div className="flex flex-col gap-0.5 flex-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setPathname(href)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative"
              style={{
                background: isActive
                  ? "rgba(6,182,212,0.07)"
                  : "transparent",
                border: isActive
                  ? "1px solid rgba(6,182,212,0.12)"
                  : "1px solid transparent",
              }}
            >
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full"
                  style={{ background: "#06b6d4" }}
                />
              )}
              <Icon
                size={16}
                style={{ color: isActive ? "#06b6d4" : "#52525b" }}
                className="shrink-0 transition-colors group-hover:text-zinc-400"
                strokeWidth={isActive ? 2 : 1.75}
              />
              <span
                className="text-[12px] font-medium transition-colors leading-none"
                style={{ color: isActive ? "#e4e4e7" : "#71717a" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Separator */}
      <div className="h-px bg-zinc-800/60 mx-3 my-2" />

      {/* Settings link */}
      <Link
        href="/reglages"
        onClick={() => setPathname("/reglages")}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
        style={{
          background: pathname === "/reglages"
            ? "rgba(255,255,255,0.04)"
            : "transparent",
          border: pathname === "/reglages"
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid transparent",
        }}
      >
        <Settings
          size={16}
          style={{ color: pathname === "/reglages" ? "#a1a1aa" : "#52525b" }}
          className="shrink-0 transition-colors group-hover:text-zinc-400"
          strokeWidth={1.75}
        />
        <span
          className="text-[12px] font-medium transition-colors leading-none"
          style={{ color: pathname === "/reglages" ? "#d4d4d8" : "#71717a" }}
        >
          Réglages
        </span>
      </Link>

      {/* Footer */}
      <div className="px-3 pt-3 mt-1">
        <div className="px-3 py-2.5 rounded-xl" style={{ background: "rgba(6,182,212,0.04)", border: "1px solid rgba(6,182,212,0.08)" }}>
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Cerveau TDAH ?
          </p>
          <p className="text-[10px] text-dopa-cyan font-medium leading-relaxed">
            Tu es au bon endroit.
          </p>
        </div>
      </div>
    </nav>
  );
}