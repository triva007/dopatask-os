"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Trash2, X, Search } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { JournalEntry } from "@/store/useAppStore";

const MOODS: { id: JournalEntry["mood"]; emoji: string; label: string; color: string }[] = [
  { id: "great", emoji: "🔥", label: "Super", color: "#4ade80" },
  { id: "good", emoji: "😊", label: "Bien", color: "#67e8f9" },
  { id: "neutral", emoji: "😐", label: "Neutre", color: "#a1a1aa" },
  { id: "bad", emoji: "😔", label: "Bof", color: "#fbbf24" },
  { id: "terrible", emoji: "😫", label: "Dur", color: "#fca5a5" },
];

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - ts;
  const diffH = Math.floor(diffMs / 3600000);

  if (diffH < 1) return "Il y a quelques minutes";
  if (diffH < 24) return `Il y a ${diffH}h`;

  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return "Aujourd'hui";

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Hier";

  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export default function JournalView() {
  const { journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useAppStore();
  const [composing, setComposing] = useState(false);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<JournalEntry["mood"]>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

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
      <div className="shrink-0 px-7 pt-6 pb-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight flex items-center gap-2.5">
            <BookOpen size={20} className="text-zinc-400" /> Journal
          </h1>
          <p className="text-[15px] text-zinc-600 mt-1">Vide-toi la tête · {journalEntries.length} entrées</p>
        </div>
        <button onClick={() => setComposing(!composing)} className="flex items-center gap-1.5 text-[15px] px-3 py-2 rounded-xl font-medium transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#d4d4d8" }}
        ><Plus size={13} /> Écrire</button>
      </div>

      {/* Search */}
      {journalEntries.length > 0 && (
        <div className="shrink-0 px-7 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <Search size={13} className="text-zinc-600 shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans ton journal…"
              className="flex-1 text-[15px] bg-transparent text-zinc-300 placeholder:text-zinc-700 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-zinc-600 hover:text-zinc-400">
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6 flex flex-col gap-6">

        {/* Compose Area */}
        <AnimatePresence>
          {composing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl p-6 flex flex-col gap-4"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Qu'est-ce qui se passe dans ta tête ? Écris librement, sans filtre…"
                rows={5}
                autoFocus
                className="text-[15px] bg-transparent text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed"
              />

              {/* Mood picker */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-600 uppercase tracking-widest font-medium">Humeur</span>
                <div className="flex gap-1.5">
                  {MOODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMood(mood === m.id ? undefined : m.id)}
                      className="text-xl px-2 py-1 rounded-xl transition-all"
                      style={{
                        background: mood === m.id ? `${m.color}12` : "transparent",
                        border: `1px solid ${mood === m.id ? m.color + "30" : "transparent"}`,
                        transform: mood === m.id ? "scale(1.15)" : "scale(1)",
                      }}
                      title={m.label}
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button onClick={() => { setComposing(false); setContent(""); setMood(undefined); }} className="text-[15px] text-zinc-600 hover:text-zinc-400 px-3 py-1.5">Annuler</button>
                <button
                  onClick={handleSubmit}
                  disabled={!content.trim()}
                  className="text-[15px] px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-30"
                  style={{ background: "rgba(255,255,255,0.08)", color: "#e4e4e7" }}
                >Sauvegarder</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Entries */}
        {grouped.map((group, gi) => (
          <div key={gi} className="flex flex-col gap-3">
            <p className="text-xs font-medium text-zinc-600 uppercase tracking-widest px-1">{group.label}</p>
            {group.entries.map((entry) => {
              const moodCfg = MOODS.find((m) => m.id === entry.mood);
              const isEditing = editingId === entry.id;

              return (
                <motion.div
                  key={entry.id}
                  layout
                  className="rounded-2xl px-6 py-5 group transition-all"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onBlur={() => handleEditSave(entry.id)}
                          onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleEditSave(entry.id); }}
                          autoFocus
                          rows={4}
                          className="w-full text-[15px] bg-transparent text-zinc-200 focus:outline-none resize-none leading-relaxed"
                        />
                      ) : (
                        <p
                          className="text-[15px] text-zinc-300 leading-relaxed whitespace-pre-wrap cursor-pointer"
                          onClick={() => { setEditingId(entry.id); setEditContent(entry.content); }}
                        >
                          {entry.content}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {moodCfg && <span className="text-[15px]" title={moodCfg.label}>{moodCfg.emoji}</span>}
                      <button
                        onClick={() => deleteJournalEntry(entry.id)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-300 transition-all"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-zinc-700">
                      {new Date(entry.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {/* Mood change */}
                    <div className="flex gap-0.5 ml-auto opacity-0 group-hover:opacity-100 transition-all">
                      {MOODS.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => updateJournalEntry(entry.id, { mood: entry.mood === m.id ? undefined : m.id })}
                          className="text-xs px-1 rounded transition-all"
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <BookOpen size={22} className="text-zinc-600" />
            </div>
            <div className="text-center">
              <p className="text-[15px] text-zinc-400">Ton journal est vide</p>
              <p className="text-[15px] text-zinc-600 mt-1">Écris ce qui se passe dans ta journée. C&apos;est ton espace, sans jugement.</p>
            </div>
            <button onClick={() => setComposing(true)} className="text-[15px] px-4 py-2 rounded-xl font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.06)", color: "#d4d4d8", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Plus size={12} className="inline mr-1" /> Commencer à écrire
            </button>
          </div>
        )}
      </div>
    </div>
  );
}