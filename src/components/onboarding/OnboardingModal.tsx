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
  hidden:  { opacity: 0, scale: 0.92, y: 24 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 26 } },
  exit:    { opacity: 0, scale: 0.92, y: 24, transition: { duration: 0.2, ease: "easeIn" as const } },
};

const stepVariants = {
  enter:  (dir: number) => ({ opacity: 0, x: dir > 0 ? 50 : -50, scale: 0.96 }),
  center: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.35, ease: "easeOut" as const } },
  exit:   (dir: number) => ({ opacity: 0, x: dir > 0 ? -50 : 50, scale: 0.96, transition: { duration: 0.2, ease: "easeIn" as const } }),
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
        style={{ background: "rgba(10,10,12,0.8)", backdropFilter: "blur(12px)" }}
        onClick={handleSkip}
      >
        <motion.div
          key="modal"
          variants={modalVariants}
          initial="hidden" animate="visible" exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg mx-4 rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #2a2a31, #222228)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {/* Top accent glow */}
          <motion.div
            key={`glow-${stepIndex}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
            className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
            style={{
              background: `linear-gradient(to right, transparent, ${step.accent}, transparent)`,
              boxShadow: `0 0 24px ${step.accent}50`,
            }}
          />
          <motion.div
            key={`glow-bg-${stepIndex}`}
            initial={{ opacity: 0 }} animate={{ opacity: 0.12 }} transition={{ duration: 0.6 }}
            className="pointer-events-none absolute inset-x-0 top-0 h-48 rounded-3xl"
            style={{ background: `radial-gradient(ellipse at 50% 0%, ${step.accent}, transparent 70%)` }}
          />

          <div className="relative z-10 px-8 pt-10 pb-8 flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={13} style={{ color: "#6b6b76" }} />
                <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: "#6b6b76" }}>Guide de Survie</span>
              </div>
              <button onClick={handleSkip} className="text-[11px] px-3 py-1 rounded-lg btn-3d" style={{ color: "#6b6b76" }}>
                Passer
              </button>
            </div>

            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={stepIndex}
                custom={direction}
                variants={stepVariants}
                initial="enter" animate="center" exit="exit"
                className="flex flex-col gap-6"
              >
                {/* Icon — 3D */}
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 3 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${step.accent}25, ${step.accent}0a)`,
                    border: `1px solid ${step.accent}30`,
                    boxShadow: `0 4px 16px ${step.accent}15, 0 8px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.08)`,
                  }}
                >
                  <Icon size={28} style={{ color: step.accent }} strokeWidth={1.75} />
                </motion.div>

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: step.accent }}>
                    {step.tag}
                  </span>
                  <h2 className="text-[24px] font-black leading-tight tracking-tight" style={{ color: "#ececef" }}>{step.title}</h2>
                  <p className="text-[15px] font-medium" style={{ color: "#9d9da7" }}>{step.subtitle}</p>
                </div>

                <p className="text-[13px] leading-relaxed" style={{ color: "#6b6b76" }}>{step.body}</p>

                {/* Hint — 3D pill */}
                <div className="inline-flex self-start items-center gap-2.5 px-4 py-2 rounded-xl glass-pill">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: step.accent, boxShadow: `0 0 8px ${step.accent}60` }} />
                  <span className="text-[11px] italic" style={{ color: "#9d9da7" }}>{step.hint}</span>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2 items-center">
                {STEPS.map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => handleDotClick(i)}
                    animate={{
                      width: i === stepIndex ? 24 : 8,
                      height: 8,
                      backgroundColor: i === stepIndex ? step.accent : "#36363f",
                      boxShadow: i === stepIndex ? `0 0 10px ${step.accent}50` : "none",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 24 }}
                    className="rounded-full"
                    aria-label={`Étape ${i + 1}`}
                  />
                ))}
              </div>

              <motion.button
                onClick={handleNext}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-bold"
                style={{
                  background: `linear-gradient(135deg, ${step.accent}, ${step.accent}cc)`,
                  color: "#1c1c21",
                  boxShadow: `0 4px 16px ${step.accent}35, 0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)`,
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
