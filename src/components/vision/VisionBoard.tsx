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
  { id: "court_terme", label: "Court terme", icon: Clock, color: "#4ade80", description: "3-6 mois" },
  { id: "moyen_terme", label: "Moyen terme", icon: Target, color: "#67e8f9", description: "1-3 ans" },
  { id: "long_terme", label: "Long terme", icon: Rocket, color: "#a78bfa", description: "5-10 ans" },
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
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1470770841497-7e2830aef084?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=400&h=300&fit=crop",
];

export default function VisionBoard() {
  const {
    lifeGoals, addLifeGoal, updateLifeGoal, deleteLifeGoal,
    toggleLifeGoalStep, addLifeGoalStep, deleteLifeGoalStep,
  } = useAppStore();

  const [adding, setAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeHorizon, setActiveHorizon] = useState<LifeGoalHorizon | "all">("all");

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formHorizon, setFormHorizon] = useState<LifeGoalHorizon>("court_terme");
  const [formCategory, setFormCategory] = useState("carriere");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [stepInput, setStepInput] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    addLifeGoal({
      title: formTitle.trim(),
      description: formDesc.trim(),
      horizon: formHorizon,
      category: formCategory,
      imageUrl: formImageUrl || undefined,
      actionSteps: [],
      color: HORIZONS.find(h => h.id === formHorizon)?.color || "#4ade80",
    });
    setFormTitle("");
    setFormDesc("");
    setFormImageUrl("");
    setAdding(false);
  };

  const handleAddStep = (goalId: string) => {
    if (!stepInput.trim()) return;
    addLifeGoalStep(goalId, stepInput.trim());
    setStepInput("");
  };

  const filteredGoals = activeHorizon === "all"
    ? lifeGoals
    : lifeGoals.filter((g) => g.horizon === activeHorizon);

  const groupedGoals = HORIZONS.map(h => ({
    ...h,
    goals: filteredGoals.filter(g => g.horizon === h.id),
  })).filter(g => activeHorizon === "all" ? g.goals.length > 0 : true);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-7 pt-6 pb-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div>
          <h1 className="text-lg font-semibold text-zinc-100 tracking-tight flex items-center gap-2.5">
            <Eye size={18} className="text-zinc-400" /> Vision Board
          </h1>
          <p className="text-xs text-zinc-600 mt-1">Tes objectifs de vie · Visualise ton futur</p>
        </div>
        <button onClick={() => setAdding(!adding)} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#d4d4d8" }}
        ><Plus size={13} /> Nouvel objectif</button>
      </div>

      {/* Horizon filter */}
      <div className="shrink-0 px-7 py-3 flex gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
        <button
          onClick={() => setActiveHorizon("all")}
          className="text-[11px] px-3 py-1.5 rounded-xl font-medium transition-all"
          style={{
            background: activeHorizon === "all" ? "rgba(255,255,255,0.08)" : "transparent",
            color: activeHorizon === "all" ? "#e4e4e7" : "#52525b",
            border: `1px solid ${activeHorizon === "all" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
          }}
        >Tout</button>
        {HORIZONS.map((h) => (
          <button
            key={h.id}
            onClick={() => setActiveHorizon(h.id)}
            className="text-[11px] px-3 py-1.5 rounded-xl font-medium transition-all"
            style={{
              background: activeHorizon === h.id ? `${h.color}12` : "transparent",
              color: activeHorizon === h.id ? h.color : "#52525b",
              border: `1px solid ${activeHorizon === h.id ? h.color + "30" : "rgba(255,255,255,0.04)"}`,
            }}
          >{h.label}</button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 flex flex-col gap-6">

        {/* Add Goal Form */}
        <AnimatePresence>
          {adding && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAdd}
              className="rounded-2xl p-5 flex flex-col gap-4"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Mon objectif de vie…"
                className="text-base bg-transparent text-zinc-200 placeholder:text-zinc-600 focus:outline-none border-b pb-2"
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
                autoFocus
              />

              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Décris en détail ce que tu veux accomplir, pourquoi c'est important pour toi…"
                rows={3}
                className="text-sm bg-transparent text-zinc-300 placeholder:text-zinc-700 rounded-xl p-3 focus:outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
              />

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Horizon</label>
                <div className="flex gap-2">
                  {HORIZONS.map((h) => (
                    <button
                      key={h.id} type="button"
                      onClick={() => setFormHorizon(h.id)}
                      className="text-[11px] px-3 py-1.5 rounded-xl font-medium transition-all flex-1 text-center"
                      style={{
                        background: formHorizon === h.id ? `${h.color}12` : "rgba(255,255,255,0.02)",
                        color: formHorizon === h.id ? h.color : "#52525b",
                        border: `1px solid ${formHorizon === h.id ? h.color + "30" : "rgba(255,255,255,0.04)"}`,
                      }}
                    >{h.label} ({h.description})</button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Catégorie</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id} type="button"
                      onClick={() => setFormCategory(c.id)}
                      className="text-[11px] px-2.5 py-1 rounded-lg transition-all"
                      style={{
                        background: formCategory === c.id ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                        color: formCategory === c.id ? "#e4e4e7" : "#71717a",
                        border: `1px solid ${formCategory === c.id ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}`,
                      }}
                    >{c.emoji} {c.label}</button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Image size={10} /> Image d&apos;inspiration (URL)
                </label>
                <input
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/…"
                  className="text-sm bg-transparent text-zinc-400 placeholder:text-zinc-700 focus:outline-none border-b pb-1"
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}
                />
                <div className="flex gap-2 flex-wrap">
                  {INSPIRATIONAL_IMAGES.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormImageUrl(url)}
                      className="w-14 h-10 rounded-lg overflow-hidden transition-all"
                      style={{
                        border: formImageUrl === url ? "2px solid rgba(255,255,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
                        opacity: formImageUrl === url ? 1 : 0.5,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setAdding(false)} className="text-xs text-zinc-600 hover:text-zinc-400 px-3 py-1.5">Annuler</button>
                <button type="submit" className="text-xs px-4 py-2 rounded-xl font-medium" style={{ background: "rgba(255,255,255,0.08)", color: "#e4e4e7" }}>Créer l&apos;objectif</button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Goals grouped by horizon */}
        {groupedGoals.map((group) => (
          <div key={group.id} className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <group.icon size={13} style={{ color: group.color }} />
              <p className="text-[11px] font-medium uppercase tracking-widest" style={{ color: group.color }}>
                {group.label}
              </p>
              <span className="text-[10px] text-zinc-700 ml-1">{group.description}</span>
            </div>

            {group.goals.length === 0 && (
              <p className="text-[11px] text-zinc-700 px-2 py-4">Aucun objectif pour cet horizon. Ajoutes-en un !</p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {group.goals.map((goal) => {
                const isExpanded = expandedId === goal.id;
                const cat = CATEGORIES.find(c => c.id === goal.category);
                const doneSteps = goal.actionSteps.filter(s => s.done).length;
                const totalSteps = goal.actionSteps.length;

                return (
                  <motion.div
                    key={goal.id}
                    layout
                    className="rounded-2xl overflow-hidden transition-all"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: `1px solid ${isExpanded ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`,
                    }}
                  >
                    {/* Image */}
                    {goal.imageUrl && (
                      <div className="h-32 overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={goal.imageUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,10,0.8) 0%, transparent 60%)" }} />
                        <div className="absolute bottom-3 left-4 right-4">
                          <p className="text-sm font-semibold text-white">{goal.title}</p>
                        </div>
                      </div>
                    )}

                    <div
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : goal.id)}
                    >
                      {!goal.imageUrl && (
                        <div className="flex items-center gap-2 mb-1">
                          <Star size={12} style={{ color: goal.color }} />
                          <p className="text-sm font-medium text-zinc-200">{goal.title}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-zinc-600">
                        {cat && <span>{cat.emoji} {cat.label}</span>}
                        {totalSteps > 0 && <span>· {doneSteps}/{totalSteps} étapes</span>}
                      </div>
                      {goal.description && !isExpanded && (
                        <p className="text-[11px] text-zinc-500 mt-2 line-clamp-2">{goal.description}</p>
                      )}
                      {totalSteps > 0 && (
                        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${totalSteps > 0 ? (doneSteps / totalSteps) * 100 : 0}%`, background: goal.color }} />
                        </div>
                      )}
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 flex flex-col gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                            {/* Full description */}
                            {goal.description && (
                              <p className="text-[12px] text-zinc-400 mt-2 leading-relaxed whitespace-pre-wrap">{goal.description}</p>
                            )}

                            {/* Action Plan */}
                            <div className="flex flex-col gap-2 mt-1">
                              <div className="flex items-center gap-1.5">
                                <Heart size={10} className="text-zinc-600" />
                                <label className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Plan d&apos;action</label>
                              </div>

                              {goal.actionSteps.map((step) => (
                                <div key={step.id} className="flex items-center gap-2 group/step px-1">
                                  <button
                                    onClick={() => toggleLifeGoalStep(goal.id, step.id)}
                                    className="shrink-0 w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-colors"
                                    style={{ borderColor: step.done ? `${goal.color}60` : "rgba(255,255,255,0.08)", background: step.done ? `${goal.color}15` : "transparent" }}
                                  >
                                    {step.done && <Check size={7} style={{ color: goal.color }} strokeWidth={3} />}
                                  </button>
                                  <span className="flex-1 text-[11px]" style={{ color: step.done ? "#3f3f46" : "#a1a1aa", textDecoration: step.done ? "line-through" : "none" }}>{step.text}</span>
                                  <button onClick={() => deleteLifeGoalStep(goal.id, step.id)} className="opacity-0 group-hover/step:opacity-100 text-zinc-700 hover:text-zinc-400">
                                    <X size={9} />
                                  </button>
                                </div>
                              ))}

                              <div className="flex items-center gap-2">
                                <Plus size={10} className="text-zinc-700 shrink-0" />
                                <input
                                  value={expandedId === goal.id ? stepInput : ""}
                                  onChange={(e) => setStepInput(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddStep(goal.id); } }}
                                  placeholder="Ajouter une étape…"
                                  className="flex-1 text-[11px] bg-transparent text-zinc-500 placeholder:text-zinc-700 focus:outline-none py-0.5"
                                />
                              </div>
                            </div>

                            {/* Image URL edit */}
                            <div className="flex items-center gap-2 mt-1">
                              <Image size={10} className="text-zinc-700" />
                              <input
                                value={goal.imageUrl || ""}
                                onChange={(e) => updateLifeGoal(goal.id, { imageUrl: e.target.value || undefined })}
                                placeholder="URL image d'inspiration"
                                className="flex-1 text-[10px] bg-transparent text-zinc-500 placeholder:text-zinc-700 focus:outline-none"
                              />
                            </div>

                            <button
                              onClick={() => deleteLifeGoal(goal.id)}
                              className="flex items-center gap-1.5 text-[10px] text-zinc-700 hover:text-red-300 transition-colors self-end mt-1"
                            >
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
          </div>
        ))}

        {lifeGoals.length === 0 && !adding && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Eye size={22} className="text-zinc-600" />
            </div>
            <div className="text-center">
              <p className="text-sm text-zinc-400">Ton Vision Board est vide</p>
              <p className="text-xs text-zinc-600 mt-1">Commence à écrire tes objectifs de vie pour te projeter et te motiver.</p>
            </div>
            <button onClick={() => setAdding(true)} className="text-xs px-4 py-2 rounded-xl font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.06)", color: "#d4d4d8", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Plus size={12} className="inline mr-1" /> Créer mon premier objectif
            </button>
          </div>
        )}
      </div>
    </div>
  );
}