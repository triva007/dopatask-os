"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Info, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function NotificationCenter() {
  const { toasts, removeToast } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  const sortedToasts = [...toasts].sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);

  const clearAll = () => {
    toasts.forEach(t => removeToast(t.id));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
          isOpen ? "bg-accent-blue text-white shadow-lg" : "text-sidebar-inactive hover:bg-surface-2 hover:text-sidebar-active-text"
        }`}
      >
        <Bell size={20} strokeWidth={1.75} />
        {toasts.length > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-dopa-red rounded-full border-2 border-surface-1" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10, x: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10, x: 10 }}
              className="absolute bottom-12 left-0 w-[320px] bg-surface-1 border border-surface-3 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-surface-3 flex items-center justify-between bg-surface-2/50">
                <h3 className="text-[13px] font-bold text-t-primary flex items-center gap-2">
                  <Bell size={14} className="text-dopa-cyan" /> Notifications
                </h3>
                <div className="flex items-center gap-2">
                  {toasts.length > 0 && (
                    <button 
                      onClick={clearAll}
                      className="text-[10px] text-t-tertiary hover:text-dopa-red flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={10} /> Effacer
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="text-t-tertiary hover:text-t-primary">
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
                {sortedToasts.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell size={32} className="mx-auto text-t-tertiary opacity-20 mb-3" />
                    <p className="text-[12px] text-t-tertiary italic">Aucune notification</p>
                  </div>
                ) : (
                  sortedToasts.map((t) => (
                    <div 
                      key={t.id}
                      className="group flex items-start gap-3 p-3 rounded-xl hover:bg-surface-2 transition-colors relative"
                    >
                      <div className={`mt-0.5 shrink-0 ${
                        t.type === "success" ? "text-dopa-green" : 
                        t.type === "error" ? "text-dopa-red" : "text-dopa-cyan"
                      }`}>
                        {t.type === "success" ? <CheckCircle2 size={14} /> : 
                         t.type === "error" ? <AlertCircle size={14} /> : <Info size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] text-t-secondary leading-tight break-words">
                          {t.message}
                        </p>
                        <p className="text-[9px] text-t-tertiary mt-1 font-medium">
                          {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button 
                        onClick={() => removeToast(t.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-t-tertiary hover:text-dopa-red transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2 bg-surface-2/30 border-t border-surface-3">
                <p className="text-[10px] text-t-tertiary text-center italic">
                  Les notifications sont éphémères.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
