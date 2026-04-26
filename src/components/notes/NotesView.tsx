"use client";

import { useAppStore, Note } from "@/store/useAppStore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  StickyNote, Search, Plus, 
  Trash2, Pin, PinOff, X, Palette,
  Archive, ArchiveRestore, MoreVertical, Edit3,
  Calendar, Check, CheckCircle2, Image as ImageIcon,
  Square, CheckSquare, List, GripVertical
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import ContextMenu from "@/components/ui/ContextMenu";

// DND Kit Imports
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const COLORS = [
  "var(--card-bg)",
  "#442b2d", "#3e3328", "#273934", "#20393f", "#223348", "#38284a", "#452440",
  "#1e3a5f", "#1b4332", "#432818", "#3c0919"
];

export default function NotesView() {
  const { notes, addNote, updateNote, deleteNote, togglePinNote, toggleArchiveNote, reorderNotes } = useAppStore();
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, noteId: string } | null>(null);
  const [editingNote, setEditingNote] = useState<any | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAdd = () => {
    if (!newTitle.trim() && !newContent.trim() && newImages.length === 0) {
      setIsAdding(false);
      return;
    }
    addNote(newTitle, newContent, selectedColor, newImages);
    setNewTitle(""); setNewContent(""); setSelectedColor(COLORS[0]); setNewImages([]);
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
            if (isNew) setNewImages(prev => [...prev, base64]);
            else if (editingNote) setEditingNote((prev: any) => ({ ...prev, images: [...(prev.images || []), base64] }));
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }, [editingNote]);

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchesSearch = (n.title + n.content).toLowerCase().includes(search.toLowerCase());
      return matchesSearch && (showArchived ? n.archived : !n.archived);
    }).sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (a.order || 0) - (b.order || 0);
    });
  }, [notes, search, showArchived]);

  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const otherNotes = filteredNotes.filter(n => !n.pinned);

  const handleDragStart = (event: any) => setActiveId(event.active.id);
  const handleDragEnd = (event: DragEndEvent, list: Note[]) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      const oldIndex = list.findIndex(n => n.id === active.id);
      const newIndex = list.findIndex(n => n.id === over.id);
      const newList = arrayMove(list, oldIndex, newIndex);
      const isPinned = list[0]?.pinned;
      const otherHalf = notes.filter(n => n.pinned !== isPinned);
      const finalOrder = isPinned ? [...newList.map(n => n.id), ...otherHalf.map(n => n.id)] : [...otherHalf.map(n => n.id), ...newList.map(n => n.id)];
      reorderNotes(finalOrder);
    }
  };

  const activeNote = activeId ? notes.find(n => n.id === activeId) : null;

  return (
    <div className="flex flex-col h-full bg-[var(--surface-0)]">
      {/* Header — larger for PC */}
      <div className="shrink-0 px-12 pt-12 pb-8 border-b border-white/5 flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-bold text-white tracking-tight leading-none flex items-center gap-4">
            <StickyNote size={32} className="text-[var(--accent-blue)]" />
            {showArchived ? "Archives" : "Notes"}
          </h1>
          <p className="text-[14px] text-[var(--text-secondary)] mt-4 font-medium">
            Capture tes idées dans cet espace optimisé.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-[var(--accent-blue)]" size={18} />
            <input 
              type="text" placeholder="Rechercher une idée..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-6 py-3.5 bg-[var(--surface-1)] border border-white/5 rounded-2xl text-[14px] w-80 focus:outline-none focus:ring-1 focus:ring-[var(--accent-blue)] transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={`px-6 py-3.5 rounded-2xl border transition-all flex items-center gap-3 text-[14px] font-bold shadow-lg
              ${showArchived ? "bg-[var(--accent-blue)] text-white border-transparent" : "bg-[var(--surface-1)] text-white border-white/5 hover:bg-[var(--surface-2)]"}
            `}
          >
            <Archive size={18} />
            {showArchived ? "Retour aux Notes" : "Voir les Archives"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-12 flex flex-col gap-16">
        
        {/* Quick Add — wider for PC */}
        {!showArchived && (
          <div className="flex justify-center">
            {!isAdding ? (
              <motion.div layoutId="add-note-box" onClick={() => setIsAdding(true)}
                className="w-full max-w-2xl p-5 rounded-2xl bg-[var(--surface-1)] border border-white/5 shadow-xl cursor-text text-[var(--text-secondary)] text-[16px] font-medium flex items-center justify-between group hover:border-[var(--accent-blue)] transition-all"
              >
                <span>Prendre une note rapide...</span>
                <Plus size={20} className="opacity-40 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ) : (
              <motion.div layoutId="add-note-box" onPaste={(e) => handlePaste(e, true)}
                className="w-full max-w-3xl rounded-[32px] border border-white/10 bg-[var(--card-bg)] shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden z-20"
                style={{ background: selectedColor }}
              >
                {newImages.length > 0 && (
                  <div className="flex gap-4 p-6 overflow-x-auto bg-black/20">
                    {newImages.map((img, i) => (
                      <div key={i} className="relative shrink-0 group">
                        <img src={img} className="h-48 rounded-2xl border border-white/10 shadow-lg" />
                        <button onClick={() => setNewImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="p-10 space-y-6">
                  <input placeholder="Titre de la note" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-transparent text-[28px] font-bold text-white focus:outline-none placeholder:text-white/20" autoFocus />
                  <textarea placeholder="Le contenu de ton idée..." value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={6} className="w-full bg-transparent text-[18px] text-white/80 focus:outline-none resize-none placeholder:text-white/20 leading-relaxed" />
                </div>
                <div className="px-10 py-6 flex items-center justify-between border-t border-white/5 bg-black/20">
                  <div className="flex gap-2">{COLORS.map(c => <button key={c} onClick={() => setSelectedColor(c)} className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-125 ${selectedColor === c ? "border-white scale-110 shadow-lg" : "border-transparent"}`} style={{ background: c }} />)}</div>
                  <div className="flex gap-6">
                    <button onClick={() => setIsAdding(false)} className="px-6 py-3 text-[14px] font-bold text-white/60 hover:text-white transition-colors">Annuler</button>
                    <button onClick={handleAdd} className="px-10 py-3.5 rounded-2xl bg-white text-black text-[14px] font-bold hover:bg-gray-100 transition-all shadow-xl">Ajouter la note</button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Notes Grid — Optimized for 1080p width */}
        {pinnedNotes.length > 0 && (
          <div className="space-y-8">
            <h2 className="text-[12px] font-bold tracking-[0.3em] uppercase text-[var(--accent-blue)] flex items-center gap-3 px-4">
              <Pin size={14} fill="currentColor" /> Notes épinglées
            </h2>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={(e) => handleDragEnd(e, pinnedNotes)}>
              <SortableContext items={pinnedNotes.map(n => n.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                  {pinnedNotes.map((note) => (
                    <SortableNote key={note.id} note={note} onEdit={() => setEditingNote(note)} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, noteId: note.id }); }} />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {activeNote ? <NoteCard note={activeNote} isOverlay /> : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}

        <div className="space-y-8">
          {pinnedNotes.length > 0 && <h2 className="text-[12px] font-bold tracking-[0.3em] uppercase text-[var(--text-tertiary)] px-4">Autres notes</h2>}
          {otherNotes.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={(e) => handleDragEnd(e, otherNotes)}>
              <SortableContext items={otherNotes.map(n => n.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
                  {otherNotes.map((note) => (
                    <SortableNote key={note.id} note={note} onEdit={() => setEditingNote(note)} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, noteId: note.id }); }} />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {activeNote ? <NoteCard note={activeNote} isOverlay /> : null}
              </DragOverlay>
            </DndContext>
          ) : (
            !pinnedNotes.length && !isAdding && (
              <div className="flex flex-col items-center justify-center py-40 text-center opacity-20">
                <StickyNote size={80} className="mb-6" />
                <p className="text-[20px] font-medium">Capture ta première idée</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {editingNote && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-2xl" onClick={() => { updateNote(editingNote.id, editingNote); setEditingNote(null); }}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 40 }} onClick={(e) => e.stopPropagation()} onPaste={(e) => handlePaste(e, false)} className="w-full max-w-5xl rounded-[40px] overflow-hidden shadow-[0_64px_128px_rgba(0,0,0,0.8)] border border-white/10 flex flex-col max-h-[92vh]" style={{ background: editingNote.color }}>
              {editingNote.images?.length > 0 && (
                <div className="flex gap-6 p-8 overflow-x-auto bg-black/20 border-b border-white/5">
                  {editingNote.images.map((img: string, i: number) => (
                    <div key={i} className="relative shrink-0 group">
                      <img src={img} className="h-64 rounded-3xl border border-white/10 shadow-2xl" />
                      <button onClick={() => setEditingNote((prev: any) => ({ ...prev, images: prev.images.filter((_: any, idx: number) => idx !== i) }))} className="absolute top-4 right-4 p-3 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"><X size={20} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="p-12 space-y-8 flex-1 overflow-y-auto">
                <input value={editingNote.title} onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })} className="w-full bg-transparent text-[36px] font-bold text-white focus:outline-none" placeholder="Titre de la note" />
                <textarea value={editingNote.content} onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })} className="w-full bg-transparent text-[20px] text-white/80 focus:outline-none min-h-[400px] resize-none leading-relaxed" placeholder="Développe ton idée..." />
              </div>
              <div className="px-12 py-8 flex items-center justify-between border-t border-white/5 bg-black/30">
                <div className="flex gap-3">{COLORS.map(c => <button key={c} onClick={() => setEditingNote({ ...editingNote, color: c })} className={`w-8 h-8 rounded-full border-2 transition-all ${editingNote.color === c ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"}`} style={{ background: c }} />)}</div>
                <button onClick={() => { updateNote(editingNote.id, editingNote); setEditingNote(null); }} className="px-12 py-4 rounded-2xl bg-white text-black text-[16px] font-bold hover:scale-105 transition-all shadow-2xl">Sauvegarder</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)}
          items={[
            { label: notes.find(n => n.id === contextMenu.noteId)?.pinned ? "Désépingler" : "Épingler en haut", icon: <Pin size={16} />, onClick: () => togglePinNote(contextMenu.noteId) },
            { label: "Supprimer définitivement", icon: <Trash2 size={16} />, variant: "danger", onClick: () => deleteNote(contextMenu.noteId) },
          ]}
        />
      )}
    </div>
  );
}

