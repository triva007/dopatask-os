"use client";

import { useAppStore } from "@/store/useAppStore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  StickyNote, Search, Plus, 
  Trash2, ListChecks, Pin, PinOff, X, Palette,
  Archive, ArchiveRestore, MoreVertical, Edit3,
  Calendar, Check, CheckCircle2, ChevronDown, ChevronUp
} from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import ContextMenu from "@/components/ui/ContextMenu";

const COLORS = [
  "var(--card-bg)",
  "#442b2d", "#3e3328", "#273934", "#20393f", "#223348", "#38284a", "#452440",
  "#1e3a5f", "#1b4332", "#432818", "#3c0919"
];

export default function NotesView() {
  const { notes, addNote, updateNote, deleteNote, togglePinNote, toggleArchiveNote, convertNoteToTask } = useAppStore();
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [showArchived, setShowArchived] = useState(false);
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, noteId: string } | null>(null);
  
  // Editor Modal State
  const [editingNote, setEditingNote] = useState<any | null>(null);

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
      const matchesSearch = title.includes(s) || body.includes(s);
      return matchesSearch && (showArchived ? n.archived : !n.archived);
    }).sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1));
  }, [notes, search, showArchived]);

  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const otherNotes = filteredNotes.filter(n => !n.pinned);

  const handleContextMenu = (e: React.MouseEvent, noteId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, noteId });
  };

  const selectedNote = notes.find(n => n.id === contextMenu?.noteId);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="shrink-0 px-8 pt-8 pb-5 border-b border-[var(--border-primary)] flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight leading-none flex items-center gap-3">
            <StickyNote size={24} className="text-[var(--accent-blue)]" />
            {showArchived ? "Archives" : "Notes"}
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-2">
            {showArchived ? "Gère tes notes archivées." : "Ton espace de réflexion et d'organisation."}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-[var(--accent-blue)] transition-colors" size={14} />
            <input 
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[var(--surface-1)] border border-[var(--border-primary)] rounded-xl text-[13px] w-64 focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)] transition-all"
            />
          </div>
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 text-[13px] font-medium
              ${showArchived ? "bg-[var(--accent-blue)] text-white border-transparent" : "bg-[var(--surface-1)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:bg-[var(--surface-2)]"}
            `}
          >
            <Archive size={16} />
            {showArchived ? "Retour" : "Archives"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-10">
        
        {/* Quick Add Section */}
        {!showArchived && (
          <div className="flex justify-center">
            {!isAdding ? (
              <motion.div 
                layoutId="add-note-box"
                onClick={() => setIsAdding(true)}
                className="w-full max-w-xl p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-primary)] shadow-sm cursor-text text-[var(--text-tertiary)] text-[14px] font-medium flex items-center justify-between group hover:border-[var(--accent-blue)] transition-colors"
              >
                <span>Créer une note...</span>
                <Plus size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ) : (
              <motion.div 
                layoutId="add-note-box"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-xl rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-2xl overflow-hidden z-20"
                style={{ background: selectedColor }}
              >
                <div className="p-5 space-y-4">
                  <input 
                    placeholder="Titre"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-transparent text-[18px] font-bold text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-tertiary)]"
                    autoFocus
                  />
                  <textarea 
                    placeholder="Écris quelque chose..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={4}
                    className="w-full bg-transparent text-[14px] text-[var(--text-secondary)] focus:outline-none resize-none placeholder:text-[var(--text-tertiary)] leading-relaxed"
                  />
                </div>
                <div className="px-5 py-3 flex items-center justify-between border-t border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.05)]">
                  <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-[60%] scrollbar-none">
                    {COLORS.map(c => (
                      <button 
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`w-5 h-5 shrink-0 rounded-full border transition-transform hover:scale-125 ${selectedColor === c ? "border-white scale-110" : "border-transparent"}`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-[12px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                      Annuler
                    </button>
                    <button onClick={handleAdd} className="px-5 py-2 rounded-xl bg-white text-black text-[12px] font-bold hover:bg-gray-100 transition-colors shadow-lg">
                      Terminer
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Pinned Section */}
        {pinnedNotes.length > 0 && (
          <div className="space-y-5">
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--text-tertiary)] flex items-center gap-2.5 px-2">
              <Pin size={12} className="text-[var(--accent-blue)]" /> {showArchived ? "Archives épinglées" : "Notes épinglées"}
            </h2>
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
              {pinnedNotes.map((note) => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  onEdit={() => setEditingNote(note)}
                  onContextMenu={(e) => handleContextMenu(e, note.id)} 
                />
              ))}
            </div>
          </div>
        )}

        {/* Other Section */}
        <div className="space-y-5">
          {pinnedNotes.length > 0 && (
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--text-tertiary)] px-2">
              {showArchived ? "Autres archives" : "Autres notes"}
            </h2>
          )}
          {otherNotes.length > 0 ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
              {otherNotes.map((note) => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  onEdit={() => setEditingNote(note)}
                  onContextMenu={(e) => handleContextMenu(e, note.id)} 
                />
              ))}
            </div>
          ) : (
            !pinnedNotes.length && !isAdding && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-[28px] bg-[var(--surface-1)] border border-[var(--border-primary)] flex items-center justify-center mb-6">
                  {showArchived ? <Archive size={32} className="text-[var(--text-tertiary)] opacity-50" /> : <StickyNote size={32} className="text-[var(--text-tertiary)] opacity-50" />}
                </div>
                <h3 className="text-[18px] font-semibold text-[var(--text-secondary)]">
                  {showArchived ? "Aucune archive" : "Notes vides"}
                </h3>
                <p className="text-[13px] text-[var(--text-tertiary)] mt-2 max-w-[240px]">
                  {showArchived ? "Tes notes archivées s'afficheront ici." : "Tes idées et tes projets commencent ici. Crée ta première note."}
                </p>
              </div>
            )
          )}
        </div>

      </div>

      {/* Context Menu */}
      {contextMenu && selectedNote && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            { 
              label: selectedNote.pinned ? "Désépingler" : "Épingler", 
              icon: selectedNote.pinned ? <PinOff size={14} /> : <Pin size={14} />, 
              onClick: () => togglePinNote(selectedNote.id) 
            },
            { 
              label: selectedNote.archived ? "Désarchiver" : "Archiver", 
              icon: selectedNote.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />, 
              onClick: () => toggleArchiveNote(selectedNote.id) 
            },
            { 
              label: "Convertir en tâche", 
              icon: <ListChecks size={14} />, 
              onClick: () => convertNoteToTask(selectedNote.id) 
            },
            { 
              label: "Supprimer", 
              icon: <Trash2 size={14} />, 
              variant: "danger",
              onClick: () => deleteNote(selectedNote.id) 
            },
          ]}
        />
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {editingNote && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
            onClick={() => {
              updateNote(editingNote.id, editingNote);
              setEditingNote(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to backdrop
              className="w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-primary)]"
              style={{ background: editingNote.color }}
            >
              <div className="p-8 space-y-6">
                <input 
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  className="w-full bg-transparent text-[24px] font-bold text-[var(--text-primary)] focus:outline-none"
                  placeholder="Titre"
                />
                <textarea 
                  value={editingNote.content}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                  className="w-full bg-transparent text-[16px] text-[var(--text-secondary)] focus:outline-none min-h-[350px] resize-none leading-relaxed"
                  placeholder="Contenu..."
                />
              </div>
              <div className="px-8 py-5 flex items-center justify-between border-t border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.15)]">
                <div className="flex items-center gap-6">
                   <div className="flex gap-1.5 overflow-x-auto max-w-[200px] scrollbar-none">
                    {COLORS.map(c => (
                      <button 
                        key={c}
                        onClick={() => setEditingNote({ ...editingNote, color: c })}
                        className={`w-5 h-5 shrink-0 rounded-full border transition-transform hover:scale-125 ${editingNote.color === c ? "border-white scale-110" : "border-transparent"}`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <span className="text-[12px] text-[var(--text-tertiary)] font-medium flex items-center gap-1.5">
                    <Calendar size={12} /> Modifié le {new Date(editingNote.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-4">
                   <button 
                    onClick={() => {
                      convertNoteToTask(editingNote.id);
                      setEditingNote(null);
                    }}
                    className="p-3 rounded-2xl bg-[rgba(255,255,255,0.05)] text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                    title="Convertir en tâche"
                  >
                    <ListChecks size={20} />
                  </button>
                  <button 
                    onClick={() => {
                      updateNote(editingNote.id, editingNote);
                      setEditingNote(null);
                    }}
                    className="px-6 py-3 rounded-2xl bg-white text-black text-[14px] font-bold hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    Terminé
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function NoteCard({ note, onEdit, onContextMenu }: { note: any, onEdit: () => void, onContextMenu: (e: React.MouseEvent) => void }) {
  const { togglePinNote, deleteNote, convertNoteToTask, toggleArchiveNote } = useAppStore();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, boxShadow: "0 12px 30px -10px rgba(0,0,0,0.3)" }}
      onContextMenu={onContextMenu}
      onClick={onEdit}
      className="break-inside-avoid rounded-[22px] border border-[var(--border-primary)] bg-[var(--card-bg)] p-6 transition-all group relative cursor-pointer overflow-hidden"
      style={{ background: note.color }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {note.pinned && (
        <div className="absolute top-4 right-4 text-[var(--accent-blue)]">
          <Pin size={14} fill="currentColor" />
        </div>
      )}

      {note.title && (
        <h3 className="text-[16px] font-bold text-[var(--text-primary)] mb-3 pr-6 leading-tight group-hover:text-white transition-colors">
          {note.title}
        </h3>
      )}
      
      <div className="text-[14px] text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed line-clamp-[12] group-hover:text-[rgba(255,255,255,0.85)] transition-colors">
        {note.content}
      </div>

      <div className="mt-5 pt-5 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); convertNoteToTask(note.id); }}
            className="p-2 rounded-xl hover:bg-white/10 text-[var(--text-tertiary)] hover:text-white transition-all"
            title="Convertir en tâche"
          >
            <ListChecks size={15} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); toggleArchiveNote(note.id); }}
            className="p-2 rounded-xl hover:bg-white/10 text-[var(--text-tertiary)] hover:text-white transition-all"
            title={note.archived ? "Désarchiver" : "Archiver"}
          >
            {note.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
          </button>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={(e) => { e.stopPropagation(); togglePinNote(note.id); }}
            className="p-2 rounded-xl hover:bg-white/10 text-[var(--text-tertiary)] hover:text-white transition-all"
          >
            <Pin size={15} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
            className="p-2 rounded-xl hover:bg-white/10 text-[var(--text-tertiary)] hover:text-red-400 transition-all"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
