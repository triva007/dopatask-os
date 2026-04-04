"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox, Plus, Mic, MicOff, ArrowRight, Trash2, Check,
  ListTodo, StickyNote, Calendar, X,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { InboxItemType } from "@/store/useAppStore";

const TYPE_CONFIG: { id: InboxItemType; label: string; icon: typeof ListTodo; color: string }[] = [
  { id: "task", label: "Tâche", icon: ListTodo, color: "var(--accent-green)" },
  { id: "note", label: "Note", icon: StickyNote, color: "var(--accent-blue)" },
  { id: "event", label: "Event", icon: Calendar, color: "var(--accent-purple)" },
];

export default function InboxCapture() {
  const { inboxItems, addInboxItem, convertInboxToTask, processInboxItem, deleteInboxItem } = useAppStore();
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedType, setSelectedType] = useState<InboxItemType>("task");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const pendingItems = inboxItems.filter((i) => !i.processed);
  const processedItems = inboxItems.filter((i) => i.processed);

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
      <div className="shrink-0 px-10 pt-10 pb-6 border-b border-b-primary">
        <h1 className="text-2xl font-semibold text-t-primary tracking-tight flex items-center gap-2.5">
          <Inbox size={18} className="text-t-secondary" /> Inbox
        </h1>
        <div className="flex items-center gap-4 mt-1">
          <p className="text-xs text-t-secondary">
            <span className="font-medium text-t-primary">{pendingItems.length}</span> en attente
            {processedItems.length > 0 && (
              <>
                {" · "}
                <span className="font-medium text-t-primary">{processedItems.length}</span> traités
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-10 py-8 flex flex-col max-w-4xl mx-auto w-full gap-8">

        {/* Quick Capture Input */}
        <div className="rounded-[28px] p-6 flex flex-col gap-4 bg-surface border border-b-primary shadow-[0_12px_48px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {TYPE_CONFIG.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className="text-[10px] px-2 py-1 rounded-lg font-medium transition-all flex items-center gap-1"
                  style={{
                    background: selectedType === t.id ? "var(--accent-blue-light)" : "var(--surface)",
                    color: selectedType === t.id ? "var(--accent-blue)" : "var(--text-t-secondary)",
                    border: `1px solid ${selectedType === t.id ? "var(--accent-blue)" : "var(--border-b-primary)"}`,
                  }}
                >
                  <t.icon size={9} /> {t.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Capture une idée, une tâche, un rdv… (Entrée pour envoyer)"
              className="flex-1 text-[18px] bg-transparent text-t-primary placeholder:text-t-tertiary focus:outline-none"
            />
            <button
              type="button"
              onClick={toggleVoice}
              className="p-2 rounded-xl transition-all"
              style={{
                background: isRecording ? "var(--accent-red-light)" : "var(--surface)",
                border: `1px solid ${isRecording ? "var(--accent-red)" : "var(--border-b-primary)"}`,
                color: isRecording ? "var(--accent-red)" : "var(--text-t-secondary)",
              }}
              title="Entrée vocale"
            >
              {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 rounded-xl transition-all disabled:opacity-20"
              style={{ background: "var(--accent-blue-light)", border: "1px solid var(--accent-blue)", color: "var(--accent-blue)" }}
            >
              <Plus size={14} />
            </button>
          </form>

          {isRecording && (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-accent-red"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-[11px] text-accent-red font-medium">Écoute en cours… Parle maintenant</span>
            </motion.div>
          )}
        </div>

        {/* Pending Items */}
        {pendingItems.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-medium text-t-secondary uppercase tracking-widest px-1">
              En attente ({pendingItems.length})
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
                    whileHover={{ y: -1, scale: 1.005 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="flex items-center gap-4 px-5 py-4 rounded-2xl group bg-surface border border-b-primary shadow-sm hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all"
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${cfg?.color}10`, border: `1px solid ${cfg?.color}20` }}
                    >
                      {cfg && <cfg.icon size={11} style={{ color: cfg.color }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-t-primary truncate">{item.text}</p>
                      <p className="text-[10px] text-t-secondary mt-0.5">
                        {new Date(item.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        {" · "}{cfg?.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                      {item.type === "task" && (
                        <button
                          onClick={() => convertInboxToTask(item.id)}
                          className="p-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all"
                          style={{ background: "var(--accent-green-light)", color: "var(--accent-green)" }}
                          title="Convertir en tâche"
                        >
                          <ArrowRight size={10} /> Tâche
                        </button>
                      )}
                      <button
                        onClick={() => processInboxItem(item.id)}
                        className="p-1.5 rounded-lg transition-all bg-surface text-t-secondary border-b-primary"
                        title="Marquer comme traité"
                      >
                        <Check size={11} />
                      </button>
                      <button
                        onClick={() => deleteInboxItem(item.id)}
                        className="p-1.5 rounded-lg text-t-secondary hover:text-accent-red transition-all"
                        title="Supprimer"
                      >
                        <Trash2 size={11} />
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
            <p className="text-[10px] font-medium text-t-secondary uppercase tracking-widest px-1">
              Traités ({processedItems.length})
            </p>
            {processedItems.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 px-5 py-3 rounded-2xl group bg-empty-bg border border-b-primary shadow-sm"
              >
                <Check size={11} className="text-accent-green shrink-0" />
                <p className="text-[12px] text-t-secondary truncate flex-1">{item.text}</p>
                <button
                  onClick={() => deleteInboxItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-t-secondary hover:text-accent-red transition-all"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {inboxItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-empty-bg border border-b-primary shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]">
              <Inbox size={26} className="text-t-secondary" />
            </div>
            <div className="text-center">
              <p className="text-sm text-t-secondary">Inbox vide</p>
              <p className="text-xs text-t-tertiary mt-1">Capture tes idées en un clic. Trie-les plus tard.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
