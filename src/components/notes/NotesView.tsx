"use client";

import { useAppStore } from "@/store/useAppStore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  StickyNote, Search, Plus, 
  Trash2, ListChecks, Pin, PinOff, X, Palette
} from "lucide-react";
import { useState, useMemo } from "react";

const COLORS = [
  "var(--card-bg)",
  "#442b2d", "#3e3328", "#273934", "#20393f", "#223348", "#38284a", "#452440"
];

export default function NotesView() {
  const { notes, addNote, updateNote, deleteNote, togglePinNote } = useAppStore();
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const handleAdd = () => {
    if (!newTitle.trim() && !newContent.trim()) {
      setIsAdding(false);
      return;
    }
    addNote(newTitle, newContent, selectedColor);
    setNewTitle("");
    setNewContent("");
    setSelectedColor(COLORS[0]);
    setIsAdding(false);
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const title = n.title?.toLowerCase() || "";
      const body = n.content?.toLowerCase() || "";
      const s = search.toLowerCase();
      return title.includes(s) || body.includes(s);
    }).sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1));
  }, [notes, search]);

  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const otherNotes = filteredNotes.filter(n => !n.pinned);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="shrink-0 px-8 pt-8 pb-5 border-b border-[var(--border-primary)] flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight leading-none flex items-center gap-3">
            <StickyNote size={24} className="text-[var(--accent-blue)]" />
            Notes
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-2">
            Capture tes idées. Organise ta vie.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={14} />
            <input 
              type="text"
              placeholder="Rechercher une note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[var(--surface-1)] border border-[var(--border-primary)] rounded-lg text-[13px] w-64 focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">
        
        {/* Quick Add Section */}
        <div className="flex justify-center">
          {!isAdding ? (
            <div 
              onClick={() => setIsAdding(true)}
              className="w-full max-w-xl p-3 rounded-lg bg-[var(--card-bg)] border border-[var(--border-primary)] shadow-sm cursor-text text-[var(--text-tertiary)] text-[14px] font-medium"
            >
              Créer une note...
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-xl rounded-xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-xl overflow-hidden"
              style={{ background: selectedColor }}
            >
              <div className="p-4 space-y-3">
                <input 
                  placeholder="Titre"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-transparent text-[16px] font-bold text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-tertiary)]"
                  autoFocus
                />
                <textarea 
                  placeholder="Créer une note..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={3}
                  className="w-full bg-transparent text-[14px] text-[var(--text-secondary)] focus:outline-none resize-none placeholder:text-[var(--text-tertiary)]"
                />
              </div>
              <div className="px-4 py-2 flex items-center justify-between border-t border-[rgba(255,255,255,0.05)]">
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button 
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className="w-5 h-5 rounded-full border border-[rgba(255,255,255,0.1)]"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    Fermer
                  </button>
                  <button onClick={handleAdd} className="px-4 py-1.5 rounded-lg bg-[var(--accent-blue)] text-white text-[12px] font-bold hover:opacity-90 transition-opacity">
                    Ajouter
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Pinned Section */}
        {pinnedNotes.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-[11px] font-bold tracking-[0.12em] uppercase text-[var(--text-tertiary)] flex items-center gap-2 px-2">
              <Pin size={10} /> Épinglées
            </h2>
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {pinnedNotes.map((note) => (
                <NoteCard key={note.id} note={note} onUpdate={updateNote} onDelete={deleteNote} onTogglePin={togglePinNote} />
              ))}
            </div>
          </div>
        )}

        {/* Other Section */}
        <div className="space-y-4">
          {pinnedNotes.length > 0 && (
            <h2 className="text-[11px] font-bold tracking-[0.12em] uppercase text-[var(--text-tertiary)] px-2">
              Autres
            </h2>
          )}
          {otherNotes.length > 0 ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {otherNotes.map((note) => (
                <NoteCard key={note.id} note={note} onUpdate={updateNote} onDelete={deleteNote} onTogglePin={togglePinNote} />
              ))}
            </div>
          ) : (
            !pinnedNotes.length && !isAdding && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[var(--surface-1)] flex items-center justify-center mb-4">
                  <StickyNote size={32} className="text-[var(--text-tertiary)]" />
                </div>
                <h3 className="text-[16px] font-semibold text-[var(--text-secondary)]">Aucune note</h3>
                <p className="text-[13px] text-[var(--text-tertiary)] mt-1">Capture tes idées maintenant.</p>
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
}

function NoteCard({ note, onUpdate, onDelete, onTogglePin }: { note: any, onUpdate: any, onDelete: any, onTogglePin: any }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="break-inside-avoid rounded-xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5 hover:shadow-lg transition-all group relative"
      style={{ background: note.color }}
    >
      <button 
        onClick={() => onTogglePin(note.id)}
        className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all ${note.pinned ? "text-[var(--accent-blue)] opacity-100" : "text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100"}`}
      >
        {note.pinned ? <Pin size={14} /> : <Pin size={14} />}
      </button>

      {note.title && (
        <h3 className="text-[15px] font-bold text-[var(--text-primary)] mb-2 pr-6">
          {note.title}
        </h3>
      )}
      <div className="text-[13px] text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
        {note.content}
      </div>

      <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-2">
          <button className="p-1.5 rounded-md hover:bg-[rgba(255,255,255,0.05)] text-[var(--text-tertiary)] hover:text-[var(--accent-green)]" title="Convertir en tâche">
            <ListChecks size={13} />
          </button>
        </div>
        <button onClick={() => onDelete(note.id)} className="p-1.5 rounded-md hover:bg-[rgba(255,255,255,0.05)] text-[var(--text-tertiary)] hover:text-[var(--accent-red)]">
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}
