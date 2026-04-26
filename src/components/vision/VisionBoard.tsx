"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, Check, Trash2, Eye, Image, Target, Rocket,
  Clock, Star, Heart,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import type { LifeGoalHorizon } from "@/store/useAppStore";

const HORIZONS: { id: LifeGoalHorizon; label: string; icon: typeof Clock; color: string; description: string }[] = [
  { id: "court_terme", label: "Court terme", icon: Clock, color: "var(--accent-green)", description: "3-6 mois" },
  { id: "moyen_terme", label: "Moyen terme", icon: Target, color: "var(--accent-blue)", description: "1-3 ans" },
  { id: "long_terme", label: "Long terme", icon: Rocket, color: "var(--accent-purple)", description: "5-10 ans" },
];

const CATEGORIES = [
  { id: "carriere", label: "Carrière", emoji: "💼" },
  { id: "sante", label: "Santé", emoji: "🏋️" },
  { id: "finance", label: "Finance", emoji: "💰" },
  { id: "relations", label: "Relations", emoji: "❤️" },
  { id: "education", label: "Éducation", emoji: "📚" },
  { id: "lifestyle", label: "Lifestyle", emoji: "✨" },
  { id: "voyage", label: "Voyage", emoji: "✈️" },
  { id: "creativite", label: "Créativité", emoji: "🎨" },
];

const INSPIRATIONAL_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1470770841497-7e2830aef084?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&h=600&fit=crop",
];

