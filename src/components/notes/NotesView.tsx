"use client";

import { useAppStore, Note } from "@/store/useAppStore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  StickyNote, Search, Plus, 
  Trash2, Pin, PinOff, X, Palette,
  Archive, ArchiveRestore, MoreVertical, Edit3,
  Calendar, Check, CheckCircle2, Image as ImageIcon,
  Square, CheckSquare, List, GripVertical, Folder
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
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const COLORS = [
  "var(--card-bg)",
  "var(--surface-2)",
  "color-mix(in srgb, var(--accent-red) 12%, var(--card-bg))",
  "color-mix(in srgb, var(--accent-orange) 12%, var(--card-bg))",
  "color-mix(in srgb, var(--accent-green) 12%, var(--card-bg))",
  "color-mix(in srgb, var(--accent-cyan) 12%, var(--card-bg))",
  "color-mix(in srgb, var(--accent-blue) 12%, var(--card-bg))",
  "color-mix(in srgb, var(--accent-purple) 12%, var(--card-bg))",
];

const isDark = (color: string) => {
  if (!color) return false;
  if (color.startsWith('var')) return false;
  if (color.startsWith('color-mix')) return false;
  if (color.startsWith('#')) {
    const c = color.substring(1);
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 140; // Slightly higher threshold for better visibility
  }
  return false;
};

