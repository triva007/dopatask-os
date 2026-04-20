"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Trash2, X, Search, Flame, RefreshCw, BarChart3 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { JournalEntry } from "@/store/useAppStore";

const MOODS: { id: JournalEntry["mood"]; emoji: string; label: string; color: string }[] = [
  { id: "great", emoji: "🔥", label: "Super", color: "var(--accent-green)" },
  { id: "good", emoji: "😊", label: "Bien", color: "var(--accent-blue)" },
  { id: "neutral", emoji: "😐", label: "Neutre", color: "var(--text-secondary)" },
  { id: "bad", emoji: "😔", label: "Bof", color: "var(--accent-orange)" },
  { id: "terrible", emoji: "😫", label: "Dur", color: "var(--accent-red)" },
];

const WRITING_PROMPTS = [
  "Qu'est-ce qui t'a rendu fier aujourd'hui ?",
  "Quel petit pas as-tu fait aujourd'hui ?",
  "Une chose qui t'a fait sourire ?",
  "Ce qui a été difficile et comment tu l'as géré ?",
  "Trois choses pour lesquelles tu es reconnaissant(e) ?",
  "Ton mood en ce moment et pourquoi ?",
  "Un défi que tu aimerais relever demain ?",
  "Une habitude positive que tu as remarquée chez toi ?",
  "Si tu avais 24h de plus dans la journée, tu ferais quoi ?",
  "Un moment où tu t'es accordé du repos aujourd'hui ?",
  "Qu'est-ce que tu ferais si tu n'avais pas peur ?",
  "Quelle est la chose la plus gentille qu'on t'a dite récemment ?",
];

const ENTRY_TEMPLATES = [
  { id: "gratitude", label: "Gratitude", icon: "✨", content: "3 choses pour lesquelles je suis reconnaissant(e) :\n\n1. \n2. \n3. " },
  { id: "reflection", label: "Réflexion du soir", icon: "🌙", content: "Aujourd'hui j'ai…\n\nCe qui s'est bien passé :\n\nCe que j'aurais pu faire différemment :\n\nCe que j'ai appris :" },
  { id: "braindump", label: "Brain Dump", icon: "🧠", content: "" },
  { id: "wins", label: "Mes victoires", icon: "🏆", content: "Victoires du jour (même les petites comptent) :\n\n- " },
];

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return "Aujourd'hui";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  const diffDays = Math.floor((now.getTime() - ts) / 86400000);
  if (diffDays < 7) return d.toLocaleDateString("fr-FR", { weekday: "long" });
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function getWritingStreak(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = new Set(entries.map((e) => new Date(e.createdAt).toDateString()));
  let streak = 0;
  const check = new Date(today);
  // Check today first
  if (dates.has(check.toDateString())) {
    streak = 1;
    check.setDate(check.getDate() - 1);
  } else {
    // Maybe they haven't written today yet, check from yesterday
    check.setDate(check.getDate() - 1);
    if (!dates.has(check.toDateString())) return 0;
  }
  while (dates.has(check.toDateString())) {
    streak++;
    check.setDate(check.getDate() - 1);
  }
  return streak;
}

