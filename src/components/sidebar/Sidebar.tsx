"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ListChecks,
  Target,
  Layers,
  FlaskConical,
  ShoppingBag,
  Settings,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/",              label: "Dashboard",         Icon: LayoutDashboard },
  { href: "/taches",        label: "Tâches",            Icon: ListChecks      },
  { href: "/objectifs",     label: "Objectifs",         Icon: Target          },
  { href: "/sprints",       label: "Sprints & Backlog", Icon: Layers          },
  { href: "/hyperfocus",    label: "Hyperfocus Lab",    Icon: FlaskConical     },
  { href: "/boutique",      label: "Boutique Dopamine", Icon: ShoppingBag     },
  { href: "/reglages",      label: "Réglages",          Icon: Settings        },
] as const;

export default function Sidebar() {
  const [pathname, setPathname] = useState("/");

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  return (
    <nav
      className="flex flex-col h-full w-full px-3 py-5 gap-1"
      style={{ background: "#050507" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 pb-6 pt-1">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #06b6d4, #7c3aed)" }}
        >
          <Zap size={14} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-100 leading-none tracking-tight">
            DopaTask
          </p>
          <p className="text-[10px] text-zinc-600 leading-none mt-0.5">
            OS Neuro-Cognitif
          </p>
        </div>
      </div>

      {/* Liens */}
      <div className="flex flex-col gap-0.5 flex-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setPathname(href)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group"
              style={{
                background: isActive ? "rgba(6,182,212,0.08)" : "transparent",
                border: isActive
                  ? "1px solid rgba(6,182,212,0.15)"
                  : "1px solid transparent",
              }}
            >
              <Icon
                size={15}
                style={{ color: isActive ? "#06b6d4" : "#52525b" }}
                className="shrink-0 transition-colors group-hover:text-zinc-400"
              />
              <span
                className="text-xs font-medium transition-colors leading-none"
                style={{ color: isActive ? "#e4e4e7" : "#52525b" }}
              >
                {label}
              </span>
              {isActive && (
                <div
                  className="ml-auto w-1 h-1 rounded-full shrink-0"
                  style={{ background: "#06b6d4" }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 pt-4 border-t border-zinc-900">
        <p className="text-[10px] text-zinc-700 leading-relaxed">
          Cerveau TDAH ?<br />
          <span className="text-zinc-600">Tu es au bon endroit.</span>
        </p>
      </div>
    </nav>
  );
}
