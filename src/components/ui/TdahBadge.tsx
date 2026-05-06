"use client";

import { motion } from "framer-motion";
import { RotateCw, Calendar, Check, AlertTriangle } from "lucide-react";

export type BadgeVariant = "today" | "overdue" | "future" | "recurring" | "done";

interface TdahBadgeProps {
  variant: BadgeVariant;
  label?: string;
  size?: "sm" | "md";
}

const BADGE_STYLES: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  today: {
    bg: "color-mix(in srgb, #eab308 15%, transparent)",
    text: "#ca8a04",
    border: "color-mix(in srgb, #eab308 30%, transparent)",
  },
  overdue: {
    bg: "var(--accent-red-light)",
    text: "var(--accent-red)",
    border: "color-mix(in srgb, var(--accent-red) 30%, transparent)",
  },
  future: {
    bg: "var(--surface-2)",
    text: "var(--text-tertiary)",
    border: "var(--border-primary)",
  },
  recurring: {
    bg: "var(--accent-blue-light)",
    text: "var(--accent-blue)",
    border: "color-mix(in srgb, var(--accent-blue) 30%, transparent)",
  },
  done: {
    bg: "var(--accent-green-light)",
    text: "var(--accent-green)",
    border: "color-mix(in srgb, var(--accent-green) 30%, transparent)",
  },
};

const BADGE_ICONS: Record<BadgeVariant, typeof Calendar> = {
  today: Calendar,
  overdue: AlertTriangle,
  future: Calendar,
  recurring: RotateCw,
  done: Check,
};

const BADGE_LABELS: Record<BadgeVariant, string> = {
  today: "Aujourd'hui",
  overdue: "En retard",
  future: "Bientôt",
  recurring: "Récurrent",
  done: "Fait",
};

export function getBadgeVariant(dueDate?: string, isRecurring?: boolean, isCompleted?: boolean): BadgeVariant {
  if (isCompleted) return "done";
  if (isRecurring && !dueDate) return "recurring";
  if (!dueDate) return "future";

  const todayStr = new Date().toISOString().slice(0, 10);
  if (dueDate < todayStr) return "overdue";
  if (dueDate === todayStr) return isRecurring ? "recurring" : "today";
  return "future";
}

export default function TdahBadge({ variant, label, size = "sm" }: TdahBadgeProps) {
  const style = BADGE_STYLES[variant];
  const Icon = BADGE_ICONS[variant];
  const displayLabel = label || BADGE_LABELS[variant];

  const isToday = variant === "today";
  const isOverdue = variant === "overdue";

  return (
    <motion.span
      className="inline-flex items-center gap-1 rounded-md font-semibold whitespace-nowrap select-none"
      style={{
        background: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        fontSize: size === "sm" ? "9px" : "10px",
        padding: size === "sm" ? "1px 5px" : "2px 7px",
        letterSpacing: "0.03em",
      }}
      animate={
        isToday
          ? { opacity: [1, 0.7, 1] }
          : isOverdue
          ? { scale: [1, 1.03, 1] }
          : undefined
      }
      transition={
        isToday || isOverdue
          ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
          : undefined
      }
    >
      <Icon size={size === "sm" ? 8 : 9} strokeWidth={2.5} />
      {displayLabel}
    </motion.span>
  );
}