export default function NotesView() {
  const { notes, addNote, updateNote, deleteNote, togglePinNote, toggleArchiveNote, reorderNotes } = useAppStore();
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [newProjectId, setNewProjectId] = useState<string>("");
  const [showArchived, setShowArchived] = useState(false);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, noteId: string } | null>(null);
  const [editingNote, setEditingNote] = useState<any | null>(null);

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAdd = () => {
    if (!newTitle.trim() && !newContent.trim() && newImages.length === 0) {
      setIsAdding(false);
      return;
    }
    addNote(newTitle, newContent, selectedColor, newImages, newProjectId || undefined);
    setNewTitle(""); setNewContent(""); setSelectedColor(COLORS[0]); setNewImages([]); setNewProjectId("");
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

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent, list: Note[]) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = list.findIndex(n => n.id === active.id);
      const newIndex = list.findIndex(n => n.id === over.id);
      
      const newList = arrayMove(list, oldIndex, newIndex);
      
      // Merge with the other half of notes (pinned/other)
      const isPinned = list[0]?.pinned;
      const otherHalf = notes.filter(n => n.pinned !== isPinned);
      
      const finalOrder = isPinned 
        ? [...newList.map(n => n.id), ...otherHalf.map(n => n.id)]
        : [...otherHalf.map(n => n.id), ...newList.map(n => n.id)];
        
      reorderNotes(finalOrder);
    }
  };

  const activeNote = activeId ? notes.find(n => n.id === activeId) : null;

  return (
    <div className="flex flex-col h-full bg-[var(--surface-1)]">
      {/* Header */}
      <div className="shrink-0 px-8 pt-8 pb-5 border-b border-[var(--border-primary)] flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight leading-none flex items-center gap-3">
            <StickyNote size={24} className="text-[var(--accent-blue)]" />
            {showArchived ? "Archives" : "Notes"}
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-2">
            Organise tes idées avec un glisser-déposer fluide.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-[var(--accent-blue)]" size={14} />
            <input 
              type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)}
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
            {showArchived ? "Notes" : "Archives"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-12">
        
        {/* Quick Add */}
        {!showArchived && (
          <div className="flex justify-center">
            {!isAdding ? (
              <motion.div layoutId="add-note-box" onClick={() => setIsAdding(true)}
                className="w-full max-w-xl p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-primary)] shadow-sm cursor-text text-[var(--text-tertiary)] text-[14px] font-medium flex items-center justify-between group hover:border-[var(--accent-blue)] transition-colors"
              >
                <span>Créer une note...</span>
                <Plus size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ) : (
              <motion.div layoutId="add-note-box" onPaste={(e) => handlePaste(e, true)}
                className="w-full max-w-xl rounded-2xl border border-[var(--border-primary)] bg-[var(--card-bg)] shadow-2xl overflow-hidden z-20"
                style={{ background: selectedColor }}
              >
                {newImages.length > 0 && (
                  <div className="flex gap-2 p-4 overflow-x-auto bg-[var(--surface-2)]/70">
                    {newImages.map((img, i) => (
                      <div key={i} className="relative shrink-0 group">
                        <img src={img} className="h-32 rounded-lg border border-[var(--border-primary)]" />
                        <button onClick={() => setNewImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 bg-[var(--surface-3)]/90 rounded-full text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="p-5 space-y-4">
                  <input placeholder="Titre" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-transparent text-[18px] font-bold text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-tertiary)]" autoFocus />
                  <textarea placeholder="Écris quelque chose..." value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={4} className="w-full bg-transparent text-[14px] text-[var(--text-secondary)] focus:outline-none resize-none placeholder:text-[var(--text-tertiary)] leading-relaxed" />
                  <div className="flex items-center gap-2 mt-2">
                    <Folder size={14} className="text-[var(--text-tertiary)]" />
                    <select
                      value={newProjectId}
                      onChange={(e) => setNewProjectId(e.target.value)}
                      className="bg-[var(--surface-2)] text-[12px] text-[var(--text-secondary)] border-none rounded-lg px-2 py-1 focus:outline-none cursor-pointer hover:text-[var(--text-primary)] transition-colors max-w-[150px] truncate"
                    >
                      <option value="">Lier à un projet...</option>
                      {useAppStore.getState().projects.filter(p => p.status !== "archived").map(p => (
                        <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="px-5 py-3 flex items-center justify-between border-t border-[var(--border-primary)] bg-[var(--surface-1)]/80">
                  <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-[60%] scrollbar-none">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setSelectedColor(c)} className={`w-5 h-5 shrink-0 rounded-full border transition-transform hover:scale-125 ${selectedColor === c ? "border-[var(--text-primary)] scale-110" : "border-transparent"}`} style={{ background: c }} />
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-[12px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Annuler</button>
                    <button onClick={handleAdd} className="px-5 py-2 rounded-xl bg-[var(--text-primary)] text-[var(--background)] text-[12px] font-bold hover:opacity-90 transition-colors shadow-lg">Terminer</button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Pinned Section */}
        {pinnedNotes.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--text-tertiary)] flex items-center gap-2.5 px-2">
              <Pin size={12} className="text-[var(--accent-blue)]" /> Notes épinglées
            </h2>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={(e) => handleDragEnd(e, pinnedNotes)}>
              <SortableContext items={pinnedNotes.map(n => n.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {pinnedNotes.map((note) => (
                    <SortableNote key={note.id} note={note} onEdit={() => setEditingNote(note)} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, noteId: note.id }); }} />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
                {activeNote ? <NoteCard note={activeNote} isOverlay /> : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}

        {/* Other Section */}
        <div className="space-y-6">
          {pinnedNotes.length > 0 && (
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[var(--text-tertiary)] px-2">
              Autres notes
            </h2>
          )}
          {otherNotes.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={(e) => handleDragEnd(e, otherNotes)}>
              <SortableContext items={otherNotes.map(n => n.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {otherNotes.map((note) => (
                    <SortableNote key={note.id} note={note} onEdit={() => setEditingNote(note)} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, noteId: note.id }); }} />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
                {activeNote ? <NoteCard note={activeNote} isOverlay /> : null}
              </DragOverlay>
            </DndContext>
          ) : (
            !pinnedNotes.length && !isAdding && (
              <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
                <StickyNote size={48} className="mb-4" />
                <p>Aucune note ici. Commence à écrire !</p>
              </div>
            )
          )}
        </div>

      </div>

      {/* Editor Modal & Context Menu (Same as before but cleaned up) */}
      <AnimatePresence>
        {editingNote && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ background: "var(--backdrop-bg)", backdropFilter: "var(--backdrop-blur)" }} onClick={() => { updateNote(editingNote.id, editingNote); setEditingNote(null); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} onPaste={(e) => handlePaste(e, false)} className="w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-primary)] flex flex-col max-h-[90vh]" style={{ background: editingNote.color }}>
              {editingNote.images?.length > 0 && (
                <div className="flex gap-4 p-6 overflow-x-auto bg-[var(--surface-2)]/70 border-b border-[var(--border-primary)]">
                  {editingNote.images.map((img: string, i: number) => (
                    <div key={i} className="relative shrink-0 group">
                      <img src={img} className="h-48 rounded-xl border border-[var(--border-primary)]" />
                      <button onClick={() => setEditingNote((prev: any) => ({ ...prev, images: prev.images.filter((_: any, idx: number) => idx !== i) }))} className="absolute top-2 right-2 p-2 bg-[var(--surface-3)]/90 rounded-full text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity"><X size={16} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                <input value={editingNote.title} onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })} className="w-full bg-transparent text-[24px] font-bold text-[var(--text-primary)] focus:outline-none" placeholder="Titre" />
                <textarea value={editingNote.content} onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })} className="w-full bg-transparent text-[16px] text-[var(--text-secondary)] focus:outline-none min-h-[300px] resize-none leading-relaxed" placeholder="Contenu..." />
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border-primary)]/30">
                  <Folder size={16} className="text-[var(--text-tertiary)]" />
                  <select
                    value={editingNote.projectId || ""}
                    onChange={(e) => setEditingNote({ ...editingNote, projectId: e.target.value || undefined })}
                    className="bg-[var(--surface-2)] text-[13px] text-[var(--text-secondary)] border-none rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                  >
                    <option value="">Lier à un projet...</option>
                    {useAppStore.getState().projects.filter(p => p.status !== "archived" || p.id === editingNote.projectId).map(p => (
                      <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="px-8 py-5 flex items-center justify-between border-t border-[var(--border-primary)] bg-[var(--surface-1)]/80">
                <div className="flex gap-1.5">{COLORS.map(c => <button key={c} onClick={() => setEditingNote({ ...editingNote, color: c })} className={`w-5 h-5 rounded-full border ${editingNote.color === c ? "border-[var(--text-primary)]" : "border-transparent"}`} style={{ background: c }} />)}</div>
                <button onClick={() => { updateNote(editingNote.id, editingNote); setEditingNote(null); }} className="px-8 py-3 rounded-2xl bg-[var(--text-primary)] text-[var(--background)] font-bold">Terminé</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)}
          items={[
            { label: notes.find(n => n.id === contextMenu.noteId)?.pinned ? "Désépingler" : "Épingler", icon: <Pin size={14} />, onClick: () => togglePinNote(contextMenu.noteId) },
            { label: "Supprimer", icon: <Trash2 size={14} />, variant: "danger", onClick: () => deleteNote(contextMenu.noteId) },
          ]}
        />
      )}
    </div>
  );
}

function SortableNote({ note, onEdit, onContextMenu }: { note: Note, onEdit: () => void, onContextMenu: (e: any) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id });
  const style = { transform: CSS.Translate.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={`${isDragging ? "opacity-0" : "opacity-100"}`}>
      <NoteCard note={note} onEdit={onEdit} onContextMenu={onContextMenu} dragListeners={listeners} dragAttributes={attributes} />
    </div>
  );
}

function NoteCard({ note, onEdit, onContextMenu, dragListeners, dragAttributes, isOverlay }: { note: Note, onEdit?: () => void, onContextMenu?: (e: any) => void, dragListeners?: any, dragAttributes?: any, isOverlay?: boolean }) {
  const { updateNote } = useAppStore();
  const toggleCheckbox = (lineIndex: number) => {
    const lines = note.content.split("\n");
    const line = lines[lineIndex];
    if (line.startsWith("[ ] ")) lines[lineIndex] = line.replace("[ ] ", "[x] ");
    else if (line.startsWith("[x] ")) lines[lineIndex] = line.replace("[x] ", "[ ] ");
    updateNote(note.id, { content: lines.join("\n") });
  };

  const darkBg = isDark(note.color);
  const textColor = darkBg ? "#FFFFFF" : "var(--text-primary)";
  const textSecondary = darkBg ? "rgba(255,255,255,0.85)" : "var(--text-secondary)";
  const borderColor = darkBg ? "rgba(255,255,255,0.15)" : "var(--border-primary)";

  return (
    <div 
      className={`rounded-[22px] border p-6 transition-all group relative cursor-pointer overflow-hidden h-fit shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] ${isOverlay ? "scale-105 shadow-2xl rotate-2" : "hover:translate-y-[-4px]"}`}
      style={{ background: note.color, borderColor }}
      onContextMenu={onContextMenu}
      onClick={onEdit}
    >
      <div {...dragListeners} {...dragAttributes} className={`absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 ${darkBg ? "text-white/50" : "text-[var(--text-tertiary)]"}`}>
        <GripVertical size={16} />
      </div>

      {note.images?.length > 0 && (
        <div className="mb-4 -mx-6 -mt-6">
          <img src={note.images[0]} className="w-full h-auto max-h-64 object-cover" />
        </div>
      )}

      {note.title && <h3 className="text-[16px] font-bold mb-3 pr-6 leading-tight" style={{ color: textColor }}>{note.title}</h3>}
      {note.projectId && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border"
            style={{ 
              background: darkBg ? "rgba(255,255,255,0.1)" : "var(--surface-1)",
              color: textSecondary,
              borderColor: darkBg ? "rgba(255,255,255,0.1)" : "var(--border-primary)"
            }}>
            {useAppStore.getState().projects.find(p => p.id === note.projectId)?.emoji}
            {useAppStore.getState().projects.find(p => p.id === note.projectId)?.name}
          </span>
        </div>
      )}
      <div className="text-[14px] whitespace-pre-wrap leading-relaxed line-clamp-[12]" style={{ color: textSecondary }}>
        {note.content.split("\n").map((line: string, i: number) => {
          if (line.startsWith("[ ] ") || line.startsWith("[x] ")) {
            const checked = line.startsWith("[x] ");
            return (
              <div key={i} className="flex items-start gap-2 py-0.5" onClick={(e) => { e.stopPropagation(); toggleCheckbox(i); }}>
                {checked ? (
                  <CheckSquare size={14} className="mt-1" style={{ color: "var(--accent-blue)" }} />
                ) : (
                  <Square size={14} className="mt-1" style={{ color: darkBg ? "rgba(255,255,255,0.4)" : "var(--text-tertiary)" }} />
                )}
                <span className={checked ? "line-through opacity-50" : ""}>{line.slice(4)}</span>
              </div>
            );
          }
          if (line.startsWith("- ") || line.startsWith("* ")) {
            return <div key={i} className="flex items-start gap-2 py-0.5"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] shrink-0" /><span>{line.slice(2)}</span></div>;
          }
          return <div key={i} className="min-h-[1.2em]">{line}</div>;
        })}
      </div>
    </div>
  );
}
