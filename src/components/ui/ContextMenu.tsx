"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

interface ContextMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger" | "success";
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x, y });

  useEffect(() => {
    if (!menuRef.current) return;
    
    const menuWidth = menuRef.current.offsetWidth || 180;
    const menuHeight = menuRef.current.offsetHeight || 200;
    
    let nextX = x;
    let nextY = y;

    if (x + menuWidth > window.innerWidth) nextX = x - menuWidth;
    if (y + menuHeight > window.innerHeight) nextY = y - menuHeight;

    setCoords({ x: nextX, y: nextY });

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [x, y, onClose]);

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1, ease: "easeOut" }}
        className="fixed z-[9999] min-w-[180px] p-1.5 rounded-xl border border-[rgba(255,255,255,0.1)] shadow-2xl backdrop-blur-xl"
        style={{ 
          top: coords.y, 
          left: coords.x,
          background: "rgba(25, 25, 27, 0.85)",
        }}
      >
        <div className="flex flex-col gap-0.5">
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
                onClose();
              }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all group w-full text-left
                ${item.variant === "danger" 
                  ? "text-red-400 hover:bg-red-500/10" 
                  : item.variant === "success"
                  ? "text-green-400 hover:bg-green-500/10"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.05)]"
                }
              `}
            >
              <span className="shrink-0 transition-transform group-hover:scale-110">
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
