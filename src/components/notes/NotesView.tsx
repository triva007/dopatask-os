"use client";

import { useAppStore } from "@/store/useAppStore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  StickyNote, RefreshCw, Search, Plus, 
  Trash2, ExternalLink, ListChecks 
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";

export default function NotesView() {
  const { googleNotes, syncGoogleNotes, addToast } = useAppStore();
  const [search, setSearch] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    handleSync();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    await syncGoogleNotes();
    setIsSyncing(false);
  };

  const filteredNotes = useMemo(() => {
    return googleNotes.filter(n => {
      const title = n.title?.toLowerCase() || "";
      const body = n.body?.text?.text?.toLowerCase() || "";
      const s = search.toLowerCase();
      return title.includes(s) || body.includes(s);
    });
  }, [googleNotes, search]);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="shrink-0 px-8 pt-8 pb-5 border-b border-[var(--border-primary)] flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight leading-none flex items-center gap-3">
            <StickyNote size={24} className="text-[var(--accent-blue)]" />
            Google Keep
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-2">
            Tes notes d'entreprise synchronisées en temps réel.
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
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border-primary)] text-[13px] font-medium hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Sync..." : "Actualiser"}
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      <div className="flex-1 overflow-y-auto p-8">
        {filteredNotes.length > 0 ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            <AnimatePresence>
              {filteredNotes.map((note, idx) => (
                <motion.div
                  key={note.name}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="break-inside-avoid rounded-xl border border-[var(--border-primary)] bg-[var(--card-bg)] p-5 hover:shadow-lg transition-all group relative"
                >
                  {note.title && (
                    <h3 className="text-[15px] font-bold text-[var(--text-primary)] mb-2">
                      {note.title}
                    </h3>
                  )}
                  <div className="text-[13px] text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                    {note.body?.text?.text}
                  </div>

                  {/* Actions on hover */}
                  <div className="mt-4 pt-4 border-t border-[var(--border-primary)] flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-2">
                      <button className="p-1.5 rounded-md hover:bg-[var(--surface-1)] text-[var(--text-tertiary)] hover:text-[var(--accent-blue)]" title="Ouvrir dans Keep">
                        <ExternalLink size={13} />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-[var(--surface-1)] text-[var(--text-tertiary)] hover:text-[var(--accent-green)]" title="Convertir en tâche">
                        <ListChecks size={13} />
                      </button>
                    </div>
                    <button className="p-1.5 rounded-md hover:bg-[var(--surface-1)] text-[var(--text-tertiary)] hover:text-[var(--accent-red)]">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface-1)] flex items-center justify-center mb-4">
              <StickyNote size={32} className="text-[var(--text-tertiary)]" />
            </div>
            <h3 className="text-[16px] font-semibold text-[var(--text-secondary)]">Aucune note trouvée</h3>
            <p className="text-[13px] text-[var(--text-tertiary)] mt-1">
              {search ? "Réessaie avec un autre mot-clé." : "Tes notes Google Keep apparaîtront ici."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
