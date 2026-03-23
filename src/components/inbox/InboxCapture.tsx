"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox, Plus, Mic, MicOff, ArrowRight, Trash2, Check,
  ListTodo, StickyNote, Calendar, X,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { InboxItemType } from "@/store/useAppStore";

const TYPE_CONFIG: { id: InboxItemType; label: string; icon: typeof ListTodo; dot: string }[] = [
  { id: "task", label: "Tâche", icon: ListTodo, dot: "#4ade80" },
  { id: "note", label: "Note", icon: StickyNote, dot: "#67e8f9" },
  { id: "event", label: "Event", icon: Calendar, dot: "#a78bfa" },
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
      <div className="shrink-0 px-7 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <h1 className="text-lg font-semibold text-zinc-100 tracking-tight flex items-center gap-2.5">
          <Inbox size={18} className="text-zinc-400" /> Inbox
        </h1>
        <p className="text-xs text-zinc-600 mt-1">
          Capture rapide · {pendingItems.length} en attente
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-5">

        {/* Quick Capture Input */}
        <div className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {TYPE_CONFIG.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className="text-[10px] px-2 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5"
                  style={{
                    background: selectedType === t.id ? "rgba(255,255,255,0.06)" : "transparent",
                    color: selectedType === t.id ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
                    border: `1px solid ${selectedType === t.id ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)"}`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: selectedType === t.id ? t.dot : "rgba(255,255,255,0.1)" }} />
                  {t.label}
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
              className="flex-1 text-sm bg-transparent text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={toggleVoice}
              className="p-2 rounded-xl transition-all"
              style={{
                background: isRecording ? "rgba(252,165,165,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${isRecording ? "rgba(252,165,165,0.3)" : "rgba(255,255,255,0.06)"}`,
                color: isRecording ? "#fca5a5" : "#71717a",
              }}
              title="Entrée vocale"
            >
              {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 rounded-xl transition-all disabled:opacity-20"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
            >
              <Plus size={14} />
            </button>
          </form>

          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[11px] text-red-300">Écoute en cours… Parle maintenant</span>
            </div>
          )}
        </div>

        {/* Pending Items */}
        {pendingItems.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest px-1">
              En attente ({pendingItems.length})
            </p>
            <AnimatePresence mode="popLayout">
              {pendingItems.map((item) => {
                const cfg = TYPE_CONFIG.find((t) => t.id === item.type);
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl group"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      {cfg && <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 truncate">{item.text}</p>
                      <p className="text-[10px] text-zinc-700 mt-0.5">
                        {new Date(item.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        {" · "}{cfg?.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                      {item.type === "task" && (
                        <button
                          onClick={() => convertInboxToTask(item.id)}
                          className="p-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all"
                          style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)" }}
                          title="Convertir en tâche"
                        >
                          <ArrowRight size={10} /> Tâche
                        </button>
                      )}
                      <button
                        onClick={() => processInboxItem(item.id)}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ background: "rgba(255,255,255,0.04)", color: "#71717a" }}
                        title="Marquer comme traité"
                      >
                        <Check size={11} />
                      </button>
                      <button
                        onClick={() => deleteInboxItem(item.id)}
                        className="p-1.5 rounded-lg text-zinc-700 hover:text-red-300 transition-all"
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
            <p className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest px-1">
              Traités ({processedItems.length})
            </p>
            {processedItems.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-2.5 rounded-2xl group"
                style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)" }}
              >
                <Check size={11} className="text-zinc-700 shrink-0" />
                <p className="text-[12px] text-zinc-600 truncate flex-1">{item.text}</p>
                <button
                  onClick={() => deleteInboxItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-300 transition-all"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {inboxItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Inbox size={22} className="text-zinc-600" />
            </div>
            <div className="text-center">
              <p className="text-sm text-zinc-400">Inbox vide</p>
              <p className="text-xs text-zinc-600 mt-1">Capture tes idées en un clic. Trie-les plus tard.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}