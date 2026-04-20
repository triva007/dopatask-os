"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, ChevronDown, ChevronRight, Trash2, Target } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { ObjectiveHorizon } from "@/store/useAppStore";

const HORIZONS: { key: ObjectiveHorizon; label: string }[] = [
  { key: "week",    label: "Semaine" },
  { key: "month",   label: "Mois" },
  { key: "quarter", label: "Trimestre" },
  { key: "year",    label: "Année" },
];

export default function ObjectivesTimeline() {
  const { objectives, addObjective, toggleMilestone, addMilestone, deleteMilestone, deleteObjective } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newHorizon, setNewHorizon] = useState<ObjectiveHorizon>("month");
  const [msInputs, setMsInputs] = useState<Record<string, string>>({});

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addObjective(newTitle.trim(), newHorizon);
    setNewTitle("");
    setAdding(false);
  };

  const handleAddMs = (objId: string) => {
    const text = msInputs[objId]?.trim();
    if (!text) return;
    addMilestone(objId, text);
    setMsInputs((prev) => ({ ...prev, [objId]: "" }));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-8 pt-8 pb-5 border-b" style={{ borderColor: "var(--border-primary)" }}>
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-[28px] font-semibold text-[var(--text-primary)] tracking-tight leading-none">
              Objectifs
            </h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-2">
              <span className="font-medium">{objectives.length}</span> actifs · Horizons de temps
            </p>
          </div>
          <button
            onClick={() => setAdding(!adding)}
            className="h-9 px-3.5 rounded-xl text-[12.5px] font-medium border transition-colors shrink-0"
            style={{
              background: "var(--accent-blue-light)",
              color: "var(--accent-blue)",
              borderColor: "color-mix(in srgb, var(--accent-blue) 25%, transparent)",
            }}
          >
            <Plus size={13} className="inline mr-1" /> Nouveau
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6">
        <AnimatePresence>
          {adding && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              onSubmit={handleAdd}
              className="mb-5 p-4 rounded-lg flex flex-col gap-3 bg-[var(--card-bg)] border border-[var(--border-primary)]"
            >
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Titre de l'objectif"
                className="text-[13px] bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
                autoFocus
              />
              <div className="flex gap-2">
                {HORIZONS.map((h) => (
                  <button
                    key={h.key}
                    type="button"
                    onClick={() => setNewHorizon(h.key)}
                    className="text-[11px] px-2.5 py-1.5 rounded-md font-medium transition-all border"
                    style={{
                      background: newHorizon === h.key ? "var(--accent-blue-light)" : "transparent",
                      color: newHorizon === h.key ? "var(--accent-blue)" : "var(--text-secondary)",
                      borderColor: newHorizon === h.key ? "var(--accent-blue)" : "var(--border-primary)",
                    }}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="h-8 px-3 text-[12px] font-medium rounded-md border text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-8 px-3 text-[12px] font-medium rounded-md"
                  style={{
                    background: "var(--accent-blue-light)",
                    color: "var(--accent-blue)",
                    border: "1px solid color-mix(in srgb, var(--accent-blue) 25%, transparent)",
                  }}
                >
                  Créer
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-6">
          {HORIZONS.map(({ key, label }) => {
            const objs = objectives.filter((o) => o.horizon === key);
            if (objs.length === 0) return null;
            return (
              <div key={key} className="flex flex-col gap-2">
                <p className="text-[12px] font-semibold text-[var(--text-secondary)]">{label}</p>
                {objs.map((obj) => {
                  const isExpanded = expandedId === obj.id;
                  return (
                    <motion.div
                      key={obj.id}
                      layout
                      className="rounded-lg overflow-hidden transition-colors bg-[var(--card-bg)] border border-[var(--border-primary)] hover:bg-[var(--surface-2)]"
                    >
                      <div
                        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : obj.id)}
                      >
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: obj.color }} />
                        <span className="flex-1 text-[13px] font-medium text-[var(--text-primary)] min-w-0 truncate">
                          {obj.title}
                        </span>
                        <span className="text-[11px] font-mono text-[var(--text-tertiary)] shrink-0">
                          {obj.progress}%
                        </span>
                        <div className="w-14 h-[3px] rounded-full overflow-hidden shrink-0" style={{ background: "var(--surface-3)" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${obj.progress}%`, background: obj.color }}
                          />
                        </div>
                        {isExpanded ? (
                          <ChevronDown size={13} className="text-[var(--text-secondary)]" />
                        ) : (
                          <ChevronRight size={13} className="text-[var(--text-tertiary)]" />
                        )}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3 pt-1 flex flex-col gap-2" style={{ borderTop: "1px solid var(--border-primary)" }}>
                              {obj.milestones.map((ms) => (
                                <div key={ms.id} className="flex items-center gap-2.5 group/ms py-0.5">
                                  <button
                                    onClick={() => toggleMilestone(obj.id, ms.id)}
                                    className="shrink-0 w-4 h-4 rounded-md border flex items-center justify-center transition-all"
                                    style={{
                                      borderColor: ms.done ? obj.color : "var(--border-secondary)",
                                      background: ms.done ? obj.color : "transparent",
                                    }}
                                  >
                                    {ms.done && <Check size={9} className="text-white" strokeWidth={3} />}
                                  </button>
                                  <span
                                    className="flex-1 text-[11px]"
                                    style={{
                                      color: ms.done ? "var(--accent-green)" : "var(--text-secondary)",
                                      textDecoration: ms.done ? "line-through" : "none",
                                    }}
                                  >
                                    {ms.text}
                                  </span>
                                  <button
                                    onClick={() => deleteMilestone(obj.id, ms.id)}
                                    className="opacity-0 group-hover/ms:opacity-100 text-[var(--text-tertiary)] hover:text-[var(--accent-red)] transition-opacity"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              ))}

                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  value={msInputs[obj.id] || ""}
                                  onChange={(e) => setMsInputs((p) => ({ ...p, [obj.id]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAddMs(obj.id);
                                    }
                                  }}
                                  placeholder="Ajouter un jalon"
                                  className="flex-1 text-[11px] bg-transparent border-b py-1 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
                                  style={{ borderColor: "var(--border-primary)" }}
                                />
                              </div>

                              <button
                                onClick={() => deleteObjective(obj.id)}
                                className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] hover:text-[var(--accent-red)] transition-colors self-end mt-1"
                              >
                                <Trash2 size={10} /> Supprimer
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}