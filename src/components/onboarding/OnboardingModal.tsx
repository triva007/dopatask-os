"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Command, ListTodo, Swords, RefreshCcw, ArrowRight, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const STEPS = [
  {
    icon: Command,
    accent: "#22d3ee",
    tag: "Loi n°1 — Friction Zéro",
    title: "Ton cerveau va trop vite ?",
    subtitle: "Vide tes idées instantanément.",
    body: "Appuie sur Cmd+K n'importe quand pour capturer une pensée en moins de 2 secondes — sans quitter ce que tu fais.",
    hint: "Capture. Ne pense pas. Passe à la suite.",
  },
  {
    icon: ListTodo,
    accent: "#4ade80",
    tag: "Loi n°2 — Isolation Visuelle",
    title: "Stop à la paralysie.",
    subtitle: "3 tâches max pour aujourd'hui.",
    body: "Trop de tâches = cerveau qui freeze. DopaTask t'oblige à choisir seulement 3 à 5 priorités. Le reste attend dans l'Inbox.",
    hint: "Moins tu vois, plus tu agis.",
  },
  {
    icon: Swords,
    accent: "#a78bfa",
    tag: "Loi n°3 — Dopamine & Challenge",
    title: "Blesse le Boss Procrastination.",
    subtitle: "Gagne de l'XP à chaque action.",
    body: "Chaque tâche terminée inflige des dégâts au Boss. 15% de chance de déclencher un Coup Critique. Ta dopamine dit merci.",
    hint: "Tu joues. Tu gagnes. Tu avances.",
  },
  {
    icon: RefreshCcw,
    accent: "#fbbf24",
    tag: "Loi n°4 — Pardon Systémique",
    title: "Ici, on ne culpabilise pas.",
    subtitle: "Utilise le Nouveau Départ.",
    body: "Mauvaise journée ? Le bouton \"Nouveau Départ\" archive tout et remet les compteurs à zéro. Pas de rouge, pas de retard, pas de honte.",
    hint: "Chaque jour est un nouveau run.",
  },
] as const;

const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};

const modalVariants = {
  hidden:  { opacity: 0, scale: 0.94, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
  exit:    { opacity: 0, scale: 0.94, y: 20, transition: { duration: 0.2, ease: "easeIn" as const } },
};

const stepVariants = {
  enter:  (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40, scale: 0.97 }),
  center: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const } },
  exit:   (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40, scale: 0.97, transition: { duration: 0.2, ease: "easeIn" as const } }),
};

export default function OnboardingModal() {
  const { hasSeenTutorial, setHasSeenTutorial } = useAppStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const step   = STEPS[stepIndex];
  const Icon   = step.icon;
  const isLast = stepIndex === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) { setHasSeenTutorial(true); return; }
    setDirection(1);
    setStepIndex((i) => i + 1);
  };

  const handleSkip    = () => setHasSeenTutorial(true);
  const handleDotClick = (index: number) => {
    setDirection(index > stepIndex ? 1 : -1);
    setStepIndex(index);
  };

  if (hasSeenTutorial) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        variants={backdropVariants}
        initial="hidden" animate="visible" exit="exit"
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        onClick={handleSkip}
      >
        <motion.div
          key="modal"
          variants={modalVariants}
          initial="hidden" animate="visible" exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg mx-4 rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(180deg, rgba(20,20,24,0.98), rgba(15,15,18,0.99))",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Top accent line — glowing */}
          <motion.div
            key={`glow-${stepIndex}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background: `linear-gradient(to right, transparent, ${step.accent}, transparent)`,
              boxShadow: `0 0 20px ${step.accent}40`,
            }}
          />
          {/* Radial glow */}
          <motion.div
            key={`glow-bg-${stepIndex}`}
            initial={{ opacity: 0 }} animate={{ opacity: 0.08 }} transition={{ duration: 0.6 }}
            className="pointer-events-none absolute inset-x-0 top-0 h-48 rounded-3xl"
            style={{ background: `radial-gradient(ellipse at 50% 0%, ${step.accent}, transparent 70%)` }}
          />

          <div className="relative z-10 px-8 pt-10 pb-8 flex flex-col gap-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-zinc-500" />
                <span className="text-[11px] font-medium text-zinc-500 tracking-widest uppercase">Guide de Survie</span>
              </div>
              <button onClick={handleSkip} className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.03]">
                Passer
              </button>
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={stepIndex}
                custom={direction}
                variants={stepVariants}
                initial="enter" animate="center" exit="exit"
                className="flex flex-col gap-6"
              >
                {/* Icon — 3D */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${step.accent}20, ${step.accent}08)`,
                    border: `1px solid ${step.accent}25`,
                    boxShadow: `0 4px 16px ${step.accent}10, inset 0 1px 0 rgba(255,255,255,0.06)`,
                  }}
                >
                  <Icon size={26} style={{ color: step.accent }} strokeWidth={1.75} />
                </div>

                {/* Text */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: step.accent }}>
                    {step.tag}
                  </span>
                  <h2 className="text-[22px] font-bold text-zinc-50 leading-tight tracking-tight">{step.title}</h2>
                  <p className="text-[15px] font-medium text-zinc-300">{step.subtitle}</p>
                </div>

                <p className="text-[13px] text-zinc-400 leading-relaxed">{step.body}</p>

                {/* Hint pill — 3D */}
                <div className="inline-flex self-start items-center gap-2 px-3.5 py-2 rounded-xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                    border: "1px solid rgba(255,255,255,0.06)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: step.accent, boxShadow: `0 0 6px ${step.accent}60` }} />
                  <span className="text-[11px] text-zinc-400 italic">{step.hint}</span>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2 items-center">
                {STEPS.map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => handleDotClick(i)}
                    animate={{
                      width: i === stepIndex ? 22 : 6,
                      backgroundColor: i === stepIndex ? step.accent : "#3f3f46",
                      boxShadow: i === stepIndex ? `0 0 8px ${step.accent}40` : "none",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 24 }}
                    className="h-1.5 rounded-full"
                    aria-label={`Étape ${i + 1}`}
                  />
                ))}
              </div>

              <motion.button
                onClick={handleNext}
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${step.accent}, ${step.accent}cc)`,
                  color: "#0a0a0a",
                  boxShadow: `0 4px 16px ${step.accent}30, inset 0 1px 0 rgba(255,255,255,0.15)`,
                }}
              >
                {isLast ? (<>C&apos;est parti <Sparkles size={14} /></>) : (<>Suivant <ArrowRight size={14} /></>)}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
