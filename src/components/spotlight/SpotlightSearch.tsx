"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, ListChecks, FolderKanban, Target,
  BookOpen, Inbox, StickyNote, Users,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useCrmStore } from "@/store/useCrmStore";
import Fuse from "fuse.js";

interface SearchResult {
  id: string;
  type: "task" | "project" | "objective" | "journal" | "inbox" | "note" | "prospect";
  title: string;
  subtitle?: string;
  status?: string;
  href: string;
}

const TYPE_CONFIG = {
  task:      { Icon: ListChecks,   label: "Tâche",     color: "var(--accent-blue)" },
  project:   { Icon: FolderKanban, label: "Projet",    color: "var(--accent-purple)" },
  objective: { Icon: Target,       label: "Objectif",  color: "var(--accent-green)" },
  journal:   { Icon: BookOpen,     label: "Journal",   color: "var(--accent-orange)" },
  inbox:     { Icon: Inbox,        label: "Inbox",     color: "var(--accent-cyan)" },
  note:      { Icon: StickyNote,   label: "Note",      color: "var(--accent-yellow, #eab308)" },
  prospect:  { Icon: Users,        label: "CRM",       color: "var(--accent-pink, #ec4899)" },
};

export default function SpotlightSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { tasks, projects, objectives, journalEntries, inboxItems, notes } = useAppStore();
  const prospects = useCrmStore((s) => s.prospects);

  // Keyboard shortcut: Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
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

  // All searchable items
  const searchableItems = useMemo(() => {
    const items: SearchResult[] = [];
    tasks.forEach(t => items.push({ id: t.id, type: "task", title: t.text, subtitle: t.status, href: "/taches" }));
    projects.forEach(p => items.push({ id: p.id, type: "project", title: p.name, subtitle: p.status, href: "/projets" }));
    objectives.forEach(o => items.push({ id: o.id, type: "objective", title: o.title, subtitle: `${o.progress}% · ${o.horizon}`, href: "/objectifs" }));
    journalEntries.forEach(j => items.push({ id: j.id, type: "journal", title: j.content.slice(0, 100), subtitle: new Date(j.createdAt).toLocaleDateString(), href: "/journal" }));
    inboxItems.forEach(i => items.push({ id: i.id, type: "inbox", title: i.text, subtitle: i.processed ? "Traité" : "À traiter", href: "/inbox" }));
    notes.forEach(n => items.push({ id: n.id, type: "note", title: n.title || "Note sans titre", subtitle: n.content.slice(0, 50), href: "/notes" }));
    prospects.forEach(p => items.push({ id: p.id, type: "prospect", title: p.entreprise, subtitle: p.statut, href: `/prospects/${p.id}` }));
    return items;
  }, [tasks, projects, objectives, journalEntries, inboxItems, notes, prospects]);

  const fuse = useMemo(() => new Fuse(searchableItems, {
    keys: ["title", "subtitle"],
    threshold: 0.35,
    distance: 100,
  }), [searchableItems]);

  const quickActions: SearchResult[] = useMemo(() => [
    { id: "qa-theme",    type: "task", title: "Changer de thème", subtitle: "Passer en mode sombre/clair", href: "action:theme" },
    { id: "qa-project",  type: "project", title: "Nouveau Projet", subtitle: "Créer un nouveau projet", href: "/projets" },
    { id: "qa-prospect", type: "prospect", title: "Nouveau Prospect", subtitle: "Ajouter au CRM", href: "/crm" },
    { id: "qa-task",     type: "task", title: "Nouvelle Tâche", subtitle: "Ajouter à l'inbox", href: "/inbox" },
  ], []);

  // Search results
  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];

    if (q.startsWith(">")) {
      const sub = q.slice(1).toLowerCase();
      return quickActions.filter(a => a.title.toLowerCase().includes(sub) || a.subtitle?.toLowerCase().includes(sub));
    }

    return fuse.search(q).map(r => r.item).slice(0, 10);
  }, [query, fuse, quickActions]);

  const toggleTheme = useAppStore((s) => s.toggleTheme);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    if (result.href === "action:theme") {
      toggleTheme();
      return;
    }
    router.push(result.href);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
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
          style={{ border: "1px solid var(--border-primary)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border-primary)" }}>
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
                        onClick={() => handleSelect(result)}
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
              <p className="text-[11px] text-t-tertiary">Appuyez sur <kbd className="font-mono bg-[var(--surface-2)] px-1 rounded">Ctrl+K</kbd> pour chercher dans vos tâches, projets, notes, et CRM</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