export default function JournalView() {
  const { journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useAppStore();
  const [composing, setComposing] = useState(false);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<JournalEntry["mood"]>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [randomPrompt, setRandomPrompt] = useState(() => WRITING_PROMPTS[Math.floor(Math.random() * WRITING_PROMPTS.length)]);

  const writingStreak = useMemo(() => getWritingStreak(journalEntries), [journalEntries]);
  const totalWords = useMemo(() => journalEntries.reduce((sum, e) => sum + countWords(e.content), 0), [journalEntries]);

  // Mood stats for last 30 days
  const moodStats = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    const recent = journalEntries.filter((e) => e.createdAt > thirtyDaysAgo && e.mood);
    const counts: Record<string, number> = {};
    for (const e of recent) {
      if (e.mood) counts[e.mood] = (counts[e.mood] || 0) + 1;
    }
    const total = recent.length || 1;
    return MOODS.map((m) => ({ ...m, count: counts[m.id!] || 0, pct: Math.round(((counts[m.id!] || 0) / total) * 100) }));
  }, [journalEntries]);

  const handleSubmit = () => {
    if (!content.trim()) return;
    addJournalEntry(content.trim(), mood);
    setContent("");
    setMood(undefined);
    setComposing(false);
  };

  const handleEditSave = (id: string) => {
    if (editContent.trim()) {
      updateJournalEntry(id, { content: editContent.trim() });
    }
    setEditingId(null);
  };

  const handleTemplate = (template: typeof ENTRY_TEMPLATES[0]) => {
    setContent(template.content);
    setComposing(true);
  };

  const refreshPrompt = () => {
    let next = randomPrompt;
    while (next === randomPrompt) {
      next = WRITING_PROMPTS[Math.floor(Math.random() * WRITING_PROMPTS.length)];
    }
    setRandomPrompt(next);
  };

  const filteredEntries = searchQuery
    ? journalEntries.filter((e) => e.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : journalEntries;

  // Group entries by date
  const grouped: { label: string; entries: typeof journalEntries }[] = [];
  const seen = new Set<string>();
  for (const entry of filteredEntries) {
    const d = new Date(entry.createdAt);
    const key = d.toDateString();
    if (!seen.has(key)) {
      seen.add(key);
      grouped.push({
        label: formatDate(entry.createdAt),
        entries: filteredEntries.filter((e) => new Date(e.createdAt).toDateString() === key),
      });
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-7 pt-6 pb-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-primary)" }}>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5">
            <BookOpen size={18} className="text-[var(--text-secondary)]" /> Journal
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-[var(--text-secondary)]">{journalEntries.length} entrées</p>
            <span className="text-xs text-[var(--text-tertiary)]">·</span>
            <p className="text-xs text-[var(--text-secondary)]">{totalWords.toLocaleString()} mots</p>
            {writingStreak > 0 && (
              <>
                <span className="text-xs text-[var(--text-tertiary)]">·</span>
                <p className="text-xs flex items-center gap-1" style={{ color: "var(--accent-orange)" }}>
                  <Flame size={11} /> {writingStreak}j streak
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {journalEntries.length > 2 && (
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all"
              style={{ background: showStats ? "color-mix(in srgb, var(--accent-purple) 10%, transparent)" : "var(--surface)", color: showStats ? "var(--accent-purple)" : "var(--text-secondary)", border: "1px solid var(--border-primary)" }}
            ><BarChart3 size={13} /> Stats</button>
          )}
          <button onClick={() => setComposing(!composing)} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all"
            style={{ background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--border-primary)" }}
          ><Plus size={13} /> Écrire</button>
        </div>
      </div>

      {/* Search */}
      {journalEntries.length > 0 && (
        <div className="shrink-0 px-7 py-3" style={{ borderBottom: "1px solid var(--border-primary)" }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--surface)" }}>
            <Search size={13} className="text-[var(--text-secondary)] shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans ton journal…"
              className="flex-1 text-sm bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-5">

        {/* Mood Stats Panel */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl p-5 flex flex-col gap-3"
              style={{ background: "var(--surface)", border: "1px solid var(--border-primary)" }}
            >
              <p className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-widest">Humeur · 30 derniers jours</p>
              <div className="flex flex-col gap-2">
                {moodStats.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <span className="text-sm w-6 text-center">{m.emoji}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border-primary)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${m.pct}%`, background: m.color, minWidth: m.count > 0 ? "4px" : "0" }} />
                    </div>
                    <span className="text-[10px] text-[var(--text-tertiary)] w-8 text-right">{m.count}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Writing Prompt */}
        {!composing && (
          <div className="rounded-xl px-5 py-4 flex items-center gap-3" style={{ background: "color-mix(in srgb, var(--accent-blue) 5%, var(--surface))", border: "1px solid color-mix(in srgb, var(--accent-blue) 15%, var(--border-primary))" }}>
            <p className="flex-1 text-[13px] italic" style={{ color: "var(--accent-blue)" }}>
              &ldquo;{randomPrompt}&rdquo;
            </p>
            <button onClick={refreshPrompt} className="shrink-0 p-1.5 rounded-lg transition-colors hover:bg-surface-3" style={{ color: "var(--accent-blue)" }}>
              <RefreshCw size={13} />
            </button>
            <button
              onClick={() => { setContent(randomPrompt + "\n\n"); setComposing(true); }}
              className="shrink-0 text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-all"
              style={{ background: "color-mix(in srgb, var(--accent-blue) 10%, transparent)", color: "var(--accent-blue)" }}
            >Écrire</button>
          </div>
        )}

        {/* Templates */}
        {!composing && (
          <div className="flex gap-2 flex-wrap">
            {ENTRY_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTemplate(t)}
                className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-2 rounded-xl transition-all"
                style={{ background: "var(--surface)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Compose Area */}
        <AnimatePresence>
          {composing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-3xl p-6 flex flex-col gap-4"
              style={{ background: "var(--surface)", border: "1px solid var(--border-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
            >
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Qu'est-ce qui se passe dans ta tête ? Écris librement, sans filtre…"
                rows={6}
                autoFocus
                className="text-sm bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none resize-none leading-relaxed"
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
              />

              {/* Word count */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-tertiary)]">{countWords(content)} mots</span>
              </div>

              {/* Mood picker */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-medium">Humeur</span>
                <div className="flex gap-1.5">
                  {MOODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMood(mood === m.id ? undefined : m.id)}
                      className="text-lg px-2 py-1 rounded-xl transition-all"
                      style={{
                        background: mood === m.id ? `color-mix(in srgb, ${m.color} 12%, transparent)` : "transparent",
                        border: `1px solid ${mood === m.id ? m.color : "transparent"}`,
                        transform: mood === m.id ? "scale(1.15)" : "scale(1)",
                      }}
                      title={m.label}
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-between items-center">
                <span className="text-[10px] text-[var(--text-tertiary)]">Ctrl+Enter pour sauvegarder</span>
                <div className="flex gap-2">
                  <button onClick={() => { setComposing(false); setContent(""); setMood(undefined); }} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-1.5">Annuler</button>
                  <button
                    onClick={handleSubmit}
                    disabled={!content.trim()}
                    className="text-xs px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-30"
                    style={{ background: "var(--accent-blue)", color: "white" }}
                  >Sauvegarder</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Entries */}
        {grouped.map((group, gi) => (
          <div key={gi} className="flex flex-col gap-3">
            <p className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-widest px-1">{group.label}</p>
            {group.entries.map((entry) => {
              const moodCfg = MOODS.find((m) => m.id === entry.mood);
              const isEditing = editingId === entry.id;
              const words = countWords(entry.content);

              return (
                <motion.div
                  key={entry.id}
                  layout
                  className="rounded-xl px-5 py-4 group transition-all"
                  style={{ background: "var(--surface)", border: "1px solid var(--border-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onBlur={() => handleEditSave(entry.id)}
                          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleEditSave(entry.id); }}
                          autoFocus
                          rows={4}
                          className="w-full text-sm bg-transparent text-[var(--text-primary)] focus:outline-none resize-none leading-relaxed"
                        />
                      ) : (
                        <p
                          className="text-[14px] text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap cursor-pointer"
                          onClick={() => { setEditingId(entry.id); setEditContent(entry.content); }}
                        >
                          {entry.content}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {moodCfg && <span className="text-sm" title={moodCfg.label}>{moodCfg.emoji}</span>}
                      <button
                        onClick={() => deleteJournalEntry(entry.id)}
                        className="opacity-0 group-hover:opacity-100 text-[var(--text-secondary)] hover:text-accent-red transition-all"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {new Date(entry.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">· {words} mot{words > 1 ? "s" : ""}</span>
                    {/* Mood change */}
                    <div className="flex gap-0.5 ml-auto opacity-0 group-hover:opacity-100 transition-all">
                      {MOODS.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => updateJournalEntry(entry.id, { mood: entry.mood === m.id ? undefined : m.id })}
                          className="text-[10px] px-1 rounded transition-all"
                          style={{ opacity: entry.mood === m.id ? 1 : 0.4 }}
                        >
                          {m.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}

        {journalEntries.length === 0 && !composing && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: "var(--empty-bg)" }}>
              <BookOpen size={22} className="text-[var(--text-secondary)]" />
            </div>
            <div className="text-center">
              <p className="text-sm text-[var(--text-primary)]">Ton journal est vide</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Écris ce qui se passe dans ta journée. C&apos;est ton espace, sans jugement.</p>
            </div>
            <button
              onClick={() => setComposing(true)}
              className="text-xs px-4 py-2 rounded-xl font-medium transition-all"
              style={{ background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--border-primary)" }}
            >
              <Plus size={12} className="inline mr-1" /> Commencer à écrire
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
