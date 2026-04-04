"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, ListTodo, Swords, Search, ArrowRight, Sparkles } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const STEPS = [
  {
    icon: Keyboard,
    accent: "var(--accent-blue)",
    tag: "Loi n°1 — Friction Zéro",
    title: "Ton cerveau va trop vite ?",
    subtitle: "Vide tes idées instantanément.",
    body: "Appuie sur Ctrl+Shift+I n'importe quand pour capturer une pensée directement dans l'Inbox — sans quitter ce que tu fais. Pas de tri, pas de stress.",
    hint: "Capture. Ne pense pas. Passe à la suite.",
  },
  {
    icon: ListTodo,
    accent: "var(--accent-green)",
    tag: "Loi n°2 — Isolation Visuelle",
    title: "Stop à la paralysie.",
    subtitle: "3 tâches max pour aujourd'hui.",
    body: "Trop de tâches = cerveau qui freeze. DopaTask t'oblige à choisir seulement 3 à 5 priorités. Le reste attend dans l'Inbox.",
    hint: "Moins tu vois, plus tu agis.",
  },
  {
    icon: Swords,
    accent: "var(--accent-purple)",
    tag: "Loi n°3 — Dopamine & Challenge",
    title: "Blesse le Boss Procrastination.",
    subtitle: "Gagne de l'XP à chaque action.",
    body: "Chaque tâche terminée inflige des dégâts au Boss. 15% de chance de déclencher un Coup Critique. Ta dopamine dit merci.",
    hint: "Tu joues. Tu gagnes. Tu avances.",
  },
  {
    icon: Search,
    accent: "var(--accent-orange)",
    tag: "Loi n°4 — Tout Retrouver",
    title: "Recherche Spotlight.",
    subtitle: "Ctrl+Shift+Q pour tout chercher.",
    body: "Tâches, projets, objectifs, journal, inbox — tu tapes un mot et tout ce qui est lié apparaît. Plus jamais rien de perdu.",
    hint: "Cherche. Trouve. Agis.",
  },
] as const;

const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};

const modalVariants = {
  hidden:  { opacity: 0, scale: 0.96, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 320, damping: 28 } },
  exit:    { opacity: 0, scale: 0.96, y: 16, transition: { duration: 0.2, ease: "easeIn" as const } },
};

const stepVariants = {
  enter:  (dir: number) => ({ opacity: 0, x: dir > 0 ? 32 : -32 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.28, ease: "easeOut" as const } },
  exit:   (dir: number) => ({ opacity: 0, x: dir > 0 ? -32 : 32, transition: { duration: 0.2, ease: "easeIn" as const } }),
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
        className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
        style={{ backgroundColor: "var(--backdrop-bg)" }}
        onClick={handleSkip}
      >
        <motion.div
          key="modal"
          variants={modalVariants}
          initial="hidden" animate="visible" exit="exit"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg mx-4 rounded-3xl border-b-primary bg-surface shadow-2xl overflow-hidden"
        >
          <motion.div
            key={`glow-${stepIndex}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(to right, transparent, ${step.accent}, transparent)` }}
          />
          <motion.div
            key={`glow-bg-${stepIndex}`}
            initial={{ opacity: 0 }} animate={{ opacity: 0.04 }} transition={{ duration: 0.5 }}
            className="pointer-events-none absolute inset-x-0 top-0 h-40 rounded-3xl"
            style={{ background: `radial-gradient(ellipse at 50% 0%, ${step.accent}, transparent 70%)` }}
          />

          <div className="relative z-10 px-8 pt-10 pb-8 flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-t-secondary" />
                <span className="text-xs font-medium text-t-secondary tracking-widest uppercase">Guide de Survie</span>
              </div>
              <button onClick={handleSkip} className="text-xs text-t-secondary hover:text-t-primary transition-colors">
                Passer →
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
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${step.accent}12`, border: `1px solid ${step.accent}20` }}
                >
                  <Icon size={26} style={{ color: step.accent }} strokeWidth={1.75} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: step.accent }}>
                    {step.tag}
                  </span>
                  <h2 className="text-2xl font-bold text-t-primary leading-tight tracking-tight">{step.title}</h2>
                  <p className="text-base font-medium text-t-secondary">{step.subtitle}</p>
                </div>

                <p className="text-sm text-t-secondary leading-relaxed">{step.body}</p>

                <div className="inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-full border-b-primary bg-empty-bg">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: step.accent }} />
                  <span className="text-xs text-t-secondary italic">{step.hint}</span>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2 items-center">
                {STEPS.map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => handleDotClick(i)}
                    animate={{ width: i === stepIndex ? 20 : 6, backgroundColor: i === stepIndex ? step.accent : "var(--border-b-hover)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 24 }}
                    className="h-1.5 rounded-full"
                    aria-label={`Étape ${i + 1}`}
                  />
                ))}
              </div>

              <motion.button
                onClick={handleNext}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white"
                style={{ backgroundColor: step.accent }}
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