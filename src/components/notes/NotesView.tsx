"use client";

import { useAppStore } from "@/store/useAppStore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  StickyNote, Search, Plus, 
  Trash2, Pin, PinOff, X, Palette,
  Archive, ArchiveRestore, MoreVertical, Edit3,
  Calendar, Check, CheckCircle2, Image as ImageIcon,
  Square, CheckSquare, List
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import ContextMenu from "@/components/ui/ContextMenu";

const COLORS = [
  "var(--card-bg)",
  "#442b2d", "#3e3328", "#273934", "#20393f", "#223348", "#38284a", "#452440",
  "#1e3a5f", "#1b4332", "#432818", "#3c0919"
];

export default function NotesView() {
  const { notes, addNote, updateNote, deleteNote, togglePinNote, toggleArchiveNote } = useAppStore();
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, noteId: string } | null>(null);
  const [editingNote, setEditingNote] = useState<any | null>(null);

  const handleAdd = () => {
    if (!newTitle.trim() && !newContent.trim() && newImages.length === 0) {
      setIsAdding(false);
      return;
    }
    addNote(newTitle, newContent, selectedColor, newImages);
    setNewTitle("");
    setNewContent("");
    setSelectedColor(COLORS[0]);
    setNewImages([]);
    setIsAdding(false);
  };

  const handlePaste = useCallback((e: React.ClipboardEvent, isNew: boolean) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            if (isNew) {
              setNewImages(prev => [...prev, base64]);
            } else if (editingNote) {
              setEditingNote((prev: any) => ({ ...prev, images: [...(prev.images || []), base64] }));
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }, [editingNote]);

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
            {showArchived ? "Notes archivées" : "Capture et organise tes idées."}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-[var(--accent-blue)]" size={14} />
            <input 
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[var(--surface-1)] border border-[var(--border-primary)] rounded-xl text-[13px] w-64 focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)]"
            />
          </div>
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 text-[13px] font-medium
              ${showArchived ? "bg-[var(--accent-blue)] text-white border-transparent" : "bg-[var(--surface-1)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:bg-[var(--surface-2)]"}
            `}
          >
            <Archive size={16} />
            {showArchived ? "Notes" : "Archives"}
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
                <span>Créer une note (Colle une image ici)...</span>
                <Plus size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ) : (
              <motion.div 
                layoutId="add-note-box"
                onPaste={(e) => handlePaste(e, true)}
                className="w-full max-w-xl rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-2xl overflow-hidden z-20"
                style={{ background: selectedColor }}
              >
                {newImages.length > 0 && (
                  <div className="flex gap-2 p-4 overflow-x-auto bg-black/10">
                    {newImages.map((img, i) => (
                      <div key={i} className="relative shrink-0 group">
                        <img src={img} className="h-32 rounded-lg border border-white/10" />
                        <button 
                          onClick={() => setNewImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="p-5 space-y-4">
                  <input 
                    placeholder="Titre"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-transparent text-[18px] font-bold text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-tertiary)]"
                    autoFocus
                  />
                  <textarea 
                    placeholder="Écris quelque chose... (Utilise - pour les listes, [ ] pour les cases)"
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

        {/* Note Sections (Pinned/Other) */}
        {pinnedNotes.length > 0 && (
          <div className="space-y-5">
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--text-tertiary)] flex items-center gap-2.5 px-2">
              <Pin size={12} className="text-[var(--accent-blue)]" /> Notes épinglées
            </h2>
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
              {pinnedNotes.map((note) => (
                <NoteCard key={note.id} note={note} onEdit={() => setEditingNote(note)} onContextMenu={(e) => handleContextMenu(e, note.id)} />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-5">
          {pinnedNotes.length > 0 && (
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--text-tertiary)] px-2">
              Autres notes
            </h2>
          )}
          {otherNotes.length > 0 ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
              {otherNotes.map((note) => (
                <NoteCard key={note.id} note={note} onEdit={() => setEditingNote(note)} onContextMenu={(e) => handleContextMenu(e, note.id)} />
              ))}
            </div>
          ) : (
            !pinnedNotes.length && !isAdding && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-[28px] bg-[var(--surface-1)] border border-[var(--border-primary)] flex items-center justify-center mb-6">
                  <StickyNote size={32} className="text-[var(--text-tertiary)] opacity-50" />
                </div>
                <h3 className="text-[18px] font-semibold text-[var(--text-secondary)]">Notes vides</h3>
                <p className="text-[13px] text-[var(--text-tertiary)] mt-2">Colle une image ou écris une liste.</p>
              </div>
            )
          )}
        </div>

      </div>

      {/* Context Menu */}
      {contextMenu && selectedNote && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            { label: selectedNote.pinned ? "Désépingler" : "Épingler", icon: <Pin size={14} />, onClick: () => togglePinNote(selectedNote.id) },
            { label: selectedNote.archived ? "Désarchiver" : "Archiver", icon: <Archive size={14} />, onClick: () => toggleArchiveNote(selectedNote.id) },
            { label: "Supprimer", icon: <Trash2 size={14} />, variant: "danger", onClick: () => deleteNote(selectedNote.id) },
          ]}
        />
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {editingNote && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
            onClick={() => { updateNote(editingNote.id, editingNote); setEditingNote(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              onPaste={(e) => handlePaste(e, false)}
              className="w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-primary)] flex flex-col max-h-[90vh]"
              style={{ background: editingNote.color }}
            >
              {/* Image Header in Modal */}
              {editingNote.images?.length > 0 && (
                <div className="flex gap-4 p-6 overflow-x-auto bg-black/10 border-b border-white/5">
                  {editingNote.images.map((img: string, i: number) => (
                    <div key={i} className="relative shrink-0 group">
                      <img src={img} className="h-48 rounded-xl border border-white/10" />
                      <button 
                        onClick={() => setEditingNote((prev: any) => ({ ...prev, images: prev.images.filter((_: any, idx: number) => idx !== i) }))}
                        className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                <input 
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  className="w-full bg-transparent text-[24px] font-bold text-[var(--text-primary)] focus:outline-none"
                  placeholder="Titre"
                />
                <textarea 
                  value={editingNote.content}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                  className="w-full bg-transparent text-[16px] text-[var(--text-secondary)] focus:outline-none min-h-[300px] resize-none leading-relaxed"
                  placeholder="Contenu... (- pour bullets, [ ] pour cases)"
                />
              </div>

              <div className="px-8 py-5 flex items-center justify-between border-t border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.15)]">
                <div className="flex items-center gap-6">
                   <div className="flex gap-1.5 overflow-x-auto max-w-[200px] scrollbar-none">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setEditingNote({ ...editingNote, color: c })}
                        className={`w-5 h-5 shrink-0 rounded-full border transition-transform hover:scale-125 ${editingNote.color === c ? "border-white scale-110" : "border-transparent"}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <button onClick={() => { updateNote(editingNote.id, editingNote); setEditingNote(null); }}
                  className="px-8 py-3 rounded-2xl bg-white text-black text-[14px] font-bold hover:bg-gray-100 transition-colors shadow-lg">
                  Terminé
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NoteCard({ note, onEdit, onContextMenu }: { note: any, onEdit: () => void, onContextMenu: (e: React.MouseEvent) => void }) {
  const { updateNote } = useAppStore();

  const toggleCheckbox = (lineIndex: number) => {
    const lines = note.content.split("\n");
    const line = lines[lineIndex];
    if (line.startsWith("[ ] ")) {
      lines[lineIndex] = line.replace("[ ] ", "[x] ");
    } else if (line.startsWith("[x] ")) {
      lines[lineIndex] = line.replace("[x] ", "[ ] ");
    }
    updateNote(note.id, { content: lines.join("\n") });
  };

  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("[ ] ") || line.startsWith("[x] ")) {
        const checked = line.startsWith("[x] ");
        return (
          <div key={i} className="flex items-start gap-2 py-0.5 group/line" onClick={(e) => { e.stopPropagation(); toggleCheckbox(i); }}>
            {checked ? <CheckSquare size={14} className="mt-1 text-[var(--accent-blue)]" /> : <Square size={14} className="mt-1 text-[var(--text-tertiary)]" />}
            <span className={checked ? "line-through opacity-50" : ""}>{line.slice(4)}</span>
          </div>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <div key={i} className="flex items-start gap-2 py-0.5">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] shrink-0" />
            <span>{line.slice(2)}</span>
          </div>
        );
      }
      return <div key={i} className="min-h-[1.2em]">{line}</div>;
    });
  };

  return (
    <motion.div
      layout whileHover={{ y: -4 }} onContextMenu={onContextMenu} onClick={onEdit}
      className="break-inside-avoid rounded-[22px] border border-[var(--border-primary)] bg-[var(--card-bg)] p-6 transition-all group relative cursor-pointer overflow-hidden"
      style={{ background: note.color }}
    >
      {note.images?.length > 0 && (
        <div className="mb-4 -mx-6 -mt-6">
          <img src={note.images[0]} className="w-full h-auto max-h-64 object-cover" />
          {note.images.length > 1 && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-[10px] text-white backdrop-blur-sm">
              +{note.images.length - 1} images
            </div>
          )}
        </div>
      )}

      {note.pinned && <div className="absolute top-4 right-4 text-[var(--accent-blue)]"><Pin size={14} fill="currentColor" /></div>}
      {note.title && <h3 className="text-[16px] font-bold text-[var(--text-primary)] mb-3 pr-6 leading-tight">{note.title}</h3>}
      <div className="text-[14px] text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed line-clamp-[12]">
        {renderContent(note.content)}
      </div>
    </motion.div>
  );
}