export default function VisionBoard() {
  const { lifeGoals, addLifeGoal, updateLifeGoal, deleteLifeGoal, toggleLifeGoalStep, addLifeGoalStep, deleteLifeGoalStep } = useAppStore();
  const [adding, setAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeHorizon, setActiveHorizon] = useState<LifeGoalHorizon | "all">("all");

  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formHorizon, setFormHorizon] = useState<LifeGoalHorizon>("court_terme");
  const [formCategory, setFormCategory] = useState("carriere");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [stepInput, setStepInput] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    addLifeGoal({ title: formTitle.trim(), description: formDesc.trim(), horizon: formHorizon, category: formCategory, imageUrl: formImageUrl || undefined, actionSteps: [], color: HORIZONS.find(h => h.id === formHorizon)?.color || "var(--accent-green)" });
    setFormTitle(""); setFormDesc(""); setFormImageUrl(""); setAdding(false);
  };

  const handleAddStep = (goalId: string) => {
    if (!stepInput.trim()) return;
    addLifeGoalStep(goalId, stepInput.trim());
    setStepInput("");
  };

  const filteredGoals = activeHorizon === "all" ? lifeGoals : lifeGoals.filter((g) => g.horizon === activeHorizon);
  const groupedGoals = HORIZONS.map(h => ({ ...h, goals: filteredGoals.filter(g => g.horizon === h.id) })).filter(g => activeHorizon === "all" ? g.goals.length > 0 : true);

  return (
    <div className="flex flex-col h-full bg-[var(--surface-0)] overflow-hidden">
      {/* Header — Massive for 1080p */}
      <div className="shrink-0 px-12 pt-12 pb-8 flex items-center justify-between border-b border-white/5">
        <div>
          <h1 className="text-[36px] font-bold text-white tracking-tight flex items-center gap-4">
            <Eye size={32} className="text-[var(--accent-purple)]" /> Vision Board
          </h1>
          <p className="text-[14px] text-[var(--text-secondary)] mt-4 font-medium tracking-wide">
            Visualise ton futur à long terme et définis tes aspirations profondes.
          </p>
        </div>
        <button 
          onClick={() => setAdding(!adding)} 
          className="flex items-center gap-3 text-[14px] px-6 py-3.5 rounded-2xl font-bold bg-white text-black hover:scale-105 transition-all shadow-xl"
        >
          <Plus size={18} /> Nouvel Objectif de Vie
        </button>
      </div>

      {/* Horizon Filter — Premium Spacing */}
      <div className="shrink-0 px-12 py-4 flex gap-4 border-b border-white/5 bg-black/10">
        <button onClick={() => setActiveHorizon("all")} className={`text-[12px] px-6 py-2.5 rounded-xl font-bold transition-all border ${activeHorizon === "all" ? "bg-[var(--accent-blue)] text-white border-transparent" : "bg-[var(--surface-1)] text-[var(--text-secondary)] border-white/5 hover:border-white/10"}`}>Tout</button>
        {HORIZONS.map((h) => (
          <button key={h.id} onClick={() => setActiveHorizon(h.id)} className={`text-[12px] px-6 py-2.5 rounded-xl font-bold transition-all border ${activeHorizon === h.id ? "border-transparent text-white" : "bg-[var(--surface-1)] text-[var(--text-secondary)] border-white/5 hover:border-white/10"}`} style={{ background: activeHorizon === h.id ? h.color : "var(--surface-1)" }}>{h.label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-12 py-12 flex flex-col gap-12">
        {/* Form — Larger and more detailed */}
        <AnimatePresence>
          {adding && (
            <motion.form initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} onSubmit={handleAdd} className="rounded-[32px] p-10 flex flex-col gap-8 bg-[var(--surface-1)] border border-white/10 shadow-2xl max-w-4xl mx-auto w-full">
              <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Quel est ton grand rêve ?" className="text-[28px] font-bold bg-transparent text-white focus:outline-none border-b border-white/10 pb-4 placeholder:text-white/10" autoFocus />
              <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Décris ta vision ici..." rows={4} className="text-[16px] bg-black/20 text-white rounded-2xl p-6 focus:outline-none resize-none border border-white/5" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    <label className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em]">Horizon Temporel</label>
                    <div className="flex gap-2">
                       {HORIZONS.map(h => (
                         <button key={h.id} type="button" onClick={() => setFormHorizon(h.id)} className={`flex-1 px-4 py-3 rounded-xl text-[12px] font-bold transition-all border ${formHorizon === h.id ? "text-white border-transparent" : "text-[var(--text-secondary)] border-white/5"}`} style={{ background: formHorizon === h.id ? h.color : "transparent" }}>{h.label}</button>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em]">Inspiration Visuelle</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                       {INSPIRATIONAL_IMAGES.map((url, i) => (
                         <button key={i} type="button" onClick={() => setFormImageUrl(url)} className={`w-16 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${formImageUrl === url ? "border-white scale-110" : "border-transparent opacity-40 hover:opacity-100"}`}><img src={url} className="w-full h-full object-cover" /></button>
                       ))}
                    </div>
                 </div>
              </div>
              <div className="flex gap-4 justify-end border-t border-white/5 pt-8">
                 <button type="button" onClick={() => setAdding(false)} className="px-8 py-3 text-[14px] font-bold text-[var(--text-secondary)] hover:text-white transition-colors">Annuler</button>
                 <button type="submit" className="px-10 py-3.5 rounded-2xl bg-[var(--accent-purple)] text-white font-bold shadow-lg hover:scale-105 transition-all">Créer l&apos;Objectif</button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Goals Grid — Optimised columns for PC */}
        {groupedGoals.map((group) => (
          <div key={group.id} className="space-y-8">
            <div className="flex items-center gap-4 px-2">
              <div className="w-1.5 h-6 rounded-full" style={{ background: group.color }} />
              <h2 className="text-[18px] font-bold text-white flex items-center gap-2">
                {group.label} <span className="text-[14px] font-medium text-[var(--text-tertiary)] opacity-60">— {group.description}</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
              {group.goals.map((goal) => {
                const isExpanded = expandedId === goal.id;
                const doneSteps = goal.actionSteps.filter(s => s.done).length;
                const totalSteps = goal.actionSteps.length;
                const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

                return (
                  <motion.div key={goal.id} layout className={`rounded-[32px] overflow-hidden bg-[var(--surface-1)] border border-white/5 transition-all ${isExpanded ? "ring-2 ring-white/10 shadow-3xl" : "hover:border-white/10 shadow-xl"}`}>
                    {goal.imageUrl && (
                      <div className="h-64 overflow-hidden relative cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : goal.id)}>
                        <img src={goal.imageUrl} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-1)] via-transparent to-transparent opacity-80" />
                        <div className="absolute bottom-6 left-8 right-8">
                           <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/10 text-white backdrop-blur-md mb-2 inline-block border border-white/10">{CATEGORIES.find(c => c.id === goal.category)?.label}</span>
                           <h3 className="text-[22px] font-bold text-white tracking-tight">{goal.title}</h3>
                        </div>
                      </div>
                    )}
                    <div className="p-8">
                      {!goal.imageUrl && (
                        <div className="mb-6 flex justify-between items-start">
                           <h3 className="text-[20px] font-bold text-white tracking-tight">{goal.title}</h3>
                           <span className="text-[20px]">{CATEGORIES.find(c => c.id === goal.category)?.emoji}</span>
                        </div>
                      )}
                      <div className="space-y-4">
                        <div className="flex justify-between text-[13px] font-bold tabular-nums">
                           <span className="text-[var(--text-secondary)]">Progression</span>
                           <span style={{ color: goal.color }}>{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                           <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} className="h-full rounded-full" style={{ background: goal.color }} />
                        </div>
                      </div>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pt-8 mt-8 border-t border-white/5 space-y-6">
                            <p className="text-[15px] text-white/70 leading-relaxed font-medium italic">&quot;{goal.description}&quot;</p>
                            <div className="space-y-3">
                               <label className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em]">Plan d&apos;action</label>
                               {goal.actionSteps.map(step => (
                                 <div key={step.id} className="flex items-center gap-3 py-1 group">
                                    <button onClick={() => toggleLifeGoalStep(goal.id, step.id)} className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${step.done ? "border-transparent" : "border-white/10 hover:border-white/20"}`} style={{ background: step.done ? goal.color : "transparent" }}>{step.done && <Check size={12} className="text-white" strokeWidth={4} />}</button>
                                    <span className={`text-[14px] font-medium flex-1 transition-all ${step.done ? "text-white/40 line-through" : "text-white"}`}>{step.text}</span>
                                    <button onClick={() => deleteLifeGoalStep(goal.id, step.id)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400"><X size={16} /></button>
                                 </div>
                               ))}
                               <div className="flex items-center gap-3 pt-2">
                                  <div className="w-5 h-5 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center text-white/20"><Plus size={12} /></div>
                                  <input value={stepInput} onChange={(e) => setStepInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddStep(goal.id)} placeholder="Ajouter une étape concrète..." className="flex-1 bg-transparent border-none text-[14px] font-medium text-white focus:outline-none placeholder:text-white/10" />
                               </div>
                            </div>
                            <div className="flex justify-between items-center pt-4">
                               <button onClick={() => deleteLifeGoal(goal.id)} className="text-[12px] font-bold text-red-500/50 hover:text-red-500 transition-colors flex items-center gap-2"><Trash2 size={14} /> Supprimer de ma vision</button>
                               <button onClick={() => setExpandedId(null)} className="text-[12px] font-bold text-white/40 hover:text-white transition-colors">Réduire</button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {!isExpanded && (
                        <button onClick={() => setExpandedId(goal.id)} className="w-full mt-6 py-3 rounded-xl border border-white/5 text-[12px] font-bold text-white/40 hover:text-white hover:bg-white/5 transition-all">Détails de la vision</button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}