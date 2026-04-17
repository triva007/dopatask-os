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
      color: HORIZONS.find(h => h.id === formHorizon)?.color || "var(--accent-green)",
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
      <div className="shrink-0 px-7 pt-6 pb-4 flex items-center justify-between border border-b-primary">
        <div>
          <h1 className="text-2xl font-semibold text-t-primary tracking-tight flex items-center gap-2.5">
            <Eye size={18} className="text-t-secondary" /> Vision Board
          </h1>
          <p className="text-xs text-t-secondary mt-1">Tes objectifs de vie · Visualise ton futur</p>
        </div>
        <button onClick={() => setAdding(!adding)} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all bg-surface border border-b-primary text-t-primary"
        ><Plus size={13} /> Nouvel objectif</button>
      </div>

      {/* Horizon filter */}
      <div className="shrink-0 px-7 py-3 flex gap-2 border border-b-primary" style={{ borderBottom: "1px solid var(--border-primary)" }}>
        <button
          onClick={() => setActiveHorizon("all")}
          className="text-[11px] px-3 py-1.5 rounded-xl font-medium transition-all"
          style={{
            background: activeHorizon === "all" ? "var(--accent-blue-light)" : "var(--surface)",
            color: activeHorizon === "all" ? "var(--accent-blue)" : "var(--text-primary)",
            border: `1px solid ${activeHorizon === "all" ? "var(--accent-blue-light)" : "var(--border-primary)"}`,
          }}
        >Tout</button>
        {HORIZONS.map((h) => (
          <button
            key={h.id}
            onClick={() => setActiveHorizon(h.id)}
            className="text-[11px] px-3 py-1.5 rounded-xl font-medium transition-all"
            style={{
              background: activeHorizon === h.id ? `${h.color}12` : "var(--surface)",
              color: activeHorizon === h.id ? h.color : "var(--text-primary)",
              border: `1px solid ${activeHorizon === h.id ? h.color + "30" : "var(--border-primary)"}`,
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
              className="rounded-3xl p-6 flex flex-col gap-4 bg-surface border border-b-primary"
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
            >
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Mon objectif de vie…"
                className="text-base bg-transparent text-t-primary placeholder:text-t-tertiary focus:outline-none border-b border-b-primary pb-2"
                autoFocus
              />

              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Décris en détail ce que tu veux accomplir, pourquoi c'est important pour toi…"
                rows={3}
                className="text-sm bg-transparent text-t-primary placeholder:text-t-tertiary rounded-xl p-3 focus:outline-none resize-none bg-empty-bg border border-b-primary"
              />

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-medium text-t-secondary uppercase tracking-widest">Horizon</label>
                <div className="flex gap-2">
                  {HORIZONS.map((h) => (
                    <button
                      key={h.id} type="button"
                      onClick={() => setFormHorizon(h.id)}
                      className="text-[11px] px-3 py-1.5 rounded-xl font-medium transition-all flex-1 text-center"
                      style={{
                        background: formHorizon === h.id ? `${h.color}12` : "var(--surface)",
                        color: formHorizon === h.id ? h.color : "var(--text-primary)",
                        border: `1px solid ${formHorizon === h.id ? h.color + "30" : "var(--border-primary)"}`,
                      }}
                    >{h.label} ({h.description})</button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-medium text-t-secondary uppercase tracking-widest">Catégorie</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id} type="button"
                      onClick={() => setFormCategory(c.id)}
                      className="text-[11px] px-2.5 py-1 rounded-lg transition-all"
                      style={{
                        background: formCategory === c.id ? "var(--accent-blue-light)" : "var(--surface)",
                        color: formCategory === c.id ? "var(--accent-blue)" : "var(--text-primary)",
                        border: `1px solid ${formCategory === c.id ? "var(--accent-blue-light)" : "var(--border-primary)"}`,
                      }}
                    >{c.emoji} {c.label}</button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-medium text-t-secondary uppercase tracking-widest flex items-center gap-1.5">
                  <Image size={10} /> Image d&apos;inspiration (URL)
                </label>
                <input
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/…"
                  className="text-sm bg-transparent text-t-primary placeholder:text-t-tertiary focus:outline-none border-b border-b-primary pb-1"
                />
                <div className="flex gap-2 flex-wrap">
                  {INSPIRATIONAL_IMAGES.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormImageUrl(url)}
                      className="w-14 h-10 rounded-lg overflow-hidden transition-all"
                      style={{
                        border: formImageUrl === url ? "2px solid var(--accent-blue)" : "1px solid var(--border-primary)",
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
                <button type="button" onClick={() => setAdding(false)} className="text-xs text-t-secondary hover:text-t-primary px-3 py-1.5">Annuler</button>
                <button type="submit" className="text-xs px-4 py-2 rounded-xl font-medium bg-accent-blue text-white">Créer l&apos;objectif</button>
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
              <span className="text-[10px] text-t-secondary ml-1">{group.description}</span>
            </div>

            {group.goals.length === 0 && (
              <p className="text-[11px] text-t-secondary px-2 py-4">Aucun objectif pour cet horizon. Ajoutes-en un !</p>
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
                    className="rounded-3xl overflow-hidden transition-all bg-surface border border-b-primary"
                    style={{
                      boxShadow: isExpanded ? "0 4px 12px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.08)",
                    }}
                  >
                    {/* Image */}
                    {goal.imageUrl && (
                      <div className="h-32 overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={goal.imageUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(255,255,255,0.7) 0%, transparent 60%)" }} />
                        <div className="absolute bottom-3 left-4 right-4">
                          <p className="text-sm font-semibold text-t-primary">{goal.title}</p>
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
                          <p className="text-sm font-medium text-t-primary">{goal.title}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-t-secondary">
                        {cat && <span>{cat.emoji} {cat.label}</span>}
                        {totalSteps > 0 && <span>· {doneSteps}/{totalSteps} étapes</span>}
                      </div>
                      {goal.description && !isExpanded && (
                        <p className="text-[11px] text-t-secondary mt-2 line-clamp-2">{goal.description}</p>
                      )}
                      {totalSteps > 0 && (
                        <div className="mt-2 h-1 rounded-full overflow-hidden bg-b-primary">
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
                          <div className="px-4 pb-4 flex flex-col gap-3" style={{ borderTop: "1px solid var(--border-primary)" }}>
                            {/* Full description */}
                            {goal.description && (
                              <p className="text-[12px] text-t-primary mt-2 leading-relaxed whitespace-pre-wrap">{goal.description}</p>
                            )}

                            {/* Action Plan */}
                            <div className="flex flex-col gap-2 mt-1">
                              <div className="flex items-center gap-1.5">
                                <Heart size={10} className="text-t-secondary" />
                                <label className="text-[10px] font-medium text-t-secondary uppercase tracking-widest">Plan d&apos;action</label>
                              </div>

                              {goal.actionSteps.map((step) => (
                                <div key={step.id} className="flex items-center gap-2 group/step px-1">
                                  <button
                                    onClick={() => toggleLifeGoalStep(goal.id, step.id)}
                                    className="shrink-0 w-3.5 h-3.5 rounded-md border flex items-center justify-center transition-colors"
                                    style={{ borderColor: step.done ? `${goal.color}60` : "var(--border-hover)", background: step.done ? `${goal.color}15` : "transparent" }}
                                  >
                                    {step.done && <Check size={7} style={{ color: goal.color }} strokeWidth={3} />}
                                  </button>
                                  <span className="flex-1 text-[11px]" style={{ color: step.done ? "var(--accent-green)" : "var(--text-secondary)", textDecoration: step.done ? "line-through" : "none" }}>{step.text}</span>
                                  <button onClick={() => deleteLifeGoalStep(goal.id, step.id)} className="opacity-0 group-hover/step:opacity-100 text-t-secondary hover:text-accent-red">
                                    <X size={9} />
                                  </button>
                                </div>
                              ))}

                              <div className="flex items-center gap-2">
                                <Plus size={10} className="text-t-secondary shrink-0" />
                                <input
                                  value={expandedId === goal.id ? stepInput : ""}
                                  onChange={(e) => setStepInput(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddStep(goal.id); } }}
                                  placeholder="Ajouter une étape…"
                                  className="flex-1 text-[11px] bg-transparent text-t-primary placeholder:text-t-tertiary focus:outline-none py-0.5"
                                />
                              </div>
                            </div>

                            {/* Image URL edit */}
                            <div className="flex items-center gap-2 mt-1">
                              <Image size={10} className="text-t-secondary" />
                              <input
                                value={goal.imageUrl || ""}
                                onChange={(e) => updateLifeGoal(goal.id, { imageUrl: e.target.value || undefined })}
                                placeholder="URL image d'inspiration"
                                className="flex-1 text-[10px] bg-transparent text-t-primary placeholder:text-t-tertiary focus:outline-none"
                              />
                            </div>

                            <button
                              onClick={() => deleteLifeGoal(goal.id)}
                              className="flex items-center gap-1.5 text-[10px] text-t-secondary hover:text-accent-red transition-colors self-end mt-1"
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
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-empty-bg border border-b-primary">
              <Eye size={22} className="text-t-secondary" />
            </div>
            <div className="text-center">
              <p className="text-sm text-t-primary">Ton Vision Board est vide</p>
              <p className="text-xs text-t-secondary mt-1">Commence à écrire tes objectifs de vie pour te projeter et te motiver.</p>
            </div>
            <button onClick={() => setAdding(true)} className="text-xs px-4 py-2 rounded-xl font-medium transition-all bg-surface text-t-primary border border-b-primary">
              <Plus size={12} className="inline mr-1" /> Créer mon premier objectif
            </button>
          </div>
        )}
      </div>
    </div>
  );
}