// src/lib/dopamineFeedback.ts
// Feedback dopaminergique : confetti visuel + sons synthétisés via Web Audio API.
// Aucune dépendance MP3, 100 % client-side. Safe à appeler depuis le store.

import confetti from "canvas-confetti";

export type FeedbackType =
  | "task-complete"   // petit pop joyeux
  | "critical"        // gros combo (1 tâche sur ~7)
  | "lucky-drop"      // jackpot rare
  | "achievement"     // trophée débloqué
  | "level-up"        // montée de niveau
  | "purchase";       // achat boutique

// ─── Audio ───────────────────────────────────────────────────────────────────

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
  if (!AC) return null;
  audioCtx = new AC();
  return audioCtx;
}

function beep(freq: number, duration: number, delay = 0, type: OscillatorType = "sine", gain = 0.08) {
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration);
}

function playSound(type: FeedbackType) {
  if (typeof window === "undefined") return;
  // Respect le goût de l'utilisateur : on peut désactiver les sons via localStorage
  if (localStorage.getItem("dopatask:sounds") === "off") return;

  switch (type) {
    case "task-complete":
      // petit "pop" montant
      beep(660, 0.08, 0, "sine", 0.08);
      beep(880, 0.12, 0.06, "sine", 0.07);
      break;
    case "critical":
      // 3 notes crescendo
      beep(523, 0.1, 0, "triangle", 0.1);
      beep(659, 0.1, 0.08, "triangle", 0.1);
      beep(784, 0.16, 0.16, "triangle", 0.12);
      break;
    case "lucky-drop":
      // arpège doré
      beep(523, 0.08, 0, "sine", 0.1);
      beep(659, 0.08, 0.05, "sine", 0.1);
      beep(784, 0.08, 0.1, "sine", 0.1);
      beep(1047, 0.2, 0.15, "sine", 0.12);
      beep(1319, 0.25, 0.22, "triangle", 0.1);
      break;
    case "achievement":
      // fanfare courte
      beep(523, 0.12, 0, "square", 0.06);
      beep(659, 0.12, 0.1, "square", 0.06);
      beep(784, 0.18, 0.2, "square", 0.06);
      beep(1047, 0.25, 0.3, "triangle", 0.08);
      break;
    case "level-up":
      // grosse fanfare héroïque
      beep(392, 0.15, 0, "sawtooth", 0.05);
      beep(523, 0.15, 0.12, "sawtooth", 0.06);
      beep(659, 0.15, 0.24, "sawtooth", 0.07);
      beep(784, 0.15, 0.36, "sawtooth", 0.08);
      beep(1047, 0.35, 0.48, "triangle", 0.1);
      break;
    case "purchase":
      // ding courte
      beep(880, 0.12, 0, "sine", 0.08);
      beep(1318, 0.16, 0.06, "sine", 0.08);
      break;
  }
}

// ─── Visuel ──────────────────────────────────────────────────────────────────

function triggerConfetti(type: FeedbackType) {
  if (typeof window === "undefined") return;

  switch (type) {
    case "task-complete":
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.7 },
        ticks: 80,
        scalar: 0.8,
        colors: ["#22c55e", "#3b82f6", "#f97316"],
      });
      break;
    case "critical":
      confetti({
        particleCount: 90,
        spread: 90,
        origin: { y: 0.6 },
        startVelocity: 45,
        colors: ["#f97316", "#eab308", "#ef4444"],
      });
      break;
    case "lucky-drop":
      // jackpot : 3 salves dorées
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          confetti({
            particleCount: 120,
            spread: 140,
            origin: { y: 0.5 },
            startVelocity: 55,
            colors: ["#fbbf24", "#f59e0b", "#facc15", "#fde047"],
            scalar: 1.1,
          });
        }, i * 200);
      }
      break;
    case "achievement":
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#a855f7", "#8b5cf6", "#ec4899"],
        shapes: ["star", "circle"],
        scalar: 1.1,
      });
      break;
    case "level-up": {
      // double salve côté gauche / droite
      const end = Date.now() + 800;
      const colors = ["#3b82f6", "#8b5cf6", "#f97316", "#22c55e"];
      (function frame() {
        confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors });
        confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
      break;
    }
    case "purchase":
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.65 },
        colors: ["#3b82f6", "#60a5fa", "#93c5fd"],
      });
      break;
  }
}

// ─── API publique ────────────────────────────────────────────────────────────

export function celebrate(type: FeedbackType) {
  triggerConfetti(type);
  playSound(type);
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("dopatask:sounds") !== "off";
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem("dopatask:sounds", enabled ? "on" : "off");
}
