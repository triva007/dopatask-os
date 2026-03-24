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
      <div className="shrink-0 px-7 pt-6 pb-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight flex items-center gap-2.5">
            <Target size={20} className="text-zinc-400" /> Objectifs
          </h1>
          <p className="text-sm text-zinc-600 mt-1">{objectives.length} objectifs actifs</p>
        </div>
        <button onClick={() => setAdding(!adding)} className="flex items-center gap-1.5 text-xs px-4 py-2.5 rounded-xl font-medium transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#d4d4d8" }}
        ><Plus size={13} /> Nouveau</button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-7 py-6">
        <AnimatePresence>
          {adding && (
            <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAdd} className="mb-5 p-5 rounded-2xl flex flex-col gap-3"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Titre de l'objectif"
                className="text-sm bg-transparent text-zinc-200 placeholder:text-zinc-600 focus:outline-none border-b pb-2" style={{ borderColor: "rgba(255,255,255,0.06)" }} autoFocus />
              <div className="flex gap-2">
                {HORIZONS.map((h) => (
                  <button key={h.key} type="button" onClick={() => setNewHorizon(h.key)} className="text-[10px] px-3 py-1.5 rounded-lg font-medium transition-all"
                    style={{ background: newHorizon === h.key ? "rgba(255,255,255,0.08)" : "transparent", color: newHorizon === h.key ? "#e4e4e7" : "#52525b", border: `1px solid ${newHorizon === h.key ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}` }}
                  >{h.label}</button>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setAdding(false)} className="text-xs text-zinc-600 hover:text-zinc-400 px-3 py-1.5">Annuler</button>
                <button type="submit" className="text-xs px-4 py-1.5 rounded-xl font-medium" style={{ background: "rgba(255,255,255,0.08)", color: "#e4e4e7" }}>Créer</button>
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
                <p className="text-xs font-medium text-zinc-600 uppercase tracking-widest px-1">{label}</p>
                {objs.map((obj) => {
                  const isExpanded = expandedId === obj.id;
                  return (
                    <motion.div key={obj.id} layout className="rounded-2xl overflow-hidden transition-all border-collapse"
                      style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${isExpanded ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}` }}
                    >
                      <div className="flex items-center gap-3 px-5 py-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : obj.id)}>
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: obj.color }} />
                        <span className="flex-1 text-sm text-zinc-200 min-w-0 truncate" style={{ fontWeight: 450 }}>{obj.title}</span>
                        <span className="text-[10px] font-mono text-zinc-600 shrink-0">{obj.progress}%</span>
                        <div className="w-16 h-1.5 rounded-full overflow-hidden shrink-0" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${obj.progress}%`, background: obj.color }} />
                        </div>
                        {isExpanded ? <ChevronDown size={13} className="text-zinc-600" /> : <ChevronRight size={13} className="text-zinc-600" />}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-4 pb-3 pt-1 flex flex-col gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                              {obj.milestones.map((ms) => (
                                <div key={ms.id} className="flex items-center gap-2.5 group/ms py-0.5">
                                  <button onClick={() => toggleMilestone(obj.id, ms.id)} className="shrink-0 w-4 h-4 rounded-md border flex items-center justify-center transition-all"
                                    style={{ borderColor: ms.done ? `${obj.color}60` : "rgba(255,255,255,0.08)", background: ms.done ? `${obj.color}15` : "transparent" }}
                                  >{ms.done && <Check size={8} style={{ color: obj.color }} strokeWidth={3} />}</button>
                                  <span className="flex-1 text-xs" style={{ color: ms.done ? "#3f3f46" : "#a1a1aa", textDecoration: ms.done ? "line-through" : "none" }}>{ms.text}</span>
                                  <button onClick={() => deleteMilestone(obj.id, ms.id)} className="opacity-0 group-hover/ms:opacity-100 text-zinc-700 hover:text-zinc-400"><Trash2 size={9} /></button>
                                </div>
                              ))}

                              <div className="flex items-center gap-2 mt-1">
                                <input value={msInputs[obj.id] || ""} onChange={(e) => setMsInputs((p) => ({ ...p, [obj.id]: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddMs(obj.id); } }}
                                  placeholder="+ jalon" className="flex-1 text-xs bg-transparent border-b py-1 text-zinc-400 placeholder:text-zinc-700 focus:outline-none"
                                  style={{ borderColor: "rgba(255,255,255,0.04)" }} />
                              </div>

                              <button onClick={() => deleteObjective(obj.id)} className="flex items-center gap-1.5 text-[10px] text-zinc-700 hover:text-red-300 transition-colors self-end mt-1">
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