"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, ListChecks, FolderKanban, Target,
  BookOpen, Inbox,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

interface SearchResult {
  id: string;
  type: "task" | "project" | "objective" | "journal" | "inbox";
  title: string;
  subtitle?: string;
  status?: string;
}

const TYPE_CONFIG = {
  task:      { Icon: ListChecks,  label: "Tâche",     color: "var(--accent-blue)" },
  project:   { Icon: FolderKanban, label: "Projet",    color: "var(--accent-purple)" },
  objective: { Icon: Target,       label: "Objectif",  color: "var(--accent-green)" },
  journal:   { Icon: BookOpen,     label: "Journal",   color: "var(--accent-orange)" },
  inbox:     { Icon: Inbox,        label: "Inbox",     color: "var(--accent-cyan)" },
};

export default function SpotlightSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { tasks, projects, objectives, journalEntries, inboxItems } = useAppStore();

  // Keyboard shortcut: Ctrl+Shift+Q
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "q") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Search results
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const r: SearchResult[] = [];

    // Tasks
    tasks.forEach((t) => {
      if (t.text.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.tags.some((tag) => tag.toLowerCase().includes(q))) {
        r.push({
          id: t.id,
          type: "task",
          title: t.text,
          subtitle: t.status === "today" ? "Priorité du jour" : t.status === "inbox" ? "Inbox" : t.status === "completed" || t.status === "done" ? "Terminé" : t.status === "in_progress" ? "En cours" : t.status,
          status: t.status,
        });
      }
    });

    // Projects
    projects.forEach((p) => {
      if (p.name.toLowerCase().includes(q)) {
        r.push({
          id: p.id,
          type: "project",
          title: `${p.emoji} ${p.name}`,
          subtitle: p.status === "active" ? "Actif" : p.status,
        });
      }
    });

    // Objectives
    objectives.forEach((o) => {
      if (o.title.toLowerCase().includes(q) || o.milestones.some((m) => m.text.toLowerCase().includes(q))) {
        r.push({
          id: o.id,
          type: "objective",
          title: o.title,
          subtitle: `${o.progress}% · ${o.horizon}`,
        });
      }
    });

    // Journal
    journalEntries.forEach((j) => {
      if (j.content.toLowerCase().includes(q)) {
        r.push({
          id: j.id,
          type: "journal",
          title: j.content.slice(0, 80) + (j.content.length > 80 ? "…" : ""),
          subtitle: new Date(j.createdAt).toLocaleDateString("fr-FR"),
        });
      }
    });

    // Inbox
    inboxItems.forEach((i) => {
      if (i.text.toLowerCase().includes(q)) {
        r.push({
          id: i.id,
          type: "inbox",
          title: i.text,
          subtitle: i.processed ? "Traité" : "À traiter",
        });
      }
    });

    return r.slice(0, 12);
  }, [query, tasks, projects, objectives, journalEntries, inboxItems]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      setOpen(false);
    }
  };

  // Reset index when results change
  useEffect(() => { setSelectedIndex(0); }, [results]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]"
        style={{ backgroundColor: "var(--backdrop-bg)", backdropFilter: "blur(8px)" }}
        onClick={() => setOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -8 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden bg-surface"
          style={{ border: "1px solid var(--border-b-primary)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border-b-primary)" }}>
            <Search size={16} className="text-t-secondary shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher partout…"
              className="flex-1 text-[15px] text-t-primary bg-transparent placeholder:text-t-tertiary focus:outline-none"
            />
            <span className="text-[10px] text-t-tertiary font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--empty-bg)" }}>
              ESC
            </span>
          </div>

          {/* Results */}
          {query.trim() && (
            <div className="max-h-[50vh] overflow-y-auto">
              {results.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-t-secondary">Aucun résultat pour &quot;{query}&quot;</p>
                </div>
              ) : (
                <div className="py-2">
                  {results.map((result, i) => {
                    const config = TYPE_CONFIG[result.type];
                    const Icon = config.Icon;
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors"
                        style={{
                          background: i === selectedIndex ? "var(--empty-bg)" : "transparent",
                        }}
                        onMouseEnter={() => setSelectedIndex(i)}
                        onClick={() => setOpen(false)}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `color-mix(in srgb, ${config.color} 10%, transparent)` }}
                        >
                          <Icon size={13} style={{ color: config.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-t-primary truncate" style={{ fontWeight: 450 }}>{result.title}</p>
                          {result.subtitle && (
                            <p className="text-[10px] text-t-secondary truncate">{result.subtitle}</p>
                          )}
                        </div>
                        <span className="text-[9px] text-t-tertiary font-medium shrink-0 px-2 py-0.5 rounded-md"
                          style={{ background: "var(--empty-bg)" }}
                        >
                          {config.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Footer hint */}
          {!query.trim() && (
            <div className="px-5 py-4 text-center">
              <p className="text-[11px] text-t-tertiary">Cherche dans tes tâches, projets, objectifs, journal et inbox</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}