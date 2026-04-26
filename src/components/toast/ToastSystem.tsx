"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Trophy, Skull, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { Toast } from "@/store/useAppStore";

const TOAST_ICONS: Record<Toast["type"], { icon: typeof Zap; color: string }> = {
  success:     { icon: CheckCircle2, color: "var(--accent-green)" },
  error:       { icon: AlertCircle,  color: "var(--accent-red)" },
  info:        { icon: Info,         color: "var(--accent-blue)" },
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useAppStore((s) => s.removeToast);
  const { icon: Icon, color } = TOAST_ICONS[toast.type] || TOAST_ICONS.info;

  useEffect(() => {
    const timeout = setTimeout(() => {
      removeToast(toast.id);
    }, toast.duration || 3000);
    return () => clearTimeout(timeout);
  }, [toast.id, toast.duration, removeToast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl min-w-[240px] max-w-[360px] shadow-lg"
      style={{
        background: "var(--surface-1)",
        border: "1px solid var(--border-primary)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}
      >
        <Icon size={14} style={{ color }} />
      </div>
      <p className="flex-1 text-[13px] text-t-primary leading-snug" style={{ fontWeight: 450 }}>
        {toast.message}
      </p>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 p-1 rounded-lg text-t-tertiary hover:text-t-primary transition-colors"
      >
        <X size={12} />
      </button>
    </motion.div>
  );
}

export default function ToastSystem() {
  const toasts = useAppStore((s) => s.toasts);
  const visibleToasts = toasts.slice(-5);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
