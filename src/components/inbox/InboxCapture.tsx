"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Inbox, Plus, Mic, MicOff, ArrowRight, Trash2, Check,
  ListTodo, StickyNote, Calendar, X, Phone, Clock
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useCrmStore } from "@/store/useCrmStore";
import type { InboxItemType } from "@/store/useAppStore";

const TYPE_CONFIG: { id: InboxItemType; label: string; icon: typeof ListTodo; color: string }[] = [
  { id: "task", label: "Tâche", icon: ListTodo, color: "var(--accent-green)" },
  { id: "note", label: "Note", icon: StickyNote, color: "var(--accent-blue)" },
  { id: "event", label: "Événement", icon: Calendar, color: "var(--accent-purple)" },
];

export default function InboxCapture() {
  const { inboxItems, addInboxItem, convertInboxToTask, processInboxItem, deleteInboxItem, projects } = useAppStore();
  const [input, setInput] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedType, setSelectedType] = useState<InboxItemType>("task");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const pendingItems = inboxItems.filter((i) => !i.processed);
  const processedItems = inboxItems.filter((i) => i.processed);

  // CRM Rappels du jour
  const { prospects, calls, loaded, loadAll } = useCrmStore();
  
  useEffect(() => {
    if (!loaded) loadAll();
  }, [loaded, loadAll]);

  // CRM Rappels du jour
  const rappelsDuJour = useMemo(() => {
    const actifs = prospects.filter((p) => !p.archived);
    const todayStr = new Date().toISOString().slice(0, 10);
    const now = Date.now();
    const H24 = 24 * 60 * 60 * 1000;
    const lastCallTs = new Map<string, number>();
    for (const c of calls) {
      const ts = new Date(c.date).getTime();
      const prev = lastCallTs.get(c.prospect_id) ?? 0;
      if (ts > prev) lastCallTs.set(c.prospect_id, ts);
    }
    return actifs.filter((p) => {
      if (p.statut !== "REPONDEUR") return false;
      if (p.date_relance) return p.date_relance <= todayStr;
      return now - (lastCallTs.get(p.id) ?? 0) > H24;
    });
  }, [prospects, calls]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    addInboxItem(input.trim(), selectedType);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleVoice = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((result: any) => result[0].transcript)
        .join("");
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-8 pt-8 pb-5 border-b" style={{ borderColor: "var(--border-primary)" }}>
        <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight leading-none">
          Inbox
        </h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-2">
          <span className="font-medium">{pendingItems.length}</span> en attente
          {processedItems.length > 0 && (
            <>
              <span className="mx-2 text-[var(--text-ghost)]">·</span>
              <span className="font-medium">{processedItems.length}</span> traités
            </>
          )}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6 flex flex-col max-w-4xl mx-auto w-full gap-6">

        {/* Quick Capture Input */}
        <div className="rounded-xl p-5 flex flex-col gap-4 bg-[var(--card-bg)] border border-[var(--border-primary)]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {TYPE_CONFIG.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className="text-[12px] px-2.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1"
                  style={{
                    background: selectedType === t.id ? "var(--accent-blue-light)" : "transparent",
                    color: selectedType === t.id ? "var(--accent-blue)" : "var(--text-secondary)",
                    border: `1px solid ${selectedType === t.id ? "var(--accent-blue)" : "var(--border-primary)"}`,
                  }}
                >
                  <t.icon size={11} /> {t.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-[16px] bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={toggleVoice}
              className="h-8 w-8 rounded-lg transition-colors flex items-center justify-center"
              style={{
                background: isRecording ? "var(--accent-red-light)" : "transparent",
                color: isRecording ? "var(--accent-red)" : "var(--text-tertiary)",
                border: `1px solid ${isRecording ? "var(--accent-red)" : "var(--border-primary)"}`,
              }}
              title="Entrée vocale"
            >
              {isRecording ? <MicOff size={13} /> : <Mic size={13} />}
            </button>
            <button
              type="submit"
              disabled={!input.trim()}
              className="h-8 w-8 rounded-lg transition-colors flex items-center justify-center"
              style={{
                background: "var(--accent-blue-light)",
                color: "var(--accent-blue)",
                border: "1px solid color-mix(in srgb, var(--accent-blue) 25%, transparent)",
                opacity: !input.trim() ? 0.5 : 1,
                cursor: !input.trim() ? "not-allowed" : "pointer",
              }}
            >
              <Plus size={13} />
            </button>
          </form>

          {isRecording && (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{ background: "var(--accent-red)" }}
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-[11px] font-medium" style={{ color: "var(--accent-red)" }}>
                Écoute en cours… Parle maintenant
              </span>
            </motion.div>
          )}
        </div>

        {/* CRM Rappels du jour */}
        {rappelsDuJour.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-semibold flex items-center gap-1" style={{ color: "var(--accent-orange)" }}>
              <Clock size={14} />
              Rappels CRM du jour · {rappelsDuJour.length}
            </p>
            <div className="flex flex-col gap-2">
              {rappelsDuJour.map((p) => (
                <Link
                  key={p.id}
                  href={`/prospects/${p.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-lg group transition-colors"
                  style={{
                    background: "color-mix(in srgb, var(--accent-orange) 5%, var(--card-bg))",
                    border: "1px solid color-mix(in srgb, var(--accent-orange) 15%, transparent)"
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: "color-mix(in srgb, var(--accent-orange) 15%, transparent)" }}
                  >
                    <Phone size={12} style={{ color: "var(--accent-orange)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{p.entreprise}</p>
                    <p className="text-[11px] text-[var(--accent-orange)] mt-0.5 opacity-80">
                      {p.date_relance ? `Rappel prévu le ${new Date(p.date_relance + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}` : "Dernier appel > 24h"}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-[var(--accent-orange)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Pending Items */}
        {pendingItems.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-semibold text-[var(--text-secondary)]">
              En attente · {pendingItems.length}
            </p>
            <AnimatePresence mode="popLayout">
              {pendingItems.map((item) => {
                const cfg = TYPE_CONFIG.find((t) => t.id === item.type);
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-lg group bg-[var(--card-bg)] border border-[var(--border-primary)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: `${cfg?.color}20` }}
                    >
                      {cfg && <cfg.icon size={12} style={{ color: cfg.color }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{item.text}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                        {new Date(item.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        <span className="mx-1.5">·</span>
                        {cfg?.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.type === "task" && (
                        <div className="flex items-center gap-1">
                          <select 
                            className="h-7 bg-[var(--surface-1)] border border-[var(--border-primary)] text-[10px] rounded-md px-1 focus:outline-none"
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                          >
                            <option value="">Projet (aucun)</option>
                            {projects.map(p => (
                              <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              convertInboxToTask(item.id, selectedProjectId || undefined);
                              setSelectedProjectId("");
                            }}
                            className="h-7 px-2 rounded-md text-[10px] font-medium flex items-center gap-1 transition-colors"
                            style={{ background: "var(--accent-green-light)", color: "var(--accent-green)" }}
                            title="Convertir en tâche"
                          >
                            <ArrowRight size={10} /> Tâche
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => processInboxItem(item.id)}
                        className="h-7 w-7 rounded-md transition-colors flex items-center justify-center"
                        style={{
                          background: "transparent",
                          color: "var(--text-tertiary)",
                          border: "1px solid var(--border-primary)",
                        }}
                        title="Marquer comme traité"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => deleteInboxItem(item.id)}
                        className="h-7 w-7 rounded-md transition-colors flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--accent-red)]"
                        title="Supprimer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Processed Items */}
        {processedItems.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-semibold text-[var(--text-secondary)]">
              Traités · {processedItems.length}
            </p>
            {processedItems.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 rounded-lg group bg-[var(--surface-1)] border border-[var(--border-primary)]"
              >
                <Check size={12} style={{ color: "var(--accent-green)" }} className="shrink-0" />
                <p className="text-[13px] text-[var(--text-secondary)] truncate flex-1">{item.text}</p>
                <button
                  onClick={() => deleteInboxItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-[var(--text-tertiary)] hover:text-[var(--accent-red)] transition-all"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        {inboxItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "var(--surface-1)" }}>
              <Inbox size={20} className="text-[var(--text-secondary)]" />
            </div>
            <div className="text-center">
              <p className="text-[14px] font-medium text-[var(--text-secondary)]">Inbox vide</p>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-1">Capture tes idées. Trie-les plus tard.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}