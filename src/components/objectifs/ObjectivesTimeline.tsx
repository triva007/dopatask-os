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
      <div className="shrink-0 px-7 pt-6 pb-4 flex items-center justify-between border-b-primary">
        <div>
          <h1 className="text-2xl font-semibold text-t-primary tracking-tight flex items-center gap-2.5">
            <Target size={18} className="text-t-secondary" /> Objectifs
          </h1>
          <p className="text-xs text-t-secondary mt-1">{objectives.length} objectifs actifs</p>
        </div>
        <button onClick={() => setAdding(!adding)} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all bg-surface border-b-primary text-t-primary"
        ><Plus size={13} /> Nouveau</button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
        <AnimatePresence>
          {adding && (
            <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAdd} className="mb-5 p-6 rounded-3xl flex flex-col gap-3 bg-surface border-b-primary"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
            >
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Titre de l'objectif"
                className="text-sm bg-transparent text-t-primary placeholder:text-t-tertiary focus:outline-none border-b border-b-primary pb-2" autoFocus />
              <div className="flex gap-2">
                {HORIZONS.map((h) => (
                  <button key={h.key} type="button" onClick={() => setNewHorizon(h.key)} className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all"
                    style={{ background: newHorizon === h.key ? "var(--accent-blue-light)" : "var(--surface)", color: newHorizon === h.key ? "var(--accent-blue)" : "var(--text-primary)", border: `1px solid ${newHorizon === h.key ? "var(--accent-blue-light)" : "var(--border-b-primary)"}` }}
                  >{h.label}</button>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setAdding(false)} className="text-xs text-t-secondary hover:text-t-primary px-3 py-1.5">Annuler</button>
                <button type="submit" className="text-xs px-4 py-1.5 rounded-xl font-medium bg-accent-blue text-white">Créer</button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-6">
          {HORIZONS.map(({ key, label }) => {
            const objs = objectives.filter((o) => o.horizon === key);
            if (objs.length === 0) return null;
            return (
              <div key={key} className="flex flex-col gap-3">
                <p className="text-[10px] font-medium text-t-secondary uppercase tracking-widest px-1">{label}</p>
                {objs.map((obj) => {
                  const isExpanded = expandedId === obj.id;
                  return (
                    <motion.div key={obj.id} layout className="rounded-3xl overflow-hidden transition-all bg-surface border-b-primary"
                      style={{ boxShadow: isExpanded ? "0 4px 12px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.08)" }}
                    >
                      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : obj.id)}>
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: obj.color }} />
                        <span className="flex-1 text-sm text-t-primary min-w-0 truncate" style={{ fontWeight: 450 }}>{obj.title}</span>
                        <span className="text-[10px] font-mono text-t-secondary shrink-0">{obj.progress}%</span>
                        <div className="w-16 h-1.5 rounded-full overflow-hidden shrink-0 bg-b-primary">
                          <div className="h-full rounded-full transition-all" style={{ width: `${obj.progress}%`, background: obj.color }} />
                        </div>
                        {isExpanded ? <ChevronDown size={13} className="text-t-secondary" /> : <ChevronRight size={13} className="text-t-secondary" />}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-4 pb-3 pt-1 flex flex-col gap-2" style={{ borderTop: "1px solid var(--border-b-primary)" }}>
                              {obj.milestones.map((ms) => (
                                <div key={ms.id} className="flex items-center gap-2.5 group/ms py-0.5">
                                  <button onClick={() => toggleMilestone(obj.id, ms.id)} className="shrink-0 w-4 h-4 rounded-md border flex items-center justify-center transition-all"
                                    style={{ borderColor: ms.done ? `${obj.color}60` : "var(--border-b-hover)", background: ms.done ? `${obj.color}15` : "transparent" }}
                                  >{ms.done && <Check size={8} style={{ color: obj.color }} strokeWidth={3} />}</button>
                                  <span className="flex-1 text-[11px]" style={{ color: ms.done ? "var(--accent-green)" : "var(--text-secondary)", textDecoration: ms.done ? "line-through" : "none" }}>{ms.text}</span>
                                  <button onClick={() => deleteMilestone(obj.id, ms.id)} className="opacity-0 group-hover/ms:opacity-100 text-t-secondary hover:text-accent-red"><Trash2 size={9} /></button>
                                </div>
                              ))}

                              <div className="flex items-center gap-2 mt-1">
                                <input value={msInputs[obj.id] || ""} onChange={(e) => setMsInputs((p) => ({ ...p, [obj.id]: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddMs(obj.id); } }}
                                  placeholder="+ jalon" className="flex-1 text-[11px] bg-transparent border-b border-b-primary py-1 text-t-primary placeholder:text-t-tertiary focus:outline-none"
                                />
                              </div>

                              <button onClick={() => deleteObjective(obj.id)} className="flex items-center gap-1.5 text-[10px] text-t-secondary hover:text-accent-red transition-colors self-end mt-1">
                                <Trash2 size={9} /> Supprimer
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