function SortableNote({ note, onEdit, onContextMenu }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id });
  const style = { transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 50 : 1 };
  return (
    <div ref={setNodeRef} style={style} className={`${isDragging ? "opacity-20" : "opacity-100"}`}>
      <NoteCard note={note} onEdit={onEdit} onContextMenu={onContextMenu} dragListeners={listeners} dragAttributes={attributes} />
    </div>
  );
}

function NoteCard({ note, onEdit, onContextMenu, dragListeners, dragAttributes, isOverlay }: any) {
  const { updateNote } = useAppStore();
  const toggleCheckbox = (lineIndex: number) => {
    const lines = note.content.split("\n");
    const line = lines[lineIndex];
    if (line.startsWith("[ ] ")) lines[lineIndex] = line.replace("[ ] ", "[x] ");
    else if (line.startsWith("[x] ")) lines[lineIndex] = line.replace("[x] ", "[ ] ");
    updateNote(note.id, { content: lines.join("\n") });
  };

  return (
    <div 
      className={`rounded-[32px] border border-white/5 p-8 transition-all group relative cursor-pointer overflow-hidden h-fit shadow-2xl ${isOverlay ? "scale-105 rotate-2 z-50 ring-4 ring-[var(--accent-blue)]" : "hover:scale-[1.02] hover:border-white/10"}`}
      style={{ background: note.color }} onContextMenu={onContextMenu} onClick={onEdit}
    >
      <div {...dragListeners} {...dragAttributes} className="absolute top-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity text-white/40 cursor-grab active:cursor-grabbing p-2 bg-black/20 rounded-xl"><GripVertical size={20} /></div>
      {note.images?.length > 0 && <div className="mb-6 -mx-8 -mt-8"><img src={note.images[0]} className="w-full h-auto max-h-80 object-cover" /></div>}
      {note.title && <h3 className="text-[20px] font-bold text-white mb-4 pr-8 leading-tight tracking-tight">{note.title}</h3>}
      <div className="text-[16px] text-white/80 whitespace-pre-wrap leading-relaxed line-clamp-[12]">
        {note.content.split("\n").map((line: string, i: number) => {
          if (line.startsWith("[ ] ") || line.startsWith("[x] ")) {
            const checked = line.startsWith("[x] ");
            return (
              <div key={i} className="flex items-start gap-3 py-1" onClick={(e) => { e.stopPropagation(); toggleCheckbox(i); }}>
                {checked ? <CheckSquare size={18} className="mt-1 text-[var(--accent-blue)]" /> : <Square size={18} className="mt-1 text-white/20" />}
                <span className={checked ? "line-through opacity-40" : "font-medium"}>{line.slice(4)}</span>
              </div>
            );
          }
          if (line.startsWith("- ") || line.startsWith("* ")) return <div key={i} className="flex items-start gap-3 py-1"><span className="mt-2.5 w-2 h-2 rounded-full bg-white/20 shrink-0" /><span className="font-medium">{line.slice(2)}</span></div>;
          return <div key={i} className="min-h-[1.2em] font-medium">{line}</div>;
        })}
      </div>
    </div>
  );
}